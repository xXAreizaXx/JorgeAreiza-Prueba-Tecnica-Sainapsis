import { EditMessageUseCase } from '../EditMessageUseCase';
import { IMessageRepository } from '../../../repositories/IMessageRepository';
import { Message, MessageType, MessageStatus, UpdateMessageDTO } from '../../../entities/Message';

class MockMessageRepository implements IMessageRepository {
  private messages: Map<string, Message> = new Map();

  constructor() {
    // Add a test message
    this.messages.set('msg-123', {
      id: 'msg-123',
      chatId: 'chat-123',
      senderId: 'user-456',
      text: 'Original text',
      timestamp: Date.now(),
      status: MessageStatus.SENT,
      type: MessageType.TEXT,
    });
  }

  async getMessages(): Promise<{ items: Message[]; hasMore: boolean; nextCursor?: string }> {
    return { items: [], hasMore: false };
  }

  async sendMessage(): Promise<Message> {
    throw new Error('Not implemented');
  }

  async getMessageById(messageId: string): Promise<Message | null> {
    return this.messages.get(messageId) || null;
  }

  async updateMessage(dto: UpdateMessageDTO): Promise<Message> {
    const message = this.messages.get(dto.id);
    if (!message) throw new Error('Message not found');

    const updated = {
      ...message,
      text: dto.text || message.text,
      editedAt: dto.editedAt,
    };
    this.messages.set(dto.id, updated);
    return updated;
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
}

describe('EditMessageUseCase', () => {
  let useCase: EditMessageUseCase;
  let mockRepository: IMessageRepository;

  beforeEach(() => {
    mockRepository = new MockMessageRepository();
    useCase = new EditMessageUseCase(mockRepository);
  });

  it('should edit a message successfully', async () => {
    const result = await useCase.execute('msg-123', 'Updated text', 'user-456');

    expect(result).toBeDefined();
    expect(result.text).toBe('Updated text');
    expect(result.editedAt).toBeDefined();
  });

  it('should throw error if messageId is missing', async () => {
    await expect(
      useCase.execute('', 'New text', 'user-456')
    ).rejects.toThrow('Message ID is required');
  });

  it('should throw error if text is empty', async () => {
    await expect(
      useCase.execute('msg-123', '   ', 'user-456')
    ).rejects.toThrow('Message text cannot be empty');
  });

  it('should throw error if text exceeds 1000 characters', async () => {
    const longText = 'a'.repeat(1001);
    
    await expect(
      useCase.execute('msg-123', longText, 'user-456')
    ).rejects.toThrow('Message text cannot exceed 1000 characters');
  });

  it('should throw error if message not found', async () => {
    await expect(
      useCase.execute('non-existent', 'New text', 'user-456')
    ).rejects.toThrow('Message not found');
  });

  it('should throw error if user is not the sender', async () => {
    await expect(
      useCase.execute('msg-123', 'New text', 'other-user')
    ).rejects.toThrow('You can only edit your own messages');
  });
});
