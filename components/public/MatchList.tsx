

import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { Match, Team, MatchComment, TournamentMode, ScheduleSettings } from '../../types';
import { Card } from '../shared/Card';
import { MonitorPlay, MessageSquare, Send, UserCircle, Save, Plus, Minus, Camera, Loader, Shield, Lock, Star, Layout, MapPin, Clock, Upload, MessageCircle, Calendar, CloudSun, Trophy } from 'lucide-react';
import { ProofModal } from './ProofModal';
import { TeamLogo } from '../shared/TeamLogo';
import type { User } from 'firebase/auth';
import { useToast } from '../shared/Toast';
import { uploadMatchProof, updateMatchProof } from '../../services/firebaseService';

interface MatchCardProps {
    match: Match;
    onSelectTeam: (team: Team) => void;
    currentUser?: User | null;
    onAddComment?: (matchId: string, text: string) => void;
    isAdminMode?: boolean;
    onUpdateScore?: (matchId: string, scoreA: number, scoreB: number, proofUrl?: string) => void;
    isAdmin?: boolean;
    userOwnedTeamIds?: string[];
    mode?: TournamentMode;
    scheduleSettings?: ScheduleSettings;
    teamAStanding?: any;
    teamBStanding?: any;
}

export const MatchCard: React.FC<MatchCardProps> = ({ 
    match, onSelectTeam, currentUser, onAddComment, isAdminMode, onUpdateScore, isAdmin,
    userOwnedTeamIds = [], mode, scheduleSettings, teamAStanding, teamBStanding
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
            await onUpdateScore(match.id, match.scoreA ?? 0, match.scoreB ?? 0, url);
            if (mode) {
                await updateMatchProof(mode, match.id, url);
            }
            addToast('Bukti berhasil diupload!', 'success');
        } catch (e: any) {
            addToast(e.message || 'Gagal mengupload bukti.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const QuickScoreControl = ({ val, setVal }: { val: number, setVal: React.Dispatch<React.SetStateAction<number>> }) => (
        <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-1 mt-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={(e) => { e.stopPropagation(); setVal(v => Math.max(0, v - 1)); }} className="p-1 text-brand-light hover:text-red-400"><Minus size={12} /></button>
            <span className="w-6 text-center font-black text-xs text-brand-special">{val}</span>
            <button onClick={(e) => { e.stopPropagation(); setVal(v => v + 1); }} className="p-1 text-brand-light hover:text-green-400"><Plus size={12} /></button>
        </div>
    );

    const deadlineInfo = useMemo(() => {
        if (!scheduleSettings || !scheduleSettings.isActive || !scheduleSettings.matchdayStartTime || !match.matchday) return null;
        if (match.matchday !== scheduleSettings.currentMatchday) return null;
        const deadline = scheduleSettings.matchdayStartTime + (scheduleSettings.matchdayDurationHours * 3600000);
        const now = Date.now();
        const diff = deadline - now;
        if (diff <= 0) return { text: 'Deadline Lewat', urgent: true };
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        return { text: `${hours}h ${minutes}m Left`, urgent: hours < 1 };
    }, [scheduleSettings, match.matchday]);

    return (
        <>
            <div className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 border ${
                isAdminMode 
                    ? 'ring-2 ring-brand-special border-brand-special shadow-[0_0_30px_rgba(253,224,71,0.2)]' 
                    : isMyMatch 
                        ? 'border-brand-vibrant bg-brand-vibrant/5 shadow-[0_0_20px_rgba(37,99,235,0.15)]' 
                        : 'border-brand-accent/30 bg-brand-secondary/40 hover:border-brand-accent/60'
            }`}>
                {/* Top Info Bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-brand-primary/60 border-b border-brand-accent/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[8px] font-black text-brand-light/60 uppercase tracking-widest">
                            <Layout size={12} className="text-brand-vibrant" />
                            <span>Group {match.group}</span>
                        </div>
                        <div className="w-px h-3 bg-brand-accent/30"></div>
                        <div className="flex items-center gap-1.5 text-[8px] font-black text-brand-light/60 uppercase tracking-widest">
                            <Calendar size={12} className="text-brand-vibrant" />
                            <span>Matchday {match.matchday || 'TBD'}</span>
                        </div>
                    </div>
                    {deadlineInfo && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border ${
                            deadlineInfo.urgent ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse' : 'bg-brand-vibrant/10 border-brand-vibrant/30 text-brand-vibrant'
                        }`}>
                            <Clock size={10} />
                            <span>{deadlineInfo.text}</span>
                        </div>
                    )}
                </div>

                {/* Main Match Content */}
                <div className="relative p-4 sm:p-6 flex items-center justify-between gap-2 sm:gap-4">
                    {/* Background Star Pattern (UCL Style) */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[length:20px_20px]"></div>
                    
                    {/* Team A */}
                    <div className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                        <span className="text-[8px] sm:text-[10px] font-black text-brand-text uppercase tracking-tight text-center line-clamp-1 w-full px-1 mb-1">{match.teamA.name}</span>
                        
                        <div className="flex items-center gap-2 w-full justify-center">
                            <button onClick={() => onSelectTeam(match.teamA)} className="relative group/logo active:scale-95 transition-transform shrink-0">
                                <div className="absolute inset-0 bg-brand-vibrant/20 blur-xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity"></div>
                                <TeamLogo logoUrl={match.teamA.logoUrl} teamName={match.teamA.name} className="w-10 h-10 sm:w-14 sm:h-14 drop-shadow-2xl relative z-10" />
                            </button>
                            
                            <div className="flex flex-col items-start gap-0.5 min-w-[40px]">
                                {match.teamA.rating && (
                                    <div className="flex items-center gap-0.5 mb-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={6} className={`${i < Math.floor(match.teamA.rating!) ? 'text-brand-special fill-brand-special' : 'text-brand-light/20'}`} />
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <span className="text-[6px] sm:text-[7px] font-bold text-brand-light/40 uppercase">{match.teamA.ovr ? 'OVR' : 'WR'}</span>
                                    <span className="text-[8px] sm:text-[9px] font-black text-brand-special">
                                        {match.teamA.ovr || (teamAStanding ? Math.round((teamAStanding.wins / (teamAStanding.played || 1)) * 100) : 0)}
                                        {!match.teamA.ovr && '%'}
                                    </span>
                                </div>
                                <div className="flex gap-0.5">
                                    {(teamAStanding?.form || []).slice(-5).map((res: string, i: number) => (
                                        <div key={i} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-[1px] flex items-center justify-center text-[5px] sm:text-[6px] font-black text-white ${
                                            res === 'W' ? 'bg-green-500' : res === 'D' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}>
                                            {res}
                                        </div>
                                    ))}
                                    {(!teamAStanding || teamAStanding.form.length === 0) && [1,2,3,4,5].map(i => (
                                        <div key={i} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-[1px] bg-brand-light/10"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {isAdminMode && <QuickScoreControl val={editScoreA} setVal={setEditScoreA} />}
                    </div>

                    {/* Score / VS Area */}
                    <div className="flex flex-col items-center justify-center min-w-[60px] sm:min-w-[100px] shrink-0">
                        {isAdminMode ? (
                            <button onClick={handleQuickUpdate} disabled={isSaving} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-special text-brand-primary flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all">
                                {isSaving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                            </button>
                        ) : isFinished ? (
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2 sm:gap-4 text-lg sm:text-2xl font-black italic">
                                    <span className={match.scoreA! > match.scoreB! ? 'text-brand-vibrant drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-brand-text/40'}>{match.scoreA}</span>
                                    <span className="text-brand-light/20 text-base sm:text-lg font-light">:</span>
                                    <span className={match.scoreB! > match.scoreA! ? 'text-brand-vibrant drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-brand-text/40'}>{match.scoreB}</span>
                                </div>
                                <div className="px-2 py-0.5 bg-brand-primary/40 rounded-full border border-brand-accent/20">
                                    <span className="text-[6px] sm:text-[7px] font-black text-brand-light/50 uppercase tracking-[0.2em]">Full Time</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-brand-primary/40 border border-brand-accent/20 flex items-center justify-center">
                                    <span className="text-[10px] sm:text-base font-black italic text-brand-light/20 tracking-tighter">VS</span>
                                </div>
                                {match.status === 'live' && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 border border-red-500/40 rounded-full animate-pulse">
                                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                        <span className="text-[6px] sm:text-[7px] font-black text-red-500 uppercase tracking-widest">Live</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Team B */}
                    <div className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                        <span className="text-[8px] sm:text-[10px] font-black text-brand-text uppercase tracking-tight text-center line-clamp-1 w-full px-1 mb-1">{match.teamB.name}</span>
                        
                        <div className="flex items-center gap-2 w-full justify-center flex-row-reverse">
                            <button onClick={() => onSelectTeam(match.teamB)} className="relative group/logo active:scale-95 transition-transform shrink-0">
                                <div className="absolute inset-0 bg-brand-vibrant/20 blur-xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity"></div>
                                <TeamLogo logoUrl={match.teamB.logoUrl} teamName={match.teamB.name} className="w-10 h-10 sm:w-14 sm:h-14 drop-shadow-2xl relative z-10" />
                            </button>
                            
                            <div className="flex flex-col items-end gap-0.5 min-w-[40px]">
                                {match.teamB.rating && (
                                    <div className="flex items-center gap-0.5 mb-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={6} className={`${i < Math.floor(match.teamB.rating!) ? 'text-brand-special fill-brand-special' : 'text-brand-light/20'}`} />
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <span className="text-[8px] sm:text-[9px] font-black text-brand-special">
                                        {match.teamB.ovr || (teamBStanding ? Math.round((teamBStanding.wins / (teamBStanding.played || 1)) * 100) : 0)}
                                        {!match.teamB.ovr && '%'}
                                    </span>
                                    <span className="text-[6px] sm:text-[7px] font-bold text-brand-light/40 uppercase">{match.teamB.ovr ? 'OVR' : 'WR'}</span>
                                </div>
                                <div className="flex gap-0.5">
                                    {(teamBStanding?.form || []).slice(-5).map((res: string, i: number) => (
                                        <div key={i} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-[1px] flex items-center justify-center text-[5px] sm:text-[6px] font-black text-white ${
                                            res === 'W' ? 'bg-green-500' : res === 'D' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}>
                                            {res}
                                        </div>
                                    ))}
                                    {(!teamBStanding || teamBStanding.form.length === 0) && [1,2,3,4,5].map(i => (
                                        <div key={i} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-[1px] bg-brand-light/10"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {isAdminMode && <QuickScoreControl val={editScoreB} setVal={setEditScoreB} />}
                    </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-brand-primary/40 border-t border-brand-accent/10">
                    <div className="flex items-center gap-2 sm:gap-4">
                        {match.proofUrl ? (
                            <button onClick={() => setShowProof(true)} className="flex items-center gap-1.5 sm:gap-2 text-[7px] sm:text-[8px] font-black text-brand-vibrant uppercase hover:text-brand-text transition-colors">
                                <MonitorPlay size={12} className="sm:w-3.5 sm:h-3.5" />
                                <span>Bukti</span>
                            </button>
                        ) : isMyMatch && !isFinished && (
                            <>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-1.5 sm:gap-2 text-[7px] sm:text-[8px] font-black text-brand-light/60 uppercase hover:text-brand-text transition-colors disabled:opacity-50">
                                    {isUploading ? <Loader className="animate-spin" size={12} /> : <Camera size={12} />}
                                    <span>SS</span>
                                </button>
                            </>
                        )}
                        {hasComments && (
                            <div className="flex items-center gap-1 sm:gap-1.5 text-[7px] sm:text-[8px] font-black text-brand-light/40 uppercase">
                                <MessageCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                                <span>{match.comments?.length}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {isMyMatch && <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-brand-special/10 border border-brand-special/30 rounded-lg flex items-center gap-1 sm:gap-1.5">
                            <Star size={8} className="sm:w-2.5 sm:h-2.5 text-brand-special fill-brand-special" />
                            <span className="text-[6px] sm:text-[7px] font-black text-brand-special uppercase tracking-widest">Mine</span>
                        </div>}
                        <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-[7px] sm:text-[8px] font-black uppercase transition-all border ${
                            showComments ? 'bg-brand-vibrant text-white border-brand-vibrant shadow-lg' : 'bg-brand-secondary/40 text-brand-light/60 border-brand-accent/20 hover:border-brand-vibrant/40'
                        }`}>
                            <MessageSquare size={12} className="sm:w-3.5 sm:h-3.5" />
                            <span>Chat</span>
                        </button>
                    </div>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="bg-brand-primary/95 border-t border-brand-accent/20 animate-in slide-in-from-top-2 duration-300">
                        <div className="max-h-48 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {hasComments ? (
                                match.comments?.map((comment) => (
                                    <div key={comment.id} className={`flex flex-col gap-1 ${comment.userId === currentUser?.uid ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 px-1">
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${comment.userId === currentUser?.uid ? 'text-brand-vibrant' : comment.isAdmin ? 'text-brand-special' : 'text-brand-light/60'}`}>
                                                {comment.userName}{comment.isAdmin ? ' (Admin)' : ''}
                                            </span>
                                        </div>
                                        <div className={`px-3 py-2 rounded-2xl text-[10px] leading-relaxed break-words max-w-[85%] font-medium shadow-sm border ${
                                            comment.userId === currentUser?.uid 
                                            ? 'bg-brand-vibrant text-white border-brand-vibrant/30 rounded-tr-none' 
                                            : 'bg-brand-secondary text-brand-text border-brand-accent/30 rounded-tl-none'
                                        }`}>
                                            {comment.text}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-[10px] font-black text-brand-light/20 uppercase tracking-[0.3em] italic">No Discussion Yet</div>
                            )}
                            <div ref={commentsEndRef} />
                        </div>
                        <div className="p-3 bg-brand-secondary/60 border-t border-brand-accent/20">
                            {chatPermissions.canChat ? (
                                <form onSubmit={handleSubmitComment} className="flex gap-2">
                                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Type a message..." className="flex-grow bg-brand-primary/40 border border-brand-accent/20 rounded-xl px-4 py-2 text-[10px] text-brand-text focus:border-brand-vibrant outline-none transition-all placeholder:text-brand-light/20" />
                                    <button type="submit" disabled={!newComment.trim()} className="p-2 bg-brand-vibrant text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"><Send size={16} /></button>
                                </form>
                            ) : (
                                <div className="text-center text-[8px] font-black text-brand-light/30 uppercase italic flex items-center justify-center gap-2 py-1"><Lock size={12} /> {chatPermissions.reason}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {(match.proofUrl || editProofUrl) && (
                <ProofModal isOpen={showProof} onClose={() => setShowProof(false)} imageUrl={editProofUrl || match.proofUrl || ''} />
            )}
        </>
    )
}

