import { Octokit } from "@octokit/rest";

// Esta função será o nosso endpoint da API
export default async function handler(request, response) {
    // Permite que qualquer site (incluindo seu github.io) chame esta API
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // O Vercel responde a solicitações OPTIONS automaticamente
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // Só permite requisições POST
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Apenas o método POST é permitido.' });
    }

    const { stock, history } = request.body;
    
    // Validação básica dos dados recebidos
    if (!stock || !history) {
        return response.status(400).json({ message: 'Dados de estoque ou histórico ausentes.' });
    }

    // Configurações do GitHub
    const octokit = new Octokit({ auth: process.env.GITHUB_PAT });
    const owner = process.env.GITHUB_OWNER; // Ex: "seu_nome_de_usuario_github"
    const repo = process.env.GITHUB_REPO;   // Ex: "controle-de-estoque"
    const path = 'data/db.json';
    const message = `[API] Atualiza o banco de dados de estoque - ${new Date().toISOString()}`;

    // Conteúdo formatado para o arquivo JSON
    const content = JSON.stringify({ stock, history }, null, 2);
    const contentEncoded = Buffer.from(content).toString('base64');

    try {
        // Pega o SHA do arquivo atual para poder atualizá-lo
        const { data: fileData } = await octokit.repos.getContent({ owner, repo, path });
        
        // Envia a atualização para o GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message,
            content: contentEncoded,
            sha: fileData.sha,
        });

        return response.status(200).json({ message: 'Dados atualizados com sucesso no GitHub.' });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: `Erro ao atualizar o arquivo no GitHub: ${error.message}` });
    }
}
