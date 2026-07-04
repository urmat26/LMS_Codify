'use client';

import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav className={`flex items-center gap-2 ${className}`} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-300 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
            {!isLast && item.href ? (
              <Link
                href={item.href}
                className="text-sm text-gray-500 hover:text-codify-purple-600 transition-colors cursor-pointer"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`text-sm truncate ${
                  isLast ? 'font-medium text-gray-900' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
