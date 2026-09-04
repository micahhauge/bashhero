import { Playground } from "@/components/Playground";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-12 sm:py-20">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">BashHero</h1>
        <p className="mt-2 text-zinc-400">Learn the command line, one directory at a time.</p>
      </div>

      <div className="w-full max-w-4xl">
        <Playground />
      </div>
    </div>
  );
}
