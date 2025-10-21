import { Message } from './Message';

export interface Chat {
  readonly id: string;
  readonly participants: string[];
  readonly lastMessage?: Message;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface CreateChatDTO {
  participants: string[];
}

export interface ChatWithUnreadCount extends Chat {
  unreadCount: number;
}
