
import React, { useState, useEffect, Suspense, lazy } from 'react';
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
import type { View, Team, TournamentMode } from './types';
import { Login } from './components/admin/Login';
import { UserAuthModal } from './components/auth/UserAuthModal';
import { ToastProvider } from './components/shared/Toast';
import { TeamProfileModal } from './components/public/TeamProfileModal';
import { UserProfileModal } from './components/public/UserProfileModal';
import { TeamRegistrationModal } from './components/public/TeamRegistrationModal';
import { onAuthChange, signOutUser, getGlobalStats, getUserTeams } from './services/firebaseService';
import { useToast } from './components/shared/Toast';
import { Spinner } from './components/shared/Spinner';
import { DashboardSkeleton } from './components/shared/Skeleton';
import { Footer } from './components/Footer';
import type { User } from 'firebase/auth';
import { GlobalChat } from './components/public/GlobalChat';
import { Button } from './components/shared/Button';
import { ADMIN_EMAILS } from './constants';

const VIEW_PATHS: Record<View, string> = {
    home: '/',
    news: '/berita',
    shop: '/shop',
    league: '/liga',
    wakacl: '/championship',
    two_leagues: '/wilayah',
    hall_of_fame: '/legends',
    admin: '/admin',
    privacy: '/privacy',
    about: '/about',
    terms: '/terms'
};

