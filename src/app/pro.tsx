import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BLUE = "#2563EB";
const GOLD = "#B88A24";
const BG = "#F5F8FC";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const WHITE = "#FFFFFF";

type Feature = {
  icon: string;
  title: string;
  description: string;
  route?: string;
};

const features: Feature[] = [
  {
    icon: "analytics-outline",
    title: "Advanced Insights",
    description:
      "Understand where, when and how you spend.",
    // Coming in the next Pro update
  },

  {
    icon: "trending-up-outline",
    title: "Spending Trends",
    description:
      "Track your spending patterns over time.",
    route: "/spending-trends",
  },

  {
    icon: "flag-outline",
    title: "Savings Goals",
    description:
      "Set goals and stay focused on your financial future.",
    route: "/savings-goals",
  },

  {
    icon: "repeat-outline",
    title: "Recurring Expenses",
    description:
      "Keep track of bills, subscriptions and regular payments.",
    route: "/recurring-expenses",
  },

  {
    icon: "pricetags-outline",
    title: "Custom Categories",
    description:
      "Create and manage categories that fit your spending.",
    route: "/custom-categories",
  },

  {
    icon: "download-outline",
    title: "Reports & Export",
    description:
      "Export your financial data for deeper analysis.",
    route: "/reports",
  },
];

