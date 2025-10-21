import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Message } from '@/core/domain/entities/Message';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

interface MessageEditModalProps {
  visible: boolean;
  message: Message | null;
  onClose: () => void;
  onSave: (messageId: string, newText: string) => Promise<void>;
}

export function MessageEditModal({
  visible,
  message,
  onClose,
  onSave,
}: MessageEditModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [editedText, setEditedText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (message) {
      setEditedText(message.text);
    }
  }, [message]);

  const handleSave = async () => {
    if (!message || !editedText.trim() || editedText === message.text) {
      return;
    }

    try {
      setSaving(true);
      await onSave(message.id, editedText.trim());
      onClose();
    } catch (error) {
      console.error('Error saving edited message:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setEditedText('');
    onClose();
  };

  if (!message) return null;

  const isSaveDisabled = !editedText.trim() || editedText === message.text || saving;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <ThemedView style={[
          styles.modalContent,
          { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }
        ]}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Edit Message</ThemedText>
            <Pressable onPress={handleClose}>
              <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
            </Pressable>
          </View>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#2A2C33' : '#F0F0F0',
                color: isDark ? '#FFFFFF' : '#000000',
              }
            ]}
            value={editedText}
            onChangeText={setEditedText}
            placeholder="Edit your message..."
            placeholderTextColor={isDark ? '#8F8F8F' : '#999999'}
            multiline
            maxLength={1000}
            autoFocus
          />

          <View style={styles.footer}>
            <ThemedText style={styles.charCount}>
              {editedText.length}/1000
            </ThemedText>
            <Pressable
              style={[
                styles.saveButton,
                isSaveDisabled && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={isSaveDisabled}
            >
              <ThemedText style={[
                styles.saveButtonText,
                isSaveDisabled && styles.saveButtonTextDisabled
              ]}>
                {saving ? 'Saving...' : 'Save'}
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 200,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  charCount: {
    fontSize: 12,
    opacity: 0.6,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999999',
  },
});
