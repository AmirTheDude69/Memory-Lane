'use client';

import * as React from 'react';

export * from 'framer';

export function ComponentViewportProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useComponentViewport() {
  const [viewport, setViewport] = React.useState({ width: 0, height: 0, y: 0 });

  React.useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        y: window.scrollY,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('scroll', updateViewport, { passive: true });

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('scroll', updateViewport);
    };
  }, []);

  return viewport;
}

export const SmartComponentScopedContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    children?: React.ReactNode;
  }
>(function SmartComponentScopedContainer({ children, ...props }, ref) {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});

export function getLoadingLazyAtYPosition() {
  return 'lazy';
}
