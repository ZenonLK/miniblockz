// scripts/tempo.js

const vento = new Audio('./efeitos/vento.mp3');
const uivo = new Audio('./efeitos/uivo.mp3');

export let tempoDoJogo = {
    hora: 8,       
    minuto: 0,
    // 🔥 CONFIGURAÇÃO MINI DAYZ: 1 minuto do jogo passa a cada 1000ms (1 segundo real).
    // Isso faz com que 24 horas de jogo durem exatamente 24 minutos na vida real!
    duracaoMinutoReal: 1000 
};

// Modificado para aceitar apenas os updates lógicos, sem forçar render secundário
export function iniciarRelogio(jogador, consumirStatusGradual) {
    setInterval(function() {
        if (!jogador.vivo) return;

        // Avança 1 minuto no jogo a cada 1 segundo real
        tempoDoJogo.minuto++;
        
        if (tempoDoJogo.minuto >= 60) {
            tempoDoJogo.minuto = 0;
            tempoDoJogo.hora++;
            if (tempoDoJogo.hora >= 24) {
                tempoDoJogo.hora = 0;
            }
        }

        // Consome os status de sobrevivência (Fome, Sede, etc)
        if (consumirStatusGradual) consumirStatusGradual(jogador);
        
    }, tempoDoJogo.duracaoMinutoReal);
}

export function desenharNoite(ctx, canvas, jogador) { 
    let opacidade = 0;
    let h = tempoDoJogo.hora;

    // Calcula a escuridão da noite baseado no horário
    if (h >= 18) { 
        opacidade = (h - 18) * 0.1; 
        vento.play();
        uivo.play();
    } else if (h >= 0 && h < 6) { 
        opacidade = 0.6 - (h * 0.1);
        vento.play();
        uivo.play();
    } else { 
        opacidade = 0;
    }

    // Se não estiver escuro, não precisa desenhar nada na tela
    if (opacidade <= 0) return;

    // Verifica se o jogador tem o item 'tocha' na mochila
    let temTocha = false;
    if (jogador && jogador.vivo && jogador.mochila) {
        temTocha = jogador.mochila.some(item => item.tipo === 'tocha');
    }

    // --- EXECUÇÃO DO SISTEMA DE LUZ ---
    if (temTocha && jogador && jogador.vivo) {
        // Se tem a tocha, isolamos o canvas para recortar e iluminar apenas ao redor do jogador
        ctx.save();

        // Como a câmera segue o jogador, ele fica fixo exatamente no centro da tela:
        let centroX = canvas.width / 2;
        let centroY = canvas.height / 2;

        // 1. Cria o gradiente radial para a luz (começa forte perto do corpo e dissipa no raio de 110 pixels)
        let luzTocha = ctx.createRadialGradient(centroX, centroY, 10, centroX, centroY, 110);
        
        // Cores quentes de fogo (Amarelo -> Laranja -> Transparente)
        luzTocha.addColorStop(0, 'rgba(254, 240, 138, 0.5)');   // Luz interna quente
        luzTocha.addColorStop(0.4, 'rgba(251, 146, 60, 0.2)');  // Brilho laranja espalhado
        luzTocha.addColorStop(1, 'rgba(5, 5, 15, 0)');          // Dissipa totalmente na escuridão

        // 2. Desenha a escuridão da noite na tela inteira
        ctx.fillStyle = `rgba(5, 5, 15, ${opacidade})`; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 3. Aplica o modo de mesclagem para desenhar o círculo de luz por cima suavizando a noite
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = luzTocha;
        ctx.beginPath();
        ctx.arc(centroX, centroY, 110, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // Restaura o estado original do canvas para os próximos frames
    } else {
        // Se NÃO tem tocha, o mundo fica completamente na escuridão padrão da noite
        ctx.fillStyle = `rgba(5, 5, 15, ${opacidade})`; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}