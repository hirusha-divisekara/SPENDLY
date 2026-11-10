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

const BLUE = "#2563EB";
const GOLD = "#B88A24";
const BG = "#F5F8FC";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";

const BORDER =
  "rgba(148,163,184,0.18)";

type DateFilter =
  | "month"
  | "lastMonth"
  | "threeMonths"
  | "all";

const DATE_FILTERS: {
  id: DateFilter;
  label: string;
}[] = [
  {
    id: "month",
    label: "This Month",
  },
  {
    id: "lastMonth",
    label: "Last Month",
  },
  {
    id: "threeMonths",
    label: "3 Months",
  },
  {
    id: "all",
    label: "All Time",
  },
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

export default function ReportsScreen() {
  const [
    expenses,
    setExpenses,
  ] = useState<Expense[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    dateFilter,
    setDateFilter,
  ] =
    useState<DateFilter>(
      "month"
    );

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState("All");

  const [
    exporting,
    setExporting,
  ] = useState(false);

  /*
   * LOAD EXPENSES
   */
  const loadExpenses =
    async () => {
      try {
        setLoading(true);

        const data =
          await getExpenses();

        setExpenses(data);
      } catch (error) {
        console.error(
          "REPORTS LOAD ERROR:",
          error
        );

        Alert.alert(
          "Unable to load reports",
          "Something went wrong while loading your expenses."
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

  /*
   * FORMAT LKR
   */
  const formatAmount =
    (
      amount: number
    ) => {
      return `Rs. ${amount.toLocaleString(
        "en-LK",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`;
    };

  /*
   * FORMAT DATE
   */
  const formatDate =
    (
      dateString: string
    ) => {
      const date =
        new Date(
          dateString
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return dateString;
      }

      return date.toLocaleDateString(
        "en-LK",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    };

  /*
   * CATEGORY COLOR
   */
  const getCategoryColor =
    (
      category: string
    ) => {
      return (
        CATEGORY_COLORS[
          category
        ] ||
        "#64748B"
      );
    };

  /*
   * CATEGORY ICON
   */
  const getCategoryIcon =
    (
      category: string
    ): any => {
      return (
        CATEGORY_ICONS[
          category
        ] ||
        "pricetag-outline"
      );
    };

  /*
   * CATEGORY LIST
   *
   * This is generated from
   * actual expenses, so
   * custom categories work.
   */
  const categories =
    useMemo(() => {
      const unique =
        Array.from(
          new Set(
            expenses.map(
              (expense) =>
                expense.category
            )
          )
        );

      return [
        "All",
        ...unique.sort(
          (a, b) =>
            a.localeCompare(
              b
            )
        ),
      ];
    }, [expenses]);

  /*
   * DATE FILTER
   */
  const filteredByDate =
    useMemo(() => {
      const now =
        new Date();

      return expenses.filter(
        (expense) => {
          const expenseDate =
            new Date(
              expense.date
            );

          if (
            Number.isNaN(
              expenseDate.getTime()
            )
          ) {
            return false;
          }

          /*
           * ALL TIME
           */
          if (
            dateFilter ===
            "all"
          ) {
            return true;
          }

          /*
           * THIS MONTH
           */
          if (
            dateFilter ===
            "month"
          ) {
            return (
              expenseDate.getMonth() ===
                now.getMonth() &&
              expenseDate.getFullYear() ===
                now.getFullYear()
            );
          }

          /*
           * LAST MONTH
           */
          if (
            dateFilter ===
            "lastMonth"
          ) {
            const lastMonth =
              new Date(
                now.getFullYear(),
                now.getMonth() -
                  1,
                1
              );

            return (
              expenseDate.getMonth() ===
                lastMonth.getMonth() &&
              expenseDate.getFullYear() ===
                lastMonth.getFullYear()
            );
          }

          /*
           * LAST 3 MONTHS
           */
          if (
            dateFilter ===
            "threeMonths"
          ) {
            const threeMonthsAgo =
              new Date(
                now
              );

            threeMonthsAgo.setMonth(
              now.getMonth() -
                2
            );

            threeMonthsAgo.setHours(
              0,
              0,
              0,
              0
            );

            return (
              expenseDate >=
              threeMonthsAgo
            );
          }

          return true;
        }
      );
    }, [
      expenses,
      dateFilter,
    ]);

  /*
   * CATEGORY FILTER
   */
  const filteredExpenses =
    useMemo(() => {
      if (
        categoryFilter ===
        "All"
      ) {
        return filteredByDate;
      }

      return filteredByDate.filter(
        (expense) =>
          expense.category ===
          categoryFilter
      );
    }, [
      filteredByDate,
      categoryFilter,
    ]);

  /*
   * TOTAL
   */
  const totalSpent =
    useMemo(() => {
      return filteredExpenses.reduce(
        (
          total,
          expense
        ) =>
          total +
          expense.amount,
        0
      );
    }, [
      filteredExpenses,
    ]);

  /*
   * TRANSACTION COUNT
   */
  const transactionCount =
    filteredExpenses.length;

  /*
   * AVERAGE
   */
  const averageTransaction =
    transactionCount >
    0
      ? totalSpent /
        transactionCount
      : 0;

  /*
   * CATEGORY BREAKDOWN
   */
  const categoryData =
    useMemo(() => {
      const totals: Record<
        string,
        number
      > = {};

      filteredExpenses.forEach(
        (expense) => {
          totals[
            expense.category
          ] =
            (totals[
              expense.category
            ] ||
              0) +
            expense.amount;
        }
      );

      return Object.entries(
        totals
      )
        .map(
          ([
            category,
            amount,
          ]) => ({
            category,
            amount,
            percentage:
              totalSpent >
              0
                ? (amount /
                    totalSpent) *
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
      filteredExpenses,
      totalSpent,
    ]);

  /*
   * TOP CATEGORY
   */
  const topCategory =
    categoryData[0];

  /*
   * PERIOD LABEL
   */
  const periodLabel =
    DATE_FILTERS.find(
      (item) =>
        item.id ===
        dateFilter
    )?.label ||
    "All Time";

  /*
   * CSV ESCAPE
   */
  const escapeCsv =
    (
      value: string
    ) => {
      const stringValue =
        String(
          value
        );

      if (
        stringValue.includes(
          ","
        ) ||
        stringValue.includes(
          '"'
        ) ||
        stringValue.includes(
          "\n"
        )
      ) {
        return `"${stringValue.replace(
          /"/g,
          '""'
        )}"`;
      }

      return stringValue;
    };

  /*
   * CREATE CSV
   */
  const createCsv =
    () => {
      const header =
        [
          "Date",
          "Category",
          "Note",
          "Amount (LKR)",
        ].join(
          ","
        );

      const rows =
        filteredExpenses.map(
          (
            expense
          ) => {
            return [
              escapeCsv(
                formatDate(
                  expense.date
                )
              ),
              escapeCsv(
                expense.category
              ),
              escapeCsv(
                expense.note ||
                  ""
              ),
              expense.amount.toFixed(
                2
              ),
            ].join(
              ","
            );
          }
        );

      return [
        header,
        ...rows,
      ].join(
        "\n"
      );
    };

  /*
   * EXPORT
   */
  const handleExport =
    async () => {
      if (
        filteredExpenses.length ===
        0
      ) {
        Alert.alert(
          "Nothing to export",
          "There are no expenses in the selected report."
        );

        return;
      }

      try {
        setExporting(
          true
        );

        const csv =
          createCsv();

        const fileName =
          `Spendly_Report_${Date.now()}.csv`;

        const fileUri =
          `${FileSystem.cacheDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(
          fileUri,
          csv,
          {
            encoding:
              FileSystem.EncodingType.UTF8,
          }
        );

        const canShare =
          await Sharing.isAvailableAsync();

        if (
          !canShare
        ) {
          Alert.alert(
            "Export created",
            "The report was generated, but sharing is not available on this device."
          );

          return;
        }

        await Sharing.shareAsync(
          fileUri,
          {
            mimeType:
              "text/csv",
            dialogTitle:
              "Share Spendly Report",
            UTI:
              "public.comma-separated-values-text",
          }
        );
      } catch (error) {
        console.error(
          "REPORT EXPORT ERROR:",
          error
        );

        Alert.alert(
          "Export failed",
          "Spendly could not create the report."
        );
      } finally {
        setExporting(
          false
        );
      }
    };

  /*
   * LOADING
   */
  if (
    loading
  ) {
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
              name="bar-chart-outline"
              size={28}
              color={BLUE}
            />
          </View>

          <ActivityIndicator
            size="small"
            color={BLUE}
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Preparing your
            report...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      {/* Background */}
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
        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

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
              name="chevron-back"
              size={23}
              color={TEXT}
            />
          </TouchableOpacity>

          <View
            style={
              styles.headerCenter
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
                styles.title
              }
            >
              Reports
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Your spending,
              clearly understood.
            </Text>
          </View>

          <View
            style={
              styles.headerBadge
            }
          >
            <Ionicons
              name="bar-chart-outline"
              size={19}
              color={GOLD}
            />
          </View>
        </View>

        {/* ========================= */}
        {/* SUMMARY */}
        {/* ========================= */}

        <View
          style={
            styles.summaryCard
          }
        >
          <View
            style={
              styles.summaryTop
            }
          >
            <View>
              <Text
                style={
                  styles.summaryLabel
                }
              >
                TOTAL SPENDING
              </Text>

              <Text
                style={
                  styles.totalAmount
                }
              >
                {formatAmount(
                  totalSpent
                )}
              </Text>
            </View>

            <View
              style={
                styles.summaryIcon
              }
            >
              <Ionicons
                name="wallet-outline"
                size={24}
                color={BLUE}
              />
            </View>
          </View>

          <View
            style={
              styles.summaryDivider
            }
          />

          <View
            style={
              styles.summaryStats
            }
          >
            <View
              style={
                styles.statItem
              }
            >
              <Text
                style={
                  styles.statValue
                }
              >
                {
                  transactionCount
                }
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Transactions
              </Text>
            </View>

            <View
              style={
                styles.statDivider
              }
            />

            <View
              style={
                styles.statItem
              }
            >
              <Text
                style={
                  styles.statValue
                }
              >
                {formatAmount(
                  averageTransaction
                )}
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Average
              </Text>
            </View>

            <View
              style={
                styles.statDivider
              }
            />

            <View
              style={
                styles.statItem
              }
            >
              <Text
                numberOfLines={
                  1
                }
                style={
                  styles.statValue
                }
              >
                {topCategory
                  ? topCategory.category
                  : "—"}
              </Text>

              <Text
                style={
                  styles.statLabel
                }
              >
                Top Category
              </Text>
            </View>
          </View>
        </View>

        {/* ========================= */}
        {/* DATE FILTER */}
        {/* ========================= */}

        <View
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Report Period
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.filterRow
            }
          >
            {DATE_FILTERS.map(
              (
                filter
              ) => {
                const active =
                  dateFilter ===
                  filter.id;

                return (
                  <TouchableOpacity
                    key={
                      filter.id
                    }
                    style={[
                      styles.filterChip,
                      active &&
                        styles.filterChipActive,
                    ]}
                    onPress={() => {
                      setDateFilter(
                        filter.id
                      );

                      setCategoryFilter(
                        "All"
                      );
                    }}
                    activeOpacity={
                      0.8
                    }
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active &&
                          styles.filterTextActive,
                      ]}
                    >
                      {
                        filter.label
                      }
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </ScrollView>
        </View>

        {/* ========================= */}
        {/* CATEGORY FILTER */}
        {/* ========================= */}

        <View
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Category
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.filterRow
            }
          >
            {categories.map(
              (
                category
              ) => {
                const active =
                  categoryFilter ===
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
                      setCategoryFilter(
                        category
                      )
                    }
                    activeOpacity={
                      0.8
                    }
                  >
                    {category !==
                      "All" && (
                      <Ionicons
                        name={getCategoryIcon(
                          category
                        )}
                        size={
                          14
                        }
                        color={
                          active
                            ? WHITE
                            : getCategoryColor(
                                category
                              )
                        }
                      />
                    )}

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
        </View>

        {/* ========================= */}
        {/* BREAKDOWN */}
        {/* ========================= */}

        <View
          style={
            styles.glassCard
          }
        >
          <View
            style={
              styles.cardHeader
            }
          >
            <View>
              <Text
                style={
                  styles.cardTitle
                }
              >
                Spending Breakdown
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }
              >
                {
                  periodLabel
                }
              </Text>
            </View>

            <Ionicons
              name="pie-chart-outline"
              size={21}
              color={BLUE}
            />
          </View>

          {categoryData.length ===
          0 ? (
            <View
              style={
                styles.emptyBreakdown
              }
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <Ionicons
                  name="analytics-outline"
                  size={28}
                  color={MUTED}
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
                Add expenses to
                generate your
                report.
              </Text>
            </View>
          ) : (
            categoryData.map(
              (
                item
              ) => {
                const color =
                  getCategoryColor(
                    item.category
                  );

                return (
                  <View
                    key={
                      item.category
                    }
                    style={
                      styles.breakdownItem
                    }
                  >
                    <View
                      style={
                        styles.breakdownTop
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
                              item.category
                            )}
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
                            styles.categoryInfo
                          }
                        >
                          <Text
                            style={
                              styles.categoryName
                            }
                          >
                            {
                              item.category
                            }
                          </Text>

                          <Text
                            style={
                              styles.categoryPercentage
                            }
                          >
                            {item.percentage.toFixed(
                              1
                            )}
                            %
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={
                          styles.categoryAmount
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
                  </View>
                );
              }
            )
          )}
        </View>

        {/* ========================= */}
        {/* TRANSACTIONS */}
        {/* ========================= */}

        <View
          style={
            styles.glassCard
          }
        >
          <View
            style={
              styles.cardHeader
            }
          >
            <View>
              <Text
                style={
                  styles.cardTitle
                }
              >
                Transactions
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }
              >
                {
                  transactionCount
                }{" "}
                recorded
              </Text>
            </View>

            <Ionicons
              name="receipt-outline"
              size={21}
              color={BLUE}
            />
          </View>

          {filteredExpenses.length ===
          0 ? (
            <View
              style={
                styles.emptyBreakdown
              }
            >
              <Text
                style={
                  styles.emptyTitle
                }
              >
                Nothing here
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Try changing your
                filters.
              </Text>
            </View>
          ) : (
            filteredExpenses
              .slice(
                0,
                30
              )
              .map(
                (
                  expense
                ) => {
                  const color =
                    getCategoryColor(
                      expense.category
                    );

                  return (
                    <TouchableOpacity
                      key={
                        expense.id
                      }
                      style={
                        styles.transaction
                      }
                      activeOpacity={
                        0.75
                      }
                      onPress={() =>
                        router.push({
                          pathname:
                            "/edit-expense",
                          params:
                            {
                              id: String(
                                expense.id
                              ),
                            },
                        })
                      }
                    >
                      <View
                        style={[
                          styles.transactionIcon,
                          {
                            backgroundColor:
                              `${color}18`,
                          },
                        ]}
                      >
                        <Ionicons
                          name={getCategoryIcon(
                            expense.category
                          )}
                          size={
                            19
                          }
                          color={
                            color
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.transactionInfo
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
                            "Expense"}
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
                          -{" "}
                          {formatAmount(
                            expense.amount
                          )}
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
                    </TouchableOpacity>
                  );
                }
              )
          )}

          {filteredExpenses.length >
            30 && (
            <Text
              style={
                styles.moreText
              }
            >
              Showing the first 30
              transactions
            </Text>
          )}
        </View>

        {/* ========================= */}
        {/* EXPORT */}
        {/* ========================= */}

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
              name="download-outline"
              size={24}
              color={GOLD}
            />
          </View>

          <View
            style={
              styles.exportInfo
            }
          >
            <Text
              style={
                styles.exportTitle
              }
            >
              Export your report
            </Text>

            <Text
              style={
                styles.exportDescription
              }
            >
              Share your filtered
              spending data as
              a CSV file.
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.exportButton
            }
            onPress={
              handleExport
            }
            disabled={
              exporting
            }
            activeOpacity={
              0.85
            }
          >
            {exporting ? (
              <ActivityIndicator
                size="small"
                color={
                  WHITE
                }
              />
            ) : (
              <Ionicons
                name="share-outline"
                size={20}
                color={
                  WHITE
                }
              />
            )}
          </TouchableOpacity>
        </View>

        {/* ========================= */}
        {/* FOOTER */}
        {/* ========================= */}

        <View
          style={
            styles.footer
          }
        >
          <Text
            style={
              styles.footerBrand
            }
          >
            Spendly
          </Text>

          <Text
            style={
              styles.footerTagline
            }
          >
            Smart Spending,
            Brighter Tomorrows
          </Text>

          <Text
            style={
              styles.footerNote
            }
          >
            Your financial data
            stays on your device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: BG,
    },

    content: {
      padding: 20,
      paddingBottom: 50,
    },

    backgroundOrbOne: {
      position:
        "absolute",
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor:
        "rgba(37,99,235,0.07)",
      top: -100,
      right: -110,
    },

    backgroundOrbTwo: {
      position:
        "absolute",
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor:
        "rgba(184,138,36,0.06)",
      bottom: 100,
      left: -130,
    },

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: BG,
    },

    loadingIcon: {
      width: 62,
      height: 62,
      borderRadius: 22,
      backgroundColor:
        "rgba(37,99,235,0.08)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 15,
    },

    loadingText: {
      marginTop: 12,
      fontSize: 12,
      color: MUTED,
      fontWeight: "600",
    },

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 24,
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
      shadowColor:
        "#0F172A",
      shadowOpacity:
        0.04,
      shadowRadius:
        12,
      shadowOffset: {
        width: 0,
        height: 5,
      },
      elevation: 2,
    },

    headerCenter: {
      flex: 1,
      marginLeft: 14,
    },

    eyebrow: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
      color: BLUE,
      marginBottom: 2,
    },

    title: {
      fontSize: 26,
      fontWeight: "800",
      color: TEXT,
    },

    subtitle: {
      fontSize: 12,
      color: MUTED,
      marginTop: 2,
    },

    headerBadge: {
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

    summaryCard: {
      backgroundColor:
        "rgba(255,255,255,0.82)",
      borderRadius: 28,
      borderWidth: 1,
      borderColor:
        "rgba(37,99,235,0.12)",
      padding: 22,
      marginBottom: 24,
      shadowColor:
        "#0F172A",
      shadowOpacity:
        0.06,
      shadowRadius:
        20,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      elevation: 3,
    },

    summaryTop: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
    },

    summaryLabel: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.3,
      color: MUTED,
      marginBottom: 8,
    },

    totalAmount: {
      fontSize: 29,
      fontWeight: "900",
      color: TEXT,
    },

    summaryIcon: {
      width: 48,
      height: 48,
      borderRadius: 17,
      backgroundColor:
        "#EAF1FF",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    summaryDivider: {
      height: 1,
      backgroundColor:
        "rgba(148,163,184,0.16)",
      marginVertical: 20,
    },

    summaryStats: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    statItem: {
      flex: 1,
      alignItems:
        "center",
      minWidth: 0,
    },

    statValue: {
      fontSize: 12,
      fontWeight: "800",
      color: TEXT,
      textAlign: "center",
      maxWidth: "100%",
    },

    statLabel: {
      fontSize: 9,
      color: MUTED,
      marginTop: 5,
      textAlign: "center",
    },

    statDivider: {
      width: 1,
      height: 30,
      backgroundColor:
        "rgba(148,163,184,0.18)",
    },

    section: {
      marginBottom: 20,
    },

    sectionTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: TEXT,
      marginBottom: 11,
    },

    filterRow: {
      gap: 9,
    },

    filterChip: {
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 15,
      backgroundColor:
        "rgba(255,255,255,0.76)",
      borderWidth: 1,
      borderColor:
        BORDER,
    },

    filterChipActive: {
      backgroundColor: BLUE,
      borderColor: BLUE,
    },

    filterText: {
      fontSize: 12,
      fontWeight: "700",
      color: MUTED,
    },

    filterTextActive: {
      color: WHITE,
    },

    categoryChip: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 15,
      backgroundColor:
        "rgba(255,255,255,0.76)",
      borderWidth: 1,
      borderColor:
        BORDER,
    },

    categoryChipActive: {
      backgroundColor: BLUE,
      borderColor: BLUE,
    },

    categoryChipText: {
      fontSize: 12,
      fontWeight: "700",
      color: MUTED,
    },

    categoryChipTextActive: {
      color: WHITE,
    },

    glassCard: {
      backgroundColor:
        "rgba(255,255,255,0.78)",
      borderRadius: 25,
      borderWidth: 1,
      borderColor:
        BORDER,
      padding: 19,
      marginBottom: 20,
      shadowColor:
        "#0F172A",
      shadowOpacity: 0.04,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      elevation: 2,
    },

    cardHeader: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      justifyContent:
        "space-between",
      marginBottom: 18,
    },

    cardTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: TEXT,
    },

    cardSubtitle: {
      fontSize: 11,
      color: MUTED,
      marginTop: 4,
    },

    breakdownItem: {
      marginBottom: 18,
    },

    breakdownTop: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 9,
    },

    categoryLeft: {
      flexDirection:
        "row",
      alignItems:
        "center",
      flex: 1,
      minWidth: 0,
    },

    categoryIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 10,
    },

    categoryInfo: {
      flex: 1,
      minWidth: 0,
    },

    categoryName: {
      fontSize: 12,
      fontWeight: "800",
      color: TEXT,
    },

    categoryPercentage: {
      fontSize: 10,
      color: MUTED,
      marginTop: 2,
    },

    categoryAmount: {
      fontSize: 12,
      fontWeight: "800",
      color: TEXT,
      marginLeft: 10,
    },

    progressTrack: {
      height: 7,
      borderRadius: 10,
      backgroundColor:
        "#E9EEF5",
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      borderRadius: 10,
    },

    transaction: {
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        "rgba(148,163,184,0.12)",
    },

    transactionIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 11,
    },

    transactionInfo: {
      flex: 1,
      minWidth: 0,
    },

    transactionCategory: {
      fontSize: 12,
      fontWeight: "800",
      color: TEXT,
    },

    transactionNote: {
      fontSize: 10,
      color: MUTED,
      marginTop: 4,
    },

    transactionRight: {
      alignItems:
        "flex-end",
      marginLeft: 8,
    },

    transactionAmount: {
      fontSize: 12,
      fontWeight: "800",
      color: TEXT,
    },

    transactionDate: {
      fontSize: 9,
      color: MUTED,
      marginTop: 4,
    },

    moreText: {
      textAlign: "center",
      fontSize: 10,
      color: MUTED,
      marginTop: 14,
    },

    emptyBreakdown: {
      alignItems: "center",
      paddingVertical: 22,
    },

    emptyIcon: {
      width: 54,
      height: 54,
      borderRadius: 19,
      backgroundColor:
        "#EEF2F7",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 10,
    },

    emptyTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: TEXT,
    },

    emptyText: {
      fontSize: 11,
      color: MUTED,
      marginTop: 5,
      textAlign: "center",
    },

    exportCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "rgba(255,255,255,0.82)",
      borderRadius: 23,
      borderWidth: 1,
      borderColor:
        "rgba(184,138,36,0.20)",
      padding: 17,
      marginBottom: 28,
    },

    exportIcon: {
      width: 45,
      height: 45,
      borderRadius: 15,
      backgroundColor:
        "rgba(184,138,36,0.10)",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    exportInfo: {
      flex: 1,
      marginLeft: 12,
      marginRight: 10,
    },

    exportTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: TEXT,
    },

    exportDescription: {
      fontSize: 10,
      lineHeight: 15,
      color: MUTED,
      marginTop: 4,
    },

    exportButton: {
      width: 44,
      height: 44,
      borderRadius: 15,
      backgroundColor: BLUE,
      alignItems:
        "center",
      justifyContent:
        "center",
      shadowColor: BLUE,
      shadowOpacity: 0.22,
      shadowRadius: 12,
      elevation: 3,
    },

    footer: {
      alignItems: "center",
      paddingTop: 4,
      paddingBottom: 25,
    },

    footerBrand: {
      fontSize: 14,
      fontWeight: "900",
      color: BLUE,
      letterSpacing: 0.5,
    },

    footerTagline: {
      fontSize: 10,
      fontWeight: "600",
      color: MUTED,
      marginTop: 3,
    },

    footerNote: {
      fontSize: 9,
      color: "#94A3B8",
      marginTop: 8,
    },
  });