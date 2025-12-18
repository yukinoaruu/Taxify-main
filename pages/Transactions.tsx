import React, { useEffect, useState } from 'react';
import { Income, UserProfile } from '../types';
import { dbService } from '../services/dbService';

interface TransactionsProps {
  profile: UserProfile;
  onOpenDetails: (income: Income) => void;
  theme: 'light' | 'dark';
}

/**
 * Сторінка зі списком транзакцій та фільтрами.
 */
export const Transactions: React.FC<TransactionsProps> = ({ profile, onOpenDetails, theme }) => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [sortByAmountDesc, setSortByAmountDesc] = useState<boolean>(true);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [longPressId, setLongPressId] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null);
  const [hasLongPressed, setHasLongPressed] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const data = await dbService.getIncomes();
      setIncomes(data);
    };
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Видалити цю транзакцію?')) return;
    await dbService.deleteIncome(id);
    const data = await dbService.getIncomes();
    setIncomes(data);
  };

  const filtered = incomes
    .filter((inc) => {
      if (monthFilter !== 'all') {
        const date = new Date(inc.date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (monthKey !== monthFilter) return false;
      }
      if (fromDate && inc.date < fromDate) return false;
      if (toDate && inc.date > toDate) return false;
      return true;
    })
    .sort((a, b) => (sortByAmountDesc ? b.amount - a.amount : a.amount - b.amount));

  const monthOptions = Array.from(
    new Set(
      incomes.map((inc) => {
        const d = new Date(inc.date);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      })
    )
  ).sort();

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textMuted = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const bgCard = theme === 'dark' ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-white border-slate-100';
  const bgMuted = theme === 'dark' ? 'bg-[#111111]' : 'bg-slate-50';

  return (
    <div className={`p-6 md:p-10 space-y-8 pb-24 ${theme === 'dark' ? 'bg-black' : 'bg-slate-50'}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${textColor}`}>Транзакції</h1>
          <p className={`${textMuted} text-sm`}>
            Усі доходи ФОП для профілю {profile.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            className={`border rounded-lg px-3 py-2 text-sm ${theme === 'dark'
                ? 'bg-[#0a0a0a] border-[#1a1a1a] text-white'
                : 'bg-white border-slate-200 text-slate-900'
              }`}
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">Всі місяці</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            className={`border rounded-lg px-3 py-2 text-sm transition-colors ${theme === 'dark'
                ? 'bg-[#0a0a0a] border-[#1a1a1a] text-white hover:bg-[#1a1a1a]'
                : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
              }`}
            onClick={() => setSortByAmountDesc((prev) => !prev)}
          >
            Сума: {sortByAmountDesc ? 'від більшої' : 'від меншої'}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 grid grid-cols-1 gap-3">
          {filtered.length === 0 ? (
            <p className={`${textMuted} text-sm text-center py-8`}>
              Транзакцій за обраними фільтрами немає.
            </p>
          ) : (
            filtered.map((inc) => (
              <div
                key={inc.id}
                className={`${bgCard} border rounded-xl p-4 flex items-center justify-between transition cursor-pointer overflow-hidden ${theme === 'dark'
                    ? 'hover:bg-slate-700'
                    : 'hover:shadow-sm hover:bg-slate-50'
                  }`}
                onClick={() => {
                  if (hasLongPressed) return;
                  onOpenDetails(inc);
                }}
                onMouseDown={() => {
                  setHasLongPressed(false);
                  const timer = window.setTimeout(() => {
                    setHasLongPressed(true);
                    handleDelete(inc.id);
                  }, 600);
                  setLongPressId(inc.id);
                  setLongPressTimer(timer);
                }}
                onMouseUp={() => {
                  if (longPressTimer) {
                    window.clearTimeout(longPressTimer);
                    setLongPressTimer(null);
                    setLongPressId(null);
                  }
                }}
                onMouseLeave={() => {
                  if (longPressTimer) {
                    window.clearTimeout(longPressTimer);
                    setLongPressTimer(null);
                    setLongPressId(null);
                  }
                }}
                onTouchStart={(e) => {
                  setSwipeStartX(e.touches[0].clientX);
                  setHasLongPressed(false);
                  const timer = window.setTimeout(() => {
                    setHasLongPressed(true);
                    handleDelete(inc.id);
                  }, 600);
                  setLongPressId(inc.id);
                  setLongPressTimer(timer);
                }}
                onTouchMove={(e) => {
                  if (swipeStartX === null) return;
                  const diff = e.touches[0].clientX - swipeStartX;
                  if (diff < -80) {
                    setSwipeStartX(null);
                    handleDelete(inc.id);
                  }
                }}
                onTouchEnd={() => {
                  setSwipeStartX(null);
                  if (longPressTimer) {
                    window.clearTimeout(longPressTimer);
                    setLongPressTimer(null);
                    setLongPressId(null);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${theme === 'dark'
                      ? 'bg-blue-900/30 text-blue-400'
                      : 'bg-blue-50 text-blue-600'
                    }`}>
                    {inc.currency === 'UAH' ? '₴' : inc.currency === 'USD' ? '$' : '€'}
                  </div>
                  <div>
                    <p className={`font-medium ${textColor}`}>
                      {inc.description || 'Дохід'}
                    </p>
                    <p className={`text-xs ${textMuted}`}>{inc.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-bold ${textColor}`}>
                      +{inc.amount.toLocaleString()} {inc.currency}
                    </p>
                    {inc.amountUah && (
                      <p className={`text-xs ${textMuted}`}>
                        ≈ ₴ {inc.amountUah.toFixed(2)}
                      </p>
                    )}
                    <p className={`text-xs px-2 py-0.5 rounded-full inline-block mt-0.5 ${theme === 'dark'
                        ? 'text-blue-400 bg-blue-900/30'
                        : 'text-blue-600 bg-blue-50'
                      }`}>
                      {inc.source === 'ai-scan' ? 'AI' : 'Вручну'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={`w-full md:w-72 ${bgCard} border rounded-xl p-4 space-y-3`}>
          <p className={`text-xs font-semibold ${textMuted} uppercase tracking-wide`}>
            Діапазон дат
          </p>
          <div className="space-y-2">
            <div>
              <label className={`block text-xs ${textMuted} mb-1`}>Від</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={`w-full border rounded-lg px-2 py-1.5 text-sm ${theme === 'dark'
                    ? 'bg-[#111111] border-[#1a1a1a] text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                  }`}
              />
            </div>
            <div>
              <label className={`block text-xs ${textMuted} mb-1`}>До</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={`w-full border rounded-lg px-2 py-1.5 text-sm ${theme === 'dark'
                    ? 'bg-[#111111] border-[#1a1a1a] text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                  }`}
              />
            </div>
          </div>
          <button
            className={`w-full text-xs mt-2 transition-colors ${theme === 'dark'
                ? 'text-slate-400 hover:text-slate-300'
                : 'text-slate-500 hover:text-slate-700'
              }`}
            onClick={() => {
              setFromDate('');
              setToDate('');
              setMonthFilter('all');
            }}
          >
            Скинути фільтри
          </button>
        </div>
      </div>
    </div>
  );
};

