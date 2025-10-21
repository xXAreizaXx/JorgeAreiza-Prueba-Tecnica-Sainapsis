import { User } from '../entities/User';

export interface IUserRepository {
  /**
   * Get all users
   */
  getAllUsers(): Promise<User[]>;

  /**
   * Get a user by ID
   */
  getUserById(userId: string): Promise<User | null>;

  /**
   * Get multiple users by IDs
   */
  getUsersByIds(userIds: string[]): Promise<User[]>;
}
