import { Ionicons } from "@expo/vector-icons";
import {
    router,
    useFocusEffect,
} from "expo-router";
import {
    useCallback,
    useMemo,
    useState,
} from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import BottomNav from "../components/BottomNav";

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

const CATEGORY_COLORS: Record<
  string,
  string
> = {
  Food: "#F97316",
  Transport: "#3B82F6",
  Shopping: "#EC4899",
  Bills: "#8B5CF6",
  Entertainment: "#10B981",
  Health: "#EF4444",
  Other: "#64748B",
};

const CATEGORY_ICONS: Record<
  string,
  any
> = {
  Food: "restaurant-outline",
  Transport: "car-outline",
  Shopping: "bag-handle-outline",
  Bills: "receipt-outline",
  Entertainment:
    "game-controller-outline",
  Health: "medkit-outline",
  Other:
    "ellipsis-horizontal-circle-outline",
};

export default function BudgetsScreen() {
  const [budgets, setBudgets] =
    useState<Budget[]>([]);

  const [expenses, setExpenses] =
    useState<Expense[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        budgetData,
        expenseData,
      ] = await Promise.all([
        getBudgets(),
        getExpenses(),
      ]);

      setBudgets(budgetData);
      setExpenses(expenseData);
    } catch (error) {
      console.error(
        "❌ BUDGET LOAD ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const getCategoryColor = (
    category: string
  ) => {
    return (
      CATEGORY_COLORS[category] ||
      CATEGORY_COLORS.Other
    );
  };

  const getCategoryIcon = (
    category: string
  ): any => {
    return (
      CATEGORY_ICONS[category] ||
      CATEGORY_ICONS.Other
    );
  };

  const formatAmount = (
    amount: number
  ) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const getSpentForCategory = (
    category: string
  ) => {
    const now = new Date();

    return expenses
      .filter((expense) => {
        const date =
          new Date(expense.date);

        return (
          expense.category ===
            category &&
          date.getMonth() ===
            now.getMonth() &&
          date.getFullYear() ===
            now.getFullYear()
        );
      })
      .reduce(
        (total, expense) =>
          total + expense.amount,
        0
      );
  };

  const totalBudget =
    useMemo(() => {
      return budgets.reduce(
        (total, budget) =>
          total + budget.amount,
        0
      );
    }, [budgets]);

  const totalSpent =
    useMemo(() => {
      return budgets.reduce(
        (total, budget) =>
          total +
          getSpentForCategory(
            budget.category
          ),
        0
      );
    }, [budgets, expenses]);

  const remaining =
    totalBudget - totalSpent;

  const overallProgress =
    totalBudget > 0
      ? Math.min(
          totalSpent /
            totalBudget,
          1
        )
      : 0;

  const monthName =
    new Date().toLocaleString(
      "en-US",
      {
        month: "long",
      }
    );

  const overBudgetCount =
    budgets.filter((budget) => {
      const spent =
        getSpentForCategory(
          budget.category
        );

      return (
        spent > budget.amount
      );
    }).length;

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
          onPress: (
            amountText?: string
          ) => {
            const amount =
              Number(
                amountText
              );

            if (
              !amount ||
              amount <= 0
            ) {
              Alert.alert(
                "Invalid amount",
                "Please enter a valid budget amount."
              );
              return;
            }

            Alert.alert(
              "Choose Category",
              "Select a category",
              categories.map(
                (category) => ({
                  text:
                    category,
                  onPress:
                    async () => {
                      try {
                        await addBudget(
                          category,
                          amount
                        );

                        await loadData();
                      } catch (
                        error
                      ) {
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
                })
              )
            );
          },
        },
      ],
      "plain-text"
    );
  };

  const handleDeleteBudget = (
    budget: Budget
  ) => {
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
          onPress:
            async () => {
              try {
                await deleteBudget(
                  budget.id
                );

                await loadData();
              } catch (
                error
              ) {
                console.error(
                  "❌ DELETE BUDGET ERROR:",
                  error
                );

                Alert.alert(
                  "Error",
                  "Could not delete the budget."
                );
              }
            },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* Background decoration */}
      <View
        style={
          styles.backgroundOrbOne
        }
      />

      <View
        style={
          styles.backgroundOrbTwo
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* HEADER */}
        <View
          style={styles.header}
        >
          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.replace(
                "/"
              )
            }
            activeOpacity={0.75}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color="#163A63"
            />
          </TouchableOpacity>

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={
                styles.eyebrow
              }
            >
              SPENDLY
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Budgets
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Take control of your spending
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.addSmallButton
            }
            onPress={
              handleAddBudget
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="add"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <View
              style={
                styles.loadingGlass
              }
            >
              <View
                style={
                  styles.loadingIcon
                }
              >
                <Ionicons
                  name="wallet-outline"
                  size={23}
                  color="#2563EB"
                />
              </View>

              <Text
                style={
                  styles.loadingText
                }
              >
                Loading budgets...
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* OVERVIEW CARD */}
            <View
              style={
                styles.overviewCard
              }
            >
              <View
                style={
                  styles.overviewGlow
                }
              />

              <View
                style={
                  styles.overviewTop
                }
              >
                <View>
                  <View
                    style={
                      styles.monthPill
                    }
                  >
                    <View
                      style={
                        styles.monthDot
                      }
                    />

                    <Text
                      style={
                        styles.monthText
                      }
                    >
                      {monthName}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.overviewLabel
                    }
                  >
                    Monthly budget
                  </Text>

                  <Text
                    style={
                      styles.overviewAmount
                    }
                  >
                    {formatAmount(
                      totalBudget
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.walletIcon
                  }
                >
                  <Ionicons
                    name="wallet-outline"
                    size={24}
                    color="#2563EB"
                  />
                </View>
              </View>

              {/* Progress */}
              <View
                style={
                  styles.progressBackground
                }
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${overallProgress * 100}%`,
                      backgroundColor:
                        remaining <
                        0
                          ? "#EF4444"
                          : "#2563EB",
                    },
                  ]}
                />
              </View>

              <View
                style={
                  styles.progressMeta
                }
              >
                <Text
                  style={
                    styles.progressText
                  }
                >
                  {Math.round(
                    overallProgress *
                      100
                  )}
                  % used
                </Text>

                <Text
                  style={
                    styles.progressText
                  }
                >
                  {remaining <
                  0
                    ? "Over budget"
                    : "Within budget"}
                </Text>
              </View>

              {/* Bottom metrics */}
              <View
                style={
                  styles.overviewBottom
                }
              >
                <View>
                  <Text
                    style={
                      styles.smallLabel
                    }
                  >
                    Spent
                  </Text>

                  <Text
                    style={
                      styles.spentAmount
                    }
                  >
                    {formatAmount(
                      totalSpent
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.verticalDivider
                  }
                />

                <View
                  style={
                    styles.remainingContainer
                  }
                >
                  <Text
                    style={
                      styles.smallLabel
                    }
                  >
                    {remaining >=
                    0
                      ? "Remaining"
                      : "Over budget"}
                  </Text>

                  <Text
                    style={[
                      styles.remainingAmount,
                      {
                        color:
                          remaining >=
                          0
                            ? "#16A34A"
                            : "#EF4444",
                      },
                    ]}
                  >
                    {formatAmount(
                      Math.abs(
                        remaining
                      )
                    )}
                  </Text>
                </View>
              </View>
            </View>

            {/* STATUS STRIP */}
            <View
              style={
                styles.statusStrip
              }
            >
              <View
                style={
                  styles.statusIcon
                }
              >
                <Ionicons
                  name={
                    overBudgetCount >
                    0
                      ? "warning-outline"
                      : "shield-checkmark-outline"
                  }
                  size={18}
                  color={
                    overBudgetCount >
                    0
                      ? "#EF4444"
                      : "#16A34A"
                  }
                />
              </View>

              <View
                style={
                  styles.statusInfo
                }
              >
                <Text
                  style={
                    styles.statusTitle
                  }
                >
                  {overBudgetCount >
                  0
                    ? `${overBudgetCount} budget${
                        overBudgetCount >
                        1
                          ? "s"
                          : ""
                      } need attention`
                    : "You're on track"}
                </Text>

                <Text
                  style={
                    styles.statusText
                  }
                >
                  {overBudgetCount >
                  0
                    ? "Review your spending before the month ends."
                    : "Keep your spending within your planned limits."}
                </Text>
              </View>
            </View>

            {/* SECTION HEADER */}
            <View
              style={
                styles.sectionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Category budgets
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Monthly limits by category
                </Text>
              </View>

              <View
                style={
                  styles.countBadge
                }
              >
                <Text
                  style={
                    styles.count
                  }
                >
                  {budgets.length}
                </Text>
              </View>
            </View>

            {/* EMPTY STATE */}
            {budgets.length ===
            0 ? (
              <View
                style={
                  styles.emptyState
                }
              >
                <View
                  style={
                    styles.emptyIcon
                  }
                >
                  <Ionicons
                    name="wallet-outline"
                    size={29}
                    color="#2563EB"
                  />
                </View>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No budgets yet
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Create your first
                  monthly category
                  budget and start
                  keeping your
                  spending on track.
                </Text>

                <TouchableOpacity
                  style={
                    styles.createButton
                  }
                  onPress={
                    handleAddBudget
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="add"
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.createButtonText
                    }
                  >
                    Create Budget
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={
                  styles.budgetList
                }
              >
                {budgets.map(
                  (budget) => {
                    const spent =
                      getSpentForCategory(
                        budget.category
                      );

                    const progress =
                      budget.amount >
                      0
                        ? Math.min(
                            spent /
                              budget.amount,
                            1
                          )
                        : 0;

                    const percentage =
                      budget.amount >
                      0
                        ? Math.round(
                            (spent /
                              budget.amount) *
                              100
                          )
                        : 0;

                    const isOverBudget =
                      spent >
                      budget.amount;

                    const color =
                      getCategoryColor(
                        budget.category
                      );

                    return (
                      <TouchableOpacity
                        key={
                          budget.id
                        }
                        style={
                          styles.budgetCard
                        }
                        activeOpacity={
                          0.82
                        }
                        onLongPress={() =>
                          handleDeleteBudget(
                            budget
                          )
                        }
                      >
                        {/* Top */}
                        <View
                          style={
                            styles.budgetTop
                          }
                        >
                          <View
                            style={
                              styles.categoryLeft
                            }
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
                                name={getCategoryIcon(
                                  budget.category
                                )}
                                size={
                                  21
                                }
                                color={
                                  color
                                }
                              />
                            </View>

                            <View
                              style={
                                styles.categoryInfo
                              }
                            >
                              <Text
                                style={
                                  styles.categoryName
                                }
                              >
                                {
                                  budget.category
                                }
                              </Text>

                              <Text
                                style={
                                  styles.budgetLimit
                                }
                              >
                                Limit{" "}
                                {formatAmount(
                                  budget.amount
                                )}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={
                              styles.percentageContainer
                            }
                          >
                            <Text
                              style={[
                                styles.percentage,
                                {
                                  color:
                                    isOverBudget
                                      ? "#EF4444"
                                      : "#163A63",
                                },
                              ]}
                            >
                              {percentage}%
                            </Text>

                            <Text
                              style={
                                styles.spentText
                              }
                            >
                              spent
                            </Text>
                          </View>
                        </View>

                        {/* Progress */}
                        <View
                          style={
                            styles.progressBackgroundSmall
                          }
                        >
                          <View
                            style={[
                              styles.progressFillSmall,
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

                        {/* Bottom */}
                        <View
                          style={
                            styles.budgetBottom
                          }
                        >
                          <View
                            style={
                              styles.bottomStatus
                            }
                          >
                            <View
                              style={[
                                styles.statusDot,
                                {
                                  backgroundColor:
                                    isOverBudget
                                      ? "#EF4444"
                                      : "#16A34A",
                                },
                              ]}
                            />

                            <Text
                              style={[
                                styles.remainingText,
                                {
                                  color:
                                    isOverBudget
                                      ? "#EF4444"
                                      : "#60748A",
                                },
                              ]}
                            >
                              {isOverBudget
                                ? `${formatAmount(
                                    spent -
                                      budget.amount
                                  )} over budget`
                                : `${formatAmount(
                                    budget.amount -
                                      spent
                                  )} remaining`}
                            </Text>
                          </View>

                          <Text
                            style={
                              styles.hintText
                            }
                          >
                            Hold to delete
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            )}

            {/* PREMIUM PREVIEW */}
            {budgets.length > 0 && (
              <View
                style={
                  styles.premiumCard
                }
              >
                <View
                  style={
                    styles.premiumGlow
                  }
                />

                <View
                  style={
                    styles.premiumTop
                  }
                >
                  <View
                    style={
                      styles.premiumIcon
                    }
                  >
                    <Ionicons
                      name="sparkles"
                      size={19}
                      color="#B88A24"
                    />
                  </View>

                  <View
                    style={
                      styles.proBadge
                    }
                  >
                    <Text
                      style={
                        styles.proBadgeText
                      }
                    >
                      PRO
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    styles.premiumTitle
                  }
                >
                  Smarter budgeting with Pro
                </Text>

                <Text
                  style={
                    styles.premiumDescription
                  }
                >
                  Get advanced budget insights,
                  smarter spending patterns and
                  deeper control over your monthly
                  finances.
                </Text>

                <View
                  style={
                    styles.featureRow
                  }
                >
                  <PremiumFeature
                    icon="analytics-outline"
                    text="Budget trends"
                  />

                  <PremiumFeature
                    icon="notifications-outline"
                    text="Smart alerts"
                  />

                  <PremiumFeature
                    icon="flag-outline"
                    text="Savings goals"
                  />
                </View>
              </View>
            )}
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
    <View
      style={
        styles.featureItem
      }
    >
      <View
        style={
          styles.featureIcon
        }
      >
        <Ionicons
          name={icon}
          size={14}
          color="#2563EB"
        />
      </View>

      <Text
        style={
          styles.featureText
        }
      >
        {text}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F5F8FC",
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 125,
    },

    /* BACKGROUND */

    backgroundOrbOne: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor:
        "#DCEBFF",
      opacity: 0.48,
      top: -95,
      right: -105,
    },

    backgroundOrbTwo: {
      position: "absolute",
      width: 175,
      height: 175,
      borderRadius: 88,
      backgroundColor:
        "#F5E8C8",
      opacity: 0.28,
      bottom: 140,
      left: -110,
    },

    /* HEADER */

    header: {
      minHeight: 76,
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 17,
    },

    backButton: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor:
        "rgba(255,255,255,0.72)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.95)",
      alignItems:
        "center",
      justifyContent:
        "center",

      shadowColor:
        "#163A63",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity:
        0.08,
      shadowRadius: 12,
      elevation: 3,
    },

    headerText: {
      flex: 1,
      marginLeft: 14,
    },

    eyebrow: {
      color: "#B88A24",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing: 2.2,
      marginBottom: 2,
    },

    title: {
      color: "#163A63",
      fontSize: 24,
      fontWeight:
        "900",
    },

    subtitle: {
      color: "#7B8CA1",
      fontSize: 11,
      marginTop: 3,
    },

    addSmallButton: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor:
        "#2563EB",
      alignItems:
        "center",
      justifyContent:
        "center",

      shadowColor:
        "#2563EB",
      shadowOffset: {
        width: 0,
        height: 7,
      },
      shadowOpacity:
        0.18,
      shadowRadius: 13,
      elevation: 4,
    },

    /* LOADING */

    loadingContainer: {
      paddingTop: 80,
      alignItems:
        "center",
    },

    loadingGlass: {
      width: 190,
      height: 145,
      borderRadius: 25,
      backgroundColor:
        "rgba(255,255,255,0.78)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.95)",
      alignItems:
        "center",
      justifyContent:
        "center",

      shadowColor:
        "#163A63",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity:
        0.08,
      shadowRadius: 20,
      elevation: 4,
    },

    loadingIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor:
        "#EEF5FF",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 10,
    },

    loadingText: {
      color: "#6E8197",
      fontSize: 13,
      fontWeight:
        "600",
    },

    /* OVERVIEW */

    overviewCard: {
      minHeight: 250,
      borderRadius: 28,
      padding: 22,
      backgroundColor:
        "rgba(255,255,255,0.76)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.95)",
      overflow:
        "hidden",
      marginBottom: 14,

      shadowColor:
        "#163A63",
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity:
        0.09,
      shadowRadius: 24,
      elevation: 5,
    },

    overviewGlow: {
      position:
        "absolute",
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor:
        "#E5F0FF",
      right: -85,
      top: -80,
      opacity: 0.8,
    },

    overviewTop: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
    },

    monthPill: {
      flexDirection:
        "row",
      alignItems:
        "center",
      alignSelf:
        "flex-start",
      backgroundColor:
        "#EEF5FF",
      borderRadius:
        999,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor:
        "#DCE9FA",
      marginBottom: 12,
    },

    monthDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor:
        "#2563EB",
      marginRight: 6,
    },

    monthText: {
      color: "#2563EB",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        0.8,
      textTransform:
        "uppercase",
    },

    overviewLabel: {
      color: "#7B8CA1",
      fontSize: 12,
      fontWeight:
        "600",
    },

    overviewAmount: {
      color: "#163A63",
      fontSize: 31,
      fontWeight:
        "900",
      marginTop: 5,
    },

    walletIcon: {
      width: 48,
      height: 48,
      borderRadius: 17,
      backgroundColor:
        "#EEF5FF",
      borderWidth: 1,
      borderColor:
        "#DCE9FA",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    progressBackground: {
      height: 8,
      backgroundColor:
        "#E8EEF5",
      borderRadius: 999,
      overflow:
        "hidden",
      marginTop: 20,
    },

    progressFill: {
      height:
        "100%",
      borderRadius: 999,
    },

    progressMeta: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      marginTop: 7,
    },

    progressText: {
      color: "#8798AA",
      fontSize: 9,
      fontWeight:
        "600",
    },

    overviewBottom: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 19,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor:
        "#E8EEF5",
    },

    smallLabel: {
      color: "#7B8CA1",
      fontSize: 10,
      fontWeight:
        "600",
    },

    spentAmount: {
      color: "#163A63",
      fontSize: 14,
      fontWeight:
        "800",
      marginTop: 4,
    },

    verticalDivider: {
      width: 1,
      height: 34,
      backgroundColor:
        "#E5EBF2",
      marginHorizontal:
        22,
    },

    remainingContainer: {
      flex: 1,
    },

    remainingAmount: {
      fontSize: 14,
      fontWeight:
        "900",
      marginTop: 4,
    },

    /* STATUS */

    statusStrip: {
      minHeight: 73,
      borderRadius: 19,
      backgroundColor:
        "rgba(255,255,255,0.67)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.9)",
      padding: 13,
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 26,

      shadowColor:
        "#163A63",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity:
        0.04,
      shadowRadius: 12,
      elevation: 2,
    },

    statusIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor:
        "#EEF5FF",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    statusInfo: {
      flex: 1,
      marginLeft: 11,
    },

    statusTitle: {
      color: "#163A63",
      fontSize: 11,
      fontWeight:
        "800",
    },

    statusText: {
      color: "#8798AA",
      fontSize: 9,
      lineHeight: 15,
      marginTop: 3,
    },

    /* SECTION */

    sectionHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 13,
    },

    sectionTitle: {
      color: "#163A63",
      fontSize: 18,
      fontWeight:
        "900",
    },

    sectionSubtitle: {
      color: "#7B8CA1",
      fontSize: 10,
      marginTop: 4,
    },

    countBadge: {
      minWidth: 31,
      height: 31,
      paddingHorizontal: 9,
      borderRadius: 11,
      backgroundColor:
        "#EEF5FF",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    count: {
      color: "#2563EB",
      fontSize: 11,
      fontWeight:
        "900",
    },

    /* BUDGET LIST */

    budgetList: {
      gap: 12,
    },

    budgetCard: {
      backgroundColor:
        "rgba(255,255,255,0.72)",
      borderRadius: 22,
      padding: 17,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.95)",

      shadowColor:
        "#163A63",
      shadowOffset: {
        width: 0,
        height: 7,
      },
      shadowOpacity:
        0.055,
      shadowRadius: 15,
      elevation: 2,
    },

    budgetTop: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    categoryLeft: {
      flexDirection:
        "row",
      alignItems:
        "center",
      flex: 1,
    },

    categoryIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 12,
    },

    categoryInfo: {
      flex: 1,
    },

    categoryName: {
      color: "#163A63",
      fontSize: 14,
      fontWeight:
        "900",
    },

    budgetLimit: {
      color: "#8798AA",
      fontSize: 9,
      marginTop: 4,
    },

    percentageContainer: {
      alignItems:
        "flex-end",
    },

    percentage: {
      fontSize: 16,
      fontWeight:
        "900",
    },

    spentText: {
      color: "#9AA8B8",
      fontSize: 9,
      marginTop: 2,
    },

    progressBackgroundSmall: {
      height: 7,
      backgroundColor:
        "#E8EEF5",
      borderRadius: 999,
      overflow:
        "hidden",
      marginTop: 15,
    },

    progressFillSmall: {
      height: 7,
      borderRadius: 999,
    },

    budgetBottom: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginTop: 10,
    },

    bottomStatus: {
      flexDirection:
        "row",
      alignItems:
        "center",
      flex: 1,
    },

    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
    },

    remainingText: {
      fontSize: 10,
      fontWeight:
        "600",
    },

    hintText: {
      color: "#B0BBC8",
      fontSize: 8,
    },

    /* EMPTY */

    emptyState: {
      minHeight: 280,
      borderRadius: 23,
      backgroundColor:
        "rgba(255,255,255,0.72)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.95)",
      padding: 30,
      alignItems:
        "center",
      justifyContent:
        "center",

      shadowColor:
        "#163A63",
      shadowOffset: {
        width: 0,
        height: 7,
      },
      shadowOpacity:
        0.055,
      shadowRadius: 15,
      elevation: 2,
    },

    emptyIcon: {
      width: 58,
      height: 58,
      borderRadius: 19,
      backgroundColor:
        "#EEF5FF",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 12,
    },

    emptyTitle: {
      color: "#163A63",
      fontSize: 16,
      fontWeight:
        "900",
      marginBottom: 6,
    },

    emptyText: {
      color: "#7B8CA1",
      fontSize: 11,
      lineHeight: 18,
      textAlign:
        "center",
      maxWidth: 270,
    },

    createButton: {
      marginTop: 18,
      height: 45,
      paddingHorizontal: 19,
      borderRadius: 14,
      backgroundColor:
        "#2563EB",
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,

      shadowColor:
        "#2563EB",
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity:
        0.18,
      shadowRadius: 12,
      elevation: 3,
    },

    createButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight:
        "900",
    },

    /* PREMIUM */

    premiumCard: {
      minHeight: 190,
      borderRadius: 24,
      padding: 19,
      marginTop: 20,
      backgroundColor:
        "#EDF5FF",
      borderWidth: 1,
      borderColor:
        "#D6E6FA",
      overflow:
        "hidden",
    },

    premiumGlow: {
      position:
        "absolute",
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor:
        "#D8E9FF",
      right: -65,
      top: -70,
      opacity: 0.7,
    },

    premiumTop: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    premiumIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor:
        "#FBF5E8",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    proBadge: {
      backgroundColor:
        "#B88A24",
      borderRadius:
        999,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    proBadgeText: {
      color: "#FFFFFF",
      fontSize: 8,
      fontWeight:
        "900",
      letterSpacing: 1,
    },

    premiumTitle: {
      color: "#163A63",
      fontSize: 16,
      fontWeight:
        "900",
      marginTop: 14,
    },

    premiumDescription: {
      color: "#71849A",
      fontSize: 10,
      lineHeight: 17,
      marginTop: 5,
    },

    featureRow: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,
      marginTop: 14,
    },

    featureItem: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "rgba(255,255,255,0.65)",
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor:
        "#DDE9F8",
    },

    featureIcon: {
      marginRight: 5,
    },

    featureText: {
      color: "#60748A",
      fontSize: 8,
      fontWeight:
        "700",
    },
  });