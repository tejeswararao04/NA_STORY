import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="trips" />
        <Stack.Screen name="editor" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="detail" />
        <Stack.Screen name="me" />
        {/* legacy */}
        <Stack.Screen name="home" options={{ headerShown: true, headerTitle: "NA Story", headerStyle: { backgroundColor: "#000" } as any, headerTintColor: "#fff" }} />
      </Stack>
    </>
  );
}
