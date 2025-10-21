import { ChatListItem } from '@/components/ChatListItem';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { UserListItem } from '@/components/UserListItem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAppContext } from '@/hooks/AppContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';

export default function ChatsScreen() {
  const { currentUser, users, chats, createChat, unreadCounts } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleCreateChat = () => {
    if (currentUser && selectedUsers.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const participants = [currentUser.id, ...selectedUsers];
      createChat(participants);
      setModalVisible(false);
      setSelectedUsers([]);
    }
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol name="message.fill" size={64} color="#8F8F8F" />
      <ThemedText style={styles.emptyTitle}>No Chats Yet</ThemedText>
      <ThemedText style={styles.emptyText}>Tap the + button to start a conversation</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        <ThemedText style={styles.headerTitle}>Messages</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.newChatButton,
            pressed && { opacity: 0.6 }
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setModalVisible(true);
          }}
        >
          <IconSymbol name="square.and.pencil" size={24} color={isDark ? '#0A84FF' : '#007AFF'} />
        </Pressable>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            chat={item}
            currentUserId={currentUser?.id || ''}
            users={users}
            unreadCount={unreadCounts.get(item.id) || 0}
          />
        )}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={chats.length === 0 ? styles.emptyListContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedUsers([]);
        }}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalContent}>
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle">New Chat</ThemedText>
              <Pressable onPress={() => {
                setModalVisible(false);
                setSelectedUsers([]);
              }}>
                <IconSymbol name="xmark" size={24} color="#007AFF" />
              </Pressable>
            </ThemedView>

            <ThemedText style={styles.modalSubtitle}>
              Select users to chat with
            </ThemedText>

            <FlatList
              data={users.filter(user => user.id !== currentUser?.id)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserListItem
                  user={item}
                  onSelect={() => toggleUserSelection(item.id)}
                  isSelected={selectedUsers.includes(item.id)}
                />
              )}
              style={styles.userList}
            />

            <Pressable
              style={[
                styles.createButton,
                selectedUsers.length === 0 && styles.disabledButton
              ]}
              onPress={handleCreateChat}
              disabled={selectedUsers.length === 0}
            >
              <ThemedText style={styles.createButtonText}>
                Create Chat
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E1E1E1',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  newChatButton: {
    padding: 4,
  },
  listContainer: {
    flexGrow: 1,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#8F8F8F',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalSubtitle: {
    marginBottom: 10,
  },
  userList: {
    maxHeight: 400,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
