import Link from "next/link";

export function CaseStudyNav() {
  return (
    <nav className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#fafaf9]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="text-sm text-stone-600 transition-colors hover:text-stone-950">← FlowDay</Link>
        <div className="hidden items-center gap-6 text-xs text-stone-400 sm:flex">
          <a href="#start" className="hover:text-stone-900">起点</a>
          <a href="#evolution" className="hover:text-stone-900">产品演进</a>
          <a href="#ai" className="hover:text-stone-900">AI 设计</a>
          <a href="#demo" className="hover:text-stone-900">Demo</a>
          <a href="#learning" className="hover:text-stone-900">学习</a>
        </div>
        <Link href="/app?demo=true" className="bg-stone-900 px-4 py-2 text-xs text-white transition-colors hover:bg-stone-700">体验产品</Link>
      </div>
    </nav>
  );
}
