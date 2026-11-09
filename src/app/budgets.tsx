import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    addBudget,
    Budget,
    deleteBudget,
    Expense,
    getBudgets,
    getExpenses,
} from "../db/database";

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
];

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const [budgetData, expenseData] = await Promise.all([
        getBudgets(),
        getExpenses(),
      ]);

      setBudgets(budgetData);
      setExpenses(expenseData);
    } catch (error) {
      console.error("❌ BUDGET LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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

  const formatAmount = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const getSpentForCategory = (category: string) => {
    const now = new Date();

    return expenses
      .filter((expense) => {
        const date = new Date(expense.date);

        return (
          expense.category === category &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const totalBudget = useMemo(() => {
    return budgets.reduce(
      (total, budget) => total + budget.amount,
      0
    );
  }, [budgets]);

  const totalSpent = useMemo(() => {
    return budgets.reduce(
      (total, budget) =>
        total + getSpentForCategory(budget.category),
      0
    );
  }, [budgets, expenses]);

  const remaining = totalBudget - totalSpent;

  const overallProgress =
    totalBudget > 0
      ? Math.min(totalSpent / totalBudget, 1)
      : 0;

  const handleAddBudget = () => {
    Alert.prompt(
      "Set Budget",
      "Enter your monthly budget amount",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Next",
          onPress: (amountText?: string) => {
            const amount = Number(amountText);

            if (!amount || amount <= 0) {
              Alert.alert(
                "Invalid amount",
                "Please enter a valid budget amount."
              );
              return;
            }

            Alert.alert(
              "Choose Category",
              "Select a category",
              categories.map((category) => ({
                text: category,
                onPress: async () => {
                  try {
                    await addBudget(category, amount);
                    await loadData();
                  } catch (error) {
                    console.error(
                      "❌ ADD BUDGET ERROR:",
                      error
                    );

                    Alert.alert(
                      "Error",
                      "Could not save the budget."
                    );
                  }
                },
              }))
            );
          },
        },
      ],
      "plain-text"
    );
  };

  const handleDeleteBudget = (budget: Budget) => {
    Alert.alert(
      "Delete Budget",
      `Delete the ${budget.category} budget?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBudget(budget.id);
              await loadData();
            } catch (error) {
              console.error(
                "❌ DELETE BUDGET ERROR:",
                error
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>Budgets</Text>

            <Text style={styles.subtitle}>
              Manage your monthly spending
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addSmallButton}
            onPress={handleAddBudget}
          >
            <Ionicons
              name="add"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>
            Monthly budget
          </Text>

          <Text style={styles.overviewAmount}>
            {formatAmount(totalBudget)}
          </Text>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${overallProgress * 100}%`,
                  backgroundColor:
                    remaining < 0
                      ? "#EF4444"
                      : "#2563EB",
                },
              ]}
            />
          </View>

          <View style={styles.overviewBottom}>
            <View>
              <Text style={styles.smallLabel}>
                Spent
              </Text>

              <Text style={styles.spentAmount}>
                {formatAmount(totalSpent)}
              </Text>
            </View>

            <View style={styles.remainingContainer}>
              <Text style={styles.smallLabel}>
                {remaining >= 0
                  ? "Remaining"
                  : "Over budget"}
              </Text>

              <Text
                style={[
                  styles.remainingAmount,
                  {
                    color:
                      remaining >= 0
                        ? "#22C55E"
                        : "#EF4444",
                  },
                ]}
              >
                {formatAmount(Math.abs(remaining))}
              </Text>
            </View>
          </View>
        </View>

        {/* Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Category budgets
          </Text>

          <Text style={styles.count}>
            {budgets.length}
          </Text>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Loading budgets...
            </Text>
          </View>
        ) : budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="wallet-outline"
                size={30}
                color="#71717A"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No budgets yet
            </Text>

            <Text style={styles.emptyText}>
              Create a budget to start controlling your spending.
            </Text>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleAddBudget}
            >
              <Ionicons
                name="add"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.createButtonText}>
                Create Budget
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.budgetList}>
            {budgets.map((budget) => {
              const spent =
                getSpentForCategory(budget.category);

              const progress =
                budget.amount > 0
                  ? Math.min(spent / budget.amount, 1)
                  : 0;

              const percentage =
                budget.amount > 0
                  ? Math.round(
                      (spent / budget.amount) * 100
                    )
                  : 0;

              const isOverBudget =
                spent > budget.amount;

              const color =
                getCategoryColor(budget.category);

              return (
                <TouchableOpacity
                  key={budget.id}
                  style={styles.budgetCard}
                  activeOpacity={0.8}
                  onLongPress={() =>
                    handleDeleteBudget(budget)
                  }
                >
                  <View style={styles.budgetTop}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.categoryIcon,
                          {
                            backgroundColor:
                              `${color}20`,
                          },
                        ]}
                      >
                        <Ionicons
                          name={getCategoryIcon(
                            budget.category
                          )}
                          size={21}
                          color={color}
                        />
                      </View>

                      <View>
                        <Text style={styles.categoryName}>
                          {budget.category}
                        </Text>

                        <Text style={styles.budgetLimit}>
                          Budget:{" "}
                          {formatAmount(
                            budget.amount
                          )}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.percentageContainer}>
                      <Text
                        style={[
                          styles.percentage,
                          {
                            color: isOverBudget
                              ? "#EF4444"
                              : "#FFFFFF",
                          },
                        ]}
                      >
                        {percentage}%
                      </Text>

                      <Text style={styles.spentText}>
                        {formatAmount(spent)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressBackground}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progress * 100}%`,
                          backgroundColor:
                            isOverBudget
                              ? "#EF4444"
                              : color,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.budgetBottom}>
                    <Text style={styles.remainingText}>
                      {isOverBudget
                        ? `${formatAmount(
                            spent - budget.amount
                          )} over budget`
                        : `${formatAmount(
                            budget.amount - spent
                          )} remaining`}
                    </Text>

                    <Text style={styles.hintText}>
                      Long press to delete
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
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
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#18181B",
    borderWidth: 1,
    borderColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
    marginLeft: 14,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },

  subtitle: {
    color: "#71717A",
    fontSize: 12,
    marginTop: 4,
  },

  addSmallButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  overviewCard: {
    backgroundColor: "#18181B",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "#27272A",
    marginBottom: 28,
  },

  overviewLabel: {
    color: "#A1A1AA",
    fontSize: 13,
  },

  overviewAmount: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 7,
  },

  progressBackground: {
    height: 8,
    backgroundColor: "#27272A",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 18,
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
  },

  overviewBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  smallLabel: {
    color: "#71717A",
    fontSize: 11,
  },

  spentAmount: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },

  remainingContainer: {
    alignItems: "flex-end",
  },

  remainingAmount: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  count: {
    color: "#71717A",
    fontSize: 13,
    marginLeft: 8,
  },

  budgetList: {
    gap: 12,
  },

  budgetCard: {
    backgroundColor: "#18181B",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#27272A",
  },

  budgetTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  categoryName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  budgetLimit: {
    color: "#71717A",
    fontSize: 11,
    marginTop: 4,
  },

  percentageContainer: {
    alignItems: "flex-end",
  },

  percentage: {
    fontSize: 16,
    fontWeight: "800",
  },

  spentText: {
    color: "#71717A",
    fontSize: 10,
    marginTop: 3,
  },

  budgetBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  remainingText: {
    color: "#A1A1AA",
    fontSize: 11,
  },

  hintText: {
    color: "#3F3F46",
    fontSize: 9,
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

  createButton: {
    marginTop: 18,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  bottomSpace: {
    height: 20,
  },
});