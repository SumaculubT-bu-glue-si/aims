
'use client';

import React from 'react';
import { useTransitionContext } from '@/context/transition-context';

type TransitionLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
};

export const TransitionLink = React.forwardRef<HTMLAnchorElement, TransitionLinkProps>(
  ({ href, children, onClick, ...props }, ref) => {
    const { navigate } = useTransitionContext();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (onClick) {
        onClick(e);
      }
      navigate(href);
    };

    return (
      <a href={href} onClick={handleClick} ref={ref} {...props}>
        {children}
      </a>
    );
  }
);

TransitionLink.displayName = 'TransitionLink';
