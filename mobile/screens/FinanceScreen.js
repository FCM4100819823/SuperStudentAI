import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView, // Added SafeAreaView
} from 'react-native';
import { collection, addDoc, query, where, getDocs, Timestamp, deleteDoc, doc, updateDoc, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore'; // Added orderBy
import { db as firestoreDb, auth } from '../config/firebase'; // Corrected import: db as firestoreDb
import { Ionicons } from '@expo/vector-icons'; // Assuming you use Expo and have vector icons

// Try to import LinearGradient, fallback to View if not available
let LinearGradient;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (error) {
  console.warn('LinearGradient not available, using fallback View:', error);
  LinearGradient = View; // Fallback to a simple View
}

const { width, height } = Dimensions.get('window');

// Enhanced Design System
const colors = {
  primary: '#6A1B9A', // Deep Purple
  primaryDark: '#4A0072',
  primaryLight: '#9C4DCC',
  secondary: '#4CAF50', // Green
  accent: '#F59E0B', // Amber
  danger: '#EF4444', // Red
  success: '#4CAF50', // Green (same as secondary for consistency here)
  warning: '#F59E0B', // Amber
  
  background: '#F4F6F8', // Lighter, cleaner background
  surface: '#FFFFFF', // For cards and interactive elements
  surfaceElevated: '#FFFFFF',

  text: '#1A202C', // Darker text for better contrast
  textSecondary: '#4A5568',
  textMuted: '#718096',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  shadow: 'rgba(0, 0, 0, 0.05)', // Softer shadow
  overlay: 'rgba(0, 0, 0, 0.6)',

  income: '#4CAF50', // Green
  expense: '#EF4444', // Red
  incomeBackground: 'rgba(76, 175, 80, 0.1)', // Light green
  expenseBackground: 'rgba(239, 68, 68, 0.1)', // Light red
  
  gradientStart: '#6A1B9A',
  gradientEnd: '#8E24AA',
  disabled: '#CBD5E0',
};

const spacing = { // Define spacing here to be accessible by typography
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const typography = {
  h1: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  h2: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  body: { fontSize: 16, fontWeight: '400', color: colors.textSecondary, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600', color: colors.text, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400', color: colors.textMuted, lineHeight: 20 },
  captionBold: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '400', color: colors.textMuted, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: 'bold', color: colors.textOnPrimary },
};


const FinanceScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); // 'expense' or 'income'
  const [filter, setFilter] = useState('all'); // 'all', 'income', 'expense'
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null); // To hold transaction being edited

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      Alert.alert("Authentication Error", "User not found. Please log in again.");
      setLoading(false);
      // Ensure 'Login' is the correct route name for your login screen
      // If using a different navigator structure, adjust accordingly
      if (navigation.canGoBack()) {
        navigation.popToTop(); // Go to the top of the current stack
      }
      navigation.replace('Login'); // Changed from 'Auth' to 'Login'
      return;
    }

    setLoading(true);
    const transactionsRef = collection(firestoreDb, 'users', userId, 'financeTransactions');
    // Order by date descending to get newest transactions first
    const q = query(transactionsRef, orderBy('date', 'desc')); 

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedTransactions = [];
      querySnapshot.forEach((doc) => {
        fetchedTransactions.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(fetchedTransactions);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching transactions: ", error);
      Alert.alert("Error", "Could not fetch transactions. " + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, navigation]);

  const handleAddOrUpdateTransaction = async () => {
    if (!description.trim() || !amount.trim()) {
      Alert.alert('Validation Error', 'Please enter description and amount.');
      return;
    }
    const numericAmount = parseFloat(amount.replace(',', '.')); // Allow comma as decimal separator
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive amount.');
      return;
    }

    if (!userId) {
      Alert.alert("Authentication Error", "User not found. Cannot add transaction.");
      return;
    }

    setIsSubmitting(true);
    const transactionData = {
      description: description.trim(),
      amount: numericAmount,
      type,
      // If editing, use existing date (Firestore Timestamp), otherwise new serverTimestamp for creation
      date: editingTransaction?.date instanceof Timestamp ? editingTransaction.date : serverTimestamp(),
      updatedAt: serverTimestamp() // Always update/set updatedAt
    };

    try {
      const transactionsCollectionRef = collection(firestoreDb, 'users', userId, 'financeTransactions');
      if (editingTransaction) {
        const docRef = doc(transactionsCollectionRef, editingTransaction.id);
        await updateDoc(docRef, transactionData);
        Alert.alert('Success', 'Transaction updated successfully!');
      } else {
        await addDoc(transactionsCollectionRef, transactionData);
        Alert.alert('Success', 'Transaction added successfully!');
      }
      setDescription('');
      setAmount('');
      setType('expense'); // Reset type
      setEditingTransaction(null); // Reset editing state
    } catch (error) {
      console.error('Error saving transaction: ', error);
      Alert.alert('Error', `Could not save transaction: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteTransaction = async (id) => {
    if (!userId) {
      Alert.alert("Authentication Error", "User not found. Cannot delete transaction.");
      return;
    }
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const docRef = doc(firestoreDb, 'users', userId, 'financeTransactions', id);
              await deleteDoc(docRef);
              Alert.alert('Success', 'Transaction deleted successfully!');
            } catch (error) {
              console.error('Error deleting transaction: ', error);
              Alert.alert('Error', `Could not delete transaction: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setDescription(transaction.description);
    setAmount(String(transaction.amount)); // Convert amount back to string for TextInput
    setType(transaction.type);
    // Optionally, scroll to the input form or open a modal here
  };

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.type === filter);
  }, [transactions, filter]);

  const totalBalance = useMemo(() => {
    return transactions.reduce((sum, t) => {
      return t.type === 'income' ? sum + t.amount : sum - t.amount;
    }, 0);
  }, [transactions]);

  const totalIncome = useMemo(() => {
    return transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionItemContainer}>
      <View style={[styles.typeIndicator, { backgroundColor: item.type === 'income' ? colors.income : colors.expense }]} />
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription} numberOfLines={1} ellipsizeMode="tail">{item.description}</Text>
        <Text style={styles.transactionDate}>
          {item.date?.toDate ? item.date.toDate().toLocaleDateString() : 'Date N/A'}
        </Text>
      </View>
      <View style={styles.transactionAmountContainer}>
        <Text style={[styles.transactionAmount, { color: item.type === 'income' ? colors.income : colors.expense }]}>
          {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
        <View style={styles.transactionActions}>
          <TouchableOpacity onPress={() => handleEditTransaction(item)} style={styles.actionButton}>
            <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteTransaction(item.id)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading && transactions.length === 0) {
    return (
      <SafeAreaView style={styles.flexOne}> {/* Ensure SafeAreaView wraps the loading state as well */} 
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Finances...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flexOne}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.screen}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} // Adjust offset if needed
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled" // Ensures taps work inside ScrollView when keyboard is up
        >
          {LinearGradient !== View ? (
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.headerContainer}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0.5}} // Adjust gradient angle
              >
                <Text style={styles.headerTitle}>My Finances</Text>
                <View style={styles.summaryBalanceContainer}>
                  <Text style={styles.summaryBalanceLabel}>Total Balance</Text>
                  <Text style={styles.summaryBalanceAmount}>${totalBalance.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Ionicons name="arrow-up-circle-outline" size={24} color={colors.income} />
                    <View style={styles.summaryTextContainer}> {/* Added View to wrap texts */}
                      <Text style={styles.summaryItemLabel}>Income</Text>
                      <Text style={[styles.summaryItemAmount, { color: colors.income }]}>
                        ${totalIncome.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name="arrow-down-circle-outline" size={24} color={colors.expense} />
                    <View style={styles.summaryTextContainer}> {/* Added View to wrap texts */}
                      <Text style={styles.summaryItemLabel}>Expenses</Text>
                      <Text style={[styles.summaryItemAmount, { color: colors.expense }]}>
                        ${totalExpenses.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.headerContainer}> {/* Fallback for when LinearGradient is not available */}
                <Text style={styles.headerTitle}>My Finances</Text>
                <View style={styles.summaryBalanceContainer}>
                  <Text style={styles.summaryBalanceLabel}>Total Balance</Text>
                  <Text style={styles.summaryBalanceAmount}>${totalBalance.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Ionicons name="arrow-up-circle-outline" size={24} color={colors.income} />
                    <View style={styles.summaryTextContainer}> {/* Added View to wrap texts */}
                      <Text style={styles.summaryItemLabel}>Income</Text>
                      <Text style={[styles.summaryItemAmount, { color: colors.income }]}>
                        ${totalIncome.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name="arrow-down-circle-outline" size={24} color={colors.expense} />
                    <View style={styles.summaryTextContainer}> {/* Added View to wrap texts */}
                      <Text style={styles.summaryItemLabel}>Expenses</Text>
                      <Text style={[styles.summaryItemAmount, { color: colors.expense }]}>
                        ${totalExpenses.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )
          }
          

          <View style={styles.contentContainer}>
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Description (e.g., Groceries, Salary)"
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
              />
              <TextInput
                style={styles.input}
                placeholder="Amount (e.g., 50.00)"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeOption, type === 'income' && styles.typeOptionActiveIncome]}
                  onPress={() => setType('income')}
                >
                  <Ionicons name="add-circle-outline" size={20} color={type === 'income' ? colors.income : colors.textSecondary} style={{marginRight: spacing.xs}}/>
                  <Text style={[styles.typeOptionText, type === 'income' && styles.typeOptionTextActiveIncome]}>Income</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeOption, type === 'expense' && styles.typeOptionActiveExpense]}
                  onPress={() => setType('expense')}
                >
                   <Ionicons name="remove-circle-outline" size={20} color={type === 'expense' ? colors.expense : colors.textSecondary} style={{marginRight: spacing.xs}}/>
                  <Text style={[styles.typeOptionText, type === 'expense' && styles.typeOptionTextActiveExpense]}>Expense</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.button, isSubmitting && styles.buttonDisabled]} 
                onPress={handleAddOrUpdateTransaction}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.buttonText}>{editingTransaction ? 'Update Transaction' : 'Add Transaction'}</Text>
                )}
              </TouchableOpacity>
              {editingTransaction && (
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={() => {
                    setEditingTransaction(null);
                    setDescription('');
                    setAmount('');
                    setType('expense');
                  }}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.filterContainer}>
              <Text style={styles.sectionTitle}>History</Text>
              <View style={styles.filterButtons}>
                {['all', 'income', 'expense'].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                    onPress={() => setFilter(f)}
                  >
                    <Text style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}\
              </View>
            </View>

            {loading && transactions.length > 0 && <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md}} />}

            {filteredTransactions.length === 0 && !loading ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="receipt-outline" size={60} color={colors.textMuted} />
                <Text style={styles.emptyStateText}>No transactions yet.</Text>
                <Text style={styles.emptyStateSubText}>
                  {filter === 'all' ? 'Add your first transaction to get started.' : `No ${filter} transactions found.`}
                </Text>
              </View>
            ) : (
              // Using View instead of FlatList directly inside ScrollView to avoid virtualization issues
              // For very long lists, consider a virtualized list component designed for ScrollView if performance drops.
              <View>
                {filteredTransactions.map(item =>
                  // Ensure each item rendered by map has a unique key.
                  // React.cloneElement can add a key to the element returned by renderTransactionItem.
                  React.cloneElement(renderTransactionItem({ item }), { key: item.id })
                )}
              </View>
            )}
          </View>
          <View style={{ height: spacing.xxl }} /> {/* Extra space at the bottom */}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flexOne: { // Added style for SafeAreaView
    flex: 1,
    backgroundColor: colors.background, // Match screen background
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.primary,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? spacing.lg + 20 : spacing.xl + 20, // Adjust for status bar
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: spacing.md, // Space between header and content
    shadowColor: colors.shadow, // Shadow for header
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  headerTitle: {
    ...typography.h1,
    fontSize: 32, // Larger title
    color: colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  summaryBalanceContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryBalanceLabel: {
    ...typography.caption,
    color: colors.textOnPrimary,
    opacity: 0.85, // Slightly more opaque
    marginBottom: spacing.xxs,
  },
  summaryBalanceAmount: {
    ...typography.h1,
    fontSize: 40, // Larger for emphasis
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: spacing.sm, // Add some top margin
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface, // Card-like background for each item
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    flex: 1, // Distribute space equally
    marginHorizontal: spacing.xs, // Add some space between items
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTextContainer: { // Added style for the text container next to icon
    marginLeft: spacing.sm,
    flexShrink: 1, // Allow text to shrink if needed
  },
  summaryItemLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  summaryItemAmount: {
    ...typography.bodyBold,
    fontSize: 18, // Slightly larger for emphasis
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    flex: 1, // Ensure content takes available space
    paddingBottom: spacing.lg, // Padding at the bottom of content
  },
  inputSection: {
    backgroundColor: colors.surface,
    borderRadius: 16, // More rounded corners
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10, // Softer shadow
    elevation: 5,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primaryDark, // Use a darker primary for section titles
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background, 
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10, // More rounded inputs
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs, // Adjust padding for platforms
    marginBottom: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row', // For icon and text
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1.5, // Slightly thicker border
    borderColor: colors.border,
    marginHorizontal: spacing.xs, // Spacing between options
    backgroundColor: colors.surface, // Default background
  },
  typeOptionActiveIncome: {
    backgroundColor: colors.incomeBackground,
    borderColor: colors.income,
  },
  typeOptionActiveExpense: {
    backgroundColor: colors.expenseBackground,
    borderColor: colors.expense,
  },
  typeOptionText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  typeOptionTextActiveIncome: {
    color: colors.income,
  },
  typeOptionTextActiveExpense: {
    color: colors.expense,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: colors.primaryDark, // Shadow for button
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
    shadowOpacity: 0, // No shadow for disabled button
    elevation: 0,
  },
  buttonText: {
    ...typography.button,
    color: colors.textOnPrimary, // Ensure text is white
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderColor: colors.textMuted,
    borderWidth: 1.5,
    marginTop: spacing.sm,
    shadowOpacity: 0, // No shadow for cancel
    elevation: 0,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.textMuted,
  },
  filterContainer: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm, 
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around', 
    backgroundColor: colors.surface,
    borderRadius: 12, // More rounded filter bar
    padding: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: spacing.md, // Space below filters
  },
  filterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8, // Rounded individual buttons
    marginHorizontal: spacing.xxs, 
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  filterButtonText: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.textOnPrimary,
  },
  transactionItemContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12, // More rounded items
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 }, // Slightly more pronounced shadow
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  typeIndicator: {
    width: 6,
    height: '90%', // Make it slightly shorter than the card
    borderRadius: 3,
    marginRight: spacing.md, // More space next to indicator
  },
  transactionDetails: {
    flex: 1,
    marginRight: spacing.sm, // Space before amount
  },
  transactionDescription: {
    ...typography.bodyBold,
    color: colors.text, // Darker description
    marginBottom: spacing.xxs,
  },
  transactionDate: {
    ...typography.small,
    color: colors.textMuted,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...typography.bodyBold,
    fontSize: 18, 
    marginBottom: spacing.xxs,
  },
  transactionActions: {
    flexDirection: 'row',
    marginTop: spacing.xxs,
  },
  actionButton: {
    padding: spacing.xs, 
    marginLeft: spacing.sm,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    minHeight: height * 0.3, // Ensure it takes some space
    marginTop: spacing.lg,
  },
  emptyStateText: {
    ...typography.h3,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyStateSubText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.lg, // Add padding for longer text
  },
});

export default FinanceScreen;
