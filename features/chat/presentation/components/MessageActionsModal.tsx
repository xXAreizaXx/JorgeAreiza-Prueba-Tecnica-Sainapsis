import React from 'react';
import { Modal, View, StyleSheet, Pressable, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Message } from '@/core/domain/entities/Message';
import { useColorScheme } from '@/hooks/useColorScheme';

interface MessageActionsModalProps {
  visible: boolean;
  message: Message | null;
  onClose: () => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  canEdit: boolean;
}

export function MessageActionsModal({
  visible,
  message,
  onClose,
  onEdit,
  onDelete,
  canEdit,
}: MessageActionsModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!message) return null;

  const handleEdit = () => {
    onClose();
    onEdit(message);
  };

  const handleDelete = () => {
    onClose();
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(message),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContainer}>
          <ThemedView style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#2A2C33' : '#FFFFFF' }
          ]}>
            {canEdit && (
              <Pressable style={styles.actionButton} onPress={handleEdit}>
                <IconSymbol name="pencil" size={20} color="#007AFF" />
                <ThemedText style={styles.actionText}>Edit Message</ThemedText>
              </Pressable>
            )}
            
            <Pressable style={styles.actionButton} onPress={handleDelete}>
              <IconSymbol name="trash" size={20} color="#FF3B30" />
              <ThemedText style={[styles.actionText, styles.deleteText]}>
                Delete Message
              </ThemedText>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={onClose}>
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxWidth: 300,
  },
  modalContent: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E1E1E1',
  },
  actionText: {
    fontSize: 16,
  },
  deleteText: {
    color: '#FF3B30',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
