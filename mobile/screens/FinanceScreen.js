import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Platform,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { BarChart, PieChart } from 'react-native-gifted-charts'; // Using gifted charts for more options

const API_URL = 'http://localhost:3000/api/finance'; // Ensure this is your backend URL

const FinanceScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newTransactionData, setNewTransactionData] = useState({
    description: '',
    amount: '',
    type: 'income',
    category: '',
    date: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Define totalIncome and totalExpenses in the component scope
  const totalIncome = transactions
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0); // Added || 0 for safety

  const totalExpenses = transactions
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0); // Added || 0 for safety

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/transactions`);
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransactionData.description || !newTransactionData.amount || !newTransactionData.category) {
      return Alert.alert('Missing Fields', 'Please fill in all fields');
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransactionData),
      });
      if (!response.ok) throw new Error('Failed to add transaction');
      Alert.alert('Success', 'Transaction added!');
      fetchTransactions();
      resetNewTransactionData();
      setModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction || !newTransactionData.description || !newTransactionData.amount || !newTransactionData.category) {
      return Alert.alert('Missing Fields', 'Please fill in all fields');
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/transactions/${editingTransaction._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransactionData),
      });
      if (!response.ok) throw new Error('Failed to update transaction');
      Alert.alert('Success', 'Transaction updated!');
      fetchTransactions();
      resetNewTransactionData();
      setModalVisible(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!editingTransaction) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/transactions/${editingTransaction._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete transaction');
      Alert.alert('Success', 'Transaction deleted!');
      fetchTransactions();
      resetNewTransactionData();
      setModalVisible(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not delete transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetNewTransactionData = () => {
    setNewTransactionData({
      description: '',
      amount: '',
      type: 'income',
      category: '',
      date: '',
    });
  };

  const calculateTotalBalance = () => {
    // No need to recalculate totalIncome and totalExpenses here, use the ones from component scope
    return totalIncome - totalExpenses;
  };

  const categoryData = transactions.reduce((acc, transaction) => {
    const { category, amount } = transaction;
    const existingCategory = acc.find(item => item.name === category);
    if (existingCategory) {
      existingCategory.amount += parseFloat(amount);
    } else {
      acc.push({ name: category, amount: parseFloat(amount) });
    }
    return acc;
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions().then(() => setRefreshing(false));
  }, []);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || newTransactionData.date;
    setShowDatePicker(Platform.OS === 'ios');
    setNewTransactionData({ ...newTransactionData, date: currentDate.toISOString().split('T')[0] });
  };

  if (isLoading && transactions.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: '#F0F0F0' /* formerly colors.background */ }]}>
        <ActivityIndicator size="large" color="#007AFF" /* formerly colors.primary */ />
        <Text style={textStyle('label', '#333333' /* formerly colors.text */)}>Loading Finances...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#F0F0F0' /* formerly colors.background */ }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF' /* colors.primary */]} />}
    >
      <View style={styles.headerContainer}>
        <Text style={[textStyle('header'), { fontSize: 24, color: '#333333' /* formerly colors.text */ }]}>Financial Overview</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={buttonStyle()}>
          <Text style={buttonTextStyle}>Add Transaction</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[cardStyle('#E6F3FF' /* a light blue, or colors.primary + opacity */), styles.summaryCard]}>
          <Icon name="wallet-outline" size={28} color="#007AFF" /* formerly colors.primary */ />
          <Text style={textStyle('label', '#007AFF' /* formerly colors.primary */)}>Total Balance</Text>
          <Text style={[textStyle('header'), { fontSize: 20, color: '#007AFF' /* formerly colors.primary */ }]}>${calculateTotalBalance().toFixed(2)}</Text>
        </View>
        <View style={[cardStyle('#E6FFED' /* a light green */), styles.summaryCard]}>
          <Icon name="arrow-up-circle-outline" size={28} color="#34C759" />
          <Text style={textStyle('label', '#34C759')}>Total Income</Text>
          <Text style={[textStyle('header'), { fontSize: 20, color: '#34C759' }]}>${totalIncome.toFixed(2)}</Text>
        </View>
        <View style={[cardStyle('#FFF0F0' /* a light red */), styles.summaryCard]}>
          <Icon name="arrow-down-circle-outline" size={28} color="#FF3B30" />
          <Text style={textStyle('label', '#FF3B30')}>Total Expenses</Text>
          <Text style={[textStyle('header'), { fontSize: 20, color: '#FF3B30' }]}>${totalExpenses.toFixed(2)}</Text>
        </View>
      </View>

      {/* Charts */}
      {transactions.length > 0 && (
        <View style={cardStyle()}>
          <Text style={[textStyle('header'), { marginBottom: 10, color: '#333333' /* formerly colors.text */ }]}>Spending Categories</Text>
          {categoryData.length > 0 ? (
            <PieChart
              data={categoryData}
              donut
              showText
              textColor="#333333" // formerly colors.text
              radius={80}
              innerRadius={50}
              textSize={12}
              // fontFamily={fonts.regular}
              focusOnPress
              textBackgroundColor="transparent" // Ensure text is visible
              textBackgroundRadius={10}
            />
          ) : <Text style={textStyle('muted', '#555555' /* formerly colors.textMuted */)}>No spending data for categories yet.</Text>}
        </View>
      )}

      {/* Recent Transactions */}
      <View style={cardStyle()}>
        <Text style={[textStyle('header'), { marginBottom: 10, color: '#333333' /* formerly colors.text */ }]}>Recent Transactions</Text>
        {transactions.length > 0 ? transactions.slice(0, 5).map(item => (
          <TouchableOpacity key={item._id} style={styles.transactionItem} onPress={() => {
            setEditingTransaction(item);
            setNewTransactionData({ ...item, date: new Date(item.date).toISOString().split('T')[0] });
            setModalVisible(true);
          }}>
            <Icon
              name={item.type === 'income' ? 'trending-up-outline' : 'trending-down-outline'}
              size={24}
              color={item.type === 'income' ? '#34C759' : '#FF3B30'}
            />
            <View style={styles.transactionDetails}>
              <Text style={textStyle('label', '#333333' /* formerly colors.text */)}>{item.description}</Text>
              <Text style={textStyle('muted', '#555555' /* formerly colors.textMuted */)}>{item.category} - {new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <Text style={textStyle('label', item.type === 'income' ? '#34C759' : '#FF3B30')}>
              {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
            </Text>
          </TouchableOpacity>
        )) : <Text style={textStyle('muted', '#555555' /* formerly colors.textMuted */)}>No transactions yet. Add one!</Text>}
      </View>

      {/* Add/Edit Transaction Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditingTransaction(null);
          resetNewTransactionData();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#F8F8F8' /* formerly colors.background */, borderColor: '#CCCCCC' /* formerly colors.border */ }]}
          >
            <Text style={[textStyle('header'), { marginBottom: 20, fontSize: 20, color: '#333333' /* formerly colors.text */ }]}>
              {editingTransaction ? 'Edit' : 'Add New'} Transaction
            </Text>

            <Text style={textStyle('label', '#333333' /* formerly colors.text */)}>Description:</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g., Textbooks, Coffee"
              value={newTransactionData.description}
              onChangeText={(text) => setNewTransactionData({ ...newTransactionData, description: text })}
              placeholderTextColor="#AAAAAA" // formerly colors.placeholder
            />

            <Text style={textStyle('label', '#333333' /* formerly colors.text */)}>Amount:</Text>
            <TextInput
              style={inputStyle}
              placeholder="0.00"
              value={newTransactionData.amount}
              onChangeText={(text) => setNewTransactionData({ ...newTransactionData, amount: text })}
              keyboardType="numeric"
              placeholderTextColor="#AAAAAA" // formerly colors.placeholder
            />

            <Text style={textStyle('label', '#333333' /* formerly colors.text */)}>Type:</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: newTransactionData.type === 'income' ? '#34C759' : '#EFEFEF' /* formerly colors.card */ },
                  { borderColor: newTransactionData.type === 'income' ? '#34C759' : '#CCCCCC' /* formerly colors.border */ }
                ]}
                onPress={() => setNewTransactionData({ ...newTransactionData, type: 'income' })}
              >
                <Text style={textStyle('label', newTransactionData.type === 'income' ? '#FFFFFF' /* formerly colors.buttonText */ : '#333333' /* formerly colors.text */)}>Income</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: newTransactionData.type === 'expense' ? '#FF3B30' : '#EFEFEF' /* formerly colors.card */ },
                  { borderColor: newTransactionData.type === 'expense' ? '#FF3B30' : '#CCCCCC' /* formerly colors.border */ }
                ]}
                onPress={() => setNewTransactionData({ ...newTransactionData, type: 'expense' })}
              >
                <Text style={textStyle('label', newTransactionData.type === 'expense' ? '#FFFFFF' /* formerly colors.buttonText */ : '#333333' /* formerly colors.text */)}>Expense</Text>
              </TouchableOpacity>
            </View>

            <Text style={textStyle('label', '#333333' /* formerly colors.text */)}>Category:</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g., Education, Food, Bills"
              value={newTransactionData.category}
              onChangeText={(text) => setNewTransactionData({ ...newTransactionData, category: text })}
              placeholderTextColor="#AAAAAA" // formerly colors.placeholder
            />

            <Text style={textStyle('label', '#333333' /* formerly colors.text */)}>Date:</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[inputStyle, styles.datePickerButton]}>
                <Text style={{color: '#333333' /* formerly colors.text */}}>{newTransactionData.date || 'Select Date'}</Text>
                <Icon name="calendar-outline" size={20} color={'#333333' /* formerly colors.text */} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(newTransactionData.date || Date.now())} // Ensure a valid date is passed
                mode="date"
                display="default"
                onChange={handleDateChange}
                // themeVariant={colors.theme === 'dark' ? 'dark' : 'light'} // This might need adjustment or removal
              />
            )}

            <TouchableOpacity
              style={[buttonStyle(), { opacity: isSubmitting ? 0.7 : 1 }]} // Use primary button style
              onPress={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /* formerly colors.buttonText */ /> : <Text style={buttonTextStyle}>{editingTransaction ? 'Update' : 'Add'} Transaction</Text>}
            </TouchableOpacity>

            {editingTransaction && (
                <TouchableOpacity
                    style={[buttonStyle('danger'), { marginTop: 10, opacity: isSubmitting ? 0.7 : 1 }]} // Danger button style
                    onPress={handleDeleteTransaction}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <ActivityIndicator color="#FFFFFF" /* formerly colors.buttonText */ /> : <Text style={buttonTextStyle}>Delete Transaction</Text>}
                </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[buttonStyle('cancel'), { backgroundColor: '#AAAAAA' /* formerly colors.border or a neutral grey */, marginTop: 10 }]} // Cancel button style
              onPress={() => {
                setModalVisible(false);
                setEditingTransaction(null);
                resetNewTransactionData();
              }}
            >
              <Text style={buttonTextStyle}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

const cardStyle = (customBackgroundColor) => ({
  backgroundColor: customBackgroundColor || '#FFFFFF', // formerly colors.card
  borderRadius: 12,
  padding: 15,
  marginBottom: 15,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 3,
});

const textStyle = (type = 'primary', customColor) => ({
    // fontFamily: type === 'header' || type === 'label' ? fonts.bold : fonts.regular,
    fontWeight: type === 'header' || type === 'label' ? 'bold' : 'normal',
    color: customColor || (type === 'muted' ? '#555555' : '#333333'), // formerly colors.textMuted or colors.text
    fontSize: type === 'header' ? 18 : (type === 'label' ? 16 : 14),
});

const inputStyle = {
  borderWidth: 1,
  borderColor: '#CCCCCC', // formerly colors.border
  borderRadius: 8,
  padding: Platform.OS === 'ios' ? 12 : 10,
  fontSize: 16,
  marginBottom: 10,
  backgroundColor: '#FFFFFF', // formerly colors.inputBackground || colors.card
  color: '#333333', // formerly colors.text
};

const buttonStyle = (type = 'primary') => ({
  backgroundColor: type === 'danger' ? '#FF3B30' : '#007AFF', // formerly colors.danger or colors.primary
  paddingVertical: 12,
  borderRadius: 8,
  alignItems: 'center',
  marginTop: 10,
});

const buttonTextStyle = {
  color: '#FFFFFF', // formerly colors.buttonText
  fontSize: 16,
  // fontFamily: fonts.bold,
  fontWeight: 'bold',
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 15,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10, // Reduced margin as cards have their own
  },
  summaryCard: {
    flex: 1, // Make cards take equal width
    alignItems: 'center',
    paddingVertical: 15,
    marginHorizontal: 5, // Add some horizontal spacing between cards
    // backgroundColor, borderRadius etc are set by cardStyle()
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    // borderBottomColor: colors.border, // Set statically
    borderBottomColor: '#EAEAEA',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    // backgroundColor and borderColor are set dynamically
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 5,
    // backgroundColor and borderColor are set dynamically
  },
  datePickerButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      // inputStyle is applied
  },
  // Other styles remain unchanged if they are not theme-dependent
});

export default FinanceScreen;
