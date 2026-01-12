import { GoogleGenAI } from "@google/genai";

export const generateSummary = async (teamA: string, teamB: string, scoreA: number, scoreB: number): Promise<string> => {
    // Kunci API diharapkan akan disuntikkan oleh lingkungan eksekusi.
    // Kami akan melanjutkan dengan asumsi itu tersedia, sesuai pedoman.
    // Blok try/catch akan menangani setiap kesalahan runtime jika kunci hilang atau tidak valid.
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const prompt = `Buat ringkasan pertandingan eFootball yang dramatis dan seru antara ${teamA} dan ${teamB}. Skor akhir adalah ${teamA} ${scoreA} - ${scoreB} ${teamB}. Jelaskan momen-momen penting dan suasana keseluruhan pertandingan. Buat kurang dari 70 kata. Jangan gunakan markdown.`;
        
        // Fixed: Use gemini-3-flash-preview for summarization task as per guidelines
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        const text = response.text;
        if (!text) {
          throw new Error("Menerima ringkasan kosong dari AI.");
        }
        return text;
    } catch (error) {
        console.error("Error generating summary with Gemini:", error);
        // Melempar kembali kesalahan untuk ditangani oleh komponen UI yang memanggil
        throw new Error("Tidak dapat membuat ringkasan untuk pertandingan ini. Silakan periksa konsol untuk detailnya.");
    }
};
