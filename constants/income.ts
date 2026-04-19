import { Colors } from "@/constants/theme";

import type { Account } from "./income.types";

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

export const CHART_DATA = [
  { value: 50, label: "Ene", frontColor: Colors.purple },
  { value: 80, label: "Feb", frontColor: Colors.purple },
  { value: 90, label: "Mar", frontColor: Colors.purple },
  { value: 100, label: "Abr", frontColor: Colors.yellow },
  { value: 110, label: "May", frontColor: Colors.purple },
  { value: 120, label: "Jun", frontColor: Colors.purple },
  { value: 130, label: "Jul", frontColor: Colors.purple },
  { value: 140, label: "Ago", frontColor: Colors.green },
  { value: 150, label: "Sep", frontColor: Colors.purple },
  { value: 160, label: "Oct", frontColor: Colors.purple },
  { value: 170, label: "Nov", frontColor: Colors.purple },
  { value: 180, label: "Dic", frontColor: Colors.yellow },
];
