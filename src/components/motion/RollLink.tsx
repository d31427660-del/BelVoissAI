import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RollLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: string;
}

/**
 * DesignBookmark Motion — "Roll links"
 * Editorial navigation link whose label rolls upward on hover/focus,
 * revealing a crisp duplicate layer below via compositor-only transforms.
 * Falls back to a static color transition under `prefers-reduced-motion`.
 */
export const RollLink: React.FC<RollLinkProps> = ({
  children,
  className,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <a className={className} {...props}>
        {children}
      </a>
    );
  }

  const rollEasing = { transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' };

  return (
    <a
      className={cn('group relative inline-flex items-center', className)}
      {...props}
    >
      <span className="relative inline-block overflow-hidden leading-[1.25]">
        <span
          style={rollEasing}
          className="block transition-transform duration-300 group-hover:-translate-y-full group-focus-visible:-translate-y-full will-change-transform"
        >
          {children}
        </span>
        <span
          aria-hidden="true"
          style={rollEasing}
          className="absolute inset-0 block translate-y-full transition-transform duration-300 group-hover:translate-y-0 group-focus-visible:translate-y-0 will-change-transform text-black"
        >
          {children}
        </span>
      </span>
    </a>
  );
};
