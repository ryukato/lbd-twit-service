import path from "path";
import express, { Response } from "express";
import session from "express-session";
const MemoryStore = require("memorystore")(session);
// import MemoryStore from "memorystore"(session)
import cors from "cors";
import { v4 as uuid4 } from 'uuid';
import * as dotenv from 'dotenv';
import cryptoRandomString from 'crypto-random-string';
import { User } from "./user";
import { UserRepository } from "./user-repository";
import { TwitRepository } from "./twit-repository";
import { TwitNFTRepository } from "./twit-nft-repository";
import { TwitLikeRepository } from "./twit-like-repository";
import { UserRewardHistoryRepository } from "./user-reward-history-repository";
import { Twit } from "./twit";
import { TwitNFT } from "./twit-nft";
import { TwitLike } from "./twit-like";
import { UserRewardHistory } from './user-reward-history'
import { sdkClient } from "./developers-sdk";
import schedule from "node-schedule";
import _ from "lodash";
import { TxResultUtil } from "./tx-result-util";
import { GenericResponse, MintServiceTokenRequest, TxResultResponse } from "@line/lbd-sdk-js";

import axios from 'axios';
import request from 'request';

class UserSession {
  accessToken: string = '';
  refreshToken: string = '';
  profile: {}
}

declare module 'express-session' {
  interface SessionData {
    user: UserSession;
  }
}

const userRepository = new UserRepository();
const twitRepository = new TwitRepository();
const twitNFTRepository = new TwitNFTRepository();
const twitLikeRepository = new TwitLikeRepository();
const userRewardHistoryRepository = new UserRewardHistoryRepository();

const env = dotenv.config({ path: path.resolve(__dirname, 'sdk.env') }).parsed;
const serviceTokenContractId = env["SERVICE_TOKEN_CONTRACT_ID"];
const itemTokenContractId = env["ITEM_TOKEN_CONTRACT_ID"];
const itemTokenNftType = env["ITEM_TOKEN_NFT_TYPE"];
const ownerAddress = env["OWNER_ADDRESS"];
const ownerSecret = env["OWNER_SECRET"];

//line login variables
const lineChannelId = env["SERVICE_CHANNEL_ID"]
const lineLoginBaseUrl = env["LINE_LOGIN_BASE_URL"]
const lineChannelSecret = env["SERVICE_CHANNEL_SECRET"]
const lineLoginAuthUrl = env["LINE_LOGIN_AUTHORIZE_URL"]
const lineLoginRedirectUrl = env["LINE_LOGIN_REDIRECT_URL"]
const lineLoginTokenUrl = env["LINE_LOGIN_TOKEN_URL"]
const lineLoginProfileUrl = env["LINE_LOGIN_PROFILE_URL"]
const lineLoginAuthType = env["LINE_LOGIN_AUTH_TYPE"]
const lineLoginScope = env["LINE_LOGIN_SCOPE"]

const lineLoginClient = axios.create({
  baseURL: lineLoginBaseUrl
})

const lbdSdkHttpClient = sdkClient.sdkHttpClient({
  host: env["HOST_URL"],
  apiKey: env["SERVICE_API_KEY"],
  apiSecret: env["SERVICE_API_SECRET"]
});

const app = express();
app.use(
  session({
      secret: "secret key",
      saveUninitialized: true,
      store: new MemoryStore({
          checkPeriod: 86400000, // 24 hours (= 24 * 60 * 60 * 1000 ms)
      }),
      cookie: { maxAge: 86400000 },
  })
);
app.use(express.static("public"));
app.use(express.json());
app.use(cors());


// users end-points
app.get("/users", (_, res) => {
  res.send(userRepository.allUsers());
});

app.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  const user = findUserById(userId, res);
  if (user) {
    res.send(user);
  } else {
    res.status(404).send({
      "message": `user(id: ${userId}) not found`
    })
  }
});

app.get("/users/by/line-user-id/:lineUserId", (req, res) => {
  const lineUserId = req.params.lineUserId;
  const user = findUserByLineUserId(lineUserId);
  if (user) {
    res.send(user);
  } else {
    res.status(404).send({
      "message": `user(lineUserId: ${lineUserId}) not found`
    })
  }
});

app.delete("/users/:id", (req, res) => {
  const userId = req.params.id;
  const removed = userRepository.removeById(userId)
  res.send({
    "id": userId,
    "removed": removed
  });
});

app.post("/users", (req, res) => {
  const user = {
    "id": uuid4(),
    "name": req.body.user.name,
    "walletAddress": req.body.user.walletAddress,
    "lineUserId": req.body.user.lineUserId
  }
  console.info("new user", user);
  userRepository.add(user);
  res.status(201).send(user);
});

app.get("/users/:userId/twits", (req, res) => {
  const userId = req.params.userId;
  if (!userRepository.existById(userId)) {
    res.status(404).send({
      "message": `user(id: ${userId}) not found`
    })
  } else {
    res.send(twitRepository.findByOwner(userId));
  }
});

