import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
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
  runTransaction,
} from 'firebase/firestore';
import { auth, firestoreDb } from '../config/firebase';

// Static colors for now
const STATIC_COLORS = {
  primary: '#2A9D8F', // Teal
  secondary: '#E9C46A', // Yellow
  background: '#F4F1DE', // Light Beige
  card: '#FFFFFF',
  text: '#264653', // Dark Blue/Green
  subtext: '#2A9D8F', // Teal for subtext
  accent: '#F4A261', // Orange
  error: '#E76F51', // Darker Orange/Red
  white: '#FFFFFF',
  lightBorder: '#D3D3D3',
  success: '#2A9D8F', // Teal for success messages
  disabled: '#A9A9A9',
};

const getStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    scrollContainer: {
      padding: 20,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 10,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.subtext,
      textAlign: 'center',
      marginBottom: 20,
    },
    sectionContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 15,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightBorder,
      paddingBottom: 10,
    },
    inputGroup: {
      marginBottom: 15,
    },
    inputLabel: {
      fontSize: 15,
      color: colors.text,
      marginBottom: 8,
      fontWeight: '500',
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: Platform.OS === 'ios' ? 15 : 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.lightBorder,
    },
    pickerContainer: {
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.lightBorder,
      marginBottom: 15,
    },
    picker: {
      color: colors.text,
    },
    datePickerButton: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 15,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.lightBorder,
      marginBottom: 15,
    },
    datePickerButtonText: {
      fontSize: 16,
      color: colors.primary,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    buttonText: {
      color: colors.white,
      fontSize: 17,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    listItem: {
      backgroundColor: colors.background,
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    listItemTextContainer: {
      flex: 1,
    },
    listItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    listItemSubtitle: {
      fontSize: 14,
      color: colors.subtext,
    },
    listItemAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    actionsContainer: {
      flexDirection: 'row',
    },
    actionButton: {
      padding: 8,
      marginLeft: 10,
    },
    emptyListText: {
      textAlign: 'center',
      color: colors.subtext,
      marginTop: 15,
      fontSize: 15,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    modalButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 5,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.lightBorder,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    budgetItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 10,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 10,
    },
    budgetTextContainer: {
      flex: 1,
    },
    budgetCategory: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    budgetAmount: {
      fontSize: 14,
      color: colors.subtext,
    },
    budgetSpent: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: '500',
    },
    budgetRemaining: {
      fontSize: 14,
      color: colors.success,
      fontWeight: '500',
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: colors.lightBorder,
      borderRadius: 4,
      marginTop: 5,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    addBudgetButton: {
      backgroundColor: colors.accent,
      marginTop: 10,
    },
  });

const TRANSACTION_CATEGORIES = [
  { label: 'Select Category...', value: '' },
  { label: 'Food & Dining', value: 'Food & Dining' },
  { label: 'Transport', value: 'Transport' },
  { label: 'Utilities (Bills)', value: 'Utilities' },
  { label: 'Shopping', value: 'Shopping' },
  { label: 'Entertainment', value: 'Entertainment' },
  { label: 'Healthcare', value: 'Healthcare' },
  { label: 'Education', value: 'Education' },
  { label: 'Salary/Wages', value: 'Salary' },
  { label: 'Freelance/Gigs', value: 'Freelance' },
  { label: 'Investments', value: 'Investments' },
  { label: 'Gifts', value: 'Gifts' },
  { label: 'Travel', value: 'Travel' },
  { label: 'Personal Care', value: 'Personal Care' },
  { label: 'Other', value: 'Other' },
];

const FinanceScreen = ({ navigation }) => {
  const colors = STATIC_COLORS;
  const styles = getStyles(colors);
  const userId = auth.currentUser?.uid;

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionName, setTransactionName] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionCategory, setTransactionCategory] = useState(
    TRANSACTION_CATEGORIES[0],
  );
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null); // null or transaction object

  // Budgets State
  const [budgets, setBudgets] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
  const [budgetCategoryInput, setBudgetCategoryInput] = useState(
    TRANSACTION_CATEGORIES[0],
  );
  const [budgetAmountInput, setBudgetAmountInput] = useState('');
  const [editingBudget, setEditingBudget] = useState(null); // null or budget object

  // Financial Goals State (placeholders for now)
  const [goals, setGoals] = useState([
    {
      id: '1',
      name: 'Save for New Laptop',
      targetAmount: 1200,
      currentAmount: 300,
      deadline: '2025-12-31',
    },
    {
      id: '2',
      name: 'Emergency Fund',
      targetAmount: 1000,
      currentAmount: 750,
      deadline: '2026-06-30',
    },
  ]);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;
    setLoadingTransactions(true);
    try {
      const q = query(
        collection(firestoreDb, 'users', userId, 'financeTransactions'),
        orderBy('date', 'desc'),
      );
      const querySnapshot = await getDocs(q);
      const transactionList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(transactionList);
    } catch (error) {
      console.error('Error fetching transactions: ', error);
      Alert.alert('Error', 'Could not fetch transactions.');
    }
    setLoadingTransactions(false);
  }, [userId]);

  const fetchBudgets = useCallback(async () => {
    if (!userId) return;
    setLoadingBudgets(true);
    try {
      const q = query(
        collection(firestoreDb, 'userBudgets'),
        where('userId', '==', userId),
      );
      const querySnapshot = await getDocs(q);
      const userBudgets = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBudgets(userBudgets);
    } catch (error) {
      console.error('Error fetching budgets: ', error);
      Alert.alert('Error', 'Could not fetch budgets.');
    }
    setLoadingBudgets(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchTransactions();
      fetchBudgets();
    }
  }, [userId, fetchTransactions, fetchBudgets]);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || transactionDate;
    setShowDatePicker(Platform.OS === 'ios');
    setTransactionDate(currentDate);
  };

  const handleAddOrUpdateTransaction = async () => {
    if (
      !transactionName.trim() ||
      !transactionAmount.trim() ||
      !transactionCategory
    ) {
      Alert.alert(
        'Validation Error',
        'Please enter description, amount, and select a category.',
      );
      return;
    }
    const numericAmount = parseFloat(transactionAmount.replace(',', '.')); // Allow comma as decimal separator
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive amount.');
      return;
    }

    if (!userId) {
      Alert.alert(
        'Authentication Error',
        'User not found. Cannot add transaction.',
      );
      return;
    }

    try {
      const transactionData = {
        description: transactionName.trim(),
        amount: numericAmount,
        category: transactionCategory,
        date: transactionDate,
        userId,
        createdAt: serverTimestamp(),
      };

      if (editingTransaction) {
        const transactionRef = doc(
          firestoreDb,
          'users',
          userId,
          'financeTransactions',
          editingTransaction.id,
        );
        await updateDoc(transactionRef, transactionData);
        Alert.alert('Success', 'Transaction updated successfully!');
      } else {
        await addDoc(
          collection(firestoreDb, 'users', userId, 'financeTransactions'),
          transactionData,
        );
        Alert.alert('Success', 'Transaction added successfully!');
      }
      setTransactionName('');
      setTransactionAmount('');
      setTransactionCategory(TRANSACTION_CATEGORIES[0]);
      setTransactionDate(new Date());
      setEditingTransaction(null);
      fetchTransactions(); // Refresh list
      // After adding/updating transaction, recalculate budget spent amounts
      fetchBudgets(); // This will re-fetch budgets, consider a more targeted update if performance is an issue
    } catch (error) {
      console.error('Error saving transaction: ', error);
      Alert.alert('Error', `Could not save transaction: ${error.message}`);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setTransactionName(transaction.description);
    setTransactionAmount(String(transaction.amount)); // Convert amount back to string for TextInput
    setTransactionCategory(transaction.category);
    setTransactionDate(transaction.date.toDate());
    // Optionally, scroll to the input form or open a modal here
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!userId) {
      Alert.alert(
        'Authentication Error',
        'User not found. Cannot delete transaction.',
      );
      return;
    }
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const docRef = doc(
                firestoreDb,
                'users',
                userId,
                'financeTransactions',
                transactionId,
              );
              await deleteDoc(docRef);
              Alert.alert('Success', 'Transaction deleted successfully!');
              fetchTransactions(); // Refresh list
              // After deleting transaction, recalculate budget spent amounts
              fetchBudgets(); // Similar to add/update, consider targeted update
            } catch (error) {
              console.error('Error deleting transaction: ', error);
              Alert.alert(
                'Error',
                `Could not delete transaction: ${error.message}`,
              );
            }
          },
        },
      ],
    );
  };

  const handleAddOrUpdateBudget = async () => {
    if (!budgetCategoryInput || !budgetAmountInput) {
      Alert.alert(
        'Missing Info',
        'Please select a category and enter an amount for your budget.',
      );
      return;
    }
    if (!userId) {
      Alert.alert('Not Logged In', 'You need to be logged in.');
      return;
    }
    const amount = parseFloat(budgetAmountInput);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid positive amount for the budget.',
      );
      return;
    }

    const budgetData = {
      userId,
      category: budgetCategoryInput,
      amount: amount,
      createdAt: serverTimestamp(),
    };

    try {
      if (editingBudget) {
        // Check if category is being changed for an existing budget
        if (editingBudget.category !== budgetCategoryInput) {
          const existingBudgetForNewCategory = budgets.find(
            (b) =>
              b.category === budgetCategoryInput && b.id !== editingBudget.id,
          );
          if (existingBudgetForNewCategory) {
            Alert.alert(
              'Budget Exists',
              `A budget for '${budgetCategoryInput}' already exists. You can edit that one or choose a different category.`,
            );
            return;
          }
        }
        const budgetRef = doc(firestoreDb, 'userBudgets', editingBudget.id);
        await updateDoc(budgetRef, {
          // Only update amount and category if changed
          category: budgetCategoryInput,
          amount: amount,
        });
        Alert.alert(
          'Budget Updated',
          `Budget for ${budgetCategoryInput} updated successfully.`,
        );
      } else {
        // Check if budget for this category already exists
        const existingBudget = budgets.find(
          (b) => b.category === budgetCategoryInput,
        );
        if (existingBudget) {
          Alert.alert(
            'Budget Exists',
            `A budget for '${budgetCategoryInput}' already exists. You can edit that one.`,
          );
          return;
        }
        await addDoc(collection(firestoreDb, 'userBudgets'), budgetData);
        Alert.alert(
          'Budget Set',
          `Budget for ${budgetCategoryInput} set successfully.`,
        );
      }
      closeBudgetModal();
      fetchBudgets(); // Refresh budget list
    } catch (error) {
      console.error('Error saving budget: ', error);
      Alert.alert('Error', 'Could not save budget. ' + error.message);
    }
  };

  const openBudgetModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setBudgetCategoryInput(budget.category);
      setBudgetAmountInput(budget.amount.toString());
    } else {
      setEditingBudget(null);
      setBudgetCategoryInput(TRANSACTION_CATEGORIES[0]);
      setBudgetAmountInput('');
    }
    setIsBudgetModalVisible(true);
  };

  const closeBudgetModal = () => {
    setIsBudgetModalVisible(false);
    setEditingBudget(null);
    setBudgetCategoryInput(TRANSACTION_CATEGORIES[0]);
    setBudgetAmountInput('');
  };

  const handleDeleteBudget = async (budgetId, budgetCategory) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the budget for '${budgetCategory}'? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!userId) return;
            try {
              await deleteDoc(doc(firestoreDb, 'userBudgets', budgetId));
              Alert.alert(
                'Budget Deleted',
                `Budget for ${budgetCategory} has been removed.`,
              );
              fetchBudgets(); // Refresh list
            } catch (error) {
              console.error('Error deleting budget: ', error);
              Alert.alert('Error', 'Could not delete budget.');
            }
          },
        },
      ],
    );
  };

  const calculateSpentAmount = (category) => {
    return transactions
      .filter((t) => t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const renderTransactionItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemTextContainer}>
        <Text
          style={styles.listItemTitle}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.description}
        </Text>
        <Text style={styles.listItemSubtitle}>
          {item.category || 'Uncategorized'}
        </Text>
      </View>
      <Text style={styles.listItemAmount}>
        {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
      </Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={() => handleEditTransaction(item)}
          style={styles.actionButton}
        >
          <Ionicons
            name="pencil-outline"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteTransaction(item.id)}
          style={styles.actionButton}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBudgetItem = ({ item }) => {
    const spent = calculateSpentAmount(item.category);
    const remaining = item.amount - spent;
    const progress = item.amount > 0 ? spent / item.amount : 0;
    const progressBarColor =
      progress > 1
        ? colors.error
        : progress > 0.75
          ? colors.accent
          : colors.primary;

    return (
      <View style={styles.budgetItem}>
        <View style={styles.budgetTextContainer}>
          <Text style={styles.budgetCategory}>{item.category}</Text>
          <Text style={styles.budgetAmount}>
            Budgeted: ${item.amount.toFixed(2)}
          </Text>
          <Text
            style={[
              styles.budgetSpent,
              spent > item.amount && { color: colors.error },
            ]}
          >
            Spent: ${spent.toFixed(2)}
          </Text>
          <Text
            style={[
              styles.budgetRemaining,
              remaining < 0 && { color: colors.error },
            ]}
          >
            {remaining >= 0
              ? `Remaining: $${remaining.toFixed(2)}`
              : `Overspent: $${Math.abs(remaining).toFixed(2)}`}
          </Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(progress * 100, 100)}%`,
                  backgroundColor: progressBarColor,
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => openBudgetModal(item)}
            style={styles.actionButton}
          >
            <Ionicons name="pencil-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteBudget(item.id, item.category)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFinancialGoalItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemTextContainer}>
        <Text style={styles.listItemTitle}>{item.name}</Text>
        <Text style={styles.listItemSubtitle}>
          Target: ${item.targetAmount.toFixed(2)}
        </Text>
      </View>
      <Text style={styles.listItemAmount}>
        Saved: ${item.currentAmount.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContainer}
        >
          <Text style={styles.headerTitle}>Financial Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Manage your transactions, budgets, and goals.
          </Text>

          {/* Budget Management Section */}
          <View style={styles.sectionContainer}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={styles.sectionTitle}>Budget Management</Text>
              <TouchableOpacity
                onPress={() => openBudgetModal()}
                style={[
                  styles.button,
                  styles.addBudgetButton,
                  {
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    marginBottom: 10,
                  },
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={colors.white}
                />
                <Text
                  style={[styles.buttonText, { fontSize: 15, marginLeft: 5 }]}
                >
                  Set Budget
                </Text>
              </TouchableOpacity>
            </View>
            {loadingBudgets ? (
              <Text style={styles.emptyListText}>Loading budgets...</Text>
            ) : budgets.length > 0 ? (
              <FlatList
                data={budgets}
                renderItem={renderBudgetItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false} // if nested in ScrollView
              />
            ) : (
              <Text style={styles.emptyListText}>
                No budgets set yet. Tap 'Set Budget' to create one.
              </Text>
            )}
          </View>

          {/* Add/Edit Transaction Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Groceries, Salary"
                value={transactionName}
                onChangeText={setTransactionName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 50.00"
                value={transactionAmount}
                onChangeText={setTransactionAmount}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={transactionCategory}
                  onValueChange={(itemValue) =>
                    setTransactionCategory(itemValue)
                  }
                  style={styles.picker}
                  prompt="Select Transaction Category"
                >
                  {TRANSACTION_CATEGORIES.map((cat) => (
                    <Picker.Item
                      key={cat.value}
                      label={cat.label}
                      value={cat.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerButtonText}>
                  {transactionDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={transactionDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
            <TouchableOpacity
              style={[styles.button, { marginTop: 10 }]}
              onPress={handleAddOrUpdateTransaction}
            >
              <Text style={styles.buttonText}>
                {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Financial Goals Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Financial Goals</Text>
            {goals.length > 0 ? (
              <FlatList
                data={goals}
                renderItem={renderFinancialGoalItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false} // if nested in ScrollView
              />
            ) : (
              <Text style={styles.emptyListText}>
                No financial goals set. Consider adding some.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Budget Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isBudgetModalVisible}
        onRequestClose={closeBudgetModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingBudget ? 'Edit Budget' : 'Set New Budget'}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={budgetCategoryInput}
                  onValueChange={(itemValue) =>
                    setBudgetCategoryInput(itemValue)
                  }
                  style={styles.picker}
                  prompt="Select Budget Category"
                >
                  {TRANSACTION_CATEGORIES.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Budget Amount ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 500"
                keyboardType="numeric"
                value={budgetAmountInput}
                onChangeText={setBudgetAmountInput}
              />
            </View>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeBudgetModal}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddOrUpdateBudget}
              >
                <Text style={[styles.modalButtonText, { color: colors.white }]}>
                  {editingBudget ? 'Update Budget' : 'Set Budget'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default FinanceScreen;
