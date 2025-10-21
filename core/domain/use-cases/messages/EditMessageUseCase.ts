import { IMessageRepository } from '../../repositories/IMessageRepository';
import { UpdateMessageDTO, Message, MessageType } from '../../entities/Message';

export class EditMessageUseCase {
  constructor(private readonly messageRepository: IMessageRepository) {}

  async execute(messageId: string, newText: string, userId: string): Promise<Message> {
    // Validation
    if (!messageId) {
      throw new Error('Message ID is required');
    }

    if (!newText.trim()) {
      throw new Error('Message text cannot be empty');
    }

    if (newText.length > 1000) {
      throw new Error('Message text cannot exceed 1000 characters');
    }

    // Get the message to verify ownership
    const message = await this.messageRepository.getMessageById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('You can only edit your own messages');
    }

    if (message.type === MessageType.DELETED) {
      throw new Error('Cannot edit a deleted message');
    }

    // Check if message is not too old (e.g., 15 minutes)
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - message.timestamp > fifteenMinutes) {
      throw new Error('Cannot edit messages older than 15 minutes');
    }

    const dto: UpdateMessageDTO = {
      id: messageId,
      text: newText,
      editedAt: Date.now(),
    };

    return this.messageRepository.updateMessage(dto);
  }
}
