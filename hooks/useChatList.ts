import { chatRepository, messageRepository } from '@/data/repositories';
import { Chat } from '@/data/repositories/types';
import { useCallback, useEffect, useState } from 'react';

export function useChatList(currentUserId: string | null) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  // Load chats
  useEffect(() => {
    if (!currentUserId) {
      setChats([]);
      setLoading(false);
      return;
    }

    const loadChats = async () => {
      try {
        setLoading(true);
        setError(null);

        const userChats = await chatRepository.getUserChats(currentUserId);
        setChats(userChats);

        // Load unread counts for each chat
        const counts = new Map<string, number>();
        await Promise.all(
          userChats.map(async chat => {
            const count = await messageRepository.getUnreadCount(chat.id, currentUserId);
            counts.set(chat.id, count);
          })
        );
        setUnreadCounts(counts);
      } catch (err) {
        console.error('Error loading chats:', err);
        setError('Failed to load chats');
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [currentUserId]);

  // Create new chat
  const createChat = useCallback(async (participantIds: string[]) => {
    if (!currentUserId || !participantIds.includes(currentUserId)) {
      return null;
    }

    try {
      // Check if chat already exists
      const existingChat = await chatRepository.findChatByParticipants(participantIds);
      if (existingChat) {
        return existingChat;
      }

      // Create new chat
      const newChat = await chatRepository.createChat(participantIds);
      setChats(prev => [newChat, ...prev]);
      return newChat;
    } catch (err) {
      console.error('Error creating chat:', err);
      setError('Failed to create chat');
      return null;
    }
  }, [currentUserId]);

  // Update chat after new message
  const updateChatLastMessage = useCallback((chatId: string) => {
    chatRepository.getChatById(chatId).then(updatedChat => {
      if (updatedChat) {
        setChats(prev => {
          const filtered = prev.filter(c => c.id !== chatId);
          return [updatedChat, ...filtered];
        });
      }
    });
  }, []);

  // Refresh unread count for a chat
  const refreshUnreadCount = useCallback(async (chatId: string) => {
    if (!currentUserId) return;
    
    const count = await messageRepository.getUnreadCount(chatId, currentUserId);
    setUnreadCounts(prev => new Map(prev).set(chatId, count));
  }, [currentUserId]);

  return {
    chats,
    loading,
    error,
    unreadCounts,
    createChat,
    updateChatLastMessage,
    refreshUnreadCount,
  };
}
