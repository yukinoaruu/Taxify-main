import React, { useEffect, useState } from 'react';
import { UserProfile, Income, FopGroup } from '../types';
import { FOP_LIMITS, MONTHLY_ESV, TAX_FIXED_G1, TAX_FIXED_G2, MILITARY_LEVY_FIXED, MILITARY_LEVY_RATE_G3 } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { IncomeModal } from '../components/IncomeModal';
import { dbService } from '../services/dbService';
import { getTodayNbuRates, NbuRate } from '../services/currencyService';

interface DashboardProps {
  profile: UserProfile;
  theme: 'light' | 'dark';
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, theme }) => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rates, setRates] = useState<NbuRate[] | null>(null);
  const [isRatesLoading, setIsRatesLoading] = useState(false);
  const [period, setPeriod] = useState<'month' | 'year'>('year');

  useEffect(() => {
    const load = async () => {
      const loadedIncomes = await dbService.getIncomes();
      setIncomes(loadedIncomes);

      // Курси НБУ
      try {
        setIsRatesLoading(true);
        const r = await getTodayNbuRates(['USD', 'EUR']);
        setRates(r);
      } finally {
        setIsRatesLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveIncome = async (income: Income) => {
    await dbService.addIncome(income);
    const loadedIncomes = await dbService.getIncomes();
    setIncomes(loadedIncomes);
  };

  // Фільтрація за періодом
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const filteredIncomes = period === 'month' 
    ? incomes.filter(inc => {
        const incDate = new Date(inc.date);
        return incDate.getMonth() === currentMonth && incDate.getFullYear() === currentYear;
      })
    : incomes;

  // --- Calculations 2026 ---
  const totalIncome = filteredIncomes.reduce((sum, i) => {
    // Використовуємо amountUah якщо є, інакше amount (для UAH транзакцій)
    const amountInUah = i.amountUah ?? (i.currency === 'UAH' ? i.amount : 0);
    return sum + amountInUah;
  }, 0);
  
  const limit = FOP_LIMITS[profile.group];
  const limitUsed = Math.max(totalIncome, 0);
  const limitRemainingRaw = limit - limitUsed;
  const limitRemaining = Math.max(limitRemainingRaw, 0);
  const limitPercent = limit > 0 ? Math.min((limitUsed / limit) * 100, 100) : 0;
  
  // Tax Calculation Logic
  let estimatedTaxDisplay = 0;
  let taxLabel = "Податок";
  let esvTotal = MONTHLY_ESV;
  let periodTaxTotal = 0;
  let epAmount = 0;
  let vsAmount = 0;
  let esvPeriodAmount = 0;

  if (totalIncome <= 0) {
    estimatedTaxDisplay = 0;
    esvTotal = 0;
    periodTaxTotal = 0;
    epAmount = 0;
    vsAmount = 0;
    esvPeriodAmount = 0;
  } else if (profile.group === FopGroup.GROUP_3) {
    // Group 3: % from Income + 1% Military Levy
    epAmount = totalIncome * profile.taxRate;
    vsAmount = totalIncome * MILITARY_LEVY_RATE_G3;
    esvPeriodAmount = period === 'month' ? MONTHLY_ESV : MONTHLY_ESV * 12;
    estimatedTaxDisplay = epAmount + vsAmount;
    periodTaxTotal = estimatedTaxDisplay + esvPeriodAmount;
    taxLabel = "Податок (ЄП + 1% ВЗ)";
  } else {
    // Group 1 & 2: Fixed Monthly Payment
    const fixedTax = profile.group === FopGroup.GROUP_1 ? TAX_FIXED_G1 : TAX_FIXED_G2;
    estimatedTaxDisplay = fixedTax + MILITARY_LEVY_FIXED;
    esvPeriodAmount = period === 'month' ? MONTHLY_ESV : MONTHLY_ESV * 12;
    periodTaxTotal = period === 'month' 
      ? fixedTax + MILITARY_LEVY_FIXED + MONTHLY_ESV
      : (fixedTax + MILITARY_LEVY_FIXED + MONTHLY_ESV) * 12;
    taxLabel = "Щомісячний платіж (ЄП + ВЗ)";
  }

  const netIncome = Math.max(totalIncome - periodTaxTotal, 0);

  // Chart Data
  const limitData = [
    { name: 'Використано', value: limitUsed, color: '#2563eb' },
    { name: 'Залишилось', value: limitRemaining, color: theme === 'dark' ? '#1e293b' : '#e2e8f0' },
  ];

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textMuted = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const bgCard = theme === 'dark' ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-white border-slate-100';
  const bgMuted = theme === 'dark' ? 'bg-[#111111]' : 'bg-slate-50';

  return (
    <div className={`p-6 md:p-10 space-y-8 pb-24 ${theme === 'dark' ? 'bg-black' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl md:text-4xl font-bold ${textColor}`}>Огляд 2026</h1>
          <p className={`${textMuted} text-base md:text-lg mt-1`}>Вітаємо, {profile.name}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-3 md:px-6 md:py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-2 text-base md:text-lg font-medium"
        >
          <Plus size={22} />
          <span className="hidden md:inline">Додати дохід</span>
        </button>
      </div>

      {/* NBU Rates Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl" />
        <div className="relative z-10">
          <h3 className="font-semibold text-xl md:text-2xl opacity-90 mb-3">Курси валют НБУ</h3>
          {isRatesLoading && (
            <p className="text-blue-50 text-base">Завантаження курсів...</p>
          )}
          {!isRatesLoading && rates && (
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex gap-8 md:gap-12">
                {rates.map((r) => (
                  <div key={r.code}>
                    <p className="text-sm md:text-base text-blue-100 mb-1">{r.code} / UAH</p>
                    <p className="text-3xl md:text-4xl font-bold">
                      {r.rate.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs md:text-sm text-blue-100 md:ml-auto">
                Дані НБУ станом на {new Date().toLocaleDateString('uk-UA')}
              </p>
            </div>
          )}
          {!isRatesLoading && !rates && (
            <p className="text-blue-50 text-base">Не вдалося завантажити курси НБУ.</p>
          )}
        </div>
      </div>

      {/* Period Toggle */}
      <div className={`${bgCard} rounded-xl border p-4 md:p-5`}>
        <p className={`text-sm font-medium ${textMuted} mb-3`}>Період розрахунку</p>
        <div className="flex gap-3">
          <button
            onClick={() => setPeriod('month')}
            className={`px-6 py-2.5 rounded-lg text-base font-medium transition-colors ${
              period === 'month'
                ? theme === 'dark'
                  ? 'bg-white text-black'
                  : 'bg-blue-600 text-white'
                : theme === 'dark'
                  ? 'bg-[#1a1a1a] text-slate-300 hover:bg-[#222222]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Місяць
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-6 py-2.5 rounded-lg text-base font-medium transition-colors ${
              period === 'year'
                ? theme === 'dark'
                  ? 'bg-white text-black'
                  : 'bg-blue-600 text-white'
                : theme === 'dark'
                  ? 'bg-[#1a1a1a] text-slate-300 hover:bg-[#222222]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Рік
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Income Card */}
        <div className={`${bgCard} p-6 md:p-8 rounded-2xl shadow-sm border`}>
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className={`text-sm md:text-base font-medium ${textMuted}`}>
                Загальний дохід ({period === 'month' ? 'Місяць' : 'Рік'})
              </p>
              <h3 className={`text-3xl md:text-4xl font-bold ${textColor} mt-2`}>
                ₴ {totalIncome.toLocaleString()}
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <TrendingUp size={24} />
            </div>
          </div>
          <div className={`w-full rounded-full h-2 mt-3 ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-slate-100'}`}>
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${limitPercent.toFixed(0)}%` }}
            ></div>
          </div>
          <p className={`text-xs md:text-sm ${textMuted} mt-3`}>Оновлено щойно</p>
        </div>

        {/* Taxes Card */}
        <div className={`${bgCard} p-6 md:p-8 rounded-2xl shadow-sm border`}>
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className={`text-sm md:text-base font-medium ${textMuted}`}>Податкове навантаження</p>
              <h3 className={`text-3xl md:text-4xl font-bold ${textColor} mt-2`}>
                ₴ {periodTaxTotal.toLocaleString()}
              </h3>
              <p className={`text-xs md:text-sm ${textMuted} mt-1`}>
                Орієнтовно за {period === 'month' ? 'місяць' : 'рік'}
              </p>
            </div>
          </div>
          <div className={`mt-3 space-y-2 text-sm md:text-base ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            {profile.group === FopGroup.GROUP_3 ? (
              <>
                <div className="flex justify-between">
                  <span>ЄП ({(profile.taxRate * 100).toFixed(0)}%)</span>
                  <span className="font-medium">₴ {epAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Військовий збір 1%</span>
                  <span className="font-medium">₴ {vsAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ЄСВ ({period === 'month' ? '1 міс.' : '12 міс.'})</span>
                  <span className="font-medium">₴ {esvPeriodAmount.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>ЄП (міс.)</span>
                  <span className="font-medium">₴ {(profile.group === FopGroup.GROUP_1 ? TAX_FIXED_G1 : TAX_FIXED_G2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Військовий збір (міс.)</span>
                  <span className="font-medium">₴ {MILITARY_LEVY_FIXED.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ЄСВ ({period === 'month' ? 'міс.' : '12 міс.'})</span>
                  <span className="font-medium">₴ {esvPeriodAmount.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Net Income Card */}
        <div className={`${bgCard} p-6 md:p-8 rounded-2xl shadow-sm border`}>
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className={`text-sm md:text-base font-medium ${textMuted}`}>
                Чистий дохід (після податків, {period === 'month' ? 'місяць' : 'рік'})
              </p>
              <h3 className={`text-3xl md:text-4xl font-bold ${textColor} mt-2`}>
                ₴ {netIncome.toLocaleString()}
              </h3>
            </div>
          </div>
          <p className={`text-xs md:text-sm ${textMuted} mt-3`}>
            Розраховано з урахуванням ЄП, військового збору та ЄСВ за {period === 'month' ? 'місяць' : 'рік'}.
          </p>
        </div>

        {/* Limit Warning Card */}
        <div className={`${bgCard} p-6 md:p-8 rounded-2xl shadow-sm border flex flex-col justify-between`}>
           <div className="flex justify-between items-center mb-4">
             <p className={`text-sm md:text-base font-medium ${textMuted}`}>Ліміт ФОП 2026</p>
             {limitPercent > 80 && <AlertTriangle size={20} className="text-amber-500" />}
           </div>
           
           <div className="flex items-center gap-6">
             <div className="h-28 w-28 md:h-32 md:w-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={limitData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={45}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {limitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm md:text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
                    {limitPercent.toFixed(1)}%
                  </span>
                </div>
             </div>
             <div>
               <p className={`text-xs md:text-sm ${textMuted}`}>Залишок</p>
               <p className={`font-bold text-lg md:text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-800'} mt-1`}>₴ {limitRemaining.toLocaleString()}</p>
               <p className={`text-xs md:text-sm ${textMuted} mt-2`}>Ліміт: {(limit / 1000000).toFixed(2)}М</p>
             </div>
           </div>
        </div>
      </div>

      {/* Recent Incomes List (Preview) */}
      <div className={`${bgCard} rounded-2xl shadow-sm border p-6 md:p-8`}>
        <h3 className={`font-semibold text-lg md:text-xl ${textColor} mb-6`}>Останні транзакції</h3>
        <div className="space-y-4">
          {incomes.length === 0 ? (
            <p className={`text-center ${textMuted} py-12 text-base`}>Транзакцій поки немає.</p>
          ) : (
            incomes.slice(0, 5).map(inc => (
              <div 
                key={inc.id} 
                className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-[#1a1a1a]' 
                    : 'hover:bg-slate-50'
                }`}
              >
                 <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                     theme === 'dark' 
                       ? 'bg-blue-900/30 text-blue-400' 
                       : 'bg-blue-50 text-blue-600'
                   }`}>
                     {inc.currency === 'UAH' ? '₴' : inc.currency === 'USD' ? '$' : '€'}
                   </div>
                   <div>
                     <p className={`font-medium text-base ${textColor}`}>{inc.description || "Дохід"}</p>
                     <p className={`text-sm ${textMuted}`}>{inc.date}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className={`font-bold text-base ${textColor}`}>+{inc.amount.toLocaleString()} {inc.currency}</p>
                   {inc.amountUah && (
                     <p className={`text-xs ${textMuted} mt-0.5`}>
                       ≈ ₴ {inc.amountUah.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </p>
                   )}
                   <p className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                     theme === 'dark' 
                       ? 'text-blue-400 bg-blue-900/30' 
                       : 'text-blue-600 bg-blue-50'
                   }`}>
                     {inc.source === 'ai-scan' ? 'AI' : 'Вручну'}
                   </p>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      <IncomeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveIncome}
      />
    </div>
  );
};
