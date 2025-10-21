import { db } from '../../database/db';
import { messages } from '../../database/schema';
import { eq, and, lt, desc } from 'drizzle-orm';
import { Message, PaginationOptions, PaginatedResult } from './types';

export class MessageRepository {
  /**
   * Get messages for a chat with pagination (inverse order - newest first in DB, oldest first in UI)
   */
  async getMessages(
    chatId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<Message>> {
    const { limit, beforeId } = options;

    try {
      let query = db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(desc(messages.timestamp))
        .limit(limit + 1); // Fetch one extra to check if there are more

      // If beforeId is provided, only get messages older than that message
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
        items: items.map(m => ({
          id: m.id,
          chatId: m.chatId,
          senderId: m.senderId,
          text: m.text,
          timestamp: m.timestamp,
          status: (m.status as 'sending' | 'sent' | 'read') || 'sent',
        })),
        hasMore,
        nextCursor: hasMore ? items[items.length - 1].id : undefined,
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Send a new message
   */
  async sendMessage(
    chatId: string,
    text: string,
    senderId: string
  ): Promise<Message> {
    try {
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = Date.now();

      await db.insert(messages).values({
        id: messageId,
        chatId,
        senderId,
        text,
        timestamp,
        status: 'sent',
      });

      return {
        id: messageId,
        chatId,
        senderId,
        text,
        timestamp,
        status: 'sent',
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    try {
      // Update all messages in batch
      for (const messageId of messageIds) {
        await db
          .update(messages)
          .set({ status: 'read' })
          .where(eq(messages.id, messageId));
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for a chat
   */
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    try {
      const unreadMessages = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.chatId, chatId),
            eq(messages.status, 'sent')
          )
        );

      // Filter out messages sent by the current user
      return unreadMessages.filter(m => m.senderId !== userId).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Update message status
   */
  async updateMessageStatus(
    messageId: string,
    status: 'sending' | 'sent' | 'read'
  ): Promise<void> {
    try {
      await db
        .update(messages)
        .set({ status })
        .where(eq(messages.id, messageId));
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }
}

export const messageRepository = new MessageRepository();
