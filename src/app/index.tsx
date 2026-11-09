import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import BottomNav from "../components/BottomNav";
import { Expense, getExpenses } from "../db/database";

export default function HomeScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = async () => {
    try {
      setLoading(true);

      const data = await getExpenses();

      console.log("🏠 HOME LOADED EXPENSES:", data);

      setExpenses(data);
    } catch (error) {
      console.error("❌ HOME LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  const monthlyTotal = useMemo(() => {
    const now = new Date();

    return expenses
      .filter((expense) => {
        const date = new Date(expense.date);

        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((total, expense) => total + expense.amount, 0);
  }, [expenses]);

  const formatAmount = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const getCategoryIcon = (category: string): any => {
    switch (category) {
      case "Food":
        return "restaurant-outline";
      case "Transport":
        return "car-outline";
      case "Shopping":
        return "bag-handle-outline";
      case "Bills":
        return "receipt-outline";
      case "Entertainment":
        return "game-controller-outline";
      case "Health":
        return "medkit-outline";
      default:
        return "ellipsis-horizontal-circle-outline";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Food":
        return "#F97316";
      case "Transport":
        return "#3B82F6";
      case "Shopping":
        return "#EC4899";
      case "Bills":
        return "#8B5CF6";
      case "Entertainment":
        return "#10B981";
      case "Health":
        return "#EF4444";
      default:
        return "#64748B";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return "Today";
    }

    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good evening 👋</Text>
            <Text style={styles.name}>Hirusha</Text>
          </View>

          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileText}>H</Text>
          </TouchableOpacity>
        </View>

        {/* Month */}
        <Text style={styles.month}>
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </Text>

        {/* Total Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total spent</Text>

          <Text style={styles.totalAmount}>
            {formatAmount(monthlyTotal)}
          </Text>

          <View style={styles.totalBottom}>
            <View style={styles.statusDot} />

            <Text style={styles.statusText}>
              This month
            </Text>
          </View>
        </View>

        {/* Add Expense */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/add-expense")}
          activeOpacity={0.8}
        >
          <View style={styles.addIcon}>
            <Ionicons
              name="add"
              size={25}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.addText}>
            Add Expense
          </Text>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#71717A"
          />
        </TouchableOpacity>

        {/* Recent Expenses */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Recent expenses
          </Text>

          {expenses.length > 0 && (
            <Text style={styles.count}>
              {expenses.length}
            </Text>
          )}
        </View>

        {/* Expense Content */}
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Loading expenses...
            </Text>
          </View>
        ) : expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="wallet-outline"
                size={30}
                color="#71717A"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No expenses yet
            </Text>

            <Text style={styles.emptyText}>
              Add your first expense to start tracking your spending.
            </Text>
          </View>
        ) : (
          <View style={styles.expensesList}>
            {expenses.slice(0, 10).map((expense) => {
              const categoryColor =
                getCategoryColor(expense.category);

              return (
                <TouchableOpacity
                  key={expense.id}
                  style={styles.expenseItem}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: "/edit-expense",
                      params: {
                        id: String(expense.id),
                      },
                    })
                  }
                >
                  <View
                    style={[
                      styles.expenseIcon,
                      {
                        backgroundColor: `${categoryColor}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getCategoryIcon(expense.category)}
                      size={22}
                      color={categoryColor}
                    />
                  </View>

                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseCategory}>
                      {expense.category}
                    </Text>

                    <Text style={styles.expenseNote}>
                      {expense.note || formatDate(expense.date)}
                    </Text>
                  </View>

                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>
                      - {formatAmount(expense.amount)}
                    </Text>

                    <Text style={styles.expenseDate}>
                      {formatDate(expense.date)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090B",
  },

  content: {
    padding: 20,
    paddingBottom: 110,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  greeting: {
    color: "#71717A",
    fontSize: 14,
  },

  name: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
    marginTop: 3,
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },

  profileText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  month: {
    color: "#71717A",
    fontSize: 13,
    marginTop: 12,
    marginBottom: 20,
  },

  totalCard: {
    backgroundColor: "#18181B",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "#27272A",
    marginBottom: 15,
  },

  totalLabel: {
    color: "#A1A1AA",
    fontSize: 14,
  },

  totalAmount: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 8,
  },

  totalBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 7,
  },

  statusText: {
    color: "#71717A",
    fontSize: 12,
  },

  addButton: {
    height: 60,
    backgroundColor: "#2563EB",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 30,
  },

  addIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  addText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  count: {
    marginLeft: 8,
    color: "#71717A",
    fontSize: 13,
  },

  expensesList: {
    gap: 10,
  },

  expenseItem: {
    backgroundColor: "#18181B",
    borderRadius: 17,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#27272A",
  },

  expenseIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  expenseInfo: {
    flex: 1,
    marginLeft: 12,
  },

  expenseCategory: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  expenseNote: {
    color: "#71717A",
    fontSize: 12,
    marginTop: 4,
  },

  expenseRight: {
    alignItems: "flex-end",
  },

  expenseAmount: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  expenseDate: {
    color: "#52525B",
    fontSize: 11,
    marginTop: 4,
  },

  emptyState: {
    backgroundColor: "#18181B",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#27272A",
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  emptyText: {
    color: "#71717A",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});