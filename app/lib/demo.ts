import { saveReflections, reflectionStorageKey, type ReflectionCollection } from "./reflections";
import { saveTasks, storageKey, type Task } from "./tasks";
import { saveWeeklyPlans, saveWeeklyReflections, weeklyPlanStorageKey, weeklyReflectionStorageKey, type WeeklyPlanCollection, type WeeklyReflectionCollection } from "./weekly";
import { saveMonthlyMoments, saveMonthlyPlans, saveMonthlyReflections, monthlyMomentStorageKey, monthlyPlanStorageKey, monthlyReflectionStorageKey, type MonthlyMomentCollection, type MonthlyPlanCollection, type MonthlyReflectionCollection } from "./monthly";
import { saveYearlyPlans, saveYearlyReflections, yearlyPlanStorageKey, yearlyReflectionStorageKey, type YearlyPlanCollection, type YearlyReflectionCollection } from "./yearly";

export const demoModeStorageKey = "flowday-demo-mode";
export const onboardingStorageKey = "flowday-onboarding-complete";

const demoListeners = new Set<() => void>();

export type DemoDataset = {
  tasks: Task[];
  reflections: ReflectionCollection;
  weeklyPlans: WeeklyPlanCollection;
  weeklyReflections: WeeklyReflectionCollection;
  monthlyPlans: MonthlyPlanCollection;
  monthlyMoments: MonthlyMomentCollection;
  monthlyReflections: MonthlyReflectionCollection;
  yearlyPlans: YearlyPlanCollection;
  yearlyReflections: YearlyReflectionCollection;
};

export function subscribeToDemoMode(listener: () => void) {
  demoListeners.add(listener);
  return () => demoListeners.delete(listener);
}

export function getDemoModeSnapshot() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(demoModeStorageKey);
}

export function getOnboardingSnapshot() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(onboardingStorageKey);
}

function setDemoMode(enabled: boolean) {
  if (enabled) {
    window.localStorage.setItem(demoModeStorageKey, "true");
  } else {
    window.localStorage.removeItem(demoModeStorageKey);
  }
  demoListeners.forEach((listener) => listener());
}

