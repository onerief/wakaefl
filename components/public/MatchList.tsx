
import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { Match, Team, MatchComment } from '../../types';
import { Card } from '../shared/Card';
import { MonitorPlay, MessageSquare, Send, UserCircle, Save, Plus, Minus, Camera, Loader, Shield, Lock, Star, Layout, MapPin, Clock, Upload, MessageCircle } from 'lucide-react';
import { ProofModal } from './ProofModal';
import { TeamLogo } from '../shared/TeamLogo';
import type { User } from 'firebase/auth';
import { useToast } from '../shared/Toast';
import { uploadMatchProof } from '../../services/firebaseService';

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
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    const isFinished = match.status === 'finished' && match.scoreA !== null && match.scoreB !== null;
    const hasComments = match.comments && match.comments.length > 0;
    
    // Check if this match involves the user's team
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onUpdateScore) return;

        if (file.size > 2 * 1024 * 1024) {
            addToast('Ukuran file maksimal 2MB', 'error');
            return;
        }

        setIsUploading(true);
        try {
            const url = await uploadMatchProof(file);
            // Just update the proof URL, keep existing scores
            await onUpdateScore(match.id, match.scoreA ?? 0, match.scoreB ?? 0, url);
            addToast('Bukti berhasil diupload!', 'success');
        } catch (e: any) {
            addToast(e.message || 'Gagal mengupload bukti.', 'error');
        } finally {
            setIsUploading(false);
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
            <Card className={`!p-0 group transition-all duration-300 relative border overflow-hidden ${
                isAdminMode 
                    ? 'ring-1 ring-brand-special/50 border-brand-special/30' 
                    : isMyMatch 
                        ? 'border-brand-special/50 bg-brand-special/[0.03] shadow-[0_0_20px_rgba(253,224,71,0.15)] border-l-4 border-l-brand-special' 
                        : 'border-white/5'
            }`}>
                {/* Header with improved status badges */}
                <div className="flex items-center justify-between px-3 py-2 bg-black/40 border-b border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                         <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                             match.status === 'finished' ? 'bg-white/5 text-brand-light/70 border-white/10' : 
                             match.status === 'live' ? 'bg-red-500/20 text-red-500 border-red-500/30 animate-pulse' : 
                             'bg-brand-vibrant/10 text-brand-vibrant border-brand-vibrant/20'
                         }`}>
                             {match.status === 'scheduled' ? 'Jadwal' : match.status === 'live' ? 'Live' : 'Selesai'}
                         </span>
                         {isMyMatch && <span className="text-[8px] text-brand-special font-bold flex items-center gap-1 uppercase tracking-wider animate-pulse"><Star size={8} fill="currentColor"/> Match Anda</span>}
                         {match.summary && match.summary.includes('WO') && (
                            <span className="text-[8px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1 border border-red-500/20 px-1.5 py-0.5 rounded bg-red-500/10">WO</span>
                        )}
                    </div>
                    <span className="text-[9px] font-bold text-brand-light/30 font-mono tracking-widest">
                        #{match.id.slice(-4)}
                    </span>
                </div>

                <div className="p-4 sm:p-6 flex items-center justify-between gap-2 relative bg-gradient-to-br from-brand-secondary/20 to-transparent">
                    
                    {/* Team A */}
                    <button onClick={() => onSelectTeam(match.teamA)} className="flex-1 flex flex-col items-center gap-3 group/team transition-all active:scale-95">
                        <div className="relative">
                            <TeamLogo logoUrl={match.teamA.logoUrl} teamName={match.teamA.name} className="w-12 h-12 sm:w-16 sm:h-16 shadow-2xl ring-2 ring-transparent group-hover/team:ring-brand-vibrant/50 transition-all" />
                            {match.status === 'scheduled' && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-vibrant rounded-full flex items-center justify-center text-[7px] font-black text-white shadow-lg border border-black">H</div>}
                        </div>
                        <span className="text-[10px] sm:text-xs font-black text-white uppercase leading-tight line-clamp-2 text-center group-hover/team:text-brand-vibrant transition-colors px-1">{match.teamA.name}</span>
                        {isAdminMode && <QuickScoreControl val={editScoreA} setVal={setEditScoreA} label="A" />}
                    </button>

                    {/* Score Board / VS */}
                    <div className="shrink-0 px-2 flex flex-col items-center justify-center min-w-[60px]">
                        {isAdminMode ? (
                            <button onClick={handleQuickUpdate} disabled={isSaving} className="w-10 h-10 rounded-full bg-brand-special text-brand-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-90">
                                {isSaving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                            </button>
                        ) : isFinished ? (
                             <div className="flex items-center gap-3 text-2xl sm:text-4xl font-black italic text-white">
                                 <span className={match.scoreA! > match.scoreB! ? 'text-brand-vibrant drop-shadow-[0_0_15px_rgba(37,99,235,0.6)]' : 'text-white/80'}>{match.scoreA}</span>
                                 <span className="text-brand-light/20 text-xl font-light">-</span>
                                 <span className={match.scoreB! > match.scoreA! ? 'text-brand-vibrant drop-shadow-[0_0_15px_rgba(37,99,235,0.6)]' : 'text-white/80'}>{match.scoreB}</span>
                             </div>
                        ) : (
                             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-brand-light/50 border border-white/5 italic">
                                 VS
                             </div>
                        )}
                    </div>

                    {/* Team B */}
                    <button onClick={() => onSelectTeam(match.teamB)} className="flex-1 flex flex-col items-center gap-3 group/team transition-all active:scale-95">
                        <div className="relative">
                            <TeamLogo logoUrl={match.teamB.logoUrl} teamName={match.teamB.name} className="w-12 h-12 sm:w-16 sm:h-16 shadow-2xl ring-2 ring-transparent group-hover/team:ring-brand-vibrant/50 transition-all" />
                            {match.status === 'scheduled' && <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-brand-secondary rounded-full flex items-center justify-center text-[7px] font-black text-white shadow-lg border border-black">A</div>}
                        </div>
                        <span className="text-[10px] sm:text-xs font-black text-white uppercase leading-tight line-clamp-2 text-center group-hover/team:text-brand-vibrant transition-colors px-1">{match.teamB.name}</span>
                        {isAdminMode && <QuickScoreControl val={editScoreB} setVal={setEditScoreB} label="B" />}
                    </button>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between px-3 py-2 bg-black/30 border-t border-white/5">
                    <div className="flex gap-3">
                        {match.proofUrl ? (
                            <button onClick={() => setShowProof(true)} className="flex items-center gap-1.5 text-[9px] font-bold text-brand-vibrant uppercase hover:text-white transition-all">
                                <MonitorPlay size={12} /> <span>Lihat Bukti</span>
                            </button>
                        ) : (
                            isMyMatch && !isFinished && (
                                <>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileUpload}
                                    />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()} 
                                        disabled={isUploading}
                                        className="flex items-center gap-1.5 text-[9px] font-bold text-brand-light uppercase hover:text-white transition-all disabled:opacity-50"
                                    >
                                        {isUploading ? <Loader className="animate-spin" size={12} /> : <Camera size={12} />}
                                        <span>Upload SS</span>
                                    </button>
                                </>
                            )
                        )}
                        {hasComments && (
                            <span className="text-[9px] font-bold text-brand-light/40 uppercase self-center flex items-center gap-1">
                                <MessageCircle size={10} /> {match.comments?.length}
                            </span>
                        )}
                    </div>
                    
                    <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-1 text-[9px] font-bold uppercase transition-all py-1 px-2.5 rounded-lg border ${showComments ? 'bg-brand-vibrant text-white border-brand-vibrant' : 'bg-white/5 text-brand-light border-white/5 hover:bg-white/10'}`}>
                        <span>Chat Room</span>
                    </button>
                </div>

                {showComments && (
                    <div className="bg-neutral-900 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
                        <div className="max-h-40 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {hasComments ? (
                                match.comments?.map((comment) => (
                                    <div key={comment.id} className={`flex flex-col gap-0.5 ${comment.userId === currentUser?.uid ? 'items-end' : 'items-start'}`}>
                                        <span className={`text-[8px] font-black uppercase tracking-wider ${comment.userId === currentUser?.uid ? 'text-brand-vibrant' : comment.isAdmin ? 'text-brand-special' : 'text-brand-light/70'}`}>
                                            {comment.userName}{comment.isAdmin ? ' (Admin)' : ''}
                                        </span>
                                        <div className={`px-2.5 py-1.5 rounded-lg text-[10px] leading-relaxed break-words max-w-[90%] font-medium ${
                                            comment.userId === currentUser?.uid 
                                            ? 'bg-brand-vibrant/20 text-white border border-brand-vibrant/30 rounded-tr-none' 
                                            : 'bg-white/10 text-brand-text border border-white/5 rounded-tl-none'
                                        }`}>
                                            {comment.text}
                                        </div>
                                        <span className="text-[8px] text-brand-light/30 mt-0.5 font-mono">
                                            {new Date(comment.timestamp).toLocaleString('id-ID', { 
                                                day: 'numeric', 
                                                month: 'short', 
                                                year: 'numeric', 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}
                                        </span>
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
                                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Tulis komentar..." className="flex-grow bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-brand-vibrant outline-none placeholder:text-brand-light/30 focus:bg-black transition-colors" />
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