app.get("/users/:userId/twits-nft", (req, res) => {
  const userId = req.params.userId;
  if (!userRepository.existById(userId)) {
    res.status(404).send({
      "message": `user(id: ${userId}) not found`
    })
  } else {
    const twitIds = twitRepository.findByOwner(userId).map(it => it.id);
    res.send(twitNFTRepository.findByTwitIds(twitIds));
  }
});

// create twit end-points
app.post("/users/:userId/twits", async (req, res) => {
  const userId = req.params.userId;
  const user = findUserById(userId, res);
  const message: string = req.body.message;
  if (!message || message.length < 1) {
    res.status(400).send({
      "message": `Invalid twit - can not be empty`
    })
  } else {
    try {
      const twit = newTwit(userId, message);
      const txResponse = await sendTwit(user.walletAddress, twit);
      twitRepository.add(twit);

      createAndSaveTwitNft(twit.id, txResponse.responseData.txHash);
      res.status(201).send(twit);
    } catch (error) {
      console.log(error)
      handleSendTwitError(error, res)
    }
  }
});

app.post("/users/:userId/twits/:twitId/likes", async (req, res) => {
  const userId = req.params.userId;
  const likeBy = req.body.likeBy
  const user = findUserById(userId, res);
  try {
    const twitId = req.params.twitId;
    //for validation against twitId
    findTwitByUserIdAndTwitId(userId, twitId, res);

    const twitLike = new TwitLike(userId, twitId, likeBy);
    twitLikeRepository.save(twitLike);

    const rewardHistory = await sendRewardForLike(user, twitId);
    res.status(201).send(rewardHistory);
  } catch (error) {
    console.log(error)
    handleSendTwitError(error, res)
  }
});

app.get("/users/:userId/twits/likes", async (req, res) => {
  const userId = req.params.userId;
  const user = findUserById(userId, res);
  try {
    const twitLikes = twitLikeRepository.findAllByUserId(user.id)
    res.status(201).send(twitLikes);
  } catch (error) {
    console.log(error)
    handleSendTwitError(error, res)
  }
});

app.get("/users/:userId/rewards-history", async (req, res) => {
  const userId = req.params.userId;
  if (!userRepository.existById(userId)) {
    res.status(404).send({
      "message": `user(id: ${userId}) not found`
    })
  } else {
    const rewardHistories = userRewardHistoryRepository.findAllByUserId(userId)
    res.send(rewardHistories);
  }
});

app.get("/users/:userId/rewards", async (req, res) => {
  const userId = req.params.userId;
  if (!userRepository.existById(userId)) {
    res.status(404).send({
      "message": `user(id: ${userId}) not found`
    })
  } else {
    const user = userRepository.findById(userId);
    const response = await lbdSdkHttpClient.serviceTokenBalanceOfUser(user.lineUserId, serviceTokenContractId);

    res.send({ "reward": response.responseData.amount });
  }
});



app.use(express.static('public'));

/*
LINE Login
*/
app.post("/line-login", async (_, res) => {
  const state = cryptoRandomString({ length: 8 })
  const encodedRedirectUrl = encodeURI(`http://localhost:3030/${lineLoginRedirectUrl}`)
  const url = `${lineLoginAuthUrl}?response_type=code&client_id=${lineChannelId}&redirect_uri=${encodedRedirectUrl}&state=${state}&scope=profile`
  res.redirect(url)
})

// Line login invokes this end-point since this is registered as callback-url
app.get("/login/oauth2/code/", async (req, res) => {
  const authCode = req.query.code
  console.log("authCode", authCode)

  const formData = {
    grant_type: "authorization_code",
    code: authCode,
    redirect_uri: `http://localhost:3030/${lineLoginRedirectUrl}`,
    client_id: lineChannelId,
    client_secret: lineChannelSecret
  }
  request.post(
    `https://api.line.me/oauth2/v2.1/token`,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      form: formData,
    }, async (error, _, body) => {
      if (error) {
        console.error("fail to get access-token", error);
        res.status(500).send({
          "error": "fail to get access-token"
        })
      } else {
        
        const jsonBody = JSON.parse(body)
        const accessToken = jsonBody["access_token"]
        const refreshToken = jsonBody["access_token"]
        const tokenType = jsonBody["token_type"]

        var userProfileResponse = {}
        userProfileResponse = await lineLoginClient.get(
          lineLoginProfileUrl,
          {
            "headers": {
              "Authorization": `${tokenType} ${accessToken}`
            }
          }
        );

        req.session.user = {
          "accessToken": accessToken,
          "refreshToken": refreshToken,
          profile: userProfileResponse["data"]
        }
        // res.send(userProfileResponse);
        res.redirect("http://localhost:3030/user-profile.html");
      }
    }
  );

})

app.get("/session", (req, res) => {
  res.send(req.session.user);
});



