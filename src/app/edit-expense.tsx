import { Ionicons } from "@expo/vector-icons";
import {
    router,
    useLocalSearchParams,
} from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    deleteExpense,
    getExpenseById,
    updateExpense,
} from "../db/database";

const categories = [
  {
    name: "Food",
    icon: "restaurant-outline",
    color: "#F97316",
  },
  {
    name: "Transport",
    icon: "car-outline",
    color: "#3B82F6",
  },
  {
    name: "Shopping",
    icon: "bag-handle-outline",
    color: "#EC4899",
  },
  {
    name: "Bills",
    icon: "receipt-outline",
    color: "#8B5CF6",
  },
  {
    name: "Entertainment",
    icon: "game-controller-outline",
    color: "#10B981",
  },
  {
    name: "Health",
    icon: "medkit-outline",
    color: "#EF4444",
  },
  {
    name: "Other",
    icon: "ellipsis-horizontal-circle-outline",
    color: "#64748B",
  },
];

export default function EditExpenseScreen() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("Food");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExpense();
  }, [id]);

  const loadExpense = async () => {
    try {
      if (!id) return;

      const expense =
        await getExpenseById(Number(id));

      if (!expense) {
        Alert.alert(
          "Expense not found",
          "This expense no longer exists.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );

        return;
      }

      setAmount(String(expense.amount));
      setSelectedCategory(expense.category);
      setNote(expense.note);
    } catch (error) {
      console.error(
        "❌ LOAD EXPENSE ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Couldn't load this expense."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    const numericAmount = Number(amount);

    if (!amount || numericAmount <= 0) {
      Alert.alert(
        "Invalid amount",
        "Please enter a valid expense amount."
      );
      return;
    }

    if (!id || saving) return;

    try {
      setSaving(true);

      await updateExpense(
        Number(id),
        numericAmount,
        selectedCategory,
        note.trim()
      );

      Alert.alert(
        "Expense updated ✓",
        "Your changes have been saved.",
        [
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error(
        "❌ UPDATE ERROR:",
        error
      );

      Alert.alert(
        "Couldn't update expense",
        "Something went wrong while updating this expense."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;

    Alert.alert(
      "Delete expense?",
      "This expense will be permanently removed.",
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
              await deleteExpense(
                Number(id)
              );

              Alert.alert(
                "Expense deleted",
                "The expense has been removed.",
                [
                  {
                    text: "Done",
                    onPress: () =>
                      router.back(),
                  },
                ]
              );
            } catch (error) {
              console.error(
                "❌ DELETE ERROR:",
                error
              );

              Alert.alert(
                "Couldn't delete expense",
                "Something went wrong while deleting this expense."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingGlass}>
            <View style={styles.loadingIcon}>
              <Ionicons
                name="wallet-outline"
                size={22}
                color="#2563EB"
              />
            </View>

            <Text style={styles.loadingText}>
              Loading expense...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative background */}
      <View style={styles.backgroundOrbOne} />
      <View style={styles.backgroundOrbTwo} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.75}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#163A63"
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.eyebrow}>
              SPENDLY
            </Text>

            <Text style={styles.title}>
              Edit Expense
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* AMOUNT CARD */}
        <View style={styles.amountCard}>
          <View style={styles.cardGlow} />

          <View style={styles.amountTopRow}>
            <View>
              <Text style={styles.amountLabel}>
                Update the amount
              </Text>

              <Text style={styles.amountHint}>
                Keep your spending history accurate
              </Text>
            </View>

            <View style={styles.rupeeBadge}>
              <Text style={styles.rupeeBadgeText}>
                LKR
              </Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.currency}>
              Rs.
            </Text>

            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#A8B8C9"
            />
          </View>

          <View style={styles.amountUnderline} />
        </View>

        {/* CATEGORY */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Category
              </Text>

              <Text style={styles.sectionSubtitle}>
                Update what this expense was for
              </Text>
            </View>

            <View style={styles.selectedPill}>
              <Text style={styles.selectedPillText}>
                {selectedCategory}
              </Text>
            </View>
          </View>

          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const selected =
                selectedCategory ===
                category.name;

              return (
                <TouchableOpacity
                  key={category.name}
                  onPress={() =>
                    setSelectedCategory(
                      category.name
                    )
                  }
                  style={[
                    styles.categoryCard,
                    selected &&
                      styles.categoryCardSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor:
                          `${category.color}18`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        category.icon as any
                      }
                      size={23}
                      color={
                        category.color
                      }
                    />
                  </View>

                  <Text
                    style={[
                      styles.categoryText,
                      selected &&
                        styles.categoryTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>

                  {selected && (
                    <View
                      style={styles.check}
                    >
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* NOTE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Note
              </Text>

              <Text style={styles.sectionSubtitle}>
                Update the details if needed
              </Text>
            </View>

            <Text style={styles.optional}>
              Optional
            </Text>
          </View>

          <View style={styles.noteCard}>
            <View style={styles.noteIcon}>
              <Ionicons
                name="create-outline"
                size={20}
                color="#2563EB"
              />
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Lunch with friends"
              placeholderTextColor="#8EA0B4"
              style={styles.noteInput}
              multiline
              textAlignVertical="top"
              maxLength={120}
            />
          </View>

          <Text style={styles.characterCount}>
            {note.length}/120
          </Text>
        </View>

        {/* SAVE CHANGES */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            saving &&
              styles.disabledButton,
          ]}
          onPress={handleUpdate}
          disabled={saving}
          activeOpacity={0.85}
        >
          <View style={styles.saveIcon}>
            <Ionicons
              name={
                saving
                  ? "hourglass-outline"
                  : "checkmark"
              }
              size={19}
              color="#FFFFFF"
            />
          </View>

          <View
            style={
              styles.saveButtonTextContainer
            }
          >
            <Text style={styles.saveText}>
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </Text>

            {!saving && (
              <Text style={styles.saveSubtext}>
                Update your spending history
              </Text>
            )}
          </View>

          {!saving && (
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>

        {/* DELETE */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <View style={styles.deleteIcon}>
            <Ionicons
              name="trash-outline"
              size={18}
              color="#D64545"
            />
          </View>

          <View
            style={styles.deleteTextContainer}
          >
            <Text style={styles.deleteText}>
              Delete Expense
            </Text>

            <Text
              style={styles.deleteSubtext}
            >
              Permanently remove this record
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color="#C98A8A"
          />
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />

          <View style={styles.footerBrand}>
            <View style={styles.footerDot} />

            <Text style={styles.footerText}>
              Spendly
            </Text>

            <Text style={styles.footerGold}>
              •
            </Text>

            <Text style={styles.footerTagline}>
              Smart Spending, Brighter Tomorrows
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 10,
    paddingBottom: 50,
  },

  /* BACKGROUND */

  backgroundOrbOne: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#DCEBFF",
    opacity: 0.55,
    top: -70,
    right: -90,
  },

  backgroundOrbTwo: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#F5E8C8",
    opacity: 0.35,
    bottom: 100,
    left: -100,
  },

  /* LOADING */

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F8FC",
  },

  loadingGlass: {
    alignItems: "center",
    justifyContent: "center",
    width: 180,
    height: 140,
    borderRadius: 25,
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",

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
    width: 44,
    height: 44,
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

  /* HEADER */

  header: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
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
    alignItems: "center",
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
    fontSize: 22,
    fontWeight: "800",
  },

  headerSpacer: {
    width: 44,
  },

  /* AMOUNT */

  amountCard: {
    minHeight: 205,
    borderRadius: 28,
    padding: 22,
    backgroundColor:
      "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
    overflow: "hidden",

    shadowColor: "#163A63",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5,

    marginBottom: 28,
  },

  cardGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#E6F0FF",
    right: -70,
    top: -80,
    opacity: 0.7,
  },

  amountTopRow: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
  },

  amountLabel: {
    color: "#163A63",
    fontSize: 16,
    fontWeight: "800",
  },

  amountHint: {
    color: "#7B8CA1",
    fontSize: 11,
    marginTop: 5,
  },

  rupeeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#EEF5FF",
    borderWidth: 1,
    borderColor: "#D9E8FF",
  },

  rupeeBadgeText: {
    color: "#2563EB",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
  },

  currency: {
    color: "#B88A24",
    fontSize: 25,
    fontWeight: "800",
    marginRight: 10,
  },

  amountInput: {
    flex: 1,
    color: "#163A63",
    fontSize: 44,
    fontWeight: "800",
    padding: 0,
    minHeight: 54,
  },

  amountUnderline: {
    height: 2,
    backgroundColor: "#D8E5F4",
    marginTop: 8,
    borderRadius: 2,
  },

  /* SECTIONS */

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "flex-end",
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#163A63",
    fontSize: 16,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#7B8CA1",
    fontSize: 11,
    marginTop: 4,
  },

  selectedPill: {
    backgroundColor: "#EAF2FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#D9E8FF",
  },

  selectedPillText: {
    color: "#2563EB",
    fontSize: 10,
    fontWeight: "800",
  },

  optional: {
    color: "#8B9AAC",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  /* CATEGORIES */

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },

  categoryCard: {
    width: "31.5%",
    minHeight: 105,
    borderRadius: 19,
    backgroundColor:
      "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    position: "relative",

    shadowColor: "#163A63",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.055,
    shadowRadius: 12,
    elevation: 2,
  },

  categoryCardSelected: {
    backgroundColor: "#EDF5FF",
    borderColor: "#7BA8E8",
    borderWidth: 1.5,

    shadowColor: "#2563EB",
    shadowOpacity: 0.12,
    shadowRadius: 15,
  },

  iconContainer: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  categoryText: {
    color: "#68798E",
    fontSize: 11,
    fontWeight: "700",
  },

  categoryTextSelected: {
    color: "#163A63",
    fontWeight: "800",
  },

  check: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  /* NOTE */

  noteCard: {
    minHeight: 118,
    borderRadius: 20,
    backgroundColor:
      "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",

    shadowColor: "#163A63",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.055,
    shadowRadius: 14,
    elevation: 2,
  },

  noteIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  noteInput: {
    flex: 1,
    minHeight: 88,
    color: "#163A63",
    fontSize: 14,
    lineHeight: 21,
    paddingTop: 5,
    paddingHorizontal: 0,
  },

  characterCount: {
    color: "#9AA8B8",
    fontSize: 10,
    textAlign: "right",
    marginTop: 6,
  },

  /* SAVE */

  saveButton: {
    minHeight: 66,
    borderRadius: 21,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,

    shadowColor: "#2563EB",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },

  disabledButton: {
    opacity: 0.65,
  },

  saveIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor:
      "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  saveButtonTextContainer: {
    flex: 1,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  saveSubtext: {
    color:
      "rgba(255,255,255,0.72)",
    fontSize: 10,
    marginTop: 3,
  },

  /* DELETE */

  deleteButton: {
    minHeight: 62,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1DADA",
    backgroundColor:
      "rgba(255,248,248,0.72)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginTop: 14,

    shadowColor: "#9B3E3E",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  deleteIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  deleteTextContainer: {
    flex: 1,
  },

  deleteText: {
    color: "#C83F3F",
    fontSize: 14,
    fontWeight: "800",
  },

  deleteSubtext: {
    color: "#A98585",
    fontSize: 10,
    marginTop: 3,
  },

  /* FOOTER */

  footer: {
    marginTop: 28,
    alignItems: "center",
  },

  footerLine: {
    width: "35%",
    height: 1,
    backgroundColor: "#DCE5EF",
    marginBottom: 12,
  },

  footerBrand: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#2563EB",
    marginRight: 5,
  },

  footerText: {
    color: "#5E7187",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  footerGold: {
    color: "#B88A24",
    marginHorizontal: 5,
    fontSize: 10,
  },

  footerTagline: {
    color: "#9AA8B8",
    fontSize: 9,
  },
});