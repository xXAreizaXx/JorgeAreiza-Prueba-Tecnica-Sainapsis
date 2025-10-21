// Domain entities
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'read';
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
}

// Pagination types
export interface PaginationOptions {
  limit: number;
  beforeId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  nextCursor?: string;
}
