
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User as UserIcon, Shield } from 'lucide-react';
import { subscribeToGlobalChat, sendGlobalChatMessage } from '../../services/firebaseService';
import type { ChatMessage } from '../../types';
import type { User } from 'firebase/auth';
import { useToast } from '../shared/Toast';

interface GlobalChatProps {
    currentUser: User | null;
    isAdmin: boolean;
    onLoginRequest: () => void;
}

export const GlobalChat: React.FC<GlobalChatProps> = ({ currentUser, isAdmin, onLoginRequest }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    // Subscribe to messages
    useEffect(() => {
        const unsubscribe = subscribeToGlobalChat((incomingMessages) => {
            setMessages(incomingMessages);
            if (!isOpen && incomingMessages.length > 0) {
                 setHasUnread(true);
            }
        });
        return () => unsubscribe();
    }, [isOpen]);

    // Auto-scroll
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            setHasUnread(false);
        }
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        setIsSending(true);
        try {
            await sendGlobalChatMessage(newMessage, currentUser, isAdmin);
            setNewMessage('');
        } catch (error) {
            addToast('Gagal mengirim pesan.', 'error');
        } finally {
            setIsSending(false);
        }
    };

    // Fungsi untuk mengubah teks URL menjadi link aktif
    const renderMessageWithLinks = (text: string, isMe: boolean, isAdminMsg: boolean) => {
        // Regex untuk mendeteksi URL (http/https)
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        
        // Split pesan berdasarkan URL
        const parts = text.split(urlRegex);
        
        return parts.map((part, index) => {
            // Jika bagian ini cocok dengan regex URL, render sebagai <a> tag
            if (part.match(urlRegex)) {
                return (
                    <a 
                        key={index} 
                        href={part} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`font-bold underline break-all hover:opacity-80 transition-opacity ${
                            isMe ? 'text-white' : isAdminMsg ? 'text-yellow-600' : 'text-blue-400'
                        }`}
                        onClick={(e) => e.stopPropagation()} // Mencegah event bubbling jika ada
                    >
                        {part}
                    </a>
                );
            }
            // Jika teks biasa, kembalikan string
            return part;
        });
    };

    return (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[60] flex flex-col items-end pointer-events-none max-w-[calc(100vw-32px)]">
            {/* Chat Window */}
            <div 
                className={`
                    w-80 sm:w-96 bg-brand-primary/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right mb-4 pointer-events-auto
                    ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10 pointer-events-none h-0 w-0 mb-0'}
                `}
                style={{ maxHeight: 'min(500px, 60vh)' }}
            >
                {/* Header */}
                <div className="bg-brand-secondary/80 p-3 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-brand-vibrant/20 flex items-center justify-center text-brand-vibrant">
                             <MessageCircle size={16} />
                         </div>
                         <div>
                             <h3 className="text-sm font-black text-white uppercase tracking-wider">Live Chat</h3>
                             <p className="text-[10px] text-green-400 flex items-center gap-1">
                                 <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Online
                             </p>
                         </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-brand-light hover:text-white transition-colors p-1">
                        <X size={18} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="h-64 sm:h-80 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/20">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-brand-light/30 text-xs italic space-y-2">
                            <MessageCircle size={32} />
                            <p>Belum ada pesan. Mulai obrolan!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = currentUser && msg.userId === currentUser.uid;
                            return (
                                <div key={msg.id} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    <div className="flex-shrink-0 mt-1">
                                         {msg.userPhoto ? (
                                             <img src={msg.userPhoto} alt={msg.userName} className="w-6 h-6 rounded-full border border-white/10" />
                                         ) : (
                                             <div className="w-6 h-6 rounded-full bg-brand-secondary flex items-center justify-center text-brand-light border border-white/10">
                                                 <UserIcon size={12} />
                                             </div>
                                         )}
                                    </div>
                                    <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-1 mb-0.5">
                                            {msg.isAdmin && <Shield size={10} className="text-brand-special fill-brand-special" />}
                                            <span className={`text-[9px] font-bold ${isMe ? 'text-brand-light' : msg.isAdmin ? 'text-brand-special' : 'text-brand-vibrant'}`}>
                                                {msg.userName}
                                            </span>
                                            <span className="text-[8px] text-brand-light/40">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <div className={`
                                            px-3 py-2 rounded-xl text-xs leading-relaxed break-words
                                            ${isMe 
                                                ? 'bg-brand-vibrant text-white rounded-tr-none' 
                                                : msg.isAdmin 
                                                    ? 'bg-yellow-900/40 border border-yellow-700/30 text-yellow-100 rounded-tl-none'
                                                    : 'bg-white/10 text-brand-text rounded-tl-none'
                                            }
                                        `}>
                                            {renderMessageWithLinks(msg.text, !!isMe, !!msg.isAdmin)}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-brand-secondary/50 border-t border-white/5">
                    {currentUser ? (
                        <form onSubmit={handleSend} className="flex gap-2 relative">
                             <input 
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Ketik pesan (link dimulai http://)..."
                                className="flex-grow bg-black/30 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-brand-vibrant focus:ring-1 focus:ring-brand-vibrant transition-all"
                             />
                             <button 
                                type="submit" 
                                disabled={!newMessage.trim() || isSending}
                                className="absolute right-1 top-1 p-1.5 bg-brand-vibrant text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:bg-brand-light/20 transition-colors"
                             >
                                 <Send size={14} />
                             </button>
                        </form>
                    ) : (
                        <button 
                            onClick={onLoginRequest}
                            className="w-full py-2 bg-white/5 hover:bg-white/10 text-brand-light hover:text-white text-xs font-bold rounded-lg border border-dashed border-white/10 transition-colors"
                        >
                            🔒 Login untuk mengobrol
                        </button>
                    )}
                </div>
            </div>

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    group pointer-events-auto relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all duration-300 hover:scale-110 active:scale-95
                    ${isOpen ? 'bg-brand-secondary text-brand-light' : 'bg-gradient-to-br from-brand-vibrant to-blue-600 text-white'}
                `}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} className={hasUnread ? 'animate-bounce' : ''} />}
                
                {!isOpen && hasUnread && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-brand-primary animate-ping"></span>
                )}
                {!isOpen && hasUnread && (
                     <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-brand-primary flex items-center justify-center text-[8px] font-bold">!</span>
                )}
                
                <span className="absolute right-full mr-3 bg-brand-secondary px-2 py-1 rounded text-xs text-brand-light whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow-xl">
                    Global Chat
                </span>
            </button>
        </div>
    );
};
