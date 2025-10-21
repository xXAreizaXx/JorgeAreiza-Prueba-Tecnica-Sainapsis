import { useState, useEffect, useCallback, useRef } from 'react';
import { messageRepository } from '@/core/data/repositories';
import { Message, MessageStatus, MessageType } from '@/core/domain/entities/Message';
import { SendMessageUseCase } from '@/core/domain/use-cases/messages/SendMessageUseCase';

const sendMessageUseCase = new SendMessageUseCase(messageRepository);

interface UseMessagesOptions {
  initialLimit?: number;
  pageSize?: number;
}

export function useMessages(
  chatId: string | null,
  currentUserId: string | null,
  options: UseMessagesOptions = {}
) {
  const { initialLimit = 50, pageSize = 30 } = options;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const nextCursorRef = useRef<string | undefined>();
  const isInitialLoadRef = useRef(true);

  // Initial load
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const loadInitialMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        isInitialLoadRef.current = true;

        const result = await messageRepository.getMessages(chatId, {
          limit: initialLimit,
        });

        // Messages come from DB in desc order (newest first)
        // Reverse them so oldest is first in array (for inverted FlatList)
        setMessages(result.items.reverse());
        setHasMore(result.hasMore);
        nextCursorRef.current = result.nextCursor;
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
        isInitialLoadRef.current = false;
      }
    };

    loadInitialMessages();
  }, [chatId, initialLimit]);

  // Load more (older) messages
  const loadMore = useCallback(async () => {
    if (!chatId || loadingMore || !hasMore || !nextCursorRef.current) {
      return;
    }

    try {
      setLoadingMore(true);
      setError(null);

      const result = await messageRepository.getMessages(chatId, {
        limit: pageSize,
        beforeId: nextCursorRef.current,
      });

      // Prepend older messages (they come in desc order, so reverse)
      setMessages(prev => [...result.items.reverse(), ...prev]);
      setHasMore(result.hasMore);
      nextCursorRef.current = result.nextCursor;
    } catch (err) {
      console.error('Error loading more messages:', err);
      setError('Failed to load more messages');
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, loadingMore, hasMore, pageSize]);

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!chatId || !currentUserId || !text.trim()) {
      return false;
    }

    try {
      // Optimistic update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId,
        senderId: currentUserId,
        text: text.trim(),
        timestamp: Date.now(),
        status: MessageStatus.SENDING,
        type: MessageType.TEXT,
      };

      setMessages(prev => [...prev, optimisticMessage]);

      // Send to DB
      const sentMessage = await sendMessageUseCase.execute({
        chatId,
        senderId: currentUserId,
        text: text.trim(),
      });

      // Replace optimistic message with real one
      setMessages(prev =>
        prev.map(m => (m.id === optimisticMessage.id ? sentMessage : m))
      );

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      setError('Failed to send message');
      return false;
    }
  }, [chatId, currentUserId]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!chatId || !currentUserId) return;

    try {
      // Get unread messages from other users
      const unreadMessages = messages.filter(
        m => m.senderId !== currentUserId && m.status !== 'read'
      );

      if (unreadMessages.length === 0) return;

      const messageIds = unreadMessages.map(m => m.id);
      await messageRepository.markMessagesAsRead(messageIds);

      // Update local state
      setMessages(prev =>
        prev.map(m =>
          messageIds.includes(m.id) ? { ...m, status: MessageStatus.READ } : m
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [chatId, currentUserId, messages]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    sendMessage,
    markAsRead,
  };
}
