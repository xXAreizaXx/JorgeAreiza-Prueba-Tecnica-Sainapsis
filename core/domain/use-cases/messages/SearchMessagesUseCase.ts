import { IMessageRepository } from '../../repositories/IMessageRepository';
import { MessageSearchQuery, Message } from '../../entities/Message';

export class SearchMessagesUseCase {
  constructor(private readonly messageRepository: IMessageRepository) {}

  async execute(query: MessageSearchQuery): Promise<Message[]> {
    // Validation
    if (!query.searchTerm || query.searchTerm.trim().length < 2) {
      throw new Error('Search term must be at least 2 characters');
    }

    // Sanitize search term
    const sanitizedQuery: MessageSearchQuery = {
      ...query,
      searchTerm: query.searchTerm.trim(),
      limit: query.limit || 50,
      offset: query.offset || 0,
    };

    return this.messageRepository.searchMessages(sanitizedQuery);
  }
}
