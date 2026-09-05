export type IsoDate = `${number}-${number}-${number}` | string;

export interface DiningTransaction {
  date: IsoDate;
  time?: string;
  rawLocation?: string;
  location: string;
  amount: number;
  source?: string;
}

export interface BalanceSnapshot {
  date: IsoDate;
  balance: number;
  source?: string;
}

export interface AwayPeriod {
  start: IsoDate;
  end: IsoDate;
}

export interface PlanSettings {
  startingBudget: number;
  startDate: IsoDate;
  endDate: IsoDate;
  awayPeriods: AwayPeriod[];
}

export type BudgetStatus = 'under' | 'on' | 'over';

export interface BudgetStats {
  asOf: IsoDate;
  totalCampusDays: number;
  elapsedCampusDays: number;
  remainingCampusDays: number;
  targetPerCampusDay: number;
  itemizedSpent: number;
  officialBalance: number | null;
  officialSpent: number | null;
  paceSpend: number;
  averageSpentPerCampusDay: number;
  expectedSpend: number;
  paceDelta: number;
  status: BudgetStatus;
  safePerRemainingDay: number;
}
