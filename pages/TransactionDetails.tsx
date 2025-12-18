import React, { useState } from 'react';
import { Income, UserProfile, FopGroup } from '../types';
import { MILITARY_LEVY_RATE_G3, MILITARY_LEVY_FIXED, MONTHLY_ESV, TAX_FIXED_G1, TAX_FIXED_G2 } from '../constants';
import { X, Edit2, Trash2 } from 'lucide-react';
import { IncomeModal } from '../components/IncomeModal';
import { dbService } from '../services/dbService';

interface TransactionDetailsProps {
  income: Income;
  profile: UserProfile;
  onBack: () => void;
  theme: 'light' | 'dark';
  onUpdate?: (updated: Income) => void;
}

/**
 * Детальна сторінка окремої транзакції з можливістю редагування та перегляду фото.
 */
export const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  income,
  profile,
  onBack,
  theme,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  let taxAmount = 0;

  if (profile.group === FopGroup.GROUP_3) {
    const singleTax = (income.amountUah ?? income.amount) * profile.taxRate;
    const militaryLevy = (income.amountUah ?? income.amount) * MILITARY_LEVY_RATE_G3;
    taxAmount = singleTax + militaryLevy;
  } else {
    const fixedTax = profile.group === FopGroup.GROUP_1 ? TAX_FIXED_G1 : TAX_FIXED_G2;
    taxAmount = fixedTax + MILITARY_LEVY_FIXED + MONTHLY_ESV;
  }

  const netIncome = Math.max((income.amountUah ?? income.amount) - taxAmount, 0);

  const handleSave = async (updated: Income) => {
    // Оновлюємо транзакцію в Firestore
    await dbService.deleteIncome(income.id);
    await dbService.addIncome({ ...updated, id: income.id });
    if (onUpdate) {
      onUpdate({ ...updated, id: income.id });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Ви впевнені, що хочете видалити цю транзакцію?')) return;
    setIsDeleting(true);
    await dbService.deleteIncome(income.id);
    setIsDeleting(false);
    onBack();
  };

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textMuted = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const bgCard = theme === 'dark' ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-white border-slate-100';
  const bgMuted = theme === 'dark' ? 'bg-[#111111]' : 'bg-slate-50';

  if (isEditing) {
    return (
      <IncomeModal
        isOpen={true}
        onClose={() => setIsEditing(false)}
        onSave={handleSave}
        initialData={income}
        theme={theme}
      />
    );
  }

  return (
    <div className={`p-6 md:p-10 space-y-8 pb-24 ${theme === 'dark' ? 'bg-black' : 'bg-slate-50'}`}>
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`text-sm transition-colors ${theme === 'dark'
            ? 'text-blue-400 hover:text-blue-300'
            : 'text-blue-600 hover:text-blue-700'
            }`}
        >
          ← Назад до списку
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
              ? 'text-slate-300 hover:bg-[#1a1a1a] hover:text-white'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
              ? 'text-red-400 hover:bg-[#1a1a1a] hover:text-red-300'
              : 'text-red-600 hover:bg-red-50'
              }`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className={`${bgCard} rounded-2xl shadow-sm border p-6 space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className={`text-2xl font-bold ${textColor}`}>
              Транзакція на{' '}
              {income.amount.toLocaleString('uk-UA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              {income.currency}
            </h1>
            <p className={`${textMuted} text-sm`}>
              {income.description || 'Дохід'} • {income.date}
            </p>
          </div>
          <div className={`text-xs ${textMuted}`}>
            Джерело:{' '}
            <span className="font-medium">
              {income.source === 'ai-scan' ? 'Розпізнано AI' : 'Внесено вручну'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${bgMuted} rounded-xl p-4`}>
            <p className={`text-xs ${textMuted} mb-1`}>Сума</p>
            <p className={`text-xl font-semibold ${textColor}`}>
              {income.amount.toLocaleString('uk-UA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              {income.currency}
            </p>
            {income.amountUah && (
              <p className={`text-xs ${textMuted} mt-1`}>
                ≈ ₴{' '}
                {income.amountUah.toLocaleString('uk-UA', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                за курсом НБУ на дату операції
              </p>
            )}
          </div>
          <div className={`${bgMuted} rounded-xl p-4`}>
            <p className={`text-xs ${textMuted} mb-1`}>Орієнтовний податок</p>
            <p className={`text-xl font-semibold ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`}>
              {taxAmount.toLocaleString('uk-UA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              ₴
            </p>
          </div>
          <div className={`${bgMuted} rounded-xl p-4`}>
            <p className={`text-xs ${textMuted} mb-1`}>Чистий дохід</p>
            <p className={`text-xl font-semibold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {netIncome.toLocaleString('uk-UA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              ₴
            </p>
          </div>
        </div>

        {(income.clientOrProject || income.category || income.comment) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-[#1a1a1a] pt-4 mt-2">
            {income.clientOrProject && (
              <div>
                <p className={`text-xs ${textMuted} mb-1`}>Клієнт / Проєкт</p>
                <p className={`text-sm font-medium ${textColor}`}>
                  {income.clientOrProject}
                </p>
              </div>
            )}
            {income.category && (
              <div>
                <p className={`text-xs ${textMuted} mb-1`}>Категорія</p>
                <p className={`text-sm font-medium ${textColor}`}>
                  {income.category}
                </p>
              </div>
            )}
            {income.comment && (
              <div className="md:col-span-3">
                <p className={`text-xs ${textMuted} mb-1`}>Коментар</p>
                <p className={`text-sm whitespace-pre-line ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  {income.comment}
                </p>
              </div>
            )}
          </div>
        )}

        {income.attachments && income.attachments.length > 0 && (
          <div className="border-t border-slate-100 dark:border-[#1a1a1a] pt-4 mt-2">
            <p className={`text-xs ${textMuted} mb-2`}>Файли / Фото</p>
            <div className="flex flex-wrap gap-3">
              {income.attachments.map((a, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={a}
                    alt={`Документ ${idx + 1}`}
                    className="w-24 h-24 rounded-lg object-cover border border-slate-200 dark:border-[#1a1a1a] cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedImage(a)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Image Viewer */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={32} />
          </button>
          <img
            src={selectedImage}
            alt="Повноекранне зображення"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};