import Link from "next/link";
import { PortfolioNav } from "./PortfolioNav";

function SectionLabel({ number, children }: { number: string; children: string }) {
  return <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">{number} / {children}</p>;
}

function ExperienceRow({ title, children, detail }: { title: string; children: string; detail: string }) {
  return (
    <div className="grid gap-4 border-t border-stone-200 py-7 sm:grid-cols-[150px_1fr_190px] sm:gap-8">
      <h3 className="text-lg font-medium tracking-[-0.025em] text-stone-950">{title}</h3>
      <p className="text-base leading-7 text-stone-700">{children}</p>
      <p className="text-xs leading-5 text-stone-400">{detail}</p>
    </div>
  );
}

export function PortfolioLanding() {
  return (
    <main className="bg-[#fafaf9] text-stone-900">
      <PortfolioNav />
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <section className="flex min-h-[calc(100vh-73px)] items-center py-24 lg:py-32">
          <div className="max-w-4xl">
            <p className="mb-8 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-400">个人作品 · 产品设计与 AI 产品思考</p>
            <h1 className="max-w-3xl text-5xl font-medium leading-[1.08] tracking-[-0.055em] text-stone-950 sm:text-7xl">计划时间，<br />也记住生活。</h1>
            <p className="mt-9 max-w-2xl text-lg leading-8 text-stone-600">FlowDay 是一个连接「计划、行动与回顾」的 AI 时间管理与个人成长记录产品。它不仅帮助你决定接下来要做什么，也帮助你重新看见已经度过的时间。</p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link href="/app?demo=true" className="bg-stone-900 px-5 py-3 text-sm text-white transition-colors hover:bg-stone-700">体验产品</Link>
                <Link href="/case-study" className="text-sm text-stone-500 transition-colors hover:text-stone-950">查看项目故事</Link>
            </div>
          </div>
        </section>

        <section id="idea" className="border-t border-stone-200 py-24 lg:py-32">
          <SectionLabel number="01" >问题</SectionLabel>
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-24">
            <h2 className="max-w-xl text-4xl font-medium leading-[1.15] tracking-[-0.045em] text-stone-950 sm:text-5xl">我们记录了很多<br />“还没做的事”，<br /><span className="text-stone-400">却很少留下<br />“已经度过的时间”。</span></h2>
            <p className="max-w-md text-base leading-8 text-stone-600">待办清单和日历很擅长告诉我们下一步要做什么。<br /><br />但当一周、一个月，甚至一年过去以后，我们往往很难回答：我的时间去了哪里？我真正推进了什么？我学到了什么？有哪些事情值得记住？</p>
          </div>
        </section>

        <section className="border-t border-stone-200 py-24 lg:py-32">
          <SectionLabel number="02">核心思路</SectionLabel>
          <h2 className="max-w-xl text-4xl font-medium leading-tight tracking-[-0.045em] text-stone-950 sm:text-5xl">从管理任务，<br />到理解时间。</h2>
          <div className="mt-20 grid gap-0 border-y border-stone-200 md:grid-cols-3">
            {[{ key: "计划", title: "计划", text: "我想怎么度过这段时间" }, { key: "行动", title: "行动", text: "我实际做了什么" }, { key: "回顾", title: "回顾", text: "我从中留下了什么" }].map((item, index) => (
              <div key={item.key} className={`py-8 md:px-8 ${index > 0 ? "border-t border-stone-200 md:border-l md:border-t-0" : ""}`}>
                <p className="font-mono text-xs tracking-[0.18em] text-stone-400">{item.key}</p>
                <h3 className="mt-8 text-2xl font-medium tracking-[-0.03em] text-stone-950">{item.title}</h3>
                <p className="mt-3 text-sm text-stone-500">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-stone-500">计划 <span className="mx-2 text-stone-300">→</span> 行动 <span className="mx-2 text-stone-300">→</span> 回顾 <span className="ml-3 text-xs text-stone-400">Plan · Act · Reflect</span></p>
          <p className="mt-4 text-sm text-stone-400">FlowDay 把计划、行动和回顾放在同一条时间线上。</p>
        </section>

        <section id="product" className="border-t border-stone-200 py-24 lg:py-32">
          <SectionLabel number="03">产品体验</SectionLabel>
          <div className="max-w-xl"><h2 className="text-4xl font-medium tracking-[-0.045em] text-stone-950 sm:text-5xl">从今天开始，<br />逐渐看见更长的时间。</h2></div>
          <div className="mt-16">
            <ExperienceRow title="今天" detail="把当下的下一步放在眼前。">今天要做什么，一眼就知道。</ExperienceRow>
            <ExperienceRow title="日历" detail="把行动放回真实的日期。">把任务放回时间里，看见这一段生活的节奏。</ExperienceRow>
            <ExperienceRow title="任务" detail="让过去也有自己的位置。">不是无限增长的待办清单。已过期、今天、明天、接下来，以及按时间归档的完成记录。</ExperienceRow>
            <ExperienceRow title="回顾" detail="让记录随着时间变深。">每日、每周、每月、年度。随着时间尺度变大，记录逐渐从具体行动变成收获、变化和值得记住的事情。</ExperienceRow>
          </div>
        </section>

        <section className="border-t border-stone-200 py-24 lg:py-32">
          <SectionLabel number="04">AI 回顾</SectionLabel>
          <div className="grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:gap-24">
            <h2 className="max-w-xl text-4xl font-medium leading-[1.12] tracking-[-0.045em] text-stone-950 sm:text-5xl">AI 不替你写日记。<br /><span className="text-stone-400">它帮助你重新看见<br />自己已经留下的记录。</span></h2>
            <div>
              <div className="space-y-3 border-y border-stone-200 py-6 text-sm text-stone-700"><p>任务 + 每日记录</p><p className="pl-5 text-stone-400">↓ 每日整理</p><p>每周回顾</p><p className="pl-5 text-stone-400">↓ 每月回顾</p><p>年度回望</p></div>
              <p className="mt-8 text-sm leading-7 text-stone-500">信息会随着时间尺度逐层整理：具体行动 → 每日记录 → 每周主题 → 月度变化 → 年度回望。这样可以减少上下文噪声，保留真正重要的信息，让不同时间尺度的回顾拥有不同意义。</p>
            </div>
          </div>
        </section>

        <section className="border-t border-stone-200 py-24 lg:py-32">
          <SectionLabel number="05">产品原则</SectionLabel>
          <div className="grid gap-0 border-y border-stone-200 md:grid-cols-3">
            {[{ number: "01", title: "不为生活打分", text: "FlowDay 不使用效率评分，也不评价某一天是否“高效”。" }, { number: "02", title: "没有记录，就不编造", text: "AI 只基于用户真实留下的任务、计划和文字进行回顾。" }, { number: "03", title: "计划不是关键指标", text: "计划是给时间一个方向，不是用来证明自己完成了多少事情。" }].map((item, index) => <div key={item.number} className={`py-8 md:px-8 ${index > 0 ? "border-t border-stone-200 md:border-l md:border-t-0" : ""}`}><p className="font-mono text-xs text-stone-400">{item.number}</p><h3 className="mt-7 text-xl font-medium tracking-[-0.025em] text-stone-950">{item.title}</h3><p className="mt-4 text-sm leading-6 text-stone-500">{item.text}</p></div>)}
          </div>
        </section>

        <section id="story" className="border-t border-stone-200 py-24 lg:py-32">
          <SectionLabel number="06">迭代</SectionLabel>
          <h2 className="max-w-xl text-4xl font-medium tracking-[-0.045em] text-stone-950 sm:text-5xl">从一个简单的日程本，<br />逐渐演变为<br /><span className="text-stone-400">计划 → 行动 → 回顾。</span></h2>
          <div className="mt-16 border-t border-stone-200">{[{ version: "V0", title: "日程", text: "最初只是一个今天 + 任务的日程工具" }, { version: "V1", title: "整理", text: "加入日历、过期任务和完成记录归档" }, { version: "V2", title: "回顾", text: "加入每日、每周、每月和年度回顾" }, { version: "V3", title: "AI 上下文", text: "设计分层的 AI 回顾架构" }, { version: "V4", title: "作品集 Demo", text: "使用动态示例数据，让面试官无需注册即可体验完整产品" }].map((item) => <div key={item.version} className="grid gap-3 border-b border-stone-200 py-6 sm:grid-cols-[80px_150px_1fr] sm:gap-8"><span className="font-mono text-xs text-stone-400">{item.version}</span><h3 className="text-sm font-medium text-stone-800">{item.title}</h3><p className="text-sm text-stone-500">{item.text}</p></div>)}</div>
        </section>

        <section className="border-t border-stone-200 py-24 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:gap-24"><div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">原型范围</p><h2 className="mt-6 text-3xl font-medium tracking-[-0.04em] text-stone-950">一个可以真正走完的产品原型。</h2><p className="mt-6 max-w-lg text-sm leading-7 text-stone-500">FlowDay 当前是一个可交互的产品原型。核心任务管理、时间组织、计划与回顾流程均可实际体验。AI 上下文构建与服务端 API 架构已经完成；公开作品集 Demo 使用本地示例生成，因此无需依赖付费 API 即可完整体验产品。</p></div><div><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-400">技术实现</p><p className="mt-6 text-sm leading-8 text-stone-600">Next.js<br />TypeScript<br />Tailwind CSS<br />LocalStorage<br />OpenAI-ready 服务端架构</p></div></div>
        </section>

        <section className="border-t border-stone-200 py-28 lg:py-40"><div className="max-w-2xl"><h2 className="text-4xl font-medium leading-[1.12] tracking-[-0.045em] text-stone-950 sm:text-5xl">想看看 FlowDay<br />真正用起来是什么样？</h2><div className="mt-10 flex flex-wrap items-center gap-5"><Link href="/app?demo=true" className="bg-stone-900 px-5 py-3 text-sm text-white transition-colors hover:bg-stone-700">体验 FlowDay</Link><button type="button" disabled className="text-sm text-stone-300">查看 GitHub</button></div></div></section>

        <footer className="flex flex-wrap items-end justify-between gap-6 border-t border-stone-200 py-8 text-xs text-stone-400"><div><p className="font-medium text-stone-700">FlowDay</p><p className="mt-2">关于计划、回顾与 AI 的一次个人产品探索。</p></div><span>产品作品集</span></footer>
      </div>
    </main>
  );
}
