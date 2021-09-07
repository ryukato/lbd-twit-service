import { UserRewardHistory } from "./user-reward-history";
export class UserRewardHistoryRepository {
  // key: userId, value: Set<UserRewardHistory>
  private userRewardHistories: Map<string, Set<UserRewardHistory>> = new Map();
  public save(rewardHistory: UserRewardHistory) {
    const key = rewardHistory.userId;
    if (this.userRewardHistories.has(key)) {
      this.userRewardHistories.get(key).add(rewardHistory);
    } else {
      const rewardHistories: Set<UserRewardHistory> = new Set()
      rewardHistories.add(rewardHistory);
      this.userRewardHistories.set(key, rewardHistories);
    }
  }

  public findAllByUserId(userId: string): Array<UserRewardHistory> {
    const key = userId;
    if (this.userRewardHistories.has(key)) {
        return [...this.userRewardHistories.get(key)];
    } else {
        return [];
    }
  }
}