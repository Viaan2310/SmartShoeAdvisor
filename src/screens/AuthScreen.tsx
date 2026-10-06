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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-5 py-10">
      {/* Background decoration */}



      <div className="w-full max-w-md">
        {/* Logo / heading */}
        <div className="flex flex-col items-center mb-8">
          <div className="scale-125 mb-4">
            <Logo size="md" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1.5 text-center">
            {mode === 'signin'
              ? 'Sign in to access your saved analyses'
              : 'Join Smart Shoe Advisor to save your foot analyses'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="glass-card p-1.5 flex gap-1 mb-6">
          <Button
            onClick={() => switchMode('signin')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300
              ${mode === 'signin' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'text-muted-foreground dark:text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground'}`}
          >
            Sign In
          </Button>
          <Button
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300
              ${mode === 'signup' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'text-muted-foreground dark:text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground'}`}
          >
            Sign Up
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 md:p-7 space-y-5">
          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-normal mb-2 block">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full glass rounded-lg pl-11 pr-4 py-3.5 text-sm font-medium outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-normal mb-2 block">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full glass rounded-lg pl-11 pr-12 py-3.5 text-sm font-medium outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/50"
              />
              <Button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 glass-card p-3.5 border-l-4 border-destructive animate-fade-in">
              <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive dark:text-destructive">{error}</p>
            </div>
          )}

          {/* Info */}
          {info && (
            <div className="flex items-start gap-2.5 glass-card p-3.5 border-l-4 border-success animate-fade-in">
              <CheckCircle2 size={18} className="text-success flex-shrink-0 mt-0.5" />
              <p className="text-sm text-success dark:text-success">{info}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting}
            className="btn-primary ripple group w-full flex items-center justify-center gap-2 text-lg"
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              <>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <Footprints size={12} className="text-primary" />
            Your analyses are saved privately to your account.
          </p>
        </form>

        {/* Switch link */}
        <p className="text-center text-sm text-muted-foreground dark:text-muted-foreground mt-6">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <Button
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="font-semibold text-primary dark:text-primary hover:underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </Button>
        </p>
      </div>
    </div>
  );
}
