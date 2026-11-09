import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
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

import { addExpense } from "../db/database";

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

export default function AddExpenseScreen() {
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const numericAmount = Number(amount);

    if (!amount || numericAmount <= 0) {
      Alert.alert(
        "Invalid amount",
        "Please enter a valid expense amount."
      );
      return;
    }

    if (saving) return;

    try {
      setSaving(true);

      console.log("💾 SAVING EXPENSE...");
      console.log("Amount:", numericAmount);
      console.log("Category:", selectedCategory);
      console.log("Note:", note);

      await addExpense(
        numericAmount,
        selectedCategory,
        note.trim()
      );

      console.log("🎉 EXPENSE SAVED SUCCESSFULLY");

      Alert.alert(
        "Expense saved ✓",
        `Rs. ${numericAmount.toLocaleString()} • ${selectedCategory}`,
        [
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("❌ SAVE EXPENSE ERROR:", error);

      Alert.alert(
        "Couldn't save expense",
        "Something went wrong while saving this expense. Check the console for the error."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            Add Expense
          </Text>

          <View style={{ width: 44 }} />
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.label}>Amount</Text>

          <View style={styles.amountContainer}>
            <Text style={styles.currency}>Rs.</Text>

            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="#52525B"
              keyboardType="decimal-pad"
              style={styles.amountInput}
              autoFocus
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>

          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const selected =
                selectedCategory === category.name;

              return (
                <TouchableOpacity
                  key={category.name}
                  onPress={() =>
                    setSelectedCategory(category.name)
                  }
                  style={[
                    styles.categoryCard,
                    selected && styles.categoryCardSelected,
                  ]}
                  activeOpacity={0.8}
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

        <View style={styles.section}>
          <Text style={styles.label}>
            Note (optional)
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

        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <Text style={styles.saveText}>
              Saving...
            </Text>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color="#FFFFFF"
              />

              <Text style={styles.saveText}>
                Save Expense
              </Text>
            </>
          )}
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
    paddingBottom: 40,
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
    marginTop: 5,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});