import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
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
    addSavingsGoal,
    addToSavingsGoal,
    deleteSavingsGoal,
    getSavingsGoals,
    SavingsGoal,
    updateSavingsGoal,
} from "../db/database";

const BLUE = "#2563EB";
const BLUE_DARK = "#1D4ED8";
const GOLD = "#B88A24";
const BG = "#F5F8FC";
const TEXT = "#172033";
const MUTED = "#718096";
const BORDER = "rgba(255,255,255,0.85)";

export default function SavingsGoalsScreen() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);

  const [editingGoal, setEditingGoal] =
    useState<SavingsGoal | null>(null);

  const [selectedGoal, setSelectedGoal] =
    useState<SavingsGoal | null>(null);

  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const [moneyAmount, setMoneyAmount] = useState("");
  const [saving, setSaving] = useState(false);

  /* ─────────────────────────────────────────────
     LOAD GOALS
  ───────────────────────────────────────────── */

  const loadGoals = async () => {
    try {
      setLoading(true);

      const data = await getSavingsGoals();

      setGoals(data);
    } catch (error) {
      console.error(
        "❌ SAVINGS GOALS LOAD ERROR:",
        error
      );

      Alert.alert(
        "Couldn't load goals",
        "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [])
  );

  /* ─────────────────────────────────────────────
     SUMMARY
  ───────────────────────────────────────────── */

  const summary = useMemo(() => {
    const target = goals.reduce(
      (sum, goal) => sum + Number(goal.target_amount),
      0
    );

    const saved = goals.reduce(
      (sum, goal) => sum + Number(goal.saved_amount),
      0
    );

    const completed = goals.filter(
      (goal) =>
        Number(goal.saved_amount) >=
        Number(goal.target_amount)
    ).length;

    const percentage =
      target > 0
        ? Math.min((saved / target) * 100, 100)
        : 0;

    return {
      target,
      saved,
      completed,
      percentage,
    };
  }, [goals]);

  /* ─────────────────────────────────────────────
     CREATE / UPDATE
  ───────────────────────────────────────────── */

  const resetGoalForm = () => {
    setGoalName("");
    setTargetAmount("");
    setTargetDate("");
    setEditingGoal(null);
  };

  const openCreateModal = () => {
    resetGoalForm();
    setShowGoalModal(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setTargetAmount(String(goal.target_amount));
    setTargetDate(goal.target_date || "");
    setShowGoalModal(true);
  };

  const closeGoalModal = () => {
    if (saving) return;

    setShowGoalModal(false);
    resetGoalForm();
  };

  const handleSaveGoal = async () => {
    const name = goalName.trim();
    const amount = Number(targetAmount);

    if (!name) {
      Alert.alert(
        "Goal name required",
        "Please enter a name for your savings goal."
      );
      return;
    }

    if (!targetAmount || amount <= 0) {
      Alert.alert(
        "Invalid target",
        "Please enter a valid target amount."
      );
      return;
    }

    try {
      setSaving(true);

      if (editingGoal) {
        await updateSavingsGoal(
          editingGoal.id,
          name,
          amount,
          targetDate.trim()
        );

        Alert.alert(
          "Goal updated ✓",
          "Your savings goal has been updated."
        );
      } else {
        await addSavingsGoal(
          name,
          amount,
          targetDate.trim()
        );

        Alert.alert(
          "Goal created 🎯",
          "Your new savings goal is ready."
        );
      }

      setShowGoalModal(false);
      resetGoalForm();

      await loadGoals();
    } catch (error) {
      console.error(
        "❌ SAVINGS GOAL SAVE ERROR:",
        error
      );

      Alert.alert(
        "Couldn't save goal",
        "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────────────────────────────────
     ADD MONEY
  ───────────────────────────────────────────── */

  const openAddMoneyModal = (
    goal: SavingsGoal
  ) => {
    setSelectedGoal(goal);
    setMoneyAmount("");
    setShowAddMoneyModal(true);
  };

  const closeAddMoneyModal = () => {
    if (saving) return;

    setShowAddMoneyModal(false);
    setSelectedGoal(null);
    setMoneyAmount("");
  };

  const handleAddMoney = async () => {
    if (!selectedGoal) return;

    const amount = Number(moneyAmount);

    if (!moneyAmount || amount <= 0) {
      Alert.alert(
        "Invalid amount",
        "Please enter a valid amount to add."
      );
      return;
    }

    try {
      setSaving(true);

      await addToSavingsGoal(
        selectedGoal.id,
        amount
      );

      setShowAddMoneyModal(false);
      setSelectedGoal(null);
      setMoneyAmount("");

      await loadGoals();

      Alert.alert(
        "Money added ✓",
        `Rs. ${formatMoney(amount)} has been added to your goal.`
      );
    } catch (error) {
      console.error(
        "❌ ADD SAVINGS ERROR:",
        error
      );

      Alert.alert(
        "Couldn't add money",
        "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────────────────────────────────
     DELETE
  ───────────────────────────────────────────── */

  const handleDelete = (goal: SavingsGoal) => {
    Alert.alert(
      "Delete savings goal?",
      `"${goal.name}" will be permanently removed.`,
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
              await deleteSavingsGoal(
                goal.id
              );

              await loadGoals();

              Alert.alert(
                "Goal deleted",
                "The savings goal has been removed."
              );
            } catch (error) {
              console.error(
                "❌ SAVINGS GOAL DELETE ERROR:",
                error
              );

              Alert.alert(
                "Couldn't delete goal",
                "Please try again."
              );
            }
          },
        },
      ]
    );
  };

  /* ─────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────── */

  const formatMoney = (value: number) => {
    return Math.round(value).toLocaleString(
      "en-US"
    );
  };

  const getProgress = (
    goal: SavingsGoal
  ) => {
    if (
      Number(goal.target_amount) <= 0
    ) {
      return 0;
    }

    return Math.min(
      (Number(goal.saved_amount) /
        Number(goal.target_amount)) *
        100,
      100
    );
  };

  const getRemaining = (
    goal: SavingsGoal
  ) => {
    return Math.max(
      Number(goal.target_amount) -
        Number(goal.saved_amount),
      0
    );
  };

  const isCompleted = (
    goal: SavingsGoal
  ) => {
    return (
      Number(goal.saved_amount) >=
      Number(goal.target_amount)
    );
  };

  const formatTargetDate = (
    date: string
  ) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  /* ─────────────────────────────────────────────
     LOADING
  ───────────────────────────────────────────── */

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={BLUE}
          />

          <Text style={styles.loadingText}>
            Loading savings goals...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ─────────────────────────────────────────────
     SCREEN
  ───────────────────────────────────────────── */

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundDecorOne} />
      <View style={styles.backgroundDecorTwo} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.replace("/pro")
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={TEXT}
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>
                Savings Goals
              </Text>

              <View style={styles.proBadge}>
                <Ionicons
                  name="diamond"
                  size={10}
                  color={GOLD}
                />

                <Text
                  style={styles.proBadgeText}
                >
                  PRO
                </Text>
              </View>
            </View>

            <Text style={styles.subtitle}>
              Save with purpose. Grow with
              confidence.
            </Text>
          </View>
        </View>

        {/* SUMMARY CARD */}

        <View style={styles.summaryCard}>
          <View style={styles.summaryGlow} />

          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>
                TOTAL SAVED
              </Text>

              <Text
                style={styles.summaryAmount}
              >
                Rs.{" "}
                {formatMoney(
                  summary.saved
                )}
              </Text>
            </View>

            <View style={styles.summaryIcon}>
              <Ionicons
                name="trending-up"
                size={24}
                color={BLUE}
              />
            </View>
          </View>

          <View style={styles.summaryStats}>
            <View>
              <Text
                style={styles.statLabel}
              >
                TARGET
              </Text>

              <Text
                style={styles.statValue}
              >
                Rs.{" "}
                {formatMoney(
                  summary.target
                )}
              </Text>
            </View>

            <View>
              <Text
                style={styles.statLabel}
              >
                PROGRESS
              </Text>

              <Text
                style={styles.statValue}
              >
                {summary.percentage.toFixed(
                  0
                )}
                %
              </Text>
            </View>

            <View>
              <Text
                style={styles.statLabel}
              >
                COMPLETED
              </Text>

              <Text
                style={styles.statValue}
              >
                {summary.completed}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.summaryProgressTrack
            }
          >
            <View
              style={[
                styles.summaryProgressFill,
                {
                  width: `${summary.percentage}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* ADD BUTTON */}

        <TouchableOpacity
          style={styles.addGoalButton}
          onPress={openCreateModal}
          activeOpacity={0.85}
        >
          <View style={styles.addIcon}>
            <Ionicons
              name="add"
              size={22}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.addText}>
            <Text style={styles.addTitle}>
              Create Savings Goal
            </Text>

            <Text style={styles.addSubtitle}>
              Give your next milestone a
              purpose.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* SECTION HEADER */}

        <View style={styles.sectionHeader}>
          <View>
            <Text
              style={styles.sectionTitle}
            >
              Your Goals
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              {goals.length === 0
                ? "Start your first goal"
                : `${goals.length} goal${
                    goals.length === 1
                      ? ""
                      : "s"
                  } in progress`}
            </Text>
          </View>
        </View>

        {/* EMPTY STATE */}

        {goals.length === 0 && (
          <View style={styles.emptyCard}>
            <View
              style={styles.emptyIcon}
            >
              <Ionicons
                name="flag-outline"
                size={30}
                color={BLUE}
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              Start saving toward something
              meaningful
            </Text>

            <Text
              style={styles.emptyText}
            >
              Whether it's a new laptop,
              trip, education, or emergency
              fund, give your money a
              destination.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={openCreateModal}
              activeOpacity={0.85}
            >
              <Text
                style={
                  styles.emptyButtonText
                }
              >
                Create Your First Goal
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* GOALS */}

        {goals.map((goal) => {
          const progress =
            getProgress(goal);

          const completed =
            isCompleted(goal);

          return (
            <View
              key={goal.id}
              style={[
                styles.goalCard,
                completed &&
                  styles.completedCard,
              ]}
            >
              {/* CARD TOP */}

              <View
                style={styles.goalTop}
              >
                <View
                  style={[
                    styles.goalIcon,
                    completed &&
                      styles.completedIcon,
                  ]}
                >
                  <Ionicons
                    name={
                      completed
                        ? "checkmark"
                        : "flag-outline"
                    }
                    size={21}
                    color={
                      completed
                        ? "#FFFFFF"
                        : BLUE
                    }
                  />
                </View>

                <View
                  style={styles.goalInfo}
                >
                  <View
                    style={
                      styles.goalTitleRow
                    }
                  >
                    <Text
                      style={
                        styles.goalName
                      }
                      numberOfLines={1}
                    >
                      {goal.name}
                    </Text>

                    {completed && (
                      <View
                        style={
                          styles.completeBadge
                        }
                      >
                        <Text
                          style={
                            styles.completeBadgeText
                          }
                        >
                          COMPLETE
                        </Text>
                      </View>
                    )}
                  </View>

                  {goal.target_date ? (
                    <View
                      style={
                        styles.dateRow
                      }
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={MUTED}
                      />

                      <Text
                        style={
                          styles.dateText
                        }
                      >
                        Target:{" "}
                        {formatTargetDate(
                          goal.target_date
                        )}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={
                        styles.noDateText
                      }
                    >
                      No target date
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={
                    styles.moreButton
                  }
                  onPress={() =>
                    Alert.alert(
                      goal.name,
                      "Choose an action.",
                      [
                        {
                          text: "Edit",
                          onPress: () =>
                            openEditModal(
                              goal
                            ),
                        },
                        {
                          text: "Delete",
                          style:
                            "destructive",
                          onPress: () =>
                            handleDelete(
                              goal
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
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={19}
                    color={MUTED}
                  />
                </TouchableOpacity>
              </View>

              {/* AMOUNTS */}

              <View
                style={
                  styles.amountRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.savedLabel
                    }
                  >
                    SAVED
                  </Text>

                  <Text
                    style={
                      styles.savedAmount
                    }
                  >
                    Rs.{" "}
                    {formatMoney(
                      goal.saved_amount
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.targetAmountContainer
                  }
                >
                  <Text
                    style={
                      styles.savedLabel
                    }
                  >
                    TARGET
                  </Text>

                  <Text
                    style={
                      styles.targetAmount
                    }
                  >
                    Rs.{" "}
                    {formatMoney(
                      goal.target_amount
                    )}
                  </Text>
                </View>
              </View>

              {/* PROGRESS */}

              <View
                style={
                  styles.progressTrack
                }
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                    },
                    completed &&
                      styles.completedProgress,
                  ]}
                />
              </View>

              <View
                style={
                  styles.progressBottom
                }
              >
                <Text
                  style={
                    styles.progressText
                  }
                >
                  {progress.toFixed(0)}%
                  complete
                </Text>

                {!completed && (
                  <Text
                    style={
                      styles.remainingText
                    }
                  >
                    Rs.{" "}
                    {formatMoney(
                      getRemaining(
                        goal
                      )
                    )}{" "}
                    remaining
                  </Text>
                )}

                {completed && (
                  <Text
                    style={
                      styles.completedText
                    }
                  >
                    Goal achieved 🎉
                  </Text>
                )}
              </View>

              {/* ADD MONEY */}

              {!completed && (
                <TouchableOpacity
                  style={
                    styles.addMoneyButton
                  }
                  onPress={() =>
                    openAddMoneyModal(
                      goal
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color={BLUE}
                  />

                  <Text
                    style={
                      styles.addMoneyText
                    }
                  >
                    Add Money
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* PRO TIP */}

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons
              name="bulb-outline"
              size={19}
              color={GOLD}
            />
          </View>

          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>
              Spendly Tip
            </Text>

            <Text style={styles.tipText}>
              Small, consistent contributions
              can turn big goals into
              achievable milestones.
            </Text>
          </View>
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <View
            style={styles.footerLogo}
          >
            <Image
              source={require("../../assets/icon.png")}
              style={
                styles.footerLogoImage
              }
              resizeMode="contain"
            />

            <View>
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
                Smart Spending, Brighter
                Tomorrows
              </Text>
            </View>
          </View>

          <Text
            style={styles.footerPro}
          >
            Savings Goals · Pro
          </Text>
        </View>
      </ScrollView>

      {/* ─────────────────────────────────────────
         CREATE / EDIT GOAL MODAL
      ───────────────────────────────────────── */}

      {showGoalModal && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.keyboardWrapper}
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
            <View style={styles.modalCard}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.modalScrollContent
                }
                bounces={false}
              >
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
                      {editingGoal
                        ? "Edit Goal"
                        : "New Savings Goal"}
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      {editingGoal
                        ? "Update your milestone."
                        : "Give your money a destination."}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.modalClose
                    }
                    onPress={
                      closeGoalModal
                    }
                    disabled={saving}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={TEXT}
                    />
                  </TouchableOpacity>
                </View>

                <Text
                  style={styles.inputLabel}
                >
                  GOAL NAME
                </Text>

                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <Ionicons
                    name="flag-outline"
                    size={18}
                    color={BLUE}
                  />

                  <TextInput
                    value={goalName}
                    onChangeText={
                      setGoalName
                    }
                    placeholder="e.g. New Laptop"
                    placeholderTextColor="#A0A9B8"
                    style={
                      styles.input
                    }
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                <Text
                  style={styles.inputLabel}
                >
                  TARGET AMOUNT
                </Text>

                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <Text
                    style={
                      styles.currencyText
                    }
                  >
                    Rs.
                  </Text>

                  <TextInput
                    value={
                      targetAmount
                    }
                    onChangeText={
                      setTargetAmount
                    }
                    placeholder="250000"
                    placeholderTextColor="#A0A9B8"
                    keyboardType="numeric"
                    style={
                      styles.input
                    }
                    returnKeyType="next"
                  />
                </View>

                <Text
                  style={styles.inputLabel}
                >
                  TARGET DATE{" "}
                  <Text
                    style={
                      styles.optionalText
                    }
                  >
                    (optional)
                  </Text>
                </Text>

                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={BLUE}
                  />

                  <TextInput
                    value={
                      targetDate
                    }
                    onChangeText={
                      setTargetDate
                    }
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#A0A9B8"
                    style={
                      styles.input
                    }
                    returnKeyType="done"
                  />
                </View>

                <TouchableOpacity
                  style={
                    styles.primaryButton
                  }
                  onPress={
                    handleSaveGoal
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
                      color="#FFFFFF"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name={
                          editingGoal
                            ? "checkmark"
                            : "add"
                        }
                        size={19}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.primaryButtonText
                        }
                      >
                        {editingGoal
                          ? "Save Changes"
                          : "Create Goal"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* ─────────────────────────────────────────
         ADD MONEY MODAL
      ───────────────────────────────────────── */}

      {showAddMoneyModal &&
        selectedGoal && (
          <View
            style={
              styles.modalOverlay
            }
          >
            <KeyboardAvoidingView
              style={
                styles.keyboardWrapper
              }
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
                  bounces={false}
                >
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
                        Add Money
                      </Text>

                      <Text
                        style={
                          styles.modalSubtitle
                        }
                        numberOfLines={2}
                      >
                        {selectedGoal.name}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={
                        styles.modalClose
                      }
                      onPress={
                        closeAddMoneyModal
                      }
                      disabled={
                        saving
                      }
                    >
                      <Ionicons
                        name="close"
                        size={20}
                        color={TEXT}
                      />
                    </TouchableOpacity>
                  </View>

                  <View
                    style={
                      styles.moneyProgressCard
                    }
                  >
                    <Text
                      style={
                        styles.moneyProgressLabel
                      }
                    >
                      CURRENT PROGRESS
                    </Text>

                    <Text
                      style={
                        styles.moneyProgressAmount
                      }
                    >
                      Rs.{" "}
                      {formatMoney(
                        selectedGoal.saved_amount
                      )}
                    </Text>

                    <Text
                      style={
                        styles.moneyProgressTarget
                      }
                    >
                      of Rs.{" "}
                      {formatMoney(
                        selectedGoal.target_amount
                      )}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    AMOUNT TO ADD
                  </Text>

                  <View
                    style={
                      styles.inputContainer
                    }
                  >
                    <Text
                      style={
                        styles.currencyText
                      }
                    >
                      Rs.
                    </Text>

                    <TextInput
                      value={
                        moneyAmount
                      }
                      onChangeText={
                        setMoneyAmount
                      }
                      placeholder="10000"
                      placeholderTextColor="#A0A9B8"
                      keyboardType="numeric"
                      style={
                        styles.input
                      }
                      autoFocus
                      returnKeyType="done"
                    />
                  </View>

                  <TouchableOpacity
                    style={
                      styles.primaryButton
                    }
                    onPress={
                      handleAddMoney
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
                        color="#FFFFFF"
                      />
                    ) : (
                      <>
                        <Ionicons
                          name="wallet-outline"
                          size={19}
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.primaryButtonText
                          }
                        >
                          Add Money
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */

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
    paddingTop: 14,
    paddingBottom: 40,
  },

  backgroundDecorOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor:
      "rgba(37,99,235,0.055)",
    top: -90,
    right: -80,
  },

  backgroundDecorTwo: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor:
      "rgba(184,138,36,0.045)",
    bottom: 100,
    left: -100,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: MUTED,
    fontWeight: "600",
  },

  /* HEADER */

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor:
      "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
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

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
    fontWeight: "500",
  },

  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor:
      "rgba(184,138,36,0.10)",
    borderWidth: 1,
    borderColor:
      "rgba(184,138,36,0.18)",
  },

  proBadgeText: {
    marginLeft: 4,
    fontSize: 8,
    color: GOLD,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  /* SUMMARY */

  summaryCard: {
    overflow: "hidden",
    borderRadius: 24,
    padding: 20,
    backgroundColor:
      "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#64748B",
    shadowOpacity: 0.09,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 9,
    },
    elevation: 3,
    marginBottom: 14,
  },

  summaryGlow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor:
      "rgba(37,99,235,0.055)",
    right: -40,
    top: -45,
  },

  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: 9,
    color: MUTED,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  summaryAmount: {
    marginTop: 5,
    fontSize: 29,
    color: TEXT,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor:
      "rgba(37,99,235,0.09)",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  statLabel: {
    fontSize: 8,
    color: MUTED,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  statValue: {
    marginTop: 4,
    fontSize: 13,
    color: TEXT,
    fontWeight: "800",
  },

  summaryProgressTrack: {
    height: 8,
    borderRadius: 10,
    backgroundColor:
      "rgba(37,99,235,0.08)",
    marginTop: 18,
    overflow: "hidden",
  },

  summaryProgressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: BLUE,
  },

  /* CREATE BUTTON */

  addGoalButton: {
    minHeight: 74,
    borderRadius: 21,
    backgroundColor: BLUE,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: BLUE,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
    marginBottom: 25,
  },

  addIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor:
      "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  addText: {
    flex: 1,
    marginLeft: 12,
  },

  addTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "900",
  },

  addSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },

  /* SECTION */

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    color: TEXT,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: MUTED,
    fontWeight: "500",
  },

  /* EMPTY */

  emptyCard: {
    alignItems: "center",
    padding: 25,
    borderRadius: 23,
    backgroundColor:
      "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#64748B",
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 2,
    marginBottom: 16,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor:
      "rgba(37,99,235,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  emptyTitle: {
    textAlign: "center",
    fontSize: 16,
    color: TEXT,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 18,
    color: MUTED,
    fontWeight: "500",
  },

  emptyButton: {
    marginTop: 17,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor:
      "rgba(37,99,235,0.09)",
  },

  emptyButtonText: {
    color: BLUE,
    fontSize: 11,
    fontWeight: "900",
  },

  /* GOAL CARD */

  goalCard: {
    borderRadius: 23,
    padding: 18,
    marginBottom: 14,
    backgroundColor:
      "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#64748B",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 2,
  },

  completedCard: {
    borderColor:
      "rgba(37,99,235,0.18)",
    backgroundColor:
      "rgba(248,251,255,0.82)",
  },

  goalTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  goalIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor:
      "rgba(37,99,235,0.09)",
    alignItems: "center",
    justifyContent: "center",
  },

  completedIcon: {
    backgroundColor: BLUE,
  },

  goalInfo: {
    flex: 1,
    marginLeft: 11,
  },

  goalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  goalName: {
    maxWidth: "75%",
    fontSize: 14,
    color: TEXT,
    fontWeight: "900",
  },

  completeBadge: {
    marginLeft: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor:
      "rgba(37,99,235,0.09)",
  },

  completeBadgeText: {
    fontSize: 7,
    color: BLUE,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  dateText: {
    marginLeft: 4,
    fontSize: 9,
    color: MUTED,
    fontWeight: "500",
  },

  noDateText: {
    marginTop: 5,
    fontSize: 9,
    color: "#9AA4B2",
    fontWeight: "500",
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

  /* AMOUNTS */

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 19,
  },

  targetAmountContainer: {
    alignItems: "flex-end",
  },

  savedLabel: {
    fontSize: 8,
    color: MUTED,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  savedAmount: {
    marginTop: 4,
    fontSize: 19,
    color: TEXT,
    fontWeight: "900",
  },

  targetAmount: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
    fontWeight: "800",
  },

  /* PROGRESS */

  progressTrack: {
    height: 9,
    borderRadius: 10,
    backgroundColor:
      "rgba(37,99,235,0.08)",
    marginTop: 15,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: BLUE,
  },

  completedProgress: {
    backgroundColor: BLUE_DARK,
  },

  progressBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },

  progressText: {
    fontSize: 9,
    color: BLUE,
    fontWeight: "900",
  },

  remainingText: {
    fontSize: 9,
    color: MUTED,
    fontWeight: "600",
  },

  completedText: {
    fontSize: 9,
    color: BLUE,
    fontWeight: "900",
  },

  /* ADD MONEY */

  addMoneyButton: {
    height: 40,
    borderRadius: 13,
    marginTop: 14,
    backgroundColor:
      "rgba(37,99,235,0.07)",
    borderWidth: 1,
    borderColor:
      "rgba(37,99,235,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  addMoneyText: {
    marginLeft: 7,
    fontSize: 10,
    color: BLUE,
    fontWeight: "900",
  },

  /* TIP */

  tipCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 19,
    backgroundColor:
      "rgba(184,138,36,0.07)",
    borderWidth: 1,
    borderColor:
      "rgba(184,138,36,0.12)",
    marginTop: 4,
    marginBottom: 22,
  },

  tipIcon: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor:
      "rgba(184,138,36,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  tipContent: {
    flex: 1,
    marginLeft: 10,
  },

  tipTitle: {
    fontSize: 10,
    color: GOLD,
    fontWeight: "900",
  },

  tipText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
    color: MUTED,
    fontWeight: "500",
  },

  /* FOOTER */

  footer: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 18,
  },

  footerLogo: {
    flexDirection: "row",
    alignItems: "center",
  },

  footerLogoImage: {
    width: 34,
    height: 34,
    marginRight: 8,
  },

  footerBrand: {
    fontSize: 12,
    color: TEXT,
    fontWeight: "900",
  },

  footerTagline: {
    marginTop: 2,
    fontSize: 8,
    color: MUTED,
    fontWeight: "500",
  },

  footerPro: {
    marginTop: 7,
    fontSize: 8,
    color: GOLD,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  /* ─────────────────────────────────────────
     KEYBOARD-AWARE MODALS
  ───────────────────────────────────────── */

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      "rgba(15,23,42,0.38)",
    justifyContent: "flex-end",
  },

  /*
   * This wrapper shrinks when the keyboard
   * appears, allowing the modal to move above it.
   */
  keyboardWrapper: {
    width: "100%",
    maxHeight: "100%",
    justifyContent: "flex-end",
  },

  modalCard: {
    width: "100%",
    maxHeight: "90%",
    backgroundColor:
      "rgba(255,255,255,0.97)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
  },

  /*
   * The form itself becomes scrollable when
   * the keyboard reduces the available height.
   */
  modalScrollContent: {
    paddingBottom: 18,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 21,
  },

  modalTitle: {
    fontSize: 20,
    color: TEXT,
    fontWeight: "900",
  },

  modalSubtitle: {
    marginTop: 4,
    fontSize: 10,
    color: MUTED,
    fontWeight: "500",
    maxWidth: 260,
  },

  modalClose: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor:
      "rgba(100,116,139,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },

  inputLabel: {
    marginBottom: 7,
    fontSize: 8,
    color: MUTED,
    fontWeight: "900",
    letterSpacing: 0.9,
  },

  optionalText: {
    fontSize: 8,
    color: "#9AA4B2",
    fontWeight: "600",
  },

  inputContainer: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor:
      "rgba(245,248,252,0.95)",
    borderWidth: 1,
    borderColor:
      "rgba(148,163,184,0.16)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 15,
  },

  input: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
    color: TEXT,
    fontWeight: "700",
    paddingVertical: 0,
  },

  currencyText: {
    fontSize: 12,
    color: BLUE,
    fontWeight: "900",
  },

  primaryButton: {
    height: 53,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 5,
    shadowColor: BLUE,
    shadowOpacity: 0.20,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 3,
  },

  primaryButtonText: {
    marginLeft: 7,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  moneyProgressCard: {
    padding: 16,
    borderRadius: 17,
    backgroundColor:
      "rgba(37,99,235,0.07)",
    borderWidth: 1,
    borderColor:
      "rgba(37,99,235,0.10)",
    marginBottom: 19,
  },

  moneyProgressLabel: {
    fontSize: 8,
    color: BLUE,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  moneyProgressAmount: {
    marginTop: 5,
    fontSize: 24,
    color: TEXT,
    fontWeight: "900",
  },

  moneyProgressTarget: {
    marginTop: 2,
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
  },
});