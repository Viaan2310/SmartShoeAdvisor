import advisorShoe from '@/assets/advisor-shoe.jpg';
import Button from '@/components/AdvisorButton';
import { useState, type FormEvent } from 'react';
import { Mail, Lock, ArrowRight, Footprints, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    if (mode === 'signup') {
      const { error } = await signUp(email.trim(), password);
      setSubmitting(false);
      if (error) {
        setError(error);
        return;
      }
      setInfo('Account created! You are now signed in.');
    } else {
      const { error } = await signIn(email.trim(), password);
      setSubmitting(false);
      if (error) {
        setError(error);
      }
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  return (
    <main className="auth-shell screen-enter">
      <header className="auth-brand-header"><Logo /></header>
      <section className="auth-editorial">
        <img src={advisorShoe} alt="White and green technical running sneaker" width={1600} height={1024} />
        <div className="auth-exhibition-title"><span className="eyebrow">A BETTER FIT. A BETTER STEP.</span><h2><em>Good shoes.</em><br /><span>Great possibilities.</span></h2></div>
      </section>
      <section className="auth-form-side"><div className="auth-form-inner">
        <h1>{mode === 'signin' ? 'Welcome back.' : 'Take your first step.'}</h1>
        <p className="text-sm text-muted-foreground">{mode === 'signin' ? 'Sign in to find your fit and revisit your analyses.' : 'Create an account for your personalized shoe journey.'}</p>
        <div className="auth-mode" aria-label="Account access">
          <Button onClick={() => switchMode('signin')} aria-pressed={mode === 'signin'}>Sign In</Button>
          <Button onClick={() => switchMode('signup')} aria-pressed={mode === 'signup'}>Sign Up</Button>
        </div>
        <form onSubmit={handleSubmit}>
          <div><label htmlFor="email">Email address</label><div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="w-full rounded-md pl-11 pr-4 py-3.5" /></div></div>
          <div><label htmlFor="password">Password</label><div className="relative"><Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="w-full rounded-md pl-11 pr-14 py-3.5" /><Button onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 text-muted-foreground" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</Button></div></div>
          {error && <div className="alert-error" role="alert"><AlertCircle size={18} /><p>{error}</p></div>}
          {info && <div className="alert-success" role="status"><CheckCircle2 size={18} /><p>{info}</p></div>}
          <Button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? <Loader2 size={18} className="animate-spin" /> : null}{submitting ? mode === 'signin' ? 'Signing in...' : 'Creating account...' : mode === 'signin' ? 'Sign In' : 'Create Account'}{!submitting && <ArrowRight size={18} />}</Button>
          <p className="auth-note flex items-center justify-center gap-2"><Lock size={12} /> Your analyses are saved privately to your account.</p>
        </form>
        <p className="auth-footer">{mode === 'signin' ? "New to FootFit AI? " : 'Already have an account? '}<Button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="text-primary">{mode === 'signin' ? 'Create an account' : 'Sign in'}</Button></p>
      </div></section>
      <footer className="auth-editorial-footer"><p>Personalized shoe recommendations, grounded in your unique feet.</p><span>SCAN. MEASURE. MATCH.</span></footer>
    </main>
  );
}
