import imaps from 'imap-simple';

export async function testImapConnection(config: any) {
    try {
        const connectionConfig = {
            imap: {
                user: config.user,
                password: config.password,
                host: config.host,
                port: config.port,
                tls: config.secure,
                authTimeout: 10000
            }
        };

        const connection = await imaps.connect(connectionConfig);
        await connection.openBox('INBOX');
        connection.end();
        return { success: true };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Falha desconhecida na conexão IMAP'
        };
    }
}
