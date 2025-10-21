import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Chat } from '@/data/repositories/types';
import { Avatar } from './Avatar';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { User } from '@/hooks/useUser';

interface ChatListItemProps {
  chat: Chat;
  currentUserId: string;
  users: User[];
  unreadCount?: number;
}

export function ChatListItem({ chat, currentUserId, users, unreadCount = 0 }: ChatListItemProps) {
  const navigation = useNavigation();
  
  const otherParticipants = useMemo(() => {
    return chat.participants
      .filter(id => id !== currentUserId)
      .map(id => users.find(user => user.id === id))
      .filter(Boolean) as User[];
  }, [chat.participants, currentUserId, users]);

  const chatName = useMemo(() => {
    if (otherParticipants.length === 0) {
      return 'No participants';
    } else if (otherParticipants.length === 1) {
      return otherParticipants[0].name;
    } else {
      return `${otherParticipants[0].name} & ${otherParticipants.length - 1} other${otherParticipants.length > 2 ? 's' : ''}`;
    }
  }, [otherParticipants]);

  const handlePress = () => {
    // @ts-expect-error - Navigation typing issue with Expo Router
    navigation.navigate('ChatRoom', { chatId: chat.id });
  };

  const timeString = useMemo(() => {
    if (!chat.lastMessage) return '';
    
    const date = new Date(chat.lastMessage.timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, [chat.lastMessage]);

  const isCurrentUserLastSender = chat.lastMessage?.senderId === currentUserId;

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        pressed && { opacity: 0.7 },
      ]} 
      onPress={handlePress}
    >
      <Avatar 
        user={otherParticipants[0]} 
        size={56}
      />
      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <ThemedText numberOfLines={1} style={styles.name}>
            {chatName}
          </ThemedText>
          {timeString && (
            <ThemedText style={[styles.time, unreadCount > 0 && styles.unreadTime]}>
              {timeString}
            </ThemedText>
          )}
        </View>
        <View style={styles.bottomRow}>
          {chat.lastMessage && (
            <View style={styles.messageContainer}>
              {isCurrentUserLastSender && (
                <IconSymbol 
                  name="checkmark" 
                  size={14} 
                  color="#8F8F8F" 
                  style={styles.checkIcon}
                />
              )}
              <ThemedText 
                numberOfLines={1}
                style={[
                  styles.lastMessage,
                  unreadCount > 0 && styles.unreadMessage
                ]}
              >
                {chat.lastMessage.text}
              </ThemedText>
            </View>
          )}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <ThemedText style={styles.unreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 13,
    color: '#8F8F8F',
  },
  unreadTime: {
    color: '#007AFF',
    fontWeight: '600',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkIcon: {
    marginRight: 4,
  },
  lastMessage: {
    fontSize: 15,
    color: '#8F8F8F',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#000000',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
}); 