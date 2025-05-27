import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');
const API_URL = 'https://67ac71475853dfff53dab929.mockapi.io/api/v1';

export default function HomeScreen() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // New state for expense statistics
  const [stats, setStats] = useState({
    totalExpenses: 0,
    averageExpense: 0,
    highestExpense: 0,
    thisMonth: 0,
    lastMonth: 0,
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [expenses]);

  useEffect(() => {
    const scrollInterval = setInterval(() => {
      if (scrollViewRef.current) {
        const nextIndex = currentCardIndex === 0 ? 1 : 0;
        scrollViewRef.current.scrollTo({
          x: nextIndex * (width - 40),
          animated: true
        });
        setCurrentCardIndex(nextIndex);
      }
    }, 5000); // Switch every 5 seconds

    return () => clearInterval(scrollInterval);
  }, [currentCardIndex]);

  const calculateStats = () => {
    if (!expenses.length) {
      setStats({
        totalExpenses: 0,
        averageExpense: 0,
        highestExpense: 0,
        thisMonth: 0,
        lastMonth: 0,
      });
      return;
    }

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const highest = Math.max(...expenses.map(exp => parseFloat(exp.amount)));
    
    const thisMonthExpenses = expenses.filter(exp => {
      const date = new Date(exp.createdAt);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const lastMonthExpenses = expenses.filter(exp => {
      const date = new Date(exp.createdAt);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    setStats({
      totalExpenses: total,
      averageExpense: total / expenses.length,
      highestExpense: highest,
      thisMonth: thisMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
      lastMonth: lastMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
    });
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/expenses`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const data = await response.json();
      setExpenses(data);
      setError(null);
    } catch (err) {
      setError('Failed to load expenses. Please try again later.');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const handleDeleteExpense = async (id) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/expenses/${id}`, {
                method: 'DELETE',
              });
              if (!response.ok) {
                throw new Error('Failed to delete expense');
              }
              setExpenses(expenses.filter((expense) => expense.id !== id));
              Alert.alert('Success', 'Expense deleted successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete expense. Please try again.');
              console.error('Error deleting expense:', err);
            }
          },
        },
      ]
    );
  };

  const showExpenseDetails = (expense) => {
    Alert.alert(
      'Expense Details',
      `Title: ${expense.title}\n` +
      `Amount: $${parseFloat(expense.amount).toFixed(2)}\n` +
      `Description: ${expense.description || 'No description'}\n` +
      `Date: ${formatDate(expense.createdAt)}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => router.push(`/expense-details/${expense.id}`),
        },
      ]
    );
  };

  const filteredExpenses = expenses.filter((expense) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      expense.title?.toLowerCase().includes(searchLower) ||
      expense.description?.toLowerCase().includes(searchLower) ||
      parseFloat(expense.amount).toFixed(2).includes(searchQuery)
    );
  });

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonth = monthNames[new Date().getMonth()];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.title}>Financiza</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Fixed Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search expenses..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.mainScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsWrapper}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            style={styles.statsContainer}
            contentContainerStyle={styles.statsContent}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / (width - 40));
              setCurrentCardIndex(index);
            }}
            nestedScrollEnabled={true}
          >
            {/* Monthly Overview Card */}
            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statsTitle, { color: colors.text }]}>{currentMonth} Overview</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textLight }]}>This Month</Text>
                  <Text style={[styles.statValue, { color: colors.secondary }]}>
                    {formatCurrency(stats.thisMonth)}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textLight }]}>Last Month</Text>
                  <Text style={[styles.statValue, { color: colors.secondary }]}>
                    {formatCurrency(stats.lastMonth)}
                  </Text>
                </View>
              </View>
              <View style={[styles.monthComparison, { 
                backgroundColor: stats.thisMonth <= stats.lastMonth ? colors.success : colors.error 
              }]}>
                <Text style={styles.comparisonText}>
                  {stats.thisMonth <= stats.lastMonth 
                    ? '🎉 Spending less than last month!'
                    : '⚠️ Spending more than last month'}
                </Text>
              </View>
            </View>

            {/* Total Expenses Card */}
            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statsTitle, { color: colors.text }]}>Total Overview</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textLight }]}>Total Expenses</Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {formatCurrency(stats.totalExpenses)}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textLight }]}>Average</Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {formatCurrency(stats.averageExpense)}
                  </Text>
                </View>
              </View>
              <View style={styles.highestExpense}>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>Highest Expense</Text>
                <Text style={[styles.highestValue, { color: colors.error }]}>
                  {formatCurrency(stats.highestExpense)}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Pagination Dots */}
          <View style={styles.paginationDots}>
            <View style={[
              styles.dot,
              currentCardIndex === 0 && styles.activeDot,
              { backgroundColor: currentCardIndex === 0 ? colors.primary : colors.border }
            ]} />
            <View style={[
              styles.dot,
              currentCardIndex === 1 && styles.activeDot,
              { backgroundColor: currentCardIndex === 1 ? colors.primary : colors.border }
            ]} />
          </View>
        </View>

        {/* Expenses Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Expenses</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textLight }]}>
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'expense' : 'expenses'} recorded
          </Text>
        </View>

        {/* Expenses List */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchExpenses}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.expensesListContainer}>
            {filteredExpenses.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.expenseItem, { backgroundColor: colors.card }]}
                onPress={() => showExpenseDetails(item)}
              >
                <View style={styles.expenseContent}>
                  <View style={styles.expenseHeader}>
                    <Text style={[styles.expenseTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.expenseAmount, { color: colors.primary }]}>
                      {formatCurrency(parseFloat(item.amount))}
                    </Text>
                  </View>
                  <Text style={[styles.expenseDescription, { color: colors.textLight }]} numberOfLines={2}>
                    {item.description || 'No description'}
                  </Text>
                  <View style={[styles.expenseFooter, { borderTopColor: colors.border }]}>
                    <Text style={[styles.expenseDate, { color: colors.textLight }]}>
                      {formatDate(item.createdAt)}
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteExpense(item.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {filteredExpenses.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textLight }]}>
                  {searchQuery ? 'No matching expenses found' : 'No expenses yet'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={[styles.addFirstButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/expense-details')}
                  >
                    <Text style={styles.addFirstButtonText}>Add Your First Expense</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  refreshButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 22,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 5,
  },
  mainScroll: {
    flex: 1,
  },
  statsWrapper: {
    marginBottom: 15,
  },
  statsContainer: {
    minHeight: 170,
  },
  statsContent: {
    paddingHorizontal: 20,
  },
  statsCard: {
    width: width - 40,
    marginRight: 20,
    borderRadius: 15,
    padding: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 15,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  monthComparison: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  comparisonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  highestExpense: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  highestValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
  },
  expensesListContainer: {
    padding: 15,
    paddingTop: 5,
  },
  expenseItem: {
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  expenseContent: {
    padding: 15,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expenseDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  expenseDate: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  addFirstButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
}); 