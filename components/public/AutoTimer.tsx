
import React, { useState, useEffect } from 'react';
import { Timer, Zap, Clock } from 'lucide-react';

interface AutoTimerProps {
    cycle?: 24 | 48;
    lastResetTime?: number;
    onCycleChange?: (cycle: 24 | 48) => void;
    isAdmin?: boolean;
}

export const AutoTimer: React.FC<AutoTimerProps> = ({ cycle = 24, lastResetTime, onCycleChange, isAdmin = false }) => {
    const [timeLeft, setTimeLeft] = useState<{h: string, m: string, s: string}>({h: '00', m: '00', s: '00'});

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            let diff = 0;

            if (lastResetTime) {
                const cycleMs = cycle * 3600000;
                const nowMs = now.getTime();
                const elapsed = nowMs - lastResetTime;
                
                // If elapsed is negative (shouldn't happen), or we just want the next target
                const currentCycleCount = Math.max(0, Math.floor(elapsed / cycleMs));
                const targetMs = lastResetTime + ((currentCycleCount + 1) * cycleMs);
                diff = targetMs - nowMs;
            } else {
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
                const d: Record<string, string> = {};
                parts.forEach(p => d[p.type] = p.value);
                
                // Parse parts to integers
                const year = parseInt(d.year);
                const month = parseInt(d.month);
                const day = parseInt(d.day);
                const hour = parseInt(d.hour);
                const minute = parseInt(d.minute);
                const second = parseInt(d.second);

                // Construct Jakarta time as UTC to perform consistent calculations
                // Note: month is 1-based from Intl, but 0-based in Date.UTC
                const nowJakarta = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
                
                // Target is midnight (00:00:00) of the current Jakarta day
                let targetJakarta = new Date(Date.UTC(year, month - 1, day));
                
                if (cycle === 24) {
                    // For 24h, target is always the next midnight (tomorrow 00:00)
                    targetJakarta.setUTCDate(targetJakarta.getUTCDate() + 1);
                } else {
                    // For 48h, we use a fixed reference date to determine the cycle phase
                    const referenceDate = new Date(Date.UTC(2024, 0, 1)); // Jan 1 2024 UTC
                    const msPerDay = 24 * 60 * 60 * 1000;
                    
                    // Calculate days passed since reference (using midnight to midnight)
                    // targetJakarta is currently midnight of today
                    const daysSinceRef = Math.floor((targetJakarta.getTime() - referenceDate.getTime()) / msPerDay);
                    
                    // If daysSinceRef is even (0, 2, 4...), we are in the first day of the cycle -> Reset is in 2 days
                    // If daysSinceRef is odd (1, 3, 5...), we are in the second day of the cycle -> Reset is in 1 day
                    const daysToNextReset = 2 - (daysSinceRef % 2);
                    
                    targetJakarta.setUTCDate(targetJakarta.getUTCDate() + daysToNextReset);
                }

                diff = targetJakarta.getTime() - nowJakarta.getTime();
            }
            
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
    }, [cycle, lastResetTime]);

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-brand-secondary/80 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl group hover:border-brand-vibrant/50 transition-all">
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <Clock size={10} className="text-brand-light opacity-50" />
                    <span className="text-[7px] sm:text-[9px] font-black text-brand-light uppercase tracking-[0.2em] leading-none">
                        Next Reset <span className="text-brand-vibrant">WIB</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-brand-vibrant/10 text-brand-vibrant group-hover:bg-brand-vibrant group-hover:text-white transition-all">
                        <Timer size={14} className={parseInt(timeLeft.h) === 0 ? 'animate-pulse' : ''} />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <div className="flex flex-col items-center">
                            <span className="text-sm sm:text-xl font-black text-white italic font-mono leading-none">{timeLeft.h}</span>
                            <span className="text-[6px] font-bold text-white/30 uppercase mt-0.5">H</span>
                        </div>
                        <span className="text-xs font-bold text-brand-vibrant animate-pulse">:</span>
                        <div className="flex flex-col items-center">
                            <span className="text-sm sm:text-xl font-black text-white italic font-mono leading-none">{timeLeft.m}</span>
                            <span className="text-[6px] font-bold text-white/30 uppercase mt-0.5">M</span>
                        </div>
                        <span className="text-xs font-bold text-brand-vibrant animate-pulse">:</span>
                        <div className="flex flex-col items-center">
                            <span className="text-sm sm:text-xl font-black text-white italic font-mono leading-none">{timeLeft.s}</span>
                            <span className="text-[6px] font-bold text-white/30 uppercase mt-0.5">S</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {isAdmin && (
                <div className="ml-1 pl-3 border-l border-white/10 flex flex-col items-center justify-center gap-1">
                    <button 
                        onClick={() => onCycleChange?.(24)}
                        className={`text-[8px] sm:text-[10px] font-black px-2 py-1 rounded-md transition-all uppercase ${cycle === 24 ? 'bg-brand-vibrant text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}
                    >
                        24H
                    </button>
                    <button 
                        onClick={() => onCycleChange?.(48)}
                        className={`text-[8px] sm:text-[10px] font-black px-2 py-1 rounded-md transition-all uppercase ${cycle === 48 ? 'bg-brand-special text-brand-primary' : 'bg-white/5 text-white/40 hover:text-white'}`}
                    >
                        48H
                    </button>
                </div>
            )}
            {!isAdmin && (
                <div className="ml-1 pl-3 border-l border-white/10 flex flex-col items-center justify-center">
                    <span className="text-[8px] sm:text-[10px] font-black text-brand-vibrant uppercase">
                        {cycle}H Mode
                    </span>
                </div>
            )}
        </div>
    );
};
