import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from './ThemedText';
import { Avatar } from './Avatar';
import { IconSymbol } from './ui/IconSymbol';
import { User } from '@/hooks/useUser';
import { useColorScheme } from '@/hooks/useColorScheme';

interface UserListItemProps {
  user: User;
  onSelect?: (user: User) => void;
  isSelected?: boolean;
}

export function UserListItem({ user, onSelect, isSelected }: UserListItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const handlePress = () => {
    if (onSelect) {
      onSelect(user);
    }
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
        isSelected && styles.selectedContainer,
        pressed && { opacity: 0.7 },
      ]} 
      onPress={handlePress}
    >
      <Avatar user={user} size={56} />
      <View style={styles.infoContainer}>
        <ThemedText style={styles.nameText}>{user.name}</ThemedText>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot,
            { backgroundColor: user.status === 'online' ? '#34C759' : '#8F8F8F' }
          ]} />
          <ThemedText style={styles.statusText}>
            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
          </ThemedText>
        </View>
      </View>
      <IconSymbol 
        name="chevron.right" 
        size={20} 
        color="#8F8F8F" 
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
  },
  selectedContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  infoContainer: {
    marginLeft: 16,
    flex: 1,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#8F8F8F',
  },
}); 