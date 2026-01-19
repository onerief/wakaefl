
/* Fix: Removed non-existent import 'uploadMatchProof' from firebaseService as it was causing an error and is unused in this component. */
import React, { useState, useRef, useMemo } from 'react';
import type { Match, Team, MatchComment } from '../../types';
import { Card } from '../shared/Card';
import { MonitorPlay, MessageSquare, Send, ChevronDown, ChevronUp, UserCircle, Save, Plus, Minus, Camera, Loader, Shield, Lock, Star, Layout } from 'lucide-react';
import { ProofModal } from './ProofModal';
import { TeamLogo } from '../shared/TeamLogo';
import type { User } from 'firebase/auth';
import { useToast } from '../shared/Toast';

interface MatchCardProps {
    match: Match;
    onSelectTeam: (team: Team) => void;
    currentUser?: User | null;
    onAddComment?: (matchId: string, text: string) => void;
    isAdminMode?: boolean;
    onUpdateScore?: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => void;
    isAdmin?: boolean;
    userOwnedTeamIds?: string[];
}

export const MatchCard: React.FC<MatchCardProps> = ({ 
    match, onSelectTeam, currentUser, onAddComment, isAdminMode, onUpdateScore, isAdmin,
    userOwnedTeamIds = []
}) => {
    const [showProof, setShowProof] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    
    const [editScoreA, setEditScoreA] = useState(match.scoreA ?? 0);
    const [editScoreB, setEditScoreB] = useState(match.scoreB ?? 0);
    const [editProofUrl, setEditProofUrl] = useState(match.proofUrl ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    const isFinished = match.status === 'finished' && match.scoreA !== null && match.scoreB !== null;
    const hasComments = match.comments && match.comments.length > 0;
    
    const isMyMatch = userOwnedTeamIds.includes(match.teamA.id) || userOwnedTeamIds.includes(match.teamB.id);

    const chatPermissions = useMemo(() => {
        if (!currentUser) return { canChat: false, reason: 'Login untuk chat' };
        if (isAdmin) return { canChat: true, reason: 'Admin Access' };
        if (isFinished) return { canChat: true, reason: 'Public Discussion' };

        const userEmail = currentUser.email?.toLowerCase();
        const isManagerA = match.teamA.ownerEmail?.toLowerCase() === userEmail;
        const isManagerB = match.teamB.ownerEmail?.toLowerCase() === userEmail;

        if (isManagerA || isManagerB) return { canChat: true, reason: 'Team Coordinator' };
        return { canChat: false, reason: 'Khusus Manager Tim' };
    }, [currentUser, isAdmin, isFinished, match.teamA.ownerEmail, match.teamB.ownerEmail]);

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim() && onAddComment && chatPermissions.canChat) {
            onAddComment(match.id, newComment.trim());
            setNewComment('');
        }
    }

    const handleQuickUpdate = async () => {
        if (!onUpdateScore) return;
        setIsSaving(true);
        try {
            await onUpdateScore(match.id, editScoreA, editScoreB, editProofUrl);
            addToast('Skor diperbarui!', 'success');
        } catch (e) {
            addToast('Gagal update.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const QuickScoreControl = ({ val, setVal }: { val: number, setVal: React.Dispatch<React.SetStateAction<number>> }) => (
        <div className="flex items-center bg-black/60 rounded-lg border border-white/10 p-0.5 mt-2 shadow-inner">
            <button 
                onClick={(e) => { e.stopPropagation(); setVal(v => Math.max(0, v - 1)); }} 
                className="p-1.5 text-brand-light hover:text-red-400 active:scale-90 transition-all"
            >
                <Minus size={12} />
            </button>
            <span className="w-6 text-center font-black text-xs text-brand-special">{val}</span>
            <button 
                onClick={(e) => { e.stopPropagation(); setVal(v => v + 1); }} 
                className="p-1.5 text-brand-light hover:text-green-400 active:scale-90 transition-all"
            >
                <Plus size={12} />
            </button>
        </div>
    );

    return (
        <>
            <Card className={`
                !p-0 group border-l-[4px] transition-all duration-300 overflow-visible relative
                ${isAdminMode ? 'border-l-brand-special bg-brand-special/5 shadow-brand-special/5' : isMyMatch ? 'border-l-brand-vibrant bg-brand-vibrant/[0.03] shadow-lg' : 'border-l-transparent'}
                ${isMyMatch ? 'ring-1 ring-brand-vibrant/20 shadow-[0_4px_15px_rgba(37,99,235,0.1)]' : ''}
            `}>
                <div className="flex items-center justify-between px-3 py-1.5 bg-black/30 text-[9px] sm:text-xs text-brand-light border-b border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="font-black uppercase tracking-widest opacity-60 whitespace-nowrap">
                            {match.group && `GRUP ${match.group}`} {match.matchday && ` • DAY ${match.matchday}`}
                        </span>
                        {match.leg && (
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${match.leg === 1 ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                LEG {match.leg}
                            </span>
                        )}
                        {isMyMatch && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-brand-vibrant text-white text-[7px] sm:text-[8px] font-black rounded uppercase shadow-sm animate-pulse shrink-0">
                                <Star size={8} className="fill-white" /> TIM ANDA
                            </span>
                        )}
                    </div>
                    <div className="flex items-center shrink-0 ml-2">
                        <span className={`px-2 py-0.5 text-[8px] sm:text-[9px] font-black rounded-full uppercase border ${
                            match.status === 'finished' ? 'bg-white/5 text-brand-light/60 border-white/10' :
                            match.status === 'live' ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' :
                            'bg-brand-vibrant/10 text-brand-vibrant border-brand-vibrant/30'
                        }`}>
                            {match.status}
                        </span>
                    </div>
                </div>

                <div className="p-3 sm:p-5 flex items-center justify-between gap-1 relative min-h-[110px] sm:min-h-0">
                    <button onClick={() => onSelectTeam(match.teamA)} className={`flex flex-col items-center gap-1.5 flex-1 min-w-0 z-10 transition-transform active:scale-95 ${userOwnedTeamIds.includes(match.teamA.id) ? 'scale-105' : ''}`}>
                        <TeamLogo logoUrl={match.teamA.logoUrl} teamName={match.teamA.name} className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 shadow-xl ${userOwnedTeamIds.includes(match.teamA.id) ? 'ring-2 ring-brand-vibrant ring-offset-2 ring-offset-brand-primary' : 'ring-1 ring-white/10'}`} />
                        <span className={`text-[9px] sm:text-xs md:text-sm font-black w-full text-center uppercase tracking-tight leading-tight line-clamp-2 px-1 ${userOwnedTeamIds.includes(match.teamA.id) ? 'text-brand-vibrant' : 'text-white/90'}`}>
                            {match.teamA.name}
                        </span>
                        {isAdminMode && <QuickScoreControl val={editScoreA} setVal={setEditScoreA} />}
                    </button>

                    <div className="flex flex-col items-center justify-center px-1 sm:px-4 shrink-0 z-20 min-w-[50px] sm:min-w-[80px]">
                        {isAdminMode ? (
                            <button onClick={handleQuickUpdate} disabled={isSaving} className="p-3 bg-brand-special rounded-full text-brand-primary active:scale-90 transition-all shadow-lg hover:rotate-12">
                                {isSaving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                            </button>
                        ) : isFinished ? (
                            <div className="flex items-center gap-1.5 sm:gap-3 text-xl sm:text-4xl font-black text-white bg-black/50 px-2.5 sm:px-5 py-1.5 rounded-xl border border-white/10 italic shadow-2xl tracking-tighter">
                                <span>{match.scoreA}</span>
                                <span className="text-white/20 opacity-50">-</span>
                                <span>{match.scoreB}</span>
                            </div>
                        ) : (
                            <div className="bg-brand-vibrant/10 border border-brand-vibrant/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                <span className="text-[10px] sm:text-base font-black text-brand-vibrant italic tracking-widest">VS</span>
                            </div>
                        )}
                    </div>

                    <button onClick={() => onSelectTeam(match.teamB)} className={`flex flex-col items-center gap-1.5 flex-1 min-w-0 z-10 transition-transform active:scale-95 ${userOwnedTeamIds.includes(match.teamB.id) ? 'scale-105' : ''}`}>
                        <TeamLogo logoUrl={match.teamB.logoUrl} teamName={match.teamB.name} className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 shadow-xl ${userOwnedTeamIds.includes(match.teamB.id) ? 'ring-2 ring-brand-vibrant ring-offset-2 ring-offset-brand-primary' : 'ring-1 ring-white/10'}`} />
                        <span className={`text-[9px] sm:text-xs md:text-sm font-black w-full text-center uppercase tracking-tight leading-tight line-clamp-2 px-1 ${userOwnedTeamIds.includes(match.teamB.id) ? 'text-brand-vibrant' : 'text-white/90'}`}>
                            {match.teamB.name}
                        </span>
                        {isAdminMode && <QuickScoreControl val={editScoreB} setVal={setEditScoreB} />}
                    </button>
                </div>

                <div className="flex items-center justify-between px-3 py-2 bg-black/40 border-t border-white/5">
                    <div className="flex gap-4">
                        {match.proofUrl && (
                            <button 
                                onClick={() => setShowProof(true)}
                                className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black text-brand-vibrant uppercase hover:text-white transition-colors"
                            >
                                <MonitorPlay size={14} /> <span className="hidden sm:inline">Bukti</span>
                            </button>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setShowComments(!showComments)}
                        className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase transition-all py-1 px-2 rounded-lg hover:bg-white/5 ${showComments ? 'text-brand-vibrant bg-white/5' : 'text-brand-light hover:text-white'}`}
                    >
                        <div className="relative">
                            <MessageSquare size={16} />
                            {hasComments && !showComments && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-vibrant rounded-full border-2 border-brand-primary animate-pulse"></span>
                            )}
                        </div>
                        {match.comments?.length || 0} <span className="hidden sm:inline">Komentar</span>
                    </button>
                </div>

                {showComments && (
                    <div className="bg-black/60 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                        <div className="max-h-40 sm:max-h-48 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                            {hasComments ? (
                                match.comments?.map((comment) => (
                                    <div key={comment.id} className="flex gap-2">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <UserCircle size={16} className={comment.isAdmin ? 'text-brand-special' : 'text-brand-vibrant'} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[10px] font-black uppercase truncate ${comment.isAdmin ? 'text-brand-special' : 'text-brand-light'}`}>
                                                    {comment.userName}
                                                </span>
                                                <span className="text-[8px] text-white/20">
                                                    {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-brand-text leading-relaxed break-words">{comment.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] text-brand-light/30 italic text-center py-4">Belum ada obrolan di pertandingan ini.</p>
                            )}
                        </div>

                        <div className="p-2 sm:p-3 bg-brand-secondary/30 border-t border-white/5">
                            {chatPermissions.canChat ? (
                                <form onSubmit={handleSubmitComment} className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Ketik pesan..."
                                        className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-brand-vibrant focus:ring-1 focus:ring-brand-vibrant transition-all"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!newComment.trim()}
                                        className="p-2.5 bg-brand-vibrant text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:grayscale active:scale-90 transition-all shadow-lg"
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            ) : (
                                <div className="flex items-center justify-center gap-2 py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-brand-light/40 bg-black/20 rounded-xl border border-dashed border-white/5 italic">
                                    <Lock size={12} /> {chatPermissions.reason}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {match.summary && (
                    <div className="bg-brand-vibrant/5 px-3 py-2 border-t border-white/5">
                        <p className="text-[9px] sm:text-[11px] text-brand-light italic leading-relaxed">
                             <span className="text-brand-vibrant font-black not-italic mr-1.5 uppercase tracking-tighter">AI Recap:</span> {match.summary}
                        </p>
                    </div>
                )}
            </Card>
            {(match.proofUrl || editProofUrl) && (
                <ProofModal isOpen={showProof} onClose={() => setShowProof(false)} imageUrl={editProofUrl || match.proofUrl || ''} />
            )}
        </>
    )
}
