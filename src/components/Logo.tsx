import { Footprints } from 'lucide-react';
interface LogoProps { size?: 'sm' | 'md' | 'lg'; }
export default function Logo({ size = 'md' }: LogoProps) {
 return <div className="brand"><div className="brand-mark"><Footprints size={size === 'lg' ? 26 : 20} strokeWidth={1.8} /></div><div className="brand-name">FootFit AI<span>YOUR NEXT STEP, PERSONALIZED</span></div></div>;
}