function dateFromOffset(today: string, offset: number) {
  const date = new Date(`${today}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function weekStart(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return date.toISOString().slice(0, 10);
}

function monthKey(dateKey: string) {
  return dateKey.slice(0, 7);
}

function task(id: string, title: string, offset: number, startTime: string, category: string, completed: boolean, today: string): Task {
  return { id, title, date: dateFromOffset(today, offset), startTime, endTime: "", category, completed };
}

export function createDemoDataset(today: string): DemoDataset {
  const tasks: Task[] = [
    task("demo-01", "整理用户访谈", -29, "09:30", "Career", true, today),
    task("demo-02", "阅读产品设计文章", -27, "20:00", "Study", true, today),
    task("demo-03", "跑步", -26, "07:30", "Health", true, today),
    task("demo-04", "完成产品 Demo", -23, "14:00", "Career", true, today),
    task("demo-05", "和朋友吃饭", -21, "19:00", "Personal", true, today),
    task("demo-06", "学习 Figma Variables", -19, "20:30", "Study", true, today),
    task("demo-07", "Design Review", -17, "15:00", "Career", true, today),
    task("demo-08", "晚饭后散步", -15, "19:30", "Health", true, today),
    task("demo-09", "修改 onboarding flow", -13, "10:00", "Career", true, today),
    task("demo-10", "整理房间", -11, "10:30", "Personal", true, today),
    task("demo-11", "分析用户反馈", -9, "14:30", "Career", false, today),
    task("demo-12", "整理作品集", -8, "16:00", "Study", true, today),
    task("demo-13", "Yoga", -7, "18:30", "Health", true, today),
    task("demo-14", "给家里打电话", -6, "20:00", "Personal", true, today),
    task("demo-15", "准备产品分享", -4, "09:30", "Career", true, today),
    task("demo-16", "阅读产品相关书籍", -3, "21:00", "Study", false, today),
    task("demo-17", "Design Review 复盘", -2, "17:00", "Career", true, today),
    task("demo-18", "Gym", -1, "18:30", "Health", false, today),
    task("demo-19", "完成 onboarding 优化", 0, "10:00", "Career", false, today),
    task("demo-20", "阅读论文", 0, "15:00", "Study", false, today),
    task("demo-21", "晚饭后散步", 0, "19:00", "Health", false, today),
    task("demo-22", "准备产品分享", 1, "11:00", "Career", false, today),
    task("demo-23", "去看展览", 2, "14:00", "Personal", false, today),
    task("demo-24", "跑步", 3, "07:30", "Health", false, today),
    task("demo-25", "修改作品集", 4, "16:00", "Study", false, today),
    task("demo-26", "分析用户反馈", 5, "10:30", "Career", false, today),
    task("demo-27", "周末去咖啡店看书", 6, "14:00", "Personal", false, today),
    task("demo-28", "整理下周计划", 7, "09:30", "Personal", false, today),
  ];
  const reflections: ReflectionCollection = {};
  const reflectionData = [
    [-13, "今天终于把用户访谈整理完了。比想象中花了更多时间，不过也发现之前忽略了几个问题。", "把访谈按主题拆开之后，信息清楚了很多。", "下午有一段不被打扰的时间。", "", "Good"],
    [-11, "下午状态一般，本来安排了很多事情，最后只完成了最重要的一件。", "计划排得太满时，开始反而更难。", "晚上安静地整理了房间。", "", "Okay"],
    [-9, "Design Review 比预想顺利，之前担心的问题其实没有那么严重。", "提前把问题写下来，让讨论更集中。", "同事给了很具体的反馈。", "", "Great"],
    [-7, "晚上和朋友吃了饭。今天没有做很多事情，但心情还不错。", "休息也需要被安排进生活里。", "一顿不用赶时间的晚饭。", "", "Good"],
    [-4, "完成了产品分享的第一版，终于不再只是脑子里的想法。", "先做一个可以被看见的版本，比一直修改更有帮助。", "有时间慢慢走回家。", "", "Good"],
    [-2, "把 onboarding 的问题拆成了几个小部分，开始没有想象中难。", "拆小之后更容易找到第一个动作。", "今天的咖啡很好喝。", "", "Great"],
    [-1, "Design Review 结束后有点累，但讨论比预期更具体。", "有些问题需要先被说出来，才知道怎么继续。", "团队愿意一起把问题讲清楚。", "", "Tough"],
    [0, "今天完成了最重要的一小步。", "", "晚上还有一点自己的时间。", "", "Good"],
  ] as const;
  reflectionData.forEach(([offset, wentWell, learned, grateful, notes, mood]) => {
    const date = dateFromOffset(today, offset);
    reflections[date] = { date, wentWell, learned, grateful, notes, mood };
  });

  const weeklyPlans: WeeklyPlanCollection = {};
  const weeklyReflections: WeeklyReflectionCollection = {};
  [-21, -14, -7, 0].forEach((offset, index) => {
    const start = weekStart(dateFromOffset(today, offset));
    weeklyPlans[start] = {
      weekStart: start,
      focusItems: [["完成用户研究", "保持两次运动", "周末不安排工作"], ["完成产品 Demo", "准备 Design Review", "留一点时间阅读"], ["修改作品集", "整理项目案例", "恢复规律睡眠"], ["完成 onboarding 优化", "准备产品分享", "运动三次"]][index],
      oneThing: ["把访谈资料收拢成一个可以继续使用的版本。", "让 Demo 先完成一个能被看见的版本。", "把作品集从草稿整理到可以分享。", "把 onboarding 优化推进到可以测试。 "][index],
      weeklyNote: ["不要把每一天都安排得太满。", "先完成，再慢慢变好。", "给需要思考的事情留一点连续时间。", "工作之外，也留一点空间给生活。 "][index],
    };
    if (index < 3) {
      weeklyReflections[start] = {
        weekStart: start,
        memorable: ["终于把零散的用户研究收了回来。", "第一次独立完成了产品 Demo。", "Design Review 比预想顺利。 "][index],
        learned: ["先把问题拆小，事情会更容易开始。", "可以先做一个不完美但可见的版本。", "提前写下担心的问题，讨论会更具体。 "][index],
        grateful: ["同事愿意一起把问题讲清楚。", "有几次不被打扰的阅读时间。", "工作之外还有和朋友吃饭的晚上。 "][index],
        nextWeek: ["把反馈整理成下一轮可以执行的动作。", "留一点时间给作品集。", "继续保持两次运动。 "][index],
        aiSummary: ["这一周最明显的一条线，是终于把前段时间比较零散的用户研究收了回来。周初原本想同时推进几件事，但真正占据注意力的还是研究整理。几次记录里都提到了先把问题拆小，这似乎让一些原本不太想开始的事情容易了一点。工作之外，也留下了运动和朋友的晚饭。", "这一周从一个可以被看见的产品 Demo 开始。它还不需要一次变得完整，但第一版让后面的讨论有了落点。阅读和运动没有占据很多位置，却让这几天没有只剩下工作。", "这一周最值得记住的，是一次比预想顺利的 Design Review。提前写下问题让讨论更集中，也让一些担心有了具体的形状。生活里仍然留下了晚饭和散步，这些片段没有被任务列表记录，却确实属于这一周。 "][index],
      };
    }
  });
  const currentWeek = weekStart(today);
  weeklyReflections[currentWeek] = {
    weekStart: currentWeek,
    memorable: "",
    learned: "",
    grateful: "",
    nextWeek: "",
    aiSummary: "这一周最明显的一条线，是把 onboarding 的问题从一个模糊的想法拆成了可以继续推进的几个部分。原本还想同时完成阅读、作品集和运动，但真正占据注意力的还是产品分享和设计上的细节。每天留下的记录不长，却几次提到先做最重要的一小步，这让这一周有了一个比较清楚的节奏。工作之外，也留下了散步和一点自己的时间。",
  };

  const currentMonth = monthKey(today);
  const monthlyPlans: MonthlyPlanCollection = {
    [currentMonth]: {
      month: currentMonth,
      directions: [
        { id: "demo-month-work", title: "工作", description: "把 onboarding 优化真正推进到可以测试的状态" },
        { id: "demo-month-growth", title: "成长", description: "把作品集整理成可以分享的版本" },
        { id: "demo-month-life", title: "生活", description: "恢复规律运动，也给周末留一点空白" },
      ],
    },
  };
  const monthlyMoments: MonthlyMomentCollection = {
    [currentMonth]: [
      { id: "demo-moment-1", date: dateFromOffset(today, -9), content: "第一次独立主持完整 Design Review", isYearHighlight: true },
      { id: "demo-moment-2", date: dateFromOffset(today, -4), content: "完成作品集第一版", isYearHighlight: true },
      { id: "demo-moment-3", date: dateFromOffset(today, -7), content: "和很久没见的朋友吃饭" },
      { id: "demo-moment-4", date: dateFromOffset(today, -2), content: "周末一个人去了展览" },
    ],
  };
  const monthlyReflections: MonthlyReflectionCollection = {
    [currentMonth]: {
      month: currentMonth,
      memorable: "这个月终于把几个零散的项目想法整理成了可以分享的版本。",
      changes: "开始接受先做出一个可以讨论的版本，而不是一直等到它足够完整。",
      grateful: "感谢愿意认真给反馈的人，也感谢自己给生活留了一点空白。",
      carryForward: "继续推进 onboarding，也继续保留运动和朋友见面的时间。",
      aiSummary: "这个月的主线，是把零散的想法慢慢变成可以被看见、被讨论的东西。工作占据了不少注意力，但运动、展览和朋友的晚饭也让这个月没有只剩下项目。",
    },
  };
  const year = today.slice(0, 4);
  const yearlyPlans: YearlyPlanCollection = {
    [year]: {
      year,
      directions: [
        { id: "demo-year-growth", title: "成长", description: "找到真正适合自己的职业方向" },
        { id: "demo-year-life", title: "生活", description: "不要因为忙碌而忽略生活本身" },
        { id: "demo-year-relationships", title: "关系", description: "多花一点时间陪重要的人" },
      ],
      remember: "不需要每件事情都有结果，也可以允许自己探索。",
    },
  };
  const yearlyReflections: YearlyReflectionCollection = {
    [year]: {
      year,
      changed: "开始接受先做出一个可以讨论的版本，而不是一直等到它足够完整。",
      proud: "把几个零散的项目想法整理成了可以分享的版本。",
      learned: "先把问题拆小，事情会更容易开始。",
      peopleAndThings: "愿意认真给反馈的人，以及那些没有被工作占满的晚上。",
      carryForward: "继续保留探索，也给生活留一点空间。",
      noteToNextYear: "不需要每件事情都有结果，也可以允许自己探索。",
      aiSummary: "这一年并没有被单一的一条线填满。工作上的几个项目从零散想法慢慢变成了可以被讨论的版本，过程中也留下了 Design Review、作品集和 onboarding 优化这些具体的节点。记录里反复出现的，是先把问题拆小，以及不要把每一天都安排得太满。也有一些晚上留给朋友、散步和展览。它们没有被当作成果计算，却让这一年保留了生活本身的纹理。",
    },
  };
  return { tasks, reflections, weeklyPlans, weeklyReflections, monthlyPlans, monthlyMoments, monthlyReflections, yearlyPlans, yearlyReflections };
}

export function loadDemoDataset(today: string) {
  const dataset = createDemoDataset(today);
  saveTasks(dataset.tasks);
  saveReflections(dataset.reflections);
  saveWeeklyPlans(dataset.weeklyPlans);
  saveWeeklyReflections(dataset.weeklyReflections);
  saveMonthlyPlans(dataset.monthlyPlans);
  saveMonthlyMoments(dataset.monthlyMoments);
  saveMonthlyReflections(dataset.monthlyReflections);
  saveYearlyPlans(dataset.yearlyPlans);
  saveYearlyReflections(dataset.yearlyReflections);
  window.localStorage.setItem(onboardingStorageKey, "true");
  setDemoMode(true);
}

export function resetDemoDataset(today: string) {
  loadDemoDataset(today);
}

export function clearDemoDataset() {
  [storageKey, reflectionStorageKey, weeklyPlanStorageKey, weeklyReflectionStorageKey, monthlyPlanStorageKey, monthlyMomentStorageKey, monthlyReflectionStorageKey, yearlyPlanStorageKey, yearlyReflectionStorageKey].forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.removeItem(onboardingStorageKey);
  setDemoMode(false);
}

export function completeOnboarding() {
  window.localStorage.setItem(onboardingStorageKey, "true");
  demoListeners.forEach((listener) => listener());
}

export function hasCompletedOnboarding() {
  return typeof window !== "undefined" && window.localStorage.getItem(onboardingStorageKey) === "true";
}
