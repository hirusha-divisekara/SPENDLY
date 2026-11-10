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
    addSavingsGoal,
    addToSavingsGoal,
    deleteSavingsGoal,
    getSavingsGoals,
    SavingsGoal,
    updateSavingsGoal,
    updateSavingsGoalAmount,
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

export default function SavingsGoalsScreen() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] =
    useState<SavingsGoal | null>(null);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const [addMoneyGoal, setAddMoneyGoal] =
    useState<SavingsGoal | null>(null);
  const [addMoneyAmount, setAddMoneyAmount] =
    useState("");

  const loadGoals = async () => {
    if (!(await requirePro())) {
      return;
    }

    try {
      setLoading(true);

      const data = await getSavingsGoals();

      setGoals(data);
    } catch (error) {
      console.error("Failed to load savings goals:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [])
  );

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setSavedAmount("");
    setEditingGoal(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.target_amount));
    setSavedAmount(String(goal.saved_amount));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSaveGoal = async () => {
    const cleanName = name.trim();
    const target = Number(targetAmount);
    const saved = Number(savedAmount || "0");

    if (!cleanName) {
      Alert.alert(
        "Missing name",
        "Please enter a name for your savings goal."
      );
      return;
    }

    if (!target || target <= 0) {
      Alert.alert(
        "Invalid target",
        "Please enter a valid target amount."
      );
      return;
    }

    if (saved < 0) {
      Alert.alert(
        "Invalid amount",
        "Saved amount cannot be negative."
      );
      return;
    }

    if (saved > target) {
      Alert.alert(
        "Amount too high",
        "Saved amount cannot be greater than your target."
      );
      return;
    }

    try {
      setSaving(true);

      if (editingGoal) {
        await updateSavingsGoal(
          editingGoal.id,
          cleanName,
          target
        );

        if (saved !== Number(editingGoal.saved_amount)) {
          await updateSavingsGoalAmount(
            editingGoal.id,
            saved
          );
        }
      } else {
        await addSavingsGoal(
          cleanName,
          target,
          saved
        );
      }

      closeModal();
      await loadGoals();
    } catch (error) {
      console.error("Failed to save savings goal:", error);

      Alert.alert(
        "Something went wrong",
        "Could not save your savings goal."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = (goal: SavingsGoal) => {
    Alert.alert(
      "Delete savings goal?",
      `Are you sure you want to delete "${goal.name}"?`,
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
              await deleteSavingsGoal(goal.id);
              await loadGoals();
            } catch (error) {
              console.error(
                "Failed to delete savings goal:",
                error
              );

              Alert.alert(
                "Something went wrong",
                "Could not delete this savings goal."
              );
            }
          },
        },
      ]
    );
  };

  const openAddMoneyModal = (goal: SavingsGoal) => {
    setAddMoneyGoal(goal);
    setAddMoneyAmount("");
  };

  const closeAddMoneyModal = () => {
    setAddMoneyGoal(null);
    setAddMoneyAmount("");
  };

  const handleAddMoney = async () => {
    if (!addMoneyGoal) return;

    const amount = Number(addMoneyAmount);

    if (!amount || amount <= 0) {
      Alert.alert(
        "Invalid amount",
        "Please enter a valid amount to add."
      );
      return;
    }

    const currentSaved = Number(
      addMoneyGoal.saved_amount
    );

    const target = Number(
      addMoneyGoal.target_amount
    );

    if (currentSaved + amount > target) {
      Alert.alert(
        "Amount too high",
        "This amount would take you above your savings target."
      );
      return;
    }

    try {
      setSaving(true);

      await addToSavingsGoal(
        addMoneyGoal.id,
        amount
      );

      closeAddMoneyModal();
      await loadGoals();
    } catch (error) {
      console.error(
        "Failed to add money to savings goal:",
        error
      );

      Alert.alert(
        "Something went wrong",
        "Could not update this savings goal."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${Math.round(amount).toLocaleString(
      "en-LK"
    )}`;
  };

  const getProgress = (goal: SavingsGoal) => {
    const target = Number(goal.target_amount);

    if (!target || target <= 0) {
      return 0;
    }

    return Math.min(
      100,
      (Number(goal.saved_amount) /
        target) *
        100
    );
  };

  const getRemaining = (goal: SavingsGoal) => {
    return Math.max(
      0,
      Number(goal.target_amount) -
        Number(goal.saved_amount)
    );
  };

  const totalTarget = goals.reduce(
    (sum, goal) =>
      sum + Number(goal.target_amount),
    0
  );

  const totalSaved = goals.reduce(
    (sum, goal) =>
      sum + Number(goal.saved_amount),
    0
  );

  const overallProgress =
    totalTarget > 0
      ? Math.min(
          100,
          (totalSaved / totalTarget) * 100
        )
      : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.container
        }
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
              Savings Goals
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Turn your plans into progress
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

        {/* Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewGlow} />

          <View style={styles.overviewTopRow}>
            <View>
              <Text style={styles.eyebrow}>
                SAVINGS JOURNEY
              </Text>

              <Text style={styles.overviewTitle}>
                {formatCurrency(totalSaved)}
              </Text>

              <Text style={styles.overviewSubtitle}>
                saved across {goals.length}{" "}
                {goals.length === 1
                  ? "goal"
                  : "goals"}
              </Text>
            </View>

            <View style={styles.overviewIcon}>
              <Ionicons
                name="sparkles-outline"
                size={23}
                color={GOLD}
              />
            </View>
          </View>

          <View style={styles.overviewProgressTrack}>
            <View
              style={[
                styles.overviewProgressFill,
                {
                  width: `${overallProgress}%`,
                },
              ]}
            />
          </View>

          <View style={styles.overviewBottomRow}>
            <Text style={styles.overviewProgressText}>
              {Math.round(
                overallProgress
              )}
              % complete
            </Text>

            <Text style={styles.overviewTargetText}>
              Target{" "}
              {formatCurrency(totalTarget)}
            </Text>
          </View>
        </View>

        {/* Add button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreateModal}
          activeOpacity={0.85}
        >
          <View style={styles.addButtonIcon}>
            <Ionicons
              name="add"
              size={21}
              color={WHITE}
            />
          </View>

          <View style={styles.addButtonContent}>
            <Text style={styles.addButtonTitle}>
              Create savings goal
            </Text>

            <Text style={styles.addButtonSubtitle}>
              Give your next milestone a purpose
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={MUTED}
          />
        </TouchableOpacity>

        {/* Goals */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Your goals
            </Text>

            <Text style={styles.sectionSubtitle}>
              Keep moving toward what matters
            </Text>
          </View>

          <Text style={styles.goalCount}>
            {goals.length}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={BLUE}
            />

            <Text style={styles.loadingText}>
              Loading your goals...
            </Text>
          </View>
        ) : goals.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="flag-outline"
                size={28}
                color={BLUE}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No savings goals yet
            </Text>

            <Text style={styles.emptyText}>
              Create your first goal and start
              building toward something
              meaningful.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={openCreateModal}
              activeOpacity={0.85}
            >
              <Ionicons
                name="add"
                size={17}
                color={WHITE}
              />

              <Text
                style={styles.emptyButtonText}
              >
                Create a goal
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.goalList}>
            {goals.map((goal) => {
              const progress =
                getProgress(goal);

              const remaining =
                getRemaining(goal);

              const completed =
                progress >= 100;

              return (
                <View
                  key={goal.id}
                  style={styles.goalCard}
                >
                  <View
                    style={
                      styles.goalCardTop
                    }
                  >
                    <View
                      style={
                        styles.goalIcon
                      }
                    >
                      <Ionicons
                        name={
                          completed
                            ? "checkmark-circle"
                            : "flag-outline"
                        }
                        size={21}
                        color={
                          completed
                            ? GREEN
                            : BLUE
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.goalHeaderContent
                      }
                    >
                      <Text
                        style={
                          styles.goalName
                        }
                      >
                        {goal.name}
                      </Text>

                      <Text
                        style={
                          styles.goalTarget
                        }
                      >
                        Target{" "}
                        {formatCurrency(
                          Number(
                            goal.target_amount
                          )
                        )}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={
                        styles.moreButton
                      }
                      onPress={() =>
                        Alert.alert(
                          goal.name,
                          "Choose an action",
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
                                handleDeleteGoal(
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
                      activeOpacity={0.8}
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
                        {formatCurrency(
                          Number(
                            goal.saved_amount
                          )
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.percentageBadge
                      }
                    >
                      <Text
                        style={
                          styles.percentageText
                        }
                      >
                        {Math.round(
                          progress
                        )}
                        %
                      </Text>
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
                          width: `${progress}%`,
                        },
                      ]}
                    />
                  </View>

                  <View
                    style={
                      styles.goalBottomRow
                    }
                  >
                    <Text
                      style={
                        styles.remainingText
                      }
                    >
                      {completed
                        ? "Goal completed 🎉"
                        : `${formatCurrency(
                            remaining
                          )} remaining`}
                    </Text>

                    <Text
                      style={
                        styles.progressSmall
                      }
                    >
                      {Math.round(
                        progress
                      )}
                      /100
                    </Text>
                  </View>

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
                      activeOpacity={
                        0.85
                      }
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
                        Add money
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Premium insight */}
        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Ionicons
              name="bulb-outline"
              size={22}
              color={GOLD}
            />
          </View>

          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>
              SPENDLY PRO
            </Text>

            <Text style={styles.insightTitle}>
              Small progress still counts.
            </Text>

            <Text
              style={
                styles.insightDescription
              }
            >
              Keep your goals visible and
              contribute consistently. Your
              future self will thank you.
            </Text>
          </View>
        </View>

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

          <Text
            style={styles.footerTagline}
          >
            Smart Spending, Brighter Tomorrows
          </Text>

          <Text
            style={styles.footerSmall}
          >
            Build the future you want, one
            goal at a time.
          </Text>
        </View>
      </ScrollView>

      {/* Create / Edit Goal Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
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
          <View
            style={styles.modalOverlay}
          >
            <View
              style={styles.modalCard}
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
                      {editingGoal
                        ? "Edit goal"
                        : "Create savings goal"}
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      {editingGoal
                        ? "Update your savings target"
                        : "Give your money a destination"}
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
                    GOAL NAME
                  </Text>

                  <View
                    style={
                      styles.inputWrapper
                    }
                  >
                    <Ionicons
                      name="flag-outline"
                      size={18}
                      color={
                        MUTED
                      }
                    />

                    <TextInput
                      value={
                        name
                      }
                      onChangeText={
                        setName
                      }
                      placeholder="e.g. New laptop"
                      placeholderTextColor="#94A3B8"
                      style={
                        styles.input
                      }
                      returnKeyType="next"
                    />
                  </View>
                </View>

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
                    TARGET AMOUNT
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
                        targetAmount
                      }
                      onChangeText={
                        setTargetAmount
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
                    ALREADY SAVED
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
                        savedAmount
                      }
                      onChangeText={
                        setSavedAmount
                      }
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      style={
                        styles.input
                      }
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={
                    styles.saveButton
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
                      color={
                        WHITE
                      }
                    />
                  ) : (
                    <>
                      <Ionicons
                        name={
                          editingGoal
                            ? "checkmark"
                            : "add"
                        }
                        size={
                          19
                        }
                        color={
                          WHITE
                        }
                      />

                      <Text
                        style={
                          styles.saveButtonText
                        }
                      >
                        {editingGoal
                          ? "Update goal"
                          : "Create goal"}
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

      {/* Add Money Modal */}
      <Modal
        visible={
          Boolean(
            addMoneyGoal
          )
        }
        transparent
        animationType="slide"
        onRequestClose={
          closeAddMoneyModal
        }
      >
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
          <View
            style={styles.modalOverlay}
          >
            <View
              style={styles.modalCard}
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
                    styles.modalHandle
                  }
                />

                <View
                  style={
                    styles.modalHeader
                  }
                >
                  <View
                    style={
                      styles.addMoneyHeader
                    }
                  >
                    <View
                      style={
                        styles.addMoneyModalIcon
                      }
                    >
                      <Ionicons
                        name="wallet-outline"
                        size={21}
                        color={
                          BLUE
                        }
                      />
                    </View>

                    <View>
                      <Text
                        style={
                          styles.modalTitle
                        }
                      >
                        Add money
                      </Text>

                      <Text
                        style={
                          styles.modalSubtitle
                        }
                      >
                        {addMoneyGoal?.name}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.modalClose
                    }
                    onPress={
                      closeAddMoneyModal
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

                <View
                  style={
                    styles.moneySummary
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.moneySummaryLabel
                      }
                    >
                      CURRENTLY SAVED
                    </Text>

                    <Text
                      style={
                        styles.moneySummaryValue
                      }
                    >
                      {addMoneyGoal
                        ? formatCurrency(
                            Number(
                              addMoneyGoal.saved_amount
                            )
                          )
                        : "Rs. 0"}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.moneySummaryDivider
                    }
                  />

                  <View>
                    <Text
                      style={
                        styles.moneySummaryLabel
                      }
                    >
                      TARGET
                    </Text>

                    <Text
                      style={
                        styles.moneySummaryValue
                      }
                    >
                      {addMoneyGoal
                        ? formatCurrency(
                            Number(
                              addMoneyGoal.target_amount
                            )
                          )
                        : "Rs. 0"}
                    </Text>
                  </View>
                </View>

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
                    AMOUNT TO ADD
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
                        addMoneyAmount
                      }
                      onChangeText={
                        setAddMoneyAmount
                      }
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      style={
                        styles.input
                      }
                      autoFocus
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={
                    styles.saveButton
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
                      color={
                        WHITE
                      }
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="add-circle-outline"
                        size={
                          19
                        }
                        color={
                          WHITE
                        }
                      />

                      <Text
                        style={
                          styles.saveButtonText
                        }
                      >
                        Add to goal
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.cancelButton
                  }
                  onPress={
                    closeAddMoneyModal
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

  overviewCard: {
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

  overviewGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor:
      "rgba(37,99,235,0.07)",
    right: -85,
    top: -85,
  },

  overviewTopRow: {
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

  overviewTitle: {
    marginTop: 8,
    fontSize: 31,
    color: TEXT,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  overviewSubtitle: {
    marginTop: 3,
    fontSize: 10.5,
    color: MUTED,
    fontWeight: "600",
  },

  overviewIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(184,138,36,0.10)",
    borderWidth: 1,
    borderColor:
      "rgba(184,138,36,0.17)",
  },

  overviewProgressTrack: {
    height: 9,
    borderRadius: 10,
    backgroundColor: "#E8EEF7",
    overflow: "hidden",
    marginTop: 20,
  },

  overviewProgressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: BLUE,
  },

  overviewBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },

  overviewProgressText: {
    fontSize: 9.5,
    color: BLUE,
    fontWeight: "800",
  },

  overviewTargetText: {
    fontSize: 9.5,
    color: MUTED,
    fontWeight: "600",
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

  goalCount: {
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

  goalList: {
    gap: 13,
  },

  goalCard: {
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

  goalCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  goalIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor:
      "rgba(37,99,235,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  goalHeaderContent: {
    flex: 1,
    marginLeft: 11,
  },

  goalName: {
    fontSize: 13,
    color: TEXT,
    fontWeight: "900",
  },

  goalTarget: {
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
    marginTop: 19,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  savedLabel: {
    fontSize: 8,
    color: MUTED,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  savedAmount: {
    marginTop: 3,
    fontSize: 20,
    color: TEXT,
    fontWeight: "900",
  },

  percentageBadge: {
    paddingHorizontal: 9,
    minHeight: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.08)",
  },

  percentageText: {
    fontSize: 10,
    color: BLUE,
    fontWeight: "900",
  },

  progressTrack: {
    height: 8,
    borderRadius: 10,
    backgroundColor: "#E8EEF7",
    overflow: "hidden",
    marginTop: 14,
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: BLUE,
  },

  goalBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },

  remainingText: {
    fontSize: 9.5,
    color: MUTED,
    fontWeight: "600",
  },

  progressSmall: {
    fontSize: 9,
    color: MUTED,
    fontWeight: "700",
  },

  addMoneyButton: {
    height: 40,
    marginTop: 14,
    borderRadius: 13,
    backgroundColor:
      "rgba(37,99,235,0.07)",
    borderWidth: 1,
    borderColor:
      "rgba(37,99,235,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  addMoneyText: {
    marginLeft: 6,
    fontSize: 10,
    color: BLUE,
    fontWeight: "900",
  },

  insightCard: {
    marginTop: 15,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    backgroundColor:
      "rgba(184,138,36,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(184,138,36,0.18)",
  },

  insightIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor:
      "rgba(184,138,36,0.12)",
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

  addMoneyHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  addMoneyModalIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor:
      "rgba(37,99,235,0.09)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
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

  moneySummary: {
    minHeight: 82,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor:
      "rgba(37,99,235,0.06)",
    borderWidth: 1,
    borderColor:
      "rgba(37,99,235,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 20,
  },

  moneySummaryLabel: {
    fontSize: 7.5,
    color: MUTED,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  moneySummaryValue: {
    marginTop: 4,
    fontSize: 13,
    color: TEXT,
    fontWeight: "900",
  },

  moneySummaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: "#DCE5F2",
  },
});