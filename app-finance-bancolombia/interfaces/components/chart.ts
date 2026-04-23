export type AnnualChartPoint = {
  label: string;
  value: number;
};

export type AnnualLineChartProps = {
  data: AnnualChartPoint[];
  color: string;
  maxValue: number;
  stepValue: number;
  formatValue: (value: number) => string;
};
