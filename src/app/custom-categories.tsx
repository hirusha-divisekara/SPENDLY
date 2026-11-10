import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    addCustomCategory,
    deleteCustomCategory,
    getCustomCategories,
    updateCustomCategory,
} from "../db/database";
import { requirePro } from "../services/proGuard";

type CustomCategory = {
  id: number;
  name: string;
  icon: string;
};

const CATEGORY_ICONS = [
  "wallet-outline",
  "restaurant-outline",
  "car-outline",
  "home-outline",
  "cart-outline",
  "medical-outline",
  "school-outline",
  "game-controller-outline",
  "gift-outline",
  "airplane-outline",
  "fitness-outline",
  "briefcase-outline",
  "phone-portrait-outline",
  "shirt-outline",
  "cafe-outline",
  "paw-outline",
];

export default function CustomCategoriesScreen() {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CustomCategory | null>(null);

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("wallet-outline");
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!(await requirePro())) {
      return;
    }

    try {
      setLoading(true);

      const data = await getCustomCategories();

      setCategories(data);
    } catch (error) {
      console.error("Failed to load custom categories:", error);
      Alert.alert(
        "Error",
        "Unable to load your custom categories."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openAddModal = () => {
    setEditingCategory(null);
    setName("");
    setSelectedIcon("wallet-outline");
    setModalVisible(true);
  };

  const openEditModal = (category: CustomCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setSelectedIcon(category.icon);
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalVisible(false);
    setEditingCategory(null);
    setName("");
    setSelectedIcon("wallet-outline");
  };

  const saveCategory = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert("Missing Name", "Please enter a category name.");
      return;
    }

    try {
      setSaving(true);

      if (editingCategory) {
        await updateCustomCategory(
          editingCategory.id,
          trimmedName,
          selectedIcon
        );
      } else {
        await addCustomCategory(
          trimmedName,
          selectedIcon
        );
      }

      setModalVisible(false);
      setEditingCategory(null);
      setName("");
      setSelectedIcon("wallet-outline");

      await loadCategories();
    } catch (error) {
      console.error("Failed to save category:", error);

      Alert.alert(
        "Error",
        "Unable to save this category. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category: CustomCategory) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"?`,
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
              await deleteCustomCategory(category.id);
              await loadCategories();
            } catch (error) {
              console.error(
                "Failed to delete category:",
                error
              );

              Alert.alert(
                "Error",
                "Unable to delete this category."
              );
            }
          },
        },
      ]
    );
  };

  const renderIcon = (iconName: string, size = 24) => {
    return (
      <Ionicons
        name={iconName as any}
        size={size}
        color="#2563EB"
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundOrbOne} />
      <View style={styles.backgroundOrbTwo} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace("/pro")}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#0F172A"
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>SPENDLY PRO</Text>

            <Text style={styles.title}>
              Custom Categories
            </Text>

            <Text style={styles.subtitle}>
              Create categories that fit the way you spend.
            </Text>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="apps-outline"
              size={28}
              color="#2563EB"
            />
          </View>

          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              Make Spendly yours
            </Text>

            <Text style={styles.heroDescription}>
              Add your own categories and organize expenses
              exactly how you want.
            </Text>
          </View>
        </View>

        {/* Add Button */}
        <Pressable
          style={styles.addButton}
          onPress={openAddModal}
        >
          <View style={styles.addButtonIcon}>
            <Ionicons
              name="add"
              size={22}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.addButtonText}>
            <Text style={styles.addButtonTitle}>
              Add Custom Category
            </Text>

            <Text style={styles.addButtonSubtitle}>
              Create a category for your spending
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#FFFFFF"
          />
        </Pressable>

        {/* Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>
              YOUR CATEGORIES
            </Text>

            <Text style={styles.sectionTitle}>
              Custom Categories
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {categories.length}
            </Text>
          </View>
        </View>

        {/* Loading */}
        {loading ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="hourglass-outline"
                size={28}
                color="#2563EB"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Loading categories...
            </Text>

            <Text style={styles.emptyDescription}>
              Your custom categories are being loaded.
            </Text>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="pricetags-outline"
                size={30}
                color="#2563EB"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No custom categories yet
            </Text>

            <Text style={styles.emptyDescription}>
              Create your first custom category to make your
              expense tracking more personal.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={openAddModal}
            >
              <Ionicons
                name="add"
                size={18}
                color="#2563EB"
              />

              <Text style={styles.emptyButtonText}>
                Create Category
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.categoryList}>
            {categories.map((category) => (
              <View
                key={category.id}
                style={styles.categoryCard}
              >
                <View style={styles.categoryIconContainer}>
                  {renderIcon(category.icon)}
                </View>

                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>
                    {category.name}
                  </Text>

                  <Text style={styles.categoryDescription}>
                    Custom spending category
                  </Text>
                </View>

                <View style={styles.categoryActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() =>
                      openEditModal(category)
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={19}
                      color="#2563EB"
                    />
                  </Pressable>

                  <Pressable
                    style={[
                      styles.actionButton,
                      styles.deleteButton,
                    ]}
                    onPress={() =>
                      handleDelete(category)
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={19}
                      color="#DC2626"
                    />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pro info */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="sparkles-outline"
              size={22}
              color="#B88A24"
            />
          </View>

          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>
              Built for your spending style
            </Text>

            <Text style={styles.infoDescription}>
              Whether it is subscriptions, hobbies, family
              expenses, or anything else, create categories
              that match your life.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>
            Spendly
          </Text>

          <Text style={styles.footerTagline}>
            Smart Spending, Brighter Tomorrows
          </Text>

          <Text style={styles.footerPro}>
            ✦ PRO FEATURE
          </Text>
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                  styles.modalScrollContent
                }
              >
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalEyebrow}>
                      {editingCategory
                        ? "EDIT CATEGORY"
                        : "NEW CATEGORY"}
                    </Text>

                    <Text style={styles.modalTitle}>
                      {editingCategory
                        ? "Edit Category"
                        : "Create Category"}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.closeButton}
                    onPress={closeModal}
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color="#475569"
                    />
                  </Pressable>
                </View>

                {/* Name */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>
                    Category Name
                  </Text>

                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="pricetag-outline"
                      size={20}
                      color="#64748B"
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Subscriptions"
                      placeholderTextColor="#94A3B8"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      maxLength={30}
                    />
                  </View>
                </View>

                {/* Icon */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>
                    Choose an Icon
                  </Text>

                  <View style={styles.iconGrid}>
                    {CATEGORY_ICONS.map((icon) => {
                      const selected =
                        selectedIcon === icon;

                      return (
                        <Pressable
                          key={icon}
                          style={[
                            styles.iconOption,
                            selected &&
                              styles.iconOptionSelected,
                          ]}
                          onPress={() =>
                            setSelectedIcon(icon)
                          }
                        >
                          <Ionicons
                            name={icon as any}
                            size={23}
                            color={
                              selected
                                ? "#2563EB"
                                : "#64748B"
                            }
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Save */}
                <Pressable
                  style={[
                    styles.saveButton,
                    saving &&
                      styles.saveButtonDisabled,
                  ]}
                  onPress={saveCategory}
                  disabled={saving}
                >
                  <Ionicons
                    name={
                      editingCategory
                        ? "checkmark-circle-outline"
                        : "add-circle-outline"
                    }
                    size={21}
                    color="#FFFFFF"
                  />

                  <Text style={styles.saveButtonText}>
                    {saving
                      ? "Saving..."
                      : editingCategory
                      ? "Save Changes"
                      : "Create Category"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.cancelButton}
                  onPress={closeModal}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>
                    Cancel
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FC",
  },

  backgroundOrbOne: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(37, 99, 235, 0.07)",
    top: -90,
    right: -80,
  },

  backgroundOrbTwo: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(184, 138, 36, 0.06)",
    bottom: 120,
    left: -90,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#B88A24",
    marginBottom: 5,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.8,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    fontWeight: "500",
  },

  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },

  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(37,99,235,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  heroText: {
    flex: 1,
  },

  heroTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 5,
  },

  heroDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    fontWeight: "500",
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 30,
  },

  addButtonIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  addButtonText: {
    flex: 1,
  },

  addButtonTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  addButtonSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    marginTop: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.7,
    color: "#94A3B8",
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
  },

  countBadge: {
    minWidth: 34,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: "rgba(37,99,235,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563EB",
  },

  categoryList: {
    gap: 12,
  },

  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    borderRadius: 21,
    padding: 14,
  },

  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(37,99,235,0.09)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  categoryInfo: {
    flex: 1,
  },

  categoryName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },

  categoryDescription: {
    marginTop: 4,
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },

  categoryActions: {
    flexDirection: "row",
    gap: 7,
  },

  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(37,99,235,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButton: {
    backgroundColor: "rgba(220,38,38,0.07)",
  },

  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: "center",
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "rgba(37,99,235,0.09)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },

  emptyDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    textAlign: "center",
    marginTop: 7,
    maxWidth: 290,
  },

  emptyButton: {
    marginTop: 18,
    height: 43,
    paddingHorizontal: 17,
    borderRadius: 14,
    backgroundColor: "rgba(37,99,235,0.09)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  emptyButtonText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "800",
  },

  infoCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,250,238,0.72)",
    borderWidth: 1,
    borderColor: "rgba(184,138,36,0.16)",
    borderRadius: 21,
    padding: 15,
    marginTop: 18,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(184,138,36,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  infoText: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },

  infoDescription: {
    fontSize: 11,
    lineHeight: 17,
    color: "#64748B",
    fontWeight: "500",
  },

  footer: {
    alignItems: "center",
    marginTop: 34,
    paddingBottom: 15,
  },

  footerBrand: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2563EB",
    letterSpacing: 0.5,
  },

  footerTagline: {
    marginTop: 4,
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
  },

  footerPro: {
    marginTop: 9,
    fontSize: 9,
    color: "#B88A24",
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  keyboardWrapper: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.28)",
    justifyContent: "flex-end",
  },

  modalCard: {
    maxHeight: "88%",
    backgroundColor: "#F8FAFD",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    paddingTop: 20,
  },

  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 34,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  modalEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.7,
    color: "#B88A24",
    marginBottom: 5,
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#0F172A",
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EAF0F7",
    alignItems: "center",
    justifyContent: "center",
  },

  inputSection: {
    marginBottom: 22,
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 8,
  },

  inputWrapper: {
    height: 54,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },

  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  iconOptionSelected: {
    borderColor: "#2563EB",
    backgroundColor: "rgba(37,99,235,0.08)",
  },

  saveButton: {
    height: 53,
    borderRadius: 17,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 2,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  cancelButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  cancelButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
  },
});