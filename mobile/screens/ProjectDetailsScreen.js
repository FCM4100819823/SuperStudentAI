import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Assuming firebase config is in ../config/firebase.js
import { firestoreDb, auth } from '../config/firebase';
// Assuming STATIC_COLORS and a common getStyles utility, adjust path as necessary
// For example, from '../config/appConfig' or a dedicated styles file
import { STATIC_COLORS } from '../config/appConfig'; // Placeholder, ensure this is correct
import NoteInputModal from '../components/NoteInputModal'; // Import the modal
import SourceInputModal from '../components/SourceInputModal'; // Import SourceInputModal
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

// Placeholder for common styles utility if it exists and is structured like this
// const commonStyles = getStyles(STATIC_COLORS);
// If not, define styles directly or adapt from other screens.

const ProjectDetailsScreen = ({ route, navigation }) => {
  const { projectId, projectTitle } = route.params;
  const colors = STATIC_COLORS; // Use imported colors

  // Define styles inline or import if getStyles is not a shared utility
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerContainer: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardHeaderBackground || colors.card, // Added fallback
    },
    projectTitleText: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
    },
    tabContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.card,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
    },
    tabButton: {
      paddingVertical: 10,
      paddingHorizontal: 25, // Increased padding
      borderRadius: 25, // More rounded
    },
    activeTabButton: {
      backgroundColor: colors.primary,
    },
    tabButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSeco, // Using secondary text color
    },
    activeTabButtonText: {
      color: colors.white, // Ensuring contrast
    },
    scrollContentContainer: {
      padding: 20,
      flexGrow: 1,
    },
    contentSection: {
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      paddingLeft: 10,
    },
    placeholderText: {
      fontSize: 16,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: 20,
      fontStyle: 'italic',
    },
    // Common button style (example, adapt from your common styles if they exist)
    button: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 15,
      elevation: 2,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
    },
    buttonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    noteItem: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    noteText: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 5,
    },
    noteTimestamp: {
      fontSize: 12,
      color: colors.textLight,
      textAlign: 'right',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
    },
    noteActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
    },
    noteActionButton: {
      marginLeft: 15,
      padding: 5,
    },
    sourceItem: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 10,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.secondary, // Different color for sources
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    sourceTitle: {
      fontSize: 17,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    sourceDetailText: {
      fontSize: 14,
      color: colors.textSeco,
      marginBottom: 3,
    },
    sourceUrl: {
      fontSize: 14,
      color: colors.primary, // Make URL stand out
      textDecorationLine: 'underline',
      marginBottom: 5,
    },
    sourceNotes: {
      fontSize: 14,
      color: colors.textLight,
      fontStyle: 'italic',
      marginTop: 5,
    },
    sourceActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 10,
    },
    sourceActionButton: {
      marginLeft: 15,
      padding: 5,
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      borderRadius: 30,
      paddingVertical: 15,
      paddingHorizontal: 15,
      elevation: 5,
    },
    // Add other styles as needed from your common style guide
  });

  const [activeTab, setActiveTab] = useState('notes'); // 'notes' or 'sources'
  const [isNoteModalVisible, setNoteModalVisible] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [editingNote, setEditingNote] = useState(null); // For editing existing notes
  const [isSourceModalVisible, setSourceModalVisible] = useState(false);
  const [sources, setSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [editingSource, setEditingSource] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      title: projectTitle
        ? `Project: ${projectTitle.substring(0, 20)}...`
        : 'Project Details',
    });

    if (!auth.currentUser || !projectId) {
      setLoadingNotes(false);
      setLoadingSources(false);
      return;
    }

    // Notes Query (existing)
    const notesQuery = query(
      collection(firestoreDb, 'projectNotes'),
      where('projectId', '==', projectId),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
    );
    const unsubscribeNotes = onSnapshot(
      notesQuery,
      (querySnapshot) => {
        const fetchedNotes = [];
        querySnapshot.forEach((doc) => {
          fetchedNotes.push({ id: doc.id, ...doc.data() });
        });
        setNotes(fetchedNotes);
        setLoadingNotes(false);
      },
      (error) => {
        console.error('Error fetching notes: ', error);
        Alert.alert('Error', 'Could not fetch notes.');
        setLoadingNotes(false);
      },
    );

    // Sources Query
    const sourcesQuery = query(
      collection(firestoreDb, 'projectSources'),
      where('projectId', '==', projectId),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
    );
    const unsubscribeSources = onSnapshot(
      sourcesQuery,
      (querySnapshot) => {
        const fetchedSources = [];
        querySnapshot.forEach((doc) => {
          fetchedSources.push({ id: doc.id, ...doc.data() });
        });
        setSources(fetchedSources);
        setLoadingSources(false);
      },
      (error) => {
        console.error('Error fetching sources: ', error);
        Alert.alert('Error', 'Could not fetch sources.');
        setLoadingSources(false);
      },
    );

    return () => {
      unsubscribeNotes();
      unsubscribeSources();
    };
  }, [projectId, projectTitle, navigation]);

  const handleSaveNote = async (noteText) => {
    if (!auth.currentUser || !projectId) {
      Alert.alert('Error', 'Cannot save note. User or project is invalid.');
      return;
    }

    try {
      if (editingNote) {
        // Update existing note
        const noteRef = doc(firestoreDb, 'projectNotes', editingNote.id);
        await updateDoc(noteRef, {
          text: noteText,
          updatedAt: serverTimestamp(),
        });
        Alert.alert('Note Updated', 'Your note has been updated successfully.');
        setEditingNote(null);
      } else {
        // Add new note
        await addDoc(collection(firestoreDb, 'projectNotes'), {
          userId: auth.currentUser.uid,
          projectId: projectId,
          text: noteText,
          timestamp: serverTimestamp(),
        });
        Alert.alert('Note Saved', 'Your note has been saved successfully.');
      }
      setNoteModalVisible(false);
    } catch (error) {
      console.error('Error saving note: ', error);
      Alert.alert('Error', 'Could not save your note. Please try again.');
    }
  };

  const openEditNoteModal = (note) => {
    setEditingNote(note);
    setNoteModalVisible(true);
  };

  const handleDeleteNote = async (noteId) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(firestoreDb, 'projectNotes', noteId));
            Alert.alert('Note Deleted', 'The note has been deleted.');
          } catch (error) {
            console.error('Error deleting note: ', error);
            Alert.alert('Error', 'Could not delete the note.');
          }
        },
      },
    ]);
  };

  const handleSaveSource = async (sourceData) => {
    if (!auth.currentUser || !projectId) {
      Alert.alert('Error', 'Cannot save source. User or project is invalid.');
      return;
    }
    try {
      if (editingSource) {
        const sourceRef = doc(firestoreDb, 'projectSources', editingSource.id);
        await updateDoc(sourceRef, {
          ...sourceData,
          updatedAt: serverTimestamp(),
        });
        Alert.alert('Source Updated', 'Source has been updated successfully.');
        setEditingSource(null);
      } else {
        await addDoc(collection(firestoreDb, 'projectSources'), {
          userId: auth.currentUser.uid,
          projectId: projectId,
          ...sourceData,
          timestamp: serverTimestamp(),
        });
        Alert.alert('Source Saved', 'Source has been saved successfully.');
      }
      setSourceModalVisible(false);
    } catch (error) {
      console.error('Error saving source: ', error);
      Alert.alert('Error', 'Could not save the source. Please try again.');
    }
  };

  const openEditSourceModal = (source) => {
    setEditingSource(source);
    setSourceModalVisible(true);
  };

  const handleDeleteSource = async (sourceId) => {
    Alert.alert(
      'Delete Source',
      'Are you sure you want to delete this source?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(firestoreDb, 'projectSources', sourceId));
              Alert.alert('Source Deleted', 'The source has been deleted.');
            } catch (error) {
              console.error('Error deleting source: ', error);
              Alert.alert('Error', 'Could not delete the source.');
            }
          },
        },
      ],
    );
  };

  const renderNoteItem = ({ item }) => (
    <View style={styles.noteItem}>
      <Text style={styles.noteText}>{item.text}</Text>
      <Text style={styles.noteTimestamp}>
        {item.timestamp?.toDate().toLocaleDateString()}{' '}
        {item.timestamp?.toDate().toLocaleTimeString()}
      </Text>
      <View style={styles.noteActionsContainer}>
        <TouchableOpacity
          onPress={() => openEditNoteModal(item)}
          style={styles.noteActionButton}
        >
          <Ionicons name="pencil-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteNote(item.id)}
          style={styles.noteActionButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNotesSection = () => {
    if (loadingNotes) {
      return (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 20 }}
        />
      );
    }

    if (notes.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="documents-outline"
            size={60}
            color={colors.textLight}
          />
          <Text style={styles.placeholderText}>
            No notes added yet. Tap the button below to add your first note!
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={notes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }} // Add padding for FAB
      />
    );
  };

  const renderSourceItem = ({ item }) => (
    <View style={styles.sourceItem}>
      <Text style={styles.sourceTitle}>{item.title}</Text>
      {item.author ? (
        <Text style={styles.sourceDetailText}>Author: {item.author}</Text>
      ) : null}
      {item.sourceType ? (
        <Text style={styles.sourceDetailText}>Type: {item.sourceType}</Text>
      ) : null}
      {item.url ? (
        <TouchableOpacity
          onPress={() =>
            Linking.openURL(item.url).catch((err) =>
              console.error("Couldn't load page", err),
            )
          }
        >
          <Text style={styles.sourceUrl}>Link: {item.url}</Text>
        </TouchableOpacity>
      ) : null}
      {item.notes ? (
        <Text style={styles.sourceNotes}>Notes: {item.notes}</Text>
      ) : null}
      <Text style={styles.noteTimestamp}>
        Added: {item.timestamp?.toDate().toLocaleDateString()}
      </Text>
      <View style={styles.sourceActionsContainer}>
        <TouchableOpacity
          onPress={() => openEditSourceModal(item)}
          style={styles.sourceActionButton}
        >
          <Ionicons name="pencil-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteSource(item.id)}
          style={styles.sourceActionButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSourcesSection = () => {
    if (loadingSources) {
      return (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 20 }}
        />
      );
    }

    if (sources.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="library-outline" size={60} color={colors.textLight} />
          <Text style={styles.placeholderText}>
            No sources added yet. Tap the button below to add your first source!
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        data={sources}
        renderItem={renderSourceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }} // Add padding for FAB
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text
          style={styles.projectTitleText}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {projectTitle}
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'notes' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('notes')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'notes' && styles.activeTabButtonText,
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={18}
              color={activeTab === 'notes' ? colors.white : colors.textSeco}
            />{' '}
            Notes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'sources' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('sources')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'sources' && styles.activeTabButtonText,
            ]}
          >
            <Ionicons
              name="bookmark-outline"
              size={18}
              color={activeTab === 'sources' ? colors.white : colors.textSeco}
            />{' '}
            Sources
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {' '}
        {/* Wrap ScrollView/FlatList area to contain FAB correctly */}
        {activeTab === 'notes' ? (
          renderNotesSection()
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContentContainer}>
            {renderSourcesSection()}
          </ScrollView>
        )}
      </View>

      {/* FAB for Notes */}
      {activeTab === 'notes' && (
        <TouchableOpacity
          style={[
            styles.button,
            styles.fab,
            { backgroundColor: colors.primary },
          ]}
          onPress={() => {
            setEditingNote(null);
            setNoteModalVisible(true);
          }}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* FAB for Sources */}
      {activeTab === 'sources' && (
        <TouchableOpacity
          style={[
            styles.button,
            styles.fab,
            { backgroundColor: colors.secondary },
          ]} // Different color for source FAB
          onPress={() => {
            setEditingSource(null);
            setSourceModalVisible(true);
          }}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      <NoteInputModal
        isVisible={isNoteModalVisible}
        onClose={() => {
          setNoteModalVisible(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        projectTitle={projectTitle}
        initialNote={editingNote}
      />

      <SourceInputModal
        isVisible={isSourceModalVisible}
        onClose={() => {
          setSourceModalVisible(false);
          setEditingSource(null);
        }}
        onSave={handleSaveSource}
        projectTitle={projectTitle}
        initialSource={editingSource}
      />
    </SafeAreaView>
  );
};

// Add FAB style to StyleSheet
const fabStyle = {
  position: 'absolute',
  bottom: 20,
  right: 20,
  borderRadius: 30,
  paddingVertical: 15,
  paddingHorizontal: 15,
  elevation: 5,
};

// Merge fabStyle into styles.fab (or create if not exists)
// This part needs to be handled carefully depending on how styles are structured.
// For this example, I'll assume you can add it directly or merge it in the component.
// A better way is to define it within the StyleSheet.create call.
// Let's adjust the FAB style directly in the TouchableOpacity for simplicity here.
// The styles.fab was referenced above, so it should be added to the StyleSheet.create call:
// Inside StyleSheet.create:
// fab: {
//   position: 'absolute',
//   bottom: 20,
//   right: 20,
//   borderRadius: 30,
//   paddingVertical: 15,
//   paddingHorizontal: 15,
//   elevation: 5,
// },

export default ProjectDetailsScreen;
