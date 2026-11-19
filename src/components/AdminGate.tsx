import { useEffect, useState, type FormEvent } from 'react';
import { getIdTokenResult, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from '../firebase';
import Admin from './Admin';

type AccessState = 'checking' | 'signed-out' | 'denied' | 'allowed';

export default function AdminGate() {
  const [access, setAccess] = useState<AccessState>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const verifyAdmin = async (user: User | null) => {
    if (!user) {
      setAccess('signed-out');
      return;
    }
    try {
      const token = await getIdTokenResult(user, true);
      setAccess(token.claims.admin === true ? 'allowed' : 'denied');
    } catch {
      setAccess('denied');
    }
  };

  useEffect(() => onAuthStateChanged(auth, (user) => {
    void verifyAdmin(user);
  }), []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await verifyAdmin(credential.user);
      setPassword('');
    } catch {
      setError('Sign-in failed. Check your credentials and try again.');
    } finally {
      setBusy(false);
    }
  };

  if (access === 'checking') {
    return <div className="min-h-screen bg-[#0a160f] text-white flex items-center justify-center">Checking administrator access…</div>;
  }

  if (access === 'allowed') return <Admin />;

  return (
    <div className="min-h-screen bg-[#0a160f] text-white flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 space-y-5">
        <h1 className="text-2xl font-bold text-mint">EcoVerse Admin</h1>
        <p className="text-sm text-white/60">Sign in with an administrator account to manage events and volunteer applications.</p>
        {access === 'denied' && <p role="alert" className="text-sm text-red-400">This account does not have administrator access.</p>}
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <label className="block text-sm">Email
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl bg-white/10 border border-white/10 p-3 text-white" />
        </label>
        <label className="block text-sm">Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl bg-white/10 border border-white/10 p-3 text-white" />
        </label>
        <button disabled={busy} className="w-full rounded-xl bg-mint p-3 font-bold text-[#0a160f] disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
        {access === 'denied' && <button type="button" onClick={() => void signOut(auth)} className="w-full text-sm text-white/60 underline">Sign out</button>}
      </form>
    </div>
  );
}
