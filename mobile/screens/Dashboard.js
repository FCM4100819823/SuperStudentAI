import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';

const Dashboard = ({ navigation, route }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchUserProfile = async () => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        navigation.replace('Login');
        return;
      }
      
      const idToken = await user.getIdToken();
        // Replace with your actual backend URL
      const backendUrl = 'http://10.0.2.2:5000'; // Use emulator/LAN IP for backend
      const response = await fetch(`${backendUrl}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error fetching profile');
      }
      
      setProfileData(data.user);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (err) {
      Alert.alert('Logout Failed', err.message);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    
    // Refresh profile when returning from profile edit screen
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.refreshProfile) {
        fetchUserProfile();
        // Clear the param to prevent unnecessary refreshes
        navigation.setParams({ refreshProfile: undefined });
      }
    });

    return unsubscribe;
  }, [navigation, route]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4169E1" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color="#FF6347" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SuperStudent AI</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileContainer}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {profileData?.name ? profileData.name.substring(0, 2).toUpperCase() : 'ST'}
          </Text>
        </View>
        <Text style={styles.welcomeText}>Welcome, {profileData?.name || 'Student'}!</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Your Profile</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={24} color="#4169E1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{profileData?.name || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={24} color="#4169E1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profileData?.email || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="school" size={24} color="#4169E1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>University</Text>
              <Text style={styles.infoValue}>{profileData?.university || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="class" size={24} color="#4169E1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Major</Text>
              <Text style={styles.infoValue}>{profileData?.major || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="looks-one" size={24} color="#4169E1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Level</Text>
              <Text style={styles.infoValue}>{profileData?.level || 'Not available'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={24} color="#4169E1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Graduation Year</Text>
              <Text style={styles.infoValue}>{profileData?.graduationYear || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="cake" size={24} color="#4169E1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{profileData?.age || 'Not available'}</Text>
            </View>
          </View>
        </View>
      </View>      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => navigation.navigate('ProfileEdit', { profileData })}
      >
        <MaterialIcons name="edit" size={20} color="#fff" />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Academic Dashboard</Text>
        <View style={styles.comingSoonCard}>
          <MaterialIcons name="school" size={50} color="#C0C0C0" />
          <Text style={styles.comingSoonText}>Coming Soon</Text>
          <Text style={styles.comingSoonDesc}>
            Your academic progress, assignments, and AI-powered study recommendations will appear here.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4169E1',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FF6347',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4169E1',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#4169E1',
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    marginLeft: 5,
  },
  profileContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4169E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  infoSection: {
    padding: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#4169E1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  comingSoonCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
  },
  comingSoonDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  }
});

export default Dashboard;
