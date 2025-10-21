import { db } from '@/database/db';
import { users } from '@/database/schema';
import { eq, inArray } from 'drizzle-orm';
import { User, UserStatus } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export class UserRepository implements IUserRepository {
  async getAllUsers(): Promise<User[]> {
    try {
      const usersData = await db.select().from(users);
      return usersData.map(this.mapToEntity);
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to get users');
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user.length > 0 ? this.mapToEntity(user[0]) : null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    try {
      if (userIds.length === 0) {
        return [];
      }

      const usersData = await db
        .select()
        .from(users)
        .where(inArray(users.id, userIds));

      return usersData.map(this.mapToEntity);
    } catch (error) {
      console.error('Error getting users by IDs:', error);
      throw new Error('Failed to get users');
    }
  }

  private mapToEntity(dbUser: typeof users.$inferSelect): User {
    return {
      id: dbUser.id,
      name: dbUser.name,
      avatar: dbUser.avatar,
      status: (dbUser.status as UserStatus) || UserStatus.OFFLINE,
    };
  }
}

export const userRepository = new UserRepository();
