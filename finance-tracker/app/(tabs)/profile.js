import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';

const API_URL = 'https://67ac71475853dfff53dab929.mockapi.io/api/v1';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Using ID 1 as an example - in a real app, this would come from authentication
      const response = await fetch(`${API_URL}/users/1`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      setUser({
        id: data.id,
        name: data.username,
        email: data.email || data.username,
        avatar: 'https://images.pexels.com/photos/4386442/pexels-photo-4386442.jpeg', // Using a default avatar since the API doesn't provide one
      });
      setError(null);
    } catch (err) {
      setError('Failed to load profile. Please try again later.');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>Profile</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {error ? (
          <View style={[styles.errorCard, { backgroundColor: colors.error }]}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
              onPress={fetchUserData}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.profileSection}>
              <Image
                source={{ uri: user?.avatar }}
                style={styles.profileImage}
              />
              <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
              <Text style={[styles.email, { color: colors.textLight }]}>{user?.email}</Text>
            </View>

            <View style={[styles.settingsContainer, { backgroundColor: colors.card }]}>
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="person-outline" size={24} color={colors.primary} />
                  <Text style={[styles.settingText, { color: colors.text }]}>Edit Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                  <Text style={[styles.settingText, { color: colors.text }]}>Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="moon-outline" size={24} color={colors.primary} />
                  <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  errorCard: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
  },
  settingsContainer: {
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
}); 