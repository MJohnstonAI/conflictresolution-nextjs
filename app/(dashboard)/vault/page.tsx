import Link from "next/link";
import { Archive, ArrowRight, History, Lock, Shield } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoCases } from "@/lib/data/cases";

export default function VaultPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Case Vault
          </p>
          <h1 className="text-3xl font-semibold text-white">Your Cases</h1>
          <p className="text-sm text-slate-400">
            Connected to Supabase `cases`, `rounds`, and `ai_usage_logs` tables
            once auth is live.
          </p>
        </div>
        <Button asChild>
          <Link href="/cases/new">
            <Shield className="mr-2 h-4 w-4" />
            Launch new case
          </Link>
        </Button>
      </header>

      <Card className="border-white/5">
        <CardHeader className="flex flex-col gap-4 border-b border-white/5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Usage Snapshot</CardTitle>
            <CardDescription>
              Placeholder data -- replace with Supabase aggregate query.
            </CardDescription>
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <span className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-slate-500">
                Credits
              </span>
              <span className="text-lg font-semibold text-white">32</span>
            </span>
            <span className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-slate-500">
                AI Spend
              </span>
              <span className="text-lg font-semibold text-white">$64.20</span>
            </span>
            <span className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-slate-500">
                Avg Rounds
              </span>
              <span className="text-lg font-semibold text-white">14</span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-white/5">
          {demoCases.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm uppercase tracking-widest text-slate-500">
                  {item.opponent}
                </p>
                <h3 className="text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500">Updated {item.updatedAt}</p>
              </div>
              <div className="flex flex-1 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Badge variant={item.planType === "premium" ? "premium" : "outline"}>
                  {item.planType}
                </Badge>
                <p className="text-xs text-slate-400 uppercase tracking-widest">
                  {item.roundsUsed}/{item.roundsLimit} Rounds
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="secondary">
                    <Link href={`/cases/${item.id}`}>
                      Open <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <History className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-slate-950/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-cyan-400" />
            Encryption Checklist
          </CardTitle>
          <CardDescription>
            Route-level guard to ensure encrypted payloads only decrypt on
            server actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-300">
          <p>1. Fetch cases via Supabase server client with cookie hydration.</p>
          <p>2. Validate AI budgets vs `cases.ai_budget_cents` before each run.</p>
          <p>
            3. Insert row in `rounds` storing encrypted opponent text +
            analysis.
          </p>
          <p>4. Log each call inside `ai_usage_logs` for billing.</p>
        </CardContent>
      </Card>
    </div>
  );
}
