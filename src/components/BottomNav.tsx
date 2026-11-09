import { Ionicons } from "@expo/vector-icons";
import {
    router,
    usePathname,
} from "expo-router";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function BottomNav() {
  const pathname =
    usePathname();

  const isActive = (
    path: string
  ) => pathname === path;

  return (
    <View
      style={styles.bottomNav}
    >
      {/* HOME */}
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() =>
          router.replace("/")
        }
      >
        <Ionicons
          name={
            isActive("/")
              ? "home"
              : "home-outline"
          }
          size={23}
          color={
            isActive("/")
              ? "#FFFFFF"
              : "#71717A"
          }
        />

        <Text
          style={[
            styles.navText,
            isActive("/") &&
              styles.navActive,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* ADD */}
      <TouchableOpacity
        style={styles.centerAdd}
        activeOpacity={0.8}
        onPress={() =>
          router.push(
            "/add-expense"
          )
        }
      >
        <Ionicons
          name="add"
          size={30}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* INSIGHTS */}
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() =>
          router.replace(
            "/insights"
          )
        }
      >
        <Ionicons
          name={
            isActive(
              "/insights"
            )
              ? "pie-chart"
              : "pie-chart-outline"
          }
          size={23}
          color={
            isActive(
              "/insights"
            )
              ? "#FFFFFF"
              : "#71717A"
          }
        />

        <Text
          style={[
            styles.navText,
            isActive(
              "/insights"
            ) &&
              styles.navActive,
          ]}
        >
          Insights
        </Text>
      </TouchableOpacity>

      {/* BUDGETS */}
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() =>
          router.replace(
            "/budgets"
          )
        }
      >
        <Ionicons
          name={
            isActive(
              "/budgets"
            )
              ? "wallet"
              : "wallet-outline"
          }
          size={23}
          color={
            isActive(
              "/budgets"
            )
              ? "#FFFFFF"
              : "#71717A"
          }
        />

        <Text
          style={[
            styles.navText,
            isActive(
              "/budgets"
            ) &&
              styles.navActive,
          ]}
        >
          Budgets
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles =
  StyleSheet.create({
    bottomNav: {
      position:
        "absolute",
      bottom: 20,
      left: 20,
      right: 20,
      height: 68,
      borderRadius: 22,
      backgroundColor:
        "#18181B",
      borderWidth: 1,
      borderColor:
        "#27272A",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-around",
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity:
        0.25,
      shadowRadius:
        16,
      elevation: 10,
    },

    navItem: {
      alignItems:
        "center",
      justifyContent:
        "center",
      minWidth: 60,
    },

    navText: {
      color:
        "#71717A",
      fontSize: 10,
      marginTop: 4,
    },

    navActive: {
      color:
        "#FFFFFF",
    },

    centerAdd: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor:
        "#2563EB",
      alignItems:
        "center",
      justifyContent:
        "center",
    },
  });