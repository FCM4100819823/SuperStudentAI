import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { auth, firestoreDb } from '../config/firebase';

// Static colors for now
const STATIC_COLORS = {
  primary: '#6E3BFF',
  background: '#F0F2F5',
  card: '#FFFFFF',
  text: '#1A1A1A',
  subtext: '#595959',
  accent: '#4CAF50',
  error: '#F44336',
  white: '#FFFFFF',
  lightBorder: '#E0E0E0',
  disabled: '#BDBDBD',
};

const getStyles = (colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, padding: 20 },
    headerTitle: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 10,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.subtext,
      marginBottom: 20,
      textAlign: 'center',
    },
    inputContainer: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 15,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    inputLabel: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
      fontWeight: '500',
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.lightBorder,
      marginBottom: 15,
    },
    datePickerButton: {
      backgroundColor: colors.lightBorder,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 15,
    },
    datePickerButtonText: { fontSize: 16, color: colors.primary },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 10,
    },
    buttonText: { color: colors.white, fontSize: 17, fontWeight: 'bold' },
    listTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      marginTop: 20,
      marginBottom: 10,
    },
    activityItem: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    activityDetails: { flex: 1 },
    activityType: { fontSize: 17, fontWeight: 'bold', color: colors.text },
    activityInfo: { fontSize: 14, color: colors.subtext },
    activityActions: { flexDirection: 'row' },
    actionButton: { padding: 8, marginLeft: 10 },
    emptyListText: {
      textAlign: 'center',
      color: colors.subtext,
      marginTop: 20,
      fontSize: 16,
    },
    backButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 40 : 20,
      left: 20,
      zIndex: 1,
      padding: 10,
    },
  });

const ACTIVITY_TYPES = [
  'Walking',
  'Running',
  'Cycling',
  'Gym',
  'Swimming',
  'Yoga',
  'Other',
];

const ActivityTrackingScreen = ({ navigation }) => {
  const colors = STATIC_COLORS;
  const styles = getStyles(colors);
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
  const [duration, setDuration] = useState(''); // in minutes
  const [calories, setCalories] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingActivity, setEditingActivity] = useState(null); // null or activity object

  const userId = auth.currentUser?.uid;

  const fetchActivities = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const q = query(
        collection(firestoreDb, 'userActivities'),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
      );
      const querySnapshot = await getDocs(q);
      const userActivities = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setActivities(userActivities);
    } catch (error) {
      console.error('Error fetching activities: ', error);
      Alert.alert('Error', 'Could not fetch activities.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleSubmitActivity = async () => {
    if (!activityType || !duration) {
      Alert.alert('Missing Info', 'Please select activity type and duration.');
      return;
    }
    if (!userId) {
      Alert.alert(
        'Not Logged In',
        'You need to be logged in to save activities.',
      );
      return;
    }

    const activityData = {
      userId,
      activityType,
      duration: parseInt(duration, 10),
      calories: calories ? parseInt(calories, 10) : null,
      date: serverTimestamp(), // Store as server timestamp for consistency
      localDateString: date.toISOString().split('T')[0], // For easier querying by day if needed
    };

    try {
      if (editingActivity) {
        const activityRef = doc(
          firestoreDb,
          'userActivities',
          editingActivity.id,
        );
        await updateDoc(activityRef, activityData);
        Alert.alert('Success', 'Activity updated!');
      } else {
        await addDoc(collection(firestoreDb, 'userActivities'), activityData);
        Alert.alert('Success', 'Activity logged!');
      }
      setActivityType(ACTIVITY_TYPES[0]);
      setDuration('');
      setCalories('');
      setDate(new Date());
      setEditingActivity(null);
      fetchActivities(); // Refresh list
    } catch (error) {
      console.error('Error saving activity: ', error);
      Alert.alert('Error', 'Could not save activity.');
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setActivityType(activity.activityType);
    setDuration(activity.duration.toString());
    setCalories(activity.calories ? activity.calories.toString() : '');
    // Date from Firestore timestamp needs conversion if you want to prefill date picker accurately
    // For simplicity, we'll use current date for editing, or you can store and parse localDateString
    setDate(
      activity.date.toDate
        ? activity.date.toDate()
        : new Date(activity.localDateString),
    );
  };

  const handleDelete = async (activityId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(firestoreDb, 'userActivities', activityId));
              Alert.alert('Deleted', 'Activity removed.');
              fetchActivities();
            } catch (error) {
              console.error('Error deleting activity: ', error);
              Alert.alert('Error', 'Could not delete activity.');
            }
          },
        },
      ],
    );
  };

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityDetails}>
        <Text style={styles.activityType}>{item.activityType}</Text>
        <Text style={styles.activityInfo}>Duration: {item.duration} mins</Text>
        {item.calories && (
          <Text style={styles.activityInfo}>
            Calories: {item.calories} kcal
          </Text>
        )}
        <Text style={styles.activityInfo}>
          Date:{' '}
          {item.date.toDate
            ? item.date.toDate().toLocaleDateString()
            : new Date(item.localDateString).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.activityActions}>
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          style={styles.actionButton}
        >
          <Ionicons name="pencil-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={styles.actionButton}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back-outline" size={30} color={colors.primary} />
      </TouchableOpacity>
      <ScrollView style={styles.container}>
        <Text style={styles.headerTitle}>Track Your Activity</Text>
        <Text style={styles.headerSubtitle}>
          Log your workouts and stay active.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Activity Type</Text>
          {/* Simple Picker replacement for now, consider a modal or dedicated component for better UX */}
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}
          >
            {ACTIVITY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.input,
                  {
                    marginRight: 5,
                    marginBottom: 5,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                  },
                  activityType === type && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setActivityType(type)}
              >
                <Text style={activityType === type && { color: colors.white }}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 30"
            keyboardType="numeric"
            value={duration}
            onChangeText={setDuration}
          />
          <Text style={styles.inputLabel}>Calories Burned (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 300"
            keyboardType="numeric"
            value={calories}
            onChangeText={setCalories}
          />
          <Text style={styles.inputLabel}>Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.datePickerButton}
          >
            <Text style={styles.datePickerButtonText}>
              {date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()} // Users can't log future activities
            />
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmitActivity}
          >
            <Text style={styles.buttonText}>
              {editingActivity ? 'Update Activity' : 'Log Activity'}
            </Text>
          </TouchableOpacity>
          {editingActivity && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.subtext }]}
              onPress={() => {
                setEditingActivity(null);
                setActivityType(ACTIVITY_TYPES[0]);
                setDuration('');
                setCalories('');
                setDate(new Date());
              }}
            >
              <Text style={styles.buttonText}>Cancel Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.listTitle}>Recent Activities</Text>
        {loading ? (
          <Text>Loading activities...</Text>
        ) : activities.length > 0 ? (
          <FlatList
            data={activities}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false} // If inside ScrollView
          />
        ) : (
          <Text style={styles.emptyListText}>
            No activities logged yet. Add one above!
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ActivityTrackingScreen;
