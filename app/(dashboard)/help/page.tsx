import { HelpCircle, Mail, MessageSquare, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FAQ = [
  {
    question: "How do credits work?",
    answer:
      "Every premium case consumes credits logged into `credit_ledger`. Add balance by purchasing via PayPal or Stripe-ready routes.",
  },
  {
    question: "Where is my data stored?",
    answer:
      "Supabase Postgres with row-level security. AES-encrypted payloads stay server-side, never in the browser.",
  },
  {
    question: "What about refunds?",
    answer:
      "Refunds write to `refunds` and reverse credits using `credit_ledger` trigger logic.",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Help Center
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Tactical assistance on standby
          </h1>
          <p className="text-sm text-slate-400">
            Connects to Supabase soon for contextual support tickets.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary">
            <MessageSquare className="mr-2 h-4 w-4" />
            Live chat (stub)
          </Button>
          <Button>
            <Mail className="mr-2 h-4 w-4" />
            support@conflict.studio
          </Button>
        </div>
      </header>

      <Card className="border-white/5">
        <CardHeader>
          <CardTitle>Frequently Asked</CardTitle>
          <CardDescription>Live data will stream from Supabase soon.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {FAQ.map((item) => (
            <div key={item.question}>
              <h3 className="text-lg font-semibold text-white">{item.question}</h3>
              <p className="text-sm text-slate-400">{item.answer}</p>
              <Separator className="my-4" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-slate-950/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-cyan-400" />
            Security Contact
          </CardTitle>
          <CardDescription>
            Report security events or privacy concerns 24/7.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          Email: security@conflict.studio -- we respond within 8 business hours.
        </CardContent>
      </Card>

      <div className="rounded-3xl border border-white/5 bg-white/5 p-6 text-sm text-slate-300">
        <HelpCircle className="mb-3 h-5 w-5 text-cyan-300" />
        Still need help? Drop transcripts in the secure uploader (coming soon)
        or book a strategist session.
      </div>
    </div>
  );
}
