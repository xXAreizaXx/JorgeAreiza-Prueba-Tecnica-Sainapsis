import { Message, MessageStatus, MessageType } from '@/core/domain/entities/Message';
import { useColorScheme } from '@/hooks/useColorScheme';
import { formatTime } from '@/shared/utils/date.utils';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  onLongPress?: (message: Message) => void;
  onImagePress?: (imageUrl: string) => void;
}

export function MessageBubble({ 
  message, 
  isCurrentUser, 
  onLongPress,
  onImagePress 
}: MessageBubbleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isDeleted = message.type === MessageType.DELETED;
  const isEdited = Boolean(message.editedAt);
  const hasImage = message.type === MessageType.IMAGE && message.imageUrl;

  const renderStatusIcon = () => {
    const iconColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)';
    const readColor = '#34B7F1';
    const errorColor = '#FF3B30';

    switch (message.status) {
      case MessageStatus.SENDING:
        return (
          <View style={styles.statusIcon}>
            <IconSymbol name="clock" size={12} color={iconColor} />
          </View>
        );
      case MessageStatus.SENT:
        return (
          <View style={styles.statusIcon}>
            <IconSymbol name="checkmark" size={12} color={iconColor} />
          </View>
        );
      case MessageStatus.READ:
        return (
          <View style={styles.statusIconDouble}>
            <IconSymbol name="checkmark" size={12} color={readColor} />
            <IconSymbol name="checkmark" size={12} color={readColor} style={styles.secondCheck} />
          </View>
        );
      case MessageStatus.FAILED:
        return (
          <View style={styles.statusIcon}>
            <IconSymbol name="exclamationmark.circle" size={12} color={errorColor} />
          </View>
        );
      default:
        return null;
    }
  };

  const handleLongPress = () => {
    if (onLongPress && !isDeleted) {
      onLongPress(message);
    }
  };

  const handleImagePress = () => {
    if (onImagePress && message.imageUrl) {
      onImagePress(message.imageUrl);
    }
  };

  return (
    <Pressable
      style={[
        styles.container,
        isCurrentUser ? styles.selfContainer : styles.otherContainer
      ]}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      <View style={[
        styles.bubble,
        isCurrentUser 
          ? [styles.selfBubble, { backgroundColor: isDark ? '#235A4A' : '#0a7ea4' }]
          : [styles.otherBubble, { backgroundColor: isDark ? '#2A2C33' : '#FFFFFF' }],
        isDeleted && styles.deletedBubble
      ]}>
        {hasImage && (
          <Pressable onPress={handleImagePress}>
            <Image 
              source={{ uri: message.imageUrl }} 
              style={styles.image}
              resizeMode="cover"
            />
          </Pressable>
        )}
        <ThemedText style={[
          styles.messageText,
          isCurrentUser && !isDark && styles.selfMessageText,
          isDeleted && styles.deletedText
        ]}>
          {message.text}
        </ThemedText>
        {isEdited && !isDeleted && (
          <ThemedText style={styles.editedText}>(edited)</ThemedText>
        )}
        <View style={styles.timeContainer}>
          <ThemedText style={styles.timeText}>
            {formatTime(message.timestamp)}
          </ThemedText>
          {isCurrentUser && !isDeleted && renderStatusIcon()}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  selfContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selfBubble: {
    borderBottomRightRadius: 4,
    backgroundColor: '#007AFF',
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
    backgroundColor: '#E9E9EB',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#000000',
  },
  selfMessageText: {
    color: '#FFFFFF',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    opacity: 0.7,
    marginLeft: 4,
  },
  statusIcon: {
    marginLeft: 2,
  },
  statusIconDouble: {
    flexDirection: 'row',
    marginLeft: 2,
  },
  secondCheck: {
    marginLeft: -8,
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 16,
    marginBottom: 6,
  },
  deletedBubble: {
    opacity: 0.6,
  },
  deletedText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  editedText: {
    fontSize: 11,
    opacity: 0.6,
    fontStyle: 'italic',
    marginTop: 2,
  },
}); 