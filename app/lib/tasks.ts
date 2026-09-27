export const categories = ["Study", "Career", "Health", "Personal"];
export const storageKey = "flowday-tasks";

const taskListeners = new Set<() => void>();

export type Task = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  completed: boolean;
};

export type TaskForm = Omit<Task, "id" | "completed">;

export function subscribeToTasks(listener: () => void) {
  taskListeners.add(listener);
  return () => taskListeners.delete(listener);
}

export function getTaskSnapshot() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(storageKey);
}

export function saveTasks(tasks: Task[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(tasks));
  taskListeners.forEach((listener) => listener());
}

export function getDefaultTasks(date: string): Task[] {
  return [
    { id: "mt5006", title: "MT5006 课程", date, startTime: "09:00", endTime: "", category: "Study", completed: false },
    { id: "assignment", title: "完成作业", date, startTime: "11:30", endTime: "", category: "Study", completed: true },
    { id: "interview", title: "产品面试准备", date, startTime: "15:00", endTime: "", category: "Career", completed: false },
    { id: "gym", title: "健身", date, startTime: "18:00", endTime: "", category: "Health", completed: false },
  ];
}

export function emptyTaskForm(date: string): TaskForm {
  return { title: "", date, startTime: "", endTime: "", category: "Personal" };
}
