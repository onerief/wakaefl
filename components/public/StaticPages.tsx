
import React from 'react';
import { Card } from '../shared/Card';
import { ShieldCheck, Info, FileText, ArrowLeft } from 'lucide-react';

interface StaticPageProps {
    type: 'privacy' | 'about' | 'terms';
    onBack: () => void;
}

export const StaticPages: React.FC<StaticPageProps> = ({ type, onBack }) => {
    const content = {
        privacy: {
            title: 'Privacy Policy',
            icon: <ShieldCheck size={40} className="text-brand-vibrant" />,
            body: `Kebijakan Privasi ini menjelaskan bagaimana WAKACL Hub mengumpulkan dan melindungi data Anda.
            
            1. Pengumpulan Informasi: Kami mengumpulkan nama dan email saat Anda mendaftar untuk keperluan profil manager tim.
            2. Penggunaan Data: Data digunakan untuk manajemen turnamen, tabel klasemen, dan fitur komunikasi komunitas.
            3. Cookie: Website kami menggunakan cookie dasar untuk menyimpan sesi login Anda agar tetap aman.
            4. Keamanan: Kami berkomitmen menjaga data Anda di server Firebase yang terenkripsi.
            
            Dengan menggunakan website ini, Anda menyetujui kebijakan privasi kami.`
        },
        about: {
            title: 'About Us',
            icon: <Info size={40} className="text-brand-special" />,
            body: `WAKACL Hub adalah platform komunitas eFootball terbesar di Way Kanan. 
            
            Misi kami adalah menyediakan wadah kompetisi yang profesional, transparan, dan seru bagi para pemain eFootball Mobile. Kami mengintegrasikan teknologi real-time untuk memantau klasemen, jadwal, dan berita terbaru seputar komunitas.
            
            Didirikan oleh komunitas untuk komunitas, WAKACL Hub terus berkembang menjadi portal informasi utama eFootball di Lampung.`
        },
        terms: {
            title: 'Terms of Service',
            icon: <FileText size={40} className="text-brand-light" />,
            body: `Ketentuan layanan penggunaan platform WAKACL Hub:
            
            1. Perilaku: Setiap pemain wajib menjunjung tinggi sportifitas.
            2. Akun: Pengguna bertanggung jawab atas keamanan akun masing-masing.
            3. Konten: Dilarang memposting konten sara atau kasar di fitur diskusi dan chat.
            4. Turnamen: Keputusan admin dalam sengketa pertandingan bersifat mutlak.
            
            Pelanggaran terhadap ketentuan ini dapat berakibat pada diskualifikasi tim atau penghapusan akun.`
        }
    };

    const page = content[type];

    return (
        <div className="max-w-3xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={onBack} className="flex items-center gap-2 text-brand-light hover:text-white mb-8 transition-colors">
                <ArrowLeft size={16} /> Kembali
            </button>
            
            <Card className="!p-8 sm:!p-12 border-white/5">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="p-4 bg-white/5 rounded-2xl mb-4 border border-white/10 shadow-xl">
                        {page.icon}
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter">
                        {page.title}
                    </h1>
                </div>

                <div className="prose prose-invert max-w-none">
                    <p className="text-brand-light leading-relaxed whitespace-pre-line text-lg italic opacity-80">
                        {page.body}
                    </p>
                </div>

                <div className="mt-16 pt-8 border-t border-white/5 text-center">
                    <p className="text-[10px] text-brand-light uppercase tracking-widest opacity-40">WAKACL HUB Official Document • 2024</p>
                </div>
            </Card>
        </div>
    );
};
