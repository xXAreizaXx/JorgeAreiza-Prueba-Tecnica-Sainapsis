export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  READ = 'read',
  FAILED = 'failed',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DELETED = 'deleted',
}

export interface Message {
  readonly id: string;
  readonly chatId: string;
  readonly senderId: string;
  readonly text: string;
  readonly timestamp: number;
  readonly status: MessageStatus;
  readonly type: MessageType;
  readonly imageUrl?: string;
  readonly editedAt?: number;
  readonly deletedAt?: number;
}

export interface CreateMessageDTO {
  chatId: string;
  senderId: string;
  text: string;
  type?: MessageType;
  imageUrl?: string;
}

export interface UpdateMessageDTO {
  id: string;
  text?: string;
  status?: MessageStatus;
  editedAt?: number;
  deletedAt?: number;
}

export interface MessageSearchQuery {
  chatId?: string;
  searchTerm: string;
  limit?: number;
  offset?: number;
}

export interface PaginationParams {
  limit: number;
  beforeId?: string;
}

export interface PaginatedMessages {
  items: Message[];
  hasMore: boolean;
  nextCursor?: string;
}
