import Link from "next/link";
import { BrainCircuit, Lock, Shield, ArrowRight, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { scenarios } from "@/lib/data/scenarios";
import { demoCases } from "@/lib/data/cases";

export default function HomePage() {
  const featured = scenarios.slice(0, 4);

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <Card className="relative overflow-hidden border-cyan-500/10 bg-gradient-to-br from-slate-950 via-slate-950/80 to-slate-900/40">
          <div className="absolute inset-0 -z-10 opacity-60">
            <div className="absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[140px]" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-violet-500/10 blur-[100px]" />
          </div>
          <CardHeader className="space-y-4">
            <Badge variant="outline" className="w-fit border-white/20">
              AI Conflict Strategist
            </Badge>
            <CardTitle className="text-3xl sm:text-4xl">
              Run every tough conversation through a battle-tested war room.
            </CardTitle>
            <CardDescription className="text-base">
              Encrypted rounds, Gemini analysis, Supabase credit tracking, and
              PayPal-backed purchasing--ready for production once Supabase keys
              are connected.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/cases/alpha">
                <BrainCircuit className="mr-2 h-4 w-4" />
                Enter War Room
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/demo">
                <Zap className="mr-2 h-4 w-4" />
                Try Demo Mode
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-slate-950/60">
          <CardHeader>
            <CardTitle>Real-time System Status</CardTitle>
            <CardDescription>
              Stub values until Supabase + PayPal services connect.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {[
              { label: "Credits Remaining", value: "32", sub: "Premium tier" },
              { label: "Active Cases", value: "6", sub: "2 escalated" },
              { label: "AI Budget", value: "$64.20", sub: "This month" },
            ].map((metric) => (
              <div
                key={metric.label}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {metric.label}
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {metric.value}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{metric.sub}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
              Scenario Library
            </p>
            <h2 className="text-2xl font-semibold text-white">
              Pick a battle-tested starting point
            </h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/templates">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {featured.map((scenario) => {
            const Icon = scenario.icon;
            return (
              <Card
                key={scenario.id}
                className="group border-white/5 bg-slate-950/60 transition hover:border-cyan-400/30 hover:bg-slate-900/60"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <Badge variant="outline" className="mb-2 border-white/10">
                      {scenario.category}
                    </Badge>
                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                  </div>
                  <span className="rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-300">
                    <Icon className="h-5 w-5" />
                  </span>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-400">{scenario.summary}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    Plan:{" "}
                    <span className="text-white">
                      {scenario.recommendedPlan.toUpperCase()}
                    </span>
                    <Button asChild variant="link" className="p-0 text-xs">
                      <Link href={`/cases/${scenario.id}`}>
                        Open <ArrowRight className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
              Case Vault
            </p>
            <h2 className="text-2xl font-semibold text-white">
              Recent conflict simulations
            </h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/vault">
              See vault <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-4">
          {demoCases.map((conflict) => (
            <Card
              key={conflict.id}
              className="flex flex-col gap-4 border-white/5 bg-slate-950/60 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold">{conflict.title}</h3>
                <p className="text-sm text-slate-400">
                  {conflict.opponent} - Updated {conflict.updatedAt}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="premium">{conflict.planType}</Badge>
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  {conflict.roundsUsed}/{conflict.roundsLimit} rounds
                </p>
                <Button variant="secondary" asChild>
                  <Link href={`/cases/${conflict.id}`}>
                    Open war room <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/5 bg-gradient-to-br from-slate-950 to-slate-900/80">
          <CardHeader>
            <CardTitle className="text-2xl">Compliance & Security</CardTitle>
            <CardDescription>
              SSR Supabase auth, encrypted rounds, and Gemini usage logging are
              wired through server components (coming next in integration
              tasks).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[
              {
                title: "Supabase SSR Auth",
                desc: "Server helpers keep cookies in sync; route guards ready for live data.",
              },
              {
                title: "Zero-Knowledge Storage",
                desc: "Round transcripts stay encrypted; only decrypted on server actions.",
              },
              {
                title: "Payments Ready",
                desc: "PayPal-first checkout with Stripe/Peach hooks slots into payments API.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/5">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              Turn on Supabase credentials, wire PayPal server actions, and log
              AI usage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <Lock className="mt-1 h-4 w-4 text-cyan-300" />
              <p>
                Drop Supabase URL + anon key in `.env.local`, then connect
                server helpers for session-aware cases.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="mt-1 h-4 w-4 text-cyan-300" />
              <p>
                Configure PayPal client/server pair and log successful payments
                into `payments` plus `credit_ledger`.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <BrainCircuit className="mt-1 h-4 w-4 text-cyan-300" />
              <p>
                Route Gemini calls through server actions, respecting AI budget
                per case.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
