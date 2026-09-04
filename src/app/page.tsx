import { Playground } from "@/components/Playground";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-8 sm:py-8">
      <div className="w-full max-w-[1400px]">
        <Playground />
      </div>
    </div>
  );
}
