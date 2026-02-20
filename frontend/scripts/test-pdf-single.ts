import fs from 'fs';
import path from 'path';
import { extractText } from '../lib/pdf-service';

async function testSingle() {
    console.log('🧪 Iniciando Teste Unitário de Extração...\n');

    // Caminho para um PDF de teste conhecido no node_modules
    const filePath = path.resolve(__dirname, '../node_modules/pdf-parse/test/data/02-valid.pdf');

    if (!fs.existsSync(filePath)) {
        console.error(`❌ PDF de teste não encontrado: ${filePath}`);
        return;
    }

    const buffer = fs.readFileSync(filePath);
    console.log(`📂 Arquivo: ${path.basename(filePath)} (${buffer.length} bytes)`);

    try {
        const text = await extractText(buffer, '02-valid.pdf');
        console.log(`\n✅ Resultado:`);
        console.log(`   - Chars: ${text.length}`);
        console.log(`   - Início do Texto: "${text.substring(0, 50)}..."`);
    } catch (err: any) {
        console.error(`\n❌ Falha no teste: ${err.message}`);
    }

    console.log('\n🏁 Fim do teste.');
    process.exit(0);
}

testSingle().catch(err => {
    console.error(err);
    process.exit(1);
});
