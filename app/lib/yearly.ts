export const yearlyPlanStorageKey = "flowday-yearly-plans";
export const yearlyReflectionStorageKey = "flowday-yearly-reflections";

export type YearlyDirection = {
  id: string;
  title: string;
  description: string;
};

export type YearlyPlan = {
  year: string;
  directions: YearlyDirection[];
  remember: string;
};

export type YearlyReflection = {
  year: string;
  changed: string;
  proud: string;
  learned: string;
  peopleAndThings: string;
  carryForward: string;
  noteToNextYear: string;
  aiSummary?: string;
};

export type YearlyPlanCollection = Record<string, YearlyPlan>;
export type YearlyReflectionCollection = Record<string, YearlyReflection>;

const planListeners = new Set<() => void>();
const reflectionListeners = new Set<() => void>();

export function subscribeToYearlyPlans(listener: () => void) {
  planListeners.add(listener);
  return () => planListeners.delete(listener);
}

export function subscribeToYearlyReflections(listener: () => void) {
  reflectionListeners.add(listener);
  return () => reflectionListeners.delete(listener);
}

export function getYearlyPlanSnapshot() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(yearlyPlanStorageKey);
}

export function getYearlyReflectionSnapshot() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(yearlyReflectionStorageKey);
}

export function saveYearlyPlans(plans: YearlyPlanCollection) {
  window.localStorage.setItem(yearlyPlanStorageKey, JSON.stringify(plans));
  planListeners.forEach((listener) => listener());
}

export function saveYearlyReflections(reflections: YearlyReflectionCollection) {
  window.localStorage.setItem(yearlyReflectionStorageKey, JSON.stringify(reflections));
  reflectionListeners.forEach((listener) => listener());
}
