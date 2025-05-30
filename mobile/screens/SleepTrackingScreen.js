import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView, ScrollView, Platform, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, firestoreDb } from '../config/firebase';

// Static colors for now
const STATIC_COLORS = {
  primary: '#3498DB', // A calming blue
  background: '#F0F2F5',
  card: '#FFFFFF',
  text: '#1A1A1A',
  subtext: '#595959',
  accent: '#58D68D',
  error: '#E74C3C',
  white: '#FFFFFF',
  lightBorder: '#E0E0E0',
  darkBlueText: '#2C3E50', // For titles
  lightBlueBackground: '#EBF5FB'
};

const getStyles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: colors.darkBlueText, marginBottom: 10, textAlign: 'center' },
  headerSubtitle: { fontSize: 16, color: colors.subtext, marginBottom: 20, textAlign: 'center' },
  inputContainer: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputLabel: { fontSize: 16, color: colors.text, marginBottom: 8, fontWeight: '500' },
  input: {
    backgroundColor: colors.lightBlueBackground,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    marginBottom: 15,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  timePickerButton: {
    backgroundColor: colors.lightBorder,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  timePickerButtonText: { fontSize: 16, color: colors.primary, fontWeight: 'bold' },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: 'bold' },
  listTitle: { fontSize: 20, fontWeight: 'bold', color: colors.darkBlueText, marginTop: 20, marginBottom: 10 },
  sleepEntryItem: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sleepDetails: { flex: 1 },
  sleepDate: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  sleepInfo: { fontSize: 14, color: colors.subtext },
  sleepQuality: { fontSize: 14, color: colors.primary, fontStyle: 'italic' },
  sleepActions: { flexDirection: 'row' },
  actionButton: { padding: 8, marginLeft: 10 }, 
  emptyListText: { textAlign: 'center', color: colors.subtext, marginTop: 20, fontSize: 16 },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  qualitySelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  qualityButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lightBorder,
  },
  selectedQualityButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  qualityButtonText: {
    fontSize: 14,
    color: colors.subtext,
  },
  selectedQualityButtonText: {
    color: colors.white,
  },
});

const SLEEP_QUALITIES = ['Poor', 'Fair', 'Good', 'Excellent'];

