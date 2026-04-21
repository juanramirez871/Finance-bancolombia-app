import { Colors } from "@/constants/theme";

import type { Account } from "@/interfaces/income";

export const BCO = {
  bg: "#353537",
  card: "#353537",
  border: "#353537",
  text: Colors.white,
  muted: "#B6BBC2",
  divider: "#2d2d2eff",
} as const;

export const ACCOUNTS: Account[] = [
  {
    id: "1",
    label: "Cuenta de Ahorro *999",
    transactions: [
      {
        id: "t1",
        label: "Empresa A transfirió",
        amount: "$323.000",
        date: "2026-04-19",
        time: "10:32",
      },
      {
        id: "t2",
        label: "Empresa B transfirió",
        amount: "$150.000",
        date: "2026-04-19",
        time: "08:14",
      },
      {
        id: "t3",
        label: "Empresa C transfirió",
        amount: "$480.000",
        date: "2026-04-18",
        time: "19:06",
      },
      {
        id: "t4",
        label: "Empresa D transfirió",
        amount: "$210.000",
        date: "2026-04-18",
        time: "12:41",
      },
      {
        id: "t5",
        label: "Empresa E transfirió",
        amount: "$95.000",
        date: "2026-04-18",
        time: "07:52",
      },
      {
        id: "t6",
        label: "Empresa F transfirió",
        amount: "$560.000",
        date: "2026-04-17",
        time: "16:18",
      },
      {
        id: "t7",
        label: "Empresa G transfirió",
        amount: "$323.000",
        date: "2026-04-17",
        time: "09:27",
      },
      {
        id: "t8",
        label: "Empresa H transfirió",
        amount: "$710.000",
        date: "2026-04-16",
        time: "20:11",
      },
      {
        id: "t9",
        label: "Empresa H transfirió",
        amount: "$710.000",
        date: "2026-04-16",
        time: "14:03",
      },
      {
        id: "t10",
        label: "Empresa H transfirió",
        amount: "$710.000",
        date: "2026-04-16",
        time: "11:09",
      },
      {
        id: "t11",
        label: "Empresa H transfirió",
        amount: "$710.000",
        date: "2026-04-16",
        time: "08:37",
      },
    ],
  },
];

export const INCOME_CHART_DATA = [
  { value: 1_150_000, label: "Ene", frontColor: Colors.purple },
  { value: 980_000, label: "Feb", frontColor: Colors.purple },
  { value: 1_320_000, label: "Mar", frontColor: Colors.purple },
  { value: 1_800_000, label: "Abr", frontColor: Colors.yellow },
  { value: 1_600_000, label: "May", frontColor: Colors.purple },
  { value: 2_050_000, label: "Jun", frontColor: Colors.purple },
  { value: 1_900_000, label: "Jul", frontColor: Colors.purple },
  { value: 2_300_000, label: "Ago", frontColor: Colors.green },
  { value: 2_100_000, label: "Sep", frontColor: Colors.purple },
  { value: 2_450_000, label: "Oct", frontColor: Colors.purple },
  { value: 2_250_000, label: "Nov", frontColor: Colors.purple },
  { value: 2_800_000, label: "Dic", frontColor: Colors.yellow },
];

export const ASSETS_CHART_DATA = [
  { value: 8_500_000, label: "Ene", frontColor: Colors.green },
  { value: 8_650_000, label: "Feb", frontColor: Colors.green },
  { value: 8_700_000, label: "Mar", frontColor: Colors.green },
  { value: 8_950_000, label: "Abr", frontColor: Colors.yellow },
  { value: 9_150_000, label: "May", frontColor: Colors.green },
  { value: 9_300_000, label: "Jun", frontColor: Colors.green },
  { value: 9_650_000, label: "Jul", frontColor: Colors.green },
  { value: 9_900_000, label: "Ago", frontColor: Colors.yellow },
  { value: 10_100_000, label: "Sep", frontColor: Colors.green },
  { value: 10_450_000, label: "Oct", frontColor: Colors.green },
  { value: 10_600_000, label: "Nov", frontColor: Colors.green },
  { value: 11_000_000, label: "Dic", frontColor: Colors.yellow },
];
