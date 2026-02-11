
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User as UserIcon, Shield, AlertCircle } from 'lucide-react';
import type { User } from 'firebase/auth';
import { subscribeToGlobalChat, sendGlobalChatMessage, getUserTeams } from '../../services/firebaseService';
import type { ChatMessage } from '../../types';

interface GlobalChatProps {
  currentUser: User | null;
  isAdmin: boolean;
  onLoginRequest: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const GlobalChat: React.FC<GlobalChatProps> = ({ currentUser, isAdmin, onLoginRequest, isOpen, onToggle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userTeamName, setUserTeamName] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToGlobalChat((msgs) => {
        setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      const fetchTeam = async () => {
          if (currentUser?.email) {
              const teams = await getUserTeams(currentUser.email);
              if (teams.length > 0) {
                  setUserTeamName(teams[0].team.name);
              }
          }
      };
      if (currentUser) fetchTeam();
      else setUserTeamName(undefined);
  }, [currentUser]);

  useEffect(() => {
      if (isOpen) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !currentUser) return;

      setIsSending(true);
      try {
          await sendGlobalChatMessage(newMessage.trim(), currentUser, isAdmin, userTeamName);
          setNewMessage('');
      } catch (error) {
          console.error("Failed to send message:", error);
      } finally {
          setIsSending(false);
      }
  };

  const formatMessageText = (text: string) => {
      // Regex to find URLs (http/https)
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      
      const parts = text.split(urlRegex);
      
      return parts.map((part, index) => {
          if (part.match(urlRegex)) {
              return (
                  <a 
                      key={index} 
                      href={part} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-brand-special underline hover:text-white break-all"
                  >
                      {part}
                  </a>
              );
          }
          return part;
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-[100px] right-0 left-0 sm:left-auto sm:right-4 z-[60] sm:w-[400px] px-4 sm:px-0 animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-none">
        <div className="pointer-events-auto bg-brand-primary/95 backdrop-blur-xl border border-brand-vibrant/30 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[60vh] max-h-[600px]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-brand-secondary/80 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-vibrant/20 rounded-xl text-brand-vibrant">
                        <MessageCircle size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Global Chat</h3>
                        <p className="text-[10px] text-brand-light font-bold uppercase tracking-widest opacity-60">Komunitas Way Kanan</p>
                    </div>
                </div>
                <button onClick={onToggle} className="p-2 hover:bg-white/10 rounded-full transition-colors text-brand-light hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/20">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-brand-light/20 opacity-50">
                        <MessageCircle size={48} />
                        <p className="text-xs font-black uppercase tracking-widest mt-2">Belum ada pesan</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = currentUser?.uid === msg.userId;
                        return (
                            <div key={msg.id} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-secondary border border-white/10 shrink-0 flex items-center justify-center">
                                    {msg.userPhoto ? (
                                        <img src={msg.userPhoto} alt={msg.userName} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon size={14} className="text-brand-light" />
                                    )}
                                </div>
                                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[9px] font-bold text-brand-light/70 uppercase tracking-wider">{msg.userName}</span>
                                        {msg.isAdmin && <Shield size={10} className="text-brand-special fill-brand-special" />}
                                        {msg.userTeamName && (
                                            <span className="text-[8px] bg-white/5 px-1.5 rounded text-brand-light/50 border border-white/5 uppercase font-black tracking-tight">{msg.userTeamName}</span>
                                        )}
                                    </div>
                                    <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                                        isMe 
                                        ? 'bg-brand-vibrant text-white rounded-tr-none' 
                                        : msg.isAdmin 
                                            ? 'bg-brand-special/20 text-brand-special border border-brand-special/30 rounded-tl-none'
                                            : 'bg-white/10 text-brand-text rounded-tl-none'
                                    }`}>
                                        {formatMessageText(msg.text)}
                                    </div>
                                    <span className="text-[8px] text-brand-light/30 mt-1 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-brand-secondary/50 border-t border-white/5">
                {currentUser ? (
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Kirim pesan..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-brand-light/30 focus:border-brand-vibrant outline-none transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={!newMessage.trim() || isSending}
                            className="bg-brand-vibrant hover:bg-blue-600 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-brand-vibrant/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                ) : (
                    <div className="flex items-center justify-between bg-brand-vibrant/10 border border-brand-vibrant/20 p-3 rounded-xl">
                        <div className="flex items-center gap-2 text-brand-vibrant">
                            <AlertCircle size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Login untuk chat</span>
                        </div>
                        <button onClick={onLoginRequest} className="bg-brand-vibrant text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 transition-colors">
                            Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
