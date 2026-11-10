import AsyncStorage from "@react-native-async-storage/async-storage";

const PRO_STATUS_KEY = "@spendly_pro_status";

export async function getProStatus(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(PRO_STATUS_KEY);
    return value === "true";
  } catch (error) {
    console.error("Failed to read Pro status:", error);
    return false;
  }
}

export async function setProStatus(isPro: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(
      PRO_STATUS_KEY,
      isPro ? "true" : "false"
    );
  } catch (error) {
    console.error("Failed to save Pro status:", error);
  }
}

export async function enablePro(): Promise<void> {
  await setProStatus(true);
}

export async function disablePro(): Promise<void> {
  await setProStatus(false);
}

export async function clearProStatus(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PRO_STATUS_KEY);
  } catch (error) {
    console.error("Failed to clear Pro status:", error);
  }
}