import React, { useState } from 'react';
import { authService } from '../services/authService';
import { Loader2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Используем стандартный popup OAuth (работает и в Telegram Mini App)
      await authService.loginWithGoogle();
      onLoginSuccess();
    } catch (e) {
      setError("Не вдалося увійти через Google. Спробуйте ще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Используем стандартный popup OAuth (работает и в Telegram Mini App)
      await authService.loginWithApple();
      onLoginSuccess();
    } catch (e) {
      setError("Не вдалося увійти через Apple. Спробуйте ще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setError(null);
      setIsLoading(true);
      if (isRegister) {
        await authService.registerWithEmail(email, password);
      } else {
        await authService.loginWithEmail(email, password);
      }
      onLoginSuccess();
    } catch (e) {
      setError("Помилка email/паролю. Перевірте дані або спробуйте інший спосіб входу.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 shadow-lg shadow-blue-600/30">
          T
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Вхід у Taxify AI</h1>
        <p className="text-slate-500 mb-6">Ваш розумний податковий асистент для ФОП</p>

        {error && (
          <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-left">
            {error}
          </div>
        )}

        {/* Социальные провайдеры */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="animate-spin text-slate-500" size={20} />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>Продовжити з Google</span>
          </button>

          <button
            onClick={handleAppleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-black text-white font-medium py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="animate-spin text-white" size={20} />
            ) : (
              <span className="text-xl"></span>
            )}
            <span>Продовжити з Apple</span>
          </button>
        </div>

        {/* Переключатель на email/пароль */}
        <button
          type="button"
          onClick={() => setIsEmailMode((prev) => !prev)}
          className="text-xs text-blue-600 hover:text-blue-700 underline mb-4"
        >
          {isEmailMode ? "Сховати вхід по email" : "Увійти або зареєструватись по email"}
        </button>

        {isEmailMode && (
          <form onSubmit={handleEmailSubmit} className="space-y-3 text-left">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Мінімум 6 символів"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin" size={16} />}
              <span>{isRegister ? "Зареєструватися" : "Увійти"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRegister((prev) => !prev)}
              className="w-full text-xs text-slate-500 hover:text-slate-700 mt-1"
            >
              {isRegister ? "Вже є акаунт? Увійти" : "Немає акаунту? Зареєструватися"}
            </button>
          </form>
        )}

        <p className="text-xs text-slate-400 mt-6">
          Продовжуючи, ви погоджуєтесь з Умовами використання.
        </p>
      </div>
    </div>
  );
};