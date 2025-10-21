import { SendMessageUseCase } from '../SendMessageUseCase';
import { IMessageRepository } from '../../../repositories/IMessageRepository';
import { Message, MessageType, MessageStatus, CreateMessageDTO } from '../../../entities/Message';

// Mock repository
class MockMessageRepository implements IMessageRepository {
  async getMessages(): Promise<{ items: Message[]; hasMore: boolean; nextCursor?: string }> {
    return { items: [], hasMore: false };
  }
  
  async sendMessage(dto: CreateMessageDTO): Promise<Message> {
    return {
      id: 'msg-123',
      chatId: dto.chatId,
      senderId: dto.senderId,
      text: dto.text,
      timestamp: Date.now(),
      status: MessageStatus.SENT,
      type: dto.type || MessageType.TEXT,
    };
  }
  
  async updateMessage(): Promise<Message> {
    throw new Error('Not implemented');
  }
  
  async deleteMessage(): Promise<void> {
    throw new Error('Not implemented');
  }
  
  async markMessagesAsRead(): Promise<void> {
    throw new Error('Not implemented');
  }
  
  async getUnreadCount(): Promise<number> {
    return 0;
  }
  
  async searchMessages(): Promise<Message[]> {
    return [];
  }
  
  async getMessageById(): Promise<Message | null> {
    return null;
  }
}

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase;
  let mockRepository: IMessageRepository;

  beforeEach(() => {
    mockRepository = new MockMessageRepository();
    useCase = new SendMessageUseCase(mockRepository);
  });

  it('should send a message successfully', async () => {
    const result = await useCase.execute({
      chatId: 'chat-123',
      senderId: 'user-456',
      text: 'Hello, world!',
    });

    expect(result).toBeDefined();
    expect(result.text).toBe('Hello, world!');
    expect(result.chatId).toBe('chat-123');
    expect(result.senderId).toBe('user-456');
  });

  it('should throw error if chatId is missing', async () => {
    await expect(
      useCase.execute({
        chatId: '',
        senderId: 'user-456',
        text: 'Hello',
      })
    ).rejects.toThrow('Chat ID is required');
  });

  it('should throw error if senderId is missing', async () => {
    await expect(
      useCase.execute({
        chatId: 'chat-123',
        senderId: '',
        text: 'Hello',
      })
    ).rejects.toThrow('Sender ID is required');
  });

  it('should throw error if text is empty', async () => {
    await expect(
      useCase.execute({
        chatId: 'chat-123',
        senderId: 'user-456',
        text: '   ',
      })
    ).rejects.toThrow('Message text cannot be empty');
  });

  it('should throw error if text exceeds 1000 characters', async () => {
    const longText = 'a'.repeat(1001);
    
    await expect(
      useCase.execute({
        chatId: 'chat-123',
        senderId: 'user-456',
        text: longText,
      })
    ).rejects.toThrow('Message text cannot exceed 1000 characters');
  });

  it('should allow image messages without text', async () => {
    const result = await useCase.execute({
      chatId: 'chat-123',
      senderId: 'user-456',
      text: '',
      type: MessageType.IMAGE,
      imageUrl: 'https://example.com/image.jpg',
    });

    expect(result).toBeDefined();
    expect(result.type).toBe(MessageType.IMAGE);
  });
});
