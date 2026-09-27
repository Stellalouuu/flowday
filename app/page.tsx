"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const primaryNavigation = ["Today", "Calendar", "Tasks"];
const reflectionNavigation = ["Daily", "Weekly", "Monthly"];
const categories = ["Study", "Career", "Health", "Personal"];
const storageKey = "flowday-tasks";
const taskListeners = new Set<() => void>();

type Task = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  completed: boolean;
};

type TaskForm = Omit<Task, "id" | "completed">;

function subscribeToTasks(listener: () => void) {
  taskListeners.add(listener);
  return () => taskListeners.delete(listener);
}

function getTaskSnapshot() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(storageKey);
}

function saveTasks(tasks: Task[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(tasks));
  taskListeners.forEach((listener) => listener());
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getDefaultTasks(date: string): Task[] {
  return [
    { id: "mt5006", title: "MT5006 Class", date, startTime: "09:00", endTime: "", category: "Study", completed: false },
    { id: "assignment", title: "Finish assignment", date, startTime: "11:30", endTime: "", category: "Study", completed: true },
    { id: "interview", title: "Product interview preparation", date, startTime: "15:00", endTime: "", category: "Career", completed: false },
    { id: "gym", title: "Gym", date, startTime: "18:00", endTime: "", category: "Health", completed: false },
  ];
}

function emptyTaskForm(date: string): TaskForm {
  return { title: "", date, startTime: "", endTime: "", category: "Personal" };
}

function NavigationItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 border-l-2 py-2 pl-4 text-[13px] transition-colors ${
        active
          ? "border-stone-900 font-medium text-stone-950"
          : "border-transparent text-stone-500"
      }`}
    >
      {label}
    </div>
  );
}

function TaskRow({ task, onToggle, onEdit }: { task: Task; onToggle: () => void; onEdit: () => void }) {
  return (
    <div className="group grid grid-cols-[68px_24px_minmax(0,1fr)_auto] items-center gap-3 border-b border-stone-200/80 py-5 first:border-t">
      <time className="font-mono text-xs tracking-wide text-stone-400">{task.startTime}</time>
      <button
        type="button"
        aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
        onClick={onToggle}
        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
          task.completed
            ? "border-stone-900 bg-stone-900 text-white"
            : "border-stone-300"
        }`}
      >
        {task.completed && <span className="text-[11px] leading-none">✓</span>}
      </button>
      <button type="button" onClick={onEdit} className="min-w-0 text-left text-sm">
        <span
          className={
            task.completed ? "text-stone-400 line-through" : "text-stone-800"
          }
        >
          {task.title}
        </span>
      </button>
      <span className="text-[11px] uppercase tracking-[0.14em] text-stone-400">
        {task.category}
      </span>
    </div>
  );
}

function TaskEditor({
  task,
  isNew,
  onChange,
  onSave,
  onDelete,
  onClose,
}: {
  task: TaskForm;
  isNew: boolean;
  onChange: (field: keyof TaskForm, value: string) => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-stone-950/15 px-5 py-8">
      <form onSubmit={onSave} className="w-full max-w-md border border-stone-200 bg-[#fafaf9] p-7 shadow-xl shadow-stone-900/5">
        <div className="mb-7 flex items-start justify-between">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
              {isNew ? "New task" : "Edit task"}
            </p>
            <h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">
              {isNew ? "Add to your day" : "Update your task"}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-xl leading-none text-stone-400">
            ×
          </button>
        </div>

        <label className="block text-xs text-stone-500">
          Task name
          <input required autoFocus value={task.title} onChange={(event) => onChange("title", event.target.value)} className="mt-2 w-full border-b border-stone-300 bg-transparent px-0 py-2 text-sm text-stone-900 outline-none focus:border-stone-900" />
        </label>
        <div className="mt-6 grid grid-cols-2 gap-5">
          <label className="text-xs text-stone-500">
            Date
            <input required type="date" value={task.date} onChange={(event) => onChange("date", event.target.value)} className="mt-2 w-full border-b border-stone-300 bg-transparent px-0 py-2 text-sm text-stone-900 outline-none focus:border-stone-900" />
          </label>
          <label className="text-xs text-stone-500">
            Category
            <select value={task.category} onChange={(event) => onChange("category", event.target.value)} className="mt-2 w-full border-b border-stone-300 bg-transparent px-0 py-2 text-sm text-stone-900 outline-none focus:border-stone-900">
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="text-xs text-stone-500">
            Start time
            <input required type="time" value={task.startTime} onChange={(event) => onChange("startTime", event.target.value)} className="mt-2 w-full border-b border-stone-300 bg-transparent px-0 py-2 text-sm text-stone-900 outline-none focus:border-stone-900" />
          </label>
          <label className="text-xs text-stone-500">
            End time <span className="text-stone-400">(optional)</span>
            <input type="time" value={task.endTime} onChange={(event) => onChange("endTime", event.target.value)} className="mt-2 w-full border-b border-stone-300 bg-transparent px-0 py-2 text-sm text-stone-900 outline-none focus:border-stone-900" />
          </label>
        </div>

        <div className="mt-9 flex items-center justify-between">
          {!isNew ? <button type="button" onClick={onDelete} className="text-xs text-stone-400 hover:text-red-700">Delete task</button> : <span />}
          <div className="flex items-center gap-4">
            <button type="button" onClick={onClose} className="text-xs text-stone-500">Cancel</button>
            <button type="submit" className="bg-stone-900 px-4 py-2 text-xs text-white">Save</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const today = formatDateKey(new Date());
  const storedTasks = useSyncExternalStore(subscribeToTasks, getTaskSnapshot, () => null);
  const tasks = storedTasks ? (JSON.parse(storedTasks) as Task[]) : getDefaultTasks(today);
  const [editor, setEditor] = useState<{ task: TaskForm; taskId?: string } | null>(null);

  useEffect(() => {
    if (window.localStorage.getItem(storageKey) === null) saveTasks(getDefaultTasks(today));
  }, [today]);

  const visibleTasks = tasks
    .filter((task) => task.date === today)
    .sort((firstTask, secondTask) => firstTask.startTime.localeCompare(secondTask.startTime));
  const completedCount = visibleTasks.filter((task) => task.completed).length;

  function openNewTask() {
    setEditor({ task: emptyTaskForm(today) });
  }

  function openTask(task: Task) {
    setEditor({ task: { ...task }, taskId: task.id });
  }

  function updateEditor(field: keyof TaskForm, value: string) {
    setEditor((currentEditor) =>
      currentEditor
        ? { ...currentEditor, task: { ...currentEditor.task, [field]: value } }
        : null,
    );
  }

  function saveTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;

    if (editor.taskId) {
      saveTasks(
        tasks.map((task) =>
          task.id === editor.taskId ? { ...task, ...editor.task } : task,
        ),
      );
    } else {
      saveTasks([
        ...tasks,
        { ...editor.task, id: crypto.randomUUID(), completed: false },
      ]);
    }
    setEditor(null);
  }

  function deleteTask() {
    if (!editor?.taskId || !window.confirm("Delete this task?")) return;
    saveTasks(tasks.filter((task) => task.id !== editor.taskId));
    setEditor(null);
  }

  function toggleTask(taskId: string) {
    saveTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-[#fafaf9] text-stone-900">
      <aside className="fixed inset-y-0 left-0 flex w-64 flex-col border-r border-stone-200 bg-[#f7f7f5] px-8 py-8">
        <div className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em]">
          <span className="flex h-6 w-6 items-center justify-center bg-stone-900 text-[11px] text-white">
            F
          </span>
          FlowDay
        </div>

        <nav className="mt-16" aria-label="Main navigation">
          <p className="mb-3 px-4 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
            Workspace
          </p>
          <div className="space-y-1">
            {primaryNavigation.map((item) => (
              <NavigationItem key={item} label={item} active={item === "Today"} />
            ))}
          </div>

          <p className="mb-3 mt-12 px-4 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
            Reflection
          </p>
          <div className="space-y-1">
            {reflectionNavigation.map((item) => (
              <NavigationItem key={item} label={item} />
            ))}
          </div>
        </nav>

        <div className="mt-auto flex items-center gap-3 border-t border-stone-200 pt-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-xs font-medium text-stone-600">
            Z
          </span>
          <div>
            <p className="text-xs font-medium text-stone-700">Zoe</p>
            <p className="mt-0.5 text-[11px] text-stone-400">Personal space</p>
          </div>
        </div>
      </aside>

      <section className="ml-64 min-h-screen px-10 py-12 sm:px-16 lg:px-24">
        <div className="mx-auto max-w-3xl">
          <header className="mb-20">
            <p className="text-sm text-stone-400">
              {today ? formatDateLabel(new Date(`${today}T12:00:00`)) : ""}
            </p>
            <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-stone-950">
              {getGreeting(new Date().getHours())}
            </h1>
          </header>

          <section aria-labelledby="today-heading">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">
                  Schedule
                </p>
                <h2
                  id="today-heading"
                  className="text-2xl font-medium tracking-[-0.035em] text-stone-950"
                >
                  Today
                </h2>
              </div>
              <span className="text-xs text-stone-400">
                {completedCount} of {visibleTasks.length} complete
              </span>
            </div>

            <div>
              {visibleTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onEdit={() => openTask(task)}
                />
              ))}
            </div>

            <div className="pt-5">
              <button type="button" onClick={openNewTask} className="text-sm text-stone-400 hover:text-stone-900">
                + Add task
              </button>
            </div>
          </section>
        </div>
      </section>
      {editor && (
        <TaskEditor
          task={editor.task}
          isNew={!editor.taskId}
          onChange={updateEditor}
          onSave={saveTask}
          onDelete={deleteTask}
          onClose={() => setEditor(null)}
        />
      )}
    </main>
  );
}