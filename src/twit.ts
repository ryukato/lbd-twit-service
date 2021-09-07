export class Twit {
    constructor(
        readonly id: string,
        readonly message: string,
        readonly createdAt: Date,
        readonly owner: string
    ) { }
}
