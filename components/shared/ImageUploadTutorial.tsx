import React from 'react';
import { ExternalLink, Info } from 'lucide-react';

export const ImageUploadTutorial: React.FC = () => {
    return (
        <div className="bg-brand-secondary/40 border border-brand-accent/30 rounded-xl p-4 mt-2 mb-4 text-xs text-brand-light/80">
            <div className="flex items-center gap-2 mb-2 text-brand-vibrant font-bold uppercase tracking-wider">
                <Info size={14} />
                <span>Cara Upload Foto (Logo/SS)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 ml-1">
                <li>
                    Download aplikasi ImgBB di Play Store:{' '}
                    <a 
                        href="https://play.google.com/store/apps/details?id=com.imagetourl.imgcloud" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-brand-special hover:underline inline-flex items-center gap-1"
                    >
                        Download Disini <ExternalLink size={10} />
                    </a>
                </li>
                <li>Buka aplikasi ImgBB dan upload foto Anda.</li>
                <li>Copy link (URL) foto yang sudah berhasil diupload.</li>
                <li>Paste link tersebut di kolom input URL di bawah ini.</li>
            </ol>
        </div>
    );
};
