import fs from 'fs';
import path from 'path';
import { extractText } from '../lib/pdf-service';

async function runBenchmark() {
    console.log('🚀 Iniciando Benchmark de Extração de Texto...\n');

    // Caminho para a pasta de currículos (usando os que já estão no node_modules para teste)
    const testFolder = path.resolve(__dirname, '../node_modules/pdf-parse/test/data');

    if (!fs.existsSync(testFolder)) {
        console.error(`❌ Pasta de testes não encontrada: ${testFolder}`);
        // Tentar encontrar arquivos PDF em qualquer lugar do projeto para testar
        return;
    }

    const files = fs.readdirSync(testFolder).filter(f => f.endsWith('.pdf') || f.endsWith('.docx'));

    if (files.length === 0) {
        console.log('⚠️ Nenhum arquivo PDF/DOCX encontrado para teste em ' + testFolder);
        return;
    }

    console.log(`📋 Encontrados ${files.length} arquivos para teste.\n`);

    for (const file of files) {
        const filePath = path.join(testFolder, file);
        const buffer = fs.readFileSync(filePath);

        try {
            const text = await extractText(buffer, file);
            console.log(`   📄 Resultado para ${file}: ${text.length > 0 ? 'SUCESSO' : 'VAZIO'} (${text.length} chars)`);
        } catch (err: any) {
            console.error(`   ❌ Erro em ${file}: ${err.message}`);
        }
        console.log('   ----------------------------------------');
    }

    console.log('\n🏁 Benchmark concluído.');
}

runBenchmark().catch(console.error);
