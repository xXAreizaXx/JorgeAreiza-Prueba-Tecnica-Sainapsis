import { Avatar } from '@/components/Avatar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAppContext } from '@/hooks/AppContext';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, View, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ProfileScreen() {
  const { currentUser, logout } = useAppContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logout();
  };

  if (!currentUser) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading user profile...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ThemedView style={styles.profileHeader}>
          <Avatar user={currentUser} size={120} />
          <ThemedText style={styles.profileName}>{currentUser.name}</ThemedText>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot,
              { backgroundColor: currentUser.status === 'online' ? '#34C759' : '#8F8F8F' }
            ]} />
            <ThemedText style={styles.statusText}>
              {currentUser.status.charAt(0).toUpperCase() + currentUser.status.slice(1)}
            </ThemedText>
          </View>
        </ThemedView>
        
        {/* Info Cards */}
        <View style={styles.cardsContainer}>
          {/* Account Info Card */}
          <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.cardHeader}>
              <IconSymbol name="person.circle.fill" size={24} color={isDark ? '#0A84FF' : '#007AFF'} />
              <ThemedText style={styles.cardTitle}>Account Information</ThemedText>
            </View>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>User ID</ThemedText>
              <ThemedText style={styles.infoValue}>{currentUser.id}</ThemedText>
            </View>
            
            <View style={[styles.infoRow, styles.lastInfoRow]}>
              <ThemedText style={styles.infoLabel}>Full Name</ThemedText>
              <ThemedText style={styles.infoValue}>{currentUser.name}</ThemedText>
            </View>
          </View>
          
          {/* Settings Card */}
          <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.cardHeader}>
              <IconSymbol name="gear" size={24} color={isDark ? '#0A84FF' : '#007AFF'} />
              <ThemedText style={styles.cardTitle}>Settings</ThemedText>
            </View>
            
            <Pressable 
              style={({ pressed }) => [
                styles.settingRow,
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="bell.fill" size={20} color="#8F8F8F" />
                <ThemedText style={styles.settingText}>Notifications</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#8F8F8F" />
            </Pressable>
            
            <View style={styles.divider} />
            
            <Pressable 
              style={({ pressed }) => [
                styles.settingRow,
                styles.lastSettingRow,
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <View style={styles.settingLeft}>
                <IconSymbol name="lock.fill" size={20} color="#8F8F8F" />
                <ThemedText style={styles.settingText}>Privacy</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#8F8F8F" />
            </Pressable>
          </View>
        </View>
        
        {/* Logout Button */}
        <View style={styles.buttonContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && { opacity: 0.8 }
            ]} 
            onPress={handleLogout}
          >
            <IconSymbol name="arrow.right.square.fill" size={22} color="#FFFFFF" />
            <ThemedText style={styles.logoutText}>Log Out</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 15,
    color: '#8F8F8F',
  },
  cardsContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E1E1E1',
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 15,
    color: '#8F8F8F',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  lastSettingRow: {
    paddingBottom: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E1E1E1',
    marginVertical: 4,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 100,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
