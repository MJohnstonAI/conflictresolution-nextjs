"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { X, Check, ChevronDown, Search, Loader2, AlertTriangle, MoreVertical, Info } from 'lucide-react';

// --- UTILS ---
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

// --- 1. TOAST (Sonner-style) ---
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContext = createContext<{ addToast: (msg: string, type?: 'success'|'error'|'info') => void }>({ addToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Expose global function for non-hook usage if needed, but Context is preferred
  useEffect(() => {
    (window as any).toast = (message: string, type: 'success'|'error'|'info' = 'info') => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto bg-navy-900 border border-navy-700 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in min-w-[300px]">
           {t.type === 'success' && <Check className="w-4 h-4 text-emerald-500" />}
           {t.type === 'error' && <X className="w-4 h-4 text-rose-500" />}
           {t.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
           <span className="text-sm font-medium">{t.message}</span>
        </div>
      ))}
    </div>
  );
};

export const toast = (message: string, type: 'success'|'error'|'info' = 'info') => {
    if ((window as any).toast) (window as any).toast(message, type);
};


// --- 2. ALERT DIALOG ---
interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel?: string;
  cancelLabel?: string;
  onAction: () => void;
  variant?: 'danger' | 'primary';
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ 
  open, onOpenChange, title, description, actionLabel="Continue", cancelLabel="Cancel", onAction, variant='primary' 
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-navy-900 border border-navy-800 rounded-xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
         <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
         </div>
         <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={() => onOpenChange(false)} 
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-navy-800 transition-colors"
            >
              {cancelLabel}
            </button>
            <button 
              onClick={() => { onAction(); onOpenChange(false); }} 
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors shadow-lg",
                variant === 'danger' ? "bg-rose-600 hover:bg-rose-500" : "bg-gold-600 hover:bg-gold-500 text-navy-950"
              )}
            >
              {actionLabel}
            </button>
         </div>
      </div>
    </div>
  );
};


// --- 3. DROPDOWN MENU ---
interface DropdownItem {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

export const DropdownMenu: React.FC<{ trigger: React.ReactNode; items: DropdownItem[] }> = ({ trigger, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-navy-900 border border-navy-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
          <div className="py-1">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); item.onClick(); setIsOpen(false); }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-navy-800 transition-colors",
                  item.variant === 'danger' ? "text-rose-400 hover:text-rose-300" : "text-slate-200 hover:text-white"
                )}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// --- 4. COMBOBOX (SEARCHABLE SELECT) ---
interface ComboboxProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({ options, value, onChange, placeholder = "Select...", label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
       {label && <label className="block text-[10px] font-bold text-gold-500 uppercase tracking-widest pl-1 mb-1.5">{label}</label>}
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="w-full flex items-center justify-between bg-navy-950 border border-navy-800 hover:border-navy-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all"
       >
         <span className={!value ? "text-slate-500" : ""}>{value || placeholder}</span>
         <ChevronDown className="w-4 h-4 text-slate-500" />
       </button>
       
       {isOpen && (
         <div className="absolute top-full left-0 right-0 mt-2 bg-navy-900 border border-navy-800 rounded-xl shadow-2xl z-50 max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
            <div className="p-2 border-b border-navy-800">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      autoFocus
                      type="text" 
                      className="w-full bg-navy-950 border border-navy-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="overflow-y-auto flex-1 p-1 scrollbar-thin scrollbar-thumb-navy-700">
               {filtered.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 text-center">No results found.</div>
               ) : (
                   filtered.map(opt => (
                       <button
                         key={opt}
                         onClick={() => { onChange(opt); setIsOpen(false); setSearch(""); }}
                         className={cn(
                           "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between hover:bg-navy-800 transition-colors",
                           value === opt ? "bg-navy-800 text-gold-400 font-bold" : "text-slate-300"
                         )}
                       >
                         {opt}
                         {value === opt && <Check className="w-3.5 h-3.5" />}
                       </button>
                   ))
               )}
            </div>
         </div>
       )}
    </div>
  );
};


// --- 5. SKELETON ---
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse rounded-md bg-navy-800/50", className)} />
);


// --- 6. TABS ---
interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}
const TabsContext = createContext<TabsContextType>({ activeTab: '', setActiveTab: () => {} });

export const Tabs: React.FC<{ defaultValue: string; children: React.ReactNode; className?: string; onValueChange?: (v: string) => void }> = ({ defaultValue, children, className, onValueChange }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  const handleSetTab = (id: string) => {
      setActiveTab(id);
      if (onValueChange) onValueChange(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSetTab }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("flex items-center p-1 bg-navy-900 rounded-xl border border-navy-800", className)}>
    {children}
  </div>
);

export const TabsTrigger: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ value, children, className }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all",
        isActive ? "bg-navy-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-navy-800/50",
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ value, children, className }) => {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  return <div className={cn("mt-4 animate-in fade-in zoom-in-95 duration-200", className)}>{children}</div>;
};


// --- 7. PROGRESS ---
export const Progress: React.FC<{ value: number; max?: number; className?: string; indicatorClassName?: string }> = ({ value, max = 100, className, indicatorClassName }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className={cn("h-2 w-full bg-navy-950 rounded-full overflow-hidden border border-navy-800", className)}>
      <div 
        className={cn("h-full transition-all duration-1000 ease-out", indicatorClassName)} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};


// --- 8. TOOLTIP ---
export const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
       {children}
       {visible && (
         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-navy-950 bg-white rounded-md shadow-xl whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-150 font-bold">
           {content}
           <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
         </div>
       )}
    </div>
  );
};
