import { IMessageRepository } from '../../repositories/IMessageRepository';
import { CreateMessageDTO, Message, MessageType } from '../../entities/Message';

export class SendMessageUseCase {
  constructor(private readonly messageRepository: IMessageRepository) {}

  async execute(dto: CreateMessageDTO): Promise<Message> {
    // Validation
    if (!dto.chatId) {
      throw new Error('Chat ID is required');
    }

    if (!dto.senderId) {
      throw new Error('Sender ID is required');
    }

    if (!dto.text.trim() && dto.type !== MessageType.IMAGE) {
      throw new Error('Message text cannot be empty');
    }

    if (dto.text.length > 1000) {
      throw new Error('Message text cannot exceed 1000 characters');
    }

    return this.messageRepository.sendMessage(dto);
  }
}