export default function ProScreen() {
  const handleStartPro = () => {
    // Payment integration will be connected later.
  };

  const handleRestore = () => {
    // Real App Store / Google Play restore logic
    // will be added later.
  };

  const handleFeaturePress = (
    feature: Feature
  ) => {
    if (!feature.route) {
      return;
    }

    router.push(feature.route as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Background decoration */}
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
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

          <View
            style={
              styles.headerTitleContainer
            }
          >
            <Text
              style={styles.headerTitle}
            >
              Spendly Pro
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Unlock more from your money
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
          <View style={styles.heroGlow} />

          <View
            style={
              styles.diamondContainer
            }
          >
            <Ionicons
              name="diamond"
              size={28}
              color={GOLD}
            />
          </View>

          <Text style={styles.heroTitle}>
            Take control of{"\n"}
            <Text
              style={styles.heroAccent}
            >
              your spending.
            </Text>
          </Text>

          <Text
            style={styles.heroDescription}
          >
            Unlock powerful tools designed
            to help you understand your
            money, build better habits, and
            plan for brighter tomorrows.
          </Text>

          <View
            style={styles.taglineRow}
          >
            <View
              style={styles.taglineLine}
            />

            <Text
              style={styles.tagline}
            >
              Smart Spending, Brighter
              Tomorrows
            </Text>

            <View
              style={styles.taglineLine}
            />
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.pricingCard}>
          <View style={styles.bestValue}>
            <Ionicons
              name="sparkles"
              size={14}
              color={GOLD}
            />

            <Text
              style={styles.bestValueText}
            >
              SPENDLY PRO
            </Text>
          </View>

          <Text style={styles.price}>
            Rs. 499
          </Text>

          <Text
            style={styles.pricePeriod}
          >
            per month
          </Text>

          <Text
            style={
              styles.pricingDescription
            }
          >
            Get the complete Spendly
            experience.
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            onPress={
              handleStartPro
            }
            activeOpacity={0.85}
          >
            <Ionicons
              name="diamond-outline"
              size={19}
              color={BLUE}
            />

            <Text
              style={
                styles.startButtonText
              }
            >
              Start Pro
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color={BLUE}
            />
          </TouchableOpacity>

          <Text
            style={styles.paymentNote}
          >
            Payment integration coming
            soon
          </Text>
        </View>

        {/* Features */}
        <View
          style={styles.sectionHeader}
        >
          <View>
            <Text
              style={styles.sectionTitle}
            >
              Everything you need
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Premium tools for smarter
              financial decisions
            </Text>
          </View>
        </View>

        <View
          style={styles.featuresGrid}
        >
          {features.map(
            (feature) => {
              const isAvailable =
                Boolean(
                  feature.route
                );

              return (
                <TouchableOpacity
                  key={
                    feature.title
                  }
                  style={[
                    styles.featureCard,
                    isAvailable &&
                      styles.featureCardInteractive,
                  ]}
                  activeOpacity={
                    isAvailable
                      ? 0.75
                      : 1
                  }
                  onPress={() =>
                    handleFeaturePress(
                      feature
                    )
                  }
                  disabled={
                    !isAvailable
                  }
                >
                  <View
                    style={
                      styles.featureTopRow
                    }
                  >
                    <View
                      style={
                        styles.featureIcon
                      }
                    >
                      <Ionicons
                        name={
                          feature.icon as any
                        }
                        size={
                          21
                        }
                        color={
                          BLUE
                        }
                      />
                    </View>

                    {isAvailable && (
                      <View
                        style={
                          styles.availableBadge
                        }
                      >
                        <Ionicons
                          name="arrow-forward"
                          size={
                            12
                          }
                          color={
                            BLUE
                          }
                        />
                      </View>
                    )}
                  </View>

                  <Text
                    style={
                      styles.featureTitle
                    }
                  >
                    {
                      feature.title
                    }
                  </Text>

                  <Text
                    style={
                      styles.featureDescription
                    }
                  >
                    {
                      feature.description
                    }
                  </Text>

                  {isAvailable && (
                    <Text
                      style={
                        styles.exploreText
                      }
                    >
                      Explore →
                    </Text>
                  )}
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {/* Premium Insight */}
        <View
          style={
            styles.insightCard
          }
        >
          <View
            style={
              styles.insightIcon
            }
          >
            <Ionicons
              name="bulb-outline"
              size={22}
              color={GOLD}
            />
          </View>

          <View
            style={
              styles.insightContent
            }
          >
            <Text
              style={
                styles.insightLabel
              }
            >
              SPENDLY PRO INSIGHT
            </Text>

            <Text
              style={
                styles.insightTitle
              }
            >
              See the bigger picture.
            </Text>

            <Text
              style={
                styles.insightDescription
              }
            >
              Go beyond individual expenses
              and discover the patterns behind
              your financial habits.
            </Text>
          </View>
        </View>

        {/* Restore Purchase */}
        <TouchableOpacity
          style={
            styles.restoreButton
          }
          onPress={
            handleRestore
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name="refresh-outline"
            size={17}
            color={MUTED}
          />

          <Text
            style={styles.restoreText}
          >
            Restore Purchase
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View
          style={styles.footer}
        >
          <View
            style={styles.footerLogo}
          >
            <Image
              source={require(
                "../../assets/icon.png"
              )}
              style={
                styles.footerLogoImage
              }
              resizeMode="contain"
            />

            <Text
              style={styles.footerBrand}
            >
              SPENDLY
            </Text>
          </View>

          <Text
            style={
              styles.footerTagline
            }
          >
            Smart Spending, Brighter
            Tomorrows
          </Text>

          <Text
            style={styles.footerSmall}
          >
            Your finances. Your future.
            Your Spendly.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
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
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor:
        "rgba(37, 99, 235, 0.07)",
      top: -80,
      right: -70,
    },

    backgroundOrbBottom: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor:
        "rgba(184, 138, 36, 0.06)",
      bottom: 80,
      left: -120,
    },

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

    headerTitleContainer: {
      flex: 1,
      marginLeft: 13,
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
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

    heroCard: {
      overflow: "hidden",
      borderRadius: 30,
      padding: 25,
      backgroundColor:
        "rgba(255,255,255,0.76)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.95)",
      shadowColor: "#0F172A",
      shadowOpacity: 0.08,
      shadowRadius: 25,
      shadowOffset: {
        width: 0,
        height: 12,
      },
      elevation: 4,
      marginBottom: 16,
    },

    heroGlow: {
      position: "absolute",
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor:
        "rgba(37,99,235,0.08)",
      right: -80,
      top: -80,
    },

    diamondContainer: {
      width: 56,
      height: 56,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "rgba(184,138,36,0.12)",
      borderWidth: 1,
      borderColor:
        "rgba(184,138,36,0.22)",
      marginBottom: 18,
    },

    heroTitle: {
      fontSize: 30,
      lineHeight: 35,
      fontWeight: "900",
      color: TEXT,
      letterSpacing: -1,
    },

    heroAccent: {
      color: BLUE,
    },

    heroDescription: {
      marginTop: 13,
      fontSize: 14,
      lineHeight: 22,
      color: MUTED,
      fontWeight: "500",
    },

    taglineRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 22,
    },

    taglineLine: {
      flex: 1,
      height: 1,
      backgroundColor:
        "rgba(184,138,36,0.25)",
    },

    tagline: {
      marginHorizontal: 9,
      fontSize: 9,
      color: GOLD,
      fontWeight: "800",
      letterSpacing: 0.7,
    },

    pricingCard: {
      borderRadius: 26,
      padding: 23,
      backgroundColor:
        "rgba(37,99,235,0.94)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.25)",
      shadowColor: BLUE,
      shadowOpacity: 0.2,
      shadowRadius: 22,
      shadowOffset: {
        width: 0,
        height: 12,
      },
      elevation: 5,
      marginBottom: 28,
    },

    bestValue: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor:
        "rgba(255,255,255,0.13)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.18)",
      marginBottom: 14,
    },

    bestValueText: {
      fontSize: 9,
      fontWeight: "900",
      color: WHITE,
      letterSpacing: 1,
    },

    price: {
      fontSize: 36,
      fontWeight: "900",
      color: WHITE,
      letterSpacing: -1,
    },

    pricePeriod: {
      marginTop: -3,
      fontSize: 12,
      color:
        "rgba(255,255,255,0.75)",
      fontWeight: "600",
    },

    pricingDescription: {
      marginTop: 12,
      color:
        "rgba(255,255,255,0.86)",
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "500",
    },

    startButton: {
      marginTop: 19,
      minHeight: 53,
      borderRadius: 17,
      backgroundColor: WHITE,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
    },

    startButtonText: {
      fontSize: 15,
      fontWeight: "900",
      color: BLUE,
    },

    paymentNote: {
      textAlign: "center",
      marginTop: 11,
      fontSize: 9,
      color:
        "rgba(255,255,255,0.58)",
      fontWeight: "500",
    },

    sectionHeader: {
      marginBottom: 15,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: TEXT,
      letterSpacing: -0.4,
    },

    sectionSubtitle: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 18,
      color: MUTED,
      fontWeight: "500",
    },

    featuresGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },

    featureCard: {
      width: "48%",
      minHeight: 165,
      marginBottom: 12,
      padding: 16,
      borderRadius: 22,
      backgroundColor:
        "rgba(255,255,255,0.72)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.95)",
      shadowColor: "#0F172A",
      shadowOpacity: 0.05,
      shadowRadius: 15,
      shadowOffset: {
        width: 0,
        height: 7,
      },
      elevation: 2,
    },

    featureCardInteractive: {
      borderColor:
        "rgba(37,99,235,0.22)",
      shadowColor: BLUE,
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: {
        width: 0,
        height: 7,
      },
    },

    featureTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    featureIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor:
        "rgba(37,99,235,0.09)",
      borderWidth: 1,
      borderColor:
        "rgba(37,99,235,0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 13,
    },

    availableBadge: {
      width: 26,
      height: 26,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "rgba(37,99,235,0.08)",
      borderWidth: 1,
      borderColor:
        "rgba(37,99,235,0.13)",
    },

    featureTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: TEXT,
      lineHeight: 18,
    },

    featureDescription: {
      marginTop: 6,
      fontSize: 10.5,
      lineHeight: 16,
      color: MUTED,
      fontWeight: "500",
    },

    exploreText: {
      marginTop: 9,
      fontSize: 9,
      color: BLUE,
      fontWeight: "900",
    },

    insightCard: {
      marginTop: 5,
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
      fontSize: 15,
      color: TEXT,
      fontWeight: "900",
    },

    insightDescription: {
      marginTop: 5,
      fontSize: 11,
      lineHeight: 17,
      color: MUTED,
      fontWeight: "500",
    },

    restoreButton: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingVertical: 17,
    },

    restoreText: {
      fontSize: 12,
      color: MUTED,
      fontWeight: "700",
    },

    footer: {
      alignItems: "center",
      marginTop: 10,
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
  });