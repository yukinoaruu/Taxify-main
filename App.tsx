import React, { useState, useEffect } from 'react';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { Transactions } from './pages/Transactions';
import { TransactionDetails } from './pages/TransactionDetails';
import { dbService } from './services/dbService';
import { authService } from './services/authService';
import { Income, UserProfile, ViewState } from './types';
import { LayoutGrid, FileText, Settings, LogOut, Bell, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Проверяем редирект после авторизации
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (redirect) {
      // Если есть редирект, значит мы вернулись после авторизации
      // Очищаем URL параметры
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Используем onAuthChange для правильной проверки состояния авторизации
    const unsubscribe = authService.onAuthChange(async (profile) => {
      if (profile) {
        setProfile(profile);
        if (!profile.isOnboarded) {
          setCurrentView('onboarding');
        } else {
          setCurrentView('dashboard');
        }
      } else {
        setProfile(null);
        setCurrentView('login');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem('taxify_theme') as 'light' | 'dark' | null;
    const initial = saved || 'light';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    window.localStorage.setItem('taxify_theme', next);
  };

  const handleLoginSuccess = async () => {
    const p = await dbService.getProfile();
    setProfile(p);
    if (!p.isOnboarded) {
      setCurrentView('onboarding');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleOnboardingComplete = async () => {
    const p = await dbService.getProfile();
    setProfile(p);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    authService.logout();
  };

  const handleOpenTransactionDetails = (income: Income) => {
    setSelectedIncome(income);
    setCurrentView('transactionDetails');
  };

  if (currentView === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentView === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (!profile) return null;

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-72 fixed h-full z-10 border-r ${theme === 'dark' ? 'bg-black border-[#1a1a1a]' : 'bg-white border-slate-200'}`}>
        <div className="p-6">
          <div className={`flex items-center gap-3 mb-10 ${theme === 'dark' ? 'text-white' : 'text-blue-700'}`}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">T</div>
            <span className="text-2xl font-bold tracking-tight">Taxify AI</span>
          </div>

          <nav className="space-y-2">
            <NavItem
              icon={<LayoutGrid size={22} />}
              label="Головна"
              active={currentView === 'dashboard'}
              onClick={() => setCurrentView('dashboard')}
              theme={theme}
            />
            <NavItem
              icon={<FileText size={22} />}
              label="Транзакції"
              active={currentView === 'transactions'}
              onClick={() => setCurrentView('transactions')}
              theme={theme}
            />
            <NavItem
              icon={<FileText size={22} />}
              label="Звіти"
              active={currentView === 'reports'}
              onClick={() => setCurrentView('reports')}
              theme={theme}
            />
          </nav>
        </div>

        <div className={`mt-auto p-6 border-t ${theme === 'dark' ? 'border-[#1a1a1a]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3 mb-4">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt="User" className="w-12 h-12 rounded-full" />
            ) : (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-[#1a1a1a] text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                <Settings size={22} />
              </div>
            )}
            <div className="overflow-hidden">
              <p className={`text-base font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{profile.name}</p>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Група {profile.group}</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              className={`p-2.5 rounded-lg transition-colors ${theme === 'dark'
                ? 'text-slate-300 hover:bg-[#1a1a1a] hover:text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>
            <button
              className={`p-2.5 rounded-lg transition-colors ${theme === 'dark'
                ? 'text-slate-300 hover:bg-[#1a1a1a] hover:text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 text-sm px-3 py-2 transition-colors rounded-lg ${theme === 'dark'
              ? 'text-red-400 hover:text-red-300 hover:bg-[#1a1a1a]'
              : 'text-red-600 hover:text-red-700 hover:bg-red-50'
              }`}
          >
            <LogOut size={18} /> Вийти
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-20 px-4 py-3 flex justify-between items-center border-b ${theme === 'dark'
        ? 'bg-black border-[#1a1a1a]'
        : 'bg-white border-slate-200'
        }`}>
        <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Taxify AI</span>
        <div className="flex items-center gap-2">
          <button
            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
              ? 'text-slate-300 hover:bg-[#1a1a1a] hover:text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
          <button
            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
              ? 'text-slate-300 hover:bg-[#1a1a1a] hover:text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
              ? 'text-slate-300 hover:bg-[#1a1a1a] hover:text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
            onClick={() => setCurrentView('settings')}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 pt-16 md:pt-0">
        {currentView === 'dashboard' && <Dashboard profile={profile} theme={theme} />}
        {currentView === 'transactions' && (
          <Transactions profile={profile} onOpenDetails={handleOpenTransactionDetails} theme={theme} />
        )}
        {currentView === 'reports' && <Reports profile={profile} theme={theme} />}
        {currentView === 'settings' && (
          <div className={`p-4 ${theme === 'dark' ? 'text-white' : ''}`}>
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Налаштування</h2>
            <button
              onClick={handleLogout}
              className={`mt-4 px-4 py-2 rounded-lg w-full md:w-auto transition-colors ${theme === 'dark'
                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
            >
              Вийти з акаунту
            </button>
          </div>
        )}
        {currentView === 'transactionDetails' && selectedIncome && (
          <TransactionDetails
            income={selectedIncome}
            profile={profile}
            onBack={() => setCurrentView('transactions')}
            theme={theme}
            onUpdate={(updated) => {
              setSelectedIncome(updated);
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-20 flex justify-around p-2 pb-safe border-t ${theme === 'dark'
        ? 'bg-black border-[#1a1a1a]'
        : 'bg-white border-slate-200'
        }`}>
        <MobileNavItem icon={<LayoutGrid size={24} />} label="Головна" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} theme={theme} />
        <MobileNavItem icon={<FileText size={24} />} label="Транзакції" active={currentView === 'transactions'} onClick={() => setCurrentView('transactions')} theme={theme} />
        <MobileNavItem icon={<FileText size={24} />} label="Звіти" active={currentView === 'reports'} onClick={() => setCurrentView('reports')} theme={theme} />
      </div>
    </div>
  );
};

// Nav Components
const NavItem = ({ icon, label, active, onClick, theme }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${active
      ? theme === 'dark'
        ? 'bg-[#1a1a1a] text-white'
        : 'bg-blue-50 text-blue-700'
      : theme === 'dark'
        ? 'text-slate-300 hover:bg-[#1a1a1a] hover:text-white'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
  >
    {icon}
    {label}
  </button>
);

const MobileNavItem = ({ icon, label, active, onClick, theme }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-lg ${active
      ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
      : theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
      }`}
  >
    {icon}
    <span className="text-[10px] font-medium mt-1">{label}</span>
  </button>
);

export default App;