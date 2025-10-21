import { Avatar } from '@/components/Avatar';
import { MessageBubble } from '@/components/MessageBubble';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import type { Message } from '@/core/domain/entities/Message';
import { useAppContext } from '@/hooks/AppContext';
import { useMessages } from '@/hooks/useMessages';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItemInfo,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ChatRoomScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { currentUser, users, chats, updateChatLastMessage, refreshUnreadCount } = useAppContext();
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const chat = chats.find(c => c.id === chatId);
  
  // Use the new messages hook with pagination
  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    sendMessage: sendMessageToRepo,
    markAsRead,
  } = useMessages(chatId || null, currentUser?.id || null);
  
  const chatParticipants = chat?.participants
    .filter(id => id !== currentUser?.id)
    .map(id => users.find(user => user.id === id))
    .filter(Boolean) || [];
  
  const chatName = chatParticipants.length === 1 
    ? chatParticipants[0]?.name 
    : `${chatParticipants[0]?.name || 'Unknown'} & ${chatParticipants.length - 1} other${chatParticipants.length > 1 ? 's' : ''}`;

  const handleSendMessage = useCallback(async () => {
    if (messageText.trim() && currentUser && chat) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const success = await sendMessageToRepo(messageText.trim());
      if (success) {
        setMessageText('');
        updateChatLastMessage(chat.id);
      }
    }
  }, [messageText, currentUser, chat, sendMessageToRepo, updateChatLastMessage]);

  // Mark messages as read when entering chat
  useEffect(() => {
    if (chatId && currentUser) {
      markAsRead();
      refreshUnreadCount(chatId);
    }
  }, [chatId, currentUser, markAsRead, refreshUnreadCount]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Small delay to ensure list is rendered
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Load more messages when reaching the top
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadMore();
    }
  }, [loadingMore, hasMore, loadMore]);

  // Render message item with optimization
  const renderMessage = useCallback(({ item }: ListRenderItemInfo<Message>) => (
    <MessageBubble
      message={item}
      isCurrentUser={item.senderId === currentUser?.id}
    />
  ), [currentUser?.id]);

  // Get item layout for performance
  const getItemLayout = useCallback((_: ArrayLike<Message> | null | undefined, index: number) => ({
    length: 80, // Approximate item height
    offset: 80 * index,
    index,
  }), []);

  // Key extractor
  const keyExtractor = useCallback((item: Message) => item.id, []);

  if (!chat || !currentUser) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Chat not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 + insets.top : 0}
    >
      <StatusBar style="auto" />
      <Stack.Screen 
        options={{
          headerTitle: () => (
            <Pressable 
              style={styles.headerContainer}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Avatar 
                user={chatParticipants[0]} 
                size={36} 
                showStatus={true}
              />
              <View style={styles.headerTextContainer}>
                <ThemedText style={styles.headerTitle} numberOfLines={1}>
                  {chatName}
                </ThemedText>
                <ThemedText style={styles.headerSubtitle}>
                  {chatParticipants[0]?.status === 'online' ? 'Online' : 'Offline'}
                </ThemedText>
              </View>
            </Pressable>
          ),
          headerLeft: () => (
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
            >
              <IconSymbol name="chevron.left" size={28} color={isDark ? '#0A84FF' : '#007AFF'} />
            </Pressable>
          ),
          headerStyle: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
          },
        }} 
      />

      {loading ? (
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </ThemedView>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderMessage}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.messagesContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#007AFF" />
                <ThemedText style={styles.loadingText}>Loading older messages...</ThemedText>
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText>No messages yet. Say hello!</ThemedText>
            </ThemedView>
          )}
          windowSize={10}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}

      <ThemedView style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable 
          style={styles.attachButton}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <IconSymbol name="plus.circle.fill" size={28} color={isDark ? '#8F8F8F' : '#8F8F8F'} />
        </Pressable>
        <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
          <TextInput
            style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Message"
            placeholderTextColor={isDark ? '#8F8F8F' : '#999999'}
            multiline
            maxLength={1000}
          />
        </View>
        <Pressable
          style={[styles.sendButton, !messageText.trim() && styles.disabledButton]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <IconSymbol 
            name="arrow.up.circle.fill" 
            size={34} 
            color={messageText.trim() ? (isDark ? '#0A84FF' : '#007AFF') : '#8F8F8F'} 
          />
        </Pressable>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    opacity: 0.6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8F8F8F',
    marginTop: 1,
  },
  backButton: {
    padding: 4,
  },
  messagesContainer: {
    padding: 10,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    alignItems: 'flex-end',
    gap: 8,
  },
  attachButton: {
    marginBottom: 6,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    lineHeight: 20,
  },
  sendButton: {
    marginBottom: 2,
  },
  disabledButton: {
    opacity: 1,
  },
}); 