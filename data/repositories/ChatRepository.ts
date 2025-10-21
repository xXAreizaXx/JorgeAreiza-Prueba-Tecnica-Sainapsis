import { db } from '../../database/db';
import { chats, chatParticipants, messages } from '../../database/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { Chat, Message } from './types';

export class ChatRepository {
  /**
   * Get all chats for a user with optimized queries
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      // Get all chat IDs where user is a participant
      const userChatParticipants = await db
        .select()
        .from(chatParticipants)
        .where(eq(chatParticipants.userId, userId));

      const chatIds = userChatParticipants.map(cp => cp.chatId);

      if (chatIds.length === 0) {
        return [];
      }

      // Get all participants for these chats in one query
      const allParticipants = await db
        .select()
        .from(chatParticipants)
        .where(inArray(chatParticipants.chatId, chatIds));

      // Get last message for each chat in one query
      const lastMessages = await db
        .select({
          chatId: messages.chatId,
          id: messages.id,
          senderId: messages.senderId,
          text: messages.text,
          timestamp: messages.timestamp,
          status: messages.status,
        })
        .from(messages)
        .where(inArray(messages.chatId, chatIds))
        .orderBy(desc(messages.timestamp));

      // Group participants by chat
      const participantsByChat = new Map<string, string[]>();
      allParticipants.forEach(p => {
        if (!participantsByChat.has(p.chatId)) {
          participantsByChat.set(p.chatId, []);
        }
        participantsByChat.get(p.chatId)!.push(p.userId);
      });

      // Group last messages by chat
      const lastMessageByChat = new Map<string, Message>();
      lastMessages.forEach(m => {
        if (!lastMessageByChat.has(m.chatId)) {
          lastMessageByChat.set(m.chatId, {
            id: m.id,
            chatId: m.chatId,
            senderId: m.senderId,
            text: m.text,
            timestamp: m.timestamp,
            status: (m.status as 'sending' | 'sent' | 'read') || 'sent',
          });
        }
      });

      // Build chat objects
      const userChats: Chat[] = chatIds.map(chatId => ({
        id: chatId,
        participants: participantsByChat.get(chatId) || [],
        lastMessage: lastMessageByChat.get(chatId),
      }));

      // Sort by last message timestamp (most recent first)
      return userChats.sort((a, b) => {
        const aTime = a.lastMessage?.timestamp || 0;
        const bTime = b.lastMessage?.timestamp || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }

  /**
   * Create a new chat
   */
  async createChat(participantIds: string[]): Promise<Chat> {
    try {
      const chatId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      // Insert chat
      await db.insert(chats).values({ 
        id: chatId,
        createdAt: now,
        updatedAt: now,
      });

      // Insert participants in batch
      const participantValues = participantIds.map(userId => ({
        id: `cp-${chatId}-${userId}`,
        chatId,
        userId,
      }));

      await db.insert(chatParticipants).values(participantValues);

      return {
        id: chatId,
        participants: participantIds,
      };
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Get a single chat by ID
   */
  async getChatById(chatId: string): Promise<Chat | null> {
    try {
      const chat = await db
        .select()
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);

      if (chat.length === 0) {
        return null;
      }

      const participants = await db
        .select()
        .from(chatParticipants)
        .where(eq(chatParticipants.chatId, chatId));

      const lastMessage = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(desc(messages.timestamp))
        .limit(1);

      return {
        id: chatId,
        participants: participants.map(p => p.userId),
        lastMessage: lastMessage.length > 0 ? {
          id: lastMessage[0].id,
          chatId: lastMessage[0].chatId,
          senderId: lastMessage[0].senderId,
          text: lastMessage[0].text,
          timestamp: lastMessage[0].timestamp,
          status: (lastMessage[0].status as 'sending' | 'sent' | 'read') || 'sent',
        } : undefined,
      };
    } catch (error) {
      console.error('Error getting chat by ID:', error);
      throw error;
    }
  }

  /**
   * Check if a chat exists between specific participants
   */
  async findChatByParticipants(participantIds: string[]): Promise<Chat | null> {
    try {
      // Get all chats where first participant is involved
      const firstUserChats = await db
        .select()
        .from(chatParticipants)
        .where(eq(chatParticipants.userId, participantIds[0]));

      // For each chat, check if all other participants are also in it
      for (const cp of firstUserChats) {
        const chatParticipantsList = await db
          .select()
          .from(chatParticipants)
          .where(eq(chatParticipants.chatId, cp.chatId));

        const chatUserIds = chatParticipantsList.map(p => p.userId).sort();
        const targetUserIds = [...participantIds].sort();

        if (JSON.stringify(chatUserIds) === JSON.stringify(targetUserIds)) {
          return this.getChatById(cp.chatId);
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding chat by participants:', error);
      return null;
    }
  }
}

export const chatRepository = new ChatRepository();
