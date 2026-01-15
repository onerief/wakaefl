
import React, { useState, useRef, useMemo } from 'react';
import type { Match, Team, MatchComment } from '../../types';
import { Card } from '../shared/Card';
import { MonitorPlay, MessageSquare, Send, ChevronDown, ChevronUp, UserCircle, Save, Plus, Minus, Camera, Loader, Shield, Lock } from 'lucide-react';
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
}

export const MatchCard: React.FC<MatchCardProps> = ({ 
    match, onSelectTeam, currentUser, onAddComment, isAdminMode, onUpdateScore, isAdmin 
}) => {
    const [showProof, setShowProof] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    
    // Admin Edit State
    const [editScoreA, setEditScoreA] = useState(match.scoreA ?? 0);
    const [editScoreB, setEditScoreB] = useState(match.scoreB ?? 0);
    const [editProofUrl, setEditProofUrl] = useState(match.proofUrl ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    const isFinished = match.status === 'finished' && match.scoreA !== null && match.scoreB !== null;
    const hasComments = match.comments && match.comments.length > 0;

    // Logic: Who can chat?
    const chatPermissions = useMemo(() => {
        if (!currentUser) return { canChat: false, reason: 'Login untuk chat' };
        if (isAdmin) return { canChat: true, reason: 'Admin Access' };
        
        // If match finished, everyone logged in can chat
        if (isFinished) return { canChat: true, reason: 'Public Discussion' };

        // If not finished, only involved managers
        const userEmail = currentUser.email?.toLowerCase();
        const isManagerA = match.teamA.ownerEmail?.toLowerCase() === userEmail;
        const isManagerB = match.teamB.ownerEmail?.toLowerCase() === userEmail;

        if (isManagerA || isManagerB) {
            return { canChat: true, reason: 'Team Coordinator' };
        }

        return { canChat: false, reason: 'Hanya untuk Manager Tim' };
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
            addToast('Pertandingan berhasil diperbarui!', 'success');
        } catch (e) {
            addToast('Gagal update.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const QuickScoreControl = ({ val, setVal }: { val: number, setVal: React.Dispatch<React.SetStateAction<number>> }) => (
        <div className="flex items-center bg-black/60 rounded-lg border border-white/10 p-0.5 mt-1 scale-90 sm:scale-100">
            <button 
                onClick={(e) => { e.stopPropagation(); setVal(v => Math.max(0, v - 1)); }} 
                className="p-1 text-brand-light"
            >
                <Minus size={12} />
            </button>
            <span className="w-5 text-center font-black text-xs text-brand-special">{val}</span>
            <button 
                onClick={(e) => { e.stopPropagation(); setVal(v => v + 1); }} 
                className="p-1 text-brand-light"
            >
                <Plus size={12} />
            </button>
        </div>
    );

    return (
        <>
            <Card className={`!p-0 group border-l-4 transition-all duration-300 overflow-visible ${isAdminMode ? 'border-l-brand-special bg-brand-special/5' : 'border-l-transparent'}`}>
                {/* Header Info */}
                <div className="flex items-center justify-between px-2.5 py-1 bg-black/30 text-[8px] sm:text-xs text-brand-light border-b border-white/5">
                    <span className="font-black uppercase tracking-widest opacity-60">
                        {match.group && `Grup ${match.group}`} {match.matchday && ` • D${match.matchday}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className={`px-1 py-0.5 text-[7px] sm:text-[9px] font-black rounded uppercase ${
                            match.status === 'finished' ? 'bg-white/5 text-brand-light/60' :
                            match.status === 'live' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                            'bg-brand-vibrant/10 text-brand-vibrant'
                        }`}>
                            {match.status}
                        </span>
                    </div>
                </div>

                {/* Match Content */}
                <div className="p-4 sm:p-6 flex items-center justify-between gap-1 relative">
                    {/* Team A */}
                    <button onClick={() => onSelectTeam(match.teamA)} className="flex flex-col items-center gap-2 flex-1 min-w-0 z-10">
                        <TeamLogo logoUrl={match.teamA.logoUrl} teamName={match.teamA.name} className="w-14 h-14 sm:w-20 sm:h-20 shadow-lg" />
                        <span className="text-[10px] sm:text-sm font-black text-white w-full text-center uppercase tracking-tighter break-words leading-tight px-1">{match.teamA.name}</span>
                        {isAdminMode && <QuickScoreControl val={editScoreA} setVal={setEditScoreA} />}
                    </button>

                    {/* Score Center */}
                    <div className="flex flex-col items-center justify-center px-1 sm:px-4 shrink-0 z-20">
                        {isAdminMode ? (
                            <button onClick={handleQuickUpdate} disabled={isSaving} className="p-2.5 bg-brand-special rounded-full text-brand-primary active:scale-95 transition-all shadow-lg">
                                {isSaving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                            </button>
                        ) : isFinished ? (
                            <div className="flex items-center gap-1 sm:gap-3 text-lg sm:text-4xl font-black text-white bg-black/40 px-3 sm:px-6 py-1.5 rounded-xl border border-white/10 italic shadow-xl">
                                <span>{match.scoreA}</span>
                                <span className="text-white/20">-</span>
                                <span>{match.scoreB}</span>
                            </div>
                        ) : (
                            <div className="bg-brand-vibrant/10 border border-brand-vibrant/20 px-3 py-1 rounded-full">
                                <span className="text-[10px] sm:text-base font-black text-brand-vibrant italic">VS</span>
                            </div>
                        )}
                    </div>

                    {/* Team B */}
                    <button onClick={() => onSelectTeam(match.teamB)} className="flex flex-col items-center gap-2 flex-1 min-w-0 z-10">
                        <TeamLogo logoUrl={match.teamB.logoUrl} teamName={match.teamB.name} className="w-14 h-14 sm:w-20 sm:h-20 shadow-lg" />
                        <span className="text-[10px] sm:text-sm font-black text-white w-full text-center uppercase tracking-tighter break-words leading-tight px-1">{match.teamB.name}</span>
                        {isAdminMode && <QuickScoreControl val={editScoreB} setVal={setEditScoreB} />}
                    </button>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between px-3 py-2 bg-black/20 border-t border-white/5">
                    <div className="flex gap-2">
                        {match.proofUrl && (
                            <button 
                                onClick={() => setShowProof(true)}
                                className="flex items-center gap-1 text-[8px] sm:text-[10px] font-black text-brand-vibrant uppercase hover:text-white transition-colors"
                            >
                                <MonitorPlay size={12} /> Bukti
                            </button>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setShowComments(!showComments)}
                        className={`flex items-center gap-1.5 text-[8px] sm:text-[10px] font-black uppercase transition-all ${showComments ? 'text-brand-vibrant' : 'text-brand-light hover:text-white'}`}
                    >
                        <div className="relative">
                            <MessageSquare size={14} />
                            {hasComments && !showComments && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-vibrant rounded-full"></span>
                            )}
                        </div>
                        {match.comments?.length || 0} Chat
                    </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="bg-black/40 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                        {/* Messages List */}
                        <div className="max-h-48 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                            {hasComments ? (
                                match.comments?.map((comment) => (
                                    <div key={comment.id} className="flex gap-2">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <UserCircle size={14} className={comment.isAdmin ? 'text-brand-special' : 'text-brand-vibrant'} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[9px] font-black uppercase truncate ${comment.isAdmin ? 'text-brand-special' : 'text-brand-light'}`}>
                                                    {comment.userName}
                                                </span>
                                                <span className="text-[8px] text-brand-light/30">
                                                    {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-brand-text leading-relaxed break-words">{comment.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] text-brand-light/30 italic text-center py-2">Belum ada obrolan.</p>
                            )}
                        </div>

                        {/* Input Field */}
                        <div className="p-2 bg-brand-secondary/30 border-t border-white/5">
                            {chatPermissions.canChat ? (
                                <form onSubmit={handleSubmitComment} className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Ketik pesan..."
                                        className="flex-grow bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-brand-vibrant transition-all"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!newComment.trim()}
                                        className="p-2 bg-brand-vibrant text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:grayscale transition-all"
                                    >
                                        <Send size={14} />
                                    </button>
                                </form>
                            ) : (
                                <div className="flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-brand-light/50 bg-black/20 rounded-lg border border-dashed border-white/5">
                                    {currentUser ? <Lock size={12} /> : <UserCircle size={12} />}
                                    {chatPermissions.reason}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {match.summary && (
                    <div className="bg-white/[0.02] px-2.5 py-1.5 border-t border-white/5">
                        <p className="text-[8px] sm:text-[11px] text-brand-light italic leading-tight">
                             <span className="text-brand-vibrant font-black not-italic mr-1">AI:</span> {match.summary}
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
