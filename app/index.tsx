import { Link } from "expo-router";
import { Text, View } from "react-native";
import Login from "./Login";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Hello</Text>

      <Link href="/Login">Login</Link>

    </View>
  );
}
