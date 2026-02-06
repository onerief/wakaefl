
import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { Header } from './components/Header';
import { NavigationMenu } from './components/NavigationMenu';
import { MarqueeBanner } from './components/public/MarqueeBanner';
import { BannerCarousel } from './components/public/BannerCarousel';

// Lazy load components
const PublicView = lazy(() => import('./components/public/PublicView').then(module => ({ default: module.PublicView })));
const HomeDashboard = lazy(() => import('./components/public/HomeDashboard').then(module => ({ default: module.HomeDashboard })));
const HallOfFame = lazy(() => import('./components/public/HallOfFame').then(module => ({ default: module.HallOfFame })));
const NewsPortal = lazy(() => import('./components/public/NewsPortal').then(module => ({ default: module.NewsPortal })));
const StoreFront = lazy(() => import('./components/public/StoreFront').then(module => ({ default: module.StoreFront })));
const StaticPages = lazy(() => import('./components/public/StaticPages').then(module => ({ default: module.StaticPages })));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then(module => ({ default: module.AdminPanel })));

import { useTournament } from './hooks/useTournament';
import type { View, Team, TournamentMode, SeasonHistory, Match, KnockoutMatch, NewsItem, Product } from './types';
import { Login } from './components/admin/Login';
import { UserAuthModal } from './components/auth/UserAuthModal';
import { ToastProvider } from './components/shared/Toast';
import { TeamProfileModal } from './components/public/TeamProfileModal';
import { UserProfileModal } from './components/public/UserProfileModal';
import { TeamRegistrationModal } from './components/public/TeamRegistrationModal';
import { onAuthChange, signOutUser, getGlobalStats, getTournamentData, getUserTeams } from './services/firebaseService';
import { useToast } from './components/shared/Toast';
import { Spinner } from './components/shared/Spinner';
import { DashboardSkeleton } from './components/shared/Skeleton';
import { Footer } from './components/Footer';
import type { User } from 'firebase/auth';
import { GlobalChat } from './components/public/GlobalChat';

export const ADMIN_EMAILS = ['admin@banjit.com', 'admin@baradatu.com', 'admin@waykanan.com'];

