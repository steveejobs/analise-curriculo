
import { spawn } from 'child_process';
import path from 'path';

function startAgent() {
    console.log('🚀 Starting AI Agent...');

    // Using npx tsx to run the agent
    const agent = spawn('npx', ['tsx', 'scripts/ai-agent.ts'], {
        stdio: 'inherit',
        shell: true,
        cwd: path.resolve(__dirname, '..')
    });

    agent.on('close', (code) => {
        console.error(`❌ AI Agent crashed with exit code ${code}`);
        console.log('🔄 Restarting in 3 seconds...');
        setTimeout(startAgent, 3000);
    });

    agent.on('error', (err) => {
        console.error('Failed to start agent:', err);
    });
}

startAgent();
