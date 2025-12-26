
"use client";

import React, { useState } from 'react';
import { ArrowLeft, BookOpen, MessageCircle, Mail, ChevronDown, ChevronUp, Send, Copy, Check, Shield, Scale, Mountain, Flame, Briefcase, Zap, Globe, Cpu, Microscope } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button, Badge } from '../components/UI';
import { Tabs, TabsList, TabsTrigger, TabsContent, toast } from '../components/DesignSystem';

export const Help: React.FC = () => {
  const router = useRouter();
  const [emailCopied, setEmailCopied] = useState(false);

  const handleCopyEmail = () => {
      navigator.clipboard.writeText("syncteamai@gmail.com");
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
      toast("Email copied to clipboard.", "success");
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-200 animate-fade-in pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-navy-900 border-b border-navy-800 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push('/')} className="md:hidden p-2 -ml-2 text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-100">Help Center</h1>
            <p className="text-sm text-slate-400">Guides, support, and resources for Conflict Resolution.</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <Tabs defaultValue="guide">
          <TabsList className="mb-8 w-full bg-navy-900 p-1.5 rounded-2xl border border-navy-800 sticky top-24 z-10 shadow-xl">
            <TabsTrigger value="guide" className="rounded-xl py-3">
               <BookOpen className="w-4 h-4 mr-2" /> Guide
            </TabsTrigger>
            <TabsTrigger value="faq" className="rounded-xl py-3">
               <MessageCircle className="w-4 h-4 mr-2" /> FAQ
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-xl py-3">
               <Mail className="w-4 h-4 mr-2" /> Contact
            </TabsTrigger>
          </TabsList>

          {/* TAB: GUIDE */}
          <TabsContent value="guide">
            <div className="space-y-8 animate-fade-in">
              <section className="space-y-6">
                <h2 className="text-xl font-bold text-slate-100">How to use Conflict Resolution</h2>
                
                {/* STEPS 1 & 2 */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-navy-900 p-6 rounded-xl border border-navy-800">
                    <div className="text-gold-500 font-bold text-lg mb-2">01. Create a Case</div>
                    <p className="text-slate-400 text-sm leading-relaxed">Select your opponent type (e.g., Landlord, Ex-Partner) and describe the situation. This sets the initial context for the AI.</p>
                  </div>
                  <div className="bg-navy-900 p-6 rounded-xl border border-navy-800">
                    <div className="text-gold-500 font-bold text-lg mb-2">02. The War Room</div>
                    <p className="text-slate-400 text-sm leading-relaxed">Paste the message you received. The AI analyzes the text for hidden aggression, legal risks, and emotional manipulation.</p>
                  </div>
                </div>

                {/* STEP 3: STRATEGY DEEP DIVE */}
                <div className="bg-navy-900 p-6 md:p-8 rounded-xl border border-navy-800 space-y-6">
                   <div className="border-b border-navy-800 pb-4">
                      <div className="text-gold-500 font-bold text-lg mb-1">03. Choose Your Strategy</div>
                      <p className="text-slate-400 text-sm">The AI generates 4 distinct response types. Choose the one that fits your strategic goal.</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Peacekeeper */}
                      <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-lg p-5">
                         <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold uppercase text-xs tracking-wider">
                            <Shield className="w-4 h-4" /> Peacekeeper
                         </div>
                         <p className="text-slate-300 text-sm font-bold mb-1">Best For: Saving Relationships</p>
                         <p className="text-slate-400 text-xs leading-relaxed">
                            Use this when you want to de-escalate tension with a partner, friend, or family member. It uses "we" language and validation to lower defenses while gently asserting your needs.
                         </p>
                      </div>

                      {/* Barrister */}
                      <div className="bg-blue-900/10 border border-blue-500/30 rounded-lg p-5">
                         <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold uppercase text-xs tracking-wider">
                            <Scale className="w-4 h-4" /> Barrister
                         </div>
                         <p className="text-slate-300 text-sm font-bold mb-1">Best For: Business & Legal</p>
                         <p className="text-slate-400 text-xs leading-relaxed">
                            Removes all emotion. Focuses strictly on facts, dates, contracts, and logic. Ideal for landlords, bosses, or custody disputes where you need a "paper trail" for court.
                         </p>
                      </div>

                      {/* Grey Rock */}
                      <div className="bg-slate-800/30 border border-slate-600/30 rounded-lg p-5 md:col-span-2">
                         <div className="flex items-center gap-2 mb-2 text-slate-300 font-bold uppercase text-xs tracking-wider">
                            <Mountain className="w-4 h-4" /> Grey Rock
                         </div>
                         <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-slate-300 text-sm font-bold mb-1">Best For: Narcissists & High Conflict</p>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    Designed for dealing with <strong>Narcissistic Personality Disorder (NPD)</strong>. People with NPD crave emotional reaction (positive or negative) as "supply".
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-300 text-sm font-bold mb-1">Why it works</p>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    By giving boring, monosyllabic, unemotional responses (like a grey rock), you starve them of this supply. They eventually get bored and move on to a new target.
                                </p>
                            </div>
                         </div>
                      </div>

                      {/* Nuclear */}
                      <div className="bg-rose-900/10 border border-rose-500/30 rounded-lg p-5 md:col-span-2">
                         <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold uppercase text-xs tracking-wider">
                            <Flame className="w-4 h-4" /> Nuclear
                         </div>
                         <p className="text-slate-300 text-sm font-bold mb-1">Best For: Shutting Down Bullies</p>
                         <p className="text-slate-400 text-xs leading-relaxed">
                            A high-risk, high-reward mode. It uses wit, sarcasm, and psychological mirroring to humiliate an aggressor or expose their insecurity.<br /><strong>Warning:</strong> This will burn bridges. Use only when you are ready to end the relationship or silence a troll.
                            <br /><strong>Disclaimer:</strong> We will not be held liable for any consequences resulting from the use of this mode. Do not use this mode if you have a restraining order awarded against you or engaged in active legal proceedings from the adversary.
                         </p>
                      </div>

                   </div>
                </div>

                {/* STEP 4 */}
                <div className="bg-navy-900 p-6 rounded-xl border border-navy-800">
                    <div className="text-gold-500 font-bold text-lg mb-2">04. Iterate & Export</div>
                    <p className="text-slate-400 text-sm leading-relaxed">Continue the conversation round by round. When finished, you can export the entire case history as a Markdown file for your records or attorney.</p>
                </div>

                {/* NEW SECTION: Mix & Match Strategy */}
                <div className="bg-gradient-to-br from-navy-900 to-navy-950 border border-gold-500/30 rounded-xl p-6 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Briefcase className="w-24 h-24 text-gold-500" /></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge color="amber">Pro Tip</Badge>
                            <h3 className="text-lg font-bold text-slate-100">Mix & Match Your Arsenal</h3>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed mb-4">
                            You don't need to commit to just one tier. Your account wallet can hold <strong>both Standard and Premium credits</strong> simultaneously. 
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-navy-950/50 p-4 rounded-lg border border-navy-800">
                                <div className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">Standard Credits</div>
                                <p className="text-xs text-slate-400">Perfect for everyday friction—petty arguments, minor misunderstandings, or quick social replies (10 rounds).</p>
                            </div>
                            <div className="bg-navy-950/50 p-4 rounded-lg border border-gold-500/20">
                                <div className="text-gold-500 font-bold text-xs uppercase tracking-wider mb-1">Premium Credits</div>
                                <p className="text-xs text-slate-400">Save these for the heavy hitters—legal threats, narcissists, custody battles, or financial disputes (40 rounds + expert analysis).</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-4 italic">
                            When you click "Start New Case", simply choose the tier that matches the threat level of that specific conflict.
                        </p>
                    </div>
                </div>

              </section>
              
              <section className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-xl space-y-4">
                 <h3 className="text-lg font-bold text-blue-300">Why do I need to paste the opponent's message?</h3>
                 <p className="text-sm text-slate-400 leading-relaxed">
                    The AI uses the specific wording, tone, and timing of your opponent's message to perform <strong>Psychological Profiling</strong> and <strong>Behavioral Analysis</strong>. This allows it to detect manipulation tactics (gaslighting, guilt-tripping) that a generic summary might miss.
                 </p>
                 <div className="bg-navy-950/50 p-4 rounded-lg border border-navy-800">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Limit Note</p>
                    <p className="text-xs text-slate-400">Inputs are limited to 15,000 characters. If your opponent sent a very long email, please split it into multiple rounds to ensure the AI captures every detail accurately.</p>
                 </div>
              </section>
            </div>
          </TabsContent>

          {/* TAB: FAQ */}
          <TabsContent value="faq">
            <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
              <FAQItem 
                  question="Why does the psychological analysis take so long?" 
                  answer={
                    <div className="space-y-4">
                        <p>The analysis takes time because the AI is performing a multi-step cognitive process rather than just "chatting." Here is a breakdown of why it requires extra processing time:</p>
                        <ul className="space-y-3">
                            <li className="flex gap-2">
                                <span className="font-bold text-slate-200 shrink-0">• Deep Thinking (Premium):</span>
                                <span className="text-slate-400">If you are using a Professional Case, the model uses a "Thinking Budget." It spends several seconds reasoning through hidden psychological motives, power dynamics, and legal risks before it even begins writing your responses.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-slate-200 shrink-0">• Structural Complexity:</span>
                                <span className="text-slate-400">In a single call, the AI must evaluate the "vibe," calculate a risk score, identify logical fallacies, and then draft four distinct strategic responses. This is a massive amount of data to process with accuracy.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-slate-200 shrink-0">• Strategy vs. Speed:</span>
                                <span className="text-slate-400">For high-stakes conflicts (like legal or co-parenting disputes), the system is tuned to prioritize <strong>tactical precision</strong> over raw speed. It’s designed to ensure you don't send a response you'll regret.</span>
                            </li>
                        </ul>
                        <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded-lg flex items-start gap-2">
                            <Zap className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-400 italic">If you need a faster result for simple social issues, using the <strong>Standard</strong> tier utilizes a faster model without the deep reasoning overhead.</p>
                        </div>
                    </div>
                  }
              />
              <FAQItem 
                  question="How does the AI become 'smarter' every day without slowing down?" 
                  answer={
                    <div className="space-y-4">
                        <p>Our system leverages three parallel streams of improvement to ensure intelligence grows while performance remains optimized:</p>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <div className="p-2 bg-gold-500/10 rounded-lg shrink-0 h-fit">
                                    <Globe className="w-4 h-4 text-gold-500" />
                                </div>
                                <div>
                                    <span className="font-bold text-slate-200">Perpetual Research:</span>
                                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">The underlying Gemini models are continuously updated with a vast corpus of academic research on mediation, conflict management, and psychological theory from across the globe. This ensures the "logic" stays modern and effective.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg shrink-0 h-fit">
                                    <Microscope className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                    <span className="font-bold text-slate-200">Systemic Pattern Recognition:</span>
                                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">We analyze anonymized, high-level trends from thousands of cases to identify which tactical "anchors" and psychological frames lead to the most successful resolutions. This "experience" is baked into our core strategic instructions daily.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0 h-fit">
                                    <Cpu className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <span className="font-bold text-slate-200">Architectural Efficiency:</span>
                                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">By isolating "Thinking" from "Writing" via advanced prompt engineering, the AI can apply complex reasoning without needing more time to generate text. As processing power increases globally, our models become faster at even more complex tasks.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                  }
              />
              <FAQItem 
                  question="Is my data private?" 
                  answer="Yes. Your authentication and case data are securely stored in a cloud database (Supabase). This ensures you do not lose your paid case history if you clear your browser cache or switch devices. We use industry-standard encryption to protect your privacy." 
              />
              <FAQItem 
                  question="Can I use this for legal advice?" 
                  answer="No. The Conflict Resolution app provides communication strategies and psychological analysis, not legal advice. However, we strongly encourage you to export your case history and share it with a qualified attorney or law enforcement, especially if the conflict involves threats, harassment, or potential litigation." 
              />
              <FAQItem 
                  question="What am I actually paying for?" 
                  answer="We value transparency. You are not buying vague 'points'. You are purchasing a specific 'Case File'. One Premium purchase = One complete conflict resolution project (up to 40 rounds of analysis). This fee covers the high cost of the AI processing and the storage of your case history." 
              />
              <FAQItem 
                  question="Can I mix Standard and Premium credits?" 
                  answer="Absolutely. Your account wallet is flexible. You can hold balances for both. Many users keep a 'Standard' balance for day-to-day issues (like a rude neighbor) and buy 'Premium' credits only when a serious issue arises (like a landlord dispute). When starting a case, you simply assign the credit type you want to use." 
              />
              <FAQItem 
                  question="What is a 'Round'?" 
                  answer="A round consists of one message from your opponent, the AI analysis, and the generated response options. Premium cases allow up to 40 rounds." 
              />
              <FAQItem 
                  question="What happens when a case is full?" 
                  answer="Once a case reaches its round limit (e.g., 40), the AI stops analyzing. You can export the file or start a 'Part 2' case using a summary of the previous one." 
              />
            </div>
          </TabsContent>

          {/* TAB: CONTACT */}
          <TabsContent value="contact">
            <div className="max-w-xl mx-auto animate-fade-in">
               <div className="bg-navy-900 border border-navy-800 rounded-2xl p-8">
                  <h3 className="text-xl font-bold text-slate-100 mb-6">Contact Support</h3>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast("Message sent!", "success"); }}>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Your Email</label>
                        <input type="email" className="w-full bg-navy-950 border border-navy-800 rounded-lg p-3 text-slate-200 outline-none focus:border-gold-500" placeholder="you@example.com" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Subject</label>
                        <select className="w-full bg-navy-950 border border-navy-800 rounded-lg p-3 text-slate-200 outline-none focus:border-gold-500">
                           <option>General Inquiry</option>
                           <option>Billing Issue</option>
                           <option>Bug Report</option>
                           <option>Feature Request</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Message</label>
                        <textarea className="w-full bg-navy-950 border border-navy-800 rounded-lg p-3 text-slate-200 outline-none focus:border-gold-500 h-32 resize-none" placeholder="How can we help?" />
                     </div>
                     <Button fullWidth className="mt-4 gap-2">
                        <Send className="w-4 h-4" /> Send Message
                     </Button>
                  </form>
                  <div className="mt-6 pt-6 border-t border-navy-800 text-center flex flex-col items-center">
                     <p className="text-xs text-slate-500 mb-2">Or email us directly</p>
                     <button 
                       onClick={handleCopyEmail}
                       className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all border ${emailCopied ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/50' : 'bg-navy-950 text-gold-500 border-navy-700 hover:border-gold-500'}`}
                     >
                       {emailCopied ? (
                          <>
                             <Check className="w-4 h-4" /> Copied to Clipboard
                          </>
                       ) : (
                          <>
                             <Copy className="w-4 h-4" /> Copy Email Address
                          </>
                       )}
                     </button>
                  </div>
               </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const FAQItem: React.FC<{ question: string; answer: React.ReactNode }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-navy-800 rounded-lg bg-navy-900/50 overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 text-left hover:bg-navy-800 transition-colors">
        <span className="font-bold text-slate-200">{question}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gold-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 text-sm text-slate-400 leading-relaxed border-t border-navy-800/50 bg-navy-950/30">
           <div className="pt-4">{answer}</div>
        </div>
      )}
    </div>
  );
};