function AppContent() {
  const [view, setView] = useState<View>('home');
  const [activeMode, setActiveMode] = useState<TournamentMode>('league');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [userOwnedTeams, setUserOwnedTeams] = useState<{ mode: TournamentMode, team: Team }[]>([]);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showUserAuth, setShowUserAuth] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showTeamRegistration, setShowTeamRegistration] = useState(false);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  
  const tournament = useTournament(activeMode, isAdminAuthenticated);
  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      if (user && user.email) {
          const isAllowedAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
          setIsAdminAuthenticated(isAllowedAdmin);
          const owned = await getUserTeams(user.email);
          setUserOwnedTeams(owned);
      } else {
          setIsAdminAuthenticated(false);
          setUserOwnedTeams([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLoginSuccess = () => {
    setShowAdminLogin(false);
    setView('admin');
    addToast('Selamat datang Admin!', 'success');
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setView('home');
      setShowUserProfile(false);
      addToast('Berhasil keluar.', 'info');
    } catch (error) {
      addToast('Gagal keluar.', 'error');
    }
  };

  const handleSelectMode = (mode: TournamentMode | 'hall_of_fame' | 'news' | 'shop') => {
    if (mode === 'hall_of_fame') setView('hall_of_fame');
    else if (mode === 'news') setView('news');
    else if (mode === 'shop') setView('shop');
    else { setActiveMode(mode as TournamentMode); setView(mode as View); }
  };

  const handleSetView = (newView: View) => {
    if (['league', 'wakacl', 'two_leagues'].includes(newView)) setActiveMode(newView as TournamentMode);
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const showBanners = view !== 'admin' && view !== 'hall_of_fame' && !['privacy', 'about', 'terms'].includes(view);

  return (
    <div className="min-h-screen font-sans flex flex-col relative selection:bg-brand-vibrant selection:text-white overflow-x-hidden">
      <div className="fixed inset-0 bg-brand-primary z-[-1]">
         <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `linear-gradient(rgba(37, 99, 235, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.2) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-vibrant/20 blur-[140px] rounded-full"></div>
      </div>
      
      <Header 
        currentView={view} 
        setView={handleSetView} 
        isAdminAuthenticated={isAdminAuthenticated} 
        onAdminViewRequest={() => setView('admin')} 
        onLogout={handleLogout} 
        currentUser={currentUser} 
        onUserAuthRequest={() => setShowUserAuth(true)} 
        onUserLogout={handleLogout} 
        onShowProfile={() => setShowUserProfile(true)} 
        headerLogoUrl={tournament.headerLogoUrl} 
      />

      {showBanners && (
          <div className="w-full flex flex-col">
              <MarqueeBanner />
              <div className="container mx-auto px-4 pt-6">
                {tournament.banners && tournament.banners.length > 0 && <BannerCarousel banners={tournament.banners} />}
              </div>
          </div>
      )}

      {view !== 'admin' && <NavigationMenu currentView={view} setView={handleSetView} />}
      
      <main className="container mx-auto px-4 py-6 md:p-8 flex-grow relative z-20">
        <Suspense fallback={<div className="flex justify-center py-20"><Spinner size={40} /></div>}>
          {tournament.isLoading ? <DashboardSkeleton /> : (
            <>
              {view === 'home' && <HomeDashboard onSelectMode={handleSelectMode} teamCount={tournament.teams.length} partnerCount={tournament.partners.length} onRegisterTeam={() => setShowTeamRegistration(true)} isRegistrationOpen={tournament.isRegistrationOpen} userOwnedTeams={userOwnedTeams} allMatches={tournament.matches} news={tournament.news} />}
              {view === 'news' && <NewsPortal news={tournament.news || []} categories={tournament.newsCategories} />}
              {view === 'shop' && <StoreFront products={tournament.products || []} categories={tournament.shopCategories} />}
              {(view === 'privacy' || view === 'about' || view === 'terms') && <StaticPages type={view as any} onBack={() => setView('home')} />}
              {(['league', 'wakacl', 'two_leagues'] as View[]).includes(view) && (
                <PublicView groups={tournament.groups} matches={tournament.matches} knockoutStage={(view === 'wakacl' || view === 'two_leagues') ? tournament.knockoutStage : null} rules={tournament.rules} onSelectTeam={setViewingTeam} currentUser={currentUser} onAddMatchComment={tournament.addMatchComment} isAdmin={isAdminAuthenticated} onUpdateMatchScore={tournament.updateMatchScore} onUpdateKnockoutScore={tournament.updateKnockoutMatch} userOwnedTeamIds={userOwnedTeams.map(t => t.team.id)} />
              )}
              {view === 'hall_of_fame' && <HallOfFame history={tournament.history} currentStatus={tournament.status} mode={activeMode} onBack={() => setView('home')} />}
              {view === 'admin' && isAdminAuthenticated && (
                <AdminPanel 
                    {...tournament} 
                    mode={activeMode} 
                    setMode={setActiveMode} 
                    onUpdateNews={tournament.updateNews} 
                    updateProducts={tournament.updateProducts} 
                    updateNewsCategories={tournament.updateNewsCategories} 
                    updateShopCategories={tournament.updateShopCategories}
                    generateKnockoutBracket={tournament.generateKnockoutBracket}
                    initializeEmptyKnockoutStage={tournament.initializeEmptyKnockoutStage}
                    addKnockoutMatch={tournament.addKnockoutMatch}
                    deleteKnockoutMatch={tournament.deleteKnockoutMatch}
                    resetTournament={tournament.resetTournament}
                    setRegistrationOpen={tournament.setRegistrationOpen}
                    setTournamentStatus={tournament.setTournamentStatus}
                    updateHeaderLogo={tournament.updateHeaderLogo}
                />
              )}
            </>
          )}
        </Suspense>
      </main>
      
      <GlobalChat currentUser={currentUser} isAdmin={isAdminAuthenticated} onLoginRequest={() => setShowUserAuth(true)} />
      {showAdminLogin && <Login onLoginSuccess={handleAdminLoginSuccess} onClose={() => setShowAdminLogin(false)} />}
      {showUserAuth && <UserAuthModal onClose={() => setShowUserAuth(false)} onSuccess={() => setShowUserAuth(false)} />}
      {showUserProfile && currentUser && <UserProfileModal currentUser={currentUser} teams={tournament.teams} onClose={() => setShowUserProfile(false)} onLogout={handleLogout} />}
      {showTeamRegistration && currentUser && <TeamRegistrationModal currentUser={currentUser} onClose={() => setShowTeamRegistration(false)} />}
      {viewingTeam && <TeamProfileModal team={viewingTeam} matches={tournament.matches} onClose={() => setViewingTeam(null)} />}
      <Footer partners={tournament.partners} onAdminLogin={() => setShowAdminLogin(true)} setView={handleSetView} />
    </div>
  );
}

function App() { return ( <ToastProvider> <AppContent /> </ToastProvider> ) }
export default App;
