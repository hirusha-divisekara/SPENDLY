import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <View style={styles.bottomNav}>
      {/* HOME */}
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.75}
        onPress={() => router.replace("/")}
      >
        <View
          style={[
            styles.iconContainer,
            isActive("/") && styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name={isActive("/") ? "home" : "home-outline"}
            size={21}
            color={isActive("/") ? "#2563EB" : "#7B8794"}
          />
        </View>

        <Text
          style={[
            styles.navText,
            isActive("/") && styles.navActive,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* ADD EXPENSE */}
      <TouchableOpacity
        style={styles.addWrapper}
        activeOpacity={0.85}
        onPress={() => router.push("/add-expense")}
      >
        <View style={styles.centerAdd}>
          <Ionicons
            name="add"
            size={30}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.addText}>Expense</Text>
      </TouchableOpacity>

      {/* INSIGHTS */}
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.75}
        onPress={() => router.replace("/insights")}
      >
        <View
          style={[
            styles.iconContainer,
            isActive("/insights") &&
              styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name={
              isActive("/insights")
                ? "pie-chart"
                : "pie-chart-outline"
            }
            size={21}
            color={
              isActive("/insights")
                ? "#2563EB"
                : "#7B8794"
            }
          />
        </View>

        <Text
          style={[
            styles.navText,
            isActive("/insights") &&
              styles.navActive,
          ]}
        >
          Insights
        </Text>
      </TouchableOpacity>

      {/* BUDGETS */}
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.75}
        onPress={() => router.replace("/budgets")}
      >
        <View
          style={[
            styles.iconContainer,
            isActive("/budgets") &&
              styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name={
              isActive("/budgets")
                ? "wallet"
                : "wallet-outline"
            }
            size={21}
            color={
              isActive("/budgets")
                ? "#2563EB"
                : "#7B8794"
            }
          />
        </View>

        <Text
          style={[
            styles.navText,
            isActive("/budgets") &&
              styles.navActive,
          ]}
        >
          Budgets
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 18,
    left: 18,
    right: 18,
    height: 76,
    borderRadius: 26,

    // Glassmorphism
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",

    // Soft premium shadow
    shadowColor: "#17324D",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 22,

    elevation: 12,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 65,
    height: 64,
  },

  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  activeIconContainer: {
    backgroundColor: "rgba(37, 99, 235, 0.10)",
  },

  navText: {
    color: "#7B8794",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
    letterSpacing: 0.1,
  },

  navActive: {
    color: "#2563EB",
    fontWeight: "700",
  },

  addWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    height: 76,
    marginTop: -18,
  },

  centerAdd: {
    width: 54,
    height: 54,
    borderRadius: 19,

    backgroundColor: "#2563EB",

    alignItems: "center",
    justifyContent: "center",

    // Premium blue button
    shadowColor: "#2563EB",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.28,
    shadowRadius: 14,

    elevation: 8,

    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.95)",
  },

  addText: {
    color: "#2563EB",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 3,
  },
});