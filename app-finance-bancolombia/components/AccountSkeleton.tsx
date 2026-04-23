import { View } from "react-native";
import type { AccountSkeletonProps } from "@/interfaces/components/income";
import { accountSkeletonStyles as styles } from "@/styles/accountSkeleton";

const PREVIEW_ROWS = [0, 1, 2, 3, 4] as const;

export function AccountSkeleton({ count = 2 }: AccountSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.block}>
          <View style={styles.header}>
            <View style={styles.titleLine} />
            <View style={styles.actionLine} />
          </View>

          <View style={styles.card}>
            {PREVIEW_ROWS.map((rowIndex) => (
              <View
                key={rowIndex}
                style={[styles.row, { borderBottomWidth: rowIndex < 4 ? 1 : 0 }]}
              >
                <View style={styles.rowContent}>
                  <View style={styles.mainLine} />
                  <View style={styles.subLine} />
                </View>
                <View style={styles.amountWrap}>
                  <View style={styles.amountLine} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );
}
