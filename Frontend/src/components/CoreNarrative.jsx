import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Shield, Cpu, RefreshCw } from 'lucide-react';

const templates = {
  infrastructure: `LOCATION: \nTIMELINE: \nPHYSICAL DAMAGE: \nOPERATIONAL IMPACT: `,
  academic: `COURSE / CLASSNAME: \nTIMELINE: \nRESOURCE ISSUE: \nACADEMIC IMPACT: `,
  it: `DEVICE / NODE IP: \nTIMELINE: \nNETWORK DEVIATION: \nIMMEDIATE SYSTEM IMPACT: `,
  electricity: `LOCATION: \nEQUIPMENT / LINE ID: \nTIMELINE: \nHAZARD LEVEL: \nOPERATIONAL IMPACT: `
};

export default function CoreNarrative({ value, onChange, placeholder }) {
  const [charCount, setCharCount] = useState(value.length);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const timerRef = useRef(null);

  // Auto-expand textarea height based on content
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Minimum height of 4 lines (approx 96px)
      const newHeight = Math.min(textarea.scrollHeight, 400);
      textarea.style.height = `${Math.max(newHeight, 96)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
    setCharCount(value.length);
  }, [value]);

  const handleTextChange = (e) => {
    const text = e.target.value;
    if (text.length <= 1000) {
      onChange(text);
      
      // Update typing state & trigger pulsing "PARSING..." status
      setIsTyping(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    }
  };

  const applyTemplate = (type) => {
    const templateText = templates[type];
    onChange(templateText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const clearContent = () => {
    onChange('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const isWarningRange = charCount > 900;
  const isLimitReached = charCount >= 1000;

  return (
    <div className="w-full rounded-2xl border border-border/10 bg-black/45 backdrop-blur-2xl overflow-hidden shadow-2xl relative">
      {/* Subtle Electric Purple Accent Light */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-primary/50 via-secondary/70 to-primary/50 opacity-80" />

      {/* Header Bar: Incident Templates */}
      <div className="flex flex-col gap-4 px-5 py-4 border-b border-border/10 bg-card/45">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-300">
            <Terminal className="w-4 h-4 text-primary" />
            <span>Description</span>
          </div>
          {value && (
            <button
              type="button"
              onClick={clearContent}
              className="p-1.5 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-md transition-all duration-300 shrink-0"
              title="Clear operational log"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        
        {/* Stretched Grid for Template Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
          <button
            type="button"
            onClick={() => applyTemplate('infrastructure')}
            className="w-full text-center py-2 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase rounded-lg border border-slate-700/50 bg-slate-900/30 hover:bg-primary/10 hover:border-primary/40 text-slate-300 hover:text-slate-100 transition-all duration-300"
          >
            [Infra]
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('electricity')}
            className="w-full text-center py-2 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase rounded-lg border border-slate-700/50 bg-slate-900/30 hover:bg-primary/10 hover:border-primary/40 text-slate-300 hover:text-slate-100 transition-all duration-300"
          >
            [Electrical]
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('academic')}
            className="w-full text-center py-2 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase rounded-lg border border-slate-700/50 bg-slate-900/30 hover:bg-primary/10 hover:border-primary/40 text-slate-300 hover:text-slate-100 transition-all duration-300"
          >
            [Academic]
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('it')}
            className="w-full text-center py-2 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase rounded-lg border border-slate-700/50 bg-slate-900/30 hover:bg-primary/10 hover:border-primary/40 text-slate-300 hover:text-slate-100 transition-all duration-300"
          >
            [IT/Net]
          </button>
        </div>
      </div>

      {/* Textarea Box (Nested Terminal Screen) */}
      <div className="relative bg-slate-950/60 shadow-inner border-y border-black/10">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder || "Provide a comprehensive operational log. Include specific locations, dates, and the immediate impact to expedite routing..."}
          className="w-full min-h-[96px] max-h-[400px] border-0 bg-transparent p-5 font-mono text-sm leading-relaxed text-slate-100 placeholder:text-zinc-500 focus:ring-0 focus:outline-none resize-none overflow-y-auto custom-scrollbar transition-all"
        />
        {/* Glow focus ring layer */}
        <div className="absolute inset-0 border border-transparent pointer-events-none focus-within:border-primary/30 focus-within:shadow-[inset_0_0_15px_rgba(126,81,255,0.12)] transition-all duration-500" />
      </div>

      {/* Footer Bar */}
      <div className="flex items-center justify-end px-5 py-3 border-t border-border/10 bg-card/25 text-[10px] font-black tracking-widest uppercase">
        {/* Right Side: Character Counter */}
        <div className="flex items-center gap-1.5">
          <span className={`transition-colors duration-300 ${
            isLimitReached 
              ? 'text-destructive font-black' 
              : isWarningRange 
                ? 'text-yellow-500 font-bold' 
                : 'text-zinc-300 font-bold drop-shadow-[0_0_4px_rgba(212,212,216,0.2)]'
          }`}>
            {charCount} / 1000 MAX
          </span>
        </div>
      </div>
    </div>
  );
}
