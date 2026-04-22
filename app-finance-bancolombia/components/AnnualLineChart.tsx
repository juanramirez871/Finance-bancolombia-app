import { BCO } from "@/constants/income";
import { Colors } from "@/constants/theme";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop, Circle } from "react-native-svg";

export type AnnualChartPoint = {
  label: string;
  value: number;
};

type AnnualLineChartProps = {
  data: AnnualChartPoint[];
  color: string;
  maxValue: number;
  stepValue: number;
  formatValue: (value: number) => string;
};

export function AnnualLineChart({
  data,
  color,
  maxValue,
  stepValue,
  formatValue,
}: AnnualLineChartProps) {
  const { width } = useWindowDimensions();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const axisWidth = 52;
  const pointSpacing = 76;
  const chartWidth = Math.max(width - 72, data.length * pointSpacing);
  const contentWidth = axisWidth + chartWidth;
  const chartHeight = 240;
  const plotHeight = 150;
  const topPadding = 14;
  const bottomPadding = 44;
  const leftPadding = 12;
  const rightPadding = 12;

  const points = useMemo(() => {
    const usableWidth = Math.max(chartWidth - leftPadding - rightPadding, 1);
    const stepX = data.length > 1 ? usableWidth / (data.length - 1) : 0;

    return data.map((item, index) => {
      const x = leftPadding + index * stepX;
      const ratio = maxValue > 0 ? item.value / maxValue : 0;
      const y = topPadding + plotHeight - ratio * plotHeight;
      return { ...item, x, y };
    });
  }, [chartWidth, data, maxValue]);

  const selectedPoint =
    (selectedIndex !== null ? points[selectedIndex] : null) ??
    (points.length ? points[points.length - 1] : null);

  const formatAxisLabel = (label: string) =>
    label.length > 12 ? `${label.slice(0, 11)}…` : label;

  const yTicks = useMemo(() => {
    const tickCount = Math.max(1, Math.round(maxValue / stepValue));
    return Array.from({ length: tickCount + 1 }, (_, index) => index * stepValue).reverse();
  }, [maxValue, stepValue]);

  const linePath = useMemo(() => {
    if (!points.length) return "";
    return points
      .map((p, index) => `${index === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
  }, [points]);

  const areaPath = useMemo(() => {
    if (!points.length) return "";
    const first = points[0];
    const last = points[points.length - 1];
    const baselineY = topPadding + plotHeight;
    return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [linePath, points]);

  const tooltipLeft = useMemo(() => {
    if (!selectedPoint) return 0;
    const raw = axisWidth + selectedPoint.x - 70;
    return Math.max(axisWidth + 4, Math.min(raw, contentWidth - 144 - 8));
  }, [contentWidth, selectedPoint]);

  const tooltipTop = useMemo(() => {
    if (!selectedPoint) return 0;
    return Math.max(8, selectedPoint.y - 72);
  }, [selectedPoint]);

  return (
    <View style={{ width: "100%" }}>
      <View style={{ flexDirection: "row", height: chartHeight }}>
        <View
          style={{
            width: axisWidth,
            height: chartHeight - 18,
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
            justifyContent: "space-between",
            paddingRight: 8,
          }}
        >
          {yTicks.map((tick) => (
            <Text key={tick} style={styles.yAxisLabel}>
              {formatValue(Number(tick))}
            </Text>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ width: chartWidth }}
          style={{ flex: 1 }}
        >
          <View style={{ width: chartWidth, height: chartHeight - 18, position: "relative" }}>
            <Svg width={chartWidth} height={chartHeight - 18}>
              <Defs>
                <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={color} stopOpacity={0.24} />
                  <Stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </LinearGradient>
              </Defs>

              {Array.from({ length: yTicks.length }).map((_, index) => {
                const y = topPadding + (plotHeight / Math.max(1, yTicks.length - 1)) * index;
                return (
                  <Path
                    key={index}
                    d={`M ${leftPadding} ${y} H ${chartWidth - rightPadding}`}
                    stroke={BCO.divider}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                    opacity={0.35}
                  />
                );
              })}

              {linePath ? (
                <Path d={areaPath} fill="url(#areaFill)" />
              ) : null}
              {linePath ? (
                <Path d={linePath} stroke={color} strokeWidth={3} fill="none" />
              ) : null}

              {points.map((point, index) => (
                <Circle key={point.label} cx={point.x} cy={point.y} r={4} fill={color} />
              ))}
            </Svg>

            {points.map((point, index) => (
              <Pressable
                key={`${point.label}-press`}
                onPress={() => {
                  setSelectedIndex(index);
                  setIsTooltipVisible(true);
                }}
                style={{
                  position: "absolute",
                  left: point.x - 18,
                  top: point.y - 18,
                  width: 36,
                  height: 36,
                }}
              />
            ))}

            {points.map((point) => (
              <View
                key={`${point.label}-label`}
                style={{
                  position: "absolute",
                  left: point.x - 18,
                  bottom: 0,
                  width: 72,
                  alignItems: "center",
                }}
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={styles.xAxisLabel}
                >
                  {selectedPoint?.label === point.label
                    ? point.label
                    : formatAxisLabel(point.label)}
                </Text>
              </View>
            ))}

            {selectedPoint && isTooltipVisible ? (
              <View
                style={[
                  styles.tooltip,
                  {
                    left: tooltipLeft,
                    top: tooltipTop,
                  },
                ]}
              >
                <Text style={styles.tooltipTitle}>
                  {selectedPoint.label}
                </Text>
                <Text style={styles.tooltipValue}>
                  {formatValue(selectedPoint.value)}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = {
  tooltip: {
    position: "absolute" as const,
    width: 144,
    minHeight: 64,
    justifyContent: "center" as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: BCO.card,
    borderWidth: 1,
    borderColor: BCO.border,
  },
  tooltipTitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.white,
    flexShrink: 1,
  },
  tooltipValue: {
    fontSize: 13,
    fontWeight: "800" as const,
    color: Colors.white,
    marginTop: 2,
  },
  yAxisLabel: {
    fontSize: 10,
    color: BCO.muted,
  },
  xAxisLabel: {
    fontSize: 10,
    color: BCO.muted,
    textAlign: "center" as const,
  },
};
