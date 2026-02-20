// Compatibilidade com Next.js server-side e scripts Node.js
import pdf from 'pdf-parse';
// @ts-ignore
let pdfParse = typeof pdf === 'function' ? pdf : (pdf as any).default;

if (typeof pdfParse !== 'function') {
    try {
        // Fallback para importação direta em ambientes onde a exportação padrão falha
        pdfParse = require('pdf-parse/lib/pdf-parse.js');
    } catch (e) {
        console.error('[PDF-SERVICE] Erro ao tentar fallback do pdf-parse:', e);
    }
}
// @ts-ignore
import mammoth from 'mammoth';

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
    const startTime = Date.now();
    console.log(`[PDF-SERVICE] [${new Date().toISOString()}] Iniciando extração: ${filename} (${buffer.length} bytes)`);

    try {
        const lowerName = filename.toLowerCase()

        if (lowerName.endsWith('.pdf')) {
            try {
                // pdf-parse doesn't have a native timeout, so we use a race
                const parsePromise = pdfParse(buffer);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout de extração do PDF (30s)')), 30000)
                );

                const data = await Promise.race([parsePromise, timeoutPromise]) as any;

                if (!data || !data.text) {
                    console.warn(`[PDF-Loader] PDF sem texto extraível: ${filename}`);
                    return '';
                }

                const cleanText = data.text.replace(/\s+/g, ' ').trim();
                const duration = Date.now() - startTime;

                console.log(`[PDF-SERVICE] ✅ PDF extraído em ${duration}ms. Chars: ${cleanText.length}`);

                if (cleanText.length < 50) {
                    console.warn(`[PDF-Loader] ⚠️ Texto extremamente curto (${cleanText.length} chars) em ${filename}. Provavelmente é um PDF digitalizado ou imagem.`);
                }

                return cleanText;
            } catch (parseError: any) {
                const duration = Date.now() - startTime;
                console.error(`[PDF-SERVICE] ❌ Erro ao processar PDF (${filename}) após ${duration}ms:`, parseError.message);
                throw new Error(`Falha ao processar PDF: ${parseError.message}`);
            }
        }

        if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
            try {
                const result = await mammoth.extractRawText({ buffer: buffer });
                const duration = Date.now() - startTime;

                if (!result.value) {
                    console.warn(`[DOCX-Loader] DOCX sem texto: ${filename}`);
                    return '';
                }

                const cleanText = result.value.replace(/\s+/g, ' ').trim();
                console.log(`[PDF-SERVICE] ✅ DOCX extraído em ${duration}ms. Chars: ${cleanText.length}`);
                return cleanText;
            } catch (mammothError: any) {
                console.error(`[PDF-SERVICE] ❌ Erro DOCX (${filename}):`, mammothError.message);
                throw new Error(`Falha ao ler DOCX: ${filename} - ${mammothError.message}`);
            }
        }

        if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
            console.log(`[PDF-SERVICE] TXT/MD detectado.`);
            return buffer.toString('utf-8');
        }

        if (lowerName.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
            console.warn(`[PDF-SERVICE] Imagem detectada (OCR indisponível): ${filename}`);
            return '';
        }

        console.warn(`[PDF-SERVICE] Formato não suportado: ${filename}`)
        return '';

    } catch (error: any) {
        console.error(`[PDF-SERVICE] Erro crítico em ${filename}:`, error.message);
        throw error;
    }
}

// Manter compatibilidade
export const extractTextFromPdf = async (buffer: Buffer) => extractText(buffer, 'unknown.pdf')
