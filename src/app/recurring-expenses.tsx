import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    addRecurringExpense,
    deleteRecurringExpense,
    getRecurringExpenses,
    RecurringExpense,
    toggleRecurringExpense,
    updateRecurringExpense,
} from "../db/database";
import { requirePro } from "../services/proGuard";

const BLUE = "#2563EB";
const GOLD = "#B88A24";
const BG = "#F5F8FC";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";
const GREEN = "#16A34A";
const RED = "#DC2626";

type Frequency =
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Yearly";

const FREQUENCIES: Frequency[] = [
  "Daily",
  "Weekly",
  "Monthly",
  "Yearly",
];

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

export default function RecurringExpensesScreen() {
  const [recurringExpenses, setRecurringExpenses] =
    useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] =
    useState(false);
  const [editingExpense, setEditingExpense] =
    useState<RecurringExpense | null>(null);

  const [amount, setAmount] = useState("");
  const [category, setCategory] =
    useState("Food");
  const [note, setNote] = useState("");
  const [frequency, setFrequency] =
    useState<Frequency>("Monthly");
  const [nextDate, setNextDate] =
    useState("");

  const [saving, setSaving] = useState(false);

  const loadExpenses = async () => {
    if (!(await requirePro())) {
      return;
    }

    try {
      setLoading(true);

      const data =
        await getRecurringExpenses();

      setRecurringExpenses(data);
    } catch (error) {
      console.error(
        "Failed to load recurring expenses:",
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

  const resetForm = () => {
    setAmount("");
    setCategory("Food");
    setNote("");
    setFrequency("Monthly");
    setNextDate("");
    setEditingExpense(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (
    expense: RecurringExpense
  ) => {
    setEditingExpense(expense);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setNote(expense.note || "");
    setFrequency(
      expense.frequency as Frequency
    );

    const date = new Date(
      expense.next_date
    );

    if (!Number.isNaN(date.getTime())) {
      const year =
        date.getFullYear();
      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");
      const day = String(
        date.getDate()
      ).padStart(2, "0");

      setNextDate(
        `${year}-${month}-${day}`
      );
    } else {
      setNextDate(expense.next_date);
    }

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSave = async () => {
    const numericAmount =
      Number(amount);

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      Alert.alert(
        "Invalid amount",
        "Please enter a valid recurring amount."
      );
      return;
    }

    if (!category.trim()) {
      Alert.alert(
        "Missing category",
        "Please select a category."
      );
      return;
    }

    if (!nextDate.trim()) {
      Alert.alert(
        "Missing date",
        "Please enter the next payment date."
      );
      return;
    }

    const parsedDate =
      new Date(nextDate);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      Alert.alert(
        "Invalid date",
        "Please use a date such as 2026-12-01."
      );
      return;
    }

    try {
      setSaving(true);

      const storedDate =
        parsedDate.toISOString();

      if (editingExpense) {
        await updateRecurringExpense(
          editingExpense.id,
          numericAmount,
          category,
          note.trim(),
          frequency,
          storedDate
        );
      } else {
        await addRecurringExpense(
          numericAmount,
          category,
          note.trim(),
          frequency,
          storedDate
        );
      }

      closeModal();
      await loadExpenses();
    } catch (error) {
      console.error(
        "Failed to save recurring expense:",
        error
      );

      Alert.alert(
        "Something went wrong",
        "Could not save the recurring expense."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (
    expense: RecurringExpense
  ) => {
    try {
      await toggleRecurringExpense(
        expense.id,
        expense.active === 1
          ? 0
          : 1
      );

      await loadExpenses();
    } catch (error) {
      console.error(
        "Failed to toggle recurring expense:",
        error
      );

      Alert.alert(
        "Something went wrong",
        "Could not update this recurring expense."
      );
    }
  };

  const handleDelete = (
    expense: RecurringExpense
  ) => {
    Alert.alert(
      "Delete recurring expense?",
      `Are you sure you want to delete "${expense.note || expense.category}"?`,
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
              await deleteRecurringExpense(
                expense.id
              );

              await loadExpenses();
            } catch (error) {
              console.error(
                "Failed to delete recurring expense:",
                error
              );

              Alert.alert(
                "Something went wrong",
                "Could not delete this recurring expense."
              );
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (
    value: number
  ) => {
    return `Rs. ${Math.round(
      value
    ).toLocaleString("en-LK")}`;
  };

  const formatDate = (
    value: string
  ) => {
    const date = new Date(
      value
    );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getMonthlyAmount = (
    expense: RecurringExpense
  ) => {
    const amount =
      Number(expense.amount);

    switch (
      expense.frequency
    ) {
      case "Daily":
        return amount * 30;

      case "Weekly":
        return amount * 4.345;

      case "Yearly":
        return amount / 12;

      case "Monthly":
      default:
        return amount;
    }
  };

  const activeExpenses =
    recurringExpenses.filter(
      (expense) =>
        expense.active === 1
    );

  const monthlyCommitment =
    activeExpenses.reduce(
      (sum, expense) =>
        sum +
        getMonthlyAmount(
          expense
        ),
      0
    );

  const formatFrequency =
    (frequency: string) => {
      switch (
        frequency
      ) {
        case "Daily":
          return "every day";

        case "Weekly":
          return "every week";

        case "Monthly":
          return "every month";

        case "Yearly":
          return "every year";

        default:
          return frequency;
      }
    };

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View
        style={styles.backgroundOrbTop}
      />

      <View
        style={styles.backgroundOrbBottom}
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.container
        }
      >
        {/* Header */}
        <View
          style={styles.header}
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
              color={TEXT}
            />
          </TouchableOpacity>

          <View
            style={
              styles.headerContent
            }
          >
            <Text
              style={
                styles.headerTitle
              }
            >
              Recurring Expenses
            </Text>

            <Text
              style={
                styles.headerSubtitle
              }
            >
              Keep track of the payments that keep coming back
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
              color={GOLD}
            />
          </View>
        </View>

        {/* Summary */}
        <View
          style={
            styles.summaryCard
          }
        >
          <View
            style={
              styles.summaryGlow
            }
          />

          <View
            style={
              styles.summaryTopRow
            }
          >
            <View>
              <Text
                style={
                  styles.eyebrow
                }
              >
                MONTHLY COMMITMENT
              </Text>

              <Text
                style={
                  styles.summaryAmount
                }
              >
                {formatCurrency(
                  monthlyCommitment
                )}
              </Text>

              <Text
                style={
                  styles.summarySubtitle
                }
              >
                estimated recurring spending
              </Text>
            </View>

            <View
              style={
                styles.summaryIcon
              }
            >
              <Ionicons
                name="repeat-outline"
                size={23}
                color={BLUE}
              />
            </View>
          </View>

          <View
            style={
              styles.summaryBottomRow
            }
          >
            <View
              style={
                styles.summaryStat
              }
            >
              <Text
                style={
                  styles.summaryStatValue
                }
              >
                {
                  activeExpenses.length
                }
              </Text>

              <Text
                style={
                  styles.summaryStatLabel
                }
              >
                active
              </Text>
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
              <Text
                style={
                  styles.summaryStatValue
                }
              >
                {
                  recurringExpenses.length
                }
              </Text>

              <Text
                style={
                  styles.summaryStatLabel
                }
              >
                total schedules
              </Text>
            </View>
          </View>
        </View>

        {/* Add */}
        <TouchableOpacity
          style={
            styles.addButton
          }
          onPress={
            openCreateModal
          }
          activeOpacity={
            0.85
          }
        >
          <View
            style={
              styles.addButtonIcon
            }
          >
            <Ionicons
              name="add"
              size={21}
              color={WHITE}
            />
          </View>

          <View
            style={
              styles.addButtonContent
            }
          >
            <Text
              style={
                styles.addButtonTitle
              }
            >
              Add recurring expense
            </Text>

            <Text
              style={
                styles.addButtonSubtitle
              }
            >
              Never lose track of another regular payment
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={MUTED}
          />
        </TouchableOpacity>

        {/* Section */}
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
              Your recurring expenses
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Manage your regular commitments
            </Text>
          </View>

          <Text
            style={
              styles.countBadge
            }
          >
            {
              recurringExpenses.length
            }
          </Text>
        </View>

        {loading ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color={BLUE}
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading recurring expenses...
            </Text>
          </View>
        ) : recurringExpenses.length ===
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
                name="repeat-outline"
                size={29}
                color={BLUE}
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No recurring expenses
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Add subscriptions, bills, memberships or other regular payments so you can keep them organised.
            </Text>

            <TouchableOpacity
              style={
                styles.emptyButton
              }
              onPress={
                openCreateModal
              }
              activeOpacity={
                0.85
              }
            >
              <Ionicons
                name="add"
                size={17}
                color={WHITE}
              />

              <Text
                style={
                  styles.emptyButtonText
                }
              >
                Add one
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={
              styles.expenseList
            }
          >
            {recurringExpenses.map(
              (expense) => {
                const monthly =
                  getMonthlyAmount(
                    expense
                  );

                return (
                  <View
                    key={
                      expense.id
                    }
                    style={
                      styles.expenseCard
                    }
                  >
                    <View
                      style={
                        styles.expenseTopRow
                      }
                    >
                      <View
                        style={
                          styles.categoryIcon
                        }
                      >
                        <Ionicons
                          name={
                            expense.category ===
                            "Food"
                              ? "restaurant-outline"
                              : expense.category ===
                                "Transport"
                              ? "car-outline"
                              : expense.category ===
                                "Shopping"
                              ? "bag-outline"
                              : expense.category ===
                                "Bills"
                              ? "receipt-outline"
                              : expense.category ===
                                "Entertainment"
                              ? "play-circle-outline"
                              : expense.category ===
                                "Health"
                              ? "heart-outline"
                              : expense.category ===
                                "Education"
                              ? "school-outline"
                              : "wallet-outline"
                          }
                          size={
                            21
                          }
                          color={
                            BLUE
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.expenseHeaderContent
                        }
                      >
                        <Text
                          style={
                            styles.expenseName
                          }
                        >
                          {expense.note ||
                            expense.category}
                        </Text>

                        <Text
                          style={
                            styles.expenseCategory
                          }
                        >
                          {
                            expense.category
                          }
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={
                          styles.moreButton
                        }
                        onPress={() =>
                          Alert.alert(
                            expense.note ||
                              expense.category,
                            "Choose an action",
                            [
                              {
                                text: "Edit",
                                onPress: () =>
                                  openEditModal(
                                    expense
                                  ),
                              },
                              {
                                text:
                                  expense.active ===
                                  1
                                    ? "Pause"
                                    : "Resume",
                                onPress: () =>
                                  handleToggle(
                                    expense
                                  ),
                              },
                              {
                                text: "Delete",
                                style:
                                  "destructive",
                                onPress: () =>
                                  handleDelete(
                                    expense
                                  ),
                              },
                              {
                                text: "Cancel",
                                style:
                                  "cancel",
                              },
                            ]
                          )
                        }
                        activeOpacity={
                          0.8
                        }
                      >
                        <Ionicons
                          name="ellipsis-horizontal"
                          size={19}
                          color={MUTED}
                        />
                      </TouchableOpacity>
                    </View>

                    <View
                      style={
                        styles.amountRow
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.amountLabel
                          }
                        >
                          AMOUNT
                        </Text>

                        <Text
                          style={
                            styles.amount
                          }
                        >
                          {formatCurrency(
                            Number(
                              expense.amount
                            )
                          )}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.frequencyBadge
                        }
                      >
                        <Ionicons
                          name="repeat-outline"
                          size={12}
                          color={BLUE}
                        />

                        <Text
                          style={
                            styles.frequencyText
                          }
                        >
                          {formatFrequency(
                            expense.frequency
                          )}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.infoRow
                      }
                    >
                      <View
                        style={
                          styles.infoItem
                        }
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={MUTED}
                        />

                        <Text
                          style={
                            styles.infoText
                          }
                        >
                          Next:{" "}
                          {formatDate(
                            expense.next_date
                          )}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          expense.active ===
                            1
                            ? styles.activeBadge
                            : styles.pausedBadge,
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                expense.active ===
                                1
                                  ? GREEN
                                  : MUTED,
                            },
                          ]}
                        />

                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                expense.active ===
                                1
                                  ? GREEN
                                  : MUTED,
                            },
                          ]}
                        >
                          {expense.active ===
                          1
                            ? "Active"
                            : "Paused"}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.monthlyEstimate
                      }
                    >
                      <Text
                        style={
                          styles.monthlyEstimateLabel
                        }
                      >
                        Estimated monthly impact
                      </Text>

                      <Text
                        style={
                          styles.monthlyEstimateValue
                        }
                      >
                        {formatCurrency(
                          monthly
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.actionRow
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.editButton
                        }
                        onPress={() =>
                          openEditModal(
                            expense
                          )
                        }
                        activeOpacity={
                          0.8
                        }
                      >
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color={BLUE}
                        />

                        <Text
                          style={
                            styles.editButtonText
                          }
                        >
                          Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={
                          styles.pauseButton
                        }
                        onPress={() =>
                          handleToggle(
                            expense
                          )
                        }
                        activeOpacity={
                          0.8
                        }
                      >
                        <Ionicons
                          name={
                            expense.active ===
                            1
                              ? "pause-outline"
                              : "play-outline"
                          }
                          size={16}
                          color={
                            expense.active ===
                            1
                              ? GOLD
                              : GREEN
                          }
                        />

                        <Text
                          style={[
                            styles.pauseButtonText,
                            {
                              color:
                                expense.active ===
                                1
                                  ? GOLD
                                  : GREEN,
                            },
                          ]}
                        >
                          {expense.active ===
                          1
                            ? "Pause"
                            : "Resume"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        )}

        {/* Info */}
        <View
          style={
            styles.infoCard
          }
        >
          <View
            style={
              styles.infoIcon
            }
          >
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={BLUE}
            />
          </View>

          <View
            style={
              styles.infoContent
            }
          >
            <Text
              style={
                styles.infoTitle
              }
            >
              Keep your commitments visible
            </Text>

            <Text
              style={
                styles.infoDescription
              }
            >
              Spendly currently helps you manage recurring payment schedules. Your recurring expenses are not automatically added to your expense history yet.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View
          style={
            styles.footer
          }
        >
          <View
            style={
              styles.footerLogo
            }
          >
            <Image
              source={require("../../assets/icon.png")}
              style={
                styles.footerLogoImage
              }
              resizeMode="contain"
            />

            <Text
              style={
                styles.footerBrand
              }
            >
              SPENDLY
            </Text>
          </View>

          <Text
            style={
              styles.footerTagline
            }
          >
            Smart Spending, Brighter Tomorrows
          </Text>

          <Text
            style={
              styles.footerSmall
            }
          >
            Plan recurring spending before it surprises you.
          </Text>
        </View>
      </ScrollView>

      {/* Create / Edit Modal */}
      <Modal
        visible={
          modalVisible
        }
        transparent
        animationType="slide"
        onRequestClose={
          closeModal
        }
      >
        <KeyboardAvoidingView
          style={
            styles.keyboardWrapper
          }
          behavior={
            Platform.OS ===
            "ios"
              ? "padding"
              : "height"
          }
          keyboardVerticalOffset={
            Platform.OS ===
            "ios"
              ? 0
              : 20
          }
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={
                styles.modalCard
              }
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.modalScrollContent
                }
                bounces={
                  false
                }
              >
                <View
                  style={
                    styles.modalHandle
                  }
                />

                <View
                  style={
                    styles.modalHeader
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      {editingExpense
                        ? "Edit recurring expense"
                        : "Add recurring expense"}
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      {editingExpense
                        ? "Update your regular payment"
                        : "Set up a payment schedule"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.modalClose
                    }
                    onPress={
                      closeModal
                    }
                    activeOpacity={
                      0.8
                    }
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={
                        TEXT
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* Amount */}
                <View
                  style={
                    styles.inputGroup
                  }
                >
                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    AMOUNT
                  </Text>

                  <View
                    style={
                      styles.inputWrapper
                    }
                  >
                    <Text
                      style={
                        styles.currencySymbol
                      }
                    >
                      Rs.
                    </Text>

                    <TextInput
                      value={
                        amount
                      }
                      onChangeText={
                        setAmount
                      }
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      style={
                        styles.input
                      }
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Category */}
                <View
                  style={
                    styles.inputGroup
                  }
                >
                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    CATEGORY
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                      false
                  }
                    contentContainerStyle={
                      styles.categoryScroll
                    }
                  >
                    {CATEGORIES.map(
                      (item) => (
                        <TouchableOpacity
                          key={
                            item
                          }
                          style={[
                            styles.categoryChip,
                            category ===
                              item &&
                              styles.categoryChipActive,
                          ]}
                          onPress={() =>
                            setCategory(
                              item
                            )
                          }
                          activeOpacity={
                            0.8
                          }
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              category ===
                                item &&
                                styles.categoryChipTextActive,
                            ]}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </ScrollView>
                </View>

                {/* Note */}
                <View
                  style={
                    styles.inputGroup
                  }
                >
                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    NOTE
                  </Text>

                  <View
                    style={[
                      styles.inputWrapper,
                      styles.noteWrapper,
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color={
                        MUTED
                      }
                    />

                    <TextInput
                      value={
                        note
                      }
                      onChangeText={
                        setNote
                      }
                      placeholder="e.g. Netflix subscription"
                      placeholderTextColor="#94A3B8"
                      style={
                        styles.input
                      }
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Frequency */}
                <View
                  style={
                    styles.inputGroup
                  }
                >
                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    FREQUENCY
                  </Text>

                  <View
                    style={
                      styles.frequencyGrid
                    }
                  >
                    {FREQUENCIES.map(
                      (item) => (
                        <TouchableOpacity
                          key={
                            item
                          }
                          style={[
                            styles.frequencyOption,
                            frequency ===
                              item &&
                              styles.frequencyOptionActive,
                          ]}
                          onPress={() =>
                            setFrequency(
                              item
                            )
                          }
                          activeOpacity={
                            0.8
                          }
                        >
                          <Ionicons
                            name="repeat-outline"
                            size={16}
                            color={
                              frequency ===
                              item
                                ? BLUE
                                : MUTED
                            }
                          />

                          <Text
                            style={[
                              styles.frequencyOptionText,
                              frequency ===
                                item &&
                                styles.frequencyOptionTextActive,
                            ]}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>

                {/* Date */}
                <View
                  style={
                    styles.inputGroup
                  }
                >
                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    NEXT PAYMENT DATE
                  </Text>

                  <View
                    style={
                      styles.inputWrapper
                    }
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={
                        MUTED
                      }
                    />

                    <TextInput
                      value={
                        nextDate
                      }
                      onChangeText={
                        setNextDate
                      }
                      placeholder="2026-12-01"
                      placeholderTextColor="#94A3B8"
                      style={
                        styles.input
                      }
                      autoCapitalize="none"
                      returnKeyType="done"
                    />
                  </View>

                  <Text
                    style={
                      styles.dateHint
                    }
                  >
                    Use YYYY-MM-DD format
                  </Text>
                </View>

                {/* Save */}
                <TouchableOpacity
                  style={
                    styles.saveButton
                  }
                  onPress={
                    handleSave
                  }
                  disabled={
                    saving
                  }
                  activeOpacity={
                    0.85
                  }
                >
                  {saving ? (
                    <ActivityIndicator
                      color={
                        WHITE
                      }
                    />
                  ) : (
                    <>
                      <Ionicons
                        name={
                          editingExpense
                            ? "checkmark"
                            : "add"
                        }
                        size={19}
                        color={
                          WHITE
                        }
                      />

                      <Text
                        style={
                          styles.saveButtonText
                        }
                      >
                        {editingExpense
                          ? "Update expense"
                          : "Add recurring expense"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.cancelButton
                  }
                  onPress={
                    closeModal
                  }
                  activeOpacity={
                    0.8
                  }
                >
                  <Text
                    style={
                      styles.cancelButtonText
                    }
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor:
      "rgba(37,99,235,0.07)",
    top: -80,
    right: -80,
  },

  backgroundOrbBottom: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor:
      "rgba(184,138,36,0.06)",
    bottom: 80,
    left: -125,
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
    backgroundColor:
      "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
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
    backgroundColor:
      "rgba(184,138,36,0.11)",
    borderWidth: 1,
    borderColor:
      "rgba(184,138,36,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryCard: {
    overflow: "hidden",
    borderRadius: 27,
    padding: 23,
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
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

  summaryGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor:
      "rgba(37,99,235,0.07)",
    right: -85,
    top: -85,
  },

  summaryTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  eyebrow: {
    fontSize: 8,
    color: GOLD,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  summaryAmount: {
    marginTop: 8,
    fontSize: 31,
    color: TEXT,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  summarySubtitle: {
    marginTop: 3,
    fontSize: 10.5,
    color: MUTED,
    fontWeight: "600",
  },

  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.09)",
    borderWidth: 1,
    borderColor:
      "rgba(37,99,235,0.12)",
  },

  summaryBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 21,
  },

  summaryStat: {
    flex: 1,
  },

  summaryStatValue: {
    fontSize: 17,
    color: TEXT,
    fontWeight: "900",
  },

  summaryStatLabel: {
    marginTop: 2,
    fontSize: 9,
    color: MUTED,
    fontWeight: "600",
  },

  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 18,
  },

  addButton: {
    minHeight: 74,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor:
      "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 2,
  },

  addButtonIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  addButtonContent: {
    flex: 1,
  },

  addButtonTitle: {
    fontSize: 13,
    color: TEXT,
    fontWeight: "900",
  },

  addButtonSubtitle: {
    marginTop: 3,
    fontSize: 9.5,
    color: MUTED,
    fontWeight: "500",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    color: TEXT,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 10.5,
    color: MUTED,
    lineHeight: 16,
    fontWeight: "500",
  },

  countBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor:
      "rgba(37,99,235,0.08)",
    color: BLUE,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 11,
    fontWeight: "900",
  },

  loadingContainer: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: MUTED,
    fontWeight: "600",
  },

  emptyCard: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 35,
    borderRadius: 25,
    backgroundColor:
      "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 2,
    marginBottom: 15,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor:
      "rgba(37,99,235,0.09)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  emptyTitle: {
    fontSize: 15,
    color: TEXT,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 10.5,
    lineHeight: 17,
    color: MUTED,
    textAlign: "center",
    fontWeight: "500",
  },

  emptyButton: {
    marginTop: 18,
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: BLUE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyButtonText: {
    marginLeft: 7,
    color: WHITE,
    fontSize: 10.5,
    fontWeight: "800",
  },

  expenseList: {
    gap: 13,
  },

  expenseCard: {
    borderRadius: 25,
    padding: 18,
    backgroundColor:
      "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
  },

  expenseTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  categoryIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor:
      "rgba(37,99,235,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  expenseHeaderContent: {
    flex: 1,
    marginLeft: 11,
  },

  expenseName: {
    fontSize: 13,
    color: TEXT,
    fontWeight: "900",
  },

  expenseCategory: {
    marginTop: 3,
    fontSize: 9.5,
    color: MUTED,
    fontWeight: "600",
  },

  moreButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(100,116,139,0.06)",
  },

  amountRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  amountLabel: {
    fontSize: 8,
    color: MUTED,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  amount: {
    marginTop: 3,
    fontSize: 20,
    color: TEXT,
    fontWeight: "900",
  },

  frequencyBadge: {
    minHeight: 29,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor:
      "rgba(37,99,235,0.08)",
    flexDirection: "row",
    alignItems: "center",
  },

  frequencyText: {
    marginLeft: 5,
    fontSize: 9,
    color: BLUE,
    fontWeight: "800",
  },

  infoRow: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  infoText: {
    marginLeft: 6,
    fontSize: 9.5,
    color: MUTED,
    fontWeight: "600",
  },

  statusBadge: {
    minHeight: 25,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  activeBadge: {
    backgroundColor:
      "rgba(22,163,74,0.08)",
  },

  pausedBadge: {
    backgroundColor:
      "rgba(100,116,139,0.08)",
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 8.5,
    fontWeight: "800",
  },

  monthlyEstimate: {
    marginTop: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor:
      "rgba(184,138,36,0.06)",
    borderWidth: 1,
    borderColor:
      "rgba(184,138,36,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  monthlyEstimateLabel: {
    fontSize: 8.5,
    color: MUTED,
    fontWeight: "600",
  },

  monthlyEstimateValue: {
    fontSize: 10.5,
    color: TEXT,
    fontWeight: "900",
  },

  actionRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },

  editButton: {
    flex: 1,
    minHeight: 39,
    borderRadius: 12,
    backgroundColor:
      "rgba(37,99,235,0.07)",
    borderWidth: 1,
    borderColor:
      "rgba(37,99,235,0.11)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  editButtonText: {
    marginLeft: 6,
    fontSize: 9.5,
    color: BLUE,
    fontWeight: "900",
  },

  pauseButton: {
    flex: 1,
    minHeight: 39,
    borderRadius: 12,
    backgroundColor:
      "rgba(184,138,36,0.07)",
    borderWidth: 1,
    borderColor:
      "rgba(184,138,36,0.11)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  pauseButtonText: {
    marginLeft: 6,
    fontSize: 9.5,
    fontWeight: "900",
  },

  infoCard: {
    marginTop: 15,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    backgroundColor:
      "rgba(37,99,235,0.06)",
    borderWidth: 1,
    borderColor:
      "rgba(37,99,235,0.12)",
  },

  infoIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor:
      "rgba(37,99,235,0.09)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 13,
    color: TEXT,
    fontWeight: "900",
  },

  infoDescription: {
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

  keyboardWrapper: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(15,23,42,0.38)",
    justifyContent: "flex-end",
  },

  modalCard: {
    maxHeight: "92%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: WHITE,
    paddingTop: 10,
  },

  modalScrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 35,
  },

  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 5,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 18,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  modalTitle: {
    fontSize: 20,
    color: TEXT,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  modalSubtitle: {
    marginTop: 4,
    fontSize: 10.5,
    color: MUTED,
    fontWeight: "500",
    maxWidth: 280,
  },

  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor:
      "rgba(100,116,139,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  inputGroup: {
    marginBottom: 17,
  },

  inputLabel: {
    marginBottom: 7,
    fontSize: 8,
    color: MUTED,
    fontWeight: "900",
    letterSpacing: 0.9,
  },

  inputWrapper: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: "#F5F8FC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  noteWrapper: {
    minHeight: 52,
  },

  currencySymbol: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "800",
    marginRight: 8,
  },

  input: {
    flex: 1,
    minHeight: 50,
    color: TEXT,
    fontSize: 14,
    fontWeight: "700",
    paddingVertical: 0,
  },

  categoryScroll: {
    paddingRight: 10,
    gap: 8,
  },

  categoryChip: {
    minHeight: 37,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: "#F5F8FC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryChipActive: {
    backgroundColor:
      "rgba(37,99,235,0.09)",
    borderColor:
      "rgba(37,99,235,0.18)",
  },

  categoryChipText: {
    fontSize: 9.5,
    color: MUTED,
    fontWeight: "700",
  },

  categoryChipTextActive: {
    color: BLUE,
    fontWeight: "900",
  },

  frequencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  frequencyOption: {
    width: "48%",
    minHeight: 43,
    borderRadius: 13,
    backgroundColor: "#F5F8FC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  frequencyOptionActive: {
    backgroundColor:
      "rgba(37,99,235,0.09)",
    borderColor:
      "rgba(37,99,235,0.18)",
  },

  frequencyOptionText: {
    marginLeft: 6,
    fontSize: 9.5,
    color: MUTED,
    fontWeight: "700",
  },

  frequencyOptionTextActive: {
    color: BLUE,
    fontWeight: "900",
  },

  dateHint: {
    marginTop: 5,
    fontSize: 8.5,
    color: MUTED,
    fontWeight: "500",
  },

  saveButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 5,
  },

  saveButtonText: {
    marginLeft: 7,
    color: WHITE,
    fontSize: 11,
    fontWeight: "900",
  },

  cancelButton: {
    minHeight: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  cancelButtonText: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "800",
  },
});