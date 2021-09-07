export class UserRewardHistory {
    userId: string;
    twitId: string;
    txHash: string;
    rewardAmount: string;
    confirmed: boolean = false;

    constructor(
        userId: string,
        twitId: string,
        txHash: string,
        rewardAmount: string,
        confirmed: boolean = false
    ) {
        this.userId = userId;
        this.twitId = twitId;
        this.txHash = txHash;
        this.rewardAmount = rewardAmount;
        this.confirmed = confirmed;
    }

    public doConfirm() {
        this.confirmed = true;
    }
}