import { IMessageRepository } from '../../repositories/IMessageRepository';
import { PaginationParams, PaginatedMessages } from '../../entities/Message';

export class GetMessagesUseCase {
  constructor(private readonly messageRepository: IMessageRepository) {}

  async execute(chatId: string, params: PaginationParams): Promise<PaginatedMessages> {
    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    if (params.limit <= 0) {
      throw new Error('Limit must be greater than 0');
    }

    return this.messageRepository.getMessages(chatId, params);
  }
}
