import {
  Message,
  CreateMessageDTO,
  UpdateMessageDTO,
  PaginationParams,
  PaginatedMessages,
  MessageSearchQuery,
} from '../entities/Message';

export interface IMessageRepository {
  /**
   * Get paginated messages for a chat
   */
  getMessages(chatId: string, params: PaginationParams): Promise<PaginatedMessages>;

  /**
   * Send a new message
   */
  sendMessage(dto: CreateMessageDTO): Promise<Message>;

  /**
   * Update an existing message
   */
  updateMessage(dto: UpdateMessageDTO): Promise<Message>;

  /**
   * Delete a message (soft delete)
   */
  deleteMessage(messageId: string): Promise<void>;

  /**
   * Mark messages as read
   */
  markMessagesAsRead(messageIds: string[]): Promise<void>;

  /**
   * Get unread message count for a chat
   */
  getUnreadCount(chatId: string, userId: string): Promise<number>;

  /**
   * Search messages
   */
  searchMessages(query: MessageSearchQuery): Promise<Message[]>;

  /**
   * Get a single message by ID
   */
  getMessageById(messageId: string): Promise<Message | null>;
}
