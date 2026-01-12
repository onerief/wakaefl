
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { PublicView } from './components/public/PublicView';
import { HomeDashboard } from './components/public/HomeDashboard';
import { useTournament } from './hooks/useTournament';
import type { View, Team, TournamentMode } from './types';
import { Login } from './components/admin/Login';
import { ToastProvider } from './components/shared/Toast';
import { TeamProfileModal } from './components/public/TeamProfileModal';
import { onAuthChange, signOutUser } from './services/firebaseService';
import { useToast } from './components/shared/Toast';
import { Spinner } from './components/shared/Spinner';
import { Footer } from './components/Footer';

const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then(module => ({ default: module.AdminPanel })));

function AppContent() {
  const [view, setView] = useState<View>('home');
  const [activeMode, setActiveMode] = useState<TournamentMode>('league');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  
  // Hook is reactive to activeMode and authentication status
  const tournament = useTournament(activeMode, isAdminAuthenticated);
  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setIsAdminAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleAdminViewRequest = () => {
    if (isAdminAuthenticated) {
      setView('admin');
    } else {
      setShowLogin(true);
    }
  };

  const handleSelectMode = (mode: TournamentMode) => {
    setActiveMode(mode);
    setView(mode);
  };

  const handleSetView = (newView: View) => {
    if (newView === 'league' || newView === 'wakacl') {
        setActiveMode(newView as TournamentMode);
    }
    setView(newView);
  }

  return (
    <div className="min-h-screen font-sans flex flex-col relative selection:bg-brand-vibrant selection:text-white overflow-x-hidden">
      {/* Dynamic Brand Background */}
      <div className="fixed inset-0 bg-brand-primary z-[-1] overflow-hidden">
         {/* Tech Grid */}
         <div 
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{ 
              backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.2) 1px, transparent 1px)`, 
              backgroundSize: '40px 40px' 
            }}
         />
         
         {/* Animated Glow Blobs */}
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-vibrant/20 blur-[140px] rounded-full animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-special/10 blur-[140px] rounded-full animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-brand-vibrant/5 blur-[160px] rounded-full pointer-events-none"></div>

         {/* Vignette */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_100%)] pointer-events-none" />
      </div>
      
      <Header
        currentView={view}
        setView={handleSetView}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminViewRequest={handleAdminViewRequest}
        onLogout={async () => { await signOutUser(); setView('home'); }}
      />
      
      <main className="container mx-auto p-4 md:p-8 flex-grow relative z-20">
        <Suspense fallback={<div className="flex justify-center py-20"><Spinner size={40} /></div>}>
          {tournament.isLoading ? (
             <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Spinner size={48} />
                <p className="text-brand-light font-bold uppercase tracking-widest animate-pulse">Loading {activeMode} Database...</p>
             </div>
          ) : (
            <>
              {view === 'home' && (
                <HomeDashboard 
                  onSelectMode={handleSelectMode} 
                  teamCount={tournament.teams.length} 
                  partnerCount={tournament.partners.length} 
                />
              )}
              
              {(view === 'league' || view === 'wakacl') && (
                <PublicView 
                  groups={tournament.groups}
                  matches={tournament.matches}
                  knockoutStage={view === 'wakacl' ? tournament.knockoutStage : null}
                  rules={tournament.rules}
                  banners={tournament.banners}
                  onSelectTeam={setViewingTeam}
                />
              )}

              {view === 'admin' && isAdminAuthenticated && (
                <AdminPanel 
                  {...tournament} 
                  mode={activeMode} 
                  setMode={handleSelectMode} 
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      {showLogin && <Login onLoginSuccess={() => { setIsAdminAuthenticated(true); setShowLogin(false); setView('admin'); }} onClose={() => setShowLogin(false)} />}
      
      {viewingTeam && (
        <TeamProfileModal 
          team={viewingTeam} 
          matches={tournament.matches} 
          onClose={() => setViewingTeam(null)} 
        />
      )}

      <Footer partners={tournament.partners} />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App;
