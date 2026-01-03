import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteLayout from "@/components/public-site-layout";

export const metadata: Metadata = {
  title: "About | Conflict Resolution",
  description:
    "Learn how Conflict Resolution helps you de-escalate conflict, protect your boundaries, and draft clear responses.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PublicSiteLayout activeNav="about">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">About Conflict Resolution</h1>
              <p className="mt-3 text-slate-600">
                Conflict Resolution is a practical coaching workspace for turning tense messages into
                clear, confident replies. The Library gives you examples. The app gives you a guided,
                personalized response for your exact situation.
              </p>
            </div>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">What the app does</h2>
              <p className="text-slate-600">
                Paste the situation, choose a tone, and get strategic response drafts tailored to
                your goal. You can keep it calm, firm, or direct, while staying professional and in control.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li>- De-escalate tense conversations without losing your point.</li>
                <li>- Set boundaries that are clear and hard to misinterpret.</li>
                <li>- Draft responses that reduce back-and-forth and end the loop.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">How it is different from templates</h2>
              <p className="text-slate-600">
                Templates are short and general on purpose. The app converts your real context into a
                tailored response so you do not have to guess what to say next.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900">Who it is for</h2>
              <p className="text-slate-600">
                Anyone navigating difficult conversations at work, at home, or with customers. If you
                want to respond without escalating, this is built for you.
              </p>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
              <h3 className="text-lg font-semibold text-slate-900">Ready for a custom response?</h3>
              <p className="mt-2 text-sm text-slate-600">
                Start a case and get a personalized draft built from your exact context.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Start a Case
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Explore the Library first</p>
              <p className="mt-2">
                Browse guides for common conflict scenarios and see example scripts.
              </p>
              <Link className="mt-4 inline-flex text-sm font-semibold text-blue-600" href="/resources">
                Browse the Library -&gt;
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </PublicSiteLayout>
  );
}
