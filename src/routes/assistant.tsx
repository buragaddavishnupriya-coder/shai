import { createFileRoute } from "@tanstack/react-router";
import { Assistant } from "@/components/Assistant";

export const Route = createFileRoute("/assistant")({
  component: AssistantPage,
});

function AssistantPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-violet-950/20 flex flex-col items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-3xl h-[88vh] flex flex-col animate-in fade-in duration-300">
        <Assistant layout="page" />
      </div>
    </div>
  );
}
