import React, { useState } from 'react';
import { UserProfile } from '../types';
import { FileText, Download, Loader2, Table } from 'lucide-react';
import { dbService } from '../services/dbService';
import { generateReportContent } from '../services/geminiService';

export const Reports: React.FC<{ profile: UserProfile; theme: 'light' | 'dark' }> = ({ profile, theme }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textMuted = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const bgCard = theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';

  // Helper to trigger download
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAIReport = async (reportName: string) => {
    setIsGenerating(true);
    
    // Gather context
    const incomes = await dbService.getIncomes();
    const total = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const tax = total * profile.taxRate;
    
    const context = `
      Тип звіту: ${reportName}
      ПІБ ФОП: ${profile.name}
      Група: ${profile.group}
      Загальний дохід: ${total} UAH
      Податок до сплати: ${tax} UAH
      Кількість операцій: ${incomes.length}
    `;

    // Gemini Call
    const content = await generateReportContent(reportName, context);
    
    downloadFile(content, `${reportName}_${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
    setIsGenerating(false);
  };

  const handleCsvExport = async () => {
    const incomes = await dbService.getIncomes();
    const headers = "ID,Date,Amount,Currency,Description,Source\n";
    const rows = incomes.map(i => 
      `${i.id},${i.date},${i.amount},${i.currency},"${i.description.replace(/"/g, '""')}",${i.source}`
    ).join("\n");
    
    downloadFile(headers + rows, 'book_of_income.csv', 'text/csv');
  };

  return (
    <div className={`p-4 md:p-8 space-y-6 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <h1 className={`text-2xl font-bold ${textColor}`}>Звіти та декларації</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gemini AI Reports */}
        <button
          onClick={() => handleAIReport('Декларація_ФОП')}
          disabled={isGenerating}
          className={`flex items-center justify-between p-6 ${bgCard} border rounded-xl transition-all group text-left ${
            theme === 'dark' 
              ? 'hover:border-blue-600 hover:bg-slate-700' 
              : 'hover:border-blue-500 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-[#111111] text-slate-300 group-hover:bg-blue-900/30 group-hover:text-blue-400' 
                : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
            }`}>
              <FileText size={24} />
            </div>
            <div>
              <h3 className={`font-semibold ${textColor}`}>Декларація платника ЄП</h3>
              <p className={`text-xs ${textMuted}`}>Генерується AI • Текстовий формат</p>
            </div>
          </div>
          {isGenerating ? <Loader2 className="animate-spin text-blue-500" /> : <Download size={20} className={`${theme === 'dark' ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-300 group-hover:text-blue-500'}`} />}
        </button>

        <button
          onClick={() => handleAIReport('Звіт_ЄСВ')}
          disabled={isGenerating}
          className={`flex items-center justify-between p-6 ${bgCard} border rounded-xl transition-all group text-left ${
            theme === 'dark' 
              ? 'hover:border-blue-600 hover:bg-slate-700' 
              : 'hover:border-blue-500 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-[#111111] text-slate-300 group-hover:bg-blue-900/30 group-hover:text-blue-400' 
                : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
            }`}>
              <FileText size={24} />
            </div>
            <div>
              <h3 className={`font-semibold ${textColor}`}>Звіт по ЄСВ (Додаток 1)</h3>
              <p className={`text-xs ${textMuted}`}>Генерується AI • Текстовий формат</p>
            </div>
          </div>
          {isGenerating ? <Loader2 className="animate-spin text-blue-500" /> : <Download size={20} className={`${theme === 'dark' ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-300 group-hover:text-blue-500'}`} />}
        </button>

        {/* CSV Export */}
        <button
          onClick={handleCsvExport}
          className={`flex items-center justify-between p-6 ${bgCard} border rounded-xl transition-all group text-left ${
            theme === 'dark' 
              ? 'hover:border-emerald-600 hover:bg-slate-700' 
              : 'hover:border-emerald-500 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-[#111111] text-slate-300 group-hover:bg-emerald-900/30 group-hover:text-emerald-400' 
                : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600'
            }`}>
              <Table size={24} />
            </div>
            <div>
              <h3 className={`font-semibold ${textColor}`}>Книга доходів</h3>
              <p className={`text-xs ${textMuted}`}>Експорт в Excel (CSV)</p>
            </div>
          </div>
          <Download size={20} className={`${theme === 'dark' ? 'text-slate-500 group-hover:text-emerald-400' : 'text-slate-300 group-hover:text-emerald-500'}`} />
        </button>
      </div>

      <div className={`rounded-xl p-4 text-sm border ${
        theme === 'dark' 
          ? 'bg-blue-900/20 border-blue-800 text-blue-300' 
          : 'bg-blue-50 border-blue-200 text-blue-800'
      }`}>
        <strong>Примітка:</strong> Звіти, згенеровані AI, є довідковими. Будь ласка, перевіряйте цифри перед подачею офіційної звітності в податкову.
      </div>
    </div>
  );
};