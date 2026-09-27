import type { DailyReflection } from "./reflections";
import type { Task } from "./tasks";
import type { WeeklyPlan, WeeklyReflection } from "./weekly";

export type WeeklyAIContext = {
  weekStart: string;
  weekEnd: string;
  plan: {
    focusItems: string[];
    oneThing: string;
    weeklyNote: string;
  };
  tasks: Array<Pick<Task, "title" | "date" | "category" | "completed">>;
  dailyReflections: Array<Pick<DailyReflection, "date" | "wentWell" | "learned" | "grateful" | "notes" | "mood">>;
  weeklyReflection?: Pick<WeeklyReflection, "memorable" | "learned" | "grateful" | "nextWeek">;
};

type BuildWeeklyAIContextInput = {
  weekStart: string;
  weekEnd: string;
  plan: WeeklyPlan | undefined;
  tasks: Task[];
  dailyReflections: Record<string, DailyReflection>;
  weeklyReflection: WeeklyReflection | undefined;
};

export function buildWeeklyAIContext({
  weekStart,
  weekEnd,
  plan,
  tasks,
  dailyReflections,
  weeklyReflection,
}: BuildWeeklyAIContextInput): WeeklyAIContext {
  return {
    weekStart,
    weekEnd,
    plan: {
      focusItems: plan?.focusItems ?? [],
      oneThing: plan?.oneThing ?? "",
      weeklyNote: plan?.weeklyNote ?? "",
    },
    tasks: tasks
      .filter((task) => task.date >= weekStart && task.date <= weekEnd)
      .map(({ title, date, category, completed }) => ({ title, date, category, completed })),
    dailyReflections: Object.values(dailyReflections)
      .filter((reflection) => reflection.date >= weekStart && reflection.date <= weekEnd)
      .map(({ date, wentWell, learned, grateful, notes, mood }) => ({ date, wentWell, learned, grateful, notes, mood })),
    weeklyReflection: weeklyReflection
      ? {
          memorable: weeklyReflection.memorable,
          learned: weeklyReflection.learned,
          grateful: weeklyReflection.grateful,
          nextWeek: weeklyReflection.nextWeek,
        }
      : undefined,
  };
}

export function generateWeeklySummary(context: WeeklyAIContext) {
  const totalTasks = context.tasks.length;
  const completedTasks = context.tasks.filter((task) => task.completed).length;
  const categoryTotals = context.tasks.reduce<Record<string, number>>((totals, task) => {
    totals[task.category] = (totals[task.category] ?? 0) + 1;
    return totals;
  }, {});
  const leadingCategories = Object.entries(categoryTotals)
    .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
    .slice(0, 2)
    .map(([category]) => category);
  const focusItems = context.plan.focusItems.filter(Boolean);
  const reflectionExcerpts = context.dailyReflections
    .flatMap((reflection) => [reflection.wentWell, reflection.learned, reflection.grateful, reflection.notes])
    .filter(Boolean)
    .slice(0, 2);
  const paragraphs: string[] = [];

  if (totalTasks > 0) {
    const categoryText = leadingCategories.length > 0 ? `，时间主要落在${leadingCategories.join("和")}上` : "";
    paragraphs.push(`这一周共记录了 ${totalTasks} 项任务，完成了 ${completedTasks} 项${categoryText}。这些任务勾勒出了这七天实际发生的事情，也让原本的计划有了具体的形状。`);
  } else {
    paragraphs.push("这一周还没有记录任务，因此这里不替你补充一份并不存在的忙碌。留下的空白本身，也属于这一周的样子。");
  }

  if (focusItems.length > 0 || context.plan.oneThing || context.plan.weeklyNote) {
    const planParts = [
      focusItems.length > 0 ? `你为这一周留下的重点是：${focusItems.join("、")}。` : "",
      context.plan.oneThing ? `如果只留下一件事，你写下的是“${context.plan.oneThing}”。` : "",
      context.plan.weeklyNote ? `这一周的一句话是：“${context.plan.weeklyNote}”` : "",
    ].filter(Boolean);
    paragraphs.push(planParts.join(" "));
  }

  if (reflectionExcerpts.length > 0) {
    paragraphs.push(`每天留下的记录里，有一些片段值得被看见：“${reflectionExcerpts.join("”以及“")}”。${context.weeklyReflection?.learned ? `你在本周回顾中还提到：${context.weeklyReflection.learned}` : ""}`);
  } else if (context.weeklyReflection) {
    const weeklyParts = [context.weeklyReflection.memorable, context.weeklyReflection.learned, context.weeklyReflection.grateful, context.weeklyReflection.nextWeek].filter(Boolean);
    paragraphs.push(weeklyParts.length > 0 ? `本周回顾里留下了这些想法：${weeklyParts.join("；")}。` : "这一周还没有留下足够的文字记录，这里先保留这一份安静的空白。");
  } else {
    paragraphs.push("这一周还没有留下 Daily Reflection，因此这里不替你推测这一周的感受。之后写下的几句话，会让这份周记慢慢更接近真实的你。");
  }

  return paragraphs.slice(0, 4).join("\n\n");
}
