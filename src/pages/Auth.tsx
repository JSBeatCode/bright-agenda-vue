import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="font-mono text-sm text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    setSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else if (isSignUp) {
      toast.success('확인 이메일을 발송했습니다. 이메일을 확인해주세요.');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm border border-border p-8">
        <h1 className="font-mono text-lg font-bold tracking-tight mb-1">WORK-FLOW</h1>
        <p className="text-xs text-muted-foreground font-mono mb-8">
          {isSignUp ? '계정 만들기' : '로그인'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-border bg-background px-3 py-2 text-sm font-sans outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-border bg-background px-3 py-2 text-sm font-sans outline-none focus:border-foreground transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-foreground text-background py-2 text-sm font-mono tracking-wider uppercase hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {submitting ? '...' : isSignUp ? '가입하기' : '로그인'}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
        >
          {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 가입하기'}
        </button>
      </div>
    </div>
  );
}
