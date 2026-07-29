import { type ReactNode, type CSSProperties, type MouseEventHandler } from 'react';

interface MotionProps {
  children: ReactNode;
  transition?: { delay?: number; duration?: number };
  className?: string;
  style?: CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function Motion({ children, className = '', style, onClick }: MotionProps) {
  return (
    <div className={className} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

