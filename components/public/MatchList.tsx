
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
    const isParticipant = currentUser && (
        currentUser.email === match.teamA.ownerEmail || 
        currentUser.email === match.teamB.ownerEmail
    );
    
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
            <Card className="!p-0 group border-l-4 border-l-transparent hover:border-l-brand-vibrant transition-all duration-300">
                {/* Header Info */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-black/30 text-[9px] sm:text-xs text-brand-light border-b border-white/5">
                    <span className="font-black uppercase tracking-widest opacity-60">
                        {match.group && `Group ${match.group}`} {match.matchday && `• Day ${match.matchday}`}
                    </span>
                    <div className="flex items-center gap-2">
                         {match.proofUrl && (
                            <button
                                onClick={(e) => {e.stopPropagation(); setShowProof(true);}}
                                className="flex items-center gap-1 text-brand-vibrant hover:text-white transition-colors font-bold"
                            >
                                <MonitorPlay size={10} />
                                <span className="hidden sm:inline">PROOF</span>
                            </button>
                        )}
                        <span className={`px-1.5 py-0.5 text-[8px] sm:text-[10px] font-black rounded uppercase tracking-tighter sm:tracking-widest ${
                            match.status === 'finished' ? 'bg-white/5 text-brand-light/60' :
                            match.status === 'live' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                            'bg-brand-vibrant/10 text-brand-vibrant'
                        }`}>
                            {match.status}
                        </span>
                    </div>
                </div>

                {/* Match Content */}
                <div className="p-3 sm:p-5 flex items-center justify-between gap-1 relative overflow-hidden">
                    {/* Background VS Watermark */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-5xl font-black text-white/[0.03] pointer-events-none italic tracking-tighter">VS</div>

                    {/* Team A */}
                    <button onClick={() => onSelectTeam(match.teamA)} className="flex flex-col items-center gap-1.5 flex-1 min-w-0 group/team">
                        <TeamLogo logoUrl={match.teamA.logoUrl} teamName={match.teamA.name} className="w-10 h-10 sm:w-14 sm:h-14 shadow-xl transition-transform group-hover/team:scale-110" />
                        <span className="text-[10px] sm:text-sm font-black text-white truncate w-full text-center uppercase tracking-tight group-hover/team:text-brand-vibrant transition-colors">{match.teamA.name}</span>
                    </button>

                    {/* Score Center */}
                    <div className="flex flex-col items-center justify-center px-2 z-10">
                        {isFinished ? (
                            <div className="flex items-center gap-1.5 sm:gap-3 text-lg sm:text-3xl font-black text-white bg-black/40 px-2 sm:px-4 py-1 rounded-xl border border-white/10 shadow-lg italic">
                                <span className={match.scoreA! > match.scoreB! ? 'text-brand-special' : ''}>{match.scoreA}</span>
                                <span className="text-white/20 text-sm sm:text-xl">-</span>
                                <span className={match.scoreB! > match.scoreA! ? 'text-brand-special' : ''}>{match.scoreB}</span>
                            </div>
                        ) : (
                            <div className="bg-brand-vibrant/5 border border-brand-vibrant/10 px-3 py-1 rounded-full">
                                <span className="text-[10px] sm:text-sm font-black text-brand-vibrant italic">VS</span>
                            </div>
                        )}
                    </div>

                    {/* Team B */}
                    <button onClick={() => onSelectTeam(match.teamB)} className="flex flex-col items-center gap-1.5 flex-1 min-w-0 group/team">
                        <TeamLogo logoUrl={match.teamB.logoUrl} teamName={match.teamB.name} className="w-10 h-10 sm:w-14 sm:h-14 shadow-xl transition-transform group-hover/team:scale-110" />
                        <span className="text-[10px] sm:text-sm font-black text-white truncate w-full text-center uppercase tracking-tight group-hover/team:text-brand-vibrant transition-colors">{match.teamB.name}</span>
                    </button>
                </div>

                {match.summary && (
                    <div className="bg-white/[0.02] px-3 py-2 border-t border-white/5">
                        <p className="text-[10px] text-brand-light italic leading-tight line-clamp-1">
                            <span className="text-brand-vibrant font-black not-italic mr-1">AI:</span> 
                            {match.summary}
                        </p>
                    </div>
                )}
                
                {/* Discussion Button */}
                {(canComment || hasComments) && (
                    <div className="border-t border-white/5">
                        <button 
                            onClick={() => setShowComments(!showComments)}
                            className="w-full flex items-center justify-center gap-2 py-2 text-[9px] uppercase font-black tracking-widest text-brand-light/50 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <MessageSquare size={10} />
                            {hasComments ? `${match.comments?.length} Comments` : 'Discuss Fixture'}
                            {showComments ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>

                        {showComments && (
                            <div className="p-3 bg-black/40 border-t border-white/5 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                {hasComments ? (
                                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                        {match.comments?.map((comment) => (
                                            <div key={comment.id} className={`flex gap-2 ${comment.userEmail === currentUser?.email ? 'flex-row-reverse' : ''}`}>
                                                <div className={`flex flex-col max-w-[85%] ${comment.userEmail === currentUser?.email ? 'items-end' : 'items-start'}`}>
                                                    <span className="text-[8px] text-brand-light/40 mb-0.5 px-1 font-bold">
                                                        {comment.userName.toUpperCase()}
                                                    </span>
                                                    <div className={`px-2.5 py-1.5 rounded-xl text-[11px] leading-snug ${
                                                        comment.userEmail === currentUser?.email 
                                                            ? 'bg-brand-vibrant text-white rounded-tr-none shadow-lg shadow-brand-vibrant/20' 
                                                            : 'bg-white/5 text-brand-light rounded-tl-none border border-white/5'
                                                    }`}>
                                                        {comment.text}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-2 text-[10px] text-brand-light/30 italic">No messages yet.</div>
                                )}

                                {canComment ? (
                                    <form onSubmit={handleSubmitComment} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-grow bg-brand-primary border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-brand-vibrant"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!newComment.trim()}
                                            className="p-2 bg-brand-vibrant text-white rounded-lg disabled:opacity-20 hover:bg-blue-600 transition-colors"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center text-[8px] text-brand-light/30 uppercase font-black tracking-widest pt-1">
                                        Login as Manager to Chat
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
