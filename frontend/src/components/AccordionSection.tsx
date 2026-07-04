'use client';

import { useState, useRef, useEffect } from 'react';

interface AccordionSectionProps {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function AccordionSection({
  title,
  icon,
  count,
  defaultOpen = true,
  children,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        {icon && <span className="text-lg shrink-0">{icon}</span>}
        <span className="text-base font-semibold text-gray-900">{title}</span>
        {count !== undefined && (
          <span className="ml-auto mr-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
            {count}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        style={{ maxHeight: isOpen ? contentHeight : 0 }}
        className="transition-all duration-300 ease-in-out overflow-hidden"
      >
        <div ref={contentRef} className="px-5 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}
