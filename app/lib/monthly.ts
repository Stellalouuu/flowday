export const monthlyPlanStorageKey = "flowday-monthly-plans";
export const monthlyMomentStorageKey = "flowday-monthly-moments";
export const monthlyReflectionStorageKey = "flowday-monthly-reflections";

export type MonthlyDirection = {
  id: string;
  title: string;
  description: string;
};

export type MonthlyPlan = {
  month: string;
  directions: MonthlyDirection[];
};

export type MonthlyMoment = {
  id: string;
  date: string;
  content: string;
  isYearHighlight?: boolean;
};

export type MonthlyReflection = {
  month: string;
  memorable: string;
  changes: string;
  grateful: string;
  carryForward: string;
  aiSummary?: string;
};

export type MonthlyPlanCollection = Record<string, MonthlyPlan>;
export type MonthlyMomentCollection = Record<string, MonthlyMoment[]>;
export type MonthlyReflectionCollection = Record<string, MonthlyReflection>;

const planListeners = new Set<() => void>();
const momentListeners = new Set<() => void>();
const reflectionListeners = new Set<() => void>();

export function subscribeToMonthlyPlans(listener: () => void) {
  planListeners.add(listener);
  return () => planListeners.delete(listener);
}

export function subscribeToMonthlyMoments(listener: () => void) {
  momentListeners.add(listener);
  return () => momentListeners.delete(listener);
}

export function subscribeToMonthlyReflections(listener: () => void) {
  reflectionListeners.add(listener);
  return () => reflectionListeners.delete(listener);
}

export function getMonthlyPlanSnapshot() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(monthlyPlanStorageKey);
}

export function getMonthlyMomentSnapshot() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(monthlyMomentStorageKey);
}

export function getMonthlyReflectionSnapshot() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(monthlyReflectionStorageKey);
}

export function saveMonthlyPlans(plans: MonthlyPlanCollection) {
  window.localStorage.setItem(monthlyPlanStorageKey, JSON.stringify(plans));
  planListeners.forEach((listener) => listener());
}

export function saveMonthlyMoments(moments: MonthlyMomentCollection) {
  window.localStorage.setItem(monthlyMomentStorageKey, JSON.stringify(moments));
  momentListeners.forEach((listener) => listener());
}

export function saveMonthlyReflections(reflections: MonthlyReflectionCollection) {
  window.localStorage.setItem(monthlyReflectionStorageKey, JSON.stringify(reflections));
  reflectionListeners.forEach((listener) => listener());
}
