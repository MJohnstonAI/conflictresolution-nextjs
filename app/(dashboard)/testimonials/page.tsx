import { MessageCircleQuote } from "lucide-react";

import { Card } from "@/components/ui/card";
import { testimonials } from "@/lib/data/testimonials";

export default function TestimonialsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
          Testimonials
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Credibility built per round
        </h1>
        <p className="text-sm text-slate-400">
          Import live results from Supabase soon -- placeholder quotes for now.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.map((t) => (
          <Card
            key={t.id}
            className="relative border-white/5 bg-slate-950/60 p-6 text-sm text-slate-300"
          >
            <MessageCircleQuote className="mb-4 h-6 w-6 text-cyan-300" />
            <p className="text-lg text-white">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-5 text-xs uppercase tracking-widest text-slate-500">
              {t.author} -- {t.role}, {t.location}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
