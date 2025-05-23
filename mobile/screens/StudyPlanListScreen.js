import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios'; // Ensure axios is imported
import { auth, db } from '../firebaseConfig';
import { format, parseISO } from 'date-fns'; // For date formatting

// Define static colors and fonts directly
const STATIC_COLORS = {
  background: '#F0F4F8',
  surface: '#FFFFFF',
  primary: '#6A11CB',
  secondary: '#2575FC',
  text: '#1A2B4D',
  subtext: '#5A6B7C',
  placeholder: '#A0A0A0',
  border: '#E0E6F0',
  error: '#D32F2F',
  success: '#28A745',
  buttonText: '#FFFFFF',
  card: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  icon: '#1A2B4D',
  accent: '#FFD700', // Example accent
};

const STATIC_FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
};

// const API_URL = 'http://172.20.10.2:5000'; // Ensure this is correct or use a config
const API_URL = 'http://192.168.1.10:5000'; // Example: Replace with your actual backend IP

const StudyPlanListScreen = () => {
  const navigation = useNavigation();
  const colors = STATIC_COLORS; // USE STATIC
  const fonts = STATIC_FONTS; // USE STATIC
  const styles = getStyles(colors, fonts);

  const [studyPlans, setStudyPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStudyPlans = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Authentication Error", "No user logged in.");
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();
      const response = await axios.get(`${API_URL}/study-plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudyPlans(response.data);
    } catch (error) {
      console.error("Error fetching study plans:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to fetch study plans. " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchStudyPlans();
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStudyPlans();
  }, []);

  const handleDeletePlan = async (planId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Authentication Error", "No user logged in. Please log in again.");
        return;
      }
      const token = await user.getIdToken();
      e
      const response = await axios.delete(`${API_URL}/study-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 || response.status === 204) {
        Alert.alert("Success", "Study plan deleted successfully.");
        fetchStudyPlans(); // Refresh the list
      } else {
        // Attempt to parse backend error message if available
        const errorMessage = response.data?.message || "Failed to delete study plan. Please try again.";
        Alert.alert("Deletion Failed", errorMessage);
      }
    } catch (error) {
      console.error("Error deleting study plan:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || "An unexpected error occurred. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  const confirmDelete = (planId) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this study plan? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => handleDeletePlan(planId),
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const renderStudyPlanItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('StudyPlanDetailScreen', { planId: item.id })} // Navigate to detail screen
    >
      <View style={styles.itemIconContainer}>
        <Ionicons name="book-outline" size={24} color={colors.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {item.subject && <Text style={styles.itemSubtitle}>Subject: {item.subject}</Text>}
        {item.goal && <Text style={styles.itemSubtitle} numberOfLines={2}>Goal: {item.goal}</Text>}
        {item.startDate && (
          <Text style={styles.itemDate}>
            Starts: {format(parseISO(item.startDate), 'MMM dd, yyyy')}
          </Text>
        )}
        {item.endDate && (
          <Text style={styles.itemDate}>
            Ends: {format(parseISO(item.endDate), 'MMM dd, yyyy')}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={24} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Study Plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Study Plans</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateStudyPlan')} style={styles.addButton}>
          <Ionicons name="add-circle" size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {studyPlans.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="documents-outline" size={80} color={colors.placeholder} />
          <Text style={styles.emptyText}>No study plans yet.</Text>
          <Text style={styles.emptySubText}>Tap the '+' button to create your first plan!</Text>
        </View>
      ) : (
        <FlatList
          data={studyPlans}
          renderItem={renderStudyPlanItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </View>
  );
};

const getStyles = (colors, fonts) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? 35 : 50,
    paddingBottom: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  addButton: {
    padding: 5,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  itemIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20', // Light primary background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 3,
  },
  itemSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.subtext,
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.secondary,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8, // Make it easier to tap
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: fonts.medium,
    color: colors.placeholder,
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.subtext,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default StudyPlanListScreen;
