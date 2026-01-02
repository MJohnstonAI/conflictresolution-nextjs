
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth';
import { Button } from '../components/UI';
import { ArrowLeft, Mail, Lock, CheckCircle2, AlertCircle, Loader2, Wand2, Eye, EyeOff, ShieldCheck, Zap, RefreshCw, Inbox, UserPlus, User } from 'lucide-react';
import { toast } from '../components/DesignSystem';

// Component was truncated, fixing return type and dangling reference
export const Auth: React.FC = () => {
  const router = useRouter();
  const [view, setView] = useState<'signin' | 'signup' | 'forgot' | 'update'>('signin');
  
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  
  // Cooldown for resending emails
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef<number | null>(null);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length > 7) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 25;
    return strength;
  };

  const strength = getPasswordStrength(password);

  useEffect(() => {
    // Initial Session Check
    authService.getSession().then(session => {
      if (session) router.push('/vault');
    });

    // Listener for Auth Changes (Handles magic link login & Google redirect)
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/vault');
      }
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'recovery') {
      setView('update');
    }

    return () => {
      subscription.unsubscribe();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [router]);

  const startResendTimer = () => {
    setResendCooldown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setNeedsVerification(false);

    try {
      if (view === 'signin') {
        await authService.signIn(email, password);
      } 
      else if (view === 'signup') {
        if (!fullName.trim()) {
            throw new Error("Full Name is required to personalize your registration.");
        }
        
        // Password validation: mix of letters and numbers
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        if (!hasLetter || !hasNumber) {
            throw new Error("Password requirement failed: Must contain a mix of letters and numbers.");
        }

        if (password.length < 6) {
            throw new Error("Password must be at least 6 characters.");
        }

        // PER USER REQUEST: Use Magic Link process for registration verification
        // This is more reliable than standard signUp in some environments
        await authService.signInWithOtp(email, fullName);
        
        setSuccessMsg("Registration successfully transmitted. A verification link (Magic Link) has been sent to your inbox. Please click the link to activate your registration. You can set your password permanently in settings once logged in.");
        setMagicLinkSent(true);
        startResendTimer();
      } 
      else if (view === 'forgot') {
        await authService.resetPasswordForEmail(email);
        setSuccessMsg("Recovery protocol deployed. Check your inbox for the reset link.");
        setView('signin');
      }
      else if (view === 'update') {
        await authService.updateUserPassword(password);
        setSuccessMsg("Password update complete. Identity fortified.");
        setTimeout(() => setView('signin'), 2000);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message || "Authentication system failure.";
      
      if (msg.toLowerCase().includes("invalid login credentials")) {
        msg = "Access Denied: Incorrect email or password.";
      } else if (msg.toLowerCase().includes("email not confirmed")) {
        msg = "Account Inactive: Verification required.";
        setNeedsVerification(true);
      } else if (msg.toLowerCase().includes("user already registered")) {
        msg = "Protocol Error: This identity is already active. Please sign in.";
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      // Re-trigger the magic link for signup
      await authService.signInWithOtp(email, fullName);
      toast("Magic link re-deployed.", "success");
      setSuccessMsg("A new magic link has been dispatched.");
      startResendTimer();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email || !email.includes('@')) {
      setError("Valid email required for stealth link deployment.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.signInWithOtp(email);
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || "Stealth link deployment failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Fixed dangling 'set' to 'setLoading(true)'
      setLoading(true);
      await authService.signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fixed Error: Type '() => void' is not assignable to type 'FC<{}>' by adding return statement
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-5xl relative z-10 animate-fade-in">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div 
            onClick={() => router.push('/')} 
            className="inline-flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-navy-950" />
            </div>
            <span className="font-serif font-bold text-2xl text-slate-100 tracking-tight">Conflict Resolution</span>
          </div>
          <p className="text-slate-400 text-sm mt-3 font-medium">Strategic Communication Intelligence</p>
        </div>

        <div
          className={`grid gap-6 ${
            view === 'signin' ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] items-start' : 'grid-cols-1'
          }`}
        >
          <div className="bg-navy-900 border border-navy-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-0">
            <h2 className="text-2xl font-bold text-white mb-2">
              {view === 'signin' && 'Welcome Back'}
              {view === 'signup' && 'Join the Strategy'}
              {view === 'forgot' && 'Identity Recovery'}
              {view === 'update' && 'Fortify Access'}
            </h2>
            <p className="text-slate-400 text-sm">
              {view === 'signin' && 'Registered Users Login here to access your Vault and credits.'}
              {view === 'signup' && 'Enlist today for psychological tactical support.'}
              {view === 'forgot' && 'Enter your email to receive recovery protocols.'}
              {view === 'update' && 'Set your new high-security password.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="p-8 space-y-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-200 font-medium">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-200 font-medium">{successMsg}</p>
              </div>
            )}

            {magicLinkSent && view !== 'update' ? (
              <div className="space-y-6 py-4 text-center">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Transmission Successful</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  A secure access link has been dispatched to <span className="text-blue-400 font-bold">{email}</span>. Please verify your inbox.
                </p>
                <div className="pt-4">
                  <Button 
                    fullWidth 
                    variant="secondary" 
                    onClick={handleResendVerification}
                    disabled={loading || resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Protocol'}
                  </Button>
                </div>
                <button 
                  type="button"
                  onClick={() => { setMagicLinkSent(false); setSuccessMsg(null); }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Change Email Address
                </button>
              </div>
            ) : (
              <>
                {(view === 'signin' || view === 'signup' || view === 'forgot') && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Intelligence Target (Email)</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-gold-500 transition-colors" />
                      <input 
                        required
                        type="email"
                        placeholder="agent@conflict.ai"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-navy-950 border border-navy-800 rounded-xl pl-12 pr-4 py-3.5 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {view === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Personal Identifier (Full Name)</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-gold-500 transition-colors" />
                      <input 
                        required
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-navy-950 border border-navy-800 rounded-xl pl-12 pr-4 py-3.5 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {(view === 'signin' || view === 'signup' || view === 'update') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Access Key (Password)</label>
                       {view === 'signin' && (
                         <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-bold text-gold-500 hover:text-gold-400 uppercase tracking-widest">Forgot?</button>
                       )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-gold-500 transition-colors" />
                      <input 
                        required
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-navy-950 border border-navy-800 rounded-xl pl-12 pr-12 py-3.5 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {view === 'signup' && password.length > 0 && (
                      <div className="pt-2 px-1">
                        <div className="h-1.5 w-full bg-navy-950 rounded-full overflow-hidden border border-navy-800">
                          <div 
                            className={`h-full transition-all duration-500 ${strength < 50 ? 'bg-rose-500' : strength < 100 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${strength}%` }}
                          />
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-1.5 flex justify-between">
                          <span>Security Strength</span>
                          <span className={strength < 50 ? 'text-rose-500' : strength < 100 ? 'text-amber-500' : 'text-emerald-500'}>
                            {strength < 50 ? 'Weak' : strength < 100 ? 'Medium' : 'Fortified'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 space-y-4">
                  <Button 
                    type="submit"
                    fullWidth 
                    size="lg" 
                    disabled={loading}
                    className="bg-gold-600 hover:bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-600/10"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        {view === 'signin' && 'Initialize Session'}
                        {view === 'signup' && 'Register Identity'}
                        {view === 'forgot' && 'Send Recovery Protocol'}
                        {view === 'update' && 'Fortify Account'}
                      </>
                    )}
                  </Button>

                  {view === 'signin' && (
                    <>
                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-navy-800"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-navy-900 px-4 text-slate-500 tracking-widest">Or Use Stealth Mode</span></div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          type="button"
                          onClick={handleGoogleLogin}
                          disabled={loading}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-950 border border-navy-800 text-sm font-medium text-slate-300 hover:bg-navy-800 hover:text-white transition-all"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          Google
                        </button>
                        <button 
                          type="button"
                          onClick={handleMagicLink}
                          disabled={loading}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-950 border border-navy-800 text-sm font-medium text-slate-300 hover:bg-navy-800 hover:text-white transition-all"
                        >
                          <Zap className="w-4 h-4 text-blue-400" />
                          Magic Link
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </form>

          {/* Footer */}
          {!magicLinkSent && (
            <div className="p-8 pt-0 border-t border-navy-800/50 bg-navy-950/20 text-center">
              {view !== 'signin' && (
                <p className="text-sm text-slate-400">
                  Already have access? {' '}
                  <button onClick={() => setView('signin')} className="text-gold-500 font-bold hover:underline">Sign In</button>
                </p>
              )}
            </div>
          )}
          </div>

          {view === 'signin' && (
            <div className="bg-navy-900 border border-navy-800 rounded-2xl shadow-2xl p-8 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  New Users
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">Activate your membership</h3>
              <p className="text-sm text-white">
                New users register here to activate your membership.
              </p>
              <p className="text-xs text-slate-400">
                Create your account to access credits, templates, and case history.
              </p>
              <Button
                onClick={() => setView('signup')}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold"
              >
                Register here
              </Button>
            </div>
          )}
        </div>

        {/* Home/Back link */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Command Center
          </button>
        </div>
      </div>
    </div>
  );
};
