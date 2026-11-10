import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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

const BLUE = "#2563EB";
const GOLD = "#B88A24";
const BG = "#F5F8FC";
const TEXT = "#172033";
const MUTED = "#718096";

const categories = [
  {
    name: "Food",
    icon: "restaurant-outline",
  },
  {
    name: "Transport",
    icon: "car-outline",
  },
  {
    name: "Bills",
    icon: "receipt-outline",
  },
  {
    name: "Internet",
    icon: "wifi-outline",
  },
  {
    name: "Mobile",
    icon: "phone-portrait-outline",
  },
  {
    name: "Rent",
    icon: "home-outline",
  },
  {
    name: "Subscriptions",
    icon: "play-circle-outline",
  },
  {
    name: "Other",
    icon: "ellipsis-horizontal-outline",
  },
];

const frequencies = [
  {
    label: "Daily",
    value: "Daily",
  },
  {
    label: "Weekly",
    value: "Weekly",
  },
  {
    label: "Monthly",
    value: "Monthly",
  },
  {
    label: "Yearly",
    value: "Yearly",
  },
];

function formatCurrency(value: number) {
  return `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateString: string) {
  if (!dateString) return "No date";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getFrequencyIcon(frequency: string) {
  switch (frequency) {
    case "Daily":
      return "today-outline";
    case "Weekly":
      return "calendar-outline";
    case "Monthly":
      return "calendar-number-outline";
    case "Yearly":
      return "gift-outline";
    default:
      return "repeat-outline";
  }
}

function getNextDateLabel(dateString: string) {
  const target = new Date(dateString);

  if (Number.isNaN(target.getTime())) {
    return "Upcoming";
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const difference =
    Math.round(
      (target.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

  if (difference < 0) {
    return "Overdue";
  }

  if (difference === 0) {
    return "Today";
  }

  if (difference === 1) {
    return "Tomorrow";
  }

  if (difference <= 7) {
    return `In ${difference} days`;
  }

  return formatDate(dateString);
}

export default function RecurringExpenses() {
  const [expenses, setExpenses] =
    useState<RecurringExpense[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [editingExpense, setEditingExpense] =
    useState<RecurringExpense | null>(null);

  const [amount, setAmount] =
    useState("");

  const [category, setCategory] =
    useState("Bills");

  const [note, setNote] =
    useState("");

  const [frequency, setFrequency] =
    useState("Monthly");

  const [nextDate, setNextDate] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);

      const data =
        await getRecurringExpenses();

      setExpenses(data);
    } catch (error) {
      console.error(
        "❌ RECURRING EXPENSE LOAD ERROR:",
        error
      );

      Alert.alert(
        "Unable to load",
        "Something went wrong while loading recurring expenses."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses])
  );

  const activeExpenses = useMemo(
    () =>
      expenses.filter(
        (expense) => expense.active === 1
      ),
    [expenses]
  );

  const monthlyCommitment = useMemo(() => {
    return activeExpenses.reduce(
      (total, expense) => {
        const amount = Number(expense.amount);

        switch (expense.frequency) {
          case "Daily":
            return total + amount * 30;

          case "Weekly":
            return total + amount * 4.345;

          case "Yearly":
            return total + amount / 12;

          case "Monthly":
          default:
            return total + amount;
        }
      },
      0
    );
  }, [activeExpenses]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setAmount("");
    setCategory("Bills");
    setNote("");
    setFrequency("Monthly");
    setNextDate("");
    setShowModal(true);
  };

  const openEditModal = (
    expense: RecurringExpense
  ) => {
    setEditingExpense(expense);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setNote(expense.note);
    setFrequency(expense.frequency);
    setNextDate(
      expense.next_date
        ? expense.next_date.slice(0, 10)
        : ""
    );
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
  };

  const handleSave = async () => {
    const numericAmount =
      Number(
        amount.replace(/,/g, "")
      );

    if (
      !amount.trim() ||
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      Alert.alert(
        "Invalid amount",
        "Please enter a valid amount."
      );
      return;
    }

    if (!category) {
      Alert.alert(
        "Category required",
        "Please select a category."
      );
      return;
    }

    if (!nextDate.trim()) {
      Alert.alert(
        "Date required",
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
        "Use a date such as 2026-12-01."
      );
      return;
    }

    try {
      setSaving(true);

      const normalizedDate =
        parsedDate.toISOString();

      if (editingExpense) {
        await updateRecurringExpense(
          editingExpense.id,
          numericAmount,
          category,
          note.trim(),
          frequency,
          normalizedDate
        );
      } else {
        await addRecurringExpense(
          numericAmount,
          category,
          note.trim(),
          frequency,
          normalizedDate
        );
      }

      setShowModal(false);

      await loadExpenses();

      Alert.alert(
        editingExpense
          ? "Updated"
          : "Recurring expense added",
        editingExpense
          ? "Your recurring expense was updated."
          : "Your recurring payment has been saved."
      );
    } catch (error) {
      console.error(
        "❌ RECURRING EXPENSE SAVE ERROR:",
        error
      );

      Alert.alert(
        "Could not save",
        "Something went wrong while saving the recurring expense."
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
        expense.active !== 1
      );

      await loadExpenses();
    } catch (error) {
      console.error(
        "❌ RECURRING EXPENSE TOGGLE ERROR:",
        error
      );
    }
  };

  const handleDelete = (
    expense: RecurringExpense
  ) => {
    Alert.alert(
      "Delete recurring expense?",
      `Remove ${expense.category} recurring payment?`,
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
                "❌ RECURRING EXPENSE DELETE ERROR:",
                error
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundOrbOne} />
      <View style={styles.backgroundOrbTwo} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.replace("/pro")
            }
            activeOpacity={0.75}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={TEXT}
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              SPENDLY PRO
            </Text>

            <Text style={styles.title}>
              Recurring Expenses
            </Text>

            <Text style={styles.subtitle}>
              Stay ahead of payments before
              they happen.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="repeat-outline"
              size={24}
              color={BLUE}
            />
          </View>
        </View>

        {/* SUMMARY */}

        <View style={styles.summaryCard}>
          <View
            style={styles.summaryIcon}
          >
            <Ionicons
              name="wallet-outline"
              size={25}
              color={BLUE}
            />
          </View>

          <View style={styles.summaryMain}>
            <Text
              style={styles.summaryLabel}
            >
              Monthly commitment
            </Text>

            <Text
              style={styles.summaryAmount}
            >
              {formatCurrency(
                monthlyCommitment
              )}
            </Text>

            <Text
              style={styles.summaryHint}
            >
              Based on your active recurring
              payments
            </Text>
          </View>

          <View style={styles.countPill}>
            <Text style={styles.countNumber}>
              {activeExpenses.length}
            </Text>

            <Text style={styles.countLabel}>
              active
            </Text>
          </View>
        </View>

        {/* ADD BUTTON */}

        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreateModal}
          activeOpacity={0.8}
        >
          <View
            style={styles.addButtonIcon}
          >
            <Ionicons
              name="add"
              size={22}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.addButtonText}>
            <Text
              style={styles.addButtonTitle}
            >
              Add recurring expense
            </Text>

            <Text
              style={styles.addButtonSubtitle}
            >
              Rent, bills, subscriptions and more
            </Text>
          </View>

          <Ionicons
            name="arrow-forward"
            size={19}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* CONTENT */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Your payments
            </Text>

            <Text style={styles.sectionSubtitle}>
              Manage your repeating expenses
            </Text>
          </View>

          <View style={styles.totalPill}>
            <Text style={styles.totalPillText}>
              {expenses.length}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator
              size="small"
              color={BLUE}
            />

            <Text style={styles.loadingText}>
              Loading recurring expenses...
            </Text>
          </View>
        ) : expenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <View
              style={styles.emptyIcon}
            >
              <Ionicons
                name="repeat-outline"
                size={30}
                color={BLUE}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No recurring expenses yet
            </Text>

            <Text style={styles.emptyText}>
              Add your regular payments and
              Spendly will keep them organized
              in one place.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={openCreateModal}
            >
              <Text
                style={styles.emptyButtonText}
              >
                Add your first payment
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {expenses.map((expense) => {
              const active =
                expense.active === 1;

              return (
                <View
                  key={expense.id}
                  style={[
                    styles.expenseCard,
                    !active &&
                      styles.expenseCardPaused,
                  ]}
                >
                  <View
                    style={styles.cardTop}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        !active &&
                          styles.categoryIconPaused,
                      ]}
                    >
                      <Ionicons
                        name={
                          (categories.find(
                            (item) =>
                              item.name ===
                              expense.category
                          )?.icon ??
                            "repeat-outline") as any
                        }
                        size={22}
                        color={
                          active
                            ? BLUE
                            : "#94A3B8"
                        }
                      />
                    </View>

                    <View
                      style={styles.cardInfo}
                    >
                      <View
                        style={
                          styles.categoryRow
                        }
                      >
                        <Text
                          style={
                            styles.categoryName
                          }
                        >
                          {expense.category}
                        </Text>

                        {!active && (
                          <View
                            style={
                              styles.pausedBadge
                            }
                          >
                            <Text
                              style={
                                styles.pausedBadgeText
                              }
                            >
                              PAUSED
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={styles.note}
                        numberOfLines={1}
                      >
                        {expense.note ||
                          `${expense.frequency} payment`}
                      </Text>
                    </View>

                    <Text
                      style={styles.amount}
                    >
                      {formatCurrency(
                        expense.amount
                      )}
                    </Text>
                  </View>

                  <View
                    style={styles.divider}
                  />

                  <View
                    style={styles.detailsRow}
                  >
                    <View
                      style={styles.detail}
                    >
                      <Ionicons
                        name={
                          getFrequencyIcon(
                            expense.frequency
                          ) as any
                        }
                        size={15}
                        color={GOLD}
                      />

                      <Text
                        style={
                          styles.detailText
                        }
                      >
                        {expense.frequency}
                      </Text>
                    </View>

                    <View
                      style={styles.detail}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={15}
                        color={BLUE}
                      />

                      <Text
                        style={
                          styles.detailText
                        }
                      >
                        {getNextDateLabel(
                          expense.next_date
                        )}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={styles.actionsRow}
                  >
                    <TouchableOpacity
                      style={
                        styles.actionButton
                      }
                      onPress={() =>
                        openEditModal(
                          expense
                        )
                      }
                    >
                      <Ionicons
                        name="create-outline"
                        size={17}
                        color={BLUE}
                      />

                      <Text
                        style={
                          styles.actionText
                        }
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.actionButton
                      }
                      onPress={() =>
                        handleToggle(
                          expense
                        )
                      }
                    >
                      <Ionicons
                        name={
                          active
                            ? "pause-outline"
                            : "play-outline"
                        }
                        size={17}
                        color={GOLD}
                      />

                      <Text
                        style={[
                          styles.actionText,
                          {
                            color: GOLD,
                          },
                        ]}
                      >
                        {active
                          ? "Pause"
                          : "Resume"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.actionButton
                      }
                      onPress={() =>
                        handleDelete(
                          expense
                        )
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color="#DC5B5B"
                      />

                      <Text
                        style={[
                          styles.actionText,
                          {
                            color:
                              "#DC5B5B",
                          },
                        ]}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* INFO */}

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="sparkles-outline"
              size={20}
              color={GOLD}
            />
          </View>

          <View
            style={styles.infoContent}
          >
            <Text style={styles.infoTitle}>
              Spend smarter
            </Text>

            <Text style={styles.infoText}>
              Recurring expenses help you see
              how much of your monthly money
              is already committed before you
              start spending.
            </Text>
          </View>
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.footerLogo}
            resizeMode="contain"
          />

          <Text style={styles.footerBrand}>
            Spendly
          </Text>

          <Text style={styles.footerTagline}>
            Smart Spending, Brighter Tomorrows
          </Text>
        </View>
      </ScrollView>

      {/* CREATE / EDIT MODAL */}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
          keyboardVerticalOffset={
            Platform.OS === "ios"
              ? 0
              : 20
          }
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                  styles.modalContent
                }
              >
                <View
                  style={styles.modalHandle}
                />

                <View
                  style={styles.modalHeader}
                >
                  <View>
                    <Text
                      style={
                        styles.modalEyebrow
                      }
                    >
                      SPENDLY PRO
                    </Text>

                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      {editingExpense
                        ? "Edit payment"
                        : "New recurring payment"}
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      Keep your regular
                      spending organized.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.closeButton
                    }
                    onPress={closeModal}
                    disabled={saving}
                  >
                    <Ionicons
                      name="close"
                      size={21}
                      color={TEXT}
                    />
                  </TouchableOpacity>
                </View>

                {/* AMOUNT */}

                <Text
                  style={styles.inputLabel}
                >
                  Amount
                </Text>

                <View
                  style={styles.inputContainer}
                >
                  <Text
                    style={
                      styles.currencyPrefix
                    }
                  >
                    Rs.
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={
                      setAmount
                    }
                    placeholder="0.00"
                    placeholderTextColor="#A8B0BE"
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* CATEGORY */}

                <Text
                  style={styles.inputLabel}
                >
                  Category
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
                  {categories.map(
                    (item) => {
                      const selected =
                        category ===
                        item.name;

                      return (
                        <TouchableOpacity
                          key={
                            item.name
                          }
                          style={[
                            styles.categoryChip,
                            selected &&
                              styles.categoryChipSelected,
                          ]}
                          onPress={() =>
                            setCategory(
                              item.name
                            )
                          }
                        >
                          <Ionicons
                            name={
                              item.icon as any
                            }
                            size={16}
                            color={
                              selected
                                ? "#FFFFFF"
                                : BLUE
                            }
                          />

                          <Text
                            style={[
                              styles.categoryChipText,
                              selected &&
                                styles.categoryChipTextSelected,
                            ]}
                          >
                            {
                              item.name
                            }
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </ScrollView>

                {/* FREQUENCY */}

                <Text
                  style={styles.inputLabel}
                >
                  Frequency
                </Text>

                <View
                  style={
                    styles.frequencyGrid
                  }
                >
                  {frequencies.map(
                    (item) => {
                      const selected =
                        frequency ===
                        item.value;

                      return (
                        <TouchableOpacity
                          key={
                            item.value
                          }
                          style={[
                            styles.frequencyButton,
                            selected &&
                              styles.frequencyButtonSelected,
                          ]}
                          onPress={() =>
                            setFrequency(
                              item.value
                            )
                          }
                        >
                          <Ionicons
                            name={
                              getFrequencyIcon(
                                item.value
                              ) as any
                            }
                            size={17}
                            color={
                              selected
                                ? "#FFFFFF"
                                : BLUE
                            }
                          />

                          <Text
                            style={[
                              styles.frequencyText,
                              selected &&
                                styles.frequencyTextSelected,
                            ]}
                          >
                            {
                              item.label
                            }
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>

                {/* NEXT DATE */}

                <Text
                  style={styles.inputLabel}
                >
                  Next payment date
                </Text>

                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color={BLUE}
                  />

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      nextDate
                    }
                    onChangeText={
                      setNextDate
                    }
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#A8B0BE"
                    keyboardType="numbers-and-punctuation"
                    autoCapitalize="none"
                  />
                </View>

                <Text
                  style={
                    styles.helperText
                  }
                >
                  Example: 2026-12-01
                </Text>

                {/* NOTE */}

                <Text
                  style={styles.inputLabel}
                >
                  Note
                </Text>

                <View
                  style={[
                    styles.inputContainer,
                    styles.noteInputContainer,
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      styles.noteInput,
                    ]}
                    value={note}
                    onChangeText={
                      setNote
                    }
                    placeholder="Optional note"
                    placeholderTextColor="#A8B0BE"
                    multiline
                  />
                </View>

                {/* SAVE */}

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    saving &&
                      styles.saveButtonDisabled,
                  ]}
                  onPress={
                    handleSave
                  }
                  disabled={
                    saving
                  }
                  activeOpacity={
                    0.8
                  }
                >
                  {saving ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name={
                          editingExpense
                            ? "checkmark-circle-outline"
                            : "add-circle-outline"
                        }
                        size={20}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.saveButtonText
                        }
                      >
                        {editingExpense
                          ? "Save changes"
                          : "Add recurring expense"}
                      </Text>
                    </>
                  )}
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
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 50,
  },

  backgroundOrbOne: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor:
      "rgba(37,99,235,0.07)",
    top: -100,
    right: -100,
  },

  backgroundOrbTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor:
      "rgba(184,138,36,0.07)",
    bottom: 200,
    left: -110,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
    marginRight: 12,
    shadowColor: "#64748B",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 2,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.7,
    color: GOLD,
    marginBottom: 4,
  },

  title: {
    fontSize: 27,
    fontWeight: "900",
    color: TEXT,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: MUTED,
    lineHeight: 19,
  },

  headerIcon: {
    width: 47,
    height: 47,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
  },

  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
    padding: 17,
    marginBottom: 14,
    shadowColor: "#64748B",
    shadowOpacity: 0.10,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 9,
    },
    elevation: 3,
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.10)",
    marginRight: 12,
  },

  summaryMain: {
    flex: 1,
  },

  summaryLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "700",
  },

  summaryAmount: {
    fontSize: 22,
    color: TEXT,
    fontWeight: "900",
    marginTop: 2,
  },

  summaryHint: {
    fontSize: 10,
    color: "#8A95A6",
    marginTop: 3,
  },

  countPill: {
    minWidth: 55,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 15,
    alignItems: "center",
    backgroundColor:
      "rgba(184,138,36,0.10)",
    borderWidth: 1,
    borderColor:
      "rgba(184,138,36,0.18)",
  },

  countNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: GOLD,
  },

  countLabel: {
    fontSize: 9,
    color: GOLD,
    fontWeight: "700",
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BLUE,
    borderRadius: 22,
    padding: 14,
    marginBottom: 27,
    shadowColor: BLUE,
    shadowOpacity: 0.20,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },

  addButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor:
      "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  addButtonText: {
    flex: 1,
  },

  addButtonTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  addButtonSubtitle: {
    color:
      "rgba(255,255,255,0.75)",
    fontSize: 10,
    marginTop: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: TEXT,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: MUTED,
  },

  totalPill: {
    minWidth: 31,
    height: 31,
    paddingHorizontal: 9,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.09)",
  },

  totalPillText: {
    fontSize: 12,
    fontWeight: "900",
    color: BLUE,
  },

  list: {
    gap: 13,
  },

  expenseCard: {
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.96)",
    padding: 16,
    shadowColor: "#64748B",
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
  },

  expenseCardPaused: {
    opacity: 0.75,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  categoryIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.09)",
    marginRight: 12,
  },

  categoryIconPaused: {
    backgroundColor:
      "rgba(148,163,184,0.10)",
  },

  cardInfo: {
    flex: 1,
    minWidth: 0,
  },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  categoryName: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "900",
  },

  note: {
    color: MUTED,
    fontSize: 10,
    marginTop: 4,
  },

  amount: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 8,
  },

  pausedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor:
      "rgba(148,163,184,0.12)",
  },

  pausedBadgeText: {
    color: "#718096",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  divider: {
    height: 1,
    backgroundColor:
      "rgba(148,163,184,0.13)",
    marginVertical: 14,
  },

  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },

  detail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  detailText: {
    fontSize: 10,
    color: MUTED,
    fontWeight: "700",
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor:
      "rgba(148,163,184,0.10)",
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginRight: 19,
  },

  actionText: {
    color: BLUE,
    fontSize: 10,
    fontWeight: "800",
  },

  loadingCard: {
    minHeight: 120,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
  },

  loadingText: {
    color: MUTED,
    fontSize: 11,
    marginTop: 10,
  },

  emptyCard: {
    backgroundColor:
      "rgba(255,255,255,0.76)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
    padding: 25,
    alignItems: "center",
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.09)",
    marginBottom: 14,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
  },

  emptyText: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 290,
  },

  emptyButton: {
    marginTop: 18,
    backgroundColor:
      "rgba(37,99,235,0.10)",
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 13,
  },

  emptyButtonText: {
    color: BLUE,
    fontSize: 11,
    fontWeight: "900",
  },

  infoCard: {
    flexDirection: "row",
    marginTop: 18,
    padding: 15,
    borderRadius: 21,
    backgroundColor:
      "rgba(184,138,36,0.07)",
    borderWidth: 1,
    borderColor:
      "rgba(184,138,36,0.14)",
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(184,138,36,0.10)",
    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "900",
  },

  infoText: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  footer: {
    alignItems: "center",
    marginTop: 34,
  },

  footerLogo: {
    width: 34,
    height: 34,
    marginBottom: 6,
  },

  footerBrand: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "900",
  },

  footerTagline: {
    color: MUTED,
    fontSize: 9,
    marginTop: 3,
  },

  /* MODAL */

  modalWrapper: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor:
      "rgba(15,23,42,0.38)",
  },

  modalCard: {
    width: "100%",
    maxHeight: "91%",
    backgroundColor:
      "rgba(255,255,255,0.98)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.98)",
    paddingHorizontal: 21,
    paddingTop: 12,
    paddingBottom: 18,
  },

  modalContent: {
    paddingBottom: 20,
  },

  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D6DCE5",
    alignSelf: "center",
    marginBottom: 18,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  modalEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: GOLD,
  },

  modalTitle: {
    color: TEXT,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 3,
  },

  modalSubtitle: {
    color: MUTED,
    fontSize: 10,
    marginTop: 4,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(148,163,184,0.10)",
  },

  inputLabel: {
    color: TEXT,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 6,
  },

  inputContainer: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      "rgba(148,163,184,0.18)",
    backgroundColor:
      "rgba(248,250,252,0.94)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  currencyPrefix: {
    color: GOLD,
    fontSize: 14,
    fontWeight: "900",
    marginRight: 8,
  },

  input: {
    flex: 1,
    color: TEXT,
    fontSize: 14,
    fontWeight: "700",
    paddingVertical: 13,
  },

  noteInputContainer: {
    minHeight: 82,
    alignItems: "flex-start",
  },

  noteInput: {
    minHeight: 72,
    textAlignVertical: "top",
  },

  helperText: {
    color: "#8A95A6",
    fontSize: 9,
    marginTop: 5,
    marginBottom: 5,
  },

  categoryScroll: {
    gap: 8,
    paddingBottom: 4,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    height: 38,
    borderRadius: 13,
    backgroundColor:
      "rgba(37,99,235,0.06)",
    borderWidth: 1,
    borderColor:
      "rgba(37,99,235,0.10)",
  },

  categoryChipSelected: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },

  categoryChipText: {
    color: BLUE,
    fontSize: 10,
    fontWeight: "800",
  },

  categoryChipTextSelected: {
    color: "#FFFFFF",
  },

  frequencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  frequencyButton: {
    flex: 1,
    minWidth: "22%",
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    backgroundColor:
      "rgba(37,99,235,0.06)",
    borderWidth: 1,
    borderColor:
      "rgba(37,99,235,0.10)",
  },

  frequencyButtonSelected: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },

  frequencyText: {
    color: BLUE,
    fontSize: 9,
    fontWeight: "800",
  },

  frequencyTextSelected: {
    color: "#FFFFFF",
  },

  saveButton: {
    height: 53,
    borderRadius: 17,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 22,
    shadowColor: BLUE,
    shadowOpacity: 0.20,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 4,
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
});