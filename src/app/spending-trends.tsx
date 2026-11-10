import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, {
    Circle,
    Defs,
    Line,
    LinearGradient,
    Path,
    Stop,
} from "react-native-svg";

import { Expense, getExpenses } from "../db/database";
import { requirePro } from "../services/proGuard";

const BLUE = "#2563EB";
const GOLD = "#B88A24";
const BG = "#F5F8FC";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";
const GREEN = "#16A34A";
const RED = "#DC2626";

type Period = "7D" | "30D" | "90D";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 220;

export default function SpendingTrendsScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30D");

  const loadExpenses = async () => {
    if (!(await requirePro())) {
      return;
    }

    try {
      setLoading(true);
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to load spending trends:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  const periodDays =
    period === "7D" ? 7 : period === "30D" ? 30 : 90;

  const periodExpenses = useMemo(() => {
    const now = new Date();
    const start = new Date(now);

    start.setDate(now.getDate() - periodDays + 1);
    start.setHours(0, 0, 0, 0);

    return expenses.filter((expense) => {
      const date = new Date(expense.date);
      return date >= start && date <= now;
    });
  }, [expenses, periodDays]);

  const totalSpent = useMemo(() => {
    return periodExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );
  }, [periodExpenses]);

  const averageDaily = useMemo(() => {
    if (periodDays === 0) return 0;

    return totalSpent / periodDays;
  }, [totalSpent, periodDays]);

  const highestDay = useMemo(() => {
    const dailyTotals: Record<string, number> = {};

    periodExpenses.forEach((expense) => {
      const date = new Date(expense.date);
      const key = date.toISOString().split("T")[0];

      dailyTotals[key] =
        (dailyTotals[key] || 0) + Number(expense.amount);
    });

    let highestDate = "";
    let highestAmount = 0;

    Object.entries(dailyTotals).forEach(([date, amount]) => {
      if (amount > highestAmount) {
        highestAmount = amount;
        highestDate = date;
      }
    });

    return {
      date: highestDate,
      amount: highestAmount,
    };
  }, [periodExpenses]);

  const chartData = useMemo(() => {
    const now = new Date();

    const data: {
      date: Date;
      label: string;
      amount: number;
    }[] = [];

    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date(now);

      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const key = date.toISOString().split("T")[0];

      const amount = periodExpenses
        .filter((expense) => {
          const expenseDate = new Date(expense.date);

          const expenseKey =
            expenseDate.toISOString().split("T")[0];

          return expenseKey === key;
        })
        .reduce(
          (sum, expense) => sum + Number(expense.amount),
          0
        );

      let label = "";

      if (period === "7D") {
        label = date.toLocaleDateString("en-US", {
          weekday: "short",
        });
      } else {
        label = date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        });
      }

      data.push({
        date,
        label,
        amount,
      });
    }

    return data;
  }, [periodExpenses, period, periodDays]);

  const chartPoints = useMemo(() => {
    const maxAmount = Math.max(
      ...chartData.map((item) => item.amount),
      1
    );

    const paddingX = 16;
    const paddingTop = 20;
    const paddingBottom = 30;

    const usableWidth =
      CHART_WIDTH - paddingX * 2;

    const usableHeight =
      CHART_HEIGHT - paddingTop - paddingBottom;

    return chartData.map((item, index) => {
      const x =
        paddingX +
        (index / Math.max(chartData.length - 1, 1)) *
          usableWidth;

      const y =
        paddingTop +
        usableHeight -
        (item.amount / maxAmount) * usableHeight;

      return {
        ...item,
        x,
        y,
      };
    });
  }, [chartData]);

  const chartPath = useMemo(() => {
    if (chartPoints.length === 0) return "";

    return chartPoints
      .map((point, index) => {
        if (index === 0) {
          return `M ${point.x} ${point.y}`;
        }

        const previous = chartPoints[index - 1];

        const controlX1 =
          previous.x +
          (point.x - previous.x) / 2;

        const controlX2 =
          point.x -
          (point.x - previous.x) / 2;

        return `C ${controlX1} ${previous.y}, ${controlX2} ${point.y}, ${point.x} ${point.y}`;
      })
      .join(" ");
  }, [chartPoints]);

  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return "";

    const first = chartPoints[0];
    const last =
      chartPoints[chartPoints.length - 1];

    return `
      ${chartPath}
      L ${last.x} ${CHART_HEIGHT - 30}
      L ${first.x} ${CHART_HEIGHT - 30}
      Z
    `;
  }, [chartPath, chartPoints]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    periodExpenses.forEach((expense) => {
      totals[expense.category] =
        (totals[expense.category] || 0) +
        Number(expense.amount);
    });

    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          totalSpent > 0
            ? (amount / totalSpent) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodExpenses, totalSpent]);

  const topCategory = categoryTotals[0];

  const spendingStatus = useMemo(() => {
    if (totalSpent === 0) {
      return {
        label: "No spending yet",
        color: MUTED,
        icon: "remove-circle-outline" as const,
      };
    }

    if (averageDaily < 1000) {
      return {
        label: "Light daily spending",
        color: GREEN,
        icon: "trending-down-outline" as const,
      };
    }

    if (averageDaily < 3000) {
      return {
        label: "Balanced daily spending",
        color: GOLD,
        icon: "remove-circle-outline" as const,
      };
    }

    return {
      label: "High daily spending",
      color: RED,
      icon: "trending-up-outline" as const,
    };
  }, [totalSpent, averageDaily]);

  const formatCurrency = (amount: number) => {
    return `Rs. ${Math.round(amount).toLocaleString(
      "en-LK"
    )}`;
  };

  const formatHighestDate = (date: string) => {
    if (!date) return "—";

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  const getPeriodLabel = () => {
    if (period === "7D") return "Last 7 days";
    if (period === "30D") return "Last 30 days";

    return "Last 90 days";
  };

  const getChartLabel = () => {
    if (period === "7D") {
      return chartPoints.length > 0
        ? chartPoints[0].label
        : "";
    }

    return chartPoints.length > 0
      ? chartPoints[0].label
      : "";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Header */}
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

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              Spending Trends
            </Text>

            <Text style={styles.headerSubtitle}>
              Understand how your spending changes over time
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

        {/* Period Selector */}
        <View style={styles.periodCard}>
          {(["7D", "30D", "90D"] as Period[]).map(
            (item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.periodButton,
                  period === item &&
                    styles.periodButtonActive,
                ]}
                onPress={() => setPeriod(item)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.periodText,
                    period === item &&
                      styles.periodTextActive,
                  ]}
                >
                  {item === "7D"
                    ? "7 Days"
                    : item === "30D"
                    ? "30 Days"
                    : "90 Days"}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={BLUE}
            />

            <Text style={styles.loadingText}>
              Analysing your spending...
            </Text>
          </View>
        ) : (
          <>
            {/* Total */}
            <View style={styles.totalCard}>
              <View style={styles.totalGlow} />

              <View style={styles.totalTopRow}>
                <View>
                  <Text style={styles.eyebrow}>
                    {getPeriodLabel().toUpperCase()}
                  </Text>

                  <Text style={styles.totalLabel}>
                    Total spent
                  </Text>
                </View>

                <View style={styles.chartIcon}>
                  <Ionicons
                    name="analytics-outline"
                    size={21}
                    color={BLUE}
                  />
                </View>
              </View>

              <Text style={styles.totalAmount}>
                {formatCurrency(totalSpent)}
              </Text>

              <View style={styles.statusRow}>
                <Ionicons
                  name={spendingStatus.icon}
                  size={15}
                  color={spendingStatus.color}
                />

                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        spendingStatus.color,
                    },
                  ]}
                >
                  {spendingStatus.label}
                </Text>
              </View>
            </View>

            {/* Chart */}
            <View style={styles.chartCard}>
              <View style={styles.sectionTopRow}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Spending activity
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    Your daily spending pattern
                  </Text>
                </View>

                <View style={styles.chartLegend}>
                  <View style={styles.legendDot} />

                  <Text style={styles.legendText}>
                    Spending
                  </Text>
                </View>
              </View>

              {totalSpent === 0 ? (
                <View style={styles.emptyChart}>
                  <Ionicons
                    name="bar-chart-outline"
                    size={35}
                    color="#CBD5E1"
                  />

                  <Text style={styles.emptyChartTitle}>
                    No spending data yet
                  </Text>

                  <Text style={styles.emptyChartText}>
                    Add some expenses to see your spending trend.
                  </Text>
                </View>
              ) : (
                <View style={styles.chartWrapper}>
                  <Svg
                    width={CHART_WIDTH}
                    height={CHART_HEIGHT}
                  >
                    <Defs>
                      <LinearGradient
                        id="spendingGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <Stop
                          offset="0"
                          stopColor={BLUE}
                          stopOpacity="0.22"
                        />

                        <Stop
                          offset="1"
                          stopColor={BLUE}
                          stopOpacity="0"
                        />
                      </LinearGradient>
                    </Defs>

                    {/* Horizontal grid lines */}
                    {[0, 1, 2, 3].map(
                      (index) => {
                        const y =
                          20 +
                          index *
                            ((CHART_HEIGHT - 50) /
                              3);

                        return (
                          <Line
                            key={index}
                            x1="16"
                            y1={y}
                            x2={
                              CHART_WIDTH - 16
                            }
                            y2={y}
                            stroke="#E2E8F0"
                            strokeWidth="1"
                          />
                        );
                      }
                    )}

                    {/* Area */}
                    <Path
                      d={areaPath}
                      fill="url(#spendingGradient)"
                    />

                    {/* Main line */}
                    <Path
                      d={chartPath}
                      fill="none"
                      stroke={BLUE}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Points */}
                    {chartPoints.map(
                      (point, index) => {
                        const shouldShowPoint =
                          period === "7D" ||
                          index ===
                            chartPoints.length -
                              1 ||
                          point.amount > 0;

                        if (!shouldShowPoint) {
                          return null;
                        }

                        return (
                          <Circle
                            key={index}
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill={WHITE}
                            stroke={BLUE}
                            strokeWidth="2"
                          />
                        );
                      }
                    )}
                  </Svg>

                  <View style={styles.chartLabels}>
                    <Text style={styles.chartLabel}>
                      {getChartLabel()}
                    </Text>

                    <Text style={styles.chartLabel}>
                      {chartPoints.length > 0
                        ? chartPoints[
                            chartPoints.length -
                              1
                          ].label
                        : ""}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={styles.statIconBlue}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={BLUE}
                  />
                </View>

                <Text style={styles.statLabel}>
                  Daily average
                </Text>

                <Text style={styles.statValue}>
                  {formatCurrency(
                    averageDaily
                  )}
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconGold}>
                  <Ionicons
                    name="trophy-outline"
                    size={18}
                    color={GOLD}
                  />
                </View>

                <Text style={styles.statLabel}>
                  Highest day
                </Text>

                <Text style={styles.statValue}>
                  {formatCurrency(
                    highestDay.amount
                  )}
                </Text>

                <Text style={styles.statDate}>
                  {formatHighestDate(
                    highestDay.date
                  )}
                </Text>
              </View>
            </View>

            {/* Top Category */}
            <View style={styles.categoryCard}>
              <View style={styles.sectionTopRow}>
                <View>
                  <Text
                    style={styles.sectionTitle}
                  >
                    Top spending category
                  </Text>

                  <Text
                    style={styles.sectionSubtitle}
                  >
                    Where most of your money went
                  </Text>
                </View>

                <Ionicons
                  name="pricetag-outline"
                  size={20}
                  color={GOLD}
                />
              </View>

              {topCategory ? (
                <>
                  <View
                    style={
                      styles.topCategoryRow
                    }
                  >
                    <View
                      style={
                        styles.topCategoryIcon
                      }
                    >
                      <Ionicons
                        name="wallet-outline"
                        size={21}
                        color={BLUE}
                      />
                    </View>

                    <View
                      style={
                        styles.topCategoryContent
                      }
                    >
                      <Text
                        style={
                          styles.topCategoryName
                        }
                      >
                        {topCategory.category}
                      </Text>

                      <Text
                        style={
                          styles.topCategoryAmount
                        }
                      >
                        {formatCurrency(
                          topCategory.amount
                        )}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.topCategoryPercentage
                      }
                    >
                      {Math.round(
                        topCategory.percentage
                      )}
                      %
                    </Text>
                  </View>

                  <View
                    style={styles.progressTrack}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(
                            topCategory.percentage,
                            100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </>
              ) : (
                <Text style={styles.noDataText}>
                  No category data available for this period.
                </Text>
              )}
            </View>

            {/* Category Breakdown */}
            {categoryTotals.length > 0 && (
              <View
                style={styles.breakdownCard}
              >
                <Text style={styles.sectionTitle}>
                  Category breakdown
                </Text>

                <Text
                  style={styles.sectionSubtitle}
                >
                  How your spending is distributed
                </Text>

                <View
                  style={styles.breakdownList}
                >
                  {categoryTotals
                    .slice(0, 5)
                    .map((item) => (
                      <View
                        key={item.category}
                        style={
                          styles.breakdownItem
                        }
                      >
                        <View
                          style={
                            styles.breakdownLeft
                          }
                        >
                          <View
                            style={
                              styles.breakdownDot
                            }
                          />

                          <Text
                            style={
                              styles.breakdownCategory
                            }
                          >
                            {item.category}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.breakdownRight
                          }
                        >
                          <Text
                            style={
                              styles.breakdownAmount
                            }
                          >
                            {formatCurrency(
                              item.amount
                            )}
                          </Text>

                          <Text
                            style={
                              styles.breakdownPercentage
                            }
                          >
                            {Math.round(
                              item.percentage
                            )}
                            %
                          </Text>
                        </View>
                      </View>
                    ))}
                </View>
              </View>
            )}

            {/* Insight */}
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Ionicons
                  name="bulb-outline"
                  size={22}
                  color={GOLD}
                />
              </View>

              <View
                style={styles.insightContent}
              >
                <Text style={styles.insightLabel}>
                  SPENDLY PRO INSIGHT
                </Text>

                <Text style={styles.insightTitle}>
                  {topCategory
                    ? `${topCategory.category} is leading your spending.`
                    : "Start tracking to unlock insights."}
                </Text>

                <Text
                  style={styles.insightDescription}
                >
                  {topCategory
                    ? `${topCategory.category} accounts for ${Math.round(
                        topCategory.percentage
                      )}% of your spending ${getPeriodLabel().toLowerCase()}.`
                    : "Add expenses and Spendly will identify useful spending patterns for you."}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Image
              source={require("../../assets/icon.png")}
              style={styles.footerLogoImage}
              resizeMode="contain"
            />

            <Text style={styles.footerBrand}>
              SPENDLY
            </Text>
          </View>

          <Text style={styles.footerTagline}>
            Smart Spending, Brighter Tomorrows
          </Text>

          <Text style={styles.footerSmall}>
            Spend smarter. Plan better. Live brighter.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 45,
  },

  backgroundOrbTop: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(37,99,235,0.07)",
    top: -80,
    right: -70,
  },

  backgroundOrbBottom: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(184,138,36,0.06)",
    bottom: 80,
    left: -120,
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 2,
  },

  headerContent: {
    flex: 1,
    marginLeft: 13,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: MUTED,
    fontWeight: "500",
  },

  proBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(184,138,36,0.11)",
    borderWidth: 1,
    borderColor: "rgba(184,138,36,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  periodCard: {
    flexDirection: "row",
    padding: 5,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    marginBottom: 15,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 2,
  },

  periodButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  periodButtonActive: {
    backgroundColor: BLUE,
    shadowColor: BLUE,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  periodText: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "800",
  },

  periodTextActive: {
    color: WHITE,
  },

  loadingContainer: {
    minHeight: 430,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: MUTED,
    fontWeight: "600",
  },

  totalCard: {
    overflow: "hidden",
    borderRadius: 27,
    padding: 23,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 3,
    marginBottom: 15,
  },

  totalGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(37,99,235,0.07)",
    right: -80,
    top: -75,
  },

  totalTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  eyebrow: {
    fontSize: 8,
    color: GOLD,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  totalLabel: {
    marginTop: 4,
    fontSize: 13,
    color: MUTED,
    fontWeight: "600",
  },

  chartIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.09)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.12)",
  },

  totalAmount: {
    marginTop: 14,
    fontSize: 34,
    color: TEXT,
    fontWeight: "900",
    letterSpacing: -1,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  statusText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "800",
  },

  chartCard: {
    borderRadius: 25,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
    marginBottom: 15,
  },

  sectionTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 10.5,
    color: MUTED,
    lineHeight: 16,
    fontWeight: "500",
  },

  chartLegend: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: BLUE,
    marginRight: 5,
  },

  legendText: {
    fontSize: 9,
    color: MUTED,
    fontWeight: "700",
  },

  chartWrapper: {
    marginTop: 15,
    marginLeft: -2,
  },

  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginTop: -8,
  },

  chartLabel: {
    fontSize: 9,
    color: MUTED,
    fontWeight: "600",
  },

  emptyChart: {
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  emptyChartTitle: {
    marginTop: 10,
    fontSize: 13,
    color: TEXT,
    fontWeight: "800",
  },

  emptyChartText: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: "center",
    color: MUTED,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  statCard: {
    width: "48.3%",
    minHeight: 125,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 2,
  },

  statIconBlue: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: "rgba(37,99,235,0.09)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  statIconGold: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: "rgba(184,138,36,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  statLabel: {
    fontSize: 9.5,
    color: MUTED,
    fontWeight: "600",
  },

  statValue: {
    marginTop: 4,
    fontSize: 16,
    color: TEXT,
    fontWeight: "900",
  },

  statDate: {
    marginTop: 2,
    fontSize: 9,
    color: MUTED,
    fontWeight: "600",
  },

  categoryCard: {
    borderRadius: 25,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
    marginBottom: 15,
  },

  topCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 17,
  },

  topCategoryIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "rgba(37,99,235,0.09)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  topCategoryContent: {
    flex: 1,
    marginLeft: 12,
  },

  topCategoryName: {
    fontSize: 13,
    color: TEXT,
    fontWeight: "800",
  },

  topCategoryAmount: {
    marginTop: 3,
    fontSize: 11,
    color: MUTED,
    fontWeight: "600",
  },

  topCategoryPercentage: {
    fontSize: 16,
    color: BLUE,
    fontWeight: "900",
  },

  progressTrack: {
    height: 8,
    borderRadius: 10,
    backgroundColor: "#E8EEF7",
    overflow: "hidden",
    marginTop: 15,
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: BLUE,
  },

  noDataText: {
    marginTop: 17,
    fontSize: 11,
    color: MUTED,
    fontWeight: "500",
  },

  breakdownCard: {
    borderRadius: 25,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
    marginBottom: 15,
  },

  breakdownList: {
    marginTop: 13,
  },

  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },

  breakdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE,
    marginRight: 9,
  },

  breakdownCategory: {
    fontSize: 11,
    color: TEXT,
    fontWeight: "700",
  },

  breakdownRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  breakdownAmount: {
    fontSize: 10.5,
    color: TEXT,
    fontWeight: "800",
  },

  breakdownPercentage: {
    width: 38,
    textAlign: "right",
    fontSize: 9,
    color: MUTED,
    fontWeight: "700",
  },

  insightCard: {
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    backgroundColor: "rgba(184,138,36,0.08)",
    borderWidth: 1,
    borderColor: "rgba(184,138,36,0.18)",
    marginBottom: 5,
  },

  insightIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "rgba(184,138,36,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  insightContent: {
    flex: 1,
  },

  insightLabel: {
    fontSize: 8,
    color: GOLD,
    fontWeight: "900",
    letterSpacing: 1,
  },

  insightTitle: {
    marginTop: 4,
    fontSize: 14,
    color: TEXT,
    fontWeight: "900",
  },

  insightDescription: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 17,
    color: MUTED,
    fontWeight: "500",
  },

  footer: {
    alignItems: "center",
    marginTop: 25,
  },

  footerLogo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  footerLogoImage: {
    width: 34,
    height: 34,
    marginRight: 8,
  },

  footerBrand: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: 1.5,
  },

  footerTagline: {
    marginTop: 7,
    fontSize: 10,
    color: GOLD,
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  footerSmall: {
    marginTop: 4,
    fontSize: 9,
    color: MUTED,
    fontWeight: "500",
    textAlign: "center",
  },
});