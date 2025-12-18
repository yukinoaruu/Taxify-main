import React, { useState } from 'react';
import { authService } from '../services/authService';
import { Loader2, CheckCircle, Smartphone, Calculator, FileText, Shield, ArrowRight, Zap, Bot, Brain, TrendingUp, Lock } from 'lucide-react';

interface LandingPageProps {
  onLoginSuccess: () => void;
  onNavigateToLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess, onNavigateToLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await authService.loginWithGoogle();
    setIsLoading(false);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-xl z-50 border-b border-slate-100/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20 text-sm sm:text-base">
                T
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Taxify AI</span>
            </div>
            <button 
              onClick={onNavigateToLogin || handleGoogleLogin}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-slate-50 rounded-lg"
            >
              Увійти
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-blue-100/50 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-blob"></div>
          <div className="absolute top-20 right-10 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-indigo-100/50 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-sky-100/50 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-slate-900/5 text-slate-700 text-[10px] sm:text-xs font-bold mb-6 sm:mb-8 border border-slate-900/10 hover:bg-slate-900/10 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            Оновлено під податковий кодекс 2026
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 sm:mb-8 leading-[1.1] px-2">
            Ваш ФОП тепер працює<br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
              на нейромережах
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-12 leading-relaxed max-w-2xl mx-auto px-4">
            Taxify AI — це фінансовий автопілот для вашого бізнесу. Миттєві звіти, автоматичний розрахунок податків та персональні консультації 24/7.
          </p>
          
          <div className="flex justify-center w-full px-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="group relative w-full sm:w-auto min-w-[280px] flex items-center justify-center gap-3 bg-slate-900 text-white font-semibold py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/30 hover:shadow-slate-900/40 active:scale-[0.98] overflow-hidden text-sm sm:text-base"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              {isLoading ? (
                <Loader2 className="animate-spin text-slate-400" size={20} />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              <span>Спробувати безкоштовно</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Features Grid */}
      <div className="bg-slate-50 py-12 sm:py-16 lg:py-24 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-sm sm:text-base text-blue-600 font-semibold tracking-wide uppercase mb-2">Можливості</h2>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 px-4">Більше ніж просто звіти</p>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-500 max-w-2xl mx-auto px-4">
              Використовуйте потужність нейромереж Gemini для повного контролю над вашим бізнесом.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard 
              icon={<Bot className="text-white" size={24} />}
              color="bg-violet-600"
              title="AI Податковий консультант"
              description="Задайте питання звичайною мовою: «Чи можу я купити ноутбук?», «Скільки податків я заплачу з 5000$?». Отримайте миттєву відповідь."
            />
            <FeatureCard 
              icon={<TrendingUp className="text-white" size={24} />}
              color="bg-pink-600"
              title="Прогнозування лімітів"
              description="AI аналізує динаміку ваших доходів і попереджає за 3 місяці, якщо ви ризикуєте перевищити ліміт групи."
            />
            <FeatureCard 
              icon={<Shield className="text-white" size={24} />}
              color="bg-emerald-600"
              title="Аудит ризиків"
              description="Система автоматично перевіряє кожну транзакцію на відповідність вашим КВЕДам, щоб уникнути штрафів податкової."
            />
            <FeatureCard 
              icon={<Smartphone className="text-white" size={24} />}
              color="bg-blue-600"
              title="Розумний скан документів"
              description="Gemini Vision розпізнає будь-які інвойси, акти та чеки. Просто сфотографуйте, а AI заповнить декларацію за вас."
            />
             <FeatureCard 
              icon={<Brain className="text-white" size={24} />}
              color="bg-amber-600"
              title="Генерація актів та рахунків"
              description="Потрібен акт виконаних робіт англійською? Taxify AI згенерує та сформує PDF за секунди."
            />
            <FeatureCard 
              icon={<FileText className="text-white" size={24} />}
              color="bg-indigo-600"
              title="Автоматична звітність"
              description="Книга доходів, Декларація ЄП та звіт ЄСВ генеруються автоматично на основі ваших даних. Без помилок."
            />
          </div>
        </div>
      </div>

      {/* Trust & Security Section */}
      <div className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 overflow-hidden relative text-center md:text-left">
             {/* Decorative circles */}
             <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-blue-500/20 rounded-full blur-3xl -mr-8 sm:-mr-12 md:-mr-16 -mt-8 sm:-mt-12 md:-mt-16"></div>
             <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-indigo-500/20 rounded-full blur-3xl -ml-8 sm:-ml-12 md:-ml-16 -mb-8 sm:-mb-12 md:-mb-16"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 sm:gap-10 md:gap-12">
               <div className="flex-1 w-full">
                 <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Ваші дані під надійним захистом</h2>
                 <div className="space-y-4">
                   <div className="flex gap-3 sm:gap-4">
                     <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                       <Lock className="text-emerald-400" size={20} />
                     </div>
                     <div>
                       <h3 className="text-white font-semibold text-base sm:text-lg">AES-256 Шифрування</h3>
                       <p className="text-slate-400 text-xs sm:text-sm">Всі дані шифруються за військовими стандартами перед збереженням у хмарі.</p>
                     </div>
                   </div>
                   <div className="flex gap-3 sm:gap-4">
                     <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                       <Shield className="text-blue-400" size={20} />
                     </div>
                     <div>
                       <h3 className="text-white font-semibold text-base sm:text-lg">Приватність перш за все</h3>
                       <p className="text-slate-400 text-xs sm:text-sm">Ми не передаємо ваші дані третім особам. AI аналізує дані анонімізовано.</p>
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="flex-1 w-full max-w-sm">
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 sm:p-6 rounded-xl sm:rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                       <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="space-y-3 font-mono text-xs sm:text-sm">
                      <div className="text-slate-400">$ encrypt_data --level=high</div>
                      <div className="text-emerald-400">{'>'} Дані зашифровано</div>
                      <div className="text-slate-400">$ sync_cloud --secure</div>
                      <div className="text-emerald-400">{'>'} Успішно збережено в захищеному сховищі</div>
                    </div>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="pb-12 sm:pb-16 lg:pb-24 pt-8 sm:pt-12 text-center px-4">
         <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Готові спробувати майбутнє бухгалтерії?</h2>
         <div className="flex justify-center">
            <button
                onClick={handleGoogleLogin}
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors text-sm sm:text-base"
                >
                Створити акаунт зараз <ArrowRight size={18} className="sm:w-5 sm:h-5" />
            </button>
         </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 text-slate-500 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-slate-300 rounded-md flex items-center justify-center text-white text-xs font-bold">T</div>
             <span className="text-slate-700 font-bold text-sm sm:text-base">Taxify AI</span>
          </div>
          <div className="text-xs sm:text-sm">
            © 2026 Taxify AI
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, color, title, description }: any) => (
  <div className="group bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className={`mb-4 sm:mb-6 w-10 h-10 sm:w-12 sm:h-12 ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-xs sm:text-sm">{description}</p>
  </div>
);