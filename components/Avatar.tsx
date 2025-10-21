import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { User } from '@/hooks/useUser';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface AvatarProps {
  user?: User;
  size?: number;
  showStatus?: boolean;
}

const getInitials = (name?: string): string => {
  if (!name) return '?';
  
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export function Avatar({ user, size = 40, showStatus = true }: AvatarProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme || 'dark'].tabIconSelected;
  const initials = getInitials(user?.name);
  
  const statusColors = {
    online: '#4CAF50',
    offline: '#9E9E9E',
    away: '#FFC107',
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2, backgroundColor }
        ]}
      >
        <ThemedText style={[
          styles.initials,
          { 
            fontSize: size * 0.4,
            lineHeight: size * 0.4 * 1.2,
          }
        ]}>
          {initials}
        </ThemedText>
      </View>
      {showStatus && user?.status && (
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor: statusColors[user.status],
              width: size / 4,
              height: size / 4,
              borderRadius: size / 8,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'white',
  },
}); 