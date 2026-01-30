
import React, { useState, useRef, useMemo } from 'react';
import type { Match, Team, MatchComment } from '../../types';
import { Card } from '../shared/Card';
import { MonitorPlay, MessageSquare, Send, UserCircle, Save, Plus, Minus, Camera, Loader, Shield, Lock, Star, Layout, MapPin } from 'lucide-react';
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
        <div className="flex flex-col items-center mt-2">
            <div className="flex items-center bg-black/60 rounded-lg border border-white/10 p-0.5">
                <button onClick={(e) => { e.stopPropagation(); setVal(v => Math.max(0, v - 1)); }} className="p-1.5 text-brand-light hover:text-red-400 transition-all"><Minus size={12} /></button>
                <span className="w-6 text-center font-black text-sm text-brand-special">{val}</span>
                <button onClick={(e) => { e.stopPropagation(); setVal(v => v + 1); }} className="p-1.5 text-brand-light hover:text-green-400 transition-all"><Plus size={12} /></button>
            </div>
        </div>
    );

    return (
        <>
            <Card className={`!p-0 group transition-all duration-300 relative border border-white/5 overflow-hidden ${isAdminMode ? 'ring-1 ring-brand-special/50' : isMyMatch ? 'ring-1 ring-brand-vibrant/30' : ''}`}>
                {/* Header Status Bar */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 text-[8px] sm:text-[9px] border-b border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="font-black uppercase tracking-widest text-brand-light opacity-60 truncate">
                            Matchday {match.matchday} • {match.leg === 1 ? 'Leg 1' : 'Leg 2'}
                        </span>
                        {isMyMatch && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-brand-vibrant text-white font-black rounded-md uppercase animate-pulse">
                                <Star size={8} className="fill-white" /> My Match
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 font-black rounded uppercase border ${match.status === 'finished' ? 'bg-white/5 text-brand-light/60 border-white/10' : match.status === 'live' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-brand-vibrant/10 text-brand-vibrant border-brand-vibrant/30'}`}>
                            {match.status}
                        </span>
                    </div>
                </div>

                {/* Home Away Labels - New Section */}
                <div className="flex justify-between px-4 sm:px-10 pt-4 pointer-events-none">
                    <div className="flex items-center gap-1.5 text-brand-vibrant">
                        <MapPin size={10} className="fill-brand-vibrant/20" />
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase italic">Home</span>
                    </div>
                    <div className="text-brand-light/40">
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase italic">Away</span>
                    </div>
                </div>

                {/* Teams & Scores Section */}
                <div className="p-3 sm:p-5 pt-1 sm:pt-2 flex items-center justify-between gap-1 relative bg-gradient-to-br from-brand-secondary/20 to-transparent">
                    {/* Team A (HOME) */}
                    <button onClick={() => onSelectTeam(match.teamA)} className="flex flex-col items-center gap-2 flex-1 min-w-0 z-10 transition-all active:scale-95 group/team">
                        <div className="relative">
                            <TeamLogo logoUrl={match.teamA.logoUrl} teamName={match.teamA.name} className="w-12 h-12 sm:w-16 sm:h-16 shadow-2xl ring-2 ring-brand-vibrant/20 group-hover/team:ring-brand-vibrant transition-all" />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-vibrant rounded-full flex items-center justify-center border-2 border-brand-primary shadow-lg">
                                <span className="text-[8px] font-black text-white">H</span>
                            </div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-black text-white uppercase truncate w-full text-center px-1 italic">{match.teamA.name}</span>
                        {isAdminMode && <QuickScoreControl val={editScoreA} setVal={setEditScoreA} label="A" />}
                    </button>

                    <div className="flex flex-col items-center justify-center px-4 shrink-0 z-20 min-w-[60px]">
                        {isAdminMode ? (
                            <button onClick={handleQuickUpdate} disabled={isSaving} className="w-12 h-12 bg-brand-special rounded-xl text-brand-primary active:scale-90 transition-all flex items-center justify-center shadow-xl">
                                {isSaving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                            </button>
                        ) : isFinished ? (
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2 text-2xl sm:text-4xl font-black text-white bg-black/60 px-4 sm:px-6 py-2 rounded-2xl border border-white/10 italic shadow-inner">
                                    <span className={match.scoreA! > match.scoreB! ? 'text-brand-vibrant drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]' : ''}>{match.scoreA}</span>
                                    <span className="opacity-10 text-lg sm:text-xl">-</span>
                                    <span className={match.scoreB! > match.scoreA! ? 'text-brand-vibrant drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]' : ''}>{match.scoreB}</span>
                                </div>
                                <span className="text-[7px] font-black text-brand-light/30 uppercase tracking-[0.3em]">Full Time</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <div className="bg-brand-vibrant/10 border border-brand-vibrant/20 px-4 py-1.5 rounded-xl">
                                    <span className="text-sm sm:text-xl font-black text-brand-vibrant italic tracking-widest">VS</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Team B (AWAY) */}
                    <button onClick={() => onSelectTeam(match.teamB)} className="flex flex-col items-center gap-2 flex-1 min-w-0 z-10 transition-all active:scale-95 group/team">
                        <div className="relative">
                            <TeamLogo logoUrl={match.teamB.logoUrl} teamName={match.teamB.name} className="w-12 h-12 sm:w-16 sm:h-16 shadow-2xl ring-2 ring-white/5 group-hover/team:ring-brand-light transition-all" />
                            <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-brand-accent rounded-full flex items-center justify-center border-2 border-brand-primary shadow-lg">
                                <span className="text-[8px] font-black text-brand-light">A</span>
                            </div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-black text-white uppercase truncate w-full text-center px-1 italic">{match.teamB.name}</span>
                        {isAdminMode && <QuickScoreControl val={editScoreB} setVal={setEditScoreB} label="B" />}
                    </button>
                </div>

                {/* Compact Actions Bar */}
                <div className="flex items-center justify-between px-3 py-2 bg-black/50 border-t border-white/5">
                    <div className="flex gap-4">
                        {match.proofUrl && (
                            <button onClick={() => setShowProof(true)} className="flex items-center gap-1.5 text-[9px] font-black text-brand-vibrant uppercase hover:text-white transition-all group/btn">
                                <MonitorPlay size={14} className="group-hover/btn:scale-110 transition-transform" /> Bukti Laga
                            </button>
                        )}
                        {hasComments && (
                            <span className="text-[8px] font-black text-brand-light/40 uppercase self-center">{match.comments?.length} CHATS</span>
                        )}
                    </div>
                    
                    <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-1.5 text-[9px] font-black uppercase transition-all py-1.5 px-3 rounded-lg border ${showComments ? 'bg-brand-vibrant text-white border-brand-vibrant shadow-lg' : 'bg-white/5 text-brand-light border-white/5 hover:border-brand-vibrant/30'}`}>
                        <MessageSquare size={12} />
                        <span>Diskusi</span>
                    </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="bg-black/80 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
                        <div className="max-h-48 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                            {hasComments ? (
                                match.comments?.map((comment) => (
                                    <div key={comment.id} className="flex gap-2">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border text-[10px] shrink-0 ${comment.isAdmin ? 'bg-brand-special/10 border-brand-special/30 text-brand-special' : 'bg-brand-vibrant/10 border-brand-vibrant/20 text-brand-vibrant'}`}><UserCircle size={14} /></div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-0.5"><span className={`text-[8px] font-black uppercase truncate ${comment.isAdmin ? 'text-brand-special' : 'text-brand-light'}`}>{comment.userName}</span></div>
                                            <div className="bg-white/[0.03] p-2 rounded-lg rounded-tl-none border border-white/5"><p className="text-[10px] text-brand-text leading-tight">{comment.text}</p></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-[8px] font-black text-brand-light/20 uppercase">Belum ada diskusi</div>
                            )}
                        </div>
                        <div className="p-3 bg-brand-secondary/40 border-t border-white/5">
                            {chatPermissions.canChat ? (
                                <form onSubmit={handleSubmitComment} className="flex gap-2">
                                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Tulis komentar..." className="flex-grow bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:border-brand-vibrant outline-none" />
                                    <button type="submit" disabled={!newComment.trim()} className="p-2 bg-brand-vibrant text-white rounded-xl hover:bg-blue-600 disabled:opacity-20 transition-all"><Send size={14} /></button>
                                </form>
                            ) : (
                                <div className="text-center py-1 text-[8px] font-black text-brand-light/30 uppercase italic flex items-center justify-center gap-2"><Lock size={10} /> {chatPermissions.reason}</div>
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
