import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { scenarios } from "@/lib/data/scenarios";

export default function TemplatesPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Templates
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Rapid-start playbooks
          </h1>
          <p className="text-sm text-slate-400">
            Each template ships with AI budget presets and tone guardrails.
          </p>
        </div>
        <Button asChild>
          <Link href="/cases/new">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate fresh template
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <Card
              key={scenario.id}
              className="border-white/5 bg-slate-950/60 hover:border-cyan-400/40"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <Badge variant="outline" className="mb-2 border-white/10">
                    {scenario.category}
                  </Badge>
                  <CardTitle className="text-xl">{scenario.title}</CardTitle>
                  <CardDescription>{scenario.summary}</CardDescription>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-3 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  Recommended: {scenario.recommendedPlan.toUpperCase()}
                </p>
                <Button variant="secondary" asChild>
                  <Link href={`/cases/${scenario.id}`}>
                    Load template <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-white/5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <BookOpen className="h-6 w-6 text-cyan-300" />
            Template Governance
          </CardTitle>
          <CardDescription>
            Server components fetch curated templates from `cases` table with a
            `demo_scenario_id` reference once the DB connection is live.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
