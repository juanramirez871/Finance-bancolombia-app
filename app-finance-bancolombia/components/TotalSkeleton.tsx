import { StyleSheet } from "react-native";
import { View } from "react-native";

export function TotalSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.shimmer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36,
    width: 150,
    backgroundColor: "#454545",
    borderRadius: 4,
    overflow: "hidden",
  },
  shimmer: {
    flex: 1,
    backgroundColor: "#555",
  },
});