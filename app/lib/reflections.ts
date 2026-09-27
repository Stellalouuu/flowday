export const reflectionStorageKey = "flowday-reflections";

export const moods = ["Great", "Good", "Okay", "Tough", "Difficult"] as const;

export type Mood = (typeof moods)[number];

export type DailyReflection = {
  date: string;
  wentWell: string;
  learned: string;
  grateful: string;
  notes: string;
  mood: Mood | "";
};

export type ReflectionCollection = Record<string, DailyReflection>;

const reflectionListeners = new Set<() => void>();

export function subscribeToReflections(listener: () => void) {
  reflectionListeners.add(listener);
  return () => reflectionListeners.delete(listener);
}

export function getReflectionSnapshot() {
  return typeof window === "undefined"
    ? null
    : window.localStorage.getItem(reflectionStorageKey);
}

export function saveReflections(reflections: ReflectionCollection) {
  window.localStorage.setItem(reflectionStorageKey, JSON.stringify(reflections));
  reflectionListeners.forEach((listener) => listener());
}
