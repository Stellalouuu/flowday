import Link from "next/link";

export function PortfolioNav() {
  return (
    <nav className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#fafaf9]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-stone-950">
          <span className="flex h-6 w-6 items-center justify-center bg-stone-900 text-[11px] text-white">F</span>
          FlowDay
        </Link>
        <div className="hidden items-center gap-7 text-xs text-stone-500 sm:flex">
          <a href="#idea" className="transition-colors hover:text-stone-950">产品理念</a>
          <a href="#product" className="transition-colors hover:text-stone-950">产品体验</a>
           <Link href="/case-study" className="hover:text-stone-900">关于项目</Link>
          <Link href="/app?demo=true" className="bg-stone-900 px-4 py-2 text-white transition-colors hover:bg-stone-700">体验 FlowDay</Link>
        </div>
        <Link href="/app?demo=true" className="bg-stone-900 px-3 py-2 text-xs text-white sm:hidden">体验</Link>
      </div>
    </nav>
  );
}
