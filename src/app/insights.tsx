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
    return `Rs. ${amount.toLocaleString("en-LK", {
      maximumFractionDigits: 2,
    })}`;
  };

  /*
   * CURRENT MONTH
   */
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

  /*
   * CURRENT WEEK
   */
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

  /*
   * CATEGORY BREAKDOWN
   */
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

  const averageTransaction =
    monthlyExpenses.length > 0
      ? monthlyTotal / monthlyExpenses.length
      : 0;

  const monthName = new Date().toLocaleString("en-US", {
    month: "long",
  });

  /*
   * SPENDING LEVEL
   */
  const spendingLevel = useMemo(() => {
    if (monthlyTotal === 0) {
      return {
        label: "No spending yet",
        icon: "sparkles-outline",
        color: "#7B8CA1",
        background: "#EEF3F8",
      };
    }

    if (monthlyTotal < 10000) {
      return {
        label: "Light spending",
        icon: "leaf-outline",
        color: "#168A5B",
        background: "#E9F8F0",
      };
    }

    if (monthlyTotal < 30000) {
      return {
        label: "Balanced spending",
        icon: "speedometer-outline",
        color: "#2563EB",
        background: "#EEF5FF",
      };
    }

    return {
      label: "High spending",
      icon: "trending-up-outline",
      color: "#C76A1A",
      background: "#FFF4E8",
    };
  }, [monthlyTotal]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Background atmosphere */}
      <View style={styles.backgroundOrbOne} />
      <View style={styles.backgroundOrbTwo} />
      <View style={styles.backgroundOrbThree} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/")}
            activeOpacity={0.75}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color="#163A63"
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.eyebrow}>SPENDLY</Text>

            <Text style={styles.title}>Insights</Text>

            <Text style={styles.subtitle}>
              Understand where your money goes
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.headerLogo}>
              <Ionicons
                name="analytics-outline"
                size={19}
                color="#2563EB"
              />
            </View>
          </View>
        </View>

        {loading ? (
          /* =================================================== */
          /* LOADING */
          /* =================================================== */

          <View style={styles.loadingContainer}>
            <View style={styles.loadingGlass}>
              <View style={styles.loadingIcon}>
                <Ionicons
                  name="analytics-outline"
                  size={23}
                  color="#2563EB"
                />
              </View>

              <Text style={styles.loadingText}>
                Loading your insights...
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* ================================================= */}
            {/* MONTHLY HERO */}
            {/* ================================================= */}

            <View style={styles.totalCard}>
              <View style={styles.totalGlowOne} />
              <View style={styles.totalGlowTwo} />

              <View style={styles.cardTop}>
                <View style={styles.totalMain}>
                  <View style={styles.periodPill}>
                    <View style={styles.periodDot} />

                    <Text style={styles.periodPillText}>
                      {monthName}
                    </Text>
                  </View>

                  <Text style={styles.cardLabel}>
                    Total spent
                  </Text>

                  <Text style={styles.totalAmount}>
                    {formatAmount(monthlyTotal)}
                  </Text>
                </View>

                <View style={styles.totalIcon}>
                  <Ionicons
                    name="trending-up-outline"
                    size={25}
                    color="#2563EB"
                  />
                </View>
              </View>

              <View style={styles.totalBottom}>
                <View>
                  <Text style={styles.bottomLabel}>
                    {monthlyExpenses.length}{" "}
                    {monthlyExpenses.length === 1
                      ? "transaction"
                      : "transactions"}
                  </Text>

                  <Text style={styles.bottomHint}>
                    Your spending this month
                  </Text>
                </View>

                <View style={styles.spendingStatus}>
                  <View
                    style={[
                      styles.statusIcon,
                      {
                        backgroundColor:
                          spendingLevel.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name={spendingLevel.icon as any}
                      size={14}
                      color={spendingLevel.color}
                    />
                  </View>

                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: spendingLevel.color,
                      },
                    ]}
                  >
                    {spendingLevel.label}
                  </Text>
                </View>
              </View>
            </View>

            {/* ================================================= */}
            {/* QUICK STATS */}
            {/* ================================================= */}

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    styles.blueIcon,
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color="#2563EB"
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
                <View
                  style={[
                    styles.statIcon,
                    styles.goldIcon,
                  ]}
                >
                  <Ionicons
                    name="receipt-outline"
                    size={19}
                    color="#B88A24"
                  />
                </View>

                <Text style={styles.statLabel}>
                  Avg. expense
                </Text>

                <Text style={styles.statValue}>
                  {formatAmount(averageTransaction)}
                </Text>
              </View>
            </View>

            {/* ================================================= */}
            {/* TOP CATEGORY */}
            {/* ================================================= */}

            {topCategory && (
              <View style={styles.topCard}>
                <View
                  style={[
                    styles.topIcon,
                    {
                      backgroundColor:
                        `${
                          CATEGORY_COLORS[
                            topCategory.category
                          ] || CATEGORY_COLORS.Other
                        }18`,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      CATEGORY_ICONS[
                        topCategory.category
                      ] || CATEGORY_ICONS.Other
                    }
                    size={24}
                    color={
                      CATEGORY_COLORS[
                        topCategory.category
                      ] || CATEGORY_COLORS.Other
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
                    {formatAmount(topCategory.amount)} spent
                  </Text>
                </View>

                <View style={styles.topPercentageBox}>
                  <Text style={styles.topPercentage}>
                    {Math.round(topCategory.percentage)}%
                  </Text>

                  <Text style={styles.ofSpend}>
                    OF SPEND
                  </Text>
                </View>
              </View>
            )}

            {/* ================================================= */}
            {/* CATEGORY BREAKDOWN */}
            {/* ================================================= */}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Spending by category
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    Where your money went this month
                  </Text>
                </View>

                <View style={styles.chartBadge}>
                  <Ionicons
                    name="pie-chart-outline"
                    size={15}
                    color="#2563EB"
                  />
                </View>
              </View>

              {categoryData.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name="analytics-outline"
                      size={28}
                      color="#2563EB"
                    />
                  </View>

                  <Text style={styles.emptyTitle}>
                    No spending data
                  </Text>

                  <Text style={styles.emptyText}>
                    Add some expenses to see your
                    spending breakdown.
                  </Text>

                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() =>
                      router.push("/add-expense")
                    }
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="add"
                      size={17}
                      color="#FFFFFF"
                    />

                    <Text style={styles.emptyButtonText}>
                      Add Expense
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.categoryCard}>
                  {categoryData.map((item, index) => {
                    const color =
                      CATEGORY_COLORS[item.category] ||
                      CATEGORY_COLORS.Other;

                    const icon =
                      CATEGORY_ICONS[item.category] ||
                      CATEGORY_ICONS.Other;

                    return (
                      <View
                        key={item.category}
                        style={[
                          styles.categoryRow,
                          index !==
                            categoryData.length - 1 &&
                            styles.categoryRowSpacing,
                        ]}
                      >
                        <View
                          style={[
                            styles.categoryIcon,
                            {
                              backgroundColor:
                                `${color}18`,
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
                            <View style={styles.categoryNameBlock}>
                              <Text
                                style={styles.categoryName}
                              >
                                {item.category}
                              </Text>

                              <Text
                                style={
                                  styles.categoryPercentage
                                }
                              >
                                {Math.round(
                                  item.percentage
                                )}
                                % of monthly spending
                              </Text>
                            </View>

                            <Text
                              style={
                                styles.categoryAmount
                              }
                            >
                              {formatAmount(item.amount)}
                            </Text>
                          </View>

                          <View
                            style={styles.progressBackground}
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
                  })}
                </View>
              )}
            </View>

            {/* ================================================= */}
            {/* SPENDLY INSIGHT */}
            {/* ================================================= */}

            {topCategory && (
              <View style={styles.insightCard}>
                <View style={styles.insightIcon}>
                  <Ionicons
                    name="bulb-outline"
                    size={21}
                    color="#B88A24"
                  />
                </View>

                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>
                    SPENDLY INSIGHT
                  </Text>

                  <Text style={styles.insightText}>
                    {topCategory.category} is currently
                    your biggest spending category,
                    making up{" "}
                    {Math.round(
                      topCategory.percentage
                    )}
                    % of your monthly spending.
                  </Text>
                </View>
              </View>
            )}

            {/* ================================================= */}
            {/* MONTHLY SUMMARY */}
            {/* ================================================= */}

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.summaryTitle}>
                    Your {monthName} snapshot
                  </Text>

                  <Text style={styles.summarySubtitle}>
                    A quick look at your spending habits
                  </Text>
                </View>

                <View style={styles.summaryIcon}>
                  <Ionicons
                    name="sparkles-outline"
                    size={17}
                    color="#B88A24"
                  />
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>
                    Transactions
                  </Text>

                  <Text style={styles.summaryItemValue}>
                    {monthlyExpenses.length}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>
                    Categories
                  </Text>

                  <Text style={styles.summaryItemValue}>
                    {categoryData.length}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>
                    Top category
                  </Text>

                  <Text
                    style={styles.summaryItemValueSmall}
                    numberOfLines={1}
                  >
                    {topCategory
                      ? topCategory.category
                      : "—"}
                  </Text>
                </View>
              </View>
            </View>

            {/* ================================================= */}
            {/* PREMIUM */}
            {/* ================================================= */}

            <View style={styles.premiumCard}>
              <View style={styles.premiumGlowOne} />
              <View style={styles.premiumGlowTwo} />

              <View style={styles.premiumTop}>
                <View style={styles.premiumIcon}>
                  <Ionicons
                    name="sparkles"
                    size={20}
                    color="#B88A24"
                  />
                </View>

                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>
                    PRO
                  </Text>
                </View>
              </View>

              <Text style={styles.premiumTitle}>
                Go deeper with Spendly Pro
              </Text>

              <Text style={styles.premiumDescription}>
                Unlock advanced trends, detailed
                spending analysis and smarter
                insights for your money.
              </Text>

              <View style={styles.premiumFeatures}>
                <PremiumFeature
                  icon="bar-chart-outline"
                  text="Advanced spending trends"
                />

                <PremiumFeature
                  icon="calendar-outline"
                  text="Custom date range analysis"
                />

                <PremiumFeature
                  icon="download-outline"
                  text="Detailed reports & exports"
                />
              </View>

              <TouchableOpacity
                style={styles.premiumButton}
                onPress={() => router.push("/pro")}
                activeOpacity={0.8}
              >
                <Text style={styles.premiumButtonText}>
                  Explore Pro
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            {/* ================================================= */}
            {/* FOOTER */}
            {/* ================================================= */}

            <View style={styles.footer}>
              <View style={styles.footerLine} />

              <Text style={styles.footerBrand}>
                SPENDLY
              </Text>

              <Text style={styles.footerTagline}>
                Smart Spending, Brighter Tomorrows
              </Text>

              <View style={styles.footerLine} />
            </View>
          </>
        )}
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

function PremiumFeature({
  icon,
  text,
}: {
  icon: any;
  text: string;
}) {
  return (
    <View style={styles.premiumFeature}>
      <View style={styles.featureIcon}>
        <Ionicons
          name={icon}
          size={14}
          color="#2563EB"
        />
      </View>

      <Text style={styles.premiumFeatureText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FC",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 140,
  },

  /* ========================================================= */
  /* BACKGROUND */
  /* ========================================================= */

  backgroundOrbOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#DCEBFF",
    opacity: 0.48,
    top: -90,
    right: -110,
  },

  backgroundOrbTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#F5E8C8",
    opacity: 0.28,
    bottom: 220,
    left: -120,
  },

  backgroundOrbThree: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#DCEBFF",
    opacity: 0.2,
    top: 430,
    right: -70,
  },

  /* ========================================================= */
  /* HEADER */
  /* ========================================================= */

  header: {
    height: 78,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 17,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#163A63",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerRight: {
    width: 44,
    alignItems: "flex-end",
  },

  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
  },

  eyebrow: {
    color: "#B88A24",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.2,
    marginBottom: 3,
  },

  title: {
    color: "#163A63",
    fontSize: 23,
    fontWeight: "800",
  },

  subtitle: {
    color: "#7B8CA1",
    fontSize: 11,
    marginTop: 3,
  },

  /* ========================================================= */
  /* LOADING */
  /* ========================================================= */

  loadingContainer: {
    paddingTop: 80,
    alignItems: "center",
  },

  loadingGlass: {
    width: 210,
    height: 150,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.80)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#163A63",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },

  loadingIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  loadingText: {
    color: "#6E8197",
    fontSize: 13,
    fontWeight: "600",
  },

  /* ========================================================= */
  /* TOTAL HERO */
  /* ========================================================= */

  totalCard: {
    minHeight: 205,
    borderRadius: 29,
    padding: 22,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.96)",
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#163A63",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.09,
    shadowRadius: 24,
    elevation: 5,
  },

  totalGlowOne: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#E7F0FF",
    right: -85,
    top: -90,
    opacity: 0.8,
  },

  totalGlowTwo: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5E8C8",
    left: -55,
    bottom: -55,
    opacity: 0.25,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  totalMain: {
    flex: 1,
  },

  periodPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EEF5FF",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#DCE9FA",
    marginBottom: 12,
  },

  periodDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#2563EB",
    marginRight: 6,
  },

  periodPillText: {
    color: "#2563EB",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  cardLabel: {
    color: "#7B8CA1",
    fontSize: 12,
    fontWeight: "600",
  },

  totalAmount: {
    color: "#163A63",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 5,
  },

  totalIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "#EEF5FF",
    borderWidth: 1,
    borderColor: "#DCE9FA",
    alignItems: "center",
    justifyContent: "center",
  },

  totalBottom: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E7EDF5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bottomLabel: {
    color: "#536980",
    fontSize: 11,
    fontWeight: "700",
  },

  bottomHint: {
    color: "#9AA8B8",
    fontSize: 10,
    marginTop: 3,
  },

  spendingStatus: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 130,
  },

  statusIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
    marginLeft: 7,
  },

  /* ========================================================= */
  /* STATS */
  /* ========================================================= */

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    minHeight: 125,
    borderRadius: 21,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.96)",
    shadowColor: "#163A63",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.055,
    shadowRadius: 14,
    elevation: 2,
  },

  statIcon: {
    width: 37,
    height: 37,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  blueIcon: {
    backgroundColor: "#EEF5FF",
  },

  goldIcon: {
    backgroundColor: "#FBF5E8",
  },

  statLabel: {
    color: "#7B8CA1",
    fontSize: 10,
    fontWeight: "600",
  },

  statValue: {
    color: "#163A63",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },

  /* ========================================================= */
  /* TOP CATEGORY */
  /* ========================================================= */

  topCard: {
    minHeight: 108,
    borderRadius: 21,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.96)",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 27,
    shadowColor: "#163A63",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 2,
  },

  topIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  topInfo: {
    flex: 1,
    marginLeft: 13,
  },

  topLabel: {
    color: "#7B8CA1",
    fontSize: 10,
    fontWeight: "600",
  },

  topCategory: {
    color: "#163A63",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 2,
  },

  topAmount: {
    color: "#7B8CA1",
    fontSize: 11,
    marginTop: 3,
  },

  topPercentageBox: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 52,
  },

  topPercentage: {
    color: "#2563EB",
    fontSize: 18,
    fontWeight: "900",
  },

  ofSpend: {
    color: "#9AA8B8",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 2,
  },

  /* ========================================================= */
  /* SECTION */
  /* ========================================================= */

  section: {
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#163A63",
    fontSize: 18,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: "#7B8CA1",
    fontSize: 10,
    marginTop: 4,
  },

  chartBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ========================================================= */
  /* CATEGORY */
  /* ========================================================= */

  categoryCard: {
    borderRadius: 22,
    padding: 17,
    backgroundColor: "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.96)",
    shadowColor: "#163A63",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.055,
    shadowRadius: 15,
    elevation: 2,
  },

  categoryRow: {
    flexDirection: "row",
  },

  categoryRowSpacing: {
    marginBottom: 20,
  },

  categoryIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
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
    alignItems: "flex-start",
  },

  categoryNameBlock: {
    flex: 1,
  },

  categoryName: {
    color: "#163A63",
    fontSize: 13,
    fontWeight: "800",
  },

  categoryPercentage: {
    color: "#9AA8B8",
    fontSize: 9,
    marginTop: 3,
  },

  categoryAmount: {
    color: "#163A63",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 8,
  },

  progressBackground: {
    height: 7,
    backgroundColor: "#E8EEF5",
    borderRadius: 999,
    marginTop: 9,
    overflow: "hidden",
  },

  progressFill: {
    height: 7,
    borderRadius: 999,
  },

  /* ========================================================= */
  /* EMPTY */
  /* ========================================================= */

  emptyCard: {
    minHeight: 245,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    shadowColor: "#163A63",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.055,
    shadowRadius: 15,
    elevation: 2,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  emptyTitle: {
    color: "#163A63",
    fontSize: 15,
    fontWeight: "800",
  },

  emptyText: {
    color: "#7B8CA1",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 5,
    maxWidth: 240,
  },

  emptyButton: {
    marginTop: 17,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#2563EB",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  /* ========================================================= */
  /* INSIGHT */
  /* ========================================================= */

  insightCard: {
    minHeight: 100,
    borderRadius: 21,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: "#F1E5C8",
    padding: 16,
    flexDirection: "row",
    marginBottom: 16,
  },

  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FBF5E8",
    alignItems: "center",
    justifyContent: "center",
  },

  insightContent: {
    flex: 1,
    marginLeft: 12,
  },

  insightLabel: {
    color: "#B88A24",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  insightText: {
    color: "#65778D",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 5,
  },

  /* ========================================================= */
  /* MONTHLY SUMMARY */
  /* ========================================================= */

  summaryCard: {
    minHeight: 160,
    borderRadius: 22,
    padding: 17,
    backgroundColor: "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.96)",
    marginBottom: 16,
    shadowColor: "#163A63",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.055,
    shadowRadius: 15,
    elevation: 2,
  },

  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryTitle: {
    color: "#163A63",
    fontSize: 15,
    fontWeight: "900",
  },

  summarySubtitle: {
    color: "#7B8CA1",
    fontSize: 10,
    marginTop: 4,
  },

  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#FBF5E8",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "#E8EEF5",
    marginTop: 15,
    marginBottom: 15,
  },

  summaryGrid: {
    flexDirection: "row",
  },

  summaryItem: {
    flex: 1,
  },

  summaryItemLabel: {
    color: "#9AA8B8",
    fontSize: 9,
    fontWeight: "600",
  },

  summaryItemValue: {
    color: "#163A63",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 5,
  },

  summaryItemValueSmall: {
    color: "#163A63",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 7,
    paddingRight: 8,
  },

  /* ========================================================= */
  /* PREMIUM */
  /* ========================================================= */

  premiumCard: {
    minHeight: 275,
    borderRadius: 25,
    padding: 19,
    backgroundColor: "#EDF5FF",
    borderWidth: 1,
    borderColor: "#D6E6FA",
    overflow: "hidden",
    marginBottom: 16,
  },

  premiumGlowOne: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#D8E9FF",
    right: -75,
    top: -80,
    opacity: 0.75,
  },

  premiumGlowTwo: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5E8C8",
    left: -55,
    bottom: -55,
    opacity: 0.22,
  },

  premiumTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  premiumIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FBF5E8",
    alignItems: "center",
    justifyContent: "center",
  },

  premiumBadge: {
    backgroundColor: "#B88A24",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  premiumBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  premiumTitle: {
    color: "#163A63",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 16,
  },

  premiumDescription: {
    color: "#71849A",
    fontSize: 10,
    lineHeight: 17,
    marginTop: 6,
    maxWidth: 310,
  },

  premiumFeatures: {
    marginTop: 15,
    gap: 9,
  },

  premiumFeature: {
    flexDirection: "row",
    alignItems: "center",
  },

  featureIcon: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  premiumFeatureText: {
    color: "#60748A",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 8,
  },

  premiumButton: {
    height: 42,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#2563EB",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },

  premiumButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  /* ========================================================= */
  /* FOOTER */
  /* ========================================================= */

  footer: {
    alignItems: "center",
    paddingTop: 9,
    paddingBottom: 10,
  },

  footerLine: {
    width: 45,
    height: 1,
    backgroundColor: "#DCE4ED",
    marginVertical: 8,
  },

  footerBrand: {
    color: "#B88A24",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2.5,
  },

  footerTagline: {
    color: "#9AA8B8",
    fontSize: 9,
    marginTop: 4,
    fontWeight: "600",
  },
});