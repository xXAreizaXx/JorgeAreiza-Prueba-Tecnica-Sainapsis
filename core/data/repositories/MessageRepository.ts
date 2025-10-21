import { db } from '@/database/db';
import { messages } from '@/database/schema';
import { and, desc, eq, like, lt } from 'drizzle-orm';
import {
    CreateMessageDTO,
    Message,
    MessageSearchQuery,
    MessageStatus,
    MessageType,
    PaginatedMessages,
    PaginationParams,
    UpdateMessageDTO,
} from '../../domain/entities/Message';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';

export class MessageRepository implements IMessageRepository {
  async getMessages(chatId: string, params: PaginationParams): Promise<PaginatedMessages> {
    const { limit, beforeId } = params;

    try {
      let query = db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(desc(messages.timestamp))
        .limit(limit + 1);

      if (beforeId) {
        const beforeMessage = await db
          .select()
          .from(messages)
          .where(eq(messages.id, beforeId))
          .limit(1);

        if (beforeMessage.length > 0) {
          query = db
            .select()
            .from(messages)
            .where(
              and(
                eq(messages.chatId, chatId),
                lt(messages.timestamp, beforeMessage[0].timestamp)
              )
            )
            .orderBy(desc(messages.timestamp))
            .limit(limit + 1);
        }
      }

      const results = await query;
      const hasMore = results.length > limit;
      const items = hasMore ? results.slice(0, limit) : results;

      return {
        items: items.map(this.mapToEntity),
        hasMore,
        nextCursor: hasMore ? items[items.length - 1].id : undefined,
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      throw new Error('Failed to get messages');
    }
  }

  async sendMessage(dto: CreateMessageDTO): Promise<Message> {
    try {
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = Date.now();

      await db.insert(messages).values({
        id: messageId,
        chatId: dto.chatId,
        senderId: dto.senderId,
        text: dto.text,
        timestamp,
        status: MessageStatus.SENT,
        type: dto.type || MessageType.TEXT,
        imageUrl: dto.imageUrl,
      });

      return {
        id: messageId,
        chatId: dto.chatId,
        senderId: dto.senderId,
        text: dto.text,
        timestamp,
        status: MessageStatus.SENT,
        type: dto.type || MessageType.TEXT,
        imageUrl: dto.imageUrl,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  async updateMessage(dto: UpdateMessageDTO): Promise<Message> {
    try {
      const updateData: Record<string, string | number> = {};
      
      if (dto.text !== undefined) updateData.text = dto.text;
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.editedAt !== undefined) updateData.editedAt = dto.editedAt;
      if (dto.deletedAt !== undefined) {
        updateData.deletedAt = dto.deletedAt;
        updateData.type = MessageType.DELETED;
        updateData.text = 'This message was deleted';
      }

      await db
        .update(messages)
        .set(updateData)
        .where(eq(messages.id, dto.id));

      const updated = await db
        .select()
        .from(messages)
        .where(eq(messages.id, dto.id))
        .limit(1);

      if (updated.length === 0) {
        throw new Error('Message not found after update');
      }

      return this.mapToEntity(updated[0]);
    } catch (error) {
      console.error('Error updating message:', error);
      throw new Error('Failed to update message');
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await db
        .update(messages)
        .set({
          type: MessageType.DELETED,
          text: 'This message was deleted',
          deletedAt: Date.now(),
        })
        .where(eq(messages.id, messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    try {
      for (const messageId of messageIds) {
        await db
          .update(messages)
          .set({ status: MessageStatus.READ })
          .where(eq(messages.id, messageId));
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    try {
      const unreadMessages = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.chatId, chatId),
            eq(messages.status, MessageStatus.SENT)
          )
        );

      return unreadMessages.filter(m => m.senderId !== userId).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async searchMessages(query: MessageSearchQuery): Promise<Message[]> {
    try {
      const searchPattern = `%${query.searchTerm}%`;
      const limit = query.limit || 50;
      const offset = query.offset || 0;
      
      const whereConditions = query.chatId
        ? and(like(messages.text, searchPattern), eq(messages.chatId, query.chatId))
        : like(messages.text, searchPattern);

      const results = await db
        .select()
        .from(messages)
        .where(whereConditions)
        .orderBy(desc(messages.timestamp))
        .limit(limit)
        .offset(offset);

      return results.map(this.mapToEntity);
    } catch (error) {
      console.error('Error searching messages:', error);
      throw new Error('Failed to search messages');
    }
  }

  async getMessageById(messageId: string): Promise<Message | null> {
    try {
      const result = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      return result.length > 0 ? this.mapToEntity(result[0]) : null;
    } catch (error) {
      console.error('Error getting message by ID:', error);
      return null;
    }
  }

  private mapToEntity(dbMessage: typeof messages.$inferSelect): Message {
    return {
      id: dbMessage.id,
      chatId: dbMessage.chatId,
      senderId: dbMessage.senderId,
      text: dbMessage.text,
      timestamp: dbMessage.timestamp,
      status: (dbMessage.status as MessageStatus) || MessageStatus.SENT,
      type: (dbMessage.type as MessageType) || MessageType.TEXT,
      imageUrl: dbMessage.imageUrl || undefined,
      editedAt: dbMessage.editedAt || undefined,
      deletedAt: dbMessage.deletedAt || undefined,
    };
  }
}

export const messageRepository = new MessageRepository();
