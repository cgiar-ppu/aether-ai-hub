import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Brain, Loader2 } from 'lucide-react';

type Mode = 'login' | 'signup' | 'confirm';

const Login = () => {
  const { signIn, signUp, confirmSignUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/');
      } else if (mode === 'signup') {
        await signUp(email, password, name);
        setMode('confirm');
      } else {
        await confirmSignUp(email, code);
        await signIn(email, password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-6 relative z-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass rounded-2xl p-8 w-full max-w-md space-y-6 border border-border">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">AI Co-Scientist</h1>
            <p className="text-xs text-muted-foreground mt-1">CGIAR Food, Land & Water Research</p>
          </div>
        </div>

        {/* Tabs */}
        {mode !== 'confirm' && (
          <div className="flex gap-1 bg-secondary/30 rounded-lg p-1">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                mode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                mode === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 text-destructive text-xs rounded-lg px-4 py-3 border border-destructive/20">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'confirm' ? (
            <>
              <p className="text-sm text-muted-foreground text-center">
                We sent a verification code to <strong>{email}</strong>
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Verification Code</label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  autoFocus
                />
              </div>
            </>
          ) : (
            <>
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Full Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jose Martinez"
                    required
                    autoFocus
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@cgiar.org"
                  required
                  autoFocus={mode === 'login'}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full h-10 text-sm" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Verify & Sign In'}
          </Button>
        </form>

        {mode === 'confirm' && (
          <button
            onClick={() => setMode('login')}
            className="text-xs text-primary hover:underline w-full text-center"
          >
            Back to Sign In
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default Login;
