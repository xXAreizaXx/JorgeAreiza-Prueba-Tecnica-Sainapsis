// React
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ListRenderItemInfo,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

// Expo
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

// Components
import { MessageBubble } from '@/components/MessageBubble';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Data
import { messageRepository } from '@/core/data/repositories';

// Domain
import { Message } from '@/core/domain/entities/Message';

// Hooks
import { useAppContext } from '@/hooks/AppContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function SearchMessagesScreen() {
  const { chatId } = useLocalSearchParams<{ chatId?: string }>();
  const { currentUser } = useAppContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const searchResults = await messageRepository.searchMessages({
        searchTerm: text.trim(),
        chatId: chatId || undefined,
        limit: 50,
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchText);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText, handleSearch]);

  const renderMessage = useCallback(
    ({ item }: ListRenderItemInfo<Message>) => (
      <MessageBubble
        message={item}
        isCurrentUser={item.senderId === currentUser?.id}
      />
    ),
    [currentUser?.id]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Search Messages',
          headerLeft: () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
            >
              <IconSymbol
                name="chevron.left"
                size={20}
                color={isDark ? '#0A84FF' : '#007AFF'}
              />
            </Pressable>
          ),
          headerStyle: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
          },
        }}
      />

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' },
        ]}
      >
        <IconSymbol name="magnifyingglass" size={20} color="#8F8F8F" />
        <TextInput
          style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#000000' }]}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search messages..."
          placeholderTextColor="#8F8F8F"
          returnKeyType="search"
          autoFocus
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => {
            setSearchText('');
            setResults([]);
          }}>
            <IconSymbol name="xmark.circle.fill" size={20} color="#8F8F8F" />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderMessage}
          contentContainerStyle={styles.resultsContainer}
        />
      ) : searchText.trim() ? (
        <View style={styles.centerContainer}>
          <IconSymbol name="magnifyingglass" size={64} color="#8F8F8F" />
          <ThemedText style={styles.emptyTitle}>No Results</ThemedText>
          <ThemedText style={styles.emptyText}>
            No messages found for "{searchText}"
          </ThemedText>
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <IconSymbol name="magnifyingglass" size={64} color="#8F8F8F" />
          <ThemedText style={styles.emptyTitle}>Search Messages</ThemedText>
          <ThemedText style={styles.emptyText}>
            Enter a search term to find messages
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  resultsContainer: {
    padding: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#8F8F8F',
    marginTop: 8,
    textAlign: 'center',
  },
});
