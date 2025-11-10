import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { EdgeToEdge } from "@capawesome/capacitor-android-edge-to-edge-support";
import { n as navigation } from "../../chunks/navigation.svelte.js";
async function load() {
  const prefers_dark = window.matchMedia("(prefers-color-scheme: dark)");
  await updateSystemBars(prefers_dark.matches);
  prefers_dark.addEventListener("change", (event) => {
    updateSystemBars(event.matches);
  });
  if (Capacitor.isNativePlatform()) {
    App.addListener("backButton", () => {
      if (navigation.history.length > 0) {
        navigation.goBack();
      } else {
        App.minimizeApp();
      }
    });
  }
}
async function updateSystemBars(is_dark) {
  const background_color = is_dark ? "#26272B" : "#F7F8F8";
  try {
    await EdgeToEdge.setBackgroundColor({ color: background_color });
  } catch (err) {
    console.error("Failed to update system bars:", err);
  }
}
export {
  load
};
