import { useEffect } from "react";
import { ActivityIndicator, ImageBackground, StyleSheet } from "react-native";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

// Keep the native splash visible until our welcome screen has rendered.
SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_MS = 2200;

export default function Splash() {
  useEffect(() => {
    let alive = true;
    (async () => {
      // Let the welcome screen paint first, then dismiss the native splash.
      await new Promise((r) => setTimeout(r, 300));
      if (alive) {
        try {
          await SplashScreen.hideAsync();
        } catch {}
      }
    })();
    const t = setTimeout(() => {
      if (alive) router.replace("/home");
    }, SPLASH_MS);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  return (
    <ImageBackground
      source={require("../assets/splash.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <ActivityIndicator size="large" color="#E8B44A" style={styles.spin} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#14102B",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  spin: { marginBottom: 120 },
});
