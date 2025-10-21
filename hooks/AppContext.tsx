import { Chat } from '@/data/repositories/types';
import React, { createContext, ReactNode, useContext } from 'react';
import { DatabaseProvider } from '../database/DatabaseProvider';
import { useChatList } from './useChatList';
import { useDatabase } from './useDatabase';
import { User, useUser } from './useUser';

type AppContextType = {
  users: User[];
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (userId: string) => Promise<boolean>;
  logout: () => void;
  chats: Chat[];
  unreadCounts: Map<string, number>;
  createChat: (participantIds: string[]) => Promise<Chat | null>;
  updateChatLastMessage: (chatId: string) => void;
  refreshUnreadCount: (chatId: string) => Promise<void>;
  loading: boolean;
  dbInitialized: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function AppContent({ children }: { children: ReactNode }) {
  const { isInitialized } = useDatabase();
  const userContext = useUser();
  const chatContext = useChatList(userContext.currentUser?.id || null);
  
  const loading = !isInitialized || userContext.loading || chatContext.loading;

  const value = {
    ...userContext,
    ...chatContext,
    loading,
    dbInitialized: isInitialized,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <DatabaseProvider>
      <AppContent>{children}</AppContent>
    </DatabaseProvider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 