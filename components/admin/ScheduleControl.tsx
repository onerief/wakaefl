
import React, { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Clock, Play, Pause, FastForward, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { ScheduleSettings } from '../../types';
import { useToast } from '../shared/Toast';

interface ScheduleControlProps {
    settings: ScheduleSettings;
    onStart: (duration: number) => void;
    onPause: () => void;
    onSetMatchday: (day: number) => void;
    onCheckTimeouts: () => { processedCount: number, message: string };
    totalMatchdays: number;
}

export const ScheduleControl: React.FC<ScheduleControlProps> = ({ 
    settings, onStart, onPause, onSetMatchday, onCheckTimeouts, totalMatchdays 
}) => {
    // Guard against undefined settings (e.g., initial load or migration)
    const safeSettings = settings || {
        isActive: false,
        currentMatchday: 1,
        matchdayStartTime: null,
        matchdayDurationHours: 24,
        autoProcessEnabled: false
    };

    const [duration, setDuration] = useState(safeSettings.matchdayDurationHours || 24);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const { addToast } = useToast();

    // Timer Logic
    useEffect(() => {
        if (!safeSettings.isActive || !safeSettings.matchdayStartTime) {
            setTimeLeft('');
            return;
        }

        const interval = setInterval(() => {
            const deadline = safeSettings.matchdayStartTime! + (safeSettings.matchdayDurationHours * 3600000);
            const now = Date.now();
            const diff = deadline - now;

            if (diff <= 0) {
                setTimeLeft('Waktu Habis');
            } else {
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${hours}j ${minutes}m ${seconds}d`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [safeSettings]);

    const handleForceCheck = () => {
        if (window.confirm("Cek otomatis akan memberikan kemenangan WO kepada tim yang aktif chat jika lawannya tidak aktif. Lanjutkan?")) {
            const result = onCheckTimeouts();
            addToast(result.message, result.processedCount > 0 ? 'success' : 'info');
        }
    };

    const nextMatchday = safeSettings.currentMatchday + 1;

    return (
        <Card className="border-brand-vibrant/30 bg-black/20 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                
                {/* Status Panel */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={20} className={safeSettings.isActive ? "text-green-400 animate-pulse" : "text-brand-light"} />
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">
                            Smart Schedule Control
                        </h3>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                        <div className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${safeSettings.isActive ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
                            {safeSettings.isActive ? 'Running' : 'Paused'}
                        </div>
                        <span className="text-brand-light font-bold">Matchday {safeSettings.currentMatchday}</span>
                        {timeLeft && <span className="text-white font-mono bg-black/40 px-2 py-0.5 rounded border border-white/10">{timeLeft}</span>}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-3 w-full md:w-auto">
                    
                    {/* Primary Action */}
                    <div className="flex gap-2">
                        {!safeSettings.isActive ? (
                            <div className="flex gap-2">
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={duration} 
                                        onChange={(e) => setDuration(parseInt(e.target.value) || 24)}
                                        className="w-16 bg-brand-primary border border-brand-accent rounded-xl px-2 py-2.5 text-center text-white text-xs font-bold focus:border-green-500 outline-none"
                                        min="1"
                                        title="Durasi Jam"
                                    />
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] bg-black px-1 text-brand-light">Jam</span>
                                </div>
                                <Button onClick={() => onStart(duration)} className="!bg-green-600 hover:!bg-green-700 !text-xs uppercase font-black tracking-widest shadow-lg shadow-green-900/20">
                                    <Play size={14} /> Mulai Timer
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={onPause} className="!bg-yellow-600 hover:!bg-yellow-700 !text-xs uppercase font-black tracking-widest">
                                <Pause size={14} /> Jeda Jadwal
                            </Button>
                        )}
                        
                        <Button onClick={handleForceCheck} variant="secondary" className="!text-xs uppercase font-black tracking-widest border-brand-vibrant/30 hover:bg-brand-vibrant/10" title="Cek WO Otomatis">
                            <RefreshCw size={14} /> Cek WO
                        </Button>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-brand-light uppercase ml-1">Navigasi Hari:</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => onSetMatchday(Math.max(1, safeSettings.currentMatchday - 1))}
                                disabled={safeSettings.currentMatchday <= 1}
                                className="px-2 py-1 bg-black/40 rounded hover:bg-white/10 text-white disabled:opacity-30"
                            >
                                Prev
                            </button>
                            <span className="font-mono text-white font-bold px-2">{safeSettings.currentMatchday}</span>
                            <button 
                                onClick={() => onSetMatchday(safeSettings.currentMatchday + 1)}
                                className="px-2 py-1 bg-black/40 rounded hover:bg-white/10 text-white"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Footer */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-start gap-2 text-[10px] text-brand-light/60 italic">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                <p>
                    Saat timer habis atau tombol "Cek WO" ditekan, sistem akan otomatis memenangkan tim yang aktif chat di kolom komentar pertandingan jika lawannya tidak merespon (Skor 3-0).
                </p>
            </div>
        </Card>
    );
};
