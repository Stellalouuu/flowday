import type { DailyReflection } from "./reflections";
import type { Task } from "./tasks";
import type { WeeklyPlan, WeeklyReflection } from "./weekly";
import type { MonthlyDirection, MonthlyMoment, MonthlyPlan, MonthlyReflection } from "./monthly";

export type MonthlyAIContext = {
  month: string;
  plan: { directions: MonthlyDirection[] };
  tasks: Array<Pick<Task, "title" | "date" | "category" | "completed">>;
  moments: MonthlyMoment[];
  dailyReflections: Array<Pick<DailyReflection, "date" | "wentWell" | "learned" | "grateful" | "notes" | "mood">>;
  weeklyPlans: WeeklyPlan[];
  weeklyReflections: Array<Pick<WeeklyReflection, "weekStart" | "memorable" | "learned" | "grateful" | "nextWeek" | "aiSummary">>;
  monthlyReflection?: Pick<MonthlyReflection, "memorable" | "changes" | "grateful" | "carryForward">;
};

type BuildMonthlyAIContextInput = {
  month: string;
  monthStart: string;
  monthEnd: string;
  plan: MonthlyPlan | undefined;
  tasks: Task[];
  moments: MonthlyMoment[];
  dailyReflections: Record<string, DailyReflection>;
  weeklyPlans: Record<string, WeeklyPlan>;
  weeklyReflections: Record<string, WeeklyReflection>;
  monthlyReflection: MonthlyReflection | undefined;
};

function weekOverlapsMonth(weekStart: string, monthStart: string, monthEnd: string) {
  const weekEndDate = new Date(`${weekStart}T12:00:00`);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekEnd = weekEndDate.toISOString().slice(0, 10);
  return weekStart <= monthEnd && weekEnd >= monthStart;
}

export function buildMonthlyAIContext({
  month,
  monthStart,
  monthEnd,
  plan,
  tasks,
  moments,
  dailyReflections,
  weeklyPlans,
  weeklyReflections,
  monthlyReflection,
}: BuildMonthlyAIContextInput): MonthlyAIContext {
  return {
    month,
    plan: { directions: plan?.directions ?? [] },
    tasks: tasks.filter((task) => task.date >= monthStart && task.date <= monthEnd).map(({ title, date, category, completed }) => ({ title, date, category, completed })),
    moments: moments.filter((moment) => moment.date >= monthStart && moment.date <= monthEnd),
    dailyReflections: Object.values(dailyReflections).filter((reflection) => reflection.date >= monthStart && reflection.date <= monthEnd).map(({ date, wentWell, learned, grateful, notes, mood }) => ({ date, wentWell, learned, grateful, notes, mood })),
    weeklyPlans: Object.values(weeklyPlans).filter((planItem) => weekOverlapsMonth(planItem.weekStart, monthStart, monthEnd)).map((planItem) => planItem),
    weeklyReflections: Object.values(weeklyReflections).filter((reflection) => weekOverlapsMonth(reflection.weekStart, monthStart, monthEnd)).map(({ weekStart, memorable, learned, grateful, nextWeek, aiSummary }) => ({ weekStart, memorable, learned, grateful, nextWeek, aiSummary })),
    monthlyReflection: monthlyReflection ? { memorable: monthlyReflection.memorable, changes: monthlyReflection.changes, grateful: monthlyReflection.grateful, carryForward: monthlyReflection.carryForward } : undefined,
  };
}

export function generateMonthlySummary(context: MonthlyAIContext) {
  const categoryLabels: Record<string, string> = { Study: "学习", Career: "工作", Health: "健康", Personal: "个人" };
  const completedCount = context.tasks.filter((task) => task.completed).length;
  const categoryTotals = context.tasks.reduce<Record<string, number>>((totals, task) => {
    totals[task.category] = (totals[task.category] ?? 0) + 1;
    return totals;
  }, {});
  const leadingCategory = Object.entries(categoryTotals).sort(([, first], [, second]) => second - first)[0]?.[0];
  const focusTitles = context.plan.directions.map((direction) => direction.title).filter(Boolean);
  const moment = context.moments[0]?.content;
  const weeklyFocuses = context.weeklyPlans.flatMap((plan) => plan.focusItems).filter(Boolean).slice(0, 2);
  const weeklyNotes = context.weeklyReflections.flatMap((reflection) => [reflection.aiSummary, reflection.memorable, reflection.learned, reflection.grateful]).filter(Boolean).slice(0, 2);
  const paragraphs: string[] = [];

  if (context.tasks.length > 0) {
    paragraphs.push(`这个月记录了 ${context.tasks.length} 项任务，完成了 ${completedCount} 项${leadingCategory ? `，出现最多的方向是${categoryLabels[leadingCategory] ?? leadingCategory}` : ""}。这些记录让这个月的时间留下了清晰的轮廓。`);
  } else {
    paragraphs.push("这个月还没有留下任务记录，因此这里不替你补充一份并不存在的忙碌。这个月的空白也值得被如实保留。");
  }
  if (focusTitles.length > 0 || weeklyFocuses.length > 0) paragraphs.push(`这个月你把注意力放在了${[...focusTitles, ...weeklyFocuses].slice(0, 4).join("、")}上。${moment ? `其中有一个瞬间被你记了下来：“${moment}”` : "计划之外的变化，也会慢慢显出它的意义。"}`);
  if (weeklyNotes.length > 0) paragraphs.push(`每周留下的文字里，有一些内容值得带回来看：“${weeklyNotes.join("”以及“")}”。${context.dailyReflections.length > 0 ? `这个月也留下了 ${context.dailyReflections.length} 天的每日记录。` : ""}`);
  else if (context.dailyReflections.length > 0) paragraphs.push(`这个月留下了 ${context.dailyReflections.length} 天的每日记录，它们为任务之外的生活保留了一些位置。`);
  else paragraphs.push("这个月还没有留下每日回顾或每周回顾，因此这里不替你推测那些没有被写下的感受。");
  if (context.monthlyReflection) {
    const reflectionParts = [context.monthlyReflection.memorable, context.monthlyReflection.changes, context.monthlyReflection.grateful, context.monthlyReflection.carryForward].filter(Boolean);
    if (reflectionParts.length > 0) paragraphs.push(`你在月度回顾里留下了：${reflectionParts.join("；")}。`);
  }

  return paragraphs.slice(0, 4).join("\n\n");
}
