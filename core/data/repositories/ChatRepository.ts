import { db } from '@/database/db';
import { chats, chatParticipants, messages } from '@/database/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { IChatRepository } from '../../domain/repositories/IChatRepository';
import { Chat, CreateChatDTO, ChatWithUnreadCount } from '../../domain/entities/Chat';
import { Message, MessageStatus, MessageType } from '../../domain/entities/Message';

export class ChatRepository implements IChatRepository {
  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      const userChatParticipants = await db
        .select()
        .from(chatParticipants)
        .where(eq(chatParticipants.userId, userId));

      const chatIds = userChatParticipants.map(cp => cp.chatId);

      if (chatIds.length === 0) {
        return [];
      }

      const allParticipants = await db
        .select()
        .from(chatParticipants)
        .where(inArray(chatParticipants.chatId, chatIds));

      const lastMessages = await db
        .select()
        .from(messages)
        .where(inArray(messages.chatId, chatIds))
        .orderBy(desc(messages.timestamp));

      const chatRecords = await db
        .select()
        .from(chats)
        .where(inArray(chats.id, chatIds));

      const participantsByChat = new Map<string, string[]>();
      allParticipants.forEach(p => {
        if (!participantsByChat.has(p.chatId)) {
          participantsByChat.set(p.chatId, []);
        }
        participantsByChat.get(p.chatId)!.push(p.userId);
      });

      const lastMessageByChat = new Map<string, Message>();
      lastMessages.forEach(m => {
        if (!lastMessageByChat.has(m.chatId)) {
          lastMessageByChat.set(m.chatId, {
            id: m.id,
            chatId: m.chatId,
            senderId: m.senderId,
            text: m.text,
            timestamp: m.timestamp,
            status: (m.status as MessageStatus) || MessageStatus.SENT,
            type: (m.type as MessageType) || MessageType.TEXT,
            imageUrl: m.imageUrl || undefined,
            editedAt: m.editedAt || undefined,
            deletedAt: m.deletedAt || undefined,
          });
        }
      });

      const chatMap = new Map(chatRecords.map(c => [c.id, c]));

      const userChats: Chat[] = chatIds.map(chatId => {
        const chatRecord = chatMap.get(chatId);
        return {
          id: chatId,
          participants: participantsByChat.get(chatId) || [],
          lastMessage: lastMessageByChat.get(chatId),
          createdAt: chatRecord?.createdAt || Date.now(),
          updatedAt: chatRecord?.updatedAt || Date.now(),
        };
      });

      return userChats.sort((a, b) => {
        const aTime = a.lastMessage?.timestamp || 0;
        const bTime = b.lastMessage?.timestamp || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw new Error('Failed to get user chats');
    }
  }

  async getUserChatsWithUnreadCount(userId: string): Promise<ChatWithUnreadCount[]> {
    try {
      const userChats = await this.getUserChats(userId);
      
      const chatsWithUnread: ChatWithUnreadCount[] = await Promise.all(
        userChats.map(async chat => {
          const unreadMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.chatId, chat.id));

          const unreadCount = unreadMessages.filter(
            (m: typeof messages.$inferSelect) => m.senderId !== userId && m.status === MessageStatus.SENT
          ).length;

          return {
            ...chat,
            unreadCount,
          };
        })
      );

      return chatsWithUnread;
    } catch (error) {
      console.error('Error getting chats with unread count:', error);
      throw new Error('Failed to get chats with unread count');
    }
  }

  async createChat(dto: CreateChatDTO): Promise<Chat> {
    try {
      const chatId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      await db.insert(chats).values({
        id: chatId,
        createdAt: now,
        updatedAt: now,
      });

      const participantValues = dto.participants.map(userId => ({
        id: `cp-${chatId}-${userId}`,
        chatId,
        userId,
      }));

      await db.insert(chatParticipants).values(participantValues);

      return {
        id: chatId,
        participants: dto.participants,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Error creating chat:', error);
      throw new Error('Failed to create chat');
    }
  }

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
          status: (lastMessage[0].status as MessageStatus) || MessageStatus.SENT,
          type: (lastMessage[0].type as MessageType) || MessageType.TEXT,
          imageUrl: lastMessage[0].imageUrl || undefined,
          editedAt: lastMessage[0].editedAt || undefined,
          deletedAt: lastMessage[0].deletedAt || undefined,
        } : undefined,
        createdAt: chat[0].createdAt || Date.now(),
        updatedAt: chat[0].updatedAt || Date.now(),
      };
    } catch (error) {
      console.error('Error getting chat by ID:', error);
      return null;
    }
  }

  async findChatByParticipants(participantIds: string[]): Promise<Chat | null> {
    try {
      const firstUserChats = await db
        .select()
        .from(chatParticipants)
        .where(eq(chatParticipants.userId, participantIds[0]));

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

  async deleteChat(chatId: string): Promise<void> {
    try {
      await db.delete(messages).where(eq(messages.chatId, chatId));
      await db.delete(chatParticipants).where(eq(chatParticipants.chatId, chatId));
      await db.delete(chats).where(eq(chats.id, chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw new Error('Failed to delete chat');
    }
  }
}

export const chatRepository = new ChatRepository();
