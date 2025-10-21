import { Chat, CreateChatDTO, ChatWithUnreadCount } from '../entities/Chat';

export interface IChatRepository {
  /**
   * Get all chats for a user
   */
  getUserChats(userId: string): Promise<Chat[]>;

  /**
   * Get all chats with unread counts
   */
  getUserChatsWithUnreadCount(userId: string): Promise<ChatWithUnreadCount[]>;

  /**
   * Create a new chat
   */
  createChat(dto: CreateChatDTO): Promise<Chat>;

  /**
   * Get a single chat by ID
   */
  getChatById(chatId: string): Promise<Chat | null>;

  /**
   * Find chat by participants
   */
  findChatByParticipants(participantIds: string[]): Promise<Chat | null>;

  /**
   * Delete a chat
   */
  deleteChat(chatId: string): Promise<void>;
}
