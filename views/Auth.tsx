
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth';
import { store } from '../services/store';
import { Button } from '../components/UI';
import { ArrowLeft, Mail, Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck, Zap, Inbox, UserPlus, User } from 'lucide-react';
import { toast } from '../components/DesignSystem';

// Component was truncated, fixing return type and dangling reference
export const Auth: React.FC = () => {
  const router = useRouter();
  const [view, setView] = useState<'entry' | 'forgot' | 'update' | 'profile'>('entry');
  const [passwordMode, setPasswordMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  
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
    const params = new URLSearchParams(window.location.search);
    const stayOnAuth = params.get('stay') === '1';
    const viewParam = params.get('view');

    // Initial Session Check
    authService.getSession().then(async (session) => {
      if (session && !stayOnAuth) {
        const account = await store.getAccount();
        if (!account?.name?.trim()) {
          setDisplayName(account?.name || "");
          setView('profile');
          return;
        }
        router.push('/vault');
      }
    });

    // Listener for Auth Changes (Handles magic link login & Google redirect)
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && !stayOnAuth) {
        store.getAccount().then((account) => {
          if (!account?.name?.trim()) {
            setDisplayName(account?.name || "");
            setView('profile');
            return;
          }
          router.push('/vault');
        });
      }
    });

    if (params.get('type') === 'recovery') {
      setView('update');
    } else if (viewParam === 'forgot') {
      setView('forgot');
    } else if (viewParam === 'update') {
      setView('update');
    } else if (viewParam === 'profile') {
      setView('profile');
    } else {
      setView('entry');
      if (viewParam === 'signup') setPasswordMode('signup');
      if (viewParam === 'signin') setPasswordMode('signin');
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

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setNeedsVerification(false);

    try {
      if (passwordMode === 'signin') {
        await authService.signIn(email, password);
      } else {
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        if (!hasLetter || !hasNumber) {
          throw new Error("Password requirement failed: Must contain a mix of letters and numbers.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        await authService.signUp(email, password);
        setSuccessMsg("Registration submitted. Please verify your email to activate the account and unlock payments.");
        setNeedsVerification(true);
        setVerificationEmail(email);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message || "Authentication system failure.";

      if (msg.toLowerCase().includes("invalid login credentials")) {
        msg = "Access Denied: Incorrect email or password.";
      } else if (msg.toLowerCase().includes("email not confirmed")) {
        msg = "Account Inactive: Verification required.";
        setNeedsVerification(true);
        setVerificationEmail(email);
      } else if (msg.toLowerCase().includes("user already registered")) {
        msg = "Protocol Error: This identity is already active. Please sign in.";
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await authService.resetPasswordForEmail(email);
      setSuccessMsg("Recovery protocol deployed. Check your inbox for the reset link.");
      setView('entry');
    } catch (err: any) {
      setError(err.message || "Recovery protocol failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await authService.updateUserPassword(password);
      setSuccessMsg("Password update complete. Identity fortified.");
      setTimeout(() => setView('entry'), 2000);
    } catch (err: any) {
      setError(err.message || "Password update failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError("Name or pseudonym is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await store.updateUserName(trimmed);
      setSuccessMsg("Profile updated.");
      router.push('/vault');
    } catch (err: any) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const targetEmail = verificationEmail || email;
      if (!targetEmail) {
        throw new Error("Email address required to resend verification.");
      }
      await authService.resendVerification(targetEmail);
      toast("Verification link re-deployed.", "success");
      setSuccessMsg("A new verification link has been dispatched.");
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
      setSuccessMsg("Magic link deployed. Check your inbox to finish signing in.");
      startResendTimer();
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

  const showSidePanel = view === 'entry';

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
            showSidePanel ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] items-start' : 'grid-cols-1'
          }`}
        >
          <div className="bg-navy-900 border border-navy-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8 pb-0">
              <h2 className="text-2xl font-bold text-white mb-2">
                {view === 'entry' && 'Continue to Conflict Resolution'}
                {view === 'forgot' && 'Identity Recovery'}
                {view === 'update' && 'Fortify Access'}
                {view === 'profile' && 'Finalize Your Profile'}
              </h2>
              <p className="text-slate-400 text-sm">
                {view === 'entry' && 'Choose a sign-in method. New and returning users can use any option.'}
                {view === 'forgot' && 'Enter your email to receive recovery protocols.'}
                {view === 'update' && 'Set your new high-security password.'}
                {view === 'profile' && 'Set your name or pseudonym before continuing.'}
              </p>
            </div>

            <div className="p-8 space-y-5">
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

              {needsVerification && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-3">
                  <p className="text-sm text-amber-200 font-medium">
                    Email verification is required before payments and activations. Please check your inbox.
                  </p>
                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={handleResendVerification}
                    disabled={loading || resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification'}
                  </Button>
                </div>
              )}

              {view === 'profile' && (
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Name or Pseudonym
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-gold-500 transition-colors" />
                      <input
                        required
                        type="text"
                        placeholder="Agent Grey"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-navy-950 border border-navy-800 rounded-xl pl-12 pr-4 py-3.5 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    disabled={loading}
                    className="bg-gold-600 hover:bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-600/10"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save and Continue'}
                  </Button>
                </form>
              )}

              {view === 'forgot' && (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Email</label>
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
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    disabled={loading}
                    className="bg-gold-600 hover:bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-600/10"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Recovery Protocol'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setView('entry')}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors w-full"
                  >
                    Back to sign-in options
                  </button>
                </form>
              )}

              {view === 'update' && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                      New Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-gold-500 transition-colors" />
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter a new password"
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
                  </div>
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    disabled={loading}
                    className="bg-gold-600 hover:bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-600/10"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Fortify Account'}
                  </Button>
                </form>
              )}

              {view === 'entry' && (
                <div className="space-y-6">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-navy-950 border border-navy-800 text-sm font-semibold text-slate-200 hover:bg-navy-800 hover:text-white transition-all"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="rounded-2xl border border-navy-800 bg-navy-950/40 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">Email Link</h3>
                        <p className="text-xs text-slate-500">Get a one-time sign-in link. Works for new and returning users.</p>
                      </div>
                      <Zap className="w-4 h-4 text-blue-400" />
                    </div>
                    {magicLinkSent ? (
                      <div className="space-y-4 text-center">
                        <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                          <Inbox className="w-7 h-7 text-blue-400" />
                        </div>
                        <p className="text-sm text-slate-300">
                          A secure access link has been dispatched to <span className="text-blue-400 font-bold">{email}</span>.
                        </p>
                        <Button
                          fullWidth
                          variant="secondary"
                          onClick={handleMagicLink}
                          disabled={loading || resendCooldown > 0}
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Magic Link'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => { setMagicLinkSent(false); setSuccessMsg(null); }}
                          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          Change Email Address
                        </button>
                      </div>
                    ) : (
                      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleMagicLink(); }}>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-gold-500 transition-colors" />
                          <input
                            required
                            type="email"
                            placeholder="agent@conflict.ai"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-navy-950 border border-navy-800 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all"
                          />
                        </div>
                        <Button
                          type="submit"
                          fullWidth
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Magic Link'}
                        </Button>
                      </form>
                    )}
                  </div>

                  <div className="rounded-2xl border border-navy-800 bg-navy-950/40 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">Email + Password</h3>
                        <p className="text-xs text-slate-500">Classic access. Use this only if you have set a password.</p>
                      </div>
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPasswordMode('signin')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${
                          passwordMode === 'signin'
                            ? 'bg-navy-900 border-gold-500/60 text-gold-400'
                            : 'bg-navy-950 border-navy-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => setPasswordMode('signup')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${
                          passwordMode === 'signup'
                            ? 'bg-navy-900 border-gold-500/60 text-gold-400'
                            : 'bg-navy-950 border-navy-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Create
                      </button>
                    </div>
                    <form className="space-y-3" onSubmit={handlePasswordAuth}>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-gold-500 transition-colors" />
                        <input
                          required
                          type="email"
                          placeholder="agent@conflict.ai"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-navy-950 border border-navy-800 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all"
                        />
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-gold-500 transition-colors" />
                        <input
                          required
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-navy-950 border border-navy-800 rounded-xl pl-12 pr-12 py-3 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordMode === 'signup' && password.length > 0 && (
                        <div className="pt-2">
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
                      <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        disabled={loading}
                        className="bg-gold-600 hover:bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-600/10"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : passwordMode === 'signin' ? 'Sign In' : 'Create Account'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setView('forgot')}
                        className="text-[10px] font-bold text-gold-500 hover:text-gold-400 uppercase tracking-widest w-full"
                      >
                        Forgot password?
                      </button>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        If you joined with Google or a Magic Link and never set a password, password sign-in will not work yet.
                        Set a password in Settings after signing in to enable it.
                      </p>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {showSidePanel && (
            <div className="bg-navy-900 border border-navy-800 rounded-2xl shadow-2xl p-8 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  New Operators
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">Set up in minutes</h3>
              <p className="text-sm text-white">
                Choose Google, Magic Link, or email + password. We'll ask for your name after you sign in.
              </p>
              <p className="text-xs text-slate-400">
                Your email is your account identity. It cannot be changed later.
              </p>
              <Button
                onClick={() => {
                  setPasswordMode('signup');
                  setMagicLinkSent(false);
                }}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold"
              >
                Create account with password
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMagicLinkSent(false);
                  setView('entry');
                }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Prefer email link? Use Magic Link above
              </button>
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


