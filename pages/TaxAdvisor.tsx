import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, Chat } from '../types';
import { Send, Bot, Loader2, Sparkles, Paperclip, X, Plus, MessageSquare, Trash2, Menu } from 'lucide-react';

interface TaxAdvisorProps {
    profile: UserProfile;
    theme: 'light' | 'dark';
    chats: Chat[];
    activeChatId: string | null;
    onSetActiveChat: (id: string) => void;
    onUpdateMessages: (id: string, messages: ChatMessage[]) => void;
    onCreateChat: () => string;
    onDeleteChat: (id: string) => void;
}

const simpleId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const TaxAdvisor: React.FC<TaxAdvisorProps> = ({
    profile,
    theme,
    chats,
    activeChatId,
    onSetActiveChat,
    onUpdateMessages,
    onCreateChat,
    onDeleteChat
}) => {
    const activeChat = chats.find(c => c.id === activeChatId) || null;
    const messages = activeChat ? activeChat.messages : [];

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (chats.length === 0) {
            onCreateChat();
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (messageText?: string) => {
        const text = messageText || input.trim();
        if ((!text && selectedFiles.length === 0) || isLoading) return;

        const userMessage: ChatMessage = {
            id: simpleId(),
            role: 'user',
            content: text || `[Файл${selectedFiles.length > 1 ? 'и' : ''}: ${selectedFiles.map(f => f.name).join(', ')}]`,
            timestamp: Date.now(),
        };

        const newMessages = [...messages, userMessage];
        if (activeChatId) {
            onUpdateMessages(activeChatId, newMessages);
        }

        setInput('');
        const filesToProcess = [...selectedFiles];
        setSelectedFiles([]);
        setIsLoading(true);

        const currentChatId = activeChatId; // Store it
        if (!currentChatId) return;

        try {
            // Прямий виклик до Gemini API
            const { GoogleGenAI } = await import('@google/genai');
            const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

            if (!apiKey) {
                throw new Error('API ключ не знайдено. Додайте VITE_GEMINI_API_KEY в .env файл');
            }

            const ai = new GoogleGenAI({
                apiKey: apiKey,
            });

            // Формуємо контекст
            const userContext = `Користувач: ${profile.name}, Група ФОП: ${profile.group}, Ставка податку: ${(profile.taxRate * 100).toFixed(0)}%, Наявність співробітників: ${profile.hasEmployees ? "Так" : "Ні"}`;

            // Формуємо історію
            const conversationHistory = messages.slice(-6)
                .map((msg) => `${msg.role === 'user' ? 'Користувач' : 'Асистент'}: ${msg.content}`)
                .join('\n');

            const fullPrompt = `
${userContext}

${conversationHistory ? `Історія розмови:\n${conversationHistory}\n` : ''}

Нове запитання користувача: ${text}

Дай детальну, професійну відповідь українською мовою. Будь конкретним та корисним. Якщо потрібно, наведи приклади розрахунків.
`;

            const systemInstruction = `Ти Taxify AI, експертний податковий консультант для ФОП (Україна) на 2026 рік.
Твій тон: професійний, лаконічний, доброзичливий. Спілкуйся виключно українською мовою.

Правила 2026 року:
- 1 група: ЄП 332.80 грн/міс, ЄСВ 1902.34 грн/міс, ВЗ 864.70 грн/міс. Ліміт доходу: 1,444,049 грн/рік.
- 2 група: ЄП 1729 грн/міс, ЄСВ 1902.34 грн/міс, ВЗ 864.70 грн/міс. Ліміт доходу: 7,211,598 грн/рік.
- 3 група: ЄП 5% (або 3% з ПДВ) від доходу + ВЗ 1% від доходу + ЄСВ 1902.34 грн/міс. Ліміт доходу: 10,091,049 грн/рік.

Пояснюй податкові ситуації простою мовою. Наводь конкретні приклади розрахунків.`;

            // Обробка файлів
            const fileParts = [];
            if (filesToProcess.length > 0) {
                for (const file of filesToProcess) {
                    const base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64String = (reader.result as string).split(',')[1];
                            resolve(base64String);
                        };
                        reader.readAsDataURL(file);
                    });

                    fileParts.push({
                        inlineData: {
                            mimeType: file.type,
                            data: base64
                        }
                    });
                }
            }

            // Формуємо contents з файлами
            const contents = fileParts.length > 0
                ? [
                    ...fileParts,
                    { text: fullPrompt }
                ]
                : fullPrompt;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: {
                    systemInstruction,
                    maxOutputTokens: 5048,
                    temperature: 0.7,
                },
            });

            const assistantMessage: ChatMessage = {
                id: simpleId(),
                role: 'assistant',
                content: (response.text || 'Вибачте, не вдалося отримати відповідь.').replace(/\*\*/g, ''),
                timestamp: Date.now(),
            };

            if (currentChatId) {
                onUpdateMessages(currentChatId, [...newMessages, assistantMessage]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = {
                id: simpleId(),
                role: 'assistant',
                content: error instanceof Error ? error.message : 'Вибачте, сталася помилка. Перевірте налаштування API ключа.',
                timestamp: Date.now(),
            };
            if (currentChatId) {
                onUpdateMessages(currentChatId, [...newMessages, errorMessage]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickPrompt = (prompt: string) => {
        handleSendMessage(prompt);
    };

    return (
        <div className={`flex h-[calc(100vh-64px-env(safe-area-inset-bottom))] relative overflow-hidden ${theme === 'dark' ? 'bg-[#1f1f1f] text-white' : 'bg-white text-slate-900'}`}>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Chat Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 w-72 z-[70] transform transition-transform duration-300 ease-in-out border-r
                md:relative md:translate-x-0 md:z-auto
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                ${theme === 'dark' ? 'bg-[#1f1f1f] border-[#3a3a3a]' : 'bg-slate-50 border-slate-200'}
            `}>
                <div className="flex flex-col h-full p-4">
                    <button
                        onClick={() => {
                            onCreateChat();
                            setIsSidebarOpen(false);
                        }}
                        className={`flex items-center gap-2 w-full p-3 rounded-xl border mb-6 transition-all active:scale-95 ${theme === 'dark'
                            ? 'bg-[#2a2a2a] border-[#3a3a3a] text-white hover:bg-[#333333]'
                            : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        <Plus size={18} /> Новий чат
                    </button>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        {chats.map(chat => (
                            <div key={chat.id} className="relative group">
                                <button
                                    onClick={() => {
                                        onSetActiveChat(chat.id);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${activeChatId === chat.id
                                        ? theme === 'dark' ? 'bg-[#2a2a2a] text-blue-400' : 'bg-blue-50 text-blue-700'
                                        : theme === 'dark' ? 'text-slate-400 hover:bg-[#2a2a2a] hover:text-white' : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <MessageSquare size={18} className="shrink-0" />
                                    <span className="truncate text-sm font-medium">{chat.title}</span>
                                </button>
                                <button
                                    onClick={() => onDeleteChat(chat.id)}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-red-500/10 text-red-500`}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative min-w-0">
                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center p-4 border-b border-[#3a3a3a] dark:bg-[#1f1f1f]">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-400">
                        <Menu size={24} />
                    </button>
                    <span className="ml-2 font-semibold">Taxify AI</span>
                </div>

                {/* Empty State */}
                <div className={`flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto pb-40 ${messages.length <= 1 ? 'flex' : 'hidden'}`}>
                    <div className="max-w-4xl w-full text-center space-y-8 md:space-y-12">
                        <h1 className={`text-3xl md:text-5xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Вітаю, {profile.name}</span>
                            <br />
                            <span className="text-slate-500">Чим я можу допомогти?</span>
                        </h1>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                            {[
                                { text: "Які податки мені потрібно платити в цьому кварталі?", icon: "💰" },
                                { text: "Як зміняться ліміти для 3-ї групи у 2026 році?", icon: "📈" },
                                { text: "Допоможи розрахувати ЄСВ за минулий місяць", icon: "📑" },
                                { text: "Чи потрібно мені подавати нову декларацію?", icon: "❓" }
                            ].map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setInput(prompt.text);
                                        inputRef.current?.focus();
                                    }}
                                    className={`flex items-center gap-3 p-4 text-left rounded-2xl border transition-all hover:scale-[1.01] ${theme === 'dark'
                                        ? 'bg-[#1f1f1f] border-[#3a3a3a] hover:bg-[#2a2a2a]'
                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="text-xl md:text-2xl">{prompt.icon}</span>
                                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {prompt.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Messages Container */}
                <div className={`flex-1 overflow-y-auto px-4 md:px-6 pt-6 pb-40 md:pb-32 ${messages.length > 1 ? 'block' : 'hidden'}`} style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.slice(1).map((msg, idx) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl ${msg.role === 'user'
                                    ? theme === 'dark' ? 'bg-blue-600/20 text-blue-100 border border-blue-500/20' : 'bg-blue-600 text-white'
                                    : theme === 'dark' ? 'bg-[#2a2a2a] text-slate-200 border border-[#3a3a3a]' : 'bg-slate-100 text-slate-900 border border-slate-200'
                                    }`}>
                                    <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    <div className="mt-2 text-[10px] opacity-50">
                                        {new Date(msg.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className={`px-4 py-3 rounded-2xl ${theme === 'dark' ? 'bg-[#2a2a2a] border border-[#3a3a3a]' : 'bg-slate-100 border border-slate-200'}`}>
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Always Fixed Input Container */}
                <div className={`absolute bottom-0 md:bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t to-transparent z-50 mb-[74px] md:mb-0 ${theme === 'dark' ? 'from-[#1f1f1f] via-[#1f1f1f]' : 'from-white via-white'
                    }`}>
                    <div className="max-w-3xl mx-auto">
                        {selectedFiles.length > 0 && (
                            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                                {selectedFiles.map((file, idx) => (
                                    <div key={idx} className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border ${theme === 'dark' ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-slate-100 border-slate-200'}`}>
                                        <span className="text-xs truncate max-w-[120px]">{file.name}</span>
                                        <button onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3 items-end">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx"
                                className="hidden"
                                onChange={(e) => e.target.files && setSelectedFiles(Array.from(e.target.files))}
                            />
                            <div className={`flex-1 flex flex-col rounded-[1.5rem] border transition-all ${theme === 'dark'
                                ? 'bg-[#2a2a2a] border-[#3a3a3a] focus-into:border-blue-600/50 shadow-lg shadow-black/20'
                                : 'bg-white border-slate-200 focus-within:border-blue-500 shadow-sm'
                                }`}>
                                <textarea
                                    ref={inputRef as any}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Запитайте Taxify AI..."
                                    rows={1}
                                    className="w-full px-5 py-4 bg-transparent outline-none resize-none max-h-40 min-h-[56px] text-sm md:text-base"
                                    style={{ height: 'auto' }}
                                />
                                <div className="flex items-center justify-between px-3 pb-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'text-slate-400 hover:bg-[#333333] hover:text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        <Paperclip size={20} />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={(!input.trim() && selectedFiles.length === 0) || isLoading}
                                        className={`p-2 rounded-xl transition-all shadow-md ${(!input.trim() && selectedFiles.length === 0) || isLoading
                                            ? 'bg-slate-300 text-slate-500 dark:bg-[#333333] dark:text-slate-600'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 active:scale-95'
                                            }`}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
