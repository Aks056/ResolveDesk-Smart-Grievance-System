import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

const templates = {
  hostel: `HOSTEL / ROOM NO: \nTIMELINE: \nISSUE TYPE: \nURGENCY: `,
  academics: `COURSE / CLASSNAME: \nTIMELINE: \nISSUE TYPE: \nACADEMIC IMPACT: `,
  it: `DEVICE / LOCATION: \nTIMELINE: \nISSUE TYPE: \nSERVICE IMPACT: `,
  canteen: `MESS / CANTEEN: \nTIMELINE: \nISSUE TYPE: \nHYGIENE CONCERN: `,
  admin: `DOCUMENT TYPE: \nTIMELINE: \nREQUEST DETAIL: \nDEADLINE: `
};

const tagConfig = [
  { key: 'hostel', label: 'Hostel', color: 'from-blue-500 to-indigo-500', ring: 'ring-blue-200', text: 'text-blue-700', bg: 'bg-blue-50 hover:bg-blue-100', border: 'border-blue-200 hover:border-blue-300' },
  { key: 'academics', label: 'Academics', color: 'from-violet-500 to-purple-500', ring: 'ring-violet-200', text: 'text-violet-700', bg: 'bg-violet-50 hover:bg-violet-100', border: 'border-violet-200 hover:border-violet-300' },
  { key: 'it', label: 'IT / Infra', color: 'from-cyan-500 to-teal-500', ring: 'ring-cyan-200', text: 'text-cyan-700', bg: 'bg-cyan-50 hover:bg-cyan-100', border: 'border-cyan-200 hover:border-cyan-300' },
  { key: 'canteen', label: 'Canteen', color: 'from-orange-400 to-amber-500', ring: 'ring-orange-200', text: 'text-orange-700', bg: 'bg-orange-50 hover:bg-orange-100', border: 'border-orange-200 hover:border-orange-300' },
  { key: 'admin', label: 'Admin', color: 'from-rose-400 to-pink-500', ring: 'ring-rose-200', text: 'text-rose-700', bg: 'bg-rose-50 hover:bg-rose-100', border: 'border-rose-200 hover:border-rose-300' },
];

export default function CoreNarrative({ value, onChange, placeholder }) {
  const [charCount, setCharCount] = useState(value.length);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
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
    }
  };

  const applyTemplate = (type) => {
    setActiveTemplate(type);
    onChange(templates[type]);
    if (textareaRef.current) textareaRef.current.focus();
    setTimeout(() => setActiveTemplate(null), 600);
  };

  const clearContent = () => {
    onChange('');
    setActiveTemplate(null);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const isWarningRange = charCount > 900;
  const isLimitReached = charCount >= 1000;

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-lg shadow-slate-200/50 relative">
      {/* Purple accent line at top */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Quick Templates</span>
        </div>
        {value && (
          <button
            type="button"
            onClick={clearContent}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all duration-200"
          >
            <RefreshCw className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Department Tag Buttons */}
      <div className="flex flex-wrap gap-2 px-5 pb-4">
        {tagConfig.map(({ key, label, text, bg, border }) => (
          <button
            key={key}
            type="button"
            onClick={() => applyTemplate(key)}
            className={`px-4 py-2 text-[11px] font-bold tracking-wide rounded-full border transition-all duration-200 transform active:scale-95 ${text} ${bg} ${border} ${
              activeTemplate === key ? 'ring-2 ring-offset-1 scale-95 opacity-80' : ''
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div className="relative mx-4 mb-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder || "Describe your concern in detail. Include locations, dates, and impact for faster resolution..."}
          className="w-full min-h-[100px] max-h-[400px] rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 focus:bg-white outline-none resize-none transition-all duration-200"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 bg-slate-50/50">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          {activeTemplate ? `${activeTemplate} template applied` : 'Type or pick a template above'}
        </span>
        <span className={`text-[10px] font-bold tracking-wider transition-colors duration-300 ${
          isLimitReached
            ? 'text-rose-500'
            : isWarningRange
              ? 'text-amber-500'
              : 'text-slate-400'
        }`}>
          {charCount} / 1000
        </span>
      </div>
    </div>
  );
}
