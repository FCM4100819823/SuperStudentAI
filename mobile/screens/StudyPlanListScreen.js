import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';

// Replace with your actual backend URL
const API_URL = 'http://172.20.10.4:5000/api'; // Or your deployed backend URL

const StudyPlanListScreen = () => {
    const navigation = useNavigation();
    const [studyPlans, setStudyPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const auth = getAuth();

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
        useCallback(() => {
            fetchStudyPlans();
        }, [auth])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStudyPlans();
    }, [auth]);

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.planItemContainer} 
            onPress={() => navigation.navigate('StudyPlanDetail', { planId: item._id, planTitle: item.title })}
        >
            <View style={styles.planItemContent}>
                <Text style={styles.planTitle}>{item.title}</Text>
                <Text style={styles.planDescription}>{item.description || 'No description'}</Text>
                <Text style={styles.taskCount}>{item.tasks?.length || 0} task(s)</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#4A90E2" />
        </TouchableOpacity>
    );

    if (loading && !refreshing && studyPlans.length === 0) { // Show loading only if no plans are displayed yet
        return (
            <View style={styles.container}> {/* Added container for consistent header */} 
                <View style={styles.headerBar}>
                    <Text style={styles.headerTitle}>My Study Plans</Text>
                </View>
                <View style={styles.centered}> 
                    <ActivityIndicator size="large" color="#4A90E2" />
                    <Text style={styles.loadingText}>Loading Study Plans...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerBar}>
                <Text style={styles.headerTitle}>My Study Plans</Text>
                {/* You could add a settings or search icon here if needed */}
            </View>
            {studyPlans.length === 0 && !loading ? (
                <View style={styles.centered}> {/* Ensure this centered view doesn't overlap header */}
                    <MaterialIcons name="school" size={70} color="#B0BEC5" />
                    <Text style={styles.emptyMessage}>No study plans yet.</Text>
                    <Text style={styles.emptySubMessage}>Tap the '+' button to create your first plan!</Text>
                </View>
            ) : (
                <FlatList
                    data={studyPlans.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))} // Sort by most recently updated
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id.toString()}
                    contentContainerStyle={styles.listContentContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4A90E2"]}/>
                    }
                    // Added for web scroll behavior
                    {...(Platform.OS === 'web' && {style: styles.webFlatList})}
                />
            )}
            <TouchableOpacity 
                style={styles.fab} 
                onPress={() => navigation.navigate('CreateStudyPlan')}
            >
                <MaterialIcons name="add" size={30} color="white" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4F8', 
    },
    headerBar: {
        backgroundColor: '#4A90E2',
        paddingTop: Platform.OS === 'android' ? 25 : 50, 
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // For potential icons on the right
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        zIndex: 1, // Ensure header is above scroll content on web
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        // marginTop: Platform.OS === 'web' ? 0 : -70, // Adjust if header was part of this view
    },
    loadingText: {
        marginTop: 15,
        fontSize: 17,
        color: '#4A90E2',
    },
    emptyMessage: {
        fontSize: 22,
        color: '#78909C',
        marginTop: 20,
        fontWeight: '600',
    },
    emptySubMessage: {
        fontSize: 15,
        color: '#90A4AE',
        marginTop: 10,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    webFlatList: {
        height: Platform.OS === 'web' ? 'calc(100vh - 70px)' : undefined, // Adjust 70px based on headerBar height
    },
    listContentContainer: {
        padding: Platform.OS === 'web' ? 20 : 10,
        paddingTop: Platform.OS === 'web' ? 20 : 15, // Add some top padding below header
        paddingBottom: Platform.OS === 'web' ? 20 : 80, // Ensure space for FAB
    },
    planItemContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 18, // Increased padding
        paddingHorizontal: 20,
        marginVertical: 8,
        marginHorizontal: Platform.OS === 'web' ? 0 : 12, // Slightly more horizontal margin for native
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#4A90E2', // Subtle shadow with accent color
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4, 
        ...(Platform.OS === 'web' && {
            boxShadow: '0px 3px 6px rgba(74,144,226,0.15)',
            transition: 'transform 0.2s ease-in-out, boxShadow 0.2s ease-in-out',
        }),
        // Add hover effect for web
        // pointerEvents: 'auto' // Ensure TouchableOpacity works on web with hover
    },
    // planItemContainerHover: Platform.OS === 'web' ? {
    //     transform: 'translateY(-2px)',
    //     boxShadow: '0px 5px 10px rgba(74,144,226,0.2)',
    // } : {},
    planItemContent: {
        flex: 1,
        marginRight: 10, // Space before chevron
    },
    planTitle: {
        fontSize: 19, // Slightly larger title
        fontWeight: 'bold',
        color: '#37474F', 
        marginBottom: 5,
    },
    planDescription: {
        fontSize: 14,
        color: '#546E7A',
        marginBottom: 10,
        fontStyle: 'italic',
        lineHeight: 18, // Improved readability
    },
    taskCount: {
        fontSize: 13,
        color: '#4A90E2',
        fontWeight: '600',
    },
    fab: {
        position: Platform.OS === 'web' ? 'fixed' : 'absolute', // Fixed for web
        right: 30,
        bottom: 30,
        backgroundColor: '#4A90E2', // Primary action color
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
        // For web boxShadow
        ...(Platform.OS === 'web' && {
            boxShadow: '0px 4px 8px rgba(0,0,0,0.3)',
        }),
    },
});

export default StudyPlanListScreen;
