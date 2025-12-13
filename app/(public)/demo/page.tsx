import { Sparkles, ArrowRight } from "lucide-react";
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
import { demoModes } from "@/lib/data/demo-modes";

export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Simulator
          </p>
          <h1 className="text-4xl font-semibold text-white">
            Interactive Demo
          </h1>
          <p className="text-sm text-slate-400">
            Choose a mode to preview the response engine. Final experience will
            run server actions + Supabase logging.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {demoModes.map((mode) => (
            <Card
              key={mode.id}
              className="border-white/5 bg-slate-950/60 transition hover:border-cyan-400/40"
            >
              <CardHeader className="space-y-2">
                <Badge variant="outline" className="w-fit border-white/10">
                  {mode.label}
                </Badge>
                <CardTitle>{mode.goal}</CardTitle>
                <CardDescription>
                  Best for {mode.bestFor.join(", ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-slate-500">
                  Preview: {mode.rounds} rounds
                </p>
                <Button variant="secondary" asChild>
                  <Link href={`/cases/${mode.id}`}>
                    Load <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-white/5 bg-gradient-to-r from-slate-950 to-slate-900">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-cyan-300" />
              Ready to see the full stack?
            </CardTitle>
            <CardDescription>
              Authenticate via Supabase, select a case, then pay with PayPal to
              unlock premium credits.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/auth">Sign in to continue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
