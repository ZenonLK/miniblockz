// particulas.js

export let listaParticulas = [];

/**
 * Cria várias partículas de sangue fixas no chão na coordenada do tiro
 */
export function criarSangue(mapaX, mapaY) {
    // 5 a 10 quadradinhos combinados criam uma poça com formato orgânico e realista
    let quantidade = 5 + Math.floor(Math.random() * 5);

    for (let i = 0; i < quantidade; i++) {
        // 🔥 O SEGREDO DO LUGAR FIXO:
        // Em vez de velocidade, damos um pequeno "deslocamento" (offset) aleatório
        // para as gotículas nascerem espalhadas dentro daquele mesmo bloco, simulando a poça.
        let offsetX = (Math.random() - 0.5) * 0.4; // Espalha levemente para os lados
        let offsetY = (Math.random() - 0.5) * 0.4; // Espalha levemente para cima/baixo

        listaParticulas.push({
            x: mapaX + 0.5 + offsetX, // Posição fixa no mapa (estática!)
            y: mapaY + 0.5 + offsetY,
            tamanho: 6 + Math.random() * 8, // Tamanho variado para parecer poça real
            vida: 1.0, // Começa em 100%
            // 🔥 MUITO MAIS LENTO: Passou para 0.002. 
            // Mesmo que seu loop rode acelerado, vai demorar muito mais para sumir!
            decaimento: 0.002 
        });
    }
}

/**
 * Atualiza o esmaecimento das partículas e renderiza no chão aplicando a Câmera
 */
export function atualizarEDesenharParticulas(ctx, cameraX, cameraY) {
    const TAMANHO_TILE = 32;

    if (listaParticulas.length === 0) return;

    for (let i = listaParticulas.length - 1; i >= 0; i--) {
        let p = listaParticulas[i];

        // 1. Consome a vida de forma extremamente lenta
        p.vida -= p.decaimento;

        if (p.vida <= 0) {
            listaParticulas.splice(i, 1);
            continue;
        }

        // 2. CÁLCULO DE TELA FIXO NO MAPA
        // Como p.x e p.y não mudam, a poça fica cravada no chão enquanto a câmera e o zumbi andam!
        let telaX = (p.x - cameraX) * TAMANHO_TILE;
        let telaY = (p.y - cameraY) * TAMANHO_TILE;

        // 3. Renderização da poça de sangue estática
        ctx.save();
        ctx.fillStyle = `rgba(153, 27, 27, ${p.vida})`; // Vermelho escuro/coagulado bem marcante na grama
        
        ctx.fillRect(
            Math.floor(telaX - p.tamanho / 2), 
            Math.floor(telaY - p.tamanho / 2), 
            p.tamanho, 
            p.tamanho
        );
        
        ctx.restore();
    }
}