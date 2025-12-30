
import React, { useState, useRef, useEffect } from 'react';
import { getLocalAssistantResponse } from '@/services/geminiService';

const AIChat: React.FC = () => {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: 'こんにちは！回覧板BASE 専属AIアシスタントです。埼玉県内の地域情報、歴史、行政ルール、お勧めのスポットなど、何でも聞いてください。あなたの地域貢献をサポートします！' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        const history = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user', // "model" is Gemini API specific role for assistant
            parts: [{ text: m.content }]
        }));

        const response = await getLocalAssistantResponse(userMsg, history);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-[75vh] bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 flex items-center gap-4 text-white">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <i className="fas fa-robot text-2xl"></i>
                </div>
                <div>
                    <h3 className="font-black tracking-tight">SAITAMA コンシェルジュ</h3>
                    <p className="text-[9px] text-emerald-400 uppercase tracking-widest font-black">AI Wisdom of Saitama</p>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-sm font-medium ${msg.role === 'user'
                            ? 'bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 p-5 rounded-3xl rounded-tl-none flex gap-2 shadow-sm">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="埼玉の豆知識やルールを聞く..."
                        className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-bold"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-emerald-600 active:scale-95 transition-all shadow-xl disabled:bg-slate-200"
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChat;
