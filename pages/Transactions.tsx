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
  const bgCard = theme === 'dark' ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white border-slate-100';
  const bgMuted = theme === 'dark' ? 'bg-[#333333]' : 'bg-slate-50';

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className={`text-3xl font-bold mb-6 ${textColor}`}>Транзакції</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-grow space-y-4">
          <div className={`flex flex-col sm:flex-row gap-4 ${bgCard} border rounded-xl p-4`}>
            <div className="flex-grow">
              <label htmlFor="monthFilter" className={`block text-xs ${textMuted} mb-1`}>
                Фільтр за місяцем
              </label>
              <select
                id="monthFilter"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className={`w-full border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 ${theme === 'dark'
                  ? 'bg-[#333333] border-[#3a3a3a] text-white'
                  : 'bg-white border-slate-200 text-slate-900'
                  }`}
              >
                <option value="all">Всі місяці</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {new Date(month + '-01').toLocaleString('uk-UA', { year: 'numeric', month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-grow">
              <label htmlFor="sortByAmount" className={`block text-xs ${textMuted} mb-1`}>
                Сортувати за сумою
              </label>
              <select
                id="sortByAmount"
                value={sortByAmountDesc ? 'desc' : 'asc'}
                onChange={(e) => setSortByAmountDesc(e.target.value === 'desc')}
                className={`w-full border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 ${theme === 'dark'
                  ? 'bg-[#333333] border-[#3a3a3a] text-white'
                  : 'bg-white border-slate-200 text-slate-900'
                  }`}
              >
                <option value="desc">Від більшого до меншого</option>
                <option value="asc">Від меншого до більшого</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className={`text-center py-8 ${textMuted}`}>
              Немає транзакцій за вибраними фільтрами.
            </p >
          ) : (
            filtered.map((inc) => (
              <div
                key={inc.id}
                className={`${bgCard} border rounded-2xl p-4 flex items-center justify-between transition-all duration-300 cursor-pointer overflow-hidden ${theme === 'dark'
                  ? 'hover:bg-[#333333] hover:border-[#4a4a4a] hover:shadow-lg shadow-black/20'
                  : 'hover:shadow-md hover:bg-slate-50 hover:border-blue-200'
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
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-colors ${theme === 'dark'
                    ? 'bg-[#1f1f1f] text-blue-400'
                    : 'bg-blue-50 text-blue-600'
                    }`}>
                    {inc.currency === 'UAH' ? '₴' : inc.currency === 'USD' ? '$' : '€'}
                  </div>
                  <div>
                    <p className={`font-semibold md:text-lg ${textColor}`}>
                      {inc.description || 'Дохід'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className={`text-xs md:text-sm font-medium ${textMuted}`}>{inc.date}</p>
                      <span className={`w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`} />
                      <p className={`text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full ${theme === 'dark'
                        ? 'text-blue-400 bg-blue-900/30'
                        : 'text-blue-600 bg-blue-50'
                        }`}>
                        {inc.source === 'ai-scan' ? 'AI' : 'Вручну'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-bold text-lg md:text-xl ${textColor}`}>
                      +{inc.amount.toLocaleString()} <span className="text-sm font-medium opacity-70">{inc.currency}</span>
                    </p>
                    {inc.amountUah && (
                      <p className={`text-xs md:text-sm font-medium opacity-60 ${textColor}`}>
                        ≈ ₴ {inc.amountUah.toFixed(0)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div >

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
                className={`w-full border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 ${theme === 'dark'
                  ? 'bg-[#333333] border-[#3a3a3a] text-white'
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
                className={`w-full border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 ${theme === 'dark'
                  ? 'bg-[#333333] border-[#3a3a3a] text-white'
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
      </div >
    </div >
  );
};
