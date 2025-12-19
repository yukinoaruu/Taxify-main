import React, { useState, useEffect } from 'react';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { Transactions } from './pages/Transactions';
import { TransactionDetails } from './pages/TransactionDetails';
import { TaxAdvisor } from './pages/TaxAdvisor';
import { dbService } from './services/dbService';
import { authService } from './services/authService';
import { Income, UserProfile, ViewState, Chat, ChatMessage } from './types';
import { LayoutGrid, FileText, Settings, LogOut, Bell, Sun, Moon, MessageCircle, BarChart3, Sparkles, Plus } from 'lucide-react';

const APP_CHATS_KEY = 'taxify_chats';
const APP_ACTIVE_CHAT_KEY = 'taxify_active_chat_id';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

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
        setCurrentView('landing');
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

  useEffect(() => {
    const savedChats = localStorage.getItem(APP_CHATS_KEY);
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setChats(parsed);
      } catch (e) {
        console.error('Failed to parse chats', e);
      }
    }

    const savedActiveId = localStorage.getItem(APP_ACTIVE_CHAT_KEY);
    if (savedActiveId) {
      setActiveChatId(savedActiveId);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(APP_CHATS_KEY, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem(APP_ACTIVE_CHAT_KEY, activeChatId);
    }
  }, [activeChatId]);

  const createNewChat = (initialMessage?: string) => {
    const newChat: Chat = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      title: initialMessage ? (initialMessage.slice(0, 30) + (initialMessage.length > 30 ? '...' : '')) : 'Новий чат',
      messages: [],
      timestamp: Date.now(),
    };

    // Default system message
    if (profile) {
      const systemMessage: ChatMessage = {
        id: 'system-' + Date.now(),
        role: 'assistant',
        content: `Вітаю! Я AI податковий консультант Taxify. Я допоможу вам з питаннями про ФОП в Україні на 2026 рік.\n\nВи зареєстровані як ${profile.group} група ФОП зі ставкою ${(profile.taxRate * 100).toFixed(0)}%.\n\nЗадайте мені будь-яке питання про податки, звітність або ліміти!`,
        timestamp: Date.now(),
      };
      newChat.messages.push(systemMessage);
    }

    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    return newChat.id;
  };

  const updateChatMessages = (chatId: string, messages: ChatMessage[]) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        // Update title based on first user message if title is still "Новий чат"
        let newTitle = chat.title;
        if (chat.title === 'Новий чат' || chat.title === '') {
          const firstUserMsg = messages.find(m => m.role === 'user');
          if (firstUserMsg) {
            newTitle = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
          }
        }
        return { ...chat, messages, title: newTitle };
      }
      return chat;
    }));
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };

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

  const handleLandingToLogin = () => {
    setCurrentView('login');
  };

  if (currentView === 'landing') {
    return <LandingPage onLoginSuccess={handleLoginSuccess} onNavigateToLogin={handleLandingToLogin} />;
  }

  if (currentView === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentView === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (!profile) return null;

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-[#1f1f1f] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-72 fixed h-full z-10 border-r ${theme === 'dark' ? 'bg-[#1f1f1f] border-[#3a3a3a]' : 'bg-white border-slate-200'}`}>
        <div className="p-6">
          <div className={`flex items-center gap-3 mb-10 ${theme === 'dark' ? 'text-white' : 'text-blue-700'}`}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">T</div>
            <span className="text-2xl font-bold tracking-tight">Taxify AI</span>
          </div>

          <nav className="space-y-2">
            <NavItem
              icon={<LayoutGrid size={22} />}
              label="Огляд"
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
              icon={<BarChart3 size={22} />}
              label="Звіти"
              active={currentView === 'reports'}
              onClick={() => setCurrentView('reports')}
              theme={theme}
            />
            <NavItem
              icon={<Sparkles size={22} />}
              label="AI асистент"
              active={currentView === 'taxAdvisor'}
              onClick={() => setCurrentView('taxAdvisor')}
              theme={theme}
            />
          </nav>
        </div>

        <div className={`mt-auto p-6 flex flex-col gap-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
          <p className="text-xs px-2 truncate">Taxify AI v1.2</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-20 px-4 py-3 flex justify-between items-center border-b ${theme === 'dark'
        ? 'bg-[#1f1f1f] border-[#3a3a3a]'
        : 'bg-white border-slate-200'
        }`}>
        <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Taxify AI</span>
        <div className="flex items-center gap-2">
          <button
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            className={`p-3 min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200 active:scale-95 ${theme === 'dark'
              ? 'text-slate-300 hover:bg-[#2a2a2a] hover:text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
          <button
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            className={`p-3 min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200 active:scale-95 ${theme === 'dark'
              ? 'text-slate-300 hover:bg-[#2a2a2a] hover:text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            className={`p-3 min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200 active:scale-95 ${theme === 'dark'
              ? 'text-slate-300 hover:bg-[#2a2a2a] hover:text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
            onClick={() => setCurrentView('settings')}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Desktop Top Header */}
      <header className={`hidden md:flex fixed top-0 right-0 left-72 z-30 h-16 items-center justify-between px-8 border-b ${theme === 'dark' ? 'bg-[#1f1f1f] border-[#3a3a3a]' : 'bg-white border-slate-200'}`}>
        <div>{/* Space for page title if needed */}</div>
        <div className="flex items-center gap-4">
          <button
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            className={`p-2 rounded-lg transition-all duration-200 active:scale-95 ${theme === 'dark' ? 'text-slate-300 hover:bg-[#2a2a2a]' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Bell size={20} />
          </button>
          <button
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            className={`p-2 rounded-lg transition-all duration-200 active:scale-95 ${theme === 'dark' ? 'text-slate-300 hover:bg-[#2a2a2a]' : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1 rounded-full pl-5 pr-2 transition-all hover:bg-slate-100 dark:hover:bg-[#2a2a2a]"
            >
              <div className="text-right">
                <p className={`text-sm font-semibold leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{profile.name}</p>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Група {profile.group}</p>
              </div>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border-2 ${theme === 'dark' ? 'border-[#3a3a3a] bg-[#2a2a2a] text-slate-300' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Settings size={18} />
                )}
              </div>
            </button>

            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className={`absolute right-0 mt-2 w-48 py-2 rounded-xl shadow-xl z-50 border ${theme === 'dark' ? 'bg-[#2a2a2a] border-[#3a3a3a] shadow-black/40' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
                  <button
                    onClick={() => {
                      setCurrentView('settings');
                      setIsProfileOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-[#333333] hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <Settings size={16} /> Налаштування
                  </button>
                  <div className={`my-1 border-t ${theme === 'dark' ? 'border-[#3a3a3a]' : 'border-slate-100'}`} />
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}
                  >
                    <LogOut size={16} /> Вийти
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 pt-16 md:pt-16 pb-24 md:pb-0">
        {currentView === 'dashboard' && <Dashboard profile={profile} theme={theme} />}
        {currentView === 'transactions' && (
          <Transactions profile={profile} onOpenDetails={handleOpenTransactionDetails} theme={theme} />
        )}
        {currentView === 'reports' && <Reports profile={profile} theme={theme} />}
        {currentView === 'taxAdvisor' && (
          <TaxAdvisor
            profile={profile}
            theme={theme}
            chats={chats}
            activeChatId={activeChatId}
            onSetActiveChat={setActiveChatId}
            onUpdateMessages={updateChatMessages}
            onCreateChat={createNewChat}
            onDeleteChat={deleteChat}
          />
        )}
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
        ? 'bg-[#1f1f1f] border-[#3a3a3a]'
        : 'bg-white border-slate-200'
        }`}>
        <MobileNavItem icon={<LayoutGrid size={24} />} label="Огляд" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} theme={theme} />
        <MobileNavItem icon={<FileText size={24} />} label="Транзакції" active={currentView === 'transactions'} onClick={() => setCurrentView('transactions')} theme={theme} />
        <MobileNavItem icon={<BarChart3 size={24} />} label="Звіти" active={currentView === 'reports'} onClick={() => setCurrentView('reports')} theme={theme} />
        <MobileNavItem icon={<Sparkles size={24} />} label="AI" active={currentView === 'taxAdvisor'} onClick={() => setCurrentView('taxAdvisor')} theme={theme} />
      </div>
    </div>
  );
};

// Nav Components
const NavItem = ({ icon, label, active, onClick, theme }: any) => (
  <button
    onClick={onClick}
    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    className={`w-full flex items-center gap-3 px-5 py-4 min-h-[52px] rounded-xl text-base font-medium transition-all duration-200 ${active
      ? theme === 'dark'
        ? 'bg-[#2a2a2a] text-blue-400 font-bold border border-[#3a3a3a]'
        : 'bg-blue-50 text-blue-700 font-bold border border-blue-100'
      : theme === 'dark'
        ? 'text-slate-400 hover:bg-[#2a2a2a] hover:text-white active:scale-[0.98]'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]'
      }`}
  >
    {icon}
    {label}
  </button>
);

const MobileNavItem = ({ icon, label, active, onClick, theme }: any) => (
  <button
    onClick={onClick}
    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    className={`flex flex-col items-center justify-center p-3 min-h-[56px] min-w-[64px] rounded-lg transition-all duration-200 active:scale-95 ${active
      ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
      : theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
      }`}
  >
    {icon}
    <span className="text-[10px] font-medium mt-1">{label}</span>
  </button>
);

export default App;