import _ from "lodash";
import { TxResultResponse } from "@line/lbd-sdk-js";

export class TxResultUtil {
    public static getTokenIdFrom(txResult: TxResultResponse): string {
        const events = _(txResult.logs).flatMap(it => it.events)
        return events.find(it => it.type === "mint_nft").attributes.find(it => it.key === "token_id").value.toString()
    }
}