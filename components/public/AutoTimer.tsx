
import React, { useState, useEffect } from 'react';
import { Timer, Zap, Clock } from 'lucide-react';

interface AutoTimerProps {
    cycle?: 24 | 48;
    onCycleChange?: (cycle: 24 | 48) => void;
    isAdmin?: boolean;
}

export const AutoTimer: React.FC<AutoTimerProps> = ({ cycle = 24, onCycleChange, isAdmin = false }) => {
    const [timeLeft, setTimeLeft] = useState<{h: string, m: string, s: string}>({h: '00', m: '00', s: '00'});

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            
            // WIB is UTC+7
            // We calculate everything based on the "Asia/Jakarta" timezone
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Jakarta',
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hour12: false
            });
            
            const parts = formatter.formatToParts(now);
            const d: any = {};
            parts.forEach(p => d[p.type] = p.value);
            
            // Current time in WIB (Jakarta)
            // Note: d.month is 1-indexed in Intl.DateTimeFormat
            const nowWib = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
            
            // Target: Midnight WIB
            let targetWib = new Date(nowWib);
            targetWib.setHours(0, 0, 0, 0);
            
            if (cycle === 24) {
                // If it's 24h cycle, target is always the NEXT midnight
                if (nowWib >= targetWib) {
                    targetWib.setDate(targetWib.getDate() + 1);
                }
            } else {
                // If it's 48h cycle, we need a fixed reference point to decide which midnight to hit
                // We'll use the number of days since a fixed point (e.g., Jan 1, 2024)
                const referenceDate = new Date("2024-01-01T00:00:00Z"); // Fixed reference
                const msPerDay = 24 * 60 * 60 * 1000;
                const daysSinceRef = Math.floor((nowWib.getTime() - referenceDate.getTime()) / msPerDay);
                
                // If we want it to reset every 2 days
                const daysToNextReset = 2 - (daysSinceRef % 2);
                targetWib.setDate(targetWib.getDate() + daysToNextReset);
                
                // If we are already at the target day but past midnight, we need to handle it
                // But the logic above (daysToNextReset) usually handles it.
                // Let's double check: if daysSinceRef is even (0, 2, 4...), daysToNextReset is 2.
                // If daysSinceRef is odd (1, 3, 5...), daysToNextReset is 1.
                // This ensures we always hit an "even" day relative to the reference.
            }

            const diff = targetWib.getTime() - nowWib.getTime();
            
            if (diff <= 0) {
                setTimeLeft({h: '00', m: '00', s: '00'});
            } else {
                const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
                const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
                const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                setTimeLeft({h, m, s});
            }
        };

        const timer = setInterval(calculateTime, 1000);
        calculateTime();
        return () => clearInterval(timer);
    }, [cycle]);

    return (
        <div className="flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 glass rounded-[1.5rem] shadow-2xl group hover:border-brand-vibrant/50 transition-all">
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                    <Clock size={12} className="text-brand-vibrant" />
                    <span className="text-[8px] sm:text-[10px] font-black text-brand-light uppercase tracking-[0.3em] leading-none">
                        Next Reset <span className="text-brand-vibrant">WIB</span>
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-brand-vibrant/10 text-brand-vibrant group-hover:bg-brand-vibrant group-hover:text-white transition-all shadow-inner">
                        <Timer size={18} className={parseInt(timeLeft.h) === 0 ? 'animate-pulse' : ''} />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="flex flex-col items-center">
                            <span className="text-lg sm:text-2xl font-black text-white italic font-mono leading-none tracking-tighter">{timeLeft.h}</span>
                            <span className="text-[7px] font-black text-white/30 uppercase mt-1">Hours</span>
                        </div>
                        <span className="text-sm font-black text-brand-vibrant animate-pulse">:</span>
                        <div className="flex flex-col items-center">
                            <span className="text-lg sm:text-2xl font-black text-white italic font-mono leading-none tracking-tighter">{timeLeft.m}</span>
                            <span className="text-[7px] font-black text-white/30 uppercase mt-1">Mins</span>
                        </div>
                        <span className="text-sm font-black text-brand-vibrant animate-pulse">:</span>
                        <div className="flex flex-col items-center">
                            <span className="text-lg sm:text-2xl font-black text-white italic font-mono leading-none tracking-tighter">{timeLeft.s}</span>
                            <span className="text-[7px] font-black text-white/30 uppercase mt-1">Secs</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {isAdmin && (
                <div className="ml-2 pl-4 border-l border-white/10 flex flex-col items-center justify-center gap-1.5">
                    <button 
                        onClick={() => onCycleChange?.(24)}
                        className={`text-[9px] sm:text-[11px] font-black px-3 py-1.5 rounded-xl transition-all uppercase tracking-widest ${cycle === 24 ? 'bg-brand-vibrant text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
                    >
                        24H
                    </button>
                    <button 
                        onClick={() => onCycleChange?.(48)}
                        className={`text-[9px] sm:text-[11px] font-black px-3 py-1.5 rounded-xl transition-all uppercase tracking-widest ${cycle === 48 ? 'bg-brand-special text-brand-primary shadow-[0_0_15px_rgba(253,224,71,0.5)]' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
                    >
                        48H
                    </button>
                </div>
            )}
            {!isAdmin && (
                <div className="ml-2 pl-4 border-l border-white/10 flex flex-col items-center justify-center">
                    <div className="px-3 py-1.5 bg-brand-vibrant/10 rounded-xl border border-brand-vibrant/20">
                        <span className="text-[9px] sm:text-[11px] font-black text-brand-vibrant uppercase tracking-widest">
                            {cycle}H Cycle
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
