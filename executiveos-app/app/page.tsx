import { ExecutiveHomeV4 } from "@/components/executive-home-v4";
import { LiveMemoryDock } from "@/components/live-memory-dock";
import { OrionCyclesDock } from "@/components/orion-cycles-dock";

export default function HomePage() {
  return <>
    <ExecutiveHomeV4 />
    <LiveMemoryDock />
    <OrionCyclesDock />
  </>;
}
