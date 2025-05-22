// Placeholder for FinanceScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { auth, db } from '../firebaseConfig';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

const FinanceScreen = ({ navigation }) => {
  const themeContext = useTheme() || {};
  const colors = themeContext.colors || {};
  const styles = getStyles(colors); // Get styles based on theme
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  // Form states for new transaction
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); // 'expense' or 'income'
  const [category, setCategory] = useState(''); // User-defined category

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balance, setBalance] = useState(0);

  const categories = ['Food', 'Transport', 'Books', 'Fees', 'Entertainment', 'Salary', 'Other'];

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      let income = 0;
      let expenses = 0;
      const fetchedTransactions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        if (data.type === 'income') income += data.amount;
        if (data.type === 'expense') expenses += data.amount;
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate().toLocaleDateString(),
        };
      });
      setTransactions(fetchedTransactions);
      setTotalIncome(income);
      setTotalExpenses(expenses);
      setBalance(income - expenses);
    } catch (error) {
      console.error("Error fetching transactions: ", error);
      Alert.alert("Error", "Could not fetch transactions.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!description || !amount || !category) {
      Alert.alert("Missing Fields", "Please fill in description, amount, and category.");
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive amount.");
      return;
    }
    if (!auth.currentUser) return;

    setIsAddingTransaction(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        description,
        amount: numericAmount,
        type,
        category,
        timestamp: serverTimestamp(),
      });
      Alert.alert("Success", "Transaction added!");
      // Reset form & refetch
      setDescription('');
      setAmount('');
      setCategory('');
      setType('expense');
      fetchTransactions(); // Refetch to update list and summary
    } catch (error) {
      console.error("Error adding transaction: ", error);
      Alert.alert("Error", "Could not add transaction.");
    } finally {
      setIsAddingTransaction(false);
    }
  };

  const renderTransactionItem = ({ item }) => (
    <View style={[styles.transactionItem, item.type === 'income' ? styles.incomeItem : styles.expenseItem]}>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionText}>{item.description}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <Text style={[styles.transactionAmount, item.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
        {item.type === 'income' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Finance Tracker</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={[styles.summaryValue, styles.incomeText]}>${totalIncome.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={[styles.summaryValue, styles.expenseText]}>${totalExpenses.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Net Balance</Text>
          <Text style={[styles.summaryValue, balance >= 0 ? styles.incomeText : styles.expenseText]}>
            ${balance.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.addTransactionContainer}>
        <Text style={styles.subHeaderText}>Add New Transaction</Text>
        <TextInput
          style={styles.input}
          placeholder="Description"
          placeholderTextColor={colors.subtext}
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="Amount"
          placeholderTextColor={colors.subtext}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor={colors.subtext}
          value={date}
          onChangeText={setDate}
        />
        <View style={styles.transactionTypeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'income' ? styles.typeButtonActive : {}]}
            onPress={() => setType('income')}
          >
            <Text style={[styles.typeButtonText, type === 'income' ? styles.typeButtonTextActive: {}]}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'expense' ? styles.typeButtonActive : {}]}
            onPress={() => setType('expense')}
          >
            <Text style={[styles.typeButtonText, type === 'expense' ? styles.typeButtonTextActive: {}]}>Expense</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
          <Ionicons name="add-circle-outline" size={24} color={colors.buttonText} />
          <Text style={styles.addButtonText}>Add Transaction</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionListContainer}>
        <Text style={styles.subHeaderText}>Recent Transactions</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 20}}/>
        ) : transactions.length === 0 ? (
          <Text style={styles.noTransactionsText}>No transactions yet.</Text>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={item => item.id}
            scrollEnabled={false} // Disable FlatList scrolling, ScrollView handles it
          />
        )}
      </View>
    </ScrollView>
  );
};

const getStyles = (colors) => StyleSheet.create({ // Wrap StyleSheet.create
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.headerText,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: colors.card,
    marginHorizontal: 10,
    borderRadius: 10,
    marginTop: 15,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryBox: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  incomeText: {
    color: colors.success, // Use theme color for income
  },
  expenseText: {
    color: colors.error, // Use theme color for expense
  },
  addTransactionContainer: {
    padding: 15,
    backgroundColor: colors.card,
    marginHorizontal: 10,
    borderRadius: 10,
    marginTop: 15,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  subHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginHorizontal: 5,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  typeButtonTextActive: {
    color: colors.buttonText,
  },
  addButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  transactionListContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  transactionItem: {
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderLeftWidth: 5,
  },
  incomeItem: {
    borderColor: colors.success, // Use theme color
  },
  expenseItem: {
    borderColor: colors.error, // Use theme color
  },
  transactionDetails: {
    flex: 1,
  },
  transactionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 3,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: colors.success, // Use theme color
  },
  expenseAmount: {
    color: colors.error, // Use theme color
  },
  noTransactionsText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
    fontSize: 16,
  },
});

export default FinanceScreen;