async function sendRewardForLike(user: User, twitId: string): Promise<UserRewardHistory> {
  const contractId = env["SERVICE_TOKEN_CONTRACT_ID"];
  const rewardAmount = "10";
  const request = createServiceTokenMintMessage(user.walletAddress, rewardAmount)

  const response = await lbdSdkHttpClient.mintServiceToken(contractId, request);
  const txHash = response.responseData.txHash;
  console.log("sendReward transaction - txHash", txHash);

  const rewardHistory = new UserRewardHistory(user.id, twitId, txHash, rewardAmount, false);
  userRewardHistoryRepository.save(rewardHistory)
  //todo save reward history
  return Promise.resolve(rewardHistory);
}

function createServiceTokenMintMessage(userAddress: string, amount: string): MintServiceTokenRequest {
  return {
    "ownerAddress": ownerAddress,
    "ownerSecret": ownerSecret,
    "toAddress": userAddress,
    "amount": amount
  };
}

function findUserById(userId: string, res: Response): User {
  const user = userRepository.findById(userId);
  if (!user) {
    res.status(404).send({
      "message": `user(id: ${userId}) not found`
    });
  }
  return user;
}

function findUserByLineUserId(lineUserId: string): User {
  return userRepository.findByLineUserId(lineUserId);
}

function findTwitByUserIdAndTwitId(userId: string, twitId: string, res: Response): Twit {
  const twit = twitRepository.findByUserIdAndTwitId(userId, twitId)
  if (!twit) {
    res.status(404).send({
      "message": `twit(id: ${twitId}) not found`
    });
  }
  return twit;
}


// schedule-job for polling to get tx-result, every 5 seconds
const job = schedule.scheduleJob("*/5 * * * * *", function () {
  doConfirmTwitNftTx();
});

async function sendTwit(toAddress: string, twit: Twit) {
  const twitNftMintMessage = createTwitNftMintMessage(toAddress, twit)
  const txResponse = await lbdSdkHttpClient.mintNonFungibleToken(itemTokenContractId, itemTokenNftType, twitNftMintMessage);
  console.log("txResponse", txResponse);
  return txResponse;
}

function createTwitNftMintMessage(toAddress: string, twit: Twit) {
  return {
    "ownerAddress": ownerAddress,
    "ownerSecret": ownerSecret,
    "toAddress": toAddress,
    "name": `Twit`,
    "meta": JSON.stringify(twit)
  }
}

function createAndSaveTwitNft(twitId: string, txHash: string): TwitNFT {
  const twitNFT = newTwitNft(twitId, txHash);
  twitNFTRepository.save(twitNFT);
  console.log("twitNFT", twitNFT);
  return twitNFT;
}

// TODO refactor to async, create async process per not-confirmed twit nft
function doConfirmTwitNftTx() {
  const notConfirmedTwitNfts = twitNFTRepository.findAllNotConfirmed();

  if (notConfirmedTwitNfts.length < 1) {
    // console.log("no not-confirmed twit-nft");
    // do nothing
  } else {
    notConfirmedTwitNfts.forEach(elem => {
      lbdSdkHttpClient.transactionResult(elem.txHash)
        .then(response => {
          // success
          const txResult = response.responseData;

          if (typeof txResult !== "undefined" && isSuccessfulTransaction(txResult)) {
            updateTokenIdOfTwitNft(elem, txResult);
          } else if (typeof txResult !== "undefined" && !isSuccessfulTransaction(txResult)) {
            handleFailedTransaction(txResult)
          } else {
            console.info("Send twit-nft transaction has not confirmed yet");
          }
        }).catch(error => {
          handleError("Failed tx - error", error);
        });
    });
  }
}

function handleFailedTransaction(txResult: TxResultResponse) {
  console.error("Failed transaction, error code", txResult.code);
}

function handleErrorResponse(response: GenericResponse<TxResultResponse>) {
  console.error("Failed response", response);
}

function handleError(message: string, error: Error) {
  console.error(message, error);
}

function isSuccessfulTransaction(txResult: TxResultResponse) {
  return txResult.code === 0;
}

function updateTokenIdOfTwitNft(twitNft: TwitNFT, txResult: TxResultResponse) {
  const tokenId = TxResultUtil.getTokenIdFrom(txResult)
  if (tokenId) {
    console.log(`Found tokenId(${tokenId}) from result of tx(${twitNft.txHash})`);
    const unConfirmedTwitNft = twitNFTRepository.findByTxHash(twitNft.txHash);
    unConfirmedTwitNft.doConfirm(tokenId.toString());
    twitNFTRepository.save(unConfirmedTwitNft);
  } else {
    console.log("Not found tokenId from result", txResult);
  }
}

function newTwit(userId: string, message: string): Twit {
  return new Twit(
    uuid4(),
    message,
    new Date(),
    userId
  )
}

function newTwitNft(twitId: string, txHash: string): TwitNFT {
  return new TwitNFT(
    twitId,
    txHash,
    false,
    null
  );
}

function handleSendTwitError(error: Error, res: Response) {
  console.error("fail to twit", error);
  res.status(500).send({
    "error": error.message
  });
}

app.listen(3030, () => {
  console.log("Server started at the 3030 port");
});
