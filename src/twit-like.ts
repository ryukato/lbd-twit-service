export class TwitLike {
    constructor(readonly userId: string, readonly twitId: string, readonly likedBy: string,readonly likedAt: Date = new Date()) {}
}