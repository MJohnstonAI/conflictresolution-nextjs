import React, { memo } from 'react';
import { LucideIcon, Activity } from 'lucide-react';

// --- BUTTONS ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = memo(({ 
  children, variant = 'primary', size = 'md', icon: Icon, fullWidth, className = '', ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-navy-950 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-action hover:bg-action-hover text-white border border-navy-700 focus:ring-blue-500",
    secondary: "bg-navy-900 hover:bg-navy-800 text-slate-200 border border-navy-800 focus:ring-navy-500",
    danger: "bg-rose-900/50 hover:bg-rose-900 text-rose-200 border border-rose-800 focus:ring-rose-500",
    ghost: "bg-transparent hover:bg-navy-800 text-slate-300 hover:text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`} 
      {...props}
    >
      {Icon && <Icon className={`mr-2 ${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />}
      {children}
    </button>
  );
});
Button.displayName = "Button";

// --- CARDS ---

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = memo(({ 
  children, className = '', title 
}) => (
  <div className={`bg-navy-900 border border-navy-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
    {title && (
      <div className="px-5 py-3 border-b border-navy-800 bg-navy-900/50">
        <h3 className="font-semibold text-slate-100">{title}</h3>
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
));
Card.displayName = "Card";

// --- INPUTS ---

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  limit?: number;
  value: string;
}

export const TextArea: React.FC<TextAreaProps> = memo(({ label, limit, value, className = '', ...props }) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>}
      <div className="relative">
        <textarea
          className={`w-full bg-navy-950 border border-navy-800 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all resize-none ${className}`}
          value={value}
          {...props}
        />
        {limit && (
          <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 bg-navy-950 px-1">
            {value.length}/{limit}
          </div>
        )}
      </div>
    </div>
  );
});
TextArea.displayName = "TextArea";

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = memo(({ label, className = '', ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>}
    <input
      className={`w-full bg-navy-950 border border-navy-800 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all ${className}`}
      {...props}
    />
  </div>
));
Input.displayName = "Input";

// --- BADGES & VISUALS ---

export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'red' | 'amber' | 'green' | 'gray' }> = memo(({ children, color = 'gray' }) => {
  // Use CSS variables defined in index.html to ensure theme compatibility (Light vs Dark)
  // Instead of Tailwind utility classes which are static, we apply dynamic vars.
  const colorMap = {
    blue: {
        backgroundColor: 'var(--badge-blue-bg)',
        color: 'var(--badge-blue-text)',
        borderColor: 'var(--badge-blue-border)'
    },
    red: {
        backgroundColor: 'var(--badge-red-bg)',
        color: 'var(--badge-red-text)',
        borderColor: 'var(--badge-red-border)'
    },
    amber: {
        backgroundColor: 'var(--badge-amber-bg)',
        color: 'var(--badge-amber-text)',
        borderColor: 'var(--badge-amber-border)'
    },
    green: {
        backgroundColor: 'var(--badge-green-bg)',
        color: 'var(--badge-green-text)',
        borderColor: 'var(--badge-green-border)'
    },
    gray: {
        backgroundColor: 'var(--badge-gray-bg)',
        color: 'var(--badge-gray-text)',
        borderColor: 'var(--badge-gray-border)'
    },
  };

  return (
    <span 
        style={colorMap[color]}
        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider"
    >
      {children}
    </span>
  );
});
Badge.displayName = "Badge";

export const RiskGauge: React.FC<{ score: number; minLowFill?: number }> = memo(({ score, minLowFill = 0 }) => {
  const normalizedScore = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
  let colorVar = 'var(--color-success)'; // Low (Green)
  let label = 'Low';

  if (normalizedScore >= 40) {
      colorVar = 'var(--color-warning)'; // Medium (Amber)
      label = 'Medium';
  }
  if (normalizedScore >= 70) {
      colorVar = 'var(--color-danger)'; // High (Red)
      label = 'High';
  }
  const displayScore = label === "Low" ? Math.max(minLowFill, normalizedScore) : normalizedScore;
  const fillScore = Math.min(100, Math.max(0, displayScore));

  return (
    <div className="space-y-1 w-full">
      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
        <span>Legal Risk</span>
        <span style={{ color: colorVar }}>
          {normalizedScore}/100 ({label})
        </span>
      </div>
      <div className="h-2 w-full bg-navy-950 rounded-full overflow-hidden border border-navy-800">
        <div 
          className="h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
          style={{ width: `${fillScore}%`, backgroundColor: colorVar }}
        />
      </div>
    </div>
  );
});
RiskGauge.displayName = "RiskGauge";

export const ConfidenceBar: React.FC<{ score: number; explanation?: string }> = memo(({ score, explanation }) => {
  let colorVar = 'var(--slate-500)'; 
  let textColorVar = 'var(--slate-400)';
  let label = 'Unsure';

  if (score >= 50) { 
      colorVar = 'var(--color-info)'; 
      textColorVar = 'var(--slate-300)';
      label = 'Medium'; 
  }
  if (score >= 80) { 
      colorVar = 'var(--gold-500)'; 
      textColorVar = 'var(--gold-400)';
      label = 'High'; 
  }

  return (
    <div className="space-y-1 w-full">
      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-1.5">
           <Activity className="w-3 h-3 text-slate-500" />
           <span>AI Confidence</span>
        </div>
        <span style={{ color: textColorVar }}>
          {score}% ({label})
        </span>
      </div>
      <div className="h-2 w-full bg-navy-950 rounded-full overflow-hidden border border-navy-800">
        <div 
          className="h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
          style={{ width: `${score}%`, backgroundColor: colorVar }}
        />
      </div>
      {explanation && <p className="text-[10px] text-slate-500 italic text-right truncate" title={explanation}>{explanation}</p>}
    </div>
  );
});
ConfidenceBar.displayName = "ConfidenceBar";
