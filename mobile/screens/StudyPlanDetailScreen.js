import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, FlatList, RefreshControl, Platform, TextInput, Modal, KeyboardAvoidingView
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import DateTimePicker
import { useTheme } from '../context/ThemeContext'; // Import useTheme

// Replace with your actual backend URL
const API_URL = 'http://172.20.10.3:5000/api'; // Or your deployed backend URL

const StudyPlanDetailScreen = ({ navigation }) => {
  const themeContext = useTheme() || {};
  const colors = themeContext.colors || {};
  const styles = getStyles(colors);

    const route = useRoute();
    const { planId } = route.params; // Removed planTitle from here, will be fetched
    const auth = getAuth();

    const [studyPlan, setStudyPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [optimizing, setOptimizing] = useState(false);

    // Add a new state for AI-generated suggestions
    const [aiOptimizedSuggestions, setAiOptimizedSuggestions] = useState(null);

    const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
    const [currentTask, setCurrentTask] = useState(null); // For editing
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskEstimatedHours, setNewTaskEstimatedHours] = useState('');

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerDate, setDatePickerDate] = useState(new Date());

    // Moved isValidDate outside of the component or ensure it doesn't use async/await if not needed
    const isValidDate = (d) => {
        return d instanceof Date && !isNaN(d.getTime()); // Use getTime() for robust validation
    }

    const fetchStudyPlanDetail = async () => {
        try {
            // setLoading(true); // setLoading is handled by the caller or initial state
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");
            const token = await user.getIdToken();

            const response = await axios.get(`${API_URL}/study-plans/${planId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudyPlan(response.data);
            // navigation.setOptions({ title: response.data.title || planTitle }); // Title set in custom header
        } catch (error) {
            console.error("Error fetching study plan detail:", error.response?.data || error.message);
            Alert.alert("Error", "Failed to fetch study plan details. " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true); // Set loading true when screen comes into focus
            fetchStudyPlanDetail();
        }, [planId, auth])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStudyPlanDetail();
    }, [planId, auth]);

    const openTaskModal = (task = null) => {
        setCurrentTask(task);
        if (task) {
            setNewTaskTitle(task.title);
            setNewTaskDescription(task.description || '');
            const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();
            setNewTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
            // Ensure date is valid before setting, otherwise use current date
            setDatePickerDate(isValidDate(dueDate) ? dueDate : new Date()); 
            setNewTaskEstimatedHours(task.estimatedHours?.toString() || '');
        } else {
            setNewTaskTitle('');
            setNewTaskDescription('');
            setNewTaskDueDate('');
            setDatePickerDate(new Date()); // Reset to current date for new tasks
            setNewTaskEstimatedHours('');
        }
        setIsTaskModalVisible(true);
    };

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || datePickerDate;
        setShowDatePicker(Platform.OS === 'ios'); // On iOS, the picker is a modal, so keep it open or handle dismissal via a button.
                                                // On Android, it dismisses automatically after selection.
        if (event.type === 'set') { // User confirmed the date selection
            setDatePickerDate(currentDate);
            const day = currentDate.getDate().toString().padStart(2, '0');
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const year = currentDate.getFullYear();
            setNewTaskDueDate(`${year}-${month}-${day}`);
            if (Platform.OS !== 'ios') { // Auto-hide on Android after selection
                setShowDatePicker(false);
            }
        } else if (event.type === 'dismissed') {
            setShowDatePicker(false);
        }
    };

    const showDatepickerMode = () => {
        setShowDatePicker(true);
    };

    const handleSaveTask = async () => {
        if (!newTaskTitle.trim()) {
            Alert.alert("Validation Error", "Task title is required.");
            return;
        }
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");
            const token = await user.getIdToken();

            const payload = {
                title: newTaskTitle.trim(),
                description: newTaskDescription.trim(),
                dueDate: newTaskDueDate || undefined,
                estimatedHours: newTaskEstimatedHours ? parseFloat(newTaskEstimatedHours) : undefined,
            };

            let response;
            if (currentTask) { // Editing existing task
                response = await axios.put(`${API_URL}/study-plans/${planId}/tasks/${currentTask._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStudyPlan(prev => ({
                    ...prev,
                    tasks: prev.tasks.map(t => t._id === currentTask._id ? response.data : t)
                }));
                Alert.alert("Success", "Task updated successfully!");
            } else { // Adding new task
                response = await axios.post(`${API_URL}/study-plans/${planId}/tasks`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStudyPlan(prev => ({
                    ...prev,
                    tasks: [...(prev?.tasks || []), response.data]
                }));
                Alert.alert("Success", "Task added successfully!");
            }
            
            setIsTaskModalVisible(false);
        } catch (error) {
            console.error(`Error ${currentTask ? 'updating' : 'adding'} task:`, error.response?.data || error.message);
            Alert.alert("Error", `Failed to ${currentTask ? 'update' : 'add'} task. ` + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteTask = async (taskId) => {
        Alert.alert("Delete Task", "Are you sure you want to delete this task? This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", onPress: async () => {
                    try {
                        const user = auth.currentUser;
                        if (!user) throw new Error("User not authenticated");
                        const token = await user.getIdToken();

                        await axios.delete(`${API_URL}/study-plans/${planId}/tasks/${taskId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        setStudyPlan(prev => ({
                            ...prev,
                            tasks: prev.tasks.filter(task => task._id !== taskId)
                        }));
                        Alert.alert("Success", "Task deleted successfully.");
                    } catch (error) {
                        console.error("Error deleting task:", error.response?.data || error.message);
                        Alert.alert("Error", "Failed to delete task. " + (error.response?.data?.message || error.message));
                    }
                }, style: "destructive"
            }
        ]);
    };

    const toggleTaskStatus = async (taskId, currentStatus) => {
        const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");
            const token = await user.getIdToken();

            await axios.put(`${API_URL}/study-plans/${planId}/tasks/${taskId}`, 
                { status: newStatus }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setStudyPlan(prev => ({
                ...prev,
                tasks: prev.tasks.map(task => 
                    task._id === taskId ? { ...task, status: newStatus, updatedAt: new Date().toISOString() } : task
                )
            }));
        } catch (error) {
            console.error("Error updating task status:", error.response?.data || error.message);
            Alert.alert("Error", "Failed to update task status. " + (error.response?.data?.message || error.message));
        }
    };

    const handleOptimizePlan = async () => {
        if (!studyPlan || !studyPlan._id) {
            Alert.alert("Error", "Study plan details are not available.");
            return;
        }
        if (!studyPlan.tasks || studyPlan.tasks.length === 0) {
            Alert.alert("No Tasks", "There are no tasks in this plan to optimize.");
            return;
        }

        setOptimizing(true);
        setAiOptimizedSuggestions(null); // Clear previous suggestions
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");
            const token = await user.getIdToken();

            // Endpoint for AI optimization
            const response = await axios.post(`${API_URL}/study-plans/${studyPlan._id}/optimize`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data && response.data.message) {
                Alert.alert("Optimization Started", response.data.message);
                // Optionally, store and display more detailed suggestions or updated tasks
                // For now, we can just show a message and maybe refresh the plan
                if(response.data.suggestions) {
                    setAiOptimizedSuggestions(response.data.suggestions);
                }
                if (response.data.updatedTasks) {
                     // If the backend sends back the full updated task list
                    setStudyPlan(prev => ({
                        ...prev,
                        tasks: response.data.updatedTasks,
                        // Optionally update a field like aiSuggestions if the backend provides it
                        // aiSuggestions: response.data.aiOverallSuggestion || prev.aiSuggestions
                    }));
                } else {
                    // If only suggestions are sent, or if we need to re-fetch to see changes
                    fetchStudyPlanDetail(); // Re-fetch to see AI-driven changes if any
                }

            } else {
                Alert.alert("Optimization", "AI optimization process initiated.");
            }

        } catch (error) {
            console.error("Error optimizing study plan:", error.response?.data || error.message);
            Alert.alert("Optimization Error", "Failed to optimize study plan. " + (error.response?.data?.message || error.message));
        } finally {
            setOptimizing(false);
        }
    };

    const renderTaskItem = ({ item }) => (
        <View style={styles.taskItemContainer}>
            <TouchableOpacity onPress={() => toggleTaskStatus(item._id, item.status)} style={styles.taskStatusIcon}>
                <MaterialIcons 
                    name={item.status === 'completed' ? 'check-circle' : 'radio-button-unchecked'} 
                    size={24} 
                    color={item.status === 'completed' ? '#4CAF50' : '#757575'} 
                />
            </TouchableOpacity>
            <View style={styles.taskTextContainer}>
                <Text style={[styles.taskTitle, item.status === 'completed' && styles.completedTaskTitle]}>{item.title}</Text>
                {item.description ? <Text style={styles.taskDescription}>{item.description}</Text> : null}
                <View style={styles.taskMetaContainer}>
                    {item.dueDate && <Text style={styles.taskMeta}><MaterialIcons name="date-range" size={12} /> {new Date(item.dueDate).toLocaleDateString()}</Text>}
                    {item.estimatedHours && <Text style={styles.taskMeta}><MaterialIcons name="timer" size={12} /> {item.estimatedHours} hrs</Text>}
                </View>
            </View>
            <View style={styles.taskActionsContainer}>
                <TouchableOpacity onPress={() => openTaskModal(item)} style={styles.taskActionButton}>
                    <MaterialIcons name="edit" size={20} color="#4A90E2" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteTask(item._id)} style={styles.taskActionButton}>
                    <MaterialIcons name="delete" size={20} color="#FF6347" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && !refreshing && !studyPlan) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading Plan Details...</Text>
            </View>
        );
    }

    if (!studyPlan) {
        return (
            <View style={styles.centered}>
                <MaterialIcons name="error-outline" size={60} color="#B0BEC5" />
                <Text style={styles.emptyMessage}>Study plan not found or failed to load.</Text>
                 <TouchableOpacity onPress={fetchStudyPlanDetail} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back-ios" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode='tail'>
                    {studyPlan?.title || 'Plan Details'}
                </Text>
            </View>
            <ScrollView 
                contentContainerStyle={styles.scrollContentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4A90E2"]}/>}
                // Added for web scroll behavior
                {...(Platform.OS === 'web' && {style: styles.webScrollView})}
            >
                <View style={styles.headerContentContainer}> {/* Renamed from headerContainer to avoid conflict */}
                    <Text style={styles.planTitleText}>{studyPlan.title}</Text>
                    {studyPlan.description && <Text style={styles.planDescriptionText}>{studyPlan.description}</Text>}
                </View>

                {studyPlan.aiSuggestions && (
                    <View style={styles.aiSuggestionBox}>
                        <FontAwesome5 name="lightbulb" size={18} color="#FFC107" style={{marginRight: 10}} />
                        <Text style={styles.aiSuggestionText}>{studyPlan.aiSuggestions}</Text>
                    </View>
                )}

                {/* Display AI Optimized Suggestions */}
                {aiOptimizedSuggestions && (
                    <View style={[styles.aiSuggestionBox, styles.optimizedSuggestionBox]}>
                        <MaterialIcons name="auto-awesome" size={20} color="#2ECC71" style={{marginRight: 10}} />
                        <View>
                            <Text style={styles.optimizedSuggestionTitle}>AI Optimization Insights:</Text>
                            <Text style={styles.aiSuggestionText}>{aiOptimizedSuggestions}</Text>
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.optimizeButton} onPress={handleOptimizePlan} disabled={optimizing || studyPlan.tasks?.length === 0}>
                    {optimizing ? 
                        <ActivityIndicator color="#fff" size="small" /> : 
                        <><FontAwesome5 name="magic" size={16} color="#fff" /><Text style={styles.optimizeButtonText}> Optimize with AI</Text></>}
                </TouchableOpacity>

                <View style={styles.tasksSection}>
                    <Text style={styles.sectionTitle}>Tasks ({studyPlan.tasks?.length || 0})</Text>
                    {studyPlan.tasks && studyPlan.tasks.length > 0 ? (
                        <FlatList
                            data={studyPlan.tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))}
                            renderItem={renderTaskItem}
                            keyExtractor={(item) => item._id.toString()}
                            scrollEnabled={false} // Disable FlatList scrolling, rely on ScrollView
                            ItemSeparatorComponent={() => <View style={styles.taskSeparator} />}
                        />
                    ) : (
                        <Text style={styles.noTasksText}>No tasks in this plan yet. Add some below!</Text>
                    )}
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={() => openTaskModal()} >
                <MaterialIcons name="playlist-add" size={30} color="white" />
            </TouchableOpacity>

            {/* Add/Edit Task Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isTaskModalVisible} // Changed from isAddTaskModalVisible
                onRequestClose={() => setIsTaskModalVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{currentTask ? 'Edit Task' : 'Add New Task'}</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Task Title*"
                            value={newTaskTitle}
                            onChangeText={setNewTaskTitle}
                            placeholderTextColor="#B0BEC5"
                        />
                        <TextInput
                            style={[styles.modalInput, styles.modalTextArea]}
                            placeholder="Description (Optional)"
                            value={newTaskDescription}
                            onChangeText={setNewTaskDescription}
                            multiline
                            numberOfLines={3}
                            placeholderTextColor="#B0BEC5"
                        />
                        
                        <TouchableOpacity onPress={showDatepickerMode} style={styles.datePickerButton}>
                            <MaterialIcons name="date-range" size={20} color="#4A90E2" style={styles.datePickerIcon} />
                            <Text style={styles.datePickerText}>
                                {newTaskDueDate ? `Due: ${newTaskDueDate}` : "Select Due Date (Optional)"}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={datePickerDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onChangeDate}
                                minimumDate={new Date()} // Optional: Prevent selecting past dates
                            />
                        )}
                        
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Estimated Hours (Optional)"
                            value={newTaskEstimatedHours}
                            onChangeText={setNewTaskEstimatedHours}
                            keyboardType="numeric"
                            placeholderTextColor="#B0BEC5"
                        />
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setIsTaskModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveTask}> // Changed from handleAddTask
                                <Text style={styles.modalButtonText}>{currentTask ? 'Save Changes' : 'Add Task'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const getStyles = (colors) => StyleSheet.create({ // Wrap styles in a function
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: colors.primary,
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 30, // Adjust for status bar
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.buttonText, // Assuming primary color has good contrast for text
        marginBottom: 5,
    },
    dateRange: {
        fontSize: 16,
        color: colors.buttonText, // Same as title
        opacity: 0.9,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 10,
        padding: 20,
        marginHorizontal: 15,
        marginTop: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cardHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: 8,
    },
    description: {
        fontSize: 16,
        color: colors.subtext,
        lineHeight: 22,
    },
    emptyText: {
        fontSize: 15,
        color: colors.subtext,
        textAlign: 'center',
        marginTop: 10,
    },
    editButton: {
        flexDirection: 'row',
        backgroundColor: colors.secondary, // Or another distinct color
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    editButtonText: {
        color: colors.buttonText, // Ensure this contrasts with secondary
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 10,
    },
    headerBar: {
        backgroundColor: '#4A90E2',
        paddingTop: Platform.OS === 'android' ? 25 : 50, 
        paddingBottom: 15,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        zIndex: 1, // Ensure header is above scroll content on web
    },
    backButton: {
        marginRight: 10, // Reduced margin for more title space
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1, // Allow title to take available space
    },
    webScrollView: {
      height: Platform.OS === 'web' ? 'calc(100vh - 70px)' : undefined, // Adjust 70px based on headerBar height
    },
    scrollContentContainer: {
        padding: 20,
        paddingBottom: Platform.OS === 'web' ? 20 : 80, // Space for FAB, less for web if not fixed FAB
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        // marginTop: -70, // Offset for header if it was part of this view
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#4A90E2',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerContentContainer: { // Renamed from headerContainer
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    planTitleText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#263238',
        marginBottom: 5,
    },
    planDescriptionText: {
        fontSize: 15,
        color: '#546E7A',
        fontStyle: 'italic',
    },
    aiSuggestionBox: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align items to the start for multi-line text
        backgroundColor: colors.cardLight, // A slightly different background for suggestions
        padding: 15,
        borderRadius: 8,
        marginVertical: 10, // Add some vertical margin
        marginHorizontal: 15, // Match card horizontal margin
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107', // Accent color for AI suggestions
    },
    aiSuggestionText: {
        flex: 1,
        fontSize: 14,
        color: colors.subtext,
        fontStyle: 'italic',
    },
    optimizedSuggestionBox: {
        borderLeftColor: '#2ECC71', // Different accent for optimized suggestions
        backgroundColor: colors.successLight, // A light green background
    },
    optimizedSuggestionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.successDark, // Darker green for title
        marginBottom: 5,
    },
    optimizeButton: {
        backgroundColor: '#673AB7', // Deep purple for AI actions
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    optimizeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    tasksSection: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#37474F',
        marginBottom: 15,
    },
    taskItemContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'flex-start',
        // marginBottom: 10, // Replaced by ItemSeparatorComponent
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    taskActionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10, // Space it from the task text
    },
    taskActionButton: {
        padding: 8, // Make icons easier to tap
        marginLeft: Platform.OS === 'web' ? 8 : 4, 
    },
    taskSeparator: {
        height: 12, // Slightly more separation
    },
    taskStatusIcon: {
        marginRight: 15,
        paddingTop: 2, // Align icon better with text
    },
    taskTextContainer: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 17,
        fontWeight: '500',
        color: '#333',
    },
    completedTaskTitle: {
        textDecorationLine: 'line-through',
        color: '#757575',
    },
    taskDescription: {
        fontSize: 13,
        color: '#666',
        marginTop: 3,
        marginBottom: 5,
    },
    taskMetaContainer: {
        flexDirection: 'row',
        marginTop: 5,
    },
    taskMeta: {
        fontSize: 11,
        color: '#757575',
        marginRight: 10,
        alignItems: 'center',
    },
    noTasksText: {
        fontSize: 15,
        color: '#78909C',
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    },
    fab: {
        position: Platform.OS === 'web' ? 'fixed' : 'absolute', // Fixed for web for better UX
        right: 30,
        bottom: 30,
        backgroundColor: '#4A90E2',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        ...(Platform.OS === 'web' && {
            boxShadow: '0px 4px 8px rgba(0,0,0,0.3)',
        }),
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 25,
        width: Platform.OS === 'web' ? '50%' : '90%',
        maxWidth: 500,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#263238',
        textAlign: 'center',
    },
    modalInput: {
        backgroundColor: '#F0F4F8',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 15 : 12,
        fontSize: 16,
        color: '#37474F',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#CFD8DC',
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4F8',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 15 : 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#CFD8DC',
    },
    datePickerIcon: {
        marginRight: 10,
    },
    datePickerText: {
        fontSize: 16,
        color: '#37474F',
    },
    modalTextArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    modalButton: {
        flex: 1, // Make buttons take equal width
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5, // Add some space between buttons
    },
    cancelButton: {
        backgroundColor: '#B0BEC5',
    },
    saveButton: {
        backgroundColor: '#4A90E2',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default StudyPlanDetailScreen;
