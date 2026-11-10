import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import {
    Expense,
    getExpenses,
} from "../db/database";
import { requirePro } from "../services/proGuard";

const BLUE = "#2563EB";
const GOLD = "#B88A24";
const BG = "#F5F8FC";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";
const BORDER = "rgba(148,163,184,0.18)";
const GREEN = "#16A34A";
const RED = "#DC2626";

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

type Period = {
  key: string;
  label: string;
};

const PERIODS: Period[] = [
  {
    key: "this-month",
    label: "This Month",
  },
  {
    key: "last-month",
    label: "Last Month",
  },
  {
    key: "3-months",
    label: "3 Months",
  },
  {
    key: "all-time",
    label: "All Time",
  },
];

export default function ReportsScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] =
    useState("this-month");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const loadExpenses = async () => {
    if (!(await requirePro())) {
      return;
    }

    try {
      setLoading(true);

      const data = await getExpenses();

      setExpenses(data);
    } catch (error) {
      console.error(
        "❌ REPORTS LOAD ERROR:",
        error
      );
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
    return `Rs. ${Math.round(
      amount
    ).toLocaleString()}`;
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

    date.setMonth(
      date.getMonth() - 1
    );

    return getMonthKey(date);
  }, []);

  const threeMonthsAgo = useMemo(() => {
    const date = new Date();

    date.setMonth(
      date.getMonth() - 2
    );

    return date;
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        expenses.map(
          (expense) =>
            expense.category
        )
      )
    );

    return [
      "All",
      ...unique.sort(),
    ];
  }, [expenses]);

  const periodExpenses = useMemo(() => {
    const now = new Date();

    return expenses.filter(
      (expense) => {
        const date = new Date(
          expense.date
        );

        let matchesPeriod =
          true;

        switch (
          selectedPeriod
        ) {
          case "this-month":
            matchesPeriod =
              getMonthKey(
                date
              ) ===
              currentMonthKey;
            break;

          case "last-month":
            matchesPeriod =
              getMonthKey(
                date
              ) ===
              previousMonthKey;
            break;

          case "3-months":
            matchesPeriod =
              date >=
              threeMonthsAgo;
            break;

          case "all-time":
            matchesPeriod =
              true;
            break;
        }

        const matchesCategory =
          selectedCategory ===
            "All" ||
          expense.category ===
            selectedCategory;

        return (
          matchesPeriod &&
          matchesCategory
        );
      }
    );
  }, [
    expenses,
    selectedPeriod,
    selectedCategory,
    currentMonthKey,
    previousMonthKey,
    threeMonthsAgo,
  ]);

  const totalSpending =
    useMemo(() => {
      return periodExpenses.reduce(
        (sum, expense) =>
          sum +
          expense.amount,
        0
      );
    }, [periodExpenses]);

  const transactionCount =
    periodExpenses.length;

  const averageTransaction =
    transactionCount > 0
      ? totalSpending /
        transactionCount
      : 0;

  const categoryBreakdown =
    useMemo(() => {
      const map: Record<
        string,
        number
      > = {};

      periodExpenses.forEach(
        (expense) => {
          map[
            expense.category
          ] =
            (map[
              expense.category
            ] || 0) +
            expense.amount;
        }
      );

      return Object.entries(
        map
      )
        .map(
          ([
            category,
            amount,
          ]) => ({
            category,
            amount,
            percentage:
              totalSpending >
              0
                ? (amount /
                    totalSpending) *
                  100
                : 0,
          })
        )
        .sort(
          (a, b) =>
            b.amount -
            a.amount
        );
    }, [
      periodExpenses,
      totalSpending,
    ]);

  const topCategory =
    categoryBreakdown[0];

  const latestTransactions =
    useMemo(() => {
      return [
        ...periodExpenses,
      ]
        .sort(
          (a, b) =>
            new Date(
              b.date
            ).getTime() -
            new Date(
              a.date
            ).getTime()
        )
        .slice(0, 30);
    }, [
      periodExpenses,
    ]);

  const periodLabel =
    PERIODS.find(
      (period) =>
        period.key ===
        selectedPeriod
    )?.label ||
    "This Month";

  const formatDate = (
    dateString: string
  ) => {
    const date =
      new Date(
        dateString
      );

    return date.toLocaleDateString(
      "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const escapeCsv = (
    value: string
  ) => {
    return `"${value
      .replace(
        /"/g,
        '""'
      )}"`;
  };

  const generateCsv = () => {
    const header = [
      "Date",
      "Category",
      "Amount",
      "Note",
    ];

    const rows =
      latestTransactions.map(
        (expense) => [
          formatDate(
            expense.date
          ),
          expense.category,
          expense.amount.toString(),
          expense.note ||
            "",
        ]
      );

    return [
      header.join(","),
      ...rows.map(
        (row) =>
          [
            escapeCsv(
              row[0]
            ),
            escapeCsv(
              row[1]
            ),
            row[2],
            escapeCsv(
              row[3]
            ),
          ].join(
            ","
          )
      ),
    ].join(
      "\n"
    );
  };

  const handleExport =
    async () => {
      try {
        if (
          periodExpenses.length ===
          0
        ) {
          Alert.alert(
            "No Data",
            "There are no transactions to export for the selected filters."
          );

          return;
        }

        const csv =
          generateCsv();

        const fileName = `Spendly_Report_${Date.now()}.csv`;

        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(
          fileUri,
          csv,
          {
            encoding:
              FileSystem.EncodingType
                .UTF8,
          }
        );

        await Sharing.shareAsync(
          fileUri,
          {
            mimeType:
              "text/csv",
            dialogTitle:
              "Share Spendly Report",
            UTI: "public.comma-separated-values-text",
          }
        );
      } catch (error) {
        console.error(
          "❌ EXPORT ERROR:",
          error
        );

        Alert.alert(
          "Export Failed",
          "Something went wrong while creating your report."
        );
      }
    };

  const handleTransactionPress =
    (
      id: number
    ) => {
      router.push({
        pathname:
          "/edit-expense",
        params: {
          id: id.toString(),
        },
      });
    };

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <View
            style={
              styles.loadingIcon
            }
          >
            <Ionicons
              name="document-text-outline"
              size={28}
              color={
                BLUE
              }
            />
          </View>

          <ActivityIndicator
            size="small"
            color={
              BLUE
            }
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Preparing your report...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <View
        style={
          styles.orbTop
        }
      />

      <View
        style={
          styles.orbBottom
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.container
        }
      >
        {/* HEADER */}
        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
            activeOpacity={
              0.8
            }
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={
                TEXT
              }
            />
          </TouchableOpacity>

          <View
            style={
              styles.headerCenter
            }
          >
            <Text
              style={
                styles.headerTitle
              }
            >
              Reports & Export
            </Text>

            <Text
              style={
                styles.headerSubtitle
              }
            >
              Understand and export your spending
            </Text>
          </View>

          <View
            style={
              styles.proBadge
            }
          >
            <Ionicons
              name="diamond"
              size={15}
              color={
                GOLD
              }
            />
          </View>
        </View>

        {/* HERO */}
        <View
          style={
            styles.heroCard
          }
        >
          <View
            style={
              styles.heroGlowOne
            }
          />

          <View
            style={
              styles.heroGlowTwo
            }
          />

          <View
            style={
              styles.heroTop
            }
          >
            <View
              style={
                styles.heroContent
              }
            >
              <Text
                style={
                  styles.eyebrow
                }
              >
                SPENDLY PRO
              </Text>

              <Text
                style={
                  styles.heroTitle
                }
              >
                Your money,
                {"\n"}
                clearly reported.
              </Text>

              <Text
                style={
                  styles.heroDescription
                }
              >
                Review your spending and
                export a clean report whenever
                you need it.
              </Text>
            </View>

            <View
              style={
                styles.heroIcon
              }
            >
              <Ionicons
                name="document-text"
                size={28}
                color={
                  WHITE
                }
              />
            </View>
          </View>
        </View>

        {/* PERIOD FILTER */}
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
              Report Period
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Choose the data you want to analyse
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.periodScroll
          }
        >
          {PERIODS.map(
            (period) => {
              const active =
                selectedPeriod ===
                period.key;

              return (
                <TouchableOpacity
                  key={
                    period.key
                  }
                  style={[
                    styles.periodChip,
                    active &&
                      styles.periodChipActive,
                  ]}
                  onPress={() =>
                    setSelectedPeriod(
                      period.key
                    )
                  }
                  activeOpacity={
                    0.8
                  }
                >
                  <Text
                    style={[
                      styles.periodChipText,
                      active &&
                        styles.periodChipTextActive,
                    ]}
                  >
                    {
                      period.label
                    }
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>

        {/* CATEGORY FILTER */}
        {categories.length >
          1 && (
          <>
            <View
              style={
                styles.sectionHeaderSmall
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Category
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.periodScroll
              }
            >
              {categories.map(
                (
                  category
                ) => {
                  const active =
                    selectedCategory ===
                    category;

                  return (
                    <TouchableOpacity
                      key={
                        category
                      }
                      style={[
                        styles.categoryChip,
                        active &&
                          styles.categoryChipActive,
                      ]}
                      onPress={() =>
                        setSelectedCategory(
                          category
                        )
                      }
                      activeOpacity={
                        0.8
                      }
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          active &&
                            styles.categoryChipTextActive,
                        ]}
                      >
                        {
                          category
                        }
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>
          </>
        )}

        {/* SUMMARY */}
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
              Spending Summary
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              {periodLabel}
              {selectedCategory !==
                "All" &&
                ` • ${selectedCategory}`}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.summaryCard
          }
        >
          <Text
            style={
              styles.summaryLabel
            }
          >
            TOTAL SPENDING
          </Text>

          <Text
            style={
              styles.summaryAmount
            }
          >
            {formatAmount(
              totalSpending
            )}
          </Text>

          <View
            style={
              styles.summaryStats
            }
          >
            <View
              style={
                styles.summaryStat
              }
            >
              <View
                style={
                  styles.summaryStatIcon
                }
              >
                <Ionicons
                  name="receipt-outline"
                  size={16}
                  color={
                    BLUE
                  }
                />
              </View>

              <View>
                <Text
                  style={
                    styles.summaryStatLabel
                  }
                >
                  Transactions
                </Text>

                <Text
                  style={
                    styles.summaryStatValue
                  }
                >
                  {
                    transactionCount
                  }
                </Text>
              </View>
            </View>

            <View
              style={
                styles.summaryDivider
              }
            />

            <View
              style={
                styles.summaryStat
              }
            >
              <View
                style={
                  styles.summaryStatIcon
                }
              >
                <Ionicons
                  name="calculator-outline"
                  size={16}
                  color={
                    BLUE
                  }
                />
              </View>

              <View>
                <Text
                  style={
                    styles.summaryStatLabel
                  }
                >
                  Average
                </Text>

                <Text
                  style={
                    styles.summaryStatValue
                  }
                >
                  {formatAmount(
                    averageTransaction
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* TOP CATEGORY */}
        {topCategory && (
          <View
            style={
              styles.topCategoryCard
            }
          >
            <View
              style={
                styles.topCategoryIcon
              }
            >
              <Ionicons
                name={
                  CATEGORY_ICONS[
                    topCategory.category
                  ] ||
                  CATEGORY_ICONS.Other
                }
                size={22}
                color={
                  GOLD
                }
              />
            </View>

            <View
              style={
                styles.topCategoryContent
              }
            >
              <Text
                style={
                  styles.topCategoryLabel
                }
              >
                TOP CATEGORY
              </Text>

              <Text
                style={
                  styles.topCategoryName
                }
              >
                {
                  topCategory.category
                }
              </Text>

              <Text
                style={
                  styles.topCategoryAmount
                }
              >
                {formatAmount(
                  topCategory.amount
                )}{" "}
                •{" "}
                {Math.round(
                  topCategory.percentage
                )}
                % of spending
              </Text>
            </View>
          </View>
        )}

        {/* CATEGORY BREAKDOWN */}
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
              Category Breakdown
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Your spending distribution
            </Text>
          </View>
        </View>

        {categoryBreakdown.length ===
        0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="bar-chart-outline"
                size={25}
                color={
                  BLUE
                }
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No spending data
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              There are no transactions for the selected
              filters.
            </Text>
          </View>
        ) : (
          <View
            style={
              styles.glassCard
            }
          >
            {categoryBreakdown.map(
              (
                item,
                index
              ) => {
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

                return (
                  <View
                    key={
                      item.category
                    }
                    style={[
                      styles.breakdownRow,
                      index !==
                        categoryBreakdown.length -
                          1 &&
                        styles.rowDivider,
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
                        name={
                          icon
                        }
                        size={
                          18
                        }
                        color={
                          color
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.breakdownMain
                      }
                    >
                      <View
                        style={
                          styles.breakdownTop
                        }
                      >
                        <Text
                          style={
                            styles.breakdownName
                          }
                        >
                          {
                            item.category
                          }
                        </Text>

                        <Text
                          style={
                            styles.breakdownAmount
                          }
                        >
                          {formatAmount(
                            item.amount
                          )}
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
                                item.percentage,
                                100
                              )}%`,
                              backgroundColor:
                                color,
                            },
                          ]}
                        />
                      </View>

                      <Text
                        style={
                          styles.breakdownPercentage
                        }
                      >
                        {Math.round(
                          item.percentage
                        )}
                        % of total
                      </Text>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        )}

        {/* EXPORT */}
        <View
          style={
            styles.exportCard
          }
        >
          <View
            style={
              styles.exportIcon
            }
          >
            <Ionicons
              name="share-outline"
              size={24}
              color={
                BLUE
              }
            />
          </View>

          <View
            style={
              styles.exportContent
            }
          >
            <Text
              style={
                styles.exportTitle
              }
            >
              Export Report
            </Text>

            <Text
              style={
                styles.exportText
              }
            >
              Create a CSV report using the
              current filters and share it
              anywhere.
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.exportButton
            }
            onPress={
              handleExport
            }
            activeOpacity={
              0.85
            }
          >
            <Ionicons
              name="download-outline"
              size={18}
              color={
                WHITE
              }
            />

            <Text
              style={
                styles.exportButtonText
              }
            >
              Export
            </Text>
          </TouchableOpacity>
        </View>

        {/* TRANSACTIONS */}
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
              Transactions
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              {periodExpenses.length >
              30
                ? "Showing latest 30 transactions"
                : `${periodExpenses.length} transaction${
                    periodExpenses.length ===
                    1
                      ? ""
                      : "s"
                  }`}
            </Text>
          </View>
        </View>

        {latestTransactions.length ===
        0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="receipt-outline"
                size={25}
                color={
                  BLUE
                }
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No transactions
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              No expenses match your
              current report filters.
            </Text>
          </View>
        ) : (
          <View
            style={
              styles.transactionsCard
            }
          >
            {latestTransactions.map(
              (
                expense,
                index
              ) => {
                const color =
                  CATEGORY_COLORS[
                    expense.category
                  ] ||
                  CATEGORY_COLORS.Other;

                const icon =
                  CATEGORY_ICONS[
                    expense.category
                  ] ||
                  CATEGORY_ICONS.Other;

                return (
                  <TouchableOpacity
                    key={
                      expense.id
                    }
                    style={[
                      styles.transactionRow,
                      index !==
                        latestTransactions.length -
                          1 &&
                        styles.rowDivider,
                    ]}
                    onPress={() =>
                      handleTransactionPress(
                        expense.id
                      )
                    }
                    activeOpacity={
                      0.75
                    }
                  >
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor:
                            `${color}15`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          icon
                        }
                        size={
                          18
                        }
                        color={
                          color
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.transactionMain
                      }
                    >
                      <Text
                        style={
                          styles.transactionCategory
                        }
                      >
                        {
                          expense.category
                        }
                      </Text>

                      <Text
                        style={
                          styles.transactionNote
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {expense.note ||
                          "No note"}
                      </Text>

                      <Text
                        style={
                          styles.transactionDate
                        }
                      >
                        {formatDate(
                          expense.date
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.transactionRight
                      }
                    >
                      <Text
                        style={
                          styles.transactionAmount
                        }
                      >
                        {formatAmount(
                          expense.amount
                        )}
                      </Text>

                      <Ionicons
                        name="chevron-forward"
                        size={15}
                        color={
                          MUTED
                        }
                      />
                    </View>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        )}

        {/* FOOTER */}
        <View
          style={
            styles.footer
          }
        >
          <View
            style={
              styles.footerIcon
            }
          >
            <Ionicons
              name="diamond"
              size={18}
              color={
                GOLD
              }
            />
          </View>

          <Text
            style={
              styles.footerTitle
            }
          >
            Spendly Pro
          </Text>

          <Text
            style={
              styles.footerText
            }
          >
            Your spending. Your data. Your
            decisions.
          </Text>

          <Text
            style={
              styles.tagline
            }
          >
            Smart Spending, Brighter Tomorrows
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      BG,
  },

  orbTop: {
    position:
      "absolute",
    width: 230,
    height: 230,
    borderRadius:
      115,
    backgroundColor:
      "#DCEBFF",
    opacity: 0.5,
    top: -100,
    right: -110,
  },

  orbBottom: {
    position:
      "absolute",
    width: 190,
    height: 190,
    borderRadius:
      95,
    backgroundColor:
      "#F5E8C8",
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
    alignItems:
      "center",
    justifyContent:
      "center",
    gap: 14,
  },

  loadingIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor:
      "#EAF2FF",
    alignItems:
      "center",
    justifyContent:
      "center",
  },

  loadingText: {
    color: MUTED,
    fontSize: 14,
    fontWeight:
      "600",
  },

  header: {
    flexDirection:
      "row",
    alignItems:
      "center",
    marginBottom:
      18,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor:
      BORDER,
    alignItems:
      "center",
    justifyContent:
      "center",
  },

  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight:
      "800",
    letterSpacing:
      -0.4,
  },

  headerSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
    fontWeight:
      "500",
  },

  proBadge: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor:
      "rgba(184,138,36,0.12)",
    alignItems:
      "center",
    justifyContent:
      "center",
    borderWidth: 1,
    borderColor:
      "rgba(184,138,36,0.22)",
  },

  heroCard: {
    minHeight: 190,
    borderRadius: 28,
    padding: 22,
    marginBottom:
      24,
    overflow:
      "hidden",
    backgroundColor:
      BLUE,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.35)",
  },

  heroGlowOne: {
    position:
      "absolute",
    width: 190,
    height: 190,
    borderRadius:
      95,
    backgroundColor:
      "rgba(255,255,255,0.08)",
    right: -80,
    top: -90,
  },

  heroGlowTwo: {
    position:
      "absolute",
    width: 130,
    height: 130,
    borderRadius:
      65,
    backgroundColor:
      "rgba(184,138,36,0.20)",
    left: -60,
    bottom: -60,
  },

  heroTop: {
    flexDirection:
      "row",
    alignItems:
      "flex-start",
    justifyContent:
      "space-between",
  },

  heroContent: {
    flex: 1,
  },

  eyebrow: {
    color:
      "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight:
      "900",
    letterSpacing:
      1.8,
    marginBottom:
      7,
  },

  heroTitle: {
    color: WHITE,
    fontSize: 27,
    fontWeight:
      "900",
    letterSpacing:
      -0.8,
  },

  heroDescription: {
    color:
      "rgba(255,255,255,0.82)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 270,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor:
      "rgba(255,255,255,0.12)",
    alignItems:
      "center",
    justifyContent:
      "center",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.18)",
  },

  sectionHeader: {
    flexDirection:
      "row",
    alignItems:
      "flex-end",
    justifyContent:
      "space-between",
    marginBottom:
      11,
    marginTop: 2,
  },

  sectionHeaderSmall: {
    marginTop: 1,
    marginBottom: 8,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight:
      "800",
    letterSpacing:
      -0.3,
  },

  sectionSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
  },

  periodScroll: {
    paddingBottom: 18,
    paddingRight: 10,
  },

  periodChip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    backgroundColor:
      "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor:
      BORDER,
    alignItems:
      "center",
    justifyContent:
      "center",
    marginRight: 8,
  },

  periodChipActive: {
    backgroundColor:
      BLUE,
    borderColor:
      BLUE,
  },

  periodChipText: {
    color: MUTED,
    fontSize: 11,
    fontWeight:
      "800",
  },

  periodChipTextActive: {
    color: WHITE,
  },

  categoryChip: {
    paddingHorizontal: 15,
    height: 36,
    borderRadius: 18,
    backgroundColor:
      "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor:
      BORDER,
    alignItems:
      "center",
    justifyContent:
      "center",
    marginRight: 8,
  },

  categoryChipActive: {
    backgroundColor:
      "#EAF2FF",
    borderColor:
      "#BBD3FF",
  },

  categoryChipText: {
    color: MUTED,
    fontSize: 10,
    fontWeight:
      "800",
  },

  categoryChipTextActive: {
    color: BLUE,
  },

  summaryCard: {
    backgroundColor:
      "rgba(255,255,255,0.82)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor:
      BORDER,
    padding: 20,
    marginBottom:
      12,
  },

  summaryLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight:
      "900",
    letterSpacing:
      1.2,
  },

  summaryAmount: {
    color: TEXT,
    fontSize: 31,
    fontWeight:
      "900",
    letterSpacing:
      -0.8,
    marginTop: 4,
  },

  summaryStats: {
    flexDirection:
      "row",
    alignItems:
      "center",
    marginTop: 18,
  },

  summaryStat: {
    flex: 1,
    flexDirection:
      "row",
    alignItems:
      "center",
  },

  summaryStatIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor:
      "#EAF2FF",
    alignItems:
      "center",
    justifyContent:
      "center",
    marginRight: 9,
  },

  summaryStatLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight:
      "700",
  },

  summaryStatValue: {
    color: TEXT,
    fontSize: 13,
    fontWeight:
      "900",
    marginTop: 2,
  },

  summaryDivider: {
    width: 1,
    height: 38,
    backgroundColor:
      "rgba(148,163,184,0.16)",
    marginHorizontal: 10,
  },

  topCategoryCard: {
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderRadius: 23,
    borderWidth: 1,
    borderColor:
      "rgba(184,138,36,0.22)",
    padding: 17,
    flexDirection:
      "row",
    alignItems:
      "center",
    marginBottom:
      23,
  },

  topCategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor:
      "rgba(184,138,36,0.12)",
    alignItems:
      "center",
    justifyContent:
      "center",
  },

  topCategoryContent: {
    marginLeft: 13,
    flex: 1,
  },

  topCategoryLabel: {
    color: GOLD,
    fontSize: 8,
    fontWeight:
      "900",
    letterSpacing:
      1.1,
  },

  topCategoryName: {
    color: TEXT,
    fontSize: 16,
    fontWeight:
      "900",
    marginTop: 3,
  },

  topCategoryAmount: {
    color: MUTED,
    fontSize: 10,
    marginTop: 3,
  },

  glassCard: {
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor:
      BORDER,
    paddingHorizontal: 17,
    marginBottom:
      23,
  },

  breakdownRow: {
    flexDirection:
      "row",
    paddingVertical:
      17,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor:
      "rgba(148,163,184,0.12)",
  },

  categoryIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems:
      "center",
    justifyContent:
      "center",
  },

  breakdownMain: {
    flex: 1,
    marginLeft: 13,
  },

  breakdownTop: {
    flexDirection:
      "row",
    justifyContent:
      "space-between",
    alignItems:
      "center",
  },

  breakdownName: {
    color: TEXT,
    fontSize: 13,
    fontWeight:
      "800",
  },

  breakdownAmount: {
    color: TEXT,
    fontSize: 12,
    fontWeight:
      "900",
  },

  progressTrack: {
    height: 7,
    backgroundColor:
      "#E8EDF5",
    borderRadius: 10,
    overflow:
      "hidden",
    marginTop: 9,
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
  },

  breakdownPercentage: {
    color: MUTED,
    fontSize: 9,
    marginTop: 4,
    fontWeight:
      "600",
  },

  exportCard: {
    backgroundColor:
      "rgba(255,255,255,0.82)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor:
      BORDER,
    padding: 17,
    flexDirection:
      "row",
    alignItems:
      "center",
    marginBottom:
      23,
  },

  exportIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor:
      "#EAF2FF",
    alignItems:
      "center",
    justifyContent:
      "center",
  },

  exportContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },

  exportTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight:
      "900",
  },

  exportText: {
    color: MUTED,
    fontSize: 9.5,
    lineHeight: 15,
    marginTop: 3,
  },

  exportButton: {
    backgroundColor:
      BLUE,
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 13,
    flexDirection:
      "row",
    alignItems:
      "center",
    justifyContent:
      "center",
  },

  exportButtonText: {
    color: WHITE,
    fontSize: 10,
    fontWeight:
      "900",
    marginLeft: 5,
  },

  transactionsCard: {
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor:
      BORDER,
    paddingHorizontal: 17,
    marginBottom:
      23,
  },

  transactionRow: {
    flexDirection:
      "row",
    alignItems:
      "center",
    paddingVertical:
      16,
  },

  transactionIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems:
      "center",
    justifyContent:
      "center",
  },

  transactionMain: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  transactionCategory: {
    color: TEXT,
    fontSize: 12,
    fontWeight:
      "900",
  },

  transactionNote: {
    color: MUTED,
    fontSize: 9.5,
    marginTop: 2,
  },

  transactionDate: {
    color: MUTED,
    fontSize: 8.5,
    marginTop: 3,
  },

  transactionRight: {
    alignItems:
      "flex-end",
    flexDirection:
      "row",
    gap: 5,
  },

  transactionAmount: {
    color: TEXT,
    fontSize: 12,
    fontWeight:
      "900",
  },

  emptyCard: {
    backgroundColor:
      "rgba(255,255,255,0.75)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor:
      BORDER,
    padding: 25,
    alignItems:
      "center",
    marginBottom:
      23,
  },

  emptyIcon: {
    width: 53,
    height: 53,
    borderRadius: 18,
    backgroundColor:
      "#EAF2FF",
    alignItems:
      "center",
    justifyContent:
      "center",
    marginBottom:
      12,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight:
      "800",
    textAlign:
      "center",
  },

  emptyText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 17,
    textAlign:
      "center",
    marginTop: 5,
    maxWidth: 290,
  },

  footer: {
    alignItems:
      "center",
    paddingTop: 12,
    paddingBottom: 20,
  },

  footerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor:
      "rgba(184,138,36,0.12)",
    alignItems:
      "center",
    justifyContent:
      "center",
    marginBottom: 9,
  },

  footerTitle: {
    color: TEXT,
    fontSize: 12,
    fontWeight:
      "900",
  },

  footerText: {
    color: MUTED,
    fontSize: 10,
    textAlign:
      "center",
    marginTop: 4,
  },

  tagline: {
    color: GOLD,
    fontSize: 10,
    fontWeight:
      "800",
    marginTop: 10,
    letterSpacing:
      0.2,
  },
});