
import React, { useState } from 'react';
import type { Match, Team, MatchComment } from '../../types';
import { Card } from '../shared/Card';
import { MonitorPlay, MessageSquare, Send, ChevronDown, ChevronUp, UserCircle } from 'lucide-react';
import { ProofModal } from './ProofModal';
import { TeamLogo } from '../shared/TeamLogo';
import type { User } from 'firebase/auth';

interface MatchCardProps {
    match: Match;
    onSelectTeam: (team: Team) => void;
    currentUser?: User | null;
    onAddComment?: (matchId: string, text: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onSelectTeam, currentUser, onAddComment }) => {
    const [showProof, setShowProof] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');

    const isFinished = match.status === 'finished' && match.scoreA !== null && match.scoreB !== null;
    
    // Check if current user is participant or admin (if we had admin prop, but we can infer participant)
    const isParticipant = currentUser && (
        currentUser.email === match.teamA.ownerEmail || 
        currentUser.email === match.teamB.ownerEmail
    );
    
    // Allow viewing if participant or just everyone? Usually private schedule chat is for participants.
    // Let's assume public can't see, only participants.
    // OR: Public can see but only participants can write. Let's go with Public View, Participant Write.
    const canComment = !!isParticipant && !!onAddComment;
    const hasComments = match.comments && match.comments.length > 0;

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim() && onAddComment) {
            onAddComment(match.id, newComment.trim());
            setNewComment('');
        }
    }

    return (
        <>
            <Card className="!p-0 group border-l-4 border-l-transparent hover:border-l-brand-vibrant transition-all hover:scale-[1.02] duration-300">
                {/* Header Info */}
                <div className="flex items-center justify-between px-4 py-2 bg-black/20 text-[10px] sm:text-xs text-brand-light border-b border-white/5">
                    <span className="font-medium tracking-wide">
                        Group {match.group}{match.matchday && ` • Matchday ${match.matchday}`}
                    </span>
                    <div className="flex items-center gap-2">
                         {match.proofUrl && (
                            <button
                                onClick={(e) => {e.stopPropagation(); setShowProof(true);}}
                                title="Watch Highlight/Proof"
                                className="flex items-center gap-1 text-brand-vibrant hover:text-white transition-colors"
                            >
                                <MonitorPlay size={12} />
                                <span className="hidden sm:inline">Proof</span>
                            </button>
                        )}
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                            match.status === 'finished' ? 'bg-brand-accent/50 text-brand-light' :
                            match.status === 'live' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                            'bg-brand-vibrant/10 text-brand-vibrant'
                        }`}>
                            {match.status}
                        </span>
                    </div>
                </div>

                {/* Match Content */}
                <div className="p-3 sm:p-4 flex items-center justify-between gap-1 sm:gap-2 relative">
                    {/* Background VS Watermark */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-white/5 pointer-events-none italic">VS</div>

                    {/* Team A */}
                    <button onClick={() => onSelectTeam(match.teamA)} className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 flex-1 min-w-0 text-center sm:text-left group/team hover:bg-white/5 p-1 sm:p-2 rounded-lg transition-colors">
                        <TeamLogo logoUrl={match.teamA.logoUrl} teamName={match.teamA.name} className="w-10 h-10 sm:w-12 sm:h-12 shadow-lg group-hover/team:scale-110 transition-transform duration-300" />
                        <span className="text-xs sm:text-base font-bold text-brand-text truncate w-full group-hover:text-brand-vibrant transition-colors leading-tight mt-1 sm:mt-0">{match.teamA.name}</span>
                    </button>

                    {/* Score */}
                    <div className="flex flex-col items-center justify-center px-1 sm:px-2 min-w-[60px] sm:min-w-[80px]">
                        {isFinished ? (
                            <div className="flex items-center gap-1 sm:gap-2 text-xl sm:text-3xl font-black text-white bg-black/30 px-2 sm:px-3 py-1 rounded-lg border border-white/10 shadow-inner">
                                <span className={`${match.scoreA! > match.scoreB! ? 'text-brand-vibrant' : ''}`}>{match.scoreA}</span>
                                <span className="text-brand-light text-sm sm:text-base opacity-50">-</span>
                                <span className={`${match.scoreB! > match.scoreA! ? 'text-brand-vibrant' : ''}`}>{match.scoreB}</span>
                            </div>
                        ) : (
                            <div className="text-lg sm:text-xl font-bold text-brand-light/30">VS</div>
                        )}
                    </div>

                    {/* Team B */}
                    <button onClick={() => onSelectTeam(match.teamB)} className="flex flex-col sm:flex-row-reverse items-center gap-1 sm:gap-3 flex-1 min-w-0 text-center sm:text-right group/team hover:bg-white/5 p-1 sm:p-2 rounded-lg transition-colors">
                        <TeamLogo logoUrl={match.teamB.logoUrl} teamName={match.teamB.name} className="w-10 h-10 sm:w-12 sm:h-12 shadow-lg group-hover/team:scale-110 transition-transform duration-300" />
                        <span className="text-xs sm:text-base font-bold text-brand-text truncate w-full group-hover:text-brand-vibrant transition-colors leading-tight mt-1 sm:mt-0">{match.teamB.name}</span>
                    </button>
                </div>

                {match.summary && (
                    <div className="bg-brand-secondary/30 px-4 py-2 border-t border-white/5">
                        <p className="text-xs text-brand-light italic leading-relaxed line-clamp-2">
                            <span className="text-brand-vibrant font-bold not-italic mr-1">AI Summary:</span> 
                            "{match.summary}"
                        </p>
                    </div>
                )}
                
                {/* Comments Section Toggle */}
                {(canComment || hasComments) && (
                    <div className="border-t border-white/5">
                        <button 
                            onClick={() => setShowComments(!showComments)}
                            className="w-full flex items-center justify-center gap-2 py-2 text-[10px] uppercase font-bold text-brand-light hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <MessageSquare size={12} />
                            {hasComments ? `${match.comments?.length} Diskusi` : 'Diskusi Jadwal'}
                            {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {/* Comments Body */}
                        {showComments && (
                            <div className="p-4 bg-black/20 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                {hasComments ? (
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {match.comments?.map((comment) => (
                                            <div key={comment.id} className={`flex gap-3 ${comment.userEmail === currentUser?.email ? 'flex-row-reverse' : ''}`}>
                                                <div className="w-6 h-6 rounded-full bg-brand-vibrant/20 flex items-center justify-center flex-shrink-0 text-brand-vibrant">
                                                    <UserCircle size={14} />
                                                </div>
                                                <div className={`flex flex-col max-w-[80%] ${comment.userEmail === currentUser?.email ? 'items-end' : 'items-start'}`}>
                                                    <span className="text-[9px] text-brand-light/50 mb-0.5 px-1">
                                                        {comment.userName} • {new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                    <div className={`p-2 rounded-xl text-xs ${
                                                        comment.userEmail === currentUser?.email 
                                                            ? 'bg-brand-vibrant/20 text-white rounded-tr-none' 
                                                            : 'bg-white/5 text-brand-light rounded-tl-none'
                                                    }`}>
                                                        {comment.text}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-xs text-brand-light/40 italic">
                                        Belum ada diskusi.
                                    </div>
                                )}

                                {canComment ? (
                                    <form onSubmit={handleSubmitComment} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Tulis pesan ke lawan..."
                                            className="flex-grow bg-brand-primary border border-brand-accent rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-vibrant"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!newComment.trim()}
                                            className="p-2 bg-brand-vibrant text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center text-[10px] text-brand-light/40 border-t border-white/5 pt-2">
                                        Login dengan akun terdaftar untuk ikut diskusi.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Card>
            {match.proofUrl && (
                <ProofModal 
                    isOpen={showProof}
                    onClose={() => setShowProof(false)}
                    imageUrl={match.proofUrl}
                />
            )}
        </>
    )
}
