# FlowDay

> 计划时间，也记住生活。

FlowDay 是一个连接「计划、行动与回顾」的 AI 时间管理与个人成长记录产品。

它不仅帮助用户决定接下来要做什么，也帮助用户重新看见已经度过的时间。

[在线体验](https://example.com/flowday-demo) · [项目故事](https://example.com/flowday-case-study)

> 在线地址将在 Vercel 部署完成后替换为真实链接。

## 为什么做 FlowDay

Todo List 和 Calendar 很擅长回答：

> 接下来要做什么？

FlowDay 想进一步回答：

> 过去这一天、一周、一个月甚至一年，我的时间去了哪里？我经历了什么？又有哪些事情值得记住？

## 核心产品模型

```text
计划 → 行动 → 回顾
```

**计划**

我想怎么度过这段时间。

**行动**

我实际做了什么。

**回顾**

我从中留下了什么。

- Calendar = 时间
- Tasks = 行动
- Reflection = 成长

## 核心体验

FlowDay 将不同时间尺度放在同一条产品逻辑中：

- 今天
- 日历
- 任务
- 每日回顾
- 每周计划与回顾
- 每月计划与回顾
- 年度回望

## AI 回顾设计

FlowDay 使用分层的 AI Context：

```text
任务 + 每日记录
↓
每日整理
↓
每周回顾
↓
每月回顾
↓
年度回望
```

FlowDay 不让年度 AI 直接读取全年所有原始任务。信息会随着时间尺度逐层整理，减少上下文噪声，并让不同时间尺度拥有不同的回顾意义。

## 产品原则

- 不为生活打分
- 保持低压力
- 基于真实记录
- 保留用户判断
- 计划提供方向，而不是 KPI

## 示例体验

项目提供 Demo Mode，使用完全虚构的 Persona 和动态日期数据。

访问者无需注册、创建大量任务或配置 OpenAI API，即可体验完整流程：

```text
Today → Calendar → Tasks → Daily → Weekly → Monthly → Yearly
```

Demo 使用虚构的「林然」作为示例用户，并根据访问当天动态生成任务、Daily Reflection、Weekly Plan、Monthly Reflection 和 Yearly 聚合数据。

公开 Demo 中的 AI 回顾使用本地示例生成，避免 API 成本和外部服务稳定性影响体验。

## 技术实现

- Next.js
- TypeScript
- Tailwind CSS
- LocalStorage
- OpenAI-ready Server API Architecture

技术栈服务于产品原型验证，而不是项目的核心叙事。

## AI API Architecture

真实 AI 调用的路径为：

```text
Browser
↓
Next.js Server Route
↓
OpenAI API
```

真实 OpenAI API Key 只在 Server 端读取，不会暴露到浏览器。

公开 Demo 默认不调用付费 API。

## 本地运行

```bash
git clone <你的 GitHub 仓库地址>
cd flowday
npm install
npm run dev
```

然后打开：

[http://localhost:3000](http://localhost:3000)

首页是 Portfolio Landing Page。

- `/app`：FlowDay 产品本体
- `/case-study`：产品设计过程
- `/app?demo=true`：直接进入示例体验

### 使用真实 Weekly AI

真实 Weekly AI 不是运行 Demo 的必要条件。如果需要本地测试 OpenAI Server API，请在项目根目录创建 `.env.local`：

```env
OPENAI_API_KEY=your_key
```

`.env.local` 已被 Git 忽略。不要使用 `NEXT_PUBLIC_OPENAI_API_KEY`，也不要将真实 key 写入代码或提交到仓库。

## 项目结构

```text
app/
├── page.tsx                    # Portfolio Landing Page
├── app/page.tsx                # FlowDay 产品本体
├── case-study/page.tsx         # 产品设计过程
├── api/ai/reflection/route.ts  # Weekly OpenAI Server Route
└── lib/                        # Task、Reflection、Demo 与 AI Context

components/
├── portfolio/                  # Landing Page 组件
└── case-study/                 # Case Study 组件
```

## 项目阶段

FlowDay 当前是一个 Interactive Prototype。

核心产品流程可以完整交互，当前重点是验证：

```text
Plan → Act → Reflect
```

以及分层 AI Reflection 的产品设计。

## 关于开发方式

FlowDay 使用 Vibe Coding 完成原型开发。

我的工作重点包括：

- 产品问题定义
- 信息架构
- 功能优先级
- Interaction Design
- AI Context Design
- Prompt Direction
- QA 与迭代

Codex 用于辅助：

- 代码实现
- Debug
- 重构
- Build Validation

Vibe Coding 并不意味着 AI 自动生成了整个项目。它反而要求更清楚地描述做什么、为什么做、什么暂时不做，以及如何验收。
