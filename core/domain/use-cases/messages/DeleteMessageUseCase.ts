import { IMessageRepository } from '../../repositories/IMessageRepository';
import { MessageType } from '../../entities/Message';

export class DeleteMessageUseCase {
  constructor(private readonly messageRepository: IMessageRepository) {}

  async execute(messageId: string, userId: string): Promise<void> {
    // Validation
    if (!messageId) {
      throw new Error('Message ID is required');
    }

    // Get the message to verify ownership
    const message = await this.messageRepository.getMessageById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('You can only delete your own messages');
    }

    if (message.type === MessageType.DELETED) {
      throw new Error('Message is already deleted');
    }

    await this.messageRepository.deleteMessage(messageId);
  }
}
