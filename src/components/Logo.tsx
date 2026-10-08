import logo from '@/assets/footfit-logo-final.png';
interface LogoProps { size?: 'sm' | 'md' | 'lg'; }
export default function Logo({ size = 'md' }: LogoProps) {
 return <div className={`brand brand-signature brand-signature-${size}`}><img className="brand-logo" src={logo} alt="FootFit AI" width={1209} height={313} /></div>;
}
