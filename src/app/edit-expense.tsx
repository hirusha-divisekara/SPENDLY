import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
  const { id } = useLocalSearchParams<{ id: string }>();

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

      const expense = await getExpenseById(Number(id));

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
      console.error("❌ LOAD EXPENSE ERROR:", error);

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
      console.error("❌ UPDATE ERROR:", error);

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
              await deleteExpense(Number(id));

              Alert.alert(
                "Expense deleted",
                "The expense has been removed.",
                [
                  {
                    text: "Done",
                    onPress: () => router.back(),
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
          <Text style={styles.loadingText}>
            Loading expense...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            Edit Expense
          </Text>

          <View style={{ width: 44 }} />
        </View>

        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.label}>
            Amount
          </Text>

          <View style={styles.amountContainer}>
            <Text style={styles.currency}>
              Rs.
            </Text>

            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#52525B"
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Category
          </Text>

          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const selected =
                selectedCategory === category.name;

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
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor:
                          `${category.color}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={24}
                      color={category.color}
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
                    <View style={styles.check}>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Note
          </Text>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="What was this expense for?"
            placeholderTextColor="#52525B"
            style={styles.noteInput}
            multiline
          />
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.disabledButton,
          ]}
          onPress={handleUpdate}
          disabled={saving}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={22}
            color="#FFFFFF"
          />

          <Text style={styles.saveText}>
            {saving
              ? "Saving..."
              : "Save Changes"}
          </Text>
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color="#EF4444"
          />

          <Text style={styles.deleteText}>
            Delete Expense
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090B",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#71717A",
    fontSize: 14,
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },

  amountSection: {
    marginTop: 10,
    marginBottom: 30,
  },

  label: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },

  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
    paddingBottom: 10,
  },

  currency: {
    color: "#71717A",
    fontSize: 28,
    fontWeight: "600",
    marginRight: 8,
  },

  amountInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "700",
    padding: 0,
  },

  section: {
    marginBottom: 26,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  categoryCard: {
    width: "31.5%",
    minHeight: 100,
    backgroundColor: "#18181B",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#27272A",
    position: "relative",
  },

  categoryCardSelected: {
    borderColor: "#FFFFFF",
    backgroundColor: "#202023",
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  categoryText: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "600",
  },

  categoryTextSelected: {
    color: "#FFFFFF",
  },

  check: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },

  noteInput: {
    minHeight: 110,
    backgroundColor: "#18181B",
    borderWidth: 1,
    borderColor: "#27272A",
    borderRadius: 16,
    padding: 15,
    color: "#FFFFFF",
    fontSize: 15,
    textAlignVertical: "top",
  },

  saveButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  deleteButton: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3F1D1D",
    backgroundColor: "#18181B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
  },

  deleteText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "700",
  },
});