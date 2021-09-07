export class TwitNFT {
    twitId: string;
    txHash: string;
    confirmed: boolean = false;
    tokenId?: string;

    constructor(
        twitId: string,
        txHash: string,
        confirmed: boolean = false,
        tokenId?: string
    ) {
        this.twitId = twitId;
        this.txHash = txHash;
        this.confirmed = confirmed;
        this.tokenId = tokenId;
    }

    public doConfirm(tokenId: string) {
        this.confirmed = true;
        this.tokenId = tokenId;
    }
    
}
