import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Copy,
  Flame,
  Mountain,
  Shield,
  Scale,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { demoCases } from "@/lib/data/cases";
import { scenarios } from "@/lib/data/scenarios";

const modes = [
  { id: "Peacekeeper", icon: Shield, desc: "Validate + repair" },
  { id: "Barrister", icon: Scale, desc: "Receipts + leverage" },
  { id: "Grey Rock", icon: Mountain, desc: "Disengage & log" },
  { id: "Nuclear", icon: Flame, desc: "Witty pressure" },
];

interface WarRoomPageProps {
  params: { caseId: string };
}

export default function WarRoomPage({ params }: WarRoomPageProps) {
  const caseMeta =
    demoCases.find((c) => c.id === params.caseId) ??
    demoCases.find((c) => c.id === "alpha");
  const scenario =
    scenarios.find((s) => s.id === params.caseId) ?? scenarios[0];

  if (!caseMeta && !scenario) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 px-0">
            <Link href="/vault">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to vault
            </Link>
          </Button>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            War Room
          </p>
          <h1 className="text-3xl font-semibold text-white">
            {caseMeta?.title ?? scenario.title}
          </h1>
          <p className="text-sm text-slate-400">
            {scenario.summary} -- {caseMeta?.roundsUsed ?? 8}/
            {caseMeta?.roundsLimit ?? 30} rounds logged.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge variant="premium">
            {caseMeta?.planType ?? scenario.recommendedPlan}
          </Badge>
          <Button variant="secondary" asChild>
            <Link href="/demo">
              Launch demo <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button>
            <BrainCircuit className="mr-2 h-4 w-4" />
            Generate next round
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="border-white/5">
          <CardHeader>
            <CardTitle>Mode Strategy</CardTitle>
            <CardDescription>
              Toggle between tone presets when client-side state is wired.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {modes.map((mode, index) => {
              const Icon = mode.icon;
              const isActive = index === 1;
              return (
                <div
                  key={mode.id}
                  className={`rounded-2xl border px-4 py-4 transition ${
                    isActive
                      ? "border-cyan-400/60 bg-cyan-500/10"
                      : "border-white/5 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl border border-white/10 bg-white/5 p-2 text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {mode.id}
                      </p>
                      <p className="text-xs text-slate-400">{mode.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-slate-950/60">
          <CardHeader>
            <CardTitle>Budget</CardTitle>
            <CardDescription>Synced with Supabase cases table.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Credits left: <span className="text-white font-semibold">8</span>
            </p>
            <p>
              AI spend: <span className="text-white font-semibold">$18.40</span>
            </p>
            <p className="text-slate-400">
              Soft caps enforced before Gemini calls fire, with logs inside
              `ai_usage_logs`.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/5">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Opponent Statement</CardTitle>
              <CardDescription>Encrypted at rest.</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>
              &ldquo;You&apos;re being unreasonable expecting me to respond in
              under 24 hours. I have a life too. If you keep pushing, I&apos;ll
              just end the agreement altogether.&rdquo;
            </p>
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-xs uppercase tracking-widest text-slate-400">
              Round 18 -- Received 6 hours ago
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Barrister Response Draft</CardTitle>
              <CardDescription>Gemini model summary</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>
              &ldquo;I respect your time, which is why deadlines and response
              windows were documented on May 12. I&apos;ve attached that excerpt
              again. If you prefer not to continue, please confirm in writing by
              tomorrow so we can invoice the remaining deliverables.&rdquo;
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
              <span className="rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
                Risk: <span className="text-white font-semibold">22/100</span>
              </span>
              <span className="rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
                Tone: <span className="text-white font-semibold">Direct</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/5 bg-slate-950/60">
        <CardHeader>
          <CardTitle>Next Operations</CardTitle>
          <CardDescription>
            Once Supabase is wired, these actions become server actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-slate-300 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            Upload transcripts → encrypt with env secret → store in `rounds`.
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            Create PayPal order for more credits → insert `payments`.
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            Trigger Gemini analysis via server action and log usage.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
