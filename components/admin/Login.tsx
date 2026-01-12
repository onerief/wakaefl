

import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { X, KeyRound, Mail } from 'lucide-react';
import { signInUser } from '../../services/firebaseService';
import { Spinner } from '../shared/Spinner';

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
    setIsLoading(true);

    try {
      await signInUser(email, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error("Firebase Auth Error:", err.code);
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email format.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
           setError('Invalid credentials. Please check your email and password.');
           break;
        default:
          setError('An unexpected error occurred. Please try again.');
          break;
      }
      setPassword('');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-light hover:text-brand-text transition-colors" aria-label="Close login modal">
          <X size={24} />
        </button>
        <div className="p-4">
          <div className="text-center mb-6">
            <KeyRound className="mx-auto text-brand-vibrant mb-2" size={40} />
            <h2 className="text-2xl font-bold text-brand-text">Admin Access</h2>
            <p className="text-brand-light text-sm">Enter your credentials to manage the tournament.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-brand-light" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Email Address"
                className="w-full p-3 pl-10 bg-brand-primary border border-brand-accent rounded-md text-brand-text placeholder:text-brand-accent focus:ring-2 focus:ring-brand-vibrant focus:border-brand-vibrant transition"
                required
                autoFocus
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound size={16} className="text-brand-light" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Password"
                className="w-full p-3 pl-10 bg-brand-primary border border-brand-accent rounded-md text-brand-text placeholder:text-brand-accent focus:ring-2 focus:ring-brand-vibrant focus:border-brand-vibrant transition"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner /> : 'Login'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};