import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
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
    addCustomCategory,
    CustomCategory,
    deleteCustomCategory,
    getCustomCategories,
    updateCustomCategory,
} from "../db/database";

const BLUE = "#2563EB";
const GOLD = "#B88A24";
const BG = "#F5F8FC";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";
const RED = "#DC2626";

const ICONS = [
  "restaurant-outline",
  "fast-food-outline",
  "cart-outline",
  "car-outline",
  "bus-outline",
  "home-outline",
  "medical-outline",
  "school-outline",
  "book-outline",
  "game-controller-outline",
  "film-outline",
  "musical-notes-outline",
  "shirt-outline",
  "phone-portrait-outline",
  "wifi-outline",
  "flash-outline",
  "water-outline",
  "airplane-outline",
  "gift-outline",
  "heart-outline",
  "fitness-outline",
  "briefcase-outline",
  "wallet-outline",
  "cash-outline",
  "card-outline",
];

export default function CustomCategoriesScreen() {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CustomCategory | null>(null);

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] =
    useState("wallet-outline");

  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);

      const data = await getCustomCategories();

      setCategories(data);
    } catch (error) {
      console.error(
        "❌ FAILED TO LOAD CUSTOM CATEGORIES:",
        error
      );

      Alert.alert(
        "Something went wrong",
        "Unable to load your custom categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setSelectedIcon("wallet-outline");
    setModalVisible(true);
  };

  const openEditModal = (
    category: CustomCategory
  ) => {
    setEditingCategory(category);
    setName(category.name);
    setSelectedIcon(category.icon);
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalVisible(false);
    setEditingCategory(null);
    setName("");
    setSelectedIcon("wallet-outline");
  };

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert(
        "Category name required",
        "Please enter a name for your category."
      );
      return;
    }

    if (trimmedName.length > 30) {
      Alert.alert(
        "Name too long",
        "Category names can contain up to 30 characters."
      );
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

      closeModal();
      await loadCategories();
    } catch (error: any) {
      console.error(
        "❌ FAILED TO SAVE CATEGORY:",
        error
      );

      const message = String(
        error?.message ?? ""
      ).toLowerCase();

      if (
        message.includes("unique") ||
        message.includes("constraint")
      ) {
        Alert.alert(
          "Category already exists",
          "Please choose a different category name."
        );
      } else {
        Alert.alert(
          "Could not save category",
          "Something went wrong while saving your category."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (
    category: CustomCategory
  ) => {
    Alert.alert(
      "Delete category?",
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
              await deleteCustomCategory(
                category.id
              );

              await loadCategories();
            } catch (error) {
              console.error(
                "❌ FAILED TO DELETE CATEGORY:",
                error
              );

              Alert.alert(
                "Delete failed",
                "Unable to delete this category."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
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

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              Custom Categories
            </Text>

            <Text style={styles.headerSubtitle}>
              Organize spending your way
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

        {/* Hero */}

        <View style={styles.heroCard}>
          <View style={styles.heroOrb} />

          <View style={styles.heroIcon}>
            <Ionicons
              name="pricetags-outline"
              size={25}
              color={BLUE}
            />
          </View>

          <Text style={styles.heroTitle}>
            Make Spendly{" "}
            <Text style={styles.heroAccent}>
              yours.
            </Text>
          </Text>

          <Text style={styles.heroDescription}>
            Create categories that match the way
            you actually spend your money.
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {categories.length}
              </Text>

              <Text style={styles.statLabel}>
                Custom categories
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ∞
              </Text>

              <Text style={styles.statLabel}>
                Your way
              </Text>
            </View>
          </View>
        </View>

        {/* Add Button */}

        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreateModal}
          activeOpacity={0.85}
        >
          <View style={styles.addIcon}>
            <Ionicons
              name="add"
              size={23}
              color={WHITE}
            />
          </View>

          <View style={styles.addTextContainer}>
            <Text style={styles.addTitle}>
              Create category
            </Text>

            <Text style={styles.addSubtitle}>
              Add a category for your spending
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={BLUE}
          />
        </TouchableOpacity>

        {/* Categories */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Your categories
            </Text>

            <Text style={styles.sectionSubtitle}>
              Personalize your spending labels
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="sync-outline"
              size={28}
              color={BLUE}
            />

            <Text style={styles.emptyTitle}>
              Loading categories...
            </Text>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="pricetags-outline"
                size={28}
                color={BLUE}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No custom categories yet
            </Text>

            <Text style={styles.emptyDescription}>
              Create your first category to make
              Spendly fit your lifestyle.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={openCreateModal}
              activeOpacity={0.85}
            >
              <Ionicons
                name="add"
                size={18}
                color={WHITE}
              />

              <Text style={styles.emptyButtonText}>
                Create category
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.categoriesList}>
            {categories.map((category) => (
              <View
                key={category.id}
                style={styles.categoryCard}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons
                    name={category.icon as any}
                    size={23}
                    color={BLUE}
                  />
                </View>

                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>
                    {category.name}
                  </Text>

                  <Text style={styles.categorySubtitle}>
                    Custom Spendly category
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    openEditModal(category)
                  }
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={BLUE}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.deleteActionButton,
                  ]}
                  onPress={() =>
                    handleDelete(category)
                  }
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={RED}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Pro Insight */}

        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Ionicons
              name="sparkles-outline"
              size={21}
              color={GOLD}
            />
          </View>

          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>
              SPENDLY PRO
            </Text>

            <Text style={styles.insightTitle}>
              Your spending, your system.
            </Text>

            <Text style={styles.insightDescription}>
              Custom categories make your insights
              more meaningful and personal.
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

          <Text style={styles.footerTagline}>
            Smart Spending, Brighter Tomorrows
          </Text>

          <Text style={styles.footerSmall}>
            Your finances. Your future. Your Spendly.
          </Text>
        </View>
      </ScrollView>

      {/* Create / Edit Modal */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
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
          <ScrollView
            contentContainerStyle={
              styles.modalScrollContent
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.modalCard}>
              {/* Modal Header */}

              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingCategory
                      ? "Edit category"
                      : "Create category"}
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    {editingCategory
                      ? "Update your category"
                      : "Personalize your spending"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={TEXT}
                  />
                </TouchableOpacity>
              </View>

              {/* Name */}

              <Text style={styles.inputLabel}>
                Category name
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="text-outline"
                  size={19}
                  color={MUTED}
                />

                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Pet Care"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  maxLength={30}
                  autoCapitalize="words"
                  returnKeyType="done"
                />
              </View>

              {/* Icon */}

              <Text style={styles.inputLabel}>
                Choose an icon
              </Text>

              <View style={styles.iconGrid}>
                {ICONS.map((icon) => {
                  const selected =
                    selectedIcon === icon;

                  return (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconOption,
                        selected &&
                          styles.iconOptionSelected,
                      ]}
                      onPress={() =>
                        setSelectedIcon(icon)
                      }
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={icon as any}
                        size={20}
                        color={
                          selected
                            ? BLUE
                            : MUTED
                        }
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Save */}

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saving &&
                    styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={
                    saving
                      ? "sync-outline"
                      : "checkmark-circle-outline"
                  }
                  size={19}
                  color={WHITE}
                />

                <Text style={styles.saveButtonText}>
                  {saving
                    ? "Saving..."
                    : editingCategory
                    ? "Save changes"
                    : "Create category"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    top: -90,
    right: -80,
  },

  backgroundOrbBottom: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor:
      "rgba(184,138,36,0.06)",
    bottom: 90,
    left: -130,
  },

  /* Header */

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.75)",
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

  headerText: {
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
    fontSize: 12,
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

  /* Hero */

  heroCard: {
    overflow: "hidden",
    borderRadius: 28,
    padding: 22,
    backgroundColor:
      "rgba(255,255,255,0.76)",
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

  heroOrb: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor:
      "rgba(37,99,235,0.07)",
    right: -70,
    top: -75,
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.09)",
    borderWidth: 1,
    borderColor:
      "rgba(37,99,235,0.13)",
    marginBottom: 16,
  },

  heroTitle: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: -0.7,
  },

  heroAccent: {
    color: BLUE,
  },

  heroDescription: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
    fontWeight: "500",
  },

  heroStats: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  statItem: {
    flex: 1,
  },

  statValue: {
    fontSize: 21,
    fontWeight: "900",
    color: BLUE,
  },

  statLabel: {
    marginTop: 2,
    fontSize: 9,
    color: MUTED,
    fontWeight: "700",
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor:
      "rgba(15,23,42,0.08)",
    marginHorizontal: 15,
  },

  /* Add */

  addButton: {
    minHeight: 76,
    borderRadius: 22,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor:
      "rgba(37,99,235,0.16)",
    shadowColor: BLUE,
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 2,
    marginBottom: 27,
  },

  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },

  addTextContainer: {
    flex: 1,
    marginLeft: 13,
  },

  addTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
  },

  addSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
    fontWeight: "500",
  },

  /* Section */

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: MUTED,
    fontWeight: "500",
  },

  /* Category */

  categoriesList: {
    gap: 10,
  },

  categoryCard: {
    minHeight: 73,
    borderRadius: 20,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.045,
    shadowRadius: 13,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },

  categoryIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor:
      "rgba(37,99,235,0.09)",
    borderWidth: 1,
    borderColor:
      "rgba(37,99,235,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },

  categoryName: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  categorySubtitle: {
    marginTop: 3,
    fontSize: 9,
    color: MUTED,
    fontWeight: "500",
  },

  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.07)",
    marginLeft: 7,
  },

  deleteActionButton: {
    backgroundColor:
      "rgba(220,38,38,0.07)",
  },

  /* Empty */

  emptyCard: {
    alignItems: "center",
    borderRadius: 24,
    padding: 28,
    backgroundColor:
      "rgba(255,255,255,0.70)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(37,99,235,0.09)",
    marginBottom: 13,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 17,
    color: MUTED,
    textAlign: "center",
    maxWidth: 280,
  },

  emptyButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    minHeight: 43,
    borderRadius: 14,
    backgroundColor: BLUE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  emptyButtonText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: "900",
  },

  /* Insight */

  insightCard: {
    marginTop: 25,
    borderRadius: 23,
    padding: 17,
    flexDirection: "row",
    backgroundColor:
      "rgba(184,138,36,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(184,138,36,0.18)",
  },

  insightIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(184,138,36,0.12)",
    marginRight: 12,
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
    lineHeight: 16,
    color: MUTED,
    fontWeight: "500",
  },

  /* Footer */

  footer: {
    alignItems: "center",
    marginTop: 25,
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

  /* Modal */

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(15,23,42,0.42)",
    justifyContent: "center",
  },

  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxHeight: "92%",
    borderRadius: 28,
    padding: 22,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 30,
    shadowOffset: {
      width: 0,
      height: 15,
    },
    elevation: 8,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 22,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
  },

  modalSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: MUTED,
    fontWeight: "500",
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor:
      "rgba(15,23,42,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },

  inputLabel: {
    marginBottom: 8,
    fontSize: 11,
    color: TEXT,
    fontWeight: "900",
  },

  inputContainer: {
    minHeight: 52,
    borderRadius: 15,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "#F8FAFC",
    borderWidth: 1,
    borderColor:
      "rgba(15,23,42,0.08)",
    marginBottom: 20,
  },

  input: {
    flex: 1,
    marginLeft: 9,
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 0,
  },

  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 23,
  },

  iconOption: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "#F8FAFC",
    borderWidth: 1,
    borderColor:
      "rgba(15,23,42,0.07)",
  },

  iconOptionSelected: {
    backgroundColor:
      "rgba(37,99,235,0.10)",
    borderColor:
      "rgba(37,99,235,0.35)",
    borderWidth: 1.5,
  },

  saveButton: {
    minHeight: 53,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "900",
  },
});