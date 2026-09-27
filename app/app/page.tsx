"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  categories,
  emptyTaskForm,
  getTaskSnapshot,
  saveTasks,
  subscribeToTasks,
  type Task,
  type TaskForm,
} from "../lib/tasks";
import {
  getReflectionSnapshot,
  moods,
  saveReflections,
  subscribeToReflections,
  type DailyReflection,
  type ReflectionCollection,
} from "../lib/reflections";
import {
  getWeeklyPlanSnapshot,
  getWeeklyReflectionSnapshot,
  saveWeeklyPlans,
  saveWeeklyReflections,
  subscribeToWeeklyPlans,
  subscribeToWeeklyReflections,
  type WeeklyPlan,
  type WeeklyPlanCollection,
  type WeeklyReflection,
  type WeeklyReflectionCollection,
} from "../lib/weekly";
import {
  buildWeeklyAIContext,
} from "../lib/weekly-ai";
import {
  getMonthlyMomentSnapshot,
  getMonthlyPlanSnapshot,
  getMonthlyReflectionSnapshot,
  saveMonthlyMoments,
  saveMonthlyPlans,
  saveMonthlyReflections,
  subscribeToMonthlyMoments,
  subscribeToMonthlyPlans,
  subscribeToMonthlyReflections,
  type MonthlyMoment,
  type MonthlyMomentCollection,
  type MonthlyPlan,
  type MonthlyPlanCollection,
  type MonthlyReflection,
  type MonthlyReflectionCollection,
} from "../lib/monthly";
import {
  buildMonthlyAIContext,
  generateMonthlySummary,
} from "../lib/monthly-ai";
import {
  getYearlyPlanSnapshot,
  getYearlyReflectionSnapshot,
  saveYearlyPlans,
  saveYearlyReflections,
  subscribeToYearlyPlans,
  subscribeToYearlyReflections,
  type YearlyPlan,
  type YearlyPlanCollection,
  type YearlyReflection,
  type YearlyReflectionCollection,
} from "../lib/yearly";
import {
  buildYearlyAIContext,
  generateYearlySummary,
} from "../lib/yearly-ai";
import {
  clearDemoDataset,
  completeOnboarding,
  getDemoModeSnapshot,
  getOnboardingSnapshot,
  loadDemoDataset,
  resetDemoDataset,
  subscribeToDemoMode,
} from "../lib/demo";

const primaryNavigation = ["Today", "Calendar", "Tasks"];
const reflectionNavigation = ["Daily", "Weekly", "Monthly", "Yearly"];
const navigationLabels: Record<string, string> = {
  Today: "今天",
  Calendar: "日历",
  Tasks: "任务",
  Daily: "每日",
  Weekly: "每周",
  Monthly: "每月",
  Yearly: "年度",
};
const categoryLabels: Record<string, string> = {
  Study: "学习",
  Career: "工作",
  Health: "健康",
  Personal: "个人",
};
const defaultTaskTitleLabels: Record<string, string> = {
  "MT5006 Class": "MT5006 课程",
  "Finish assignment": "完成作业",
  "Product interview preparation": "产品面试准备",
  Gym: "健身",
};
function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${getPart("year")}年${getPart("month")}月${getPart("day")}日 · ${getPart("weekday")}`;
}

function getWeekStart(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return formatDateKey(date);
}

function shiftDateKey(dateKey: string, offset: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return formatDateKey(date);
}

function formatMonthDay(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function getWeekdayLabel(dateKey: string) {
  return ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][new Date(`${dateKey}T12:00:00`).getDay()];
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthBounds(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = `${year}-${String(monthNumber).padStart(2, "0")}-01`;
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const end = `${year}-${String(monthNumber).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function shiftMonthKey(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  return getMonthKey(new Date(year, monthNumber - 1 + offset, 1));
}

function formatMonthTitle(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${year}年${monthNumber}月`;
}

function getTaskTitle(title: string) {
  return defaultTaskTitleLabels[title] ?? title;
}

function getCategoryLabel(category: string) {
  return categoryLabels[category] ?? category;
}

function NavigationItem({ label, active = false, onClick, disabled = false }: { label: string; active?: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 border-l-2 py-2 pl-4 text-[13px] transition-colors ${
        active
          ? "border-stone-900 font-medium text-stone-950"
          : "border-transparent text-stone-500"
      } ${disabled ? "cursor-default" : "w-full text-left hover:text-stone-900"}`}
    >
      {navigationLabels[label] ?? label}
    </button>
  );
}

function TaskRow({ task, onToggle, onEdit, showDate = false, overdue = false }: { task: Task; onToggle: () => void; onEdit: () => void; showDate?: boolean; overdue?: boolean }) {
  return (
    <div className="group grid grid-cols-[68px_24px_minmax(0,1fr)_auto] items-center gap-3 border-b border-stone-200/80 py-5 first:border-t">
      <time className="font-mono text-xs tracking-wide text-stone-400">{task.startTime}</time>
      <button
        type="button"
        aria-label={task.completed ? `将${getTaskTitle(task.title)}标记为未完成` : `将${getTaskTitle(task.title)}标记为已完成`}
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
          <span className="block">{getTaskTitle(task.title)}</span>
          {showDate && <span className={`mt-1 block text-[11px] font-normal ${overdue ? "text-amber-700/60" : "text-stone-400"}`}>{formatDateLabel(new Date(`${task.date}T12:00:00`))}</span>}
        </span>
      </button>
      <span className="text-[11px] uppercase tracking-[0.14em] text-stone-400">
        {getCategoryLabel(task.category)}
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
                  {isNew ? "新任务" : "编辑任务"}
            </p>
            <h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">
                  {isNew ? "添加到今天" : "更新任务"}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭" className="text-xl leading-none text-stone-400">
            ×
          </button>
        </div>

        <label className="block text-xs text-stone-500">
          任务名称
          <input required autoFocus value={task.title} onChange={(event) => onChange("title", event.target.value)} className="mt-2 w-full border-b border-stone-300 bg-transparent px-0 py-2 text-sm text-stone-900 outline-none focus:border-stone-900" />
        </label>
        <div className="mt-6 grid grid-cols-2 gap-5">
          <label className="text-xs text-stone-500">
                日期
            <input required type="date" value={task.date} onChange={(event) => onChange("date", event.target.value)} className="mt-2 w-full border-b border-stone-300 bg-transparent px-0 py-2 text-sm text-stone-900 outline-none focus:border-stone-900" />
          </label>
          <label className="text-xs text-stone-500">
                分类
            <select value={task.category} onChange={(event) => onChange("category", event.target.value)} className="mt-2 w-full border-b border-stone-300 bg-transparent px-0 py-2 text-sm text-stone-900 outline-none focus:border-stone-900">
                  {categories.map((category) => <option key={category} value={category}>{getCategoryLabel(category)}</option>)}
            </select>
          </label>
          <label className="text-xs text-stone-500">
                开始时间
            <input required type="time" value={task.startTime} onChange={(event) => onChange("startTime", event.target.value)} className="mt-2 w-full border-b border-stone-300 bg-transparent px-0 py-2 text-sm text-stone-900 outline-none focus:border-stone-900" />
          </label>
          <label className="text-xs text-stone-500">
                结束时间 <span className="text-stone-400">（可选）</span>
            <input type="time" value={task.endTime} onChange={(event) => onChange("endTime", event.target.value)} className="mt-2 w-full border-b border-stone-300 bg-transparent px-0 py-2 text-sm text-stone-900 outline-none focus:border-stone-900" />
          </label>
        </div>

        <div className="mt-9 flex items-center justify-between">
              {!isNew ? <button type="button" onClick={onDelete} className="text-xs text-stone-400 hover:text-red-700">删除任务</button> : <span />}
          <div className="flex items-center gap-4">
                <button type="button" onClick={onClose} className="text-xs text-stone-500">取消</button>
                <button type="submit" className="bg-stone-900 px-4 py-2 text-xs text-white">保存</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function CalendarView({
  tasks,
  today,
  selectedDate,
  onSelectDate,
}: {
  tasks: Task[];
  today: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const [month, setMonth] = useState(() => {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  });
  const monthLabel = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    year: "numeric",
  }).format(month);
  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday
      ? null
      : new Date(month.getFullYear(), month.getMonth(), index - firstWeekday + 1),
  );
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const selectedTasks = tasks
    .filter((task) => task.date === selectedDate)
    .sort((firstTask, secondTask) => firstTask.startTime.localeCompare(secondTask.startTime));

  function changeMonth(offset: number) {
    setMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  }

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_250px]">
      <section aria-labelledby="calendar-heading">
        <header className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">日历</p>
            <h1 id="calendar-heading" className="text-2xl font-medium tracking-[-0.035em] text-stone-950">{monthLabel}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="上个月" className="text-xl leading-none text-stone-400 hover:text-stone-900">←</button>
            <button type="button" onClick={() => changeMonth(1)} aria-label="下个月" className="text-xl leading-none text-stone-400 hover:text-stone-900">→</button>
            <button type="button" onClick={() => { const currentDate = new Date(); setMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)); onSelectDate(today); }} className="ml-2 text-xs text-stone-500 hover:text-stone-900">今天</button>
          </div>
        </header>

        <div className="grid grid-cols-7 border-l border-t border-stone-200">
          {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
            <div key={day} className="border-b border-r border-stone-200 px-3 py-3 text-[10px] font-medium tracking-[0.15em] text-stone-400">{day}</div>
          ))}
          {calendarDays.map((date, index) => {
            const dateKey = date ? formatDateKey(date) : "";
            const dayTasks = tasks.filter((task) => task.date === dateKey).sort((firstTask, secondTask) => firstTask.startTime.localeCompare(secondTask.startTime));
            const isToday = dateKey === today;
            const isSelected = dateKey === selectedDate;
            return (
              <button
                type="button"
                key={date ? dateKey : `empty-${index}`}
                disabled={!date}
                onClick={() => date && onSelectDate(dateKey)}
                className={`min-h-[120px] overflow-hidden border-b border-r border-stone-200 p-3 text-left align-top ${
                  isSelected ? "bg-stone-100" : "bg-transparent"
                } ${date ? "hover:bg-stone-50" : "bg-stone-50/40"}`}
              >
                {date && (
                  <>
                    <span className={`inline-flex h-6 min-w-6 items-center justify-center px-1 text-xs ${isToday ? "border-b-2 border-stone-900 font-medium text-stone-950" : "text-stone-500"}`}>{date.getDate()}</span>
                    <div className="mt-3 space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <p key={task.id} className={`truncate text-[11px] leading-4 ${task.completed ? "text-stone-400 line-through" : "text-stone-600"}`}>
                          <span className="font-mono text-[10px] text-stone-400">{task.startTime}</span> {getTaskTitle(task.title)}
                        </p>
                      ))}
                      {dayTasks.length > 3 && <p className="pt-1 text-[11px] text-stone-400">还有 {dayTasks.length - 3} 项</p>}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="border-l border-stone-200 pl-7 xl:mt-16">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">当天安排</p>
        <h2 className="mb-7 text-lg font-medium tracking-[-0.025em] text-stone-950">{formatDateLabel(new Date(`${selectedDate}T12:00:00`))}</h2>
        {selectedTasks.length > 0 ? (
          <div className="space-y-5">
            {selectedTasks.map((task) => (
              <div key={task.id} className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 text-sm">
                <time className="font-mono text-[11px] text-stone-400">{task.startTime}</time>
                <span className={task.completed ? "text-stone-400 line-through" : "text-stone-700"}>{getTaskTitle(task.title)}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-stone-400">今天没有安排任务。</p>}
      </aside>
    </div>
  );
}

function TaskGroup({
  title,
  subtitle,
  tasks,
  onToggle,
  onEdit,
  showDate = false,
  overdue = false,
}: {
  title: string;
  subtitle?: string;
  tasks: Task[];
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  showDate?: boolean;
  overdue?: boolean;
}) {
  if (tasks.length === 0) return null;

  return (
    <section className="mb-12" aria-labelledby={`task-group-${title}`}>
      <div className="mb-4 flex items-baseline gap-3">
        <h2 id={`task-group-${title}`} className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500">{title}</h2>
        {subtitle && <span className="text-xs text-stone-400">{subtitle}</span>}
      </div>
      <div>
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} showDate={showDate} overdue={overdue} onToggle={() => onToggle(task.id)} onEdit={() => onEdit(task)} />
        ))}
      </div>
    </section>
  );
}

function formatShortDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatMonthLabel(monthKey: string) {
  const date = new Date(`${monthKey}-01T12:00:00`);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function getCompletedDateTitle(dateKey: string, today: string) {
  if (dateKey === today) return "今天";
  const yesterday = new Date(`${today}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === formatDateKey(yesterday)) return "昨天";
  return formatShortDate(dateKey);
}

function CompletedArchive({
  tasks,
  today,
  onToggle,
  onEdit,
}: {
  tasks: Task[];
  today: string;
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
}) {
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const recentStart = new Date(`${today}T12:00:00`);
  recentStart.setDate(recentStart.getDate() - 6);
  const recentStartKey = formatDateKey(recentStart);
  const recentTasks = tasks.filter((task) => task.date >= recentStartKey && task.date <= today);
  const olderTasks = tasks.filter((task) => task.date < recentStartKey || task.date > today);
  const recentDateKeys = Array.from(new Set(recentTasks.map((task) => task.date))).sort((firstDate, secondDate) => secondDate.localeCompare(firstDate));
  const monthGroups = olderTasks.reduce<Record<string, Task[]>>((groups, task) => {
    const monthKey = task.date.slice(0, 7);
    groups[monthKey] = groups[monthKey] ? [...groups[monthKey], task] : [task];
    return groups;
  }, {});
  const monthKeys = Object.keys(monthGroups).sort((firstMonth, secondMonth) => secondMonth.localeCompare(firstMonth));

  function toggleMonth(monthKey: string) {
    setExpandedMonths((currentMonths) => currentMonths.includes(monthKey)
      ? currentMonths.filter((currentMonth) => currentMonth !== monthKey)
      : [...currentMonths, monthKey]);
  }

  return (
    <div>
      {recentDateKeys.map((dateKey) => {
        const dateTasks = recentTasks.filter((task) => task.date === dateKey).sort((firstTask, secondTask) => firstTask.startTime.localeCompare(secondTask.startTime));
        return <TaskGroup key={dateKey} title={`${getCompletedDateTitle(dateKey, today)} · ${dateTasks.length}`} tasks={dateTasks} onToggle={onToggle} onEdit={onEdit} />;
      })}
      {monthKeys.length > 0 && (
        <section className="space-y-2">
          {monthKeys.map((monthKey) => {
            const monthTasks = monthGroups[monthKey].sort((firstTask, secondTask) => `${secondTask.date}${secondTask.startTime}`.localeCompare(`${firstTask.date}${firstTask.startTime}`));
            const expanded = expandedMonths.includes(monthKey);
            return (
              <div key={monthKey} className="border-b border-stone-200">
                <button type="button" onClick={() => toggleMonth(monthKey)} className="flex w-full items-center justify-between py-4 text-left text-sm text-stone-600 hover:text-stone-900">
                  <span>{formatMonthLabel(monthKey)}</span>
                  <span className="text-xs text-stone-400">已完成 {monthTasks.length} 项 {expanded ? "⌄" : "›"}</span>
                </button>
                {expanded && <div className="pb-6"><div>{monthTasks.map((task) => <TaskRow key={task.id} task={task} showDate onToggle={() => onToggle(task.id)} onEdit={() => onEdit(task)} />)}</div></div>}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

function AllTasksView({
  tasks,
  today,
  onToggle,
  onEdit,
}: {
  tasks: Task[];
  today: string;
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
}) {
  const dateKeys = Array.from(new Set(tasks.map((task) => task.date))).sort((firstDate, secondDate) => {
    const firstDistance = Math.abs(new Date(`${firstDate}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime());
    const secondDistance = Math.abs(new Date(`${secondDate}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime());
    return firstDistance - secondDistance || firstDate.localeCompare(secondDate);
  });

  return (
    <div className="space-y-12">
      {dateKeys.map((dateKey) => {
        const dateTasks = tasks.filter((task) => task.date === dateKey).sort((firstTask, secondTask) => firstTask.startTime.localeCompare(secondTask.startTime));
        const todoTasks = dateTasks.filter((task) => !task.completed);
        const completedTasks = dateTasks.filter((task) => task.completed);
        return (
          <section key={dateKey} aria-labelledby={`all-tasks-${dateKey}`}>
            <h2 id={`all-tasks-${dateKey}`} className="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500">{dateKey === today ? "今天" : formatDateLabel(new Date(`${dateKey}T12:00:00`))}</h2>
            {todoTasks.length > 0 && <TaskGroup title="待完成" tasks={todoTasks} onToggle={onToggle} onEdit={onEdit} />}
            {completedTasks.length > 0 && <TaskGroup title="已完成" tasks={completedTasks} onToggle={onToggle} onEdit={onEdit} />}
          </section>
        );
      })}
    </div>
  );
}

function TasksView({
  tasks,
  today,
  onAdd,
  onToggle,
  onEdit,
}: {
  tasks: Task[];
  today: string;
  onAdd: () => void;
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
}) {
  const [filter, setFilter] = useState<"all" | "todo" | "completed">("todo");
  const [search, setSearch] = useState("");
  const tomorrow = new Date(`${today}T12:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = formatDateKey(tomorrow);
  const searchTerm = search.trim().toLowerCase();
  const matchingTasks = tasks.filter((task) => getTaskTitle(task.title).toLowerCase().includes(searchTerm));
  const filteredTasks = matchingTasks.filter((task) => filter === "todo" ? !task.completed : filter === "completed" ? task.completed : true);
  const todoTasks = filteredTasks.filter((task) => !task.completed);
  const overdueTasks = todoTasks.filter((task) => task.date < today).sort((firstTask, secondTask) => `${firstTask.date}${firstTask.startTime}`.localeCompare(`${secondTask.date}${secondTask.startTime}`));
  const todayTasks = todoTasks.filter((task) => task.date === today).sort((firstTask, secondTask) => firstTask.startTime.localeCompare(secondTask.startTime));
  const tomorrowTasks = todoTasks.filter((task) => task.date === tomorrowKey).sort((firstTask, secondTask) => firstTask.startTime.localeCompare(secondTask.startTime));
  const upcomingDateKeys = Array.from(new Set(todoTasks.filter((task) => task.date > tomorrowKey).map((task) => task.date))).sort();
  const hasTasks = tasks.length > 0;
  const isSearch = searchTerm.length > 0;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-14">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">任务管理</p>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-medium tracking-[-0.04em] text-stone-950">任务</h1>
            <p className="mt-3 text-sm text-stone-400">所有待办，都在这里。</p>
          </div>
          <button type="button" onClick={onAdd} className="text-sm text-stone-400 hover:text-stone-900">+ 添加任务</button>
        </div>
      </header>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-5 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-5">
          {(["todo", "completed", "all"] as const).map((option) => (
            <button key={option} type="button" onClick={() => setFilter(option)} className={`border-b-2 pb-2 text-xs ${filter === option ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-700"}`}>
              {option === "todo" ? "待完成" : option === "completed" ? "已完成" : "全部"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-stone-400">
          <span className="sr-only">搜索任务</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索任务" className="w-40 border-b border-stone-300 bg-transparent py-2 text-sm text-stone-700 outline-none placeholder:text-stone-400 focus:border-stone-900" />
        </label>
      </div>
      {!hasTasks ? (
        <div className="py-10"><p className="text-sm text-stone-700">还没有任务。</p><p className="mt-2 text-sm text-stone-400">添加一件想完成的事吧。</p></div>
      ) : isSearch && filteredTasks.length === 0 ? (
        <p className="py-10 text-sm text-stone-400">没有找到匹配的任务。</p>
      ) : filter === "todo" && todoTasks.length === 0 ? (
        <div className="py-10"><p className="text-sm text-stone-700">今天没有待办了。</p><p className="mt-2 text-sm text-stone-400">可以给自己留一点空白。</p></div>
      ) : filter === "completed" && filteredTasks.length === 0 ? (
        <p className="py-10 text-sm text-stone-400">还没有完成记录。</p>
      ) : filter === "todo" ? (
        <>
          <TaskGroup title={`已过期 · ${overdueTasks.length}`} tasks={overdueTasks} showDate overdue onToggle={onToggle} onEdit={onEdit} />
          <TaskGroup title={`今天 · ${todayTasks.length}`} tasks={todayTasks} onToggle={onToggle} onEdit={onEdit} />
          <TaskGroup title={`明天 · ${tomorrowTasks.length}`} tasks={tomorrowTasks} onToggle={onToggle} onEdit={onEdit} />
          {upcomingDateKeys.map((dateKey) => <TaskGroup key={dateKey} title={formatShortDate(dateKey)} subtitle={formatDateLabel(new Date(`${dateKey}T12:00:00`)).split(" · ")[1]} tasks={todoTasks.filter((task) => task.date === dateKey).sort((firstTask, secondTask) => firstTask.startTime.localeCompare(secondTask.startTime))} onToggle={onToggle} onEdit={onEdit} />)}
        </>
      ) : filter === "completed" ? (
        <CompletedArchive tasks={filteredTasks} today={today} onToggle={onToggle} onEdit={onEdit} />
      ) : (
        <AllTasksView tasks={filteredTasks} today={today} onToggle={onToggle} onEdit={onEdit} />
      )}
    </div>
  );
}

type YearlyReflectionDraft = Omit<YearlyReflection, "year" | "aiSummary">;

function getYearlyReflectionDraft(reflection: YearlyReflection | undefined): YearlyReflectionDraft {
  return {
    changed: reflection?.changed ?? "",
    proud: reflection?.proud ?? "",
    learned: reflection?.learned ?? "",
    peopleAndThings: reflection?.peopleAndThings ?? "",
    carryForward: reflection?.carryForward ?? "",
    noteToNextYear: reflection?.noteToNextYear ?? "",
  };
}

function YearlyView({
  year,
  today,
  isDemoMode,
  tasks,
  dailyReflections,
  weeklyReflections,
  monthlyPlans,
  monthlyMoments,
  monthlyReflections,
  yearlyPlans,
  yearlyReflections,
  onOpenYear,
  onOpenMonth,
}: {
  year: string;
  today: string;
  isDemoMode: boolean;
  tasks: Task[];
  dailyReflections: ReflectionCollection;
  weeklyReflections: WeeklyReflectionCollection;
  monthlyPlans: MonthlyPlanCollection;
  monthlyMoments: MonthlyMomentCollection;
  monthlyReflections: MonthlyReflectionCollection;
  yearlyPlans: YearlyPlanCollection;
  yearlyReflections: YearlyReflectionCollection;
  onOpenYear: (year: string) => void;
  onOpenMonth: (month: string) => void;
}) {
  const [planDraft, setPlanDraft] = useState<YearlyPlan>(() => yearlyPlans[year] ?? { year, directions: [], remember: "" });
  const [reflectionDraft, setReflectionDraft] = useState<YearlyReflectionDraft>(() => getYearlyReflectionDraft(yearlyReflections[year]));
  const [editingReflection, setEditingReflection] = useState(() => !yearlyReflections[year]);
  const [generatingAI, setGeneratingAI] = useState(false);
  const savedReflection = yearlyReflections[year];
  const hasWrittenReflection = Boolean(savedReflection && [savedReflection.changed, savedReflection.proud, savedReflection.learned, savedReflection.peopleAndThings, savedReflection.carryForward, savedReflection.noteToNextYear].some((value) => value.trim()));
  const yearTasks = tasks.filter((task) => task.date.startsWith(`${year}-`));
  const completedTaskCount = yearTasks.filter((task) => task.completed).length;
  const dailyCount = Object.values(dailyReflections).filter((reflection) => reflection.date.startsWith(`${year}-`)).length;
  const weeklyCount = Object.values(weeklyReflections).filter((reflection) => reflection.weekStart.startsWith(`${year}-`) && [reflection.memorable, reflection.learned, reflection.grateful, reflection.nextWeek].some(Boolean)).length;
  const monthlyCount = Object.values(monthlyReflections).filter((reflection) => reflection.month.startsWith(`${year}-`) && [reflection.memorable, reflection.changes, reflection.grateful, reflection.carryForward].some(Boolean)).length;
  const months = Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
  const currentMonth = getMonthKey(new Date(`${today}T12:00:00`));
  const categoryCounts = categories.map((category) => ({ category, count: yearTasks.filter((task) => task.category === category).length }));
  const allMoments = Object.values(monthlyMoments).flat().filter((moment) => moment.date.startsWith(`${year}-`)).sort((first, second) => second.date.localeCompare(first.date));
  const highlightedMoments = allMoments.filter((moment) => moment.isYearHighlight);
  const otherMoments = allMoments.filter((moment) => !moment.isYearHighlight);
  const timeline = months.map((month) => ({ month, reflection: monthlyReflections[month], moments: monthlyMoments[month] ?? [] })).filter(({ reflection, moments }) => reflection || moments.length > 0);

  function savePlan() {
    saveYearlyPlans({ ...yearlyPlans, [year]: { ...planDraft, year, directions: planDraft.directions.filter((direction) => direction.title.trim() || direction.description.trim()) } });
  }

  function saveReflection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveYearlyReflections({ ...yearlyReflections, [year]: { year, ...reflectionDraft, aiSummary: savedReflection?.aiSummary } });
    setEditingReflection(false);
  }

  function toggleMoment(moment: MonthlyMoment) {
    const month = moment.date.slice(0, 7);
    const moments = monthlyMoments[month] ?? [];
    saveMonthlyMoments({ ...monthlyMoments, [month]: moments.map((item) => item.id === moment.id ? { ...item, isYearHighlight: !item.isYearHighlight } : item) });
  }

  function generateAIReflection() {
    setGeneratingAI(true);
    window.setTimeout(() => {
      const context = buildYearlyAIContext({ year, plan: planDraft, monthlyPlans, monthlyReflections, monthlyMoments, tasks, yearlyReflection: { year, ...reflectionDraft, aiSummary: savedReflection?.aiSummary } });
      const summary = isDemoMode && savedReflection?.aiSummary ? savedReflection.aiSummary : generateYearlySummary(context);
      const currentReflection = savedReflection ?? { year, ...getYearlyReflectionDraft(undefined) };
      saveYearlyReflections({ ...yearlyReflections, [year]: { ...currentReflection, aiSummary: summary } });
      setGeneratingAI(false);
    }, 350);
  }

  function deleteAIReflection() {
    const currentReflection = yearlyReflections[year];
    if (!currentReflection) return;
    const reflectionWithoutSummary = { ...currentReflection };
    delete reflectionWithoutSummary.aiSummary;
    saveYearlyReflections({ ...yearlyReflections, [year]: reflectionWithoutSummary });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-16">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">回顾</p>
        <h1 className="text-3xl font-medium tracking-[-0.04em] text-stone-950">年度</h1>
        <p className="mt-5 text-sm text-stone-400">{year}</p>
        <div className="mt-6 flex items-center gap-4 text-xs text-stone-400"><button type="button" onClick={() => onOpenYear(String(Number(year) - 1))} className="hover:text-stone-900">← {Number(year) - 1}</button><span className="text-stone-300">/</span><button type="button" onClick={() => onOpenYear(String(new Date(`${today}T12:00:00`).getFullYear()))} className="hover:text-stone-900">今年</button><span className="text-stone-300">/</span><button type="button" onClick={() => onOpenYear(String(Number(year) + 1))} className="hover:text-stone-900">{Number(year) + 1} →</button></div>
      </header>

      <section className="border-b border-stone-200 pb-12"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">计划</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">写给这一年的自己</h2><p className="mt-6 text-sm font-medium text-stone-700">今年，我想把时间留给什么？</p><div className="mt-7 space-y-4">{planDraft.directions.map((direction, index) => <div key={direction.id} className="border-b border-stone-200 pb-4"><div className="flex items-center gap-3"><span className="font-mono text-xs text-stone-400">{String(index + 1).padStart(2, "0")}</span><input value={direction.title} onChange={(event) => setPlanDraft((current) => ({ ...current, directions: current.directions.map((item) => item.id === direction.id ? { ...item, title: event.target.value } : item) }))} placeholder="方向" className="min-w-0 flex-1 bg-transparent text-sm text-stone-700 outline-none" /><button type="button" onClick={() => setPlanDraft((current) => ({ ...current, directions: current.directions.filter((item) => item.id !== direction.id) }))} aria-label="删除年度方向" className="text-sm text-stone-300">×</button></div><input value={direction.description} onChange={(event) => setPlanDraft((current) => ({ ...current, directions: current.directions.map((item) => item.id === direction.id ? { ...item, description: event.target.value } : item) }))} placeholder="写下这个方向想靠近的事情" className="mt-3 w-full bg-transparent pl-8 text-xs text-stone-400 outline-none" /></div>)}</div><button type="button" onClick={() => setPlanDraft((current) => ({ ...current, directions: [...current.directions, { id: crypto.randomUUID(), title: "", description: "" }] }))} className="mt-6 text-sm text-stone-400">+ 添加年度方向</button><label className="mt-10 block text-sm font-medium text-stone-700">今年，我希望自己记住：<textarea value={planDraft.remember} onChange={(event) => setPlanDraft((current) => ({ ...current, remember: event.target.value }))} rows={2} className="mt-4 w-full resize-none border-b border-stone-300 bg-transparent py-2 text-sm leading-7 outline-none focus:border-stone-900" /></label><button type="button" onClick={savePlan} className="mt-8 bg-stone-900 px-4 py-2 text-xs text-white">保存年度计划</button></section>

      <section className="border-b border-stone-200 py-12"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">一览</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">这一年</h2><div className="mt-7 grid grid-cols-2 gap-7 sm:grid-cols-4"><div><p className="text-2xl text-stone-900">{completedTaskCount}</p><p className="mt-2 text-xs text-stone-400">完成的事情</p></div><div><p className="text-2xl text-stone-900">{dailyCount}</p><p className="mt-2 text-xs text-stone-400">留下记录的日子</p></div><div><p className="text-2xl text-stone-900">{weeklyCount}</p><p className="mt-2 text-xs text-stone-400">完成周回顾</p></div><div><p className="text-2xl text-stone-900">{monthlyCount}</p><p className="mt-2 text-xs text-stone-400">完成月回顾</p></div></div></section>

      <section className="border-b border-stone-200 py-12"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">月份</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">我的 12 个月</h2><div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">{months.map((month) => { const monthTasks = tasks.filter((task) => task.date.startsWith(`${month}-`)); const monthDaily = Object.values(dailyReflections).filter((reflection) => reflection.date.startsWith(`${month}-`)).length; const monthReflection = monthlyReflections[month]; const future = month > currentMonth; return <button type="button" key={month} onClick={() => onOpenMonth(month)} className="border-b border-stone-200 pb-4 text-left hover:text-stone-900"><p className="text-sm text-stone-700">{Number(month.slice(5))}月</p><p className="mt-2 text-xs text-stone-400">{future ? "尚未开始" : monthTasks.length || monthDaily || monthReflection ? `完成 ${monthTasks.filter((task) => task.completed).length} 项 · 回顾 ${monthDaily} 天` : "没有留下记录"}</p><p className="mt-1 text-[11px] text-stone-400">{monthReflection ? "有月度回顾" : ""}{monthReflection?.aiSummary ? " · 有月记" : ""}</p></button>; })}</div></section>

      <section className="border-b border-stone-200 py-12"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">方向</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">这一年，我把注意力放在哪里</h2><div className="mt-7 space-y-4">{categoryCounts.map(({ category, count }) => <div key={category} className="grid grid-cols-[56px_1fr_28px] items-center gap-3 text-xs"><span className="text-stone-400">{getCategoryLabel(category)}</span><span className="h-1 bg-stone-200"><span className="block h-1 bg-stone-600" style={{ width: yearTasks.length ? `${Math.max((count / yearTasks.length) * 100, count ? 4 : 0)}%` : "0%" }} /></span><span className="text-right text-stone-500">{count}</span></div>)}</div></section>

      <section className="border-b border-stone-200 py-12"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">记录</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">值得记住的瞬间</h2><div className="mt-8 space-y-5">{[...highlightedMoments, ...otherMoments].slice(0, 24).map((moment) => <div key={`${moment.date}-${moment.id}`} className="flex items-start gap-4"><button type="button" onClick={() => toggleMoment(moment)} aria-label={moment.isYearHighlight ? "取消年度瞬间" : "标记为年度瞬间"} className="text-lg leading-none text-stone-400">{moment.isYearHighlight ? "★" : "☆"}</button><div><p className="text-xs text-stone-400">{formatMonthDay(moment.date)}</p><p className="mt-1 text-sm leading-7 text-stone-600">“{moment.content}”</p></div></div>)}</div>{allMoments.length === 0 && <p className="mt-7 text-sm text-stone-400">这一年还没有记录瞬间。</p>}</section>

      <section className="border-b border-stone-200 py-12"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">时间线</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">这一年留下了什么</h2><div className="mt-8 space-y-6">{timeline.map(({ month, reflection, moments }) => <div key={month}><p className="text-xs text-stone-400">{Number(month.slice(5))}月</p><p className="mt-2 text-sm leading-7 text-stone-600">{reflection?.aiSummary || reflection?.memorable || moments[0]?.content || ""}</p></div>)}</div></section>

      {hasWrittenReflection && !editingReflection ? <section className="border-b border-stone-200 py-12"><div className="flex items-start justify-between gap-5"><div><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">回顾</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">回望这一年</h2></div><button type="button" onClick={() => setEditingReflection(true)} className="text-xs text-stone-400">编辑年度回顾</button></div><div className="mt-10 space-y-8">{[["这一年，有哪些事情改变了我？", savedReflection?.changed], ["这一年，我为自己感到欣慰的是什么？", savedReflection?.proud], ["这一年，我学会了什么？", savedReflection?.learned], ["有哪些人和事情，我想记住？", savedReflection?.peopleAndThings], ["如果只能带一件东西进入下一年，我希望是什么？", savedReflection?.carryForward], ["想对明年的自己说什么？", savedReflection?.noteToNextYear]].map(([question, answer]) => <div key={question}><h3 className="text-sm font-medium text-stone-700">{question}</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-600">{answer || "还没有写下内容。"}</p></div>)}</div></section> : <form onSubmit={saveReflection} className="border-b border-stone-200 py-12"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">回顾</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">回望这一年</h2><div className="mt-10 space-y-9">{[["changed", "这一年，有哪些事情改变了我？", "不一定是大事，也可以是一段经历、一个决定，或者一个慢慢发生的变化。"], ["proud", "这一年，我为自己感到欣慰的是什么？", "一些完成的事情、坚持下来的选择，或者只有自己知道的进步。"], ["learned", "这一年，我学会了什么？", ""], ["peopleAndThings", "有哪些人和事情，我想记住？", ""], ["carryForward", "如果只能带一件东西进入下一年，我希望是什么？", ""], ["noteToNextYear", "想对明年的自己说什么？", ""]].map(([field, question, prompt]) => <label key={field} className="block"><span className="text-sm font-medium text-stone-700">{question}</span>{prompt && <span className="mt-2 block text-xs leading-5 text-stone-400">{prompt}</span>}<textarea value={reflectionDraft[field as keyof YearlyReflectionDraft]} onChange={(event) => setReflectionDraft((current) => ({ ...current, [field]: event.target.value }))} rows={3} className="mt-4 w-full resize-none border-b border-stone-300 bg-transparent px-0 py-2 text-sm leading-7 text-stone-700 outline-none focus:border-stone-900" /></label>)}</div><button type="submit" className="mt-10 bg-stone-900 px-4 py-2 text-xs text-white">保存年度回顾</button></form>}

      <section className="py-12"><p className="mb-3 text-sm font-medium text-stone-700">✦ FlowDay 写给我的 {year}</p>{savedReflection?.aiSummary ? <><p className="max-w-2xl whitespace-pre-line text-sm leading-7 text-stone-500">{savedReflection.aiSummary}</p><div className="mt-7 flex gap-5"><button type="button" disabled={generatingAI} onClick={generateAIReflection} className="text-sm text-stone-500">{generatingAI ? "✦ 正在写这一年…" : "↻ 重新生成"}</button><button type="button" disabled={generatingAI} onClick={deleteAIReflection} className="text-sm text-stone-400">删除年度信</button></div></> : <><p className="max-w-2xl text-sm leading-7 text-stone-500">FlowDay 可以结合这一年的计划、月度记录、值得记住的瞬间和你的回顾，整理成一封关于这一年的信。</p><button type="button" disabled={generatingAI} onClick={generateAIReflection} className="mt-7 bg-stone-900 px-5 py-3 text-sm text-white disabled:cursor-wait disabled:bg-stone-500">{generatingAI ? "✦ 正在写这一年…" : `✦ 写一封关于我的 ${year}`}</button></>}</section>
    </div>
  );
}

type MonthlyReflectionDraft = Omit<MonthlyReflection, "month" | "aiSummary">;

function getMonthlyReflectionDraft(reflection: MonthlyReflection | undefined): MonthlyReflectionDraft {
  return {
    memorable: reflection?.memorable ?? "",
    changes: reflection?.changes ?? "",
    grateful: reflection?.grateful ?? "",
    carryForward: reflection?.carryForward ?? "",
  };
}

function MonthlyView({
  today,
  initialMonth,
  isDemoMode,
  tasks,
  dailyReflections,
  weeklyPlans,
  weeklyReflections,
  monthlyPlans,
  monthlyMoments,
  monthlyReflections,
}: {
  today: string;
  initialMonth?: string;
  isDemoMode: boolean;
  tasks: Task[];
  dailyReflections: ReflectionCollection;
  weeklyPlans: WeeklyPlanCollection;
  weeklyReflections: WeeklyReflectionCollection;
  monthlyPlans: MonthlyPlanCollection;
  monthlyMoments: MonthlyMomentCollection;
  monthlyReflections: MonthlyReflectionCollection;
}) {
  const currentMonth = getMonthKey(new Date(`${today}T12:00:00`));
  const [month, setMonth] = useState(initialMonth ?? currentMonth);
  const [planDraft, setPlanDraft] = useState<MonthlyPlan>(() => monthlyPlans[currentMonth] ?? { month: currentMonth, directions: [] });
  const [momentEditor, setMomentEditor] = useState<{ id?: string; date: string; content: string } | null>(null);
  const [reflectionDraft, setReflectionDraft] = useState<MonthlyReflectionDraft>(() => getMonthlyReflectionDraft(monthlyReflections[currentMonth]));
  const [editingReflection, setEditingReflection] = useState(() => !monthlyReflections[currentMonth]);
  const [generatingAI, setGeneratingAI] = useState(false);
  const bounds = getMonthBounds(month);
  const savedReflection = monthlyReflections[month];
  const hasWrittenReflection = Boolean(savedReflection && [savedReflection.memorable, savedReflection.changes, savedReflection.grateful, savedReflection.carryForward].some((value) => value.trim()));
  const monthTasks = tasks.filter((task) => task.date >= bounds.start && task.date <= bounds.end);
  const completedTasks = monthTasks.filter((task) => task.completed);
  const dailyReflectionCount = Object.values(dailyReflections).filter((reflection) => reflection.date >= bounds.start && reflection.date <= bounds.end).length;
  const monthlyMomentsForView = (monthlyMoments[month] ?? []).slice().sort((firstMoment, secondMoment) => secondMoment.date.localeCompare(firstMoment.date));
  const overlappingWeeklyReflections = Object.values(weeklyReflections).filter((reflection) => reflection.weekStart <= bounds.end && shiftDateKey(reflection.weekStart, 6) >= bounds.start);
  const monthWeeklyNotes = overlappingWeeklyReflections.map((reflection) => reflection.aiSummary || reflection.memorable || reflection.learned || reflection.grateful).filter(Boolean);
  const categoryCounts = categories.map((category) => ({ category, count: monthTasks.filter((task) => task.category === category).length }));

  function selectMonth(nextMonth: string) {
    setMonth(nextMonth);
    setPlanDraft(monthlyPlans[nextMonth] ?? { month: nextMonth, directions: [] });
    setReflectionDraft(getMonthlyReflectionDraft(monthlyReflections[nextMonth]));
    setEditingReflection(!monthlyReflections[nextMonth]);
    setMomentEditor(null);
  }

  function savePlan() {
    saveMonthlyPlans({ ...monthlyPlans, [month]: { ...planDraft, month, directions: planDraft.directions.filter((direction) => direction.title.trim() || direction.description.trim()) } });
  }

  function saveMoment() {
    if (!momentEditor?.content.trim() || !momentEditor.date) return;
    const moments = monthlyMoments[month] ?? [];
    const existingMoment = momentEditor.id ? moments.find((moment) => moment.id === momentEditor.id) : undefined;
    const nextMoment: MonthlyMoment = { id: momentEditor.id ?? crypto.randomUUID(), date: momentEditor.date, content: momentEditor.content.trim(), isYearHighlight: existingMoment?.isYearHighlight };
    saveMonthlyMoments({ ...monthlyMoments, [month]: momentEditor.id ? moments.map((moment) => moment.id === momentEditor.id ? nextMoment : moment) : [...moments, nextMoment] });
    setMomentEditor(null);
  }

  function saveReflection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMonthlyReflections({ ...monthlyReflections, [month]: { month, ...reflectionDraft, aiSummary: savedReflection?.aiSummary } });
    setEditingReflection(false);
  }

  function generateAIReflection() {
    setGeneratingAI(true);
    window.setTimeout(() => {
      const context = buildMonthlyAIContext({ month, monthStart: bounds.start, monthEnd: bounds.end, plan: { ...planDraft, month }, tasks, moments: monthlyMomentsForView, dailyReflections, weeklyPlans, weeklyReflections, monthlyReflection: { month, ...reflectionDraft, aiSummary: savedReflection?.aiSummary } });
      const summary = isDemoMode && savedReflection?.aiSummary ? savedReflection.aiSummary : generateMonthlySummary(context);
      const currentReflection = savedReflection ?? { month, memorable: "", changes: "", grateful: "", carryForward: "" };
      saveMonthlyReflections({ ...monthlyReflections, [month]: { ...currentReflection, aiSummary: summary } });
      setGeneratingAI(false);
    }, 350);
  }

  function deleteAIReflection() {
    const currentReflection = monthlyReflections[month];
    if (!currentReflection) return;
    const reflectionWithoutSummary = { ...currentReflection };
    delete reflectionWithoutSummary.aiSummary;
    saveMonthlyReflections({ ...monthlyReflections, [month]: reflectionWithoutSummary });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-16">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">回顾</p>
        <h1 className="text-3xl font-medium tracking-[-0.04em] text-stone-950">每月</h1>
        <p className="mt-5 text-sm text-stone-400">{formatMonthTitle(month)}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-stone-400"><button type="button" onClick={() => selectMonth(shiftMonthKey(month, -1))} className="hover:text-stone-900">← 上个月</button><span className="text-stone-300">/</span><button type="button" onClick={() => selectMonth(currentMonth)} className="hover:text-stone-900">本月</button><span className="text-stone-300">/</span><button type="button" onClick={() => selectMonth(shiftMonthKey(month, 1))} className="hover:text-stone-900">下个月 →</button></div>
      </header>

      <section className="border-b border-stone-200 pb-12"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">计划</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">这个月，我想把时间留给什么？</h2><div className="mt-8 space-y-5">{planDraft.directions.map((direction, index) => <div key={direction.id} className="border-b border-stone-200 pb-5"><div className="flex items-center gap-3"><span className="font-mono text-xs text-stone-400">{String(index + 1).padStart(2, "0")}</span><input value={direction.title} onChange={(event) => setPlanDraft((currentPlan) => ({ ...currentPlan, directions: currentPlan.directions.map((item) => item.id === direction.id ? { ...item, title: event.target.value } : item) }))} placeholder="方向" className="min-w-0 flex-1 bg-transparent text-sm font-medium text-stone-700 outline-none" /><button type="button" onClick={() => setPlanDraft((currentPlan) => ({ ...currentPlan, directions: currentPlan.directions.filter((item) => item.id !== direction.id) }))} aria-label="删除方向" className="text-sm text-stone-300 hover:text-stone-700">×</button></div><input value={direction.description} onChange={(event) => setPlanDraft((currentPlan) => ({ ...currentPlan, directions: currentPlan.directions.map((item) => item.id === direction.id ? { ...item, description: event.target.value } : item) }))} placeholder="写下这个方向想靠近的事情" className="mt-3 w-full bg-transparent pl-8 text-xs text-stone-400 outline-none" /></div>)}</div><button type="button" onClick={() => setPlanDraft((currentPlan) => ({ ...currentPlan, directions: [...currentPlan.directions, { id: crypto.randomUUID(), title: "", description: "" }] }))} className="mt-6 text-sm text-stone-400 hover:text-stone-900">+ 添加方向</button><div><button type="button" onClick={savePlan} className="mt-8 bg-stone-900 px-4 py-2 text-xs text-white">保存本月计划</button></div></section>

      <section className="border-b border-stone-200 py-12"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">一览</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">这个月</h2><div className="mt-6 grid gap-4 text-sm text-stone-600 sm:grid-cols-3"><p>完成任务<br /><span className="mt-1 inline-block text-stone-900">{completedTasks.length} / {monthTasks.length}</span></p><p>留下每日回顾<br /><span className="mt-1 inline-block text-stone-900">{dailyReflectionCount} 天</span></p><p>完成每周回顾<br /><span className="mt-1 inline-block text-stone-900">{overlappingWeeklyReflections.length} 周</span></p></div><div className="mt-10"><p className="mb-5 text-sm font-medium text-stone-700">时间去了哪里</p><div className="space-y-4">{categoryCounts.map(({ category, count }) => <div key={category} className="grid grid-cols-[56px_1fr_28px] items-center gap-3 text-xs"><span className="text-stone-400">{getCategoryLabel(category)}</span><span className="h-1 bg-stone-200"><span className="block h-1 bg-stone-600" style={{ width: monthTasks.length ? `${Math.max((count / monthTasks.length) * 100, count ? 4 : 0)}%` : "0%" }} /></span><span className="text-right text-stone-500">{count}</span></div>)}</div></div></section>

      <section className="border-b border-stone-200 py-12"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">记录</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">值得记住的瞬间</h2><button type="button" onClick={() => setMomentEditor({ date: bounds.end, content: "" })} className="mt-6 text-sm text-stone-400 hover:text-stone-900">+ 记录一个瞬间</button>{momentEditor && <div className="mt-7 border-b border-stone-200 pb-6"><div className="flex gap-4"><input type="date" value={momentEditor.date} onChange={(event) => setMomentEditor((current) => current ? { ...current, date: event.target.value } : current)} className="border-b border-stone-300 bg-transparent py-2 text-xs text-stone-500 outline-none focus:border-stone-900" /><button type="button" onClick={() => setMomentEditor(null)} className="text-xs text-stone-400">取消</button></div><textarea autoFocus value={momentEditor.content} onChange={(event) => setMomentEditor((current) => current ? { ...current, content: event.target.value } : current)} rows={2} placeholder="写下这个瞬间" className="mt-5 w-full resize-none border-b border-stone-300 bg-transparent px-0 py-2 text-sm leading-7 text-stone-700 outline-none placeholder:text-stone-300 focus:border-stone-900" /><button type="button" onClick={saveMoment} className="mt-5 bg-stone-900 px-4 py-2 text-xs text-white">保存瞬间</button></div>}{monthlyMomentsForView.length > 0 && <div className="mt-8 space-y-6">{monthlyMomentsForView.map((moment) => <div key={moment.id} className="flex items-start justify-between gap-5"><div><p className="text-xs text-stone-400">{formatMonthDay(moment.date)}</p><p className="mt-2 text-sm leading-7 text-stone-600">“{moment.content}”</p></div><div className="flex shrink-0 gap-3"><button type="button" onClick={() => setMomentEditor(moment)} className="text-xs text-stone-400 hover:text-stone-900">编辑</button><button type="button" onClick={() => { if (window.confirm("删除这个瞬间？")) saveMonthlyMoments({ ...monthlyMoments, [month]: (monthlyMoments[month] ?? []).filter((item) => item.id !== moment.id) }); }} className="text-xs text-stone-400 hover:text-stone-900">删除</button></div></div>)}</div>}</section>

      <section className="border-b border-stone-200 py-12"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">回顾</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">这个月留下了什么</h2><div className="mt-8 space-y-6">{monthWeeklyNotes.length > 0 ? monthWeeklyNotes.map((note, index) => <div key={`${note}-${index}`}><p className="text-xs text-stone-400">第 {index + 1} 周</p><p className="mt-2 text-sm leading-7 text-stone-600">{note.length > 140 ? `${note.slice(0, 140)}…` : note}</p></div>) : <p className="text-sm text-stone-400">这个月还没有留下每周回顾。</p>}</div></section>

      {hasWrittenReflection && !editingReflection ? <section className="border-b border-stone-200 py-12"><div className="flex items-start justify-between gap-5"><div><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">月度回顾</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">回顾这个月</h2></div><button type="button" onClick={() => setEditingReflection(true)} className="text-xs text-stone-400 hover:text-stone-900">编辑本月回顾</button></div><div className="mt-10 space-y-8">{[["这个月最值得记住的是什么？", savedReflection?.memorable], ["这个月，我在哪些地方发生了变化？", savedReflection?.changes], ["这个月，我想感谢什么？", savedReflection?.grateful], ["进入下个月，我想留下什么，又想放下什么？", savedReflection?.carryForward]].map(([question, answer]) => <div key={question}><h3 className="text-sm font-medium text-stone-700">{question}</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-600">{answer || "还没有写下内容。"}</p></div>)}</div></section> : <form onSubmit={saveReflection} className="border-b border-stone-200 py-12"><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">月度回顾</p><h2 className="text-xl font-medium tracking-[-0.03em] text-stone-950">回顾这个月</h2><div className="mt-10 space-y-9">{[["memorable", "这个月最值得记住的是什么？", "哪些事情、瞬间或变化，你希望以后还记得？"], ["changes", "这个月，我在哪些地方发生了变化？", "可以是习惯、想法、能力，或者对自己的认识。"], ["grateful", "这个月，我想感谢什么？", "一个人、一段经历、一次机会，或者生活中的一些小事。"], ["carryForward", "进入下个月，我想留下什么，又想放下什么？", "留下些什么继续陪你向前，也允许一些事情停在这个月。"]].map(([field, question, prompt]) => <label key={field} className="block"><span className="text-sm font-medium text-stone-700">{question}</span><span className="mt-2 block text-xs leading-5 text-stone-400">{prompt}</span><textarea value={reflectionDraft[field as keyof MonthlyReflectionDraft]} onChange={(event) => setReflectionDraft((current) => ({ ...current, [field]: event.target.value }))} rows={3} className="mt-4 w-full resize-none border-b border-stone-300 bg-transparent px-0 py-2 text-sm leading-7 text-stone-700 outline-none focus:border-stone-900" /></label>)}</div><div className="mt-10 flex items-center justify-end"><button type="submit" className="bg-stone-900 px-4 py-2 text-xs text-white">保存本月回顾</button></div></form>}

      <section className="py-12"><p className="mb-3 text-sm font-medium text-stone-700">✦ FlowDay 的月记</p>{savedReflection?.aiSummary ? <><p className="max-w-2xl whitespace-pre-line text-sm leading-7 text-stone-500">{savedReflection.aiSummary}</p><div className="mt-7 flex gap-5"><button type="button" disabled={generatingAI} onClick={generateAIReflection} className="text-sm text-stone-500 hover:text-stone-900 disabled:text-stone-300">{generatingAI ? "✦ 正在回顾这个月…" : "↻ 重新生成"}</button><button type="button" disabled={generatingAI} onClick={deleteAIReflection} className="text-sm text-stone-400 hover:text-stone-900 disabled:text-stone-300">删除 AI 回顾</button></div></> : <><p className="max-w-2xl whitespace-pre-line text-sm leading-7 text-stone-500">FlowDay 可以结合这个月的计划、任务、每日记录和每周回顾，帮你整理成一篇属于这个月的月记。</p><button type="button" disabled={generatingAI} onClick={generateAIReflection} className="mt-7 bg-stone-900 px-5 py-3 text-sm text-white transition-colors hover:bg-stone-700 disabled:cursor-wait disabled:bg-stone-500">{generatingAI ? "✦ 正在回顾这个月…" : "✦ 生成本月 AI 回顾"}</button></>}</section>
    </div>
  );
}

type WeeklyPlanDraft = Omit<WeeklyPlan, "weekStart">;
type WeeklyReflectionDraft = Omit<WeeklyReflection, "weekStart" | "aiSummary">;

function getWeeklyPlanDraft(plan: WeeklyPlan | undefined): WeeklyPlanDraft {
  return {
    focusItems: plan?.focusItems ?? [],
    oneThing: plan?.oneThing ?? "",
    weeklyNote: plan?.weeklyNote ?? "",
  };
}

function getWeeklyReflectionDraft(reflection: WeeklyReflection | undefined): WeeklyReflectionDraft {
  return {
    memorable: reflection?.memorable ?? "",
    learned: reflection?.learned ?? "",
    grateful: reflection?.grateful ?? "",
    nextWeek: reflection?.nextWeek ?? "",
  };
}

function WeeklyView({
  today,
  isDemoMode,
  tasks,
  dailyReflections,
  weeklyPlans,
  weeklyReflections,
  onToggle,
  onEdit,
}: {
  today: string;
  isDemoMode: boolean;
  tasks: Task[];
  dailyReflections: ReflectionCollection;
  weeklyPlans: WeeklyPlanCollection;
  weeklyReflections: WeeklyReflectionCollection;
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
}) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const [planDraft, setPlanDraft] = useState<WeeklyPlanDraft>(() => getWeeklyPlanDraft(weeklyPlans[getWeekStart(today)]));
  const [planSaved, setPlanSaved] = useState(false);
  const [reflectionDraft, setReflectionDraft] = useState<WeeklyReflectionDraft>(() => getWeeklyReflectionDraft(weeklyReflections[getWeekStart(today)]));
  const [editingReflection, setEditingReflection] = useState(() => !weeklyReflections[getWeekStart(today)]);
  const [aiError, setAIError] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const weekEnd = shiftDateKey(weekStart, 6);
  const savedReflection = weeklyReflections[weekStart];
  const weekDates = Array.from({ length: 7 }, (_, index) => shiftDateKey(weekStart, index));
  const weekTasks = tasks.filter((task) => task.date >= weekStart && task.date <= weekEnd);
  const completedTasks = weekTasks.filter((task) => task.completed);
  const hasWrittenReflection = Boolean(savedReflection && [savedReflection.memorable, savedReflection.learned, savedReflection.grateful, savedReflection.nextWeek].some((value) => value.trim()));
  const categoryCounts = categories.map((category) => ({ category, count: weekTasks.filter((task) => task.category === category).length }));
  const weeklyReflectionNotes = weekDates.flatMap((dateKey) => {
    const reflection = dailyReflections[dateKey];
    const excerpt = reflection?.wentWell || reflection?.learned || reflection?.grateful;
    return excerpt ? [{ dateKey, excerpt }] : [];
  });

  function selectWeek(nextWeekStart: string) {
    setWeekStart(nextWeekStart);
    setPlanDraft(getWeeklyPlanDraft(weeklyPlans[nextWeekStart]));
    setReflectionDraft(getWeeklyReflectionDraft(weeklyReflections[nextWeekStart]));
    setEditingReflection(!weeklyReflections[nextWeekStart]);
    setAIError(false);
  }

  function updatePlan(field: "oneThing" | "weeklyNote", value: string) {
    setPlanDraft((currentPlan) => ({ ...currentPlan, [field]: value }));
  }

  function updateFocus(index: number, value: string) {
    setPlanDraft((currentPlan) => ({
      ...currentPlan,
      focusItems: currentPlan.focusItems.map((item, itemIndex) => itemIndex === index ? value : item),
    }));
  }

  function savePlan() {
    const savedPlan: WeeklyPlan = { weekStart, ...planDraft, focusItems: planDraft.focusItems.filter((item) => item.trim()) };
    saveWeeklyPlans({ ...weeklyPlans, [weekStart]: savedPlan });
    setPlanDraft(getWeeklyPlanDraft(savedPlan));
    setPlanSaved(true);
    window.setTimeout(() => setPlanSaved(false), 1500);
  }

  function saveReflection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveWeeklyReflections({ ...weeklyReflections, [weekStart]: { weekStart, ...reflectionDraft, aiSummary: savedReflection?.aiSummary } });
    setEditingReflection(false);
  }

  async function generateAIReflection() {
    setGeneratingAI(true);
    setAIError(false);
    try {
      const reflectionForContext: WeeklyReflection = {
        weekStart,
        ...reflectionDraft,
        aiSummary: savedReflection?.aiSummary,
      };
      const context = buildWeeklyAIContext({
        weekStart,
        weekEnd,
        plan: { weekStart, ...planDraft },
        tasks,
        dailyReflections,
        weeklyReflection: reflectionForContext,
      });
      if (isDemoMode && savedReflection?.aiSummary) {
        await new Promise((resolve) => window.setTimeout(resolve, 800));
        const currentReflection: WeeklyReflection = savedReflection;
        saveWeeklyReflections({ ...weeklyReflections, [weekStart]: { ...currentReflection, aiSummary: savedReflection.aiSummary } });
        return;
      }
      const response = await fetch("/api/ai/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context),
      });
      const result = (await response.json()) as { summary?: string; error?: string };
      if (!response.ok || !result.summary) throw new Error(result.error ?? "Weekly AI reflection failed.");
      const currentReflection: WeeklyReflection = savedReflection ?? {
        weekStart,
        memorable: "",
        learned: "",
        grateful: "",
        nextWeek: "",
      };
      saveWeeklyReflections({ ...weeklyReflections, [weekStart]: { ...currentReflection, aiSummary: result.summary } });
    } catch (error) {
      console.error("Weekly AI reflection request failed", error);
      setAIError(true);
    } finally {
      setGeneratingAI(false);
    }
  }

  function deleteAIReflection() {
    const currentReflection = weeklyReflections[weekStart];
    if (!currentReflection) return;
    const reflectionWithoutSummary = { ...currentReflection };
    delete reflectionWithoutSummary.aiSummary;
    saveWeeklyReflections({ ...weeklyReflections, [weekStart]: reflectionWithoutSummary });
  }

  const weekLabel = `${new Date(`${weekStart}T12:00:00`).getFullYear()}年${formatMonthDay(weekStart)} — ${formatMonthDay(weekEnd)}`;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-16">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">回顾</p>
        <h1 className="text-3xl font-medium tracking-[-0.04em] text-stone-950">每周</h1>
        <p className="mt-5 text-sm text-stone-400">{weekLabel}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-stone-400">
          <button type="button" onClick={() => selectWeek(shiftDateKey(weekStart, -7))} className="hover:text-stone-900">← 上一周</button>
          <span className="text-stone-300">/</span>
          <button type="button" onClick={() => selectWeek(getWeekStart(today))} className="hover:text-stone-900">本周</button>
          <span className="text-stone-300">/</span>
          <button type="button" onClick={() => selectWeek(shiftDateKey(weekStart, 7))} className="hover:text-stone-900">下一周 →</button>
        </div>
      </header>

      <section className="border-b border-stone-200 pb-12" aria-labelledby="weekly-plan-heading">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">计划</p>
        <h2 id="weekly-plan-heading" className="text-xl font-medium tracking-[-0.03em] text-stone-950">本周计划</h2>
        <p className="mt-3 text-sm text-stone-400">这一周，我想把时间留给什么？</p>
        <div className="mt-8 space-y-3">
          {planDraft.focusItems.map((item, index) => (
            <div key={`focus-${index}`} className="flex items-center gap-4 border-b border-stone-200 py-2">
              <span className="font-mono text-xs text-stone-400">{String(index + 1).padStart(2, "0")}</span>
              <input value={item} onChange={(event) => updateFocus(index, event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-stone-700 outline-none" />
              <button type="button" onClick={() => setPlanDraft((currentPlan) => ({ ...currentPlan, focusItems: currentPlan.focusItems.filter((_, itemIndex) => itemIndex !== index) }))} aria-label="删除本周重点" className="text-sm text-stone-300 hover:text-stone-700">×</button>
            </div>
          ))}
        </div>
        {planDraft.focusItems.length < 3 && <button type="button" onClick={() => setPlanDraft((currentPlan) => ({ ...currentPlan, focusItems: [...currentPlan.focusItems, ""] }))} className="mt-5 text-sm text-stone-400 hover:text-stone-900">+ 添加本周重点</button>}
        <label className="mt-10 block text-sm font-medium text-stone-700">
          如果这周只完成一件事，我希望是：
          <input value={planDraft.oneThing} onChange={(event) => updatePlan("oneThing", event.target.value)} className="mt-4 w-full border-b border-stone-300 bg-transparent px-0 py-2 text-sm font-normal text-stone-700 outline-none focus:border-stone-900" />
        </label>
        <label className="mt-8 block text-sm font-medium text-stone-700">
          给这一周的一句话：
          <textarea value={planDraft.weeklyNote} onChange={(event) => updatePlan("weeklyNote", event.target.value)} placeholder="不要把每一天都安排得太满。" rows={2} className="mt-4 w-full resize-none border-b border-stone-300 bg-transparent px-0 py-2 text-sm font-normal leading-7 text-stone-700 outline-none placeholder:text-stone-300 focus:border-stone-900" />
        </label>
        <button type="button" onClick={savePlan} className="mt-8 bg-stone-900 px-4 py-2 text-xs text-white">{planSaved ? "✓ 已保存" : "保存本周计划"}</button>
      </section>

      <section className="border-b border-stone-200 py-12" aria-labelledby="week-glance-heading">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">行动</p>
        <h2 id="week-glance-heading" className="text-xl font-medium tracking-[-0.03em] text-stone-950">这一周</h2>
        <p className="mt-6 text-sm text-stone-600">已完成 {completedTasks.length} / {weekTasks.length} 项任务</p>
        <div className="mt-7 grid grid-cols-2 gap-y-4 text-sm sm:grid-cols-4">
          {categoryCounts.map(({ category, count }) => <div key={category}><p className="text-stone-400">{getCategoryLabel(category)}</p><p className="mt-1 text-stone-700">{count}</p></div>)}
        </div>
      </section>

      <section className="border-b border-stone-200 py-12" aria-labelledby="weekly-completed-heading">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">任务</p>
        <h2 id="weekly-completed-heading" className="text-xl font-medium tracking-[-0.03em] text-stone-950">本周完成</h2>
        <div className="mt-8 space-y-9">
          {weekDates.map((dateKey) => {
            const dateTasks = completedTasks.filter((task) => task.date === dateKey).sort((firstTask, secondTask) => firstTask.startTime.localeCompare(secondTask.startTime));
            if (dateTasks.length === 0) return null;
            return <TaskGroup key={dateKey} title={`${getWeekdayLabel(dateKey)} · ${dateTasks.length}`} tasks={dateTasks} onToggle={onToggle} onEdit={onEdit} />;
          })}
          {completedTasks.length === 0 && <p className="text-sm text-stone-400">这一周还没有完成的任务。</p>}
        </div>
      </section>

      <section className="border-b border-stone-200 py-12" aria-labelledby="daily-notes-heading">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">回顾</p>
        <h2 id="daily-notes-heading" className="text-xl font-medium tracking-[-0.03em] text-stone-950">这一周留下了什么</h2>
        <div className="mt-8 space-y-6">
          {weeklyReflectionNotes.length > 0 ? weeklyReflectionNotes.map(({ dateKey, excerpt }) => <div key={dateKey}><p className="text-xs text-stone-400">{getWeekdayLabel(dateKey)}</p><p className="mt-2 text-sm leading-7 text-stone-600">{excerpt.length > 110 ? `${excerpt.slice(0, 110)}…` : excerpt}</p></div>) : <p className="text-sm text-stone-400">这一周还没有留下每日回顾。</p>}
        </div>
      </section>

      {hasWrittenReflection && !editingReflection ? (
        <section className="border-b border-stone-200 py-12" aria-labelledby="weekly-reflection-heading">
          <div className="flex items-start justify-between gap-5"><div><p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">回顾</p><h2 id="weekly-reflection-heading" className="text-xl font-medium tracking-[-0.03em] text-stone-950">回顾这一周</h2></div><button type="button" onClick={() => setEditingReflection(true)} className="text-xs text-stone-400 hover:text-stone-900">编辑本周回顾</button></div>
          <div className="mt-10 space-y-8">{[["这一周有什么值得记住的？", savedReflection.memorable], ["这一周最大的收获是什么？", savedReflection.learned], ["这一周有什么值得感谢的？", savedReflection.grateful], ["有什么想带到下一周？", savedReflection.nextWeek]].map(([question, answer]) => <div key={question}><h3 className="text-sm font-medium text-stone-700">{question}</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-600">{answer || "还没有写下内容。"}</p></div>)}</div>
        </section>
      ) : (
        <form onSubmit={saveReflection} className="border-b border-stone-200 py-12" aria-labelledby="weekly-reflection-heading">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">回顾</p><h2 id="weekly-reflection-heading" className="text-xl font-medium tracking-[-0.03em] text-stone-950">回顾这一周</h2>
          <div className="mt-10 space-y-9">{[["memorable", "这一周有什么值得记住的？", "一个完成的目标、一个开心的瞬间，或一件不想忘记的事。"], ["learned", "这一周最大的收获是什么？", "可以是知识、经验，也可以是对自己的新认识。"], ["grateful", "这一周有什么值得感谢的？", "一个人、一件事，或生活中一个让你觉得不错的瞬间。"], ["nextWeek", "有什么想带到下一周？", "一个习惯、一个提醒，或者下一周想继续坚持的事情。"]].map(([field, question, prompt]) => <label key={field} className="block"><span className="text-sm font-medium text-stone-700">{question}</span><span className="mt-2 block text-xs leading-5 text-stone-400">{prompt}</span><textarea value={reflectionDraft[field as keyof WeeklyReflectionDraft]} onChange={(event) => setReflectionDraft((currentDraft) => ({ ...currentDraft, [field]: event.target.value }))} rows={3} className="mt-4 w-full resize-none border-b border-stone-300 bg-transparent px-0 py-2 text-sm leading-7 text-stone-700 outline-none focus:border-stone-900" /></label>)}</div>
          <div className="mt-10 flex items-center justify-between">{savedReflection ? <button type="button" onClick={() => setEditingReflection(false)} className="text-xs text-stone-400 hover:text-stone-900">取消</button> : <span />}<button type="submit" className="bg-stone-900 px-4 py-2 text-xs text-white">保存本周回顾</button></div>
        </form>
      )}

      <section className="py-12">
        <p className="mb-3 text-sm font-medium text-stone-700">✦ FlowDay 的周记</p>
        {savedReflection?.aiSummary ? (
          <>
            <p className="max-w-2xl whitespace-pre-line text-sm leading-7 text-stone-500">{savedReflection.aiSummary}</p>
            {aiError && <p className="mt-5 text-sm text-stone-500">这次没有生成成功，请稍后再试。</p>}
            <div className="mt-7 flex items-center gap-5">
              <button type="button" onClick={generateAIReflection} disabled={generatingAI} className="text-sm text-stone-500 hover:text-stone-900 disabled:cursor-wait disabled:text-stone-300">{generatingAI ? "✦ 正在回顾这一周…" : aiError ? "重新尝试" : "↻ 重新生成"}</button>
              <button type="button" onClick={deleteAIReflection} disabled={generatingAI} className="text-sm text-stone-400 hover:text-stone-900 disabled:text-stone-300">删除 AI 回顾</button>
            </div>
          </>
        ) : (
          <>
            <p className="max-w-2xl text-sm leading-7 text-stone-500">FlowDay 可以结合你这一周的计划、完成的任务和每天留下的记录，帮你整理成一篇属于这一周的周记。</p>
            {aiError && <p className="mt-5 text-sm text-stone-500">这次没有生成成功，请稍后再试。</p>}
            <button type="button" onClick={generateAIReflection} disabled={generatingAI} className="mt-7 bg-stone-900 px-5 py-3 text-sm text-white transition-colors hover:bg-stone-700 disabled:cursor-wait disabled:bg-stone-500">{generatingAI ? "✦ 正在回顾这一周…" : aiError ? "重新尝试" : "✦ 生成本周 AI 回顾"}</button>
          </>
        )}
      </section>
    </div>
  );
}

type ReflectionDraft = Omit<DailyReflection, "date">;

function getReflectionDraft(reflection: DailyReflection | undefined): ReflectionDraft {
  return {
    wentWell: reflection?.wentWell ?? "",
    learned: reflection?.learned ?? "",
    grateful: reflection?.grateful ?? "",
    notes: reflection?.notes ?? "",
    mood: reflection?.mood ?? "",
  };
}

function DailyReflectionView({
  today,
  tasks,
  reflections,
}: {
  today: string;
  tasks: Task[];
  reflections: ReflectionCollection;
}) {
  const [selectedDate, setSelectedDate] = useState(today);
  const [draft, setDraft] = useState<ReflectionDraft>(() => getReflectionDraft(reflections[today]));
  const [isEditing, setIsEditing] = useState(() => !reflections[today]);
  const selectedReflection = reflections[selectedDate];
  const dayTasks = tasks
    .filter((task) => task.date === selectedDate)
    .sort((firstTask, secondTask) => firstTask.startTime.localeCompare(secondTask.startTime));
  const completedTasks = dayTasks.filter((task) => task.completed);
  const remainingTasks = dayTasks.length - completedTasks.length;

  function changeDate(offset: number) {
    const nextDate = new Date(`${selectedDate}T12:00:00`);
    nextDate.setDate(nextDate.getDate() + offset);
    const nextDateKey = formatDateKey(nextDate);
    setSelectedDate(nextDateKey);
    setDraft(getReflectionDraft(reflections[nextDateKey]));
    setIsEditing(!reflections[nextDateKey] && nextDateKey === today);
  }

  function goToToday() {
    setSelectedDate(today);
    setDraft(getReflectionDraft(reflections[today]));
    setIsEditing(!reflections[today]);
  }

  function updateDraft(field: keyof ReflectionDraft, value: string) {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
  }

  function saveReflection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextReflection: DailyReflection = { date: selectedDate, ...draft };
    saveReflections({ ...reflections, [selectedDate]: nextReflection });
    setIsEditing(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-16">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">回顾</p>
        <h1 className="text-3xl font-medium tracking-[-0.04em] text-stone-950">每日回顾</h1>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-stone-400">
          <button type="button" onClick={() => changeDate(-1)} className="hover:text-stone-900">← 前一天</button>
          <span className="text-stone-300">/</span>
          <button type="button" onClick={goToToday} className="hover:text-stone-900">今天</button>
          <span className="text-stone-300">/</span>
          <button type="button" onClick={() => changeDate(1)} className="hover:text-stone-900">后一天 →</button>
        </div>
        <p className="mt-8 text-sm text-stone-400">{formatDateLabel(new Date(`${selectedDate}T12:00:00`))}</p>
      </header>

      <section className="border-b border-stone-200 pb-12" aria-labelledby="glance-heading">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">安静回望</p>
        <h2 id="glance-heading" className="text-xl font-medium tracking-[-0.03em] text-stone-950">今日一览</h2>
        <div className="mt-6 grid gap-2 text-sm text-stone-600 sm:grid-cols-2">
          <p>已完成 {completedTasks.length} / {dayTasks.length} 项任务</p>
          <p>还有 {remainingTasks} 项待完成</p>
        </div>
        {completedTasks.length > 0 && (
          <div className="mt-7">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">今日完成</p>
            <div className="space-y-2 text-sm text-stone-600">
              {completedTasks.map((task) => <p key={task.id}><span className="mr-2 text-stone-400">✓</span>{getTaskTitle(task.title)}</p>)}
            </div>
          </div>
        )}
      </section>

      {selectedReflection && !isEditing ? (
        <section className="border-b border-stone-200 py-12" aria-labelledby="journal-heading">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">日记</p>
              <h2 id="journal-heading" className="text-xl font-medium tracking-[-0.03em] text-stone-950">今天写下的几句话</h2>
            </div>
            <button type="button" onClick={() => setIsEditing(true)} className="text-xs text-stone-400 hover:text-stone-900">编辑回顾</button>
          </div>
          <div className="mt-10 space-y-9">
            {[
              ["今天有什么值得开心或肯定的事？", selectedReflection.wentWell],
              ["今天有什么新的收获？", selectedReflection.learned],
              ["今天有什么值得感谢的？", selectedReflection.grateful],
              ["还有什么想记下的吗？", selectedReflection.notes],
            ].map(([question, answer]) => (
              <div key={question}>
                <h3 className="text-sm font-medium text-stone-700">{question}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-600">{answer || "Nothing written here."}</p>
              </div>
            ))}
            {selectedReflection.mood && <p className="pt-2 text-xs text-stone-400">今天感觉{selectedReflection.mood === "Great" ? "很棒" : selectedReflection.mood === "Good" ? "不错" : selectedReflection.mood === "Okay" ? "还好" : selectedReflection.mood === "Tough" ? "有点累" : "很艰难"}。</p>}
          </div>
        </section>
      ) : isEditing ? (
        <form onSubmit={saveReflection} className="border-b border-stone-200 py-12" aria-labelledby="journal-heading">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">日记</p>
          <h2 id="journal-heading" className="text-xl font-medium tracking-[-0.03em] text-stone-950">留一点时间，回望今天</h2>
          <div className="mt-10 space-y-10">
            {[
              ["wentWell", "今天有什么值得开心或肯定的事？", "记录一个让你感到开心、有意义，或值得肯定的瞬间。"],
              ["learned", "今天有什么新的收获？", "可以是一个新知识、新想法，或对某件事新的理解。"],
              ["grateful", "今天有什么值得感谢的？", "一个人、一个瞬间、一次机会，或生活中的一件小事。"],
              ["notes", "还有什么想记下的吗？", "留一点空间，写下任何你不想忘记的事情。"],
            ].map(([field, question, prompt]) => (
              <label key={field} className="block">
                <span className="text-sm font-medium text-stone-700">{question}</span>
                <span className="mt-2 block text-xs leading-5 text-stone-400">{prompt}</span>
                <textarea value={draft[field as keyof ReflectionDraft] as string} onChange={(event) => updateDraft(field as keyof ReflectionDraft, event.target.value)} rows={3} className="mt-4 w-full resize-none border-b border-stone-300 bg-transparent px-0 py-2 text-sm leading-7 text-stone-700 outline-none placeholder:text-stone-300 focus:border-stone-900" />
              </label>
            ))}
          </div>

          <fieldset className="mt-11">
            <legend className="text-sm font-medium text-stone-700">今天感觉怎么样？</legend>
            <div className="mt-4 flex flex-wrap gap-2">
              {moods.map((mood) => (
                <button key={mood} type="button" onClick={() => updateDraft("mood", mood)} className={`border px-3 py-2 text-xs ${draft.mood === mood ? "border-stone-900 text-stone-900" : "border-stone-200 text-stone-400 hover:border-stone-400"}`}>{({ Great: "很棒", Good: "不错", Okay: "还好", Tough: "有点累", Difficult: "很艰难" })[mood]}</button>
              ))}
            </div>
          </fieldset>

          <div className="mt-12 flex items-center justify-between">
            {selectedReflection ? <button type="button" onClick={() => setIsEditing(false)} className="text-xs text-stone-400 hover:text-stone-900">取消</button> : <span />}
            <button type="submit" className="bg-stone-900 px-4 py-2 text-xs text-white">保存今日回顾</button>
          </div>
        </form>
      ) : (
        <section className="border-b border-stone-200 py-12">
          <p className="text-sm text-stone-500">这一天还没有留下回顾。</p>
          <button type="button" onClick={() => { setDraft(getReflectionDraft(undefined)); setIsEditing(true); }} className="mt-5 text-sm text-stone-400 hover:text-stone-900">写下今天的回顾</button>
        </section>
      )}

      <section className="py-12">
        <p className="mb-3 text-sm font-medium text-stone-700">✦ FlowDay 想对你说</p>
        <p className="max-w-2xl text-sm leading-7 text-stone-500">今天的你在学习、工作和自己的生活之间找到了不错的平衡。完成作业似乎也让你松了一口气。别忘了，今天这些看似普通的小进展，也正在慢慢构成你的成长。</p>
        <button type="button" className="mt-6 text-sm text-stone-400 hover:text-stone-900">✦ AI 帮我回顾</button>
      </section>
    </div>
  );
}

function getGreeting(hour: number) {
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

function WelcomeScreen({ onDemo, onStartBlank }: { onDemo: () => void; onStartBlank: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafaf9] px-6 text-stone-900">
      <section className="w-full max-w-xl">
        <div className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em]">
          <span className="flex h-6 w-6 items-center justify-center bg-stone-900 text-[11px] text-white">F</span>
          FlowDay
        </div>
        <div className="mt-24 max-w-lg">
          <h1 className="text-3xl font-medium tracking-[-0.04em] text-stone-950">计划时间，也记住生活。</h1>
          <p className="mt-6 text-sm leading-7 text-stone-500">FlowDay 把计划、行动与回顾连接在一起，帮助你看见时间去了哪里，也留下那些值得记住的事情。</p>
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <button type="button" onClick={onDemo} className="bg-stone-900 px-5 py-3 text-sm text-white transition-colors hover:bg-stone-700">体验示例生活</button>
            <button type="button" onClick={onStartBlank} className="text-sm text-stone-500 hover:text-stone-900">从空白开始</button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  const router = useRouter();
  const exitingDemo = useRef(false);
  const [view, setView] = useState<"today" | "calendar" | "tasks" | "daily" | "weekly" | "monthly" | "yearly">("today");
  const today = formatDateKey(new Date());
  const demoModeSnapshot = useSyncExternalStore(subscribeToDemoMode, getDemoModeSnapshot, () => null);
  const onboardingSnapshot = useSyncExternalStore(subscribeToDemoMode, getOnboardingSnapshot, () => null);
  const isDemoMode = demoModeSnapshot === "true";
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date()));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const storedTasks = useSyncExternalStore(subscribeToTasks, getTaskSnapshot, () => null);
  const tasks = storedTasks ? (JSON.parse(storedTasks) as Task[]) : [];
  const storedReflections = useSyncExternalStore(subscribeToReflections, getReflectionSnapshot, () => null);
  const reflections = storedReflections ? (JSON.parse(storedReflections) as ReflectionCollection) : {};
  const storedWeeklyPlans = useSyncExternalStore(subscribeToWeeklyPlans, getWeeklyPlanSnapshot, () => null);
  const weeklyPlans = storedWeeklyPlans ? (JSON.parse(storedWeeklyPlans) as WeeklyPlanCollection) : {};
  const storedWeeklyReflections = useSyncExternalStore(subscribeToWeeklyReflections, getWeeklyReflectionSnapshot, () => null);
  const weeklyReflections = storedWeeklyReflections ? (JSON.parse(storedWeeklyReflections) as WeeklyReflectionCollection) : {};
  const storedMonthlyPlans = useSyncExternalStore(subscribeToMonthlyPlans, getMonthlyPlanSnapshot, () => null);
  const monthlyPlans = storedMonthlyPlans ? (JSON.parse(storedMonthlyPlans) as MonthlyPlanCollection) : {};
  const storedMonthlyMoments = useSyncExternalStore(subscribeToMonthlyMoments, getMonthlyMomentSnapshot, () => null);
  const monthlyMoments = storedMonthlyMoments ? (JSON.parse(storedMonthlyMoments) as MonthlyMomentCollection) : {};
  const storedMonthlyReflections = useSyncExternalStore(subscribeToMonthlyReflections, getMonthlyReflectionSnapshot, () => null);
  const monthlyReflections = storedMonthlyReflections ? (JSON.parse(storedMonthlyReflections) as MonthlyReflectionCollection) : {};
  const storedYearlyPlans = useSyncExternalStore(subscribeToYearlyPlans, getYearlyPlanSnapshot, () => null);
  const yearlyPlans = storedYearlyPlans ? (JSON.parse(storedYearlyPlans) as YearlyPlanCollection) : {};
  const storedYearlyReflections = useSyncExternalStore(subscribeToYearlyReflections, getYearlyReflectionSnapshot, () => null);
  const yearlyReflections = storedYearlyReflections ? (JSON.parse(storedYearlyReflections) as YearlyReflectionCollection) : {};
  const [editor, setEditor] = useState<{ task: TaskForm; taskId?: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);

  const visibleTasks = tasks
    .filter((task) => task.date === today)
    .sort((firstTask, secondTask) => firstTask.startTime.localeCompare(secondTask.startTime));
  const completedCount = visibleTasks.filter((task) => task.completed).length;
  const hasStoredData = [storedTasks, storedReflections, storedWeeklyPlans, storedWeeklyReflections, storedMonthlyPlans, storedMonthlyMoments, storedMonthlyReflections, storedYearlyPlans, storedYearlyReflections].some((value) => value !== null);

  function exitDemo() {
    exitingDemo.current = true;
    clearDemoDataset();
    router.replace("/");
  }

  useEffect(() => {
    if (!exitingDemo.current && new URLSearchParams(window.location.search).get("demo") === "true" && !isDemoMode && !hasStoredData) {
      loadDemoDataset(today);
    }
  }, [hasStoredData, isDemoMode, today]);

  if (!hasStoredData && onboardingSnapshot !== "true") {
    return <WelcomeScreen onDemo={() => loadDemoDataset(today)} onStartBlank={completeOnboarding} />;
  }

  function openNewTask() {
    setEditor({ task: emptyTaskForm(today) });
  }

  function openTask(task: Task) {
    setEditor({ task: { ...task, title: getTaskTitle(task.title) }, taskId: task.id });
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

        <nav className="mt-16" aria-label="主导航">
          <p className="mb-3 px-4 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">工作区</p>
          <div className="space-y-1">
            {primaryNavigation.map((item) => (
              <NavigationItem
                key={item}
                label={item}
                active={(item === "Today" && view === "today") || (item === "Calendar" && view === "calendar") || (item === "Tasks" && view === "tasks")}
                onClick={item === "Today" ? () => setView("today") : item === "Calendar" ? () => setView("calendar") : item === "Tasks" ? () => setView("tasks") : undefined}
              />
            ))}
          </div>

          <p className="mb-3 mt-12 px-4 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">回顾</p>
          <div className="space-y-1">
            {reflectionNavigation.map((item) => (
              <NavigationItem key={item} label={item} active={(item === "Daily" && view === "daily") || (item === "Weekly" && view === "weekly") || (item === "Monthly" && view === "monthly") || (item === "Yearly" && view === "yearly")} onClick={item === "Daily" ? () => setView("daily") : item === "Weekly" ? () => setView("weekly") : item === "Monthly" ? () => setView("monthly") : item === "Yearly" ? () => setView("yearly") : undefined} disabled={item !== "Daily" && item !== "Weekly" && item !== "Monthly" && item !== "Yearly"} />
            ))}
          </div>
        </nav>

        <div className="mt-auto flex items-center gap-3 border-t border-stone-200 pt-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-xs font-medium text-stone-600">
            Z
          </span>
          <div>
            <p className="text-xs font-medium text-stone-700">{isDemoMode ? "林然" : "个人空间"}</p>
            <p className="mt-0.5 text-[11px] text-stone-400">{isDemoMode ? "24岁 · 产品设计师" : "个人空间"}</p>
          </div>
        </div>
        {isDemoMode && <div className="mt-4 flex items-center gap-3 pl-11 text-[11px] text-stone-400"><span>示例模式</span><button type="button" onClick={() => resetDemoDataset(today)} className="hover:text-stone-900">重置示例</button><button type="button" onClick={exitDemo} className="hover:text-stone-900">退出示例</button></div>}
      </aside>

      <section className="ml-64 min-h-screen px-10 py-12 sm:px-16 lg:px-24">
        <div className={`mx-auto ${view === "calendar" ? "max-w-6xl" : view === "tasks" ? "max-w-4xl" : "max-w-3xl"}`}>
          {view === "today" ? (
          <>
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
                  日程
                </p>
                <h2
                  id="today-heading"
                  className="text-2xl font-medium tracking-[-0.035em] text-stone-950"
                >
                  今天
                </h2>
              </div>
              <span className="text-xs text-stone-400">
                已完成 {completedCount} / {visibleTasks.length}
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
                + 添加任务
              </button>
            </div>
          </section>
          </>
          ) : view === "calendar" ? (
            <CalendarView tasks={tasks} today={today} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          ) : view === "tasks" ? (
            <TasksView tasks={tasks} today={today} onAdd={openNewTask} onToggle={toggleTask} onEdit={openTask} />
          ) : view === "weekly" ? (
            <WeeklyView today={today} isDemoMode={isDemoMode} tasks={tasks} dailyReflections={reflections} weeklyPlans={weeklyPlans} weeklyReflections={weeklyReflections} onToggle={toggleTask} onEdit={openTask} />
          ) : view === "monthly" ? (
            <MonthlyView today={today} initialMonth={selectedMonth} isDemoMode={isDemoMode} tasks={tasks} dailyReflections={reflections} weeklyPlans={weeklyPlans} weeklyReflections={weeklyReflections} monthlyPlans={monthlyPlans} monthlyMoments={monthlyMoments} monthlyReflections={monthlyReflections} />
          ) : view === "yearly" ? (
            <YearlyView key={selectedYear} year={selectedYear} today={today} isDemoMode={isDemoMode} tasks={tasks} dailyReflections={reflections} weeklyReflections={weeklyReflections} monthlyPlans={monthlyPlans} monthlyMoments={monthlyMoments} monthlyReflections={monthlyReflections} yearlyPlans={yearlyPlans} yearlyReflections={yearlyReflections} onOpenYear={(year) => { setSelectedYear(year); setView("yearly"); }} onOpenMonth={(month) => { setSelectedMonth(month); setView("monthly"); }} />
          ) : (
            <DailyReflectionView today={today} tasks={tasks} reflections={reflections} />
          )}
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