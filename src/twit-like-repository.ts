import { TwitLike } from "./twit-like";

export class TwitLikeRepository {
    // key: twitId, value: Set<TwitLike>
    private twitLikes: Map<string, Set<TwitLike>> = new Map();
    //for searching key: userId, value: Set<TwitLike>
    private twitLikesByUser: Map<string, Set<TwitLike>> = new Map();

    public save(twitLike: TwitLike) {
        {
            const key = twitLike.twitId;
            if (this.twitLikes.has(key)) {
                this.twitLikes.get(key).add(twitLike);
            } else {
                const twitLikes: Set<TwitLike> = new Set()
                twitLikes.add(twitLike);
                this.twitLikes.set(key, twitLikes);
            }
        }
        {
            const key = twitLike.userId;
            if (this.twitLikesByUser.has(key)) {
                this.twitLikesByUser.get(key).add(twitLike);
            } else {
                const twitLikes: Set<TwitLike> = new Set()
                twitLikes.add(twitLike);
                this.twitLikesByUser.set(key, twitLikes);
            }
        }
    }

    public remove(twitLike: TwitLike) {
        const key = twitLike.twitId;
        this.twitLikes.delete(key);
    }

    public findAllByTwitId(twitId: string): Array<TwitLike> {
        const key = twitId;
        if (this.twitLikes.has(key)) {
            return [...this.twitLikes.get(key)];
        } else {
            return [];
        }
    }

    public findAllByUserId(userId: string): Array<TwitLike> {
        const key = userId;
        if (this.twitLikesByUser.has(key)) {
            return [...this.twitLikes.get(key)];
        } else {
            return [];
        }
    }
}
