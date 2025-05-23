import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext'; // Import useTheme

// Replace with your actual backend URL
const API_URL = 'http://172.20.10.3:5000/api'; // Or your deployed backend URL

const StudyPlanListScreen = () => {
    const navigation = useNavigation();
    const themeContext = useTheme() || {};
    const colors = themeContext.colors || {};
    const styles = getStyles(colors); // Get styles based on theme
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
            style={styles.planItem} 
            onPress={() => navigation.navigate('StudyPlanDetail', { planId: item._id, planTitle: item.title })}
        >
            <View style={styles.planDetails}>
                <Text style={styles.planTitle}>{item.title}</Text>
                <Text style={styles.planDateRange}>
                    {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                </Text>
                <Text style={styles.planDescription} numberOfLines={2}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (studyPlans.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>No study plans found. Create one!</Text>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('CreateStudyPlan')}
                >
                    <Ionicons name="add" size={30} color={colors.buttonText} />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
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
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateStudyPlan')}
            >
                <Ionicons name="add" size={30} color={colors.buttonText} />
            </TouchableOpacity>
        </View>
    );
};

const getStyles = (colors) => StyleSheet.create({ // Wrap styles in a function
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    planItem: {
        backgroundColor: colors.card,
        padding: 20,
        marginVertical: 8,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    planDetails: {
        flex: 1,
    },
    planTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 5,
    },
    planDateRange: {
        fontSize: 14,
        color: colors.subtext,
        marginBottom: 5,
    },
    planDescription: {
        fontSize: 14,
        color: colors.subtext,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 18,
        color: colors.subtext,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: colors.primary,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
});

export default StudyPlanListScreen;
