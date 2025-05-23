import React, { useState, useEffect, useContext } from 'react';
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
import { auth, firestore as db } from '../firebaseConfig';
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
        setError('You are not logged in. Please log in again.');
        return;
      }
      const idToken = await user.getIdToken();
      const backendUrl = 'http://172.20.10.2:5000';
      const response = await fetch(`${backendUrl}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        timeout: 10000 // 10 seconds
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error fetching profile');
      }
      setProfileData(data.user);
    } catch (err) {
      if (err.message && err.message.includes('Network request failed')) {
        setError('Cannot connect to backend. Make sure your server is running and accessible from the emulator.');
      } else if (err.message && err.message.includes('timeout')) {
        setError('Network request timed out. Check your backend connection.');
      } else {
        setError(err.message || 'Failed to load profile data');
      }
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
    let unsubscribeFirestore;
    const user = auth.currentUser;
    if (user) {
      // Listen to Firestore user document for real-time updates
      // console.log('Dashboard.js: Imported firestore object:', db); // Use db consistently
      unsubscribeFirestore = db.collection('users').doc(user.uid)
        .onSnapshot(doc => {
          if (doc.exists) {
            setProfileData(doc.data());
            setLoading(false);
          }
        }, err => {
          setError('Failed to sync profile in real-time.');
        });
    }
    fetchUserProfile();
    // Refresh profile when returning from profile edit screen
    const unsubscribeNav = navigation.addListener('focus', () => {
      if (route.params?.refreshProfile) {
        fetchUserProfile();
        navigation.setParams({ refreshProfile: undefined });
      }
    });
    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      unsubscribeNav();
    };
  }, [navigation, route]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color="#FF3B30" />
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SuperStudent AI</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#FFFFFF" />
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
            <MaterialIcons name="person" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{profileData?.name || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profileData?.email || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="school" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>University</Text>
              <Text style={styles.infoValue}>{profileData?.university || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="class" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Major</Text>
              <Text style={styles.infoValue}>{profileData?.major || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="looks-one" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Level</Text>
              <Text style={styles.infoValue}>{profileData?.level || 'Not available'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Graduation Year</Text>
              <Text style={styles.infoValue}>{profileData?.graduationYear || 'Not available'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="cake" size={24} color="#007AFF" />
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
        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Academic Dashboard</Text>
        <View style={styles.gridContainer}>
          {/* Study Plans Card */}
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('StudyPlanList')}>
            <MaterialIcons name="library-books" size={30} color="#007AFF" />
            <Text style={styles.gridItemText}>Study Plans</Text>
          </TouchableOpacity>

          {/* Spaced Repetition Card */}
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('SpacedRepetition')}>
            <MaterialIcons name="cached" size={30} color="#007AFF" />
            <Text style={styles.gridItemText}>SRS Review</Text>
          </TouchableOpacity>

          {/* Focus Timer Card */}
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('FocusTimer')}>
            <MaterialIcons name="timer" size={30} color="#007AFF" />
            <Text style={styles.gridItemText}>Focus Timer</Text>
          </TouchableOpacity>

          {/* Placeholder for Calendar/Schedule */}
          <TouchableOpacity style={styles.gridItem} onPress={() => Alert.alert("Coming Soon!", "Calendar and schedule integration is under development.")}>
            <MaterialIcons name="calendar-today" size={30} color="#007AFF" />
            <Text style={styles.gridItemText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* File Upload Button */}
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => navigation.navigate('FileUpload')}
      >
        <MaterialIcons name="cloud-upload" size={22} color="#FFFFFF" />
        <Text style={styles.uploadButtonText}>Upload File for AI Parsing</Text>
      </TouchableOpacity>

      {/* AI Assistant Button */}
      <TouchableOpacity 
        style={styles.aiButton}
        onPress={() => navigation.navigate('AI')}
      >
        <MaterialIcons name="smart-toy" size={22} color="#FFFFFF" />
        <Text style={styles.aiButtonText}>Ask SuperStudent AI</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F0F0',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    marginLeft: 5,
  },
  profileContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
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
    color: '#333333',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#CCCCCC',
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#777777',
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    elevation: 3,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  gridItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    margin: 5,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridItemText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  aiButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 30,
    margin: 20,
    elevation: 3,
    shadowColor: '#000',
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  },
  uploadButton: {
    backgroundColor: '#FF9500',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  }
});

export default Dashboard;
