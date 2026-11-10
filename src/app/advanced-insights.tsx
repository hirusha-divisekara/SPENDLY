import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    Budget,
    Expense,
    getBudgets,
    getExpenses,
} from "../db/database";

const BLUE = "#2563EB";
const GOLD = "#B88A24";
const BG = "#F5F8FC";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";
const BORDER = "rgba(148,163,184,0.18)";
const GREEN = "#16A34A";
const RED = "#DC2626";
const ORANGE = "#EA580C";

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

type CategoryInsight = {
  category: string;
  amount: number;
  percentage: number;
  previousAmount: number;
  change: number;
};

type Insight = {
  icon: any;
  title: string;
  text: string;
  type: "positive" | "warning" | "neutral";
};

export default function AdvancedInsightsScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const [expenseData, budgetData] = await Promise.all([
        getExpenses(),
        getBudgets(),
      ]);

      setExpenses(expenseData);
      setBudgets(budgetData);
    } catch (error) {
      console.error("❌ ADVANCED INSIGHTS LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const formatAmount = (amount: number) => {
    return `Rs. ${Math.round(amount).toLocaleString()}`;
  };

  const formatPercent = (value: number) => {
    return `${Math.abs(value).toFixed(1)}%`;
  };

  const getMonthKey = (date: Date) => {
    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
  };

  const currentMonthKey = useMemo(() => {
    return getMonthKey(new Date());
  }, []);

  const previousMonthKey = useMemo(() => {
    const date = new Date();

    date.setMonth(date.getMonth() - 1);

    return getMonthKey(date);
  }, []);

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(
      (expense) =>
        getMonthKey(new Date(expense.date)) ===
        currentMonthKey
    );
  }, [expenses, currentMonthKey]);

  const previousMonthExpenses = useMemo(() => {
    return expenses.filter(
      (expense) =>
        getMonthKey(new Date(expense.date)) ===
        previousMonthKey
    );
  }, [expenses, previousMonthKey]);

  const totalSpent = useMemo(() => {
    return currentMonthExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
  }, [currentMonthExpenses]);

  const previousTotal = useMemo(() => {
    return previousMonthExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
  }, [previousMonthExpenses]);

  const monthlyChange = useMemo(() => {
    if (previousTotal === 0) {
      return totalSpent > 0 ? 100 : 0;
    }

    return ((totalSpent - previousTotal) / previousTotal) * 100;
  }, [totalSpent, previousTotal]);

  const transactionCount = currentMonthExpenses.length;

  const averageTransaction = useMemo(() => {
    if (transactionCount === 0) {
      return 0;
    }

    return totalSpent / transactionCount;
  }, [totalSpent, transactionCount]);

  const categoryData = useMemo<CategoryInsight[]>(() => {
    const currentMap: Record<string, number> = {};
    const previousMap: Record<string, number> = {};

    currentMonthExpenses.forEach((expense) => {
      currentMap[expense.category] =
        (currentMap[expense.category] || 0) +
        expense.amount;
    });

    previousMonthExpenses.forEach((expense) => {
      previousMap[expense.category] =
        (previousMap[expense.category] || 0) +
        expense.amount;
    });

    return Object.keys(currentMap)
      .map((category) => {
        const amount = currentMap[category];
        const previousAmount =
          previousMap[category] || 0;

        let change = 0;

        if (previousAmount === 0) {
          change = amount > 0 ? 100 : 0;
        } else {
          change =
            ((amount - previousAmount) /
              previousAmount) *
            100;
        }

        return {
          category,
          amount,
          previousAmount,
          change,
          percentage:
            totalSpent > 0
              ? (amount / totalSpent) * 100
              : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [
    currentMonthExpenses,
    previousMonthExpenses,
    totalSpent,
  ]);

  const topCategory = categoryData[0];

  const highestTransaction = useMemo(() => {
    if (currentMonthExpenses.length === 0) {
      return null;
    }

    return [...currentMonthExpenses].sort(
      (a, b) => b.amount - a.amount
    )[0];
  }, [currentMonthExpenses]);

  const spendingDayData = useMemo(() => {
    const days: Record<
      string,
      { total: number; count: number }
    > = {};

    currentMonthExpenses.forEach((expense) => {
      const date = new Date(expense.date);
      const day = date.toLocaleDateString(
        "en-US",
        { weekday: "long" }
      );

      if (!days[day]) {
        days[day] = {
          total: 0,
          count: 0,
        };
      }

      days[day].total += expense.amount;
      days[day].count += 1;
    });

    return Object.entries(days)
      .map(([day, value]) => ({
        day,
        ...value,
      }))
      .sort((a, b) => b.total - a.total);
  }, [currentMonthExpenses]);

  const mostActiveDay = spendingDayData[0];

  const budgetAnalysis = useMemo(() => {
    return budgets.map((budget) => {
      const spent = currentMonthExpenses
        .filter(
          (expense) =>
            expense.category ===
            budget.category
        )
        .reduce(
          (sum, expense) =>
            sum + expense.amount,
          0
        );

      const percentage =
        budget.amount > 0
          ? (spent / budget.amount) * 100
          : 0;

      return {
        ...budget,
        spent,
        percentage,
      };
    });
  }, [budgets, currentMonthExpenses]);

  const budgetUsed = useMemo(() => {
    if (budgets.length === 0) {
      return 0;
    }

    const totalBudget = budgets.reduce(
      (sum, budget) =>
        sum + budget.amount,
      0
    );

    if (totalBudget === 0) {
      return 0;
    }

    const totalBudgetSpent =
      budgetAnalysis.reduce(
        (sum, item) =>
          sum + item.spent,
        0
      );

    return Math.min(
      100,
      (totalBudgetSpent /
        totalBudget) *
        100
    );
  }, [budgets, budgetAnalysis]);

  const healthScore = useMemo(() => {
    let score = 70;

    // Reward staying under budget.
    if (budgets.length > 0) {
      if (budgetUsed <= 60) {
        score += 15;
      } else if (budgetUsed <= 80) {
        score += 8;
      } else if (budgetUsed > 100) {
        score -= 15;
      } else if (budgetUsed > 90) {
        score -= 8;
      }
    }

    // Reward stable or lower spending.
    if (previousTotal > 0) {
      if (monthlyChange <= -10) {
        score += 10;
      } else if (monthlyChange <= 5) {
        score += 5;
      } else if (monthlyChange > 20) {
        score -= 10;
      }
    }

    // Extremely high average transaction frequency
    // slightly reduces the score.
    if (transactionCount > 60) {
      score -= 5;
    }

    return Math.max(
      0,
      Math.min(100, Math.round(score))
    );
  }, [
    budgets,
    budgetUsed,
    monthlyChange,
    previousTotal,
    transactionCount,
  ]);

  const healthLabel =
    healthScore >= 85
      ? "Excellent"
      : healthScore >= 70
      ? "Good"
      : healthScore >= 50
      ? "Needs attention"
      : "Watch your spending";

  const healthColor =
    healthScore >= 70
      ? GREEN
      : healthScore >= 50
      ? ORANGE
      : RED;

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];

    if (topCategory) {
      result.push({
        icon: "pie-chart-outline",
        title: `${topCategory.category} leads your spending`,
        text: `${topCategory.category} accounts for ${Math.round(
          topCategory.percentage
        )}% of your spending this month.`,
        type: "neutral",
      });
    }

    if (monthlyChange > 10) {
      result.push({
        icon: "trending-up-outline",
        title: "Spending is trending upward",
        text: `You are spending ${formatPercent(
          monthlyChange
        )} more than last month.`,
        type: "warning",
      });
    } else if (monthlyChange < -10) {
      result.push({
        icon: "trending-down-outline",
        title: "Nice progress this month",
        text: `Your spending is down ${formatPercent(
          monthlyChange
        )} compared with last month.`,
        type: "positive",
      });
    } else if (previousTotal > 0) {
      result.push({
        icon: "swap-horizontal-outline",
        title: "Your spending is relatively stable",
        text: `Your spending has changed by ${formatPercent(
          monthlyChange
        )} compared with last month.`,
        type: "neutral",
      });
    }

    const risingCategory =
      [...categoryData]
        .filter(
          (item) =>
            item.previousAmount > 0 &&
            item.change > 15
        )
        .sort(
          (a, b) =>
            b.change - a.change
        )[0];

    if (risingCategory) {
      result.push({
        icon: "alert-circle-outline",
        title: `${risingCategory.category} is rising`,
        text: `${risingCategory.category} spending is up ${formatPercent(
          risingCategory.change
        )} compared with last month.`,
        type: "warning",
      });
    }

    const largestBudgetIssue =
      [...budgetAnalysis]
        .sort(
          (a, b) =>
            b.percentage -
            a.percentage
        )[0];

    if (
      largestBudgetIssue &&
      largestBudgetIssue.percentage > 90
    ) {
      result.push({
        icon: "speedometer-outline",
        title: `${largestBudgetIssue.category} budget needs attention`,
        text: `You have used ${Math.round(
          largestBudgetIssue.percentage
        )}% of this month's ${largestBudgetIssue.category} budget.`,
        type: "warning",
      });
    }

    if (
      transactionCount > 0 &&
      averageTransaction < 1500
    ) {
      result.push({
        icon: "wallet-outline",
        title: "Most purchases are relatively small",
        text: `Your average transaction is ${formatAmount(
          averageTransaction
        )}. Small purchases can add up quickly.`,
        type: "neutral",
      });
    }

    return result.slice(0, 4);
  }, [
    topCategory,
    monthlyChange,
    previousTotal,
    categoryData,
    budgetAnalysis,
    transactionCount,
    averageTransaction,
  ]);

  const monthName = new Date().toLocaleDateString(
    "en-US",
    { month: "long" }
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons
              name="analytics-outline"
              size={28}
              color={BLUE}
            />
          </View>

          <ActivityIndicator
            size="small"
            color={BLUE}
          />

          <Text style={styles.loadingText}>
            Analysing your spending...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={TEXT}
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Advanced Insights
            </Text>

            <Text style={styles.headerSubtitle}>
              Your {monthName} spending intelligence
            </Text>
          </View>

          <View style={styles.proBadge}>
            <Ionicons
              name="diamond"
              size={15}
              color={GOLD}
            />
          </View>
        </View>

        {/* HERO */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTop}>
            <View>
              <Text style={styles.eyebrow}>
                SPENDLY PRO
              </Text>

              <Text style={styles.heroTitle}>
                Know your money.
              </Text>

              <Text style={styles.heroDescription}>
                Turn your spending history into
                useful decisions.
              </Text>
            </View>

            <View style={styles.heroIcon}>
              <Ionicons
                name="analytics"
                size={28}
                color={WHITE}
              />
            </View>
          </View>
        </View>

        {/* HEALTH SCORE */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Spending Health
            </Text>

            <Text style={styles.sectionSubtitle}>
              A snapshot of your current habits
            </Text>
          </View>
        </View>

        <View style={styles.healthCard}>
          <View
            style={[
              styles.scoreCircle,
              {
                borderColor:
                  `${healthColor}55`,
              },
            ]}
          >
            <Text
              style={[
                styles.scoreNumber,
                { color: healthColor },
              ]}
            >
              {healthScore}
            </Text>

            <Text style={styles.scoreSmall}>
              / 100
            </Text>
          </View>

          <View style={styles.healthInfo}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor:
                    `${healthColor}12`,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      healthColor,
                  },
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      healthColor,
                  },
                ]}
              >
                {healthLabel}
              </Text>
            </View>

            <Text style={styles.healthTitle}>
              Your spending health
            </Text>

            <Text style={styles.healthDescription}>
              {budgetUsed <= 80
                ? "You're keeping your spending relatively controlled."
                : "Your spending is approaching or exceeding some limits."}
            </Text>
          </View>
        </View>

        {/* MONTHLY OVERVIEW */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Monthly Overview
            </Text>

            <Text style={styles.sectionSubtitle}>
              Compared with last month
            </Text>
          </View>
        </View>

        <View style={styles.overviewGrid}>
          <MetricCard
            icon="wallet-outline"
            label="Total spent"
            value={formatAmount(totalSpent)}
            change={monthlyChange}
            positiveIsDown
          />

          <MetricCard
            icon="receipt-outline"
            label="Transactions"
            value={transactionCount.toString()}
            subtitle={
              previousMonthExpenses.length > 0
                ? `${previousMonthExpenses.length} last month`
                : "No previous data"
            }
          />

          <MetricCard
            icon="calculator-outline"
            label="Avg. transaction"
            value={formatAmount(
              averageTransaction
            )}
            subtitle={
              highestTransaction
                ? `Highest ${formatAmount(
                    highestTransaction.amount
                  )}`
                : "No transactions"
            }
          />

          <MetricCard
            icon="pie-chart-outline"
            label="Top category"
            value={
              topCategory?.category ||
              "No data"
            }
            subtitle={
              topCategory
                ? `${Math.round(
                    topCategory.percentage
                  )}% of spending`
                : "Add expenses"
            }
          />
        </View>

        {/* CATEGORY INTELLIGENCE */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Category Intelligence
            </Text>

            <Text style={styles.sectionSubtitle}>
              Where your money is going
            </Text>
          </View>
        </View>

        {categoryData.length === 0 ? (
          <EmptyCard
            icon="pie-chart-outline"
            title="Not enough data yet"
            text="Add a few expenses and Spendly will start identifying your spending patterns."
          />
        ) : (
          <View style={styles.glassCard}>
            {categoryData.map(
              (item, index) => {
                const color =
                  CATEGORY_COLORS[
                    item.category
                  ] ||
                  CATEGORY_COLORS.Other;

                const icon =
                  CATEGORY_ICONS[
                    item.category
                  ] ||
                  CATEGORY_ICONS.Other;

                const changeUp =
                  item.change > 0;

                return (
                  <View
                    key={item.category}
                    style={[
                      styles.categoryRow,
                      index !==
                        categoryData.length -
                          1 &&
                        styles.categoryDivider,
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        {
                          backgroundColor:
                            `${color}15`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={icon}
                        size={19}
                        color={color}
                      />
                    </View>

                    <View
                      style={
                        styles.categoryMain
                      }
                    >
                      <View
                        style={
                          styles.categoryTop
                        }
                      >
                        <View
                          style={
                            styles.categoryNameArea
                          }
                        >
                          <Text
                            style={
                              styles.categoryName
                            }
                          >
                            {item.category}
                          </Text>

                          <Text
                            style={
                              styles.categoryPercent
                            }
                          >
                            {Math.round(
                              item.percentage
                            )}
                            % of total
                          </Text>
                        </View>

                        <View
                          style={
                            styles.categoryAmountArea
                          }
                        >
                          <Text
                            style={
                              styles.categoryAmount
                            }
                          >
                            {formatAmount(
                              item.amount
                            )}
                          </Text>

                          {item.previousAmount >
                            0 && (
                            <View
                              style={[
                                styles.changeBadge,
                                {
                                  backgroundColor:
                                    changeUp
                                      ? "#FEE2E2"
                                      : "#DCFCE7",
                                },
                              ]}
                            >
                              <Ionicons
                                name={
                                  changeUp
                                    ? "arrow-up"
                                    : "arrow-down"
                                }
                                size={11}
                                color={
                                  changeUp
                                    ? RED
                                    : GREEN
                                }
                              />

                              <Text
                                style={[
                                  styles.changeText,
                                  {
                                    color:
                                      changeUp
                                        ? RED
                                        : GREEN,
                                  },
                                ]}
                              >
                                {Math.round(
                                  Math.abs(
                                    item.change
                                  )
                                )}
                                %
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View
                        style={
                          styles.progressTrack
                        }
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(
                                item.percentage,
                                100
                              )}%`,
                              backgroundColor:
                                color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        )}

        {/* SPENDING BEHAVIOUR */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Spending Behaviour
            </Text>

            <Text style={styles.sectionSubtitle}>
              When you tend to spend
            </Text>
          </View>
        </View>

        <View style={styles.behaviourCard}>
          <BehaviourItem
            icon="calendar-outline"
            label="Most active day"
            value={
              mostActiveDay
                ? mostActiveDay.day
                : "Not enough data"
            }
            subtitle={
              mostActiveDay
                ? `${formatAmount(
                    mostActiveDay.total
                  )} spent`
                : "Add more expenses"
            }
          />

          <BehaviourItem
            icon="trending-up-outline"
            label="Daily average"
            value={formatAmount(
              totalSpent /
                Math.max(
                  new Date().getDate(),
                  1
                )
            )}
            subtitle="Based on this month"
          />

          <BehaviourItem
            icon="repeat-outline"
            label="Purchase frequency"
            value={
              transactionCount > 0
                ? `${(
                    transactionCount /
                    Math.max(
                      new Date().getDate(),
                      1
                    )
                  ).toFixed(1)} / day`
                : "0 / day"
            }
            subtitle="Average transactions"
          />
        </View>

        {/* BUDGET INTELLIGENCE */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Budget Intelligence
            </Text>

            <Text style={styles.sectionSubtitle}>
              How your spending compares with limits
            </Text>
          </View>

          {budgets.length > 0 && (
            <TouchableOpacity
              onPress={() =>
                router.replace("/budgets")
              }
              activeOpacity={0.8}
            >
              <Text style={styles.linkText}>
                View budgets
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {budgetAnalysis.length === 0 ? (
          <EmptyCard
            icon="speedometer-outline"
            title="No budgets yet"
            text="Create budgets to unlock deeper comparisons between your spending and your limits."
          />
        ) : (
          <View style={styles.glassCard}>
            {budgetAnalysis.map(
              (item, index) => {
                const percentage =
                  item.percentage;

                const statusColor =
                  percentage >= 100
                    ? RED
                    : percentage >= 80
                    ? ORANGE
                    : GREEN;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.budgetRow,
                      index !==
                        budgetAnalysis.length -
                          1 &&
                        styles.categoryDivider,
                    ]}
                  >
                    <View
                      style={
                        styles.budgetTop
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.budgetCategory
                          }
                        >
                          {item.category}
                        </Text>

                        <Text
                          style={
                            styles.budgetAmounts
                          }
                        >
                          {formatAmount(
                            item.spent
                          )}{" "}
                          of{" "}
                          {formatAmount(
                            item.amount
                          )}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.budgetPercentage,
                          {
                            color:
                              statusColor,
                          },
                        ]}
                      >
                        {Math.round(
                          percentage
                        )}
                        %
                      </Text>
                    </View>

                    <View
                      style={
                        styles.progressTrack
                      }
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(
                              percentage,
                              100
                            )}%`,
                            backgroundColor:
                              statusColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              }
            )}
          </View>
        )}

        {/* SMART INSIGHTS */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Spendly Intelligence
            </Text>

            <Text style={styles.sectionSubtitle}>
              Patterns detected from your data
            </Text>
          </View>
        </View>

        {insights.length === 0 ? (
          <EmptyCard
            icon="bulb-outline"
            title="Insights are building"
            text="Keep recording your expenses. Spendly will use your history to surface useful patterns."
          />
        ) : (
          <View style={styles.insightsContainer}>
            {insights.map(
              (insight, index) => {
                const accent =
                  insight.type ===
                  "warning"
                    ? ORANGE
                    : insight.type ===
                      "positive"
                    ? GREEN
                    : GOLD;

                return (
                  <View
                    key={`${insight.title}-${index}`}
                    style={
                      styles.insightCard
                    }
                  >
                    <View
                      style={[
                        styles.insightIcon,
                        {
                          backgroundColor:
                            `${accent}14`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          insight.icon
                        }
                        size={21}
                        color={accent}
                      />
                    </View>

                    <View
                      style={
                        styles.insightContent
                      }
                    >
                      <Text
                        style={
                          styles.insightTitle
                        }
                      >
                        {insight.title}
                      </Text>

                      <Text
                        style={
                          styles.insightText
                        }
                      >
                        {insight.text}
                      </Text>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        )}

        {/* PRO FOOTER */}
        <View style={styles.proFooter}>
          <View style={styles.proFooterIcon}>
            <Ionicons
              name="sparkles"
              size={19}
              color={GOLD}
            />
          </View>

          <Text style={styles.proFooterTitle}>
            Spendly Pro
          </Text>

          <Text style={styles.proFooterText}>
            Smart spending, backed by your own
            financial data.
          </Text>

          <Text style={styles.tagline}>
            Smart Spending, Brighter Tomorrows
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  change,
  positiveIsDown = false,
}: {
  icon: any;
  label: string;
  value: string;
  subtitle?: string;
  change?: number;
  positiveIsDown?: boolean;
}) {
  let changeColor = MUTED;

  if (change !== undefined) {
    const isPositive =
      positiveIsDown
        ? change < 0
        : change > 0;

    changeColor = isPositive
      ? GREEN
      : change === 0
      ? MUTED
      : RED;
  }

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={BLUE}
        />
      </View>

      <Text style={styles.metricLabel}>
        {label}
      </Text>

      <Text
        style={styles.metricValue}
        numberOfLines={1}
      >
        {value}
      </Text>

      {change !== undefined ? (
        <View
          style={styles.metricChange}
        >
          <Ionicons
            name={
              change > 0
                ? "arrow-up"
                : change < 0
                ? "arrow-down"
                : "remove"
            }
            size={12}
            color={changeColor}
          />

          <Text
            style={[
              styles.metricSubtitle,
              {
                color:
                  changeColor,
              },
            ]}
          >
            {change === 0
              ? "No change"
              : `${Math.abs(
                  change
                ).toFixed(
                  1
                )}% vs last month`}
          </Text>
        </View>
      ) : (
        <Text
          style={styles.metricSubtitle}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

function BehaviourItem({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: any;
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <View style={styles.behaviourItem}>
      <View style={styles.behaviourIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={BLUE}
        />
      </View>

      <View style={styles.behaviourText}>
        <Text style={styles.behaviourLabel}>
          {label}
        </Text>

        <Text style={styles.behaviourValue}>
          {value}
        </Text>

        <Text style={styles.behaviourSubtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function EmptyCard({
  icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name={icon}
          size={25}
          color={BLUE}
        />
      </View>

      <Text style={styles.emptyTitle}>
        {title}
      </Text>

      <Text style={styles.emptyText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  orbTop: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "#DCEBFF",
    opacity: 0.5,
    top: -100,
    right: -110,
  },

  orbBottom: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#F5E8C8",
    opacity: 0.32,
    bottom: 50,
    left: -120,
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 60,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },

  loadingIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
    fontWeight: "500",
  },

  proBadge: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor:
      "rgba(184,138,36,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor:
      "rgba(184,138,36,0.22)",
  },

  heroCard: {
    minHeight: 170,
    borderRadius: 28,
    padding: 22,
    marginBottom: 24,
    overflow: "hidden",
    backgroundColor: BLUE,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.35)",
  },

  heroGlowOne: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor:
      "rgba(255,255,255,0.08)",
    right: -80,
    top: -90,
  },

  heroGlowTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor:
      "rgba(184,138,36,0.20)",
    left: -60,
    bottom: -60,
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  eyebrow: {
    color:
      "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 7,
  },

  heroTitle: {
    color: WHITE,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  heroDescription: {
    color:
      "rgba(255,255,255,0.82)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 250,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor:
      "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.18)",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 11,
    marginTop: 2,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
  },

  linkText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: "800",
  },

  healthCard: {
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 23,
  },

  scoreCircle: {
    width: 102,
    height: 102,
    borderRadius: 51,
    borderWidth: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.65)",
  },

  scoreNumber: {
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 34,
  },

  scoreSmall: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "700",
    marginTop: -1,
  },

  healthInfo: {
    flex: 1,
    marginLeft: 17,
  },

  statusPill: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },

  healthTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
  },

  healthDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  metricCard: {
    width: "48.2%",
    minHeight: 145,
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 15,
    marginBottom: 10,
  },

  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  metricLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "700",
  },

  metricValue: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 5,
    letterSpacing: -0.3,
  },

  metricSubtitle: {
    color: MUTED,
    fontSize: 9.5,
    marginTop: 6,
    fontWeight: "600",
  },

  metricChange: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  glassCard: {
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 17,
    marginBottom: 23,
  },

  categoryRow: {
    flexDirection: "row",
    paddingVertical: 17,
  },

  categoryDivider: {
    borderBottomWidth: 1,
    borderBottomColor:
      "rgba(148,163,184,0.12)",
  },

  categoryIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryMain: {
    flex: 1,
    marginLeft: 13,
  },

  categoryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  categoryNameArea: {
    flex: 1,
  },

  categoryName: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
  },

  categoryPercent: {
    color: MUTED,
    fontSize: 9.5,
    marginTop: 3,
  },

  categoryAmountArea: {
    alignItems: "flex-end",
  },

  categoryAmount: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "900",
  },

  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 9,
    paddingHorizontal: 5,
    paddingVertical: 3,
    marginTop: 4,
  },

  changeText: {
    fontSize: 8,
    fontWeight: "900",
    marginLeft: 2,
  },

  progressTrack: {
    height: 7,
    backgroundColor:
      "#E8EDF5",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
  },

  behaviourCard: {
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 17,
    marginBottom: 23,
  },

  behaviourItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor:
      "rgba(148,163,184,0.12)",
  },

  behaviourItemLast: {
    borderBottomWidth: 0,
  },

  behaviourIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  behaviourText: {
    marginLeft: 13,
  },

  behaviourLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "700",
  },

  behaviourValue: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
  },

  behaviourSubtitle: {
    color: MUTED,
    fontSize: 9.5,
    marginTop: 2,
  },

  budgetRow: {
    paddingVertical: 17,
  },

  budgetTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  budgetCategory: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
  },

  budgetAmounts: {
    color: MUTED,
    fontSize: 9.5,
    marginTop: 3,
  },

  budgetPercentage: {
    fontSize: 15,
    fontWeight: "900",
  },

  insightsContainer: {
    marginBottom: 23,
  },

  insightCard: {
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    flexDirection: "row",
    marginBottom: 10,
  },

  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  insightContent: {
    flex: 1,
    marginLeft: 13,
  },

  insightTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
  },

  insightText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  emptyCard: {
    backgroundColor:
      "rgba(255,255,255,0.75)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 25,
    alignItems: "center",
    marginBottom: 23,
  },

  emptyIcon: {
    width: 53,
    height: 53,
    borderRadius: 18,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 5,
    maxWidth: 290,
  },

  proFooter: {
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 20,
  },

  proFooterIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor:
      "rgba(184,138,36,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  proFooterTitle: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "900",
  },

  proFooterText: {
    color: MUTED,
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
  },

  tagline: {
    color: GOLD,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 10,
    letterSpacing: 0.2,
  },
});