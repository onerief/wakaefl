
import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { Match, Team, MatchComment } from '../../types';
import { Card } from '../shared/Card';
import { MonitorPlay, MessageSquare, Send, UserCircle, Save, Plus, Minus, Camera, Loader, Shield, Lock, Star, Layout, MapPin, Clock } from 'lucide-react';
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

    // Auto-scroll comments
    const commentsEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (showComments && commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [showComments, match.comments]);

    const chatPermissions = useMemo(() => {
        if (!currentUser) return { canChat: false, reason: 'Login untuk chat' };
        if (isAdmin) return { canChat: true, reason: 'Akses Admin' };
        if (isFinished) return { canChat: true, reason: 'Publik Diskusi' };
        const userEmail = currentUser.email?.toLowerCase();
        return (match.teamA.ownerEmail?.toLowerCase() === userEmail || match.teamB.ownerEmail?.toLowerCase() === userEmail)
            ? { canChat: true, reason: 'Kordinasi Tim' }
            : { canChat: false, reason: 'Khusus Manager' };
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

    const QuickScoreControl = ({ val, setVal, label }: { val: number, setVal: React.Dispatch<React.SetStateAction<number>>, label: string }) => (
        <div className="flex flex-col items-center mt-1.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center bg-black/60 rounded-lg border border-white/10 p-0.5">
                <button onClick={(e) => { e.stopPropagation(); setVal(v => Math.max(0, v - 1)); }} className="p-1 text-brand-light hover:text-red-400 transition-all"><Minus size={10} /></button>
                <span className="w-4 text-center font-black text-[10px] text-brand-special">{val}</span>
                <button onClick={(e) => { e.stopPropagation(); setVal(v => v + 1); }} className="p-1 text-brand-light hover:text-green-400 transition-all"><Plus size={10} /></button>
            </div>
        </div>
    );

    return (
        <>
            <Card className={`!p-0 group transition-all duration-300 relative border border-white/5 overflow-hidden ${isAdminMode ? 'ring-1 ring-brand-special/50' : isMyMatch ? 'ring-1 ring-brand-vibrant/30' : ''}`}>
                <div className="flex items-center justify-between px-3 py-1 bg-black/40 text-[7px] sm:text-[9px] border-b border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="font-black uppercase tracking-widest text-brand-light opacity-60 truncate">
                            M{match.matchday} • {match.leg === 1 ? 'L1' : 'L2'}
                        </span>
                        {isMyMatch && (
                            <span className="flex items-center gap-1 px-1 py-0.5 bg-brand-vibrant text-white font-black rounded-md uppercase animate-pulse scale-[0.8] sm:scale-100 origin-left">
                                <Star size={8} className="fill-white" /> My Match
                            </span>
                        )}
                        {match.summary && match.summary.includes('WO') && (
                            <span className="text-red-400 font-bold ml-1 flex items-center gap-1"><Clock size={8}/> WO SYSTEM</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-1 py-0.5 font-black rounded uppercase border text-[6px] sm:text-[8px] ${match.status === 'finished' ? 'bg-white/5 text-brand-light/60 border-white/10' : match.status === 'live' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-brand-vibrant/10 text-brand-vibrant border-brand-vibrant/30'}`}>
                            {match.status}
                        </span>
                    </div>
                </div>

                <div className="p-2 sm:p-5 flex items-center justify-between gap-1 relative bg-gradient-to-br from-brand-secondary/20 to-transparent">
                    <button onClick={() => onSelectTeam(match.teamA)} className="flex flex-col items-center gap-1 flex-1 min-w-0 z-10 transition-all active:scale-95 group/team">
                        <div className="relative">
                            <TeamLogo logoUrl={match.teamA.logoUrl} teamName={match.teamA.name} className="w-9 h-9 sm:w-16 sm:h-16 shadow-2xl ring-2 ring-brand-vibrant/20 group-hover/team:ring-brand-vibrant transition-all" />
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-5 sm:h-5 bg-brand-vibrant rounded-full flex items-center justify-center border-2 border-brand-primary shadow-lg">
                                <span className="text-[6px] sm:text-[8px] font-black text-white">H</span>
                            </div>
                        </div>
                        <span className="text-[8px] sm:text-xs font-black text-white uppercase truncate w-full text-center px-0.5 italic">{match.teamA.name}</span>
                        {isAdminMode && <QuickScoreControl val={editScoreA} setVal={setEditScoreA} label="A" />}
                    </button>

                    <div className="flex flex-col items-center justify-center px-1 sm:px-4 shrink-0 z-20 min-w-[40px] sm:min-w-[60px]">
                        {isAdminMode ? (
                            <button onClick={handleQuickUpdate} disabled={isSaving} className="w-8 h-8 sm:w-12 sm:h-12 bg-brand-special rounded-lg sm:rounded-xl text-brand-primary active:scale-90 transition-all flex items-center justify-center shadow-xl">
                                {isSaving ? <Loader className="animate-spin" size={14} /> : <Save size={14} />}
                            </button>
                        ) : isFinished ? (
                            <div className="flex flex-col items-center gap-0.5">
                                <div className="flex items-center gap-1 sm:gap-2 text-base sm:text-4xl font-black text-white bg-black/60 px-2 sm:px-6 py-1 sm:py-2 rounded-lg sm:rounded-2xl border border-white/10 italic shadow-inner">
                                    <span className={match.scoreA! > match.scoreB! ? 'text-brand-vibrant' : ''}>{match.scoreA}</span>
                                    <span className="opacity-10 text-xs sm:text-xl">-</span>
                                    <span className={match.scoreB! > match.scoreA! ? 'text-brand-vibrant' : ''}>{match.scoreB}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="bg-brand-vibrant/10 border border-brand-vibrant/20 px-2 py-0.5 sm:py-1.5 rounded-md sm:rounded-xl">
                                    <span className="text-[10px] sm:text-xl font-black text-brand-vibrant italic">VS</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={() => onSelectTeam(match.teamB)} className="flex flex-col items-center gap-1 flex-1 min-w-0 z-10 transition-all active:scale-95 group/team">
                        <div className="relative">
                            <TeamLogo logoUrl={match.teamB.logoUrl} teamName={match.teamB.name} className="w-9 h-9 sm:w-16 sm:h-16 shadow-2xl ring-2 ring-white/5 group-hover/team:ring-brand-light transition-all" />
                            <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 sm:w-5 sm:h-5 bg-brand-accent rounded-full flex items-center justify-center border-2 border-brand-primary shadow-lg">
                                <span className="text-[6px] sm:text-[8px] font-black text-brand-light">A</span>
                            </div>
                        </div>
                        <span className="text-[8px] sm:text-xs font-black text-white uppercase truncate w-full text-center px-0.5 italic">{match.teamB.name}</span>
                        {isAdminMode && <QuickScoreControl val={editScoreB} setVal={setEditScoreB} label="B" />}
                    </button>
                </div>

                <div className="flex items-center justify-between px-3 py-1 sm:py-2 bg-black/50 border-t border-white/5">
                    <div className="flex gap-2 sm:gap-4">
                        {match.proofUrl && (
                            <button onClick={() => setShowProof(true)} className="flex items-center gap-1 text-[7px] sm:text-[9px] font-black text-brand-vibrant uppercase hover:text-white transition-all">
                                <MonitorPlay size={10} className="sm:w-3.5 sm:h-3.5" /> <span>Video/SS Pertandingan</span>
                            </button>
                        )}
                        {hasComments && (
                            <span className="text-[6px] sm:text-[8px] font-black text-brand-light/40 uppercase self-center">{match.comments?.length} CHATS</span>
                        )}
                    </div>
                    
                    <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-1 text-[7px] sm:text-[9px] font-black uppercase transition-all py-1 px-2 rounded-md border ${showComments ? 'bg-brand-vibrant text-white border-brand-vibrant' : 'bg-white/5 text-brand-light border-white/5'}`}>
                        <MessageSquare size={10} className="sm:w-3 sm:h-3" />
                        <span>Chat</span>
                    </button>
                </div>

                {showComments && (
                    <div className="bg-neutral-900 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
                        <div className="max-h-36 sm:max-h-56 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {hasComments ? (
                                match.comments?.map((comment) => (
                                    <div key={comment.id} className={`flex flex-col gap-0.5 ${comment.userId === currentUser?.uid ? 'items-end' : 'items-start'}`}>
                                        <span className={`text-[9px] font-black uppercase ${comment.userId === currentUser?.uid ? 'text-brand-vibrant' : comment.isAdmin ? 'text-brand-special' : 'text-brand-light/70'}`}>
                                            {comment.userName}{comment.isAdmin ? ' (Admin)' : ''}
                                        </span>
                                        <div className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs leading-relaxed break-words max-w-[90%] font-medium ${
                                            comment.userId === currentUser?.uid 
                                            ? 'bg-brand-vibrant/20 text-white border border-brand-vibrant/30 rounded-tr-none' 
                                            : 'bg-white/10 text-brand-text border border-white/5 rounded-tl-none'
                                        }`}>
                                            {comment.text}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-[9px] font-black text-brand-light/30 uppercase tracking-widest italic">Belum ada diskusi</div>
                            )}
                            <div ref={commentsEndRef} />
                        </div>
                        <div className="p-2 bg-black/60 border-t border-white/5">
                            {chatPermissions.canChat ? (
                                <form onSubmit={handleSubmitComment} className="flex gap-2">
                                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Tulis komentar..." className="flex-grow bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] sm:text-xs text-white focus:border-brand-vibrant outline-none placeholder:text-brand-light/30 focus:bg-black transition-colors" />
                                    <button type="submit" disabled={!newComment.trim()} className="p-2 bg-brand-vibrant text-white rounded-lg transition-all active:scale-95 disabled:opacity-50"><Send size={14} /></button>
                                </form>
                            ) : (
                                <div className="text-center text-[8px] text-brand-light/40 uppercase italic flex items-center justify-center gap-1 py-1"><Lock size={10} /> {chatPermissions.reason}</div>
                            )}
                        </div>
                    </div>
                )}
            </Card>
            {(match.proofUrl || editProofUrl) && (
                <ProofModal isOpen={showProof} onClose={() => setShowProof(false)} imageUrl={editProofUrl || match.proofUrl || ''} />
            )}
        </>
    )
}