const SleepTrackingScreen = ({ navigation }) => {
  const colors = STATIC_COLORS;
  const styles = getStyles(colors);

  const [sleepTime, setSleepTime] = useState(new Date());
  const [wakeTime, setWakeTime] = useState(new Date());
  const [showSleepPicker, setShowSleepPicker] = useState(false);
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [sleepQuality, setSleepQuality] = useState(SLEEP_QUALITIES[2]); // Default to 'Good'
  const [notes, setNotes] = useState('');
  const [sleepEntries, setSleepEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);

  const userId = auth.currentUser?.uid;

  const fetchSleepEntries = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const q = query(
        collection(firestoreDb, 'userSleepEntries'),
        where('userId', '==', userId),
        orderBy('sleepDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSleepEntries(entries);
    } catch (error) {
      console.error("Error fetching sleep entries: ", error);
      Alert.alert("Error", "Could not fetch sleep records.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSleepEntries();
  }, [userId]);

  const handleTimeChange = (event, selectedTime, type) => {
    const currentTime = selectedTime || (type === 'sleep' ? sleepTime : wakeTime);
    if (Platform.OS === 'ios') {
        if (type === 'sleep') setShowSleepPicker(true);
        else setShowWakePicker(true);
    } else {
        if (type === 'sleep') setShowSleepPicker(false);
        else setShowWakePicker(false);
    }

    if (type === 'sleep') {
      setSleepTime(currentTime);
    } else {
      setWakeTime(currentTime);
    }
  };

  const calculateSleepDuration = (start, end) => {
    let diff = end.getTime() - start.getTime();
    if (diff < 0) { // Woke up next day
        const nextDayEnd = new Date(end);
        nextDayEnd.setDate(nextDayEnd.getDate() + 1);
        diff = nextDayEnd.getTime() - start.getTime();
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleSubmitEntry = async () => {
    if (!userId) {
      Alert.alert("Not Logged In", "You need to be logged in.");
      return;
    }
    if (wakeTime <= sleepTime && !(wakeTime.getHours() < sleepTime.getHours())) {
        Alert.alert("Invalid Times", "Wake up time must be after sleep time.");
        return;
    }

    const duration = calculateSleepDuration(sleepTime, wakeTime);

    const entryData = {
      userId,
      sleepTime: sleepTime.toISOString(),
      wakeTime: wakeTime.toISOString(),
      sleepDate: serverTimestamp(), // Date of logging, could be start of sleep period
      localSleepDateString: sleepTime.toISOString().split('T')[0],
      duration,
      sleepQuality,
      notes,
    };

    try {
      if (editingEntry) {
        const entryRef = doc(firestoreDb, 'userSleepEntries', editingEntry.id);
        await updateDoc(entryRef, entryData);
        Alert.alert("Success", "Sleep entry updated!");
      } else {
        await addDoc(collection(firestoreDb, 'userSleepEntries'), entryData);
        Alert.alert("Success", "Sleep entry logged!");
      }
      resetForm();
      fetchSleepEntries();
    } catch (error) {
      console.error("Error saving sleep entry: ", error);
      Alert.alert("Error", "Could not save sleep entry.");
    }
  };
  
  const resetForm = () => {
    setSleepTime(new Date());
    setWakeTime(new Date());
    setSleepQuality(SLEEP_QUALITIES[2]);
    setNotes('');
    setEditingEntry(null);
  }

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setSleepTime(new Date(entry.sleepTime));
    setWakeTime(new Date(entry.wakeTime));
    setSleepQuality(entry.sleepQuality);
    setNotes(entry.notes || '');
  };

  const handleDelete = async (entryId) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this sleep entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await deleteDoc(doc(firestoreDb, 'userSleepEntries', entryId));
            Alert.alert("Deleted", "Sleep entry removed.");
            fetchSleepEntries();
          } catch (error) {
            console.error("Error deleting sleep entry: ", error);
            Alert.alert("Error", "Could not delete sleep entry.");
          }
        }
      }
    ]);
  };

  const renderSleepEntry = ({ item }) => (
    <View style={styles.sleepEntryItem}>
      <View style={styles.sleepDetails}>
        <Text style={styles.sleepDate}>{new Date(item.localSleepDateString).toLocaleDateString()}</Text>
        <Text style={styles.sleepInfo}>Slept: {new Date(item.sleepTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
        <Text style={styles.sleepInfo}>Woke: {new Date(item.wakeTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
        <Text style={styles.sleepInfo}>Duration: {item.duration}</Text>
        <Text style={styles.sleepQuality}>Quality: {item.sleepQuality}</Text>
        {item.notes && <Text style={styles.sleepInfo}>Notes: {item.notes}</Text>}
      </View>
      <View style={styles.sleepActions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
            <Ionicons name="pencil-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back-outline" size={30} color={colors.primary} />
      </TouchableOpacity>
      <ScrollView style={styles.container}>
        <Text style={styles.headerTitle}>Track Your Sleep</Text>
        <Text style={styles.headerSubtitle}>Log your sleep patterns for better insights.</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Went to Bed</Text>
          <TouchableOpacity onPress={() => setShowSleepPicker(true)} style={styles.timePickerButton}>
            <Text style={styles.timePickerButtonText}>{sleepTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
          </TouchableOpacity>
          {showSleepPicker && (
            <DateTimePicker
              value={sleepTime}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={(e, t) => handleTimeChange(e, t, 'sleep')}
            />
          )}

          <Text style={styles.inputLabel}>Woke Up</Text>
          <TouchableOpacity onPress={() => setShowWakePicker(true)} style={styles.timePickerButton}>
            <Text style={styles.timePickerButtonText}>{wakeTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
          </TouchableOpacity>
          {showWakePicker && (
            <DateTimePicker
              value={wakeTime}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={(e, t) => handleTimeChange(e, t, 'wake')}
            />
          )}

          <Text style={styles.inputLabel}>Sleep Quality</Text>
          <View style={styles.qualitySelectorContainer}>
            {SLEEP_QUALITIES.map(quality => (
              <TouchableOpacity 
                key={quality}
                style={[styles.qualityButton, sleepQuality === quality && styles.selectedQualityButton]}
                onPress={() => setSleepQuality(quality)}
              >
                <Text style={[styles.qualityButtonText, sleepQuality === quality && styles.selectedQualityButtonText]}>{quality}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, {height: 80}] }
            placeholder="e.g., Woke up a few times, felt restless"
            multiline
            value={notes}
            onChangeText={setNotes}
          />

          <TouchableOpacity style={styles.button} onPress={handleSubmitEntry}>
            <Text style={styles.buttonText}>{editingEntry ? 'Update Entry' : 'Log Sleep'}</Text>
          </TouchableOpacity>
          {editingEntry && (
            <TouchableOpacity style={[styles.button, {backgroundColor: colors.subtext}]} onPress={resetForm}>
                <Text style={styles.buttonText}>Cancel Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.listTitle}>Recent Sleep Entries</Text>
        {loading ? (
          <Text>Loading entries...</Text>
        ) : sleepEntries.length > 0 ? (
          <FlatList
            data={sleepEntries}
            renderItem={renderSleepEntry}
            keyExtractor={item => item.id}
            scrollEnabled={false} // If inside ScrollView
          />
        ) : (
          <Text style={styles.emptyListText}>No sleep entries yet. Sweet dreams!</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SleepTrackingScreen;
