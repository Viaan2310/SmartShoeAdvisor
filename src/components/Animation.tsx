import { type ReactNode, type CSSProperties } from 'react';

interface MotionProps {
  children: ReactNode;
  transition?: { delay?: number; duration?: number };
  className?: string;
  style?: CSSProperties;
}

export function Motion({ children, className = '', style, transition }: MotionProps) {
  const delay = transition?.delay ? `${transition.delay}s` : '0s';
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
