import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { firestore, auth } from '../config/firebase'; // Import Firebase configuration
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Consistent styling (can be imported from a shared styles file later)
const STATIC_COLORS = {
  primary: '#6A1B9A', // Deep Purple
  primaryDark: '#4A0072',
  primaryLight: '#9C4DCC',
  secondary: '#4CAF50', // Green
  accent: '#F59E0B', // Amber
  background: '#F4F6F8', // Light Gray
  surface: '#FFFFFF', // White
  text: '#1A202C', // Dark Gray / Black
  textSecondary: '#4A5568', // Medium Gray
  textMuted: '#718096', // Light Gray
  textOnPrimary: '#FFFFFF',
  border: '#E2E8F0', // Light Border
  placeholder: '#A0AEC0',
  danger: '#E53E3E', // Red for delete
};

const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: 'bold', color: STATIC_COLORS.primaryDark },
  h2: { fontSize: 24, fontWeight: 'bold', color: STATIC_COLORS.text, marginBottom: 16 },
  h3: { fontSize: 20, fontWeight: '600', color: STATIC_COLORS.primary, marginBottom: 8 },
  body: { fontSize: 16, color: STATIC_COLORS.textSecondary, lineHeight: 24 },
  caption: { fontSize: 14, color: STATIC_COLORS.textMuted },
  button: { fontSize: 16, fontWeight: 'bold', color: STATIC_COLORS.textOnPrimary },
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const ResearchOrganizationScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentProject, setCurrentProject] = useState(null); // For editing
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const userId = auth.currentUser?.uid;

  const fetchProjects = async () => {
    if (!userId) return;
    try {
      const q = query(collection(firestore, 'researchProjects'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const userProjects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(userProjects);
    } catch (error) {
      console.error("Error fetching projects: ", error);
      Alert.alert("Error", "Could not fetch research projects.");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [userId]);

  const handleAddProject = async () => {
    if (!projectName.trim()) {
      Alert.alert("Validation Error", "Project name cannot be empty.");
      return;
    }
    if (!userId) {
        Alert.alert("Authentication Error", "You must be logged in to add projects.");
        return;
    }

    try {
      if (currentProject) { // Editing existing project
        const projectRef = doc(firestore, 'researchProjects', currentProject.id);
        await updateDoc(projectRef, { name: projectName, description: projectDescription });
        Alert.alert("Success", "Project updated successfully!");
      } else { // Adding new project
        await addDoc(collection(firestore, 'researchProjects'), {
          userId,
          name: projectName,
          description: projectDescription,
          createdAt: new Date(),
        });
        Alert.alert("Success", "Project added successfully!");
      }
      setProjectName('');
      setProjectDescription('');
      setCurrentProject(null);
      setModalVisible(false);
      fetchProjects(); // Refresh list
    } catch (error) {
      console.error("Error adding/updating project: ", error);
      Alert.alert("Error", "Could not save project. " + error.message);
    }
  };

  const openEditModal = (project) => {
    setCurrentProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setCurrentProject(null);
    setProjectName('');
    setProjectDescription('');
    setModalVisible(true);
  };

  const handleDeleteProject = async (projectId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this project and all its associated notes and sources?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, 'researchProjects', projectId));
              // TODO: Optionally, delete associated notes and sources here
              Alert.alert("Success", "Project deleted successfully!");
              fetchProjects(); // Refresh list
            } catch (error) {
              console.error("Error deleting project: ", error);
              Alert.alert("Error", "Could not delete project.");
            }
          },
        },
      ]
    );
  };

  const renderProjectItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.projectItem}
      onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id, projectTitle: item.name })}
    >
      <View style={styles.projectItemContent}>
        <Text style={styles.projectItemTitle}>{item.name}</Text>
        <Text style={styles.projectItemDescription} numberOfLines={2}>{item.description || 'No description'}</Text>
        <Text style={styles.projectItemDate}>
          Created: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}
        </Text>
      </View>
      <View style={styles.projectItemActions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
          <Icon name="pencil-outline" size={22} color={STATIC_COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteProject(item.id)} style={styles.actionButton}>
          <Icon name="trash-outline" size={22} color={STATIC_COLORS.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back-outline" size={28} color={STATIC_COLORS.primary} />
          </TouchableOpacity>
          <Text style={TYPOGRAPHY.h1}>Research Organization</Text>
        </View>
        <Text style={styles.subHeader}>Manage your research projects, notes, and sources.</Text>

        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Icon name="add-circle-outline" size={24} color={STATIC_COLORS.textOnPrimary} />
          <Text style={styles.addButtonText}>Add New Project</Text>
        </TouchableOpacity>

        {projects.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Icon name="folder-open-outline" size={60} color={STATIC_COLORS.textMuted} />
            <Text style={styles.emptyStateText}>No research projects yet.</Text>
            <Text style={styles.emptyStateSubText}>Tap "Add New Project" to get started.</Text>
          </View>
        ) : (
          <FlatList
            data={projects}
            renderItem={renderProjectItem}
            keyExtractor={(item) => item.id}
            style={styles.projectList}
          />
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
            setCurrentProject(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>{currentProject ? 'Edit Project' : 'Add New Project'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Project Name (e.g., Thesis Chapter 1)"
                value={projectName}
                onChangeText={setProjectName}
                placeholderTextColor={STATIC_COLORS.placeholder}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Project Description (Optional)"
                value={projectDescription}
                onChangeText={setProjectDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor={STATIC_COLORS.placeholder}
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => {
                    setModalVisible(!modalVisible);
                    setCurrentProject(null);
                  }}
                >
                  <Text style={styles.textStyle}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSave]}
                  onPress={handleAddProject}
                >
                  <Text style={styles.textStyle}>{currentProject ? 'Save Changes' : 'Add Project'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STATIC_COLORS.background,
  },
  scrollContentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2, // Extra padding for FAB or bottom elements
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.sm,
  },
  subHeader: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    color: STATIC_COLORS.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: STATIC_COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addButtonText: {
    ...TYPOGRAPHY.button,
    marginLeft: SPACING.sm,
  },
  projectList: {
    marginTop: SPACING.md,
  },
  projectItem: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: STATIC_COLORS.secondary,
  },
  projectItemContent: {
    flex: 1,
  },
  projectItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: STATIC_COLORS.text,
    marginBottom: SPACING.xs,
  },
  projectItemDescription: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: STATIC_COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  projectItemDate: {
      fontSize: 12,
      color: STATIC_COLORS.textMuted,
      fontStyle: 'italic',
  },
  projectItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
  },
  emptyStateText: {
    ...TYPOGRAPHY.h3,
    color: STATIC_COLORS.textMuted,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptyStateSubText: {
    ...TYPOGRAPHY.body,
    color: STATIC_COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: SPACING.md,
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 20,
    padding: SPACING.lg,
    alignItems: 'stretch', // Changed from 'center'
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%', // Ensure modal is not too wide
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    color: STATIC_COLORS.primaryDark,
  },
  input: {
    height: 50,
    borderColor: STATIC_COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: 16,
    color: STATIC_COLORS.text,
    backgroundColor: STATIC_COLORS.background, // Light background for input
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top', // Align text to top for multiline
    paddingTop: SPACING.md,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute buttons evenly
    marginTop: SPACING.md,
  },
  button: {
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    elevation: 2,
    minWidth: 120, // Ensure buttons have a decent size
    alignItems: 'center', // Center text in button
  },
  buttonSave: {
    backgroundColor: STATIC_COLORS.primary,
  },
  buttonClose: {
    backgroundColor: STATIC_COLORS.textMuted, // A less prominent color for cancel
  },
  textStyle: {
    ...TYPOGRAPHY.button,
    textAlign: 'center',
  },
});

export default ResearchOrganizationScreen;
