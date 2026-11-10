import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Image,
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
        return "#E97832";

      case "Transport":
        return "#2D73D5";

      case "Shopping":
        return "#C65387";

      case "Bills":
        return "#7659C7";

      case "Entertainment":
        return "#249A72";

      case "Health":
        return "#D95353";

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

  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative Sri Lankan-inspired background elements */}
      <View pointerEvents="none" style={styles.backgroundDecorOne} />
      <View pointerEvents="none" style={styles.backgroundDecorTwo} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ================================= */}
        {/* BRAND HEADER */}
        {/* ================================= */}

        <View style={styles.topHeader}>
          <View style={styles.brandContainer}>
            <Image
              source={require("../../assets/icon.png")}
              style={styles.brandLogo}
              resizeMode="contain"
            />

            <View style={styles.brandTextContainer}>
              <Text style={styles.brandName}>SPENDLY</Text>

              <View style={styles.brandLine}>
                <View style={styles.brandLineBlue} />
                <View style={styles.brandLineGold} />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            activeOpacity={0.75}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color="#183B67"
            />

            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* ================================= */}
        {/* GREETING */}
        {/* ================================= */}

        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Good evening 👋</Text>

          <Text style={styles.name}>Hirusha</Text>

          <Text style={styles.subtitle}>
            Let's keep your spending on track.
          </Text>
        </View>

        {/* ================================= */}
        {/* MONTHLY SPENDING GLASS CARD */}
        {/* ================================= */}

        <View style={styles.totalCard}>
          <View style={styles.cardGlow} />

          <View style={styles.totalTop}>
            <View>
              <Text style={styles.totalLabel}>TOTAL SPENT</Text>

              <View style={styles.monthRow}>
                <Text style={styles.month}>{currentMonth}</Text>

                <Ionicons
                  name="chevron-down"
                  size={13}
                  color="#7890AA"
                />
              </View>
            </View>

            <View style={styles.walletIcon}>
              <Ionicons
                name="wallet-outline"
                size={21}
                color="#2563EB"
              />
            </View>
          </View>

          <Text style={styles.totalAmount}>
            {formatAmount(monthlyTotal)}
          </Text>

          <View style={styles.totalFooter}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />

              <Text style={styles.statusText}>
                This month
              </Text>
            </View>

            <View style={styles.goldAccent}>
              <Ionicons
                name="sparkles-outline"
                size={13}
                color="#B88A24"
              />

              <Text style={styles.goldAccentText}>
                Spend smart
              </Text>
            </View>
          </View>

          {/* Decorative gold curve */}
          <View style={styles.goldCurveOne} />
          <View style={styles.goldCurveTwo} />
        </View>

        {/* ================================= */}
        {/* QUICK ACTIONS */}
        {/* ================================= */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick actions</Text>

          <View style={styles.sectionAccent} />
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            activeOpacity={0.8}
            onPress={() => router.push("/add-expense")}
          >
            <View
              style={[
                styles.quickIcon,
                { backgroundColor: "rgba(37,99,235,0.10)" },
              ]}
            >
              <Ionicons
                name="add"
                size={22}
                color="#2563EB"
              />
            </View>

            <Text style={styles.quickTitle}>Expense</Text>
            <Text style={styles.quickSubtitle}>Add new</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            activeOpacity={0.8}
            onPress={() => router.replace("/budgets")}
          >
            <View
              style={[
                styles.quickIcon,
                { backgroundColor: "rgba(184,138,36,0.12)" },
              ]}
            >
              <Ionicons
                name="wallet-outline"
                size={21}
                color="#B88A24"
              />
            </View>

            <Text style={styles.quickTitle}>Budgets</Text>
            <Text style={styles.quickSubtitle}>Stay on track</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            activeOpacity={0.8}
            onPress={() => router.replace("/insights")}
          >
            <View
              style={[
                styles.quickIcon,
                { backgroundColor: "rgba(36,154,114,0.10)" },
              ]}
            >
              <Ionicons
                name="pie-chart-outline"
                size={21}
                color="#249A72"
              />
            </View>

            <Text style={styles.quickTitle}>Insights</Text>
            <Text style={styles.quickSubtitle}>View trends</Text>
          </TouchableOpacity>
        </View>

        {/* ================================= */}
        {/* RECENT EXPENSES */}
        {/* ================================= */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Recent expenses
            </Text>

            <Text style={styles.sectionSubtitle}>
              Your latest spending activity
            </Text>
          </View>

          {expenses.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {expenses.length}
              </Text>
            </View>
          )}
        </View>

        {/* ================================= */}
        {/* EXPENSE CONTENT */}
        {/* ================================= */}

        {loading ? (
          <View style={styles.glassEmptyCard}>
            <View style={styles.loadingCircle}>
              <Ionicons
                name="sync-outline"
                size={22}
                color="#2563EB"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Loading your expenses
            </Text>

            <Text style={styles.emptyText}>
              Getting your latest spending activity...
            </Text>
          </View>
        ) : expenses.length === 0 ? (
          <View style={styles.glassEmptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="wallet-outline"
                size={28}
                color="#2563EB"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No expenses yet
            </Text>

            <Text style={styles.emptyText}>
              Add your first expense to start tracking
              your spending.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/add-expense")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="add"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.emptyButtonText}>
                Add expense
              </Text>
            </TouchableOpacity>
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
                  activeOpacity={0.78}
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
                        backgroundColor: `${categoryColor}12`,
                        borderColor: `${categoryColor}28`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getCategoryIcon(
                        expense.category
                      )}
                      size={21}
                      color={categoryColor}
                    />
                  </View>

                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseCategory}>
                      {expense.category}
                    </Text>

                    <Text style={styles.expenseNote}>
                      {expense.note ||
                        formatDate(expense.date)}
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

                  <Ionicons
                    name="chevron-forward"
                    size={15}
                    color="#A7B4C5"
                    style={styles.expenseChevron}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ================================= */}
        {/* BRAND FOOTER */}
        {/* ================================= */}

        <View style={styles.brandFooter}>
          <View style={styles.footerLine} />

          <Text style={styles.footerText}>
            Smart Spending, Brighter Tomorrows
          </Text>

          <View style={styles.footerLine} />
        </View>
      </ScrollView>

      {/* ================================= */}
      {/* BOTTOM NAVIGATION */}
      {/* ================================= */}

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FC",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 125,
  },

  /* ================================= */
  /* BACKGROUND DECOR */
  /* ================================= */

  backgroundDecorOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(37,99,235,0.045)",
    top: -100,
    right: -80,
  },

  backgroundDecorTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(184,138,36,0.035)",
    top: 300,
    left: -110,
  },

  /* ================================= */
  /* BRAND HEADER */
  /* ================================= */

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandLogo: {
    width: 38,
    height: 38,
    marginRight: 7,
  },

  brandTextContainer: {
    justifyContent: "center",
  },

  brandName: {
    color: "#17375F",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2.2,
  },

  brandLine: {
    flexDirection: "row",
    width: 48,
    height: 3,
    marginTop: 3,
    borderRadius: 3,
    overflow: "hidden",
  },

  brandLineBlue: {
    flex: 2,
    backgroundColor: "#2563EB",
  },

  brandLineGold: {
    flex: 1,
    backgroundColor: "#B88A24",
  },

  notificationButton: {
    width: 43,
    height: 43,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#17375F",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },

  notificationDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#B88A24",
    top: 10,
    right: 10,
  },

  /* ================================= */
  /* GREETING */
  /* ================================= */

  greetingSection: {
    marginBottom: 20,
  },

  greeting: {
    color: "#71839A",
    fontSize: 13,
    fontWeight: "500",
  },

  name: {
    color: "#17375F",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginTop: 2,
  },

  subtitle: {
    color: "#8797AA",
    fontSize: 12,
    marginTop: 5,
  },

  /* ================================= */
  /* TOTAL GLASS CARD */
  /* ================================= */

  totalCard: {
    minHeight: 190,
    borderRadius: 26,
    padding: 21,

    backgroundColor: "rgba(255,255,255,0.68)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",

    shadowColor: "#17375F",
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.10,
    shadowRadius: 28,
    elevation: 5,

    overflow: "hidden",
    marginBottom: 24,
  },

  cardGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(37,99,235,0.07)",
    right: -50,
    top: -60,
  },

  totalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  totalLabel: {
    color: "#71839A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  month: {
    color: "#50677F",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 3,
  },

  walletIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "rgba(37,99,235,0.09)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  totalAmount: {
    color: "#17375F",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 19,
  },

  totalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(36,154,114,0.08)",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#249A72",
    marginRight: 6,
  },

  statusText: {
    color: "#43826E",
    fontSize: 10,
    fontWeight: "700",
  },

  goldAccent: {
    flexDirection: "row",
    alignItems: "center",
  },

  goldAccentText: {
    color: "#9B7628",
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 4,
  },

  goldCurveOne: {
    position: "absolute",
    width: 170,
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "rgba(184,138,36,0.25)",
    borderRadius: 100,
    right: -45,
    bottom: -32,
    transform: [{ rotate: "-12deg" }],
  },

  goldCurveTwo: {
    position: "absolute",
    width: 140,
    height: 55,
    borderTopWidth: 1,
    borderTopColor: "rgba(37,99,235,0.14)",
    borderRadius: 100,
    right: -25,
    bottom: -21,
    transform: [{ rotate: "-12deg" }],
  },

  /* ================================= */
  /* SECTION */
  /* ================================= */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#17375F",
    fontSize: 17,
    fontWeight: "850",
    letterSpacing: -0.2,
  },

  sectionSubtitle: {
    color: "#91A0B1",
    fontSize: 11,
    marginTop: 3,
  },

  sectionAccent: {
    width: 26,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#B88A24",
  },

  countBadge: {
    minWidth: 27,
    height: 27,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "rgba(37,99,235,0.08)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "800",
  },

  /* ================================= */
  /* QUICK ACTIONS */
  /* ================================= */

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  quickAction: {
    width: "31.5%",
    minHeight: 103,
    borderRadius: 20,
    padding: 13,

    backgroundColor: "rgba(255,255,255,0.62)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",

    shadowColor: "#17375F",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },

  quickIcon: {
    width: 37,
    height: 37,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  quickTitle: {
    color: "#244462",
    fontSize: 11,
    fontWeight: "800",
  },

  quickSubtitle: {
    color: "#94A2B2",
    fontSize: 9,
    marginTop: 2,
  },

  /* ================================= */
  /* EXPENSE LIST */
  /* ================================= */

  expensesList: {
    gap: 10,
  },

  expenseItem: {
    minHeight: 74,
    borderRadius: 19,
    padding: 13,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "rgba(255,255,255,0.64)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",

    shadowColor: "#17375F",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.055,
    shadowRadius: 15,
    elevation: 2,
  },

  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  expenseInfo: {
    flex: 1,
    marginLeft: 12,
  },

  expenseCategory: {
    color: "#244462",
    fontSize: 13,
    fontWeight: "800",
  },

  expenseNote: {
    color: "#91A0B1",
    fontSize: 10,
    marginTop: 4,
  },

  expenseRight: {
    alignItems: "flex-end",
    marginRight: 5,
  },

  expenseAmount: {
    color: "#17375F",
    fontSize: 13,
    fontWeight: "800",
  },

  expenseDate: {
    color: "#A1AEBD",
    fontSize: 9,
    marginTop: 4,
  },

  expenseChevron: {
    marginLeft: 3,
  },

  /* ================================= */
  /* EMPTY / LOADING */
  /* ================================= */

  glassEmptyCard: {
    backgroundColor: "rgba(255,255,255,0.62)",
    borderRadius: 23,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",

    shadowColor: "#17375F",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "rgba(37,99,235,0.09)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  loadingCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(37,99,235,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    color: "#244462",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
  },

  emptyText: {
    color: "#91A0B1",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 280,
  },

  emptyButton: {
    marginTop: 18,
    height: 42,
    paddingHorizontal: 17,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 6,
  },

  /* ================================= */
  /* FOOTER */
  /* ================================= */

  brandFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    marginBottom: 5,
  },

  footerLine: {
    width: 24,
    height: 1,
    backgroundColor: "rgba(184,138,36,0.25)",
    marginHorizontal: 8,
  },

  footerText: {
    color: "#A0ADBB",
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});