import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(pages)/Home/index" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="Login" options={{ title: "Login" }} />
      <Stack.Screen name="SignUp" options={{ title: "Sign Up" }} />
    </Stack>
  );
}
