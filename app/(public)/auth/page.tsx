'use client';

import { useState } from "react";
import Link from "next/link";
import { LogIn, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Placeholder for Supabase-authenticated workflow (server action soon)
    await new Promise((resolve) => setTimeout(resolve, 400));
    alert("Supabase auth wiring coming next. This stub prevents crashes.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="glass-panel w-full max-w-2xl border-white/5 p-8">
        <CardHeader className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Access
          </p>
          <CardTitle className="text-3xl font-semibold text-white">
            Sign {mode === "login" ? "in" : "up"} to Conflict Resolution Lab
          </CardTitle>
          <p className="text-sm text-slate-400">
            Supabase SSR auth will live here; forms show final UI.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex rounded-2xl border border-white/5 bg-white/5 p-1 text-sm font-semibold text-slate-400">
            <button
              className={`flex-1 rounded-2xl px-4 py-2 transition ${
                mode === "login" ? "bg-cyan-500/10 text-white" : ""
              }`}
              onClick={() => setMode("login")}
            >
              Sign In
            </button>
            <button
              className={`flex-1 rounded-2xl px-4 py-2 transition ${
                mode === "signup" ? "bg-cyan-500/10 text-white" : ""
              }`}
              onClick={() => setMode("signup")}
            >
              Create Account
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@conflict.studio"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="context">What conflict are you solving?</Label>
                <Textarea
                  id="context"
                  placeholder="Optional context for onboarding strategist"
                />
              </div>
            )}

            <Button type="submit" className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400">
            By continuing you agree to the{" "}
            <Link href="/legal/terms" className="text-cyan-300 underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="text-cyan-300 underline">
              Privacy Policy
            </Link>
            .
          </p>

          <Button variant="secondary" className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
