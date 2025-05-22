import React, { useEffect, useState, useRef, useContext } from 'react'; // Added useContext
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator, 
  Image,
  SafeAreaView, // Added SafeAreaView
  Animated, // Added Animated
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient'; // Added LinearGradient
import { useTheme } from '../context/ThemeContext'; // Import useTheme

const logo = require('../assets/superstudentlogo.png');

const { width, height } = Dimensions.get('window');

// Define a more sophisticated color palette
const COLORS = {
  primary: '#6A11CB', // Deep Purple
  secondary: '#2575FC', // Vibrant Blue
  accent: '#FFD700', // Gold for accents/highlights
  textPrimary: '#FFFFFF', // White for primary text on dark backgrounds
  textSecondary: '#E0E0E0', // Light grey for secondary text
  cardBackground: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white
  iconColor: '#FFFFFF',
  statBoxBackground: 'rgba(255, 255, 255, 0.15)',
  actionButtonPrimaryBg: '#FFD700', // Gold accent for primary CTA
  actionButtonPrimaryText: '#333333', // Dark text for gold button
  actionButtonSecondaryBg: 'rgba(255, 255, 255, 0.2)',
  actionButtonSecondaryText: '#FFFFFF',
};

const HomeScreen = ({ navigation }) => {
  const themeContext = useTheme() || {};
  const colors = themeContext.colors || {};
  const styles = getStyles(colors); // Get styles based on theme
  const [userName, setUserName] = useState('');
  const [upcomingTasksCount, setUpcomingTasksCount] = useState(0);
  const [activeFocusSessionsCount, setActiveFocusSessionsCount] = useState(0);
  const [wellbeingScore, setWellbeingScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
        delay: 200,
      }),
    ]).start();
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserName(userData.name || currentUser.displayName || 'User');
            setWellbeingScore(userData.wellbeingScore || 0);
          } else {
            setUserName(currentUser.displayName || 'User');
            setWellbeingScore(0);
          }

          const studyPlansRef = collection(db, 'studyPlans');
          const qTasks = query(studyPlansRef, where('userId', '==', currentUser.uid));
          const studyPlansSnap = await getDocs(qTasks);
          let tasksCount = 0;
          studyPlansSnap.forEach(planDoc => {
            const planData = planDoc.data();
            if (planData.tasks && Array.isArray(planData.tasks)) {
              planData.tasks.forEach(task => {
                if (task.status !== 'completed') {
                  tasksCount++;
                }
              });
            }
          });
          setUpcomingTasksCount(tasksCount);

          const focusSessionsRef = collection(db, 'focusSessions');
          const qFocus = query(focusSessionsRef, where('userId', '==', currentUser.uid), where('status', '==', 'active'));
          const focusSessionsSnap = await getDocs(qFocus);
          setActiveFocusSessionsCount(focusSessionsSnap.size);

        }
      } catch (error) {
        console.error("Error fetching home screen data:", error);
        setUserName('User');
        setUpcomingTasksCount(0);
        setActiveFocusSessionsCount(0);
        setWellbeingScore(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fadeAnim, slideUpAnim]); // Added animation refs to dependency array

  if (loading) {
    return (
      <LinearGradient colors={[theme.colors.gradientStart, theme.colors.gradientEnd]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </LinearGradient>
    );
  }

  const StatCard = ({ iconName, value, label, delay }) => {
    const itemFadeAnim = useRef(new Animated.Value(0)).current;
    const itemSlideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(itemFadeAnim, {
          toValue: 1,
          duration: 500,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(itemSlideAnim, {
          toValue: 0,
          duration: 400,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    }, [itemFadeAnim, itemSlideAnim, delay]);

    return (
      <Animated.View style={[styles.statBox, { opacity: itemFadeAnim, transform: [{ translateY: itemSlideAnim }] }]}>
        <Ionicons name={iconName} size={width * 0.08} color={theme.colors.icon} />
        <Text style={styles.statNumber}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Animated.View>
    );
  };
  
  const ActionButton = ({ iconName, text, onPress, primary, delay }) => {
    const itemFadeAnim = useRef(new Animated.Value(0)).current;
    const itemScaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(itemFadeAnim, {
          toValue: 1,
          duration: 500,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.spring(itemScaleAnim, { // Spring animation for a bit of bounce
          toValue: 1,
          friction: 5,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    }, [itemFadeAnim, itemScaleAnim, delay]);
    
    return (
      <Animated.View style={{opacity: itemFadeAnim, transform: [{scale: itemScaleAnim}]}}>
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            primary ? styles.actionButtonPrimary : styles.actionButtonSecondary
          ]} 
          onPress={onPress}
        >
          <Ionicons name={iconName} size={width * 0.06} color={primary ? theme.colors.buttonTextDark : theme.colors.icon} />
          <Text style={[
            styles.actionButtonText, 
            primary ? styles.actionButtonTextPrimary : styles.actionButtonTextSecondary
          ]}>{text}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hello, Student!</Text>
        <Text style={styles.headerSubtitle}>Ready to ace your studies?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileIconContainer}>
          <Ionicons name="person-circle-outline" size={30} color={theme.colors.buttonText} />
        </TouchableOpacity>
      </View>

      {/* Quick Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Features</Text>
        <FlatList
          data={quickFeatures}
          renderItem={renderFeatureCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* Study Plans Overview Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionTitle}>Your Study Plans</Text>
          <TouchableOpacity onPress={() => navigation.navigate('StudyPlanList')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {studyPlans.length > 0 ? (
          studyPlans.slice(0, 2).map((plan) => ( // Show only first two plans as a preview
            <TouchableOpacity 
              key={plan.id} 
              style={styles.studyPlanCard} 
              onPress={() => navigation.navigate('StudyPlanDetail', { planId: plan.id })}
            >
              <View style={styles.studyPlanInfo}>
                <Text style={styles.studyPlanTitle}>{plan.name}</Text>
                <Text style={styles.studyPlanDate}>{plan.dateRange}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyMessage}>No study plans yet. Create one!</Text>
        )}
        <TouchableOpacity 
          style={styles.createPlanButton} 
          onPress={() => navigation.navigate('CreateStudyPlan')}
        >
          <Ionicons name="add-circle-outline" size={22} color={theme.colors.buttonText} style={{marginRight: 8}}/>
          <Text style={styles.createPlanButtonText}>Create New Study Plan</Text>
        </TouchableOpacity>
      </View>

      {/* Maybe a section for upcoming tasks or focus timer quick start */}
      {/* ... */}

    </ScrollView>
  );
};

const getStyles = (colors) => StyleSheet.create({ // Wrap styles in a function
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Adjust for status bar
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.buttonText, // Text on primary background
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.buttonText, // Text on primary background
    opacity: 0.9,
  },
  profileIconContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 35,
    right: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  horizontalList: {
    paddingBottom: 10, // if cards have shadow
  },
  featureCard: {
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 20,
    marginRight: 15,
    width: 150,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIconContainer: {
    backgroundColor: colors.primary + '33', // Primary color with some transparency
    borderRadius: 25,
    padding: 12,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  studyPlanCard: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  studyPlanInfo: {
    flex: 1,
  },
  studyPlanTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  studyPlanDate: {
    fontSize: 13,
    color: colors.subtext,
    marginTop: 3,
  },
  emptyMessage: {
    textAlign: 'center',
    color: colors.subtext,
    fontSize: 15,
    paddingVertical: 20,
  },
  createPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary, // Or primary, depending on desired emphasis
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 15,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  createPlanButtonText: {
    color: colors.buttonText, // Ensure contrast with button background
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
