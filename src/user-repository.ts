import { User } from "./user";

export class UserRepository {
  existById(userId: string): boolean {
    const user = this.findById(userId)
    if (user) {
      return true;
    } else {
      return false;
    }
  }
  private users: Map<string, User> = new Map();

  public add(user: User) {
    this.users.set(user.id, user);
  }

  public findById(userId: string) {
    return this.users.get(userId);
  }

  public findByLineUserId(lineUserId: string): User {
    let allUsers: Array<User> = []
    this.users.forEach((value: User) => {
      allUsers.push(value)
    });
    const foundUsers = allUsers.filter(user => user.lineUserId === lineUserId)
    if (foundUsers && foundUsers.length > 0) {
      return foundUsers[0]
    } else {
      return null
    }
  }

  public removeById(userId: string) {
    return this.users.delete(userId);
  }

  public allUsers(): Array<User> {
    let allUsers: Array<User> = []
    this.users.forEach((value: User) => {
      allUsers.push(value)
    });
    return allUsers;
  }
}
