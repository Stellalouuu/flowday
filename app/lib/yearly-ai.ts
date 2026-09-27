import type { MonthlyMoment, MonthlyPlan, MonthlyReflection } from "./monthly";
import type { Task } from "./tasks";
import type { YearlyPlan, YearlyReflection } from "./yearly";

export type YearlyAIContext = {
  year: string;
  plan?: YearlyPlan;
  months: Array<{
    month: string;
    plan?: MonthlyPlan;
    reflection?: Pick<MonthlyReflection, "memorable" | "changes" | "grateful" | "carryForward" | "aiSummary">;
    moments: MonthlyMoment[];
  }>;
  taskAggregate: { total: number; completed: number; categories: Record<string, number> };
  yearlyReflection?: YearlyReflection;
};

type BuildYearlyAIContextInput = {
  year: string;
  plan: YearlyPlan | undefined;
  monthlyPlans: Record<string, MonthlyPlan>;
  monthlyReflections: Record<string, MonthlyReflection>;
  monthlyMoments: Record<string, MonthlyMoment[]>;
  tasks: Task[];
  yearlyReflection: YearlyReflection | undefined;
};

export function buildYearlyAIContext({ year, plan, monthlyPlans, monthlyReflections, monthlyMoments, tasks, yearlyReflection }: BuildYearlyAIContextInput): YearlyAIContext {
  const months = Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`).map((month) => ({
    month,
    plan: monthlyPlans[month],
    reflection: monthlyReflections[month] ? {
      memorable: monthlyReflections[month].memorable,
      changes: monthlyReflections[month].changes,
      grateful: monthlyReflections[month].grateful,
      carryForward: monthlyReflections[month].carryForward,
      aiSummary: monthlyReflections[month].aiSummary,
    } : undefined,
    moments: monthlyMoments[month] ?? [],
  }));
  const yearTasks = tasks.filter((task) => task.date.startsWith(`${year}-`));
  const categories = yearTasks.reduce<Record<string, number>>((totals, task) => {
    totals[task.category] = (totals[task.category] ?? 0) + 1;
    return totals;
  }, {});
  return {
    year,
    plan,
    months,
    taskAggregate: { total: yearTasks.length, completed: yearTasks.filter((task) => task.completed).length, categories },
    yearlyReflection,
  };
}

export function generateYearlySummary(context: YearlyAIContext) {
  const categoryLabels: Record<string, string> = { Study: "学习", Career: "工作", Health: "健康", Personal: "个人" };
  const recordedMonths = context.months.filter((month) => month.plan || month.reflection || month.moments.length > 0);
  const reflectionTexts = context.months.flatMap((month) => [month.reflection?.memorable, month.reflection?.changes, month.reflection?.grateful, month.reflection?.aiSummary]).filter(Boolean).slice(0, 3);
  const highlights = context.months.flatMap((month) => month.moments.filter((moment) => moment.isYearHighlight).map((moment) => moment.content)).slice(0, 3);
  const focusTitles = [
    ...(context.plan?.directions.map((direction) => direction.title) ?? []),
    ...context.months.flatMap((month) => month.plan?.directions.map((direction) => direction.title) ?? []),
  ].filter(Boolean).slice(0, 4);
  const paragraphs: string[] = [];
  if (context.taskAggregate.total > 0) paragraphs.push(`这一年留下了 ${context.taskAggregate.total} 项任务记录，其中 ${context.taskAggregate.completed} 项被完成。时间更多地出现在${Object.entries(context.taskAggregate.categories).sort(([, first], [, second]) => second - first).slice(0, 2).map(([category]) => categoryLabels[category] ?? category).join("和")}里。`);
  else paragraphs.push("这一年还没有留下任务记录，这封信会把注意力放在已经写下来的内容上。");
  if (focusTitles.length > 0) paragraphs.push(`你曾把时间留给${focusTitles.join("、")}。这些方向不一定都需要在年末得到一个结论，但它们记录了这一年注意力曾经靠近的地方。`);
  if (recordedMonths.length > 0) paragraphs.push(`这一年有 ${recordedMonths.length} 个月留下了计划、回顾或瞬间。${highlights.length > 0 ? `其中值得记住的片段包括：“${highlights.join("”以及“")}”。` : "有些月份留下了较多文字，有些月份则安静一些。"}`);
  if (reflectionTexts.length > 0) paragraphs.push(`月度记录里反复出现的内容是：“${reflectionTexts.join("”以及“")}”。它们比一串数字更接近这一年真实的质地。`);
  if (context.yearlyReflection) {
    const yearWords = [context.yearlyReflection.changed, context.yearlyReflection.proud, context.yearlyReflection.learned, context.yearlyReflection.peopleAndThings, context.yearlyReflection.carryForward, context.yearlyReflection.noteToNextYear].filter(Boolean);
    if (yearWords.length > 0) paragraphs.push(`回望这一年时，你留下了这些话：${yearWords.join("；")}。`);
  }
  paragraphs.push(context.yearlyReflection?.noteToNextYear ? `写给下一年的一句话是：“${context.yearlyReflection.noteToNextYear}”` : "这封信先停在这里，把没有被写下的部分留给时间继续展开。");
  return paragraphs.slice(0, 8).join("\n\n");
}
