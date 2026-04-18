import GameGrid from "@/components/GameGrid";

export default function Home() {
  return (
    <div className="relative min-h-dvh overflow-hidden px-3 py-5 text-slate-900 sm:px-6 sm:py-8 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-float-1 absolute -left-16 top-8 h-56 w-56 rounded-full bg-orange-400/30 blur-3xl dark:bg-orange-500/18" />
        <div className="animate-float-2 absolute right-[-2rem] top-1/3 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl dark:bg-cyan-500/20" />
        <div className="animate-float-3 absolute bottom-[-3rem] left-1/3 h-72 w-72 rounded-full bg-emerald-400/24 blur-3xl dark:bg-emerald-500/15" />
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 sm:gap-6">
        <header className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300/80">
            Arcade Challenge
          </p>
          <h1 className="text-balance text-3xl font-black leading-tight sm:text-5xl">
            Emoji Hunter
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-700 sm:text-base dark:text-slate-300">
            Track targets fast, dodge obstacles, and keep your streak alive with touch-first controls and smooth motion.
          </p>
        </header>

        <GameGrid />
      </main>
    </div>
  );
}
