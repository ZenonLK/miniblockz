import { TILE_SIZE, inventarioAberto, mapaAberto } from './config.js'; 
import { tempoDoJogo } from './tempo.js';
import { listaFogueiras } from './mapa.js'; 

// --- OBJETO DO JOGADOR REAL ---
export const jogador = {
    x: 60,       
    y: 60,       
    cor: '#ff0000',
    vida: 100,
    fome: 100,
    sede: 100,
    vivo: true,
    mochila: [
        { tipo: 'comida', cor: '#f59e0b', nome: 'Feijao Enlatado' },
        { tipo: 'agua', cor: '#0ea5e9', nome: 'Garrafa de Agua' }
    ],
    MAX_SLOTS: 6,
    slotSelecionado: 0, 
    armaEquipada: false,
    balas: 0,
    sangrando: false,
    tempoUltimoDano: 0,
    calor: 100,
    pertoDaFogueira: false
};

// Variáveis de controle de movimento
let ultimoMovimento = 0;
const COOLDOWN_MOVIMENTO = 100; 
export let slotSelecionado = 0;

// --- CONSUMO GRADUAL DE FOME E SEDE ---
export function consumirStatusGradual() {
    if (!jogador.vivo) return;

    jogador.fome -= 0.03; 
    jogador.sede -= 0.05; 

    // --- SISTEMA DE FOGUEIRA ATUALIZADO ---
    jogador.pertoDaFogueira = false;

    for (let i = listaFogueiras.length - 1; i >= 0; i--) {
        let f = listaFogueiras[i];
        f.duracao--;

        let dx = jogador.x - f.x;
        let dy = jogador.y - f.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 2) {
            jogador.pertoDaFogueira = true;
        }

        if (f.duracao <= 0) {
            listaFogueiras.splice(i, 1);
            console.log("🔥 Uma fogueira se apagou.");
        }
    }

    let ehNoite = tempoDoJogo.hora >= 20 || tempoDoJogo.hora < 6;

    if (ehNoite && !jogador.pertoDaFogueira) {
        jogador.calor -= 0.5; // Sente frio no escuro
    } else {
        jogador.calor += 1.5; // Se aquece mais rápido de dia ou perto do fogo!
    }

    if (jogador.calor < 0) jogador.calor = 0;
    if (jogador.calor > 100) jogador.calor = 100;

    if (jogador.fome < 0) jogador.fome = 0;
    if (jogador.sede < 0) jogador.sede = 0;

    if (jogador.sangrando) {
        jogador.vida -= 0.2; 
        console.log("SANGUINÁRIO: HP restante ->", jogador.vida);
    }

    if (jogador.calor === 0) {
        jogador.vida -= 3; 
        console.log("Você está congelando de frio!");
    }

    if (jogador.fome === 0) jogador.vida -= 2; 
    if (jogador.sede === 0) jogador.vida -= 4; 

    let agora = Date.now();
    let tempoBloqueio = agora - jogador.tempoUltimoDano;

    if (jogador.fome > 60 && jogador.sede > 60 && jogador.vida < 100 && !jogador.sangrando && jogador.calor > 20 && tempoBloqueio > 5000) {
        jogador.vida += 0.4; 
        if (jogador.vida > 100) jogador.vida = 100;
    }

    if (jogador.vida <= 0) {
        jogador.vida = 0;
        jogador.vivo = false;
    }
}

// --- DESENHAR O JOGADOR NA TELA ---
export function desenharJogador(ctx, cameraX, cameraY) {
    if (jogador.vivo) {
        // 1. Calcula a posição exata onde o boneco vai aparecer na tela
        let telaX = (jogador.x - cameraX) * TILE_SIZE;
        let telaY = (jogador.y - cameraY) * TILE_SIZE;

        // 2. Desenha o quadrado vermelho do jogador
        ctx.fillStyle = jogador.cor;
        ctx.fillRect(telaX, telaY, TILE_SIZE, TILE_SIZE);

        // 3. 🔥 NOVO: TEXTO FLUTUANTE DE FRIO (Aparece se o calor cair abaixo de 30)
        if (jogador.calor < 98) {
            ctx.save();
            ctx.font = 'bold 10px "Courier New"';
            ctx.fillStyle = 'hsl(184, 91%, 64%)'; // Azul gelo bonito
            ctx.textAlign = 'center';
            // Desenha o texto centralizado 12 pixels acima do topo do jogador
            ctx.fillText("Estou com frio", telaX + (TILE_SIZE / 2), telaY - 12);
            ctx.restore();
        }
    }
}