export class User {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly walletAddress: string,
    readonly lineUserId?: string
    ) {}
}
