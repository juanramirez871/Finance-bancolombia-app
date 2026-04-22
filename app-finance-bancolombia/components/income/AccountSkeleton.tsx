import { View } from "react-native";
import { BCO } from "@/constants/income";

type SkeletonProps = {
  count?: number;
};

const shimmerColor = "#454545";

export function AccountSkeleton({ count = 2 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            marginHorizontal: 20,
            marginBottom: 24,
            marginTop: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                height: 20,
                width: 160,
                backgroundColor: shimmerColor,
                borderRadius: 4,
              }}
            />
            <View
              style={{
                height: 14,
                width: 55,
                backgroundColor: shimmerColor,
                borderRadius: 4,
              }}
            />
          </View>

          <View
            style={{
              backgroundColor: BCO.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: BCO.border,
              overflow: "hidden",
            }}
          >
            {[1, 2, 3, 4, 5].map((_, j) => (
              <View
                key={j}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  borderBottomWidth: j < 4 ? 1 : 0,
                  borderBottomColor: BCO.divider,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    padding: 10,
                    flex: 1,
                    gap: 4,
                  }}
                >
                  <View
                    style={{
                      height: 16,
                      width: 150,
                      backgroundColor: shimmerColor,
                      borderRadius: 3,
                    }}
                  />
                  <View
                    style={{
                      height: 12,
                      width: 90,
                      backgroundColor: shimmerColor,
                      borderRadius: 2,
                    }}
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      height: 16,
                      width: 75,
                      backgroundColor: shimmerColor,
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );
}