function AppContent() {
  const [view, setView] = useState<View>('home');
  const [activeMode, setActiveMode] = useState<TournamentMode>('league');
  const [deepLinkNewsId, setDeepLinkNewsId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [userOwnedTeams, setUserOwnedTeams] = useState<{ mode: TournamentMode, team: Team }[]>([]);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showUserAuth, setShowUserAuth] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showTeamRegistration, setShowTeamRegistration] = useState(false);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  const [globalStats, setGlobalStats] = useState({ teamCount: 0, partnerCount: 0 });
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const tournament = useTournament(activeMode, isAdminAuthenticated);
  const { addToast } = useToast();

  // --- SIMPLE ROUTING LOGIC ---
  // Only sync on initial load or browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
        let path = window.location.pathname;
        // Remove trailing slash for consistency
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        // Check for News Detail
        if (path.startsWith('/berita/') && path.split('/').length > 2) {
            const id = path.split('/')[2];
            setView('news');
            setDeepLinkNewsId(id);
            return;
        }

        // Find matching view
        const foundView = (Object.keys(VIEW_PATHS) as View[]).find(v => VIEW_PATHS[v] === path);
        if (foundView) {
            setView(foundView);
            if (['league', 'wakacl', 'two_leagues'].includes(foundView)) {
                setActiveMode(foundView as TournamentMode);
            }
        } else {
            setView('home');
        }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Run once on mount
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSetView = (newView: View, subId?: string) => {
    // 1. Update State FIRST (Immediate UI feedback)
    setView(newView);
    if (['league', 'wakacl', 'two_leagues'].includes(newView)) {
        setActiveMode(newView as TournamentMode);
    }
    setDeepLinkNewsId(subId || null);
    
    // 2. Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 3. Update URL explicitly (Cosmetic only, doesn't trigger router logic)
    let path = VIEW_PATHS[newView] || '/';
    if (newView === 'news' && subId) {
        path = `/berita/${subId}`;
    }
    window.history.pushState({}, '', path);
  };

  // --- AUTH SYNC ---
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

  useEffect(() => {
    if (view === 'home') {
        getGlobalStats().then(setGlobalStats);
    }
  }, [view, tournament.isLoading]);

  const handleLogout = async () => {
    await signOutUser();
    handleSetView('home');
    setShowUserProfile(false);
    addToast('Berhasil keluar.', 'info');
  };

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
        onAdminViewRequest={() => handleSetView('admin')} 
        onLogout={handleLogout} 
        currentUser={currentUser} 
        onUserAuthRequest={() => setShowUserAuth(true)} 
        onUserLogout={handleLogout} 
        onShowProfile={() => setShowUserProfile(true)} 
        headerLogoUrl={tournament.headerLogoUrl} 
      />

      {showBanners && (
          <div className="w-full flex flex-col z-10">
              <MarqueeBanner messages={tournament.marqueeMessages} />
              <div className="container mx-auto px-4 pt-6">
                {tournament.banners && tournament.banners.length > 0 && <BannerCarousel banners={tournament.banners} />}
              </div>
          </div>
      )}

      {view !== 'admin' && (
          <NavigationMenu 
              currentView={view} 
              setView={handleSetView} 
              visibleModes={tournament.visibleModes}
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
              isChatOpen={isChatOpen}
          />
      )}
      
      <main className={`container mx-auto px-4 py-6 md:p-8 flex-grow relative z-20 ${view !== 'admin' ? 'pb-32' : ''}`}>
        <Suspense fallback={<div className="flex justify-center py-20"><Spinner size={40} /></div>}>
          {tournament.isLoading ? <DashboardSkeleton /> : (
            <>
              {view === 'home' && (
                <HomeDashboard 
                    onSelectMode={(m) => handleSetView(m as View)} 
                    teamCount={globalStats.teamCount || tournament.teams.length} 
                    partnerCount={globalStats.partnerCount || tournament.partners.length} 
                    onRegisterTeam={() => currentUser ? setShowTeamRegistration(true) : setShowUserAuth(true)} 
                    isRegistrationOpen={tournament.isRegistrationOpen} 
                    userOwnedTeams={userOwnedTeams} 
                    allMatches={tournament.matches} 
                    news={tournament.news} 
                    visibleModes={tournament.visibleModes}
                />
              )}
              {view === 'news' && (
                <NewsPortal 
                    news={tournament.news || []} 
                    categories={tournament.newsCategories} 
                    deepLinkNewsId={deepLinkNewsId}
                    onNavigateToArticle={(id) => handleSetView('news', id)}
                    onBackToPortal={() => handleSetView('news')}
                />
              )}
              {view === 'shop' && <StoreFront products={tournament.products || []} categories={tournament.shopCategories} />}
              {(view === 'privacy' || view === 'about' || view === 'terms') && <StaticPages type={view as any} onBack={() => handleSetView('home')} />}
              {(['league', 'wakacl', 'two_leagues'] as View[]).includes(view) && (
                <PublicView 
                    mode={activeMode}
                    groups={tournament.groups} 
                    matches={tournament.matches} 
                    knockoutStage={(view === 'wakacl' || view === 'two_leagues') ? tournament.knockoutStage : null} 
                    rules={tournament.rules} 
                    history={tournament.history}
                    onSelectTeam={setViewingTeam} 
                    currentUser={currentUser} 
                    onAddMatchComment={tournament.addMatchComment} 
                    isAdmin={isAdminAuthenticated} 
                    onUpdateMatchScore={tournament.updateMatchScore} 
                    onUpdateKnockoutScore={tournament.updateKnockoutMatch} 
                    userOwnedTeamIds={userOwnedTeams.map(t => t.team.id)} 
                    clubStats={tournament.clubStats} 
                />
              )}
              {view === 'hall_of_fame' && <HallOfFame history={tournament.history} currentStatus={tournament.status} mode={activeMode} onBack={() => handleSetView('home')} />}
              {view === 'admin' && (
                isAdminAuthenticated ? (
                    <AdminPanel 
                        {...tournament} 
                        mode={activeMode} 
                        setMode={setActiveMode} 
                        onUpdateNews={tournament.updateNews} 
                        updateProducts={tournament.updateProducts} 
                        updateNewsCategories={tournament.updateNewsCategories} 
                        updateShopCategories={tournament.updateShopCategories}
                        updateMarqueeMessages={tournament.updateMarqueeMessages}
                        generateKnockoutBracket={tournament.generateKnockoutBracket}
                        initializeEmptyKnockoutStage={tournament.initializeEmptyKnockoutStage}
                        addKnockoutMatch={tournament.addKnockoutMatch}
                        deleteKnockoutMatch={tournament.deleteKnockoutMatch}
                        resetTournament={tournament.resetTournament}
                        archiveSeason={tournament.archiveSeason}
                        setRegistrationOpen={tournament.setRegistrationOpen}
                        setTournamentStatus={tournament.setTournamentStatus}
                        updateHeaderLogo={tournament.updateHeaderLogo}
                        updateVisibleModes={tournament.updateVisibleModes}
                        updateMatch={tournament.updateMatch}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl mb-4">
                            <h2 className="text-2xl font-black text-red-500 uppercase italic">Akses Ditolak</h2>
                            <p className="text-brand-light text-sm mt-2">Akun Anda ({currentUser?.email}) tidak memiliki izin Admin.</p>
                        </div>
                        <Button onClick={() => handleSetView('home')}>Kembali ke Home</Button>
                    </div>
                )
              )}
            </>
          )}
        </Suspense>
      </main>
      
      <GlobalChat 
          currentUser={currentUser} 
          isAdmin={isAdminAuthenticated} 
          onLoginRequest={() => setShowUserAuth(true)}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
      />
      
      {showAdminLogin && <Login onLoginSuccess={() => { handleSetView('admin'); setShowAdminLogin(false); }} onClose={() => setShowAdminLogin(false)} />}
      {showUserAuth && <UserAuthModal onClose={() => setShowUserAuth(false)} onSuccess={() => setShowUserAuth(false)} />}
      {showUserProfile && currentUser && (
        <UserProfileModal 
            currentUser={currentUser} 
            teams={tournament.teams} 
            onClose={() => setShowUserProfile(false)} 
            onLogout={handleLogout} 
            isAdmin={isAdminAuthenticated} 
            onAdminAccess={() => handleSetView('admin')} 
        />
      )}
      {showTeamRegistration && currentUser && <TeamRegistrationModal currentUser={currentUser} onClose={() => setShowTeamRegistration(false)} userOwnedTeams={userOwnedTeams} />}
      {viewingTeam && <TeamProfileModal team={viewingTeam} matches={tournament.matches} onClose={() => setViewingTeam(null)} />}
      
      {/* Footer ensures z-index > 20 to be clickable over main, but < 50 (nav) */}
      <Footer partners={tournament.partners} onAdminLogin={() => setShowAdminLogin(true)} setView={handleSetView} />
    </div>
  );
}

function App() { return ( <ToastProvider> <AppContent /> </ToastProvider> ) }
export default App;
