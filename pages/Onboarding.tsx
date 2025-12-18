import React, { useState } from 'react';
import { UserProfile, FopGroup, TaxRate } from '../types';
import { dbService } from '../services/dbService';
import { Briefcase, User, CheckCircle } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    name: "Entrepreneur",
    group: FopGroup.GROUP_3,
    taxRate: TaxRate.PERCENT_5,
    hasEmployees: false,
    isOnboarded: true,
  });

  React.useEffect(() => {
    const loadProfile = async () => {
      const existingProfile = await dbService.getProfile();
      setProfile({
        ...existingProfile,
        group: existingProfile.group ?? FopGroup.GROUP_3,
        taxRate: existingProfile.taxRate ?? TaxRate.PERCENT_5,
        hasEmployees: existingProfile.hasEmployees ?? false,
        isOnboarded: true,
      });
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    await dbService.saveProfile(profile);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 mb-4">
            <Briefcase className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Вітаємо в Taxify AI</h1>
          <p className="text-slate-500 mt-2">Налаштуємо ваш профіль ФОП за кілька секунд.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-800">Про вас</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ПІБ</label>
                <div className="relative">
                   <User className="absolute left-3 top-3 text-slate-400" size={18} />
                   <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Шевченко Тарас Григорович"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                   />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Група ФОП</label>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((g) => (
                    <button
                      key={g}
                      onClick={() => setProfile({...profile, group: g})}
                      className={`py-3 rounded-xl border-2 font-medium transition-all ${profile.group === g ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      Група {g}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Група 3 найпоширеніша для IT та фрілансерів.
                </p>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!profile.name}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-medium mt-4 disabled:opacity-50 hover:bg-slate-800 transition-all"
              >
                Далі
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
               <h2 className="text-xl font-semibold text-slate-800">Податки</h2>

               {profile.group === 3 && (
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Ставка податку</label>
                   <div className="grid grid-cols-2 gap-3">
                     <button
                        onClick={() => setProfile({...profile, taxRate: TaxRate.PERCENT_5})}
                        className={`py-3 rounded-xl border-2 font-medium transition-all ${profile.taxRate === TaxRate.PERCENT_5 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}
                      >
                        5% (Без ПДВ)
                      </button>
                      <button
                        onClick={() => setProfile({...profile, taxRate: TaxRate.PERCENT_3})}
                        className={`py-3 rounded-xl border-2 font-medium transition-all ${profile.taxRate === TaxRate.PERCENT_3 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}
                      >
                        3% (+ ПДВ)
                      </button>
                   </div>
                 </div>
               )}

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Чи є у вас співробітники?</label>
                 <div className="flex gap-4">
                   <label className="flex items-center p-4 border rounded-xl flex-1 cursor-pointer hover:bg-slate-50">
                     <input 
                      type="radio" 
                      name="employees" 
                      checked={profile.hasEmployees} 
                      onChange={() => setProfile({...profile, hasEmployees: true})}
                      className="w-5 h-5 text-blue-600"
                     />
                     <span className="ml-3 font-medium text-slate-700">Так</span>
                   </label>
                   <label className="flex items-center p-4 border rounded-xl flex-1 cursor-pointer hover:bg-slate-50">
                     <input 
                      type="radio" 
                      name="employees" 
                      checked={!profile.hasEmployees} 
                      onChange={() => setProfile({...profile, hasEmployees: false})}
                      className="w-5 h-5 text-blue-600"
                     />
                     <span className="ml-3 font-medium text-slate-700">Ні</span>
                   </label>
                 </div>
                 <p className="text-xs text-slate-400 mt-2">Впливає на розрахунок ЄСВ.</p>
               </div>

               <button 
                onClick={handleSave}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium mt-4 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
              >
                Завершити налаштування
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};