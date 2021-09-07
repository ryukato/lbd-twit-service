/**
 * this is repository to save relationship b/w twit and nft
 * save it and update with tokenId when get tx-result
 */
import { TwitNFT } from "./twit-nft";
export class TwitNFTRepository {
  // key: twit-id, value: TwitTransaction
  private twitNFTs: Map<string, TwitNFT> = new Map();

  public save(twitTransaction: TwitNFT) {
    const key = twitTransaction.twitId;
    this.twitNFTs.set(key, twitTransaction)
  }

  public updateWithTokenId(txHash: string, tokenId: string) {
    const twitNft: TwitNFT = this.findByTxHash(txHash)
    twitNft.doConfirm(tokenId)
    this.twitNFTs.set(twitNft.twitId, twitNft)
  }

  public findByTxHash(txHash: string): TwitNFT {
    const filtered = [...this.twitNFTs.entries()].filter(it => it[1].txHash === txHash).map(it => it[1])
    if (filtered.length > 0) {
      return filtered[0]
    } else {
      return null
    }
  }

  public findAllNotConfirmed(): Array<TwitNFT> {
    return [...this.twitNFTs.entries()].filter(it => !it[1].confirmed).map(it => it[1])
  }

  public findByTwitIds(twitIds: Array<string>): Array<TwitNFT> {
    return [...this.twitNFTs.entries()]
      .filter(twitNFT => twitIds.find(it => it === twitNFT[1].twitId) != null)
      .map(it => it[1])
  }
}
