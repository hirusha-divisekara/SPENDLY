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

import { Expense, getExpenses } from "../db/database";

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#F97316",
  Transport: "#3B82F6",
  Shopping: "#EC4899",
  Bills: "#8B5CF6",
  Entertainment: "#10B981",
  Health: "#EF4444",
  Other: "#64748B",
};

const CATEGORY_ICONS: Record<string, any> = {
  Food: "restaurant-outline",
  Transport: "car-outline",
  Shopping: "bag-handle-outline",
  Bills: "receipt-outline",
  Entertainment: "game-controller-outline",
  Health: "medkit-outline",
  Other: "ellipsis-horizontal-circle-outline",
};

export default function InsightsScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = async () => {
    try {
      setLoading(true);

      const data = await getExpenses();

      setExpenses(data);
    } catch (error) {
      console.error("❌ INSIGHTS LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  const formatAmount = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const monthlyExpenses = useMemo(() => {
    const now = new Date();

    return expenses.filter((expense) => {
      const date = new Date(expense.date);

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
  }, [expenses]);

  const monthlyTotal = useMemo(() => {
    return monthlyExpenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );
  }, [monthlyExpenses]);

  const weeklyTotal = useMemo(() => {
    const now = new Date();

    const startOfWeek = new Date(now);
    const day = now.getDay();

    startOfWeek.setDate(now.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    return expenses
      .filter((expense) => {
        const date = new Date(expense.date);

        return date >= startOfWeek && date <= now;
      })
      .reduce((total, expense) => total + expense.amount, 0);
  }, [expenses]);

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};

    monthlyExpenses.forEach((expense) => {
      totals[expense.category] =
        (totals[expense.category] || 0) + expense.amount;
    });

    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          monthlyTotal > 0 ? (amount / monthlyTotal) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyExpenses, monthlyTotal]);

  const topCategory = categoryData[0];

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

          <View style={styles.headerCenter}>
            <Text style={styles.title}>Insights</Text>

            <Text style={styles.subtitle}>
              Your spending overview
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.mutedText}>
              Loading insights...
            </Text>
          </View>
        ) : (
          <>
            {/* Total */}
            <View style={styles.totalCard}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.cardLabel}>
                    Total spent
                  </Text>

                  <Text style={styles.totalAmount}>
                    {formatAmount(monthlyTotal)}
                  </Text>
                </View>

                <View style={styles.iconCircle}>
                  <Ionicons
                    name="trending-up-outline"
                    size={23}
                    color="#22C55E"
                  />
                </View>
              </View>

              <Text style={styles.periodText}>
                This month
              </Text>
            </View>

            {/* Weekly */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#3B82F6"
                  />
                </View>

                <Text style={styles.statLabel}>
                  This week
                </Text>

                <Text style={styles.statValue}>
                  {formatAmount(weeklyTotal)}
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons
                    name="receipt-outline"
                    size={20}
                    color="#F97316"
                  />
                </View>

                <Text style={styles.statLabel}>
                  Transactions
                </Text>

                <Text style={styles.statValue}>
                  {monthlyExpenses.length}
                </Text>
              </View>
            </View>

            {/* Top Category */}
            {topCategory && (
              <View style={styles.topCard}>
                <View style={styles.topIcon}>
                  <Ionicons
                    name={
                      CATEGORY_ICONS[topCategory.category] ||
                      CATEGORY_ICONS.Other
                    }
                    size={25}
                    color={
                      CATEGORY_COLORS[topCategory.category] ||
                      CATEGORY_COLORS.Other
                    }
                  />
                </View>

                <View style={styles.topInfo}>
                  <Text style={styles.topLabel}>
                    Highest spending category
                  </Text>

                  <Text style={styles.topCategory}>
                    {topCategory.category}
                  </Text>

                  <Text style={styles.topAmount}>
                    {formatAmount(topCategory.amount)}
                  </Text>
                </View>

                <Text style={styles.topPercentage}>
                  {Math.round(topCategory.percentage)}%
                </Text>
              </View>
            )}

            {/* Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Spending by category
              </Text>

              {categoryData.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons
                    name="analytics-outline"
                    size={35}
                    color="#52525B"
                  />

                  <Text style={styles.emptyTitle}>
                    No spending data
                  </Text>

                  <Text style={styles.emptyText}>
                    Add some expenses to see your spending
                    breakdown.
                  </Text>
                </View>
              ) : (
                <View style={styles.categoryCard}>
                  {categoryData.map((item) => {
                    const color =
                      CATEGORY_COLORS[item.category] ||
                      CATEGORY_COLORS.Other;

                    const icon =
                      CATEGORY_ICONS[item.category] ||
                      CATEGORY_ICONS.Other;

                    return (
                      <View
                        key={item.category}
                        style={styles.categoryRow}
                      >
                        <View
                          style={[
                            styles.categoryIcon,
                            {
                              backgroundColor: `${color}20`,
                            },
                          ]}
                        >
                          <Ionicons
                            name={icon}
                            size={19}
                            color={color}
                          />
                        </View>

                        <View style={styles.categoryInfo}>
                          <View style={styles.categoryTop}>
                            <Text style={styles.categoryName}>
                              {item.category}
                            </Text>

                            <Text style={styles.categoryAmount}>
                              {formatAmount(item.amount)}
                            </Text>
                          </View>

                          <View style={styles.progressBackground}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${item.percentage}%`,
                                  backgroundColor: color,
                                },
                              ]}
                            />
                          </View>

                          <Text style={styles.percentageText}>
                            {Math.round(item.percentage)}%
                            of monthly spending
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
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

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerSpacer: {
    width: 42,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  subtitle: {
    color: "#71717A",
    fontSize: 12,
    marginTop: 3,
  },

  totalCard: {
    backgroundColor: "#18181B",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "#27272A",
    marginBottom: 15,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  cardLabel: {
    color: "#A1A1AA",
    fontSize: 13,
  },

  totalAmount: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "800",
    marginTop: 7,
  },

  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#22C55E20",
    alignItems: "center",
    justifyContent: "center",
  },

  periodText: {
    color: "#71717A",
    fontSize: 12,
    marginTop: 12,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 15,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#18181B",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#27272A",
  },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  statLabel: {
    color: "#71717A",
    fontSize: 11,
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 5,
  },

  topCard: {
    backgroundColor: "#18181B",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#27272A",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },

  topIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },

  topInfo: {
    flex: 1,
    marginLeft: 13,
  },

  topLabel: {
    color: "#71717A",
    fontSize: 11,
  },

  topCategory: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 3,
  },

  topAmount: {
    color: "#A1A1AA",
    fontSize: 12,
    marginTop: 3,
  },

  topPercentage: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },

  categoryCard: {
    backgroundColor: "#18181B",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#27272A",
    padding: 16,
  },

  categoryRow: {
    flexDirection: "row",
    marginBottom: 18,
  },

  categoryRowLast: {
    marginBottom: 0,
  },

  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },

  categoryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  categoryName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  categoryAmount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  progressBackground: {
    height: 6,
    backgroundColor: "#27272A",
    borderRadius: 3,
    marginTop: 9,
    overflow: "hidden",
  },

  progressFill: {
    height: 6,
    borderRadius: 3,
  },

  percentageText: {
    color: "#52525B",
    fontSize: 10,
    marginTop: 5,
  },

  emptyCard: {
    backgroundColor: "#18181B",
    borderRadius: 18,
    padding: 30,
    borderWidth: 1,
    borderColor: "#27272A",
    alignItems: "center",
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
  },

  emptyText: {
    color: "#71717A",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 5,
  },

  loadingContainer: {
    paddingTop: 100,
    alignItems: "center",
  },

  mutedText: {
    color: "#71717A",
    fontSize: 14,
  },
});