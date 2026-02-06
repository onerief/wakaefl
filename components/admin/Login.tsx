
import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, KeyRound, Mail, AlertTriangle } from 'lucide-react';
import { signInUser } from '../../services/firebaseService';
import { Spinner } from '../shared/Spinner';
import { ADMIN_EMAILS } from '../../App';

interface LoginProps {
  onLoginSuccess: () => void;
  onClose: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const normalizedEmail = email.trim().toLowerCase();
    
    // Validasi awal sebelum hit Firebase
    if (!ADMIN_EMAILS.includes(normalizedEmail)) {
        setError('Email ini tidak terdaftar sebagai administrator.');
        return;
    }

    setIsLoading(true);

    try {
      await signInUser(normalizedEmail, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error("Firebase Auth Error:", err.code);
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Format email tidak valid.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
           setError('Email atau password salah.');
           break;
        case 'auth/too-many-requests':
           setError('Terlalu banyak percobaan. Coba lagi nanti.');
           break;
        default:
          setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
          break;
      }
      setPassword('');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex min-h-full items-center justify-center p-4">
        <Card className="w-full max-w-md relative !p-0 overflow-hidden border-brand-vibrant/30 shadow-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-white transition-colors z-20" aria-label="Close login modal">
            <X size={24} />
            </button>
            
            <div className="bg-brand-secondary/50 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand-vibrant/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-vibrant/20">
                        <KeyRound className="text-brand-vibrant" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Admin Portal</h2>
                    <p className="text-brand-light text-xs mt-1 uppercase tracking-widest font-bold opacity-60"> Restricted Access Area</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Admin Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail size={16} className="text-brand-light/40" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                                }}
                                placeholder="name@admin.com"
                                className="w-full p-3.5 pl-12 bg-brand-primary border border-brand-accent rounded-xl text-white placeholder:text-brand-light/20 focus:ring-2 focus:ring-brand-vibrant outline-none transition"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <KeyRound size={16} className="text-brand-light/40" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                                }}
                                placeholder="••••••••"
                                className="w-full p-3.5 pl-12 bg-brand-primary border border-brand-accent rounded-xl text-white placeholder:text-brand-light/20 focus:ring-2 focus:ring-brand-vibrant outline-none transition"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 p-3 rounded-xl animate-in slide-in-from-top-2">
                            <AlertTriangle size={16} className="text-red-400 shrink-0" />
                            <p className="text-red-400 text-[10px] font-bold uppercase">{error}</p>
                        </div>
                    )}

                    <Button type="submit" className="w-full !py-4 !rounded-xl shadow-lg shadow-brand-vibrant/20 mt-4" disabled={isLoading}>
                        {isLoading ? <Spinner size={20} /> : <span className="font-black uppercase tracking-widest text-xs">Authorize Entry</span>}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-[9px] text-brand-light/30 uppercase tracking-[0.2em] font-bold">
                        Way Kanan eFootball Infrastructure
                    </p>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
};
