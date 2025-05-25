import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Platform,
  RefreshControl,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { BarChart, PieChart } from 'react-native-gifted-charts';

// Try to import LinearGradient, fallback to View if not available
let LinearGradient;
try {
  LinearGradient = require('react-native-linear-gradient').default;
} catch (error) {
  LinearGradient = View;
}

const { width, height } = Dimensions.get('window');
const API_URL = 'http://localhost:3000/api/finance';

// Modern Design System
const colors = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  background: '#FAFBFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  income: '#10B981',
  expense: '#EF4444',
  incomeLight: '#D1FAE5',
  expenseLight: '#FEE2E2',
  gradientStart: '#6366F1',
  gradientEnd: '#8B5CF6',
};

const typography = {
  h1: { fontSize: 32, fontWeight: '800', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMedium: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  captionMedium: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const shadows = {
  small: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  large: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

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
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    fetchTransactions();
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Calculate totals
  const totalIncome = transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  const totalExpenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  const totalBalance = totalIncome - totalExpenses;

  // Fetch transactions
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/transactions`);
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Connection Error', 'Could not fetch transactions. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add transaction
  const handleAddTransaction = async () => {
    if (!newTransactionData.description || !newTransactionData.amount || !newTransactionData.category) {
      return Alert.alert('Missing Information', 'Please fill in all required fields to continue.');
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransactionData),
      });
      if (!response.ok) throw new Error('Failed to add transaction');
      
      Alert.alert('Success!', 'Your transaction has been added successfully.');
      fetchTransactions();
      resetNewTransactionData();
      setModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not add transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update transaction
  const handleUpdateTransaction = async () => {
    if (!editingTransaction || !newTransactionData.description || !newTransactionData.amount || !newTransactionData.category) {
      return Alert.alert('Missing Information', 'Please fill in all required fields to continue.');
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/transactions/${editingTransaction._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransactionData),
      });
      if (!response.ok) throw new Error('Failed to update transaction');
      
      Alert.alert('Updated!', 'Your transaction has been updated successfully.');
      fetchTransactions();
      resetNewTransactionData();
      setModalVisible(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async () => {
    if (!editingTransaction) return;

    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const response = await fetch(`${API_URL}/transactions/${editingTransaction._id}`, {
                method: 'DELETE',
              });
              if (!response.ok) throw new Error('Failed to delete transaction');
              
              Alert.alert('Deleted!', 'Transaction has been deleted successfully.');
              fetchTransactions();
              resetNewTransactionData();
              setModalVisible(false);
              setEditingTransaction(null);
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Could not delete transaction. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // Reset form data
  const resetNewTransactionData = () => {
    setNewTransactionData({
      description: '',
      amount: '',
      type: 'income',
      category: '',
      date: '',
    });
  };

  // Calculate category data for pie chart
  const categoryData = transactions.reduce((acc, transaction) => {
    const { category, amount, type } = transaction;
    if (type === 'expense') {
      const existingCategory = acc.find((item) => item.text === category);
      if (existingCategory) {
        existingCategory.value += parseFloat(amount);
      } else {
        acc.push({ 
          text: category, 
          value: parseFloat(amount),
          color: getCategoryColor(category),
        });
      }
    }
    return acc;
  }, []);

  // Get random color for categories
  const getCategoryColor = (category) => {
    const colorPalette = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorPalette[Math.abs(hash) % colorPalette.length];
  };

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions().then(() => setRefreshing(false));
  }, []);

  // Loading state
  if (isLoading && transactions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.md }]}>
            Loading Your Finances...
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
            Preparing your financial overview
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header Section */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <LinearGradient
          colors={LinearGradient === View ? [] : [colors.gradientStart, colors.gradientEnd]}
          style={[styles.headerGradient, LinearGradient === View && { backgroundColor: colors.primary }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[typography.h1, { color: colors.surface }]}>
                  Finance
                </Text>
                <Text style={[typography.caption, { color: colors.surface, opacity: 0.9 }]}>
                  Track your financial journey
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  resetNewTransactionData();
                  setModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Icon name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Balance Overview */}
            <View style={styles.balanceCard}>
              <Text style={[typography.captionMedium, { color: colors.textSecondary }]}>
                Total Balance
              </Text>
              <Text style={[typography.h1, { color: colors.text, marginVertical: spacing.xs }]}>
                ${totalBalance.toFixed(2)}
              </Text>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <View style={[styles.balanceIndicator, { backgroundColor: colors.income }]} />
                  <Text style={[typography.small, { color: colors.textMuted }]}>Income</Text>
                  <Text style={[typography.captionMedium, { color: colors.income }]}>
                    +${totalIncome.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.balanceItem}>
                  <View style={[styles.balanceIndicator, { backgroundColor: colors.expense }]} />
                  <Text style={[typography.small, { color: colors.textMuted }]}>Expenses</Text>
                  <Text style={[typography.captionMedium, { color: colors.expense }]}>
                    -${totalExpenses.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Quick Stats */}
        <View style={styles.section}>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, shadows.small]}>
              <View style={[styles.statIcon, { backgroundColor: colors.incomeLight }]}>
                <Icon name="trending-up" size={20} color={colors.income} />
              </View>
              <Text style={[typography.captionMedium, { color: colors.text }]}>
                This Month
              </Text>
              <Text style={[typography.h3, { color: colors.income }]}>
                +${totalIncome.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.statCard, shadows.small]}>
              <View style={[styles.statIcon, { backgroundColor: colors.expenseLight }]}>
                <Icon name="trending-down" size={20} color={colors.expense} />
              </View>
              <Text style={[typography.captionMedium, { color: colors.text }]}>
                This Month
              </Text>
              <Text style={[typography.h3, { color: colors.expense }]}>
                -${totalExpenses.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Spending Categories Chart */}
        {categoryData.length > 0 && (
          <View style={[styles.section, styles.chartSection]}>
            <View style={[styles.card, shadows.medium]}>
              <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
                Spending Breakdown
              </Text>
              <View style={styles.chartContainer}>
                <PieChart
                  data={categoryData}
                  donut
                  radius={80}
                  innerRadius={50}
                  focusOnPress
                  showText
                  textColor={colors.text}
                  textSize={12}
                  strokeWidth={2}
                  strokeColor={colors.surface}
                />
                <View style={styles.chartLegend}>
                  {categoryData.slice(0, 4).map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                      <Text style={[typography.small, { color: colors.textMuted, flex: 1 }]}>
                        {item.text}
                      </Text>
                      <Text style={[typography.captionMedium, { color: colors.text }]}>
                        ${item.value.toFixed(0)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={[styles.card, shadows.medium]}>
            <View style={styles.sectionHeader}>
              <Text style={[typography.h3, { color: colors.text }]}>
                Recent Transactions
              </Text>
              {transactions.length > 5 && (
                <TouchableOpacity>
                  <Text style={[typography.captionMedium, { color: colors.primary }]}>
                    View All
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {transactions.length > 0 ? (
              <View style={styles.transactionsList}>
                {transactions.slice(0, 5).map((transaction, index) => (
                  <TouchableOpacity
                    key={transaction._id}
                    style={[
                      styles.transactionItem,
                      index === transactions.slice(0, 5).length - 1 && styles.lastTransactionItem
                    ]}
                    onPress={() => {
                      setEditingTransaction(transaction);
                      setNewTransactionData({
                        ...transaction,
                        date: new Date(transaction.date).toISOString().split('T')[0],
                      });
                      setModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.transactionIcon,
                      { backgroundColor: transaction.type === 'income' ? colors.incomeLight : colors.expenseLight }
                    ]}>
                      <Icon
                        name={transaction.type === 'income' ? 'arrow-down' : 'arrow-up'}
                        size={16}
                        color={transaction.type === 'income' ? colors.income : colors.expense}
                      />
                    </View>
                    
                    <View style={styles.transactionDetails}>
                      <Text style={[typography.bodyMedium, { color: colors.text }]}>
                        {transaction.description}
                      </Text>
                      <Text style={[typography.small, { color: colors.textMuted }]}>
                        {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <Text style={[
                      typography.bodyMedium,
                      { color: transaction.type === 'income' ? colors.income : colors.expense }
                    ]}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="receipt-outline" size={48} color={colors.textMuted} />
                <Text style={[typography.h3, { color: colors.textMuted, marginTop: spacing.md }]}>
                  No Transactions Yet
                </Text>
                <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
                  Start tracking your finances by adding your first transaction
                </Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: spacing.lg }]}
                  onPress={() => {
                    resetNewTransactionData();
                    setModalVisible(true);
                  }}
                >
                  <Text style={[typography.bodyMedium, { color: colors.surface }]}>
                    Add Transaction
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Transaction Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setModalVisible(false);
          setEditingTransaction(null);
          resetNewTransactionData();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setEditingTransaction(null);
                resetNewTransactionData();
              }}
            >
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[typography.h3, { color: colors.text }]}>
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Transaction Type Selector */}
            <View style={styles.formSection}>
              <Text style={[typography.captionMedium, { color: colors.text, marginBottom: spacing.sm }]}>
                Transaction Type
              </Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newTransactionData.type === 'income' && styles.typeOptionActive,
                    { borderColor: newTransactionData.type === 'income' ? colors.income : colors.border }
                  ]}
                  onPress={() => setNewTransactionData({ ...newTransactionData, type: 'income' })}
                >
                  <Icon
                    name="arrow-down"
                    size={20}
                    color={newTransactionData.type === 'income' ? colors.income : colors.textMuted}
                  />
                  <Text style={[
                    typography.bodyMedium,
                    { color: newTransactionData.type === 'income' ? colors.income : colors.textMuted }
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newTransactionData.type === 'expense' && styles.typeOptionActive,
                    { borderColor: newTransactionData.type === 'expense' ? colors.expense : colors.border }
                  ]}
                  onPress={() => setNewTransactionData({ ...newTransactionData, type: 'expense' })}
                >
                  <Icon
                    name="arrow-up"
                    size={20}
                    color={newTransactionData.type === 'expense' ? colors.expense : colors.textMuted}
                  />
                  <Text style={[
                    typography.bodyMedium,
                    { color: newTransactionData.type === 'expense' ? colors.expense : colors.textMuted }
                  ]}>
                    Expense
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Description Field */}
            <View style={styles.formSection}>
              <Text style={[typography.captionMedium, { color: colors.text, marginBottom: spacing.sm }]}>
                Description
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter description"
                placeholderTextColor={colors.textMuted}
                value={newTransactionData.description}
                onChangeText={(text) => setNewTransactionData({ ...newTransactionData, description: text })}
              />
            </View>

            {/* Amount Field */}
            <View style={styles.formSection}>
              <Text style={[typography.captionMedium, { color: colors.text, marginBottom: spacing.sm }]}>
                Amount
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={newTransactionData.amount}
                onChangeText={(text) => setNewTransactionData({ ...newTransactionData, amount: text })}
                keyboardType="numeric"
              />
            </View>

            {/* Category Field */}
            <View style={styles.formSection}>
              <Text style={[typography.captionMedium, { color: colors.text, marginBottom: spacing.sm }]}>
                Category
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter category"
                placeholderTextColor={colors.textMuted}
                value={newTransactionData.category}
                onChangeText={(text) => setNewTransactionData({ ...newTransactionData, category: text })}
              />
            </View>

            {/* Date Field */}
            <View style={styles.formSection}>
              <Text style={[typography.captionMedium, { color: colors.text, marginBottom: spacing.sm }]}>
                Date
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={newTransactionData.date}
                onChangeText={(text) => setNewTransactionData({ ...newTransactionData, date: text })}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.primaryButton, { opacity: isSubmitting ? 0.7 : 1 }]}
                onPress={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={[typography.bodyMedium, { color: colors.surface }]}>
                    {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                  </Text>
                )}
              </TouchableOpacity>

              {editingTransaction && (
                <TouchableOpacity
                  style={[styles.dangerButton, { opacity: isSubmitting ? 0.7 : 1, marginTop: spacing.md }]}
                  onPress={handleDeleteTransaction}
                  disabled={isSubmitting}
                >
                  <Text style={[typography.bodyMedium, { color: colors.surface }]}>
                    Delete Transaction
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    ...shadows.medium,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  balanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  balanceIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginBottom: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    flex: 1,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  chartSection: {
    marginTop: spacing.lg,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartLegend: {
    marginTop: spacing.lg,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  transactionsList: {
    marginTop: spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  lastTransactionItem: {
    borderBottomWidth: 0,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  formSection: {
    marginTop: spacing.lg,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderRadius: 12,
    marginHorizontal: spacing.xs,
  },
  typeOptionActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  modalActions: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
});

export default FinanceScreen;
