import { messageRepository } from '@/core/data/repositories/MessageRepository';
import { Message } from '@/core/domain/entities/Message';
import { SearchMessagesUseCase } from '@/core/domain/use-cases/messages/SearchMessagesUseCase';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useCallback, useEffect, useState } from 'react';

const searchMessagesUseCase = new SearchMessagesUseCase(messageRepository);

export function useSearch(chatId?: string) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm.trim().length < 2) {
        setResults([]);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const searchResults = await searchMessagesUseCase.execute({
          searchTerm: debouncedSearchTerm,
          chatId,
          limit: 50,
        });

        setResults(searchResults);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Failed to search messages');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    void performSearch();
  }, [debouncedSearchTerm, chatId]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setResults([]);
    setError(null);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    error,
    clearSearch,
  };
}
