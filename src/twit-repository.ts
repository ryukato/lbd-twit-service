import { Twit } from "./twit";
export class TwitRepository {
  // key: userId(owner), value: Set<Twit>
  private twits: Map<string, Set<Twit>> = new Map();

  public add(twit: Twit) {
    const key = twit.owner;
    if (this.twits.has(key)) {
      this.twits.get(key).add(twit);
    } else {
      const twits:Set<Twit> = new Set()
      twits.add(twit);
      this.twits.set(key, twits);
    }
  }

  public findByOwner(ownerId: string): Array<Twit> {
    const key = ownerId;
    if (this.twits.has(key)) {
      return [...this.twits.get(key)];
    } else {
      return [];
    }
  }

  public findByUserIdAndTwitId(userId: string, twitId: string): Twit {
    const key = userId;
    if (this.twits.has(key)) {
      return [...this.twits.get(key)].filter(it => it.id === twitId)[0]
    } else {
      return null;
    }
  }
}
