
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { PublicView } from './components/public/PublicView';
import { HomeDashboard } from './components/public/HomeDashboard';
import { useTournament } from './hooks/useTournament';
import type { View, Team, TournamentMode } from './types';
import { Login } from './components/admin/Login';
import { UserAuthModal } from './components/auth/UserAuthModal';
import { ToastProvider } from './components/shared/Toast';
import { TeamProfileModal } from './components/public/TeamProfileModal';
import { UserProfileModal } from './components/public/UserProfileModal';
import { TeamRegistrationModal } from './components/public/TeamRegistrationModal';
import { onAuthChange, signOutUser, getGlobalStats } from './services/firebaseService';
import { useToast } from './components/shared/Toast';
import { Spinner } from './components/shared/Spinner';
import { DashboardSkeleton } from './components/shared/Skeleton';
import { Footer } from './components/Footer';
import type { User } from 'firebase/auth';
import { HallOfFame } from './components/public/HallOfFame';
import { GlobalChat } from './components/public/GlobalChat';

const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then(module => ({ default: module.AdminPanel })));

// IMPORTANT: Replace this with your specific admin email(s) to secure the Admin Panel.
const ADMIN_EMAILS = ['admin@wakacl.com', 'admin@waykanan.com'];

function AppContent() {
  const [view, setView] = useState<View>('home');
  const [activeMode, setActiveMode] = useState<TournamentMode>('league');
  
  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  // Modals
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showUserAuth, setShowUserAuth] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showTeamRegistration, setShowTeamRegistration] = useState(false);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  
  // Global Stats for Home Page
  const [globalStats, setGlobalStats] = useState({ teamCount: 0, partnerCount: 0 });

  const tournament = useTournament(activeMode, isAdminAuthenticated);
  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      
      if (user && user.email) {
          const isAllowedAdmin = ADMIN_EMAILS.includes(user.email) || user.email.toLowerCase().includes('admin');
          setIsAdminAuthenticated(isAllowedAdmin);
          
          if (!isAllowedAdmin && view === 'admin') {
              setView('home');
          }
      } else {
          setIsAdminAuthenticated(false);
          if (view === 'admin') setView('home');
      }
    });
    return () => unsubscribe();
  }, [view]);

  // Fetch global stats on mount to show correct numbers on Home Dashboard regardless of activeMode
  useEffect(() => {
      getGlobalStats().then(stats => {
          setGlobalStats(stats);
      });
  }, []); // Run once on mount

  const handleAdminViewRequest = () => {
    if (isAdminAuthenticated) {
      setView('admin');
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleSelectMode = (mode: TournamentMode | 'hall_of_fame') => {
    if (mode === 'hall_of_fame') {
        setView('hall_of_fame');
    } else {
        setActiveMode(mode);
        setView(mode as View);
    }
  };

  const handleSetView = (newView: View) => {
    if (newView === 'league' || newView === 'wakacl' || newView === 'two_leagues') {
        setActiveMode(newView as TournamentMode);
    }
    setView(newView);
  }

  const handleLogout = async () => {
      await signOutUser();
      addToast('Anda telah keluar.', 'info');
      setView('home');
      setShowUserProfile(false);
  }

  const handleAddComment = (matchId: string, text: string) => {
      if (!currentUser) {
          addToast('Silakan login terlebih dahulu.', 'error');
          return;
      }
      tournament.addMatchComment(
          matchId, 
          currentUser.uid, 
          currentUser.displayName || currentUser.email || 'User', 
          currentUser.email || '', 
          text,
          isAdminAuthenticated
      );
  }

  const handleRegisterTeamRequest = () => {
      if (!currentUser) {
          addToast('Silakan login atau daftar akun terlebih dahulu.', 'info');
          setShowUserAuth(true);
      } else {
          setShowTeamRegistration(true);
      }
  }

  // Calculate current leader for Hall of Fame if not completed
  let currentLeader: Team | null = null;
  if (tournament.groups.length > 0 && activeMode === 'league') {
      const allStandings = tournament.groups.flatMap(g => g.standings).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
      if (allStandings.length > 0) currentLeader = allStandings[0].team;
  } else if (tournament.knockoutStage?.Final?.[0]?.winnerId) {
      const winnerId = tournament.knockoutStage.Final[0].winnerId;
      currentLeader = tournament.teams.find(t => t.id === winnerId) || null;
  }

  return (
    <div className="min-h-screen font-sans flex flex-col relative selection:bg-brand-vibrant selection:text-white overflow-x-hidden">
      {/* Dynamic Brand Background */}
      <div className="fixed inset-0 bg-brand-primary z-[-1] overflow-hidden">
         <div 
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{ 
              backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.2) 1px, transparent 1px)`, 
              backgroundSize: '40px 40px' 
            }}
         />
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-vibrant/20 blur-[140px] rounded-full animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-special/10 blur-[140px] rounded-full animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-brand-vibrant/5 blur-[160px] rounded-full pointer-events-none"></div>
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_100%)] pointer-events-none" />
      </div>
      
      <Header
        currentView={view}
        setView={handleSetView}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminViewRequest={handleAdminViewRequest}
        onLogout={handleLogout}
        currentUser={currentUser}
        onUserAuthRequest={() => setShowUserAuth(true)}
        onUserLogout={handleLogout}
        onShowProfile={() => setShowUserProfile(true)}
      />
      
      <main className="container mx-auto px-2 py-4 md:p-8 flex-grow relative z-20">
        <Suspense fallback={<div className="flex justify-center py-20"><Spinner size={40} /></div>}>
          {tournament.isLoading ? (
             <DashboardSkeleton />
          ) : (
            <>
              {view === 'home' && (
                <HomeDashboard 
                  onSelectMode={handleSelectMode} 
                  teamCount={globalStats.teamCount} 
                  partnerCount={globalStats.partnerCount}
                  banners={tournament.banners} 
                  onRegisterTeam={handleRegisterTeamRequest}
                  isRegistrationOpen={tournament.isRegistrationOpen}
                />
              )}
              
              {(view === 'league' || view === 'wakacl' || view === 'two_leagues') && (
                <PublicView 
                  groups={tournament.groups}
                  matches={tournament.matches}
                  knockoutStage={(view === 'wakacl' || view === 'two_leagues') ? tournament.knockoutStage : null}
                  rules={tournament.rules}
                  banners={tournament.banners}
                  onSelectTeam={setViewingTeam}
                  currentUser={currentUser}
                  onAddMatchComment={handleAddComment}
                />
              )}

              {view === 'hall_of_fame' && (
                <HallOfFame
                    history={tournament.history}
                    currentStatus={tournament.status}
                    mode={activeMode}
                    currentLeader={currentLeader}
                    onBack={() => setView('home')}
                />
              )}

              {view === 'admin' && isAdminAuthenticated && (
                <AdminPanel 
                  {...tournament} 
                  mode={activeMode} 
                  setMode={setActiveMode} // Fixed: Just update the mode, keep view as 'admin'
                />
              )}
            </>
          )}
        </Suspense>
      </main>
      
      {/* Floating Global Chat */}
      <GlobalChat 
          currentUser={currentUser} 
          isAdmin={isAdminAuthenticated} 
          onLoginRequest={() => setShowUserAuth(true)} 
      />

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <Login 
            onLoginSuccess={() => { 
                setShowAdminLogin(false); 
                setView('admin'); 
            }} 
            onClose={() => setShowAdminLogin(false)} 
        />
      )}

      {/* User Register/Login Modal */}
      {showUserAuth && (
          <UserAuthModal 
            onClose={() => setShowUserAuth(false)}
            onSuccess={() => setShowUserAuth(false)}
          />
      )}

      {/* User Profile Modal */}
      {showUserProfile && currentUser && (
          <UserProfileModal 
            currentUser={currentUser}
            teams={tournament.teams}
            onClose={() => setShowUserProfile(false)}
            onLogout={handleLogout}
          />
      )}

      {/* Team Registration Modal */}
      {showTeamRegistration && currentUser && (
          <TeamRegistrationModal 
            currentUser={currentUser}
            onClose={() => setShowTeamRegistration(false)}
          />
      )}
      
      {viewingTeam && (
        <TeamProfileModal 
          team={viewingTeam} 
          matches={tournament.matches} 
          onClose={() => setViewingTeam(null)} 
        />
      )}

      <Footer 
        partners={tournament.partners} 
        onAdminLogin={() => setShowAdminLogin(true)}
      />
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
