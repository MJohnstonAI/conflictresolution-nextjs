"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/UI";
import { Toaster } from "@/components/DesignSystem";
import { authService } from "@/services/auth";
import { store } from "@/services/store";
import { themeService } from "@/services/theme";
import { Theme } from "@/types";
import {
  Archive,
  Book,
  HelpCircle,
  Home as HomeIcon,
  LogIn,
  LogOut,
  MessageSquareQuote,
  Monitor,
  Moon,
  MoonStar,
  Settings,
  Sun,
  Feather,
  Disc,
  Gem,
  Snowflake,
  X,
  Zap,
} from "lucide-react";

const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeService.get());

  useEffect(() => {
    setCurrentTheme(themeService.get());
  }, []);

  const handleThemeChange = (theme: Theme) => {
    themeService.set(theme);
    setCurrentTheme(theme);
    store.updateUserTheme(theme);
  };

  const allThemes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Navy", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
    { id: "aura", label: "Aura", icon: Feather },
    { id: "midnight", label: "Midnight", icon: MoonStar },
    { id: "slate", label: "Slate", icon: Disc },
    { id: "sapphire", label: "Sapphire", icon: Gem },
    { id: "nordic", label: "Nordic", icon: Snowflake },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-navy-900 border border-navy-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-navy-800">
          <h3 className="font-serif font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-gold-500" /> Settings
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Appearance
            </label>
            <div className="grid grid-cols-4 gap-3">
              {allThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id as Theme)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    currentTheme === t.id
                      ? "bg-select-active border-gold-500 text-gold-500 shadow-md"
                      : "bg-select-inactive border-navy-800 text-slate-400 hover:border-navy-700"
                  }`}
                >
                  <t.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold capitalize truncate w-full text-center">
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <Button fullWidth onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LayoutShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [credits, setCredits] = useState(0);
  const [standardCredits, setStandardCredits] = useState(0);

  useEffect(() => {
    themeService.init();
    authService.getSession().then(setSession);
    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    store.getAccount().then((acc) => {
      setCredits(acc.premiumCredits);
      setStandardCredits(acc.standardCredits);
      if (acc.theme) themeService.set(acc.theme);
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  const navItems = [
    { icon: HomeIcon, label: "Start", path: "/" },
    { icon: Archive, label: "Vault", path: "/vault" },
    { icon: Book, label: "Templates", path: "/templates" },
    { icon: MessageSquareQuote, label: "Success Stories", path: "/testimonials" },
    { icon: Settings, label: "Settings", action: () => setShowSettings(true) },
    { icon: HelpCircle, label: "Help Center", path: "/help" },
  ];

  const handleSignOut = async () => {
    await authService.signOut();
    router.push("/auth");
  };

  return (
    <div className="flex h-screen bg-navy-950 text-slate-200 overflow-hidden font-sans transition-colors duration-300">
      <Toaster />
      <aside className="hidden md:flex w-64 flex-col border-r border-navy-800 bg-navy-950 transition-colors duration-300">
        <div className="h-16 flex items-center px-6 border-b border-navy-800/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gold-500 rounded-md flex items-center justify-center">
              <span className="font-serif font-bold text-navy-950 text-xs">CR</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-100">Conflict Resolution</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
          <div className="space-y-1">
            {session ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-slate-100 hover:bg-navy-900"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-navy-800 text-white hover:bg-navy-700"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Join</span>
              </button>
            )}
            <button
              onClick={() => router.push("/demo")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/10 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Try Demo Mode</span>
            </button>
          </div>
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Menu</div>
            {navItems.map((item) => {
              if (item.action) {
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-slate-100 hover:bg-navy-900"
                  >
                    <item.icon className="w-4 h-4 text-slate-500" />
                    <span>{item.label}</span>
                  </button>
                );
              }
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => item.path && router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-navy-800 text-gold-400"
                      : "text-slate-400 hover:text-slate-100 hover:bg-navy-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-gold-500" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-4 border-t border-navy-800/50 bg-navy-900/20">
          <button
            onClick={() => router.push("/unlock/credits")}
            className="w-full flex flex-col gap-2 p-3 rounded-lg border border-navy-800 hover:border-gold-500/30 bg-navy-900 hover:bg-navy-800 transition-all group"
          >
            <div className="flex justify-between w-full">
              <div>
                <span className="text-[10px] text-slate-500 block">Standard</span>
                <span className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                  {standardCredits}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Premium</span>
                <span className="text-lg font-bold text-slate-100 group-hover:text-gold-400 transition-colors">
                  {credits}
                </span>
              </div>
            </div>
          </button>
        </div>
      </aside>
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden scroll-smooth transition-colors duration-300 bg-navy-950">
        {children}
      </main>
      <nav className="md:hidden fixed bottom-0 w-full bg-navy-950/90 backdrop-blur-lg border-t border-navy-800 pb-safe-area z-50 transition-colors duration-300">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems
            .filter((i) => i.path)
            .map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => item.path && router.push(item.path)}
                  className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
                    isActive ? "text-gold-500" : "text-slate-500"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? "scale-110 transition-transform" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors text-slate-500"
          >
            <Settings className="w-6 h-6" strokeWidth={2} />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default LayoutShell;
