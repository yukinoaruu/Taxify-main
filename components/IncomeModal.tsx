import React, { useState, useRef } from 'react';
import { Camera, Upload, Check, X, Loader2, DollarSign, Calendar, FileText } from 'lucide-react';
import { extractIncomeFromImage } from '../services/geminiService';
import { Income } from '../types';
import { getNbuRateToUah } from '../services/currencyService';

// Simple UUID generator for this context
const simpleId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (income: Income) => void;
  initialData?: Income;
  theme?: 'light' | 'dark';
}

export const IncomeModal: React.FC<IncomeModalProps> = ({ isOpen, onClose, onSave, initialData, theme = 'light' }) => {
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');
  // Разделяем состояния загрузки, чтобы не показывать сообщение про Gemini при обычном сохранении
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [currency, setCurrency] = useState<'UAH' | 'USD' | 'EUR'>(initialData?.currency || 'UAH');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(initialData?.description || '');
  const [docUrl, setDocUrl] = useState<string | undefined>(initialData?.originalDocumentUrl);
  const [clientOrProject, setClientOrProject] = useState(initialData?.clientOrProject || '');
  const [comment, setComment] = useState(initialData?.comment || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [attachments, setAttachments] = useState<string[]>(initialData?.attachments || []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setDocUrl(base64);

      try {
        const data = await extractIncomeFromImage(base64);
        setAmount(data.amount.toString());
        setCurrency(data.currency);
        if (data.date) setDate(data.date);
        if (data.description) setDescription(data.description);
        setMode('manual'); // Switch to review mode
      } catch (err) {
        setError("Не вдалося розпізнати документ. Будь ласка, введіть дані вручну.");
        setMode('manual');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAttachmentsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAttachments((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    setIsSaving(true);
    try {
      // Ensure we have a valid number
      const numericAmount = parseFloat(amount.toString().replace(',', '.'));
      if (isNaN(numericAmount)) {
        setError("Будь ласка, введіть коректну суму");
        setIsSaving(false);
        return;
      }

      let amountUah: number | undefined = undefined;

      if (currency === 'UAH') {
        // Для UAH явно устанавливаем amountUah = amount
        amountUah = numericAmount;
      } else {
        // Для USD/EUR конвертируем по курсу НБУ на дату транзакции
        try {
          const rate = await getNbuRateToUah(currency, date);
          amountUah = numericAmount * rate;
        } catch (err) {
          // Якщо курс не вдалося отримати — показуємо попередження, але все одно зберігаємо транзакцію
          console.error('NBU rate error', err);
          setError(`Не вдалося отримати курс НБУ для ${currency}. Транзакцію буде збережено без конвертації в гривні. Ви можете додати курс вручну пізніше.`);
          // Продолжаем сохранение без amountUah
          amountUah = undefined;
        }
      }

      const income: Income = {
        id: initialData?.id || simpleId(),
        amount: numericAmount,
        currency,
        date,
        description,
        source: initialData?.source || (docUrl ? 'ai-scan' : 'manual'),
        originalDocumentUrl: docUrl,
        amountUah,
        clientOrProject: clientOrProject || undefined,
        comment: comment || undefined,
        category: category || undefined,
        attachments: attachments.length ? attachments : undefined,
      };

      await onSave(income);
      resetForm();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setDocUrl(undefined);
    setClientOrProject('');
    setComment('');
    setCategory('');
    setAttachments([]);
    setMode('manual');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-white border-slate-200'} rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden border my-auto`}>

        {/* Header */}
        <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-[#1a1a1a] bg-[#111111]' : 'border-slate-200 bg-white'} flex justify-between items-center sticky top-0 z-10`}>
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            {initialData ? 'Редагувати транзакцію' : 'Додати дохід'}
          </h2>
          <button onClick={onClose} className={theme === 'dark' ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-600'}>
            <X size={20} />
          </button>
        </div>

        <div className={`p-6 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'} overflow-y-auto max-h-[calc(90vh-80px)]`}>
          {/* Mode Switcher */}
          {!initialData && (
            <div className={`flex ${theme === 'dark' ? 'bg-[#111111]' : 'bg-slate-100'} p-1 rounded-lg mb-6`}>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'manual'
                  ? `${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'} shadow text-blue-600`
                  : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                onClick={() => setMode('manual')}
              >
                Вручну
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'scan'
                  ? `${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'} shadow text-blue-600`
                  : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                onClick={() => setMode('scan')}
              >
                Скан AI
              </button>
            </div>
          )}

          {error && (
            <div className={`mb-4 p-3 ${theme === 'dark' ? 'bg-red-900/30 text-red-300 border-red-800' : 'bg-red-50 text-red-600 border-red-200'} border text-sm rounded-lg`}>
              {error}
            </div>
          )}

          {isScanning ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="animate-spin mb-3 text-blue-600" size={32} />
              <p>Gemini аналізує документ...</p>
            </div>
          ) : isSaving ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="animate-spin mb-3 text-blue-600" size={28} />
              <p>Збереження транзакції...</p>
            </div>
          ) : mode === 'scan' ? (
            <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
              />
              <div className="bg-blue-100 p-4 rounded-full mb-3">
                <Camera className="text-blue-600" size={32} />
              </div>
              <p className="font-medium text-slate-700">Натисніть для завантаження</p>
              <p className="text-xs text-slate-400 mt-1">Підтримуються JPG, PNG</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {docUrl && (
                <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 border-2 ${theme === 'dark'
                    ? 'bg-blue-900/40 text-blue-100 border-blue-700'
                    : 'bg-blue-50 text-blue-900 border-blue-300'
                  }`}>
                  <div className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-blue-800' : 'bg-blue-100'
                    }`}>
                    <Check size={18} className={theme === 'dark' ? 'text-blue-200' : 'text-blue-600'} />
                  </div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-100' : 'text-blue-900'}`}>
                    Документ розпізнано. Перевірте дані та натисніть "Зберегти".
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Сума</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm font-bold">
                      {currency === 'UAH' ? '₴' : currency === 'USD' ? '$' : '€'}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`pl-8 w-full p-2.5 ${theme === 'dark' ? 'bg-[#111111] border-[#1a1a1a] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                    placeholder="0.00"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="absolute inset-y-0 right-0 pr-3 bg-transparent text-slate-500 text-sm font-medium outline-none"
                  >
                    <option value="UAH">UAH</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Дата</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`pl-10 w-full p-2.5 ${theme === 'dark' ? 'bg-[#111111] border-[#1a1a1a] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Опис</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`pl-10 w-full p-2.5 ${theme === 'dark' ? 'bg-[#111111] border-[#1a1a1a] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="напр. Розробка ПЗ"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Клієнт / Проєкт <span className="text-slate-400">(необов'язково)</span>
                </label>
                <input
                  type="text"
                  value={clientOrProject}
                  onChange={(e) => setClientOrProject(e.target.value)}
                  className={`w-full p-2.5 ${theme === 'dark' ? 'bg-[#111111] border-[#1a1a1a] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm`}
                  placeholder="напр. Компанія ABC / Проєкт CRM"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Категорія <span className="text-slate-400">(необов'язково)</span>
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full p-2.5 ${theme === 'dark' ? 'bg-[#111111] border-[#1a1a1a] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm`}
                  placeholder="напр. Розробка ПЗ, Консалтинг..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Коментар <span className="text-slate-400">(необов'язково)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={`w-full p-2.5 ${theme === 'dark' ? 'bg-[#111111] border-[#1a1a1a] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none`}
                  rows={3}
                  placeholder="Будь-які додаткові деталі по угоді"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Файли / Фото <span className="text-slate-400">(необов'язково)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAttachmentsUpload}
                  className="text-xs text-slate-500"
                />
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((a, idx) => (
                      <img
                        key={idx}
                        src={a}
                        alt={`Документ ${idx + 1}`}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] mt-4"
              >
                Зберегти
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};