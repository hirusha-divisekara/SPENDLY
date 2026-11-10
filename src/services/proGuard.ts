import { router } from "expo-router";
import { getProStatus } from "./pro";

export async function requirePro(): Promise<boolean> {
  const isPro = await getProStatus();

  if (!isPro) {
    router.push("/pro");
    return false;
  }

  return true;
}