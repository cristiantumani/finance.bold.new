export type MonthlyData = {
  month: string; // YYYY-MM format
  income: number;
  expense: number;
  savings: number;
  budget: number;
};

export type ReportError = {
  message: string;
  code?: string;
};

export type LoadingState = {
  monthlyOverview: boolean;
};
