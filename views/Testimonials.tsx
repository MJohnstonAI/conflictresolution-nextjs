
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquareQuote, Star, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/UI';
import { store } from '../services/store';
import { SuccessStory } from '../types';
import { setRouteState } from '@/lib/route-state';

export const Testimonials: React.FC = () => {
    const router = useRouter();
    const [stories, setStories] = useState<SuccessStory[]>([]);
    const [loading, setLoading] = useState(true);

    const structuredData = useMemo(() => {
        const howTo = {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "Start a conflict case in minutes",
            description: "Prefill a case, run a session, and iterate on responses.",
            step: [
                {
                    "@type": "HowToStep",
                    name: "Prefill a scenario",
                    text: "Start with a prefilled case to save time.",
                },
                {
                    "@type": "HowToStep",
                    name: "Run a session",
                    text: "Generate strategy and response drafts for the first round.",
                },
                {
                    "@type": "HowToStep",
                    name: "Refine and send",
                    text: "Choose the tone and refine the draft before sending.",
                },
            ],
        };
        const faq = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
                {
                    "@type": "Question",
                    name: "Are names in testimonials real?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "No. Names are changed to protect privacy.",
                    },
                },
                {
                    "@type": "Question",
                    name: "Can I try a case without starting a session?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Yes. Prefill a case first, then decide when to run a session.",
                    },
                },
            ],
        };
        return [howTo, faq];
    }, []);

    useEffect(() => {
        const fetchStories = async () => {
            setLoading(true);
            try {
                const data = await store.getSuccessStories();
                setStories(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStories();
    }, []);

    return (
        <div className="flex flex-col w-full h-full animate-fade-in pb-20 md:pb-0 px-6 md:px-10">
             {structuredData.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
             ))}
             <div className="pt-10 pb-6">
                <button onClick={() => router.push('/')} className="md:hidden flex items-center gap-2 text-slate-400 mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h1 className="text-3xl font-serif font-bold text-slate-100 mb-2">Success Stories</h1>
                <p className="text-slate-300 text-sm">See how others are resolving conflicts effectively.</p>
                <p className="text-slate-500 text-xs italic mt-2 opacity-80">*Names have been changed to protect the privacy and identity of our users.</p>
                <div className="mt-6 bg-navy-900/70 border border-navy-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Start Your Case
                        </div>
                        <p className="text-sm text-slate-200 font-semibold">
                            Use a real-world scenario to start your own case today.
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Prefill only. No AI calls until you run a session.
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setRouteState("/", {
                                templateText:
                                    "My co-founder wants to renegotiate our equity split after we already agreed to 50/50.",
                                opponentType: "Colleague",
                            });
                            router.push("/");
                        }}
                        className="bg-gold-600 hover:bg-gold-500 text-navy-950 font-bold"
                    >
                        Start this case
                    </Button>
                </div>
             </div>

             {loading ? (
                 <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-slate-500">
                            <p>No success stories yet. Be the first!</p>
                        </div>
                    ) : (
                        stories.map(t => (
                            <div key={t.id} className="bg-navy-900 border border-navy-800 rounded-xl p-6 relative">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(t.stars)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-gold-500 fill-gold-500" />
                                    ))}
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
                                <div className="flex items-center gap-3 border-t border-navy-800 pt-4">
                                    <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center font-serif font-bold text-gold-500">
                                        {t.author.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-100 text-sm">{t.author}</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    <div className="bg-gradient-to-br from-navy-900 to-navy-950 border border-dashed border-navy-700 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <MessageSquareQuote className="w-12 h-12 text-gold-500/50" />
                        <h3 className="text-lg font-bold text-slate-100">Have a success story?</h3>
                        <p className="text-sm text-slate-400">Share how you resolved a conflict using our AI tools.</p>
                        <Button onClick={() => router.push('/help')}>Share Your Story</Button>
                    </div>
                </div>
             )}
        </div>
    );
};
