import { Avatar } from '@/components/Avatar';
import { MessageBubble } from '@/components/MessageBubble';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Message, MessageType } from '@/core/domain/entities/Message';
import { useAppContext } from '@/hooks/AppContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useMessages } from '@/hooks/useMessages';
import * as Haptics from 'expo-haptics';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function ChatRoomScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { currentUser, users, chats, updateChatLastMessage, refreshUnreadCount } = useAppContext();
  const [messageText, setMessageText] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
    editMessage,
    deleteMessage,
  } = useMessages(chatId || null, currentUser?.id || null);
  
  const chatParticipants = chat?.participants
    .filter(id => id !== currentUser?.id)
    .map(id => users.find(user => user.id === id))
    .filter(Boolean) || [];
  
  const chatName = chatParticipants.length === 1 
    ? chatParticipants[0]?.name 
    : `${chatParticipants[0]?.name || 'Unknown'} & ${chatParticipants.length - 1} other${chatParticipants.length > 1 ? 's' : ''}`;

  const handleSendMessage = useCallback(async () => {
    if ((messageText.trim() || selectedImage) && currentUser && chat) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (editingMessage) {
        // Edit existing message
        const success = await editMessage(editingMessage.id, messageText.trim());
        if (success) {
          setEditingMessage(null);
          setMessageText('');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        // Send new message
        const success = await sendMessageToRepo(messageText.trim(), selectedImage || undefined);
        if (success) {
          setMessageText('');
          setSelectedImage(null);
          updateChatLastMessage(chat.id);
        }
      }
    }
  }, [messageText, selectedImage, editingMessage, currentUser, chat, sendMessageToRepo, editMessage, updateChatLastMessage]);

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

  const handleMessageLongPress = useCallback((message: Message) => {
    if (message.senderId !== currentUser?.id || message.type === MessageType.DELETED) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Message Options',
      'What would you like to do?',
      [
        {
          text: 'Edit',
          onPress: () => {
            setEditingMessage(message);
            setMessageText(message.text);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteMessage(message.id);
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, [currentUser?.id, deleteMessage]);

  const handleImagePick = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Compress image
      const manipResult = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      setSelectedImage(manipResult.uri);
    }
  }, []);

  const handleSearchPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/SearchMessages',
      params: { chatId: chatId || '' },
    });
  }, [chatId, router]);

  // Render message item with optimization
  const renderMessage = useCallback(({ item }: ListRenderItemInfo<Message>) => (
    <MessageBubble
      message={item}
      isCurrentUser={item.senderId === currentUser?.id}
      onLongPress={handleMessageLongPress}
    />
  ), [currentUser?.id, handleMessageLongPress]);

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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 + insets.top : 0}
      style={styles.container}
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
              <IconSymbol name="chevron.left" size={20} color={isDark ? '#0A84FF' : '#007AFF'} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable 
              onPress={handleSearchPress}
              style={styles.backButton}
            >
              <IconSymbol name="magnifyingglass" size={25} color={isDark ? '#0A84FF' : '#007AFF'} />
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
          contentContainerStyle={styles.messagesContainer}
          data={messages}
          getItemLayout={getItemLayout}
          keyExtractor={keyExtractor}
          maxToRenderPerBatch={10}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ref={flatListRef}
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={renderMessage}
          updateCellsBatchingPeriod={50}
          windowSize={10}
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
        />
      )}

      {editingMessage && (
        <ThemedView style={[styles.editingBar, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
          <ThemedText style={styles.editingText}>Editing message</ThemedText>
          <Pressable onPress={() => {
            setEditingMessage(null);
            setMessageText('');
          }}>
            <IconSymbol name="xmark.circle.fill" size={20} color="#8F8F8F" />
          </Pressable>
        </ThemedView>
      )}

      {selectedImage && (
        <ThemedView style={[styles.imagePreview, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
          <ThemedText style={styles.imagePreviewText}>Image selected</ThemedText>
          <Pressable onPress={() => setSelectedImage(null)}>
            <IconSymbol name="xmark.circle.fill" size={20} color="#8F8F8F" />
          </Pressable>
        </ThemedView>
      )}

      <ThemedView style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable 
          style={styles.attachButton}
          onPress={handleImagePick}
        >
          <IconSymbol name="plus.circle.fill" size={28} color={isDark ? '#8F8F8F' : '#8F8F8F'} />
        </Pressable>
        <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}>
          <TextInput
            maxLength={1000}
            multiline
            onChangeText={setMessageText}
            placeholder="Message"
            placeholderTextColor={isDark ? '#8F8F8F' : '#999999'}
            style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
            value={messageText}
          />
        </View>
        <Pressable
          style={[styles.sendButton, !(messageText.trim() || selectedImage) && styles.disabledButton]}
          onPress={handleSendMessage}
          disabled={!(messageText.trim() || selectedImage)}
        >
          <IconSymbol 
            name={editingMessage ? "checkmark.circle.fill" : "arrow.up.circle.fill"}
            size={34} 
            color={(messageText.trim() || selectedImage) ? (isDark ? '#0A84FF' : '#007AFF') : '#8F8F8F'} 
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
    lineHeight: 15,
  },
  sendButton: {
    marginBottom: 2,
  },
  disabledButton: {
    opacity: 1,
  },
  editingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  imagePreviewText: {
    fontSize: 14,
    color: '#8F8F8F',
  },
}); 