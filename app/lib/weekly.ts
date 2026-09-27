export const weeklyPlanStorageKey = "flowday-weekly-plans";
export const weeklyReflectionStorageKey = "flowday-weekly-reflections";

export type WeeklyPlan = {
  weekStart: string;
  focusItems: string[];
  oneThing: string;
  weeklyNote: string;
};

export type WeeklyReflection = {
  weekStart: string;
  memorable: string;
  learned: string;
  grateful: string;
  nextWeek: string;
  aiSummary?: string;
};

export type WeeklyPlanCollection = Record<string, WeeklyPlan>;
export type WeeklyReflectionCollection = Record<string, WeeklyReflection>;

const planListeners = new Set<() => void>();
const reflectionListeners = new Set<() => void>();

export function subscribeToWeeklyPlans(listener: () => void) {
  planListeners.add(listener);
  return () => planListeners.delete(listener);
}

export function subscribeToWeeklyReflections(listener: () => void) {
  reflectionListeners.add(listener);
  return () => reflectionListeners.delete(listener);
}

export function getWeeklyPlanSnapshot() {
  return typeof window === "undefined"
    ? null
    : window.localStorage.getItem(weeklyPlanStorageKey);
}

export function getWeeklyReflectionSnapshot() {
  return typeof window === "undefined"
    ? null
    : window.localStorage.getItem(weeklyReflectionStorageKey);
}

export function saveWeeklyPlans(plans: WeeklyPlanCollection) {
  window.localStorage.setItem(weeklyPlanStorageKey, JSON.stringify(plans));
  planListeners.forEach((listener) => listener());
}

export function saveWeeklyReflections(reflections: WeeklyReflectionCollection) {
  window.localStorage.setItem(weeklyReflectionStorageKey, JSON.stringify(reflections));
  reflectionListeners.forEach((listener) => listener());
}
