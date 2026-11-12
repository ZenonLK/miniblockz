// main.js

// 1. IMPORTAÇÕES (Atualizadas com as funções necessárias para o tiro)
import { canvas, ctx, LARGURA_MAPA, ALTURA_MAPA, jogoIniciado } from './config.js'; 
import { tempoDoJogo, iniciarRelogio, desenharNoite } from './tempo.js';
import { jogador, consumirStatusGradual, desenharJogador } from './jogador.js'; 
import { gerarMapa, renderizarTerreno, renderizarFogueiras, listaFogueiras, podeAndarObjeto } from './mapa.js';
import { gerarZumbisNoMundo, renderizarZumbis, iniciarLoopZumbis, atingirInimigoEmCoordenada } from './inimigos.js';
import { configurarTeclado, renderizarMenusSobrepostos } from './controles.js'; 
import { criarSangue, atualizarEDesenharParticulas } from './particulas.js';

const morte = new Audio('./efeitos/morte.mp3');

// Tamanho de cada bloco (Tile) em pixels
const TAMANHO_TILE = 32; 

// 2. FUNÇÃO PRINCIPAL DE REDESENHAR A TELA
export function atualizarJogo() {
    // 1️⃣ Agenda o próximo frame continuamente
    requestAnimationFrame(atualizarJogo);

    // 2️⃣ Limpa a tela
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 📐 CÁLCULO DA CÂMERA
    let tilesVisiveisX = Math.ceil(canvas.width / TAMANHO_TILE);
    let tilesVisiveisY = Math.ceil(canvas.height / TAMANHO_TILE);

    let cameraX = jogador.x - Math.floor(tilesVisiveisX / 2);
    let cameraY = jogador.y - Math.floor(tilesVisiveisY / 2);

    if (cameraX < 0) cameraX = 0;
    if (cameraY < 0) cameraY = 0;
    if (cameraX > LARGURA_MAPA - tilesVisiveisX) cameraX = LARGURA_MAPA - tilesVisiveisX;
    if (cameraY > ALTURA_MAPA - tilesVisiveisY) cameraY = ALTURA_MAPA - tilesVisiveisY;

    try {
        window.VISIVEL_LARGURA = tilesVisiveisX;
        window.VISIVEL_ALTURA = tilesVisiveisY;
    } catch (e) {
        console.log(e);
    }

    // 4️⃣ RENDERIZAÇÃO DO MUNDO DO SEU JOGO
    // 4️⃣ RENDERIZAÇÃO DO MUNDO DO SEU JOGO (ORDEM CORRIGIDA POR CAMADAS)
    renderizarTerreno(ctx, cameraX, cameraY);      // 1. O chão/cenário fica embaixo
    renderizarFogueiras(ctx, cameraX, cameraY);    // 2. Elementos estáticos do mapa
    desenharJogador(ctx, cameraX, cameraY);        // 3. Desenha o jogador
    renderizarZumbis(ctx, cameraX, cameraY);       // 4. Desenha os zumbis
    // 🔥 O Sangue entra AQUI! Ele precisa ser desenhado por cima dos zumbis e do chão!
    atualizarEDesenharParticulas(ctx, cameraX, cameraY);     
    // 5. Efeitos globais e HUD (Sempre no topo de tudo)
    desenharNoite(ctx, canvas, jogador);           
    desenharInterfaceHUD();                        
    renderizarMenusSobrepostos(ctx, canvas);

    // 💀 TELA DE MORTE
    if (!jogador.vivo) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 30px "Courier New"';
        ctx.fillText("VOCÊ MORREU", canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
        morte.play();
    }
}

// 3. FUNÇÃO AUXILIAR DA HUD REESTILIZADA
function desenharInterfaceHUD() {
    let startX = 16; 
    let startY = 16; 
    let larguraBarra = 130; 
    let alturaBarra = 14;
    let espacamentoY = 22;

    // --- 1. FUNDO DO PAINEL DA HUD ---
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)'; 
    ctx.fillRect(startX - 6, startY - 6, larguraBarra + 80, 94);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX - 6, startY - 6, larguraBarra + 80, 94);

    // --- 2. BARRA DE VIDA (HP) ---
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(startX, startY, larguraBarra, alturaBarra);
    ctx.fillStyle = jogador.vida > 30 ? '#ef4444' : '#b91c1c';
    ctx.fillRect(startX, startY, (jogador.vida / 100) * larguraBarra, alturaBarra);
    ctx.fillStyle = '#fca5a5'; ctx.font = '9px "Courier New"';
    ctx.fillText("VIT", startX + 4, startY + 11);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px "Courier New"';
    ctx.fillText(`${Math.floor(jogador.vida)}%`, startX + larguraBarra + 8, startY + 11);

    // --- 3. BARRA DE FOME ---
    let yFome = startY + espacamentoY;
    ctx.fillStyle = '#2d1a10';
    ctx.fillRect(startX, yFome, larguraBarra, alturaBarra);
    ctx.fillStyle = jogador.fome > 25 ? '#f59e0b' : '#b45309';
    ctx.fillRect(startX, yFome, (jogador.fome / 100) * larguraBarra, alturaBarra);
    ctx.fillStyle = '#fde68a'; ctx.font = '9px "Courier New"';
    ctx.fillText("FOM", startX + 4, yFome + 11);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px "Courier New"';
    ctx.fillText(`${Math.floor(jogador.fome)}%`, startX + larguraBarra + 8, yFome + 11);

    // --- 4. BARRA DE SEDE ---
    let ySede = yFome + espacamentoY;
    ctx.fillStyle = '#0c2340';
    ctx.fillRect(startX, ySede, larguraBarra, alturaBarra);
    ctx.fillStyle = jogador.sede > 25 ? '#38bdf8' : '#0369a1';
    ctx.fillRect(startX, ySede, (jogador.sede / 100) * larguraBarra, alturaBarra);
    ctx.fillStyle = '#bae6fd'; ctx.font = '9px "Courier New"';
    ctx.fillText("SED", startX + 4, ySede + 11);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px "Courier New"';
    ctx.fillText(`${Math.floor(jogador.sede)}%`, startX + larguraBarra + 8, ySede + 11);

    // --- 4.5. BARRA DE CALOR (TEMPERATURA) ---
    let yCalor = ySede + espacamentoY;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(startX, yCalor, larguraBarra, alturaBarra);
    ctx.fillStyle = jogador.calor > 30 ? 'rgb(191, 204, 209)' : '#6366f1'; 
    ctx.fillRect(startX, yCalor, (jogador.calor / 100) * larguraBarra, alturaBarra);
    ctx.fillStyle = '#e2e8f0'; ctx.font = '9px "Courier New"';
    ctx.fillText("TER", startX + 4, yCalor + 11);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px "Courier New"';
    ctx.fillText(`${Math.floor(jogador.calor)}%`, startX + larguraBarra + 8, yCalor + 11);

    // --- 5. RELÓGIO ---
    let horaFormatada = String(tempoDoJogo.hora).padStart(2, '0');
    let minutoFormatado = String(tempoDoJogo.minuto).padStart(2, '0');
    
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'; 
    ctx.fillRect(canvas.width - 95, 12, 83, 24); 
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeRect(canvas.width - 95, 12, 83, 24);
    
    ctx.fillStyle = '#facc15'; ctx.font = 'bold 12px "Courier New"';
    ctx.fillText(`🕒 ${horaFormatada}:${minutoFormatado}`, canvas.width - 88, 28);

    // --- 6. INDICADOR DE MUNIÇÃO ---
    if (jogador.armaEquipada) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'; 
        ctx.fillRect(canvas.width - 95, 42, 83, 20);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeRect(canvas.width - 95, 42, 83, 20);
        
        ctx.fillStyle = '#eab308'; ctx.font = 'bold 11px "Courier New"';
        ctx.fillText(`🔫 AMMO: ${jogador.balas}`, canvas.width - 88, 56);
    }
}

// --- 🔥 SISTEMA DE DISPARO INSTANTÂNEO COM O BOTÃO ESQUERDO DO MOUSE ---
canvas.addEventListener('mousedown', function(evento) {
    // Só atira se o jogo estiver rodando, o jogador vivo e com a arma equipada!
    if (!jogoIniciado.ativo || !jogador.vivo || !jogador.armaEquipada) return;

    // Garante que é o botão esquerdo (botão 0)
    if (evento.button !== 0) return;

    // Checa se o jogador tem balas ANTES de calcular qualquer coisa
    if (jogador.balas <= 0) {
        console.log("🪹 Click! Sem munição!");
        return;
    }

    // 1. Descobre a posição exata do clique dentro do canvas
    let rect = canvas.getBoundingClientRect();
    let mouseX = evento.clientX - rect.left;
    let mouseY = evento.clientY - rect.top;

    // 2. Calcula as coordenadas da Câmera atuais
    let tilesVisiveisX = Math.ceil(canvas.width / TAMANHO_TILE);
    let tilesVisiveisY = Math.ceil(canvas.height / TAMANHO_TILE);

    let cameraX = jogador.x - Math.floor(tilesVisiveisX / 2);
    let cameraY = jogador.y - Math.floor(tilesVisiveisY / 2);

    if (cameraX < 0) cameraX = 0;
    if (cameraY < 0) cameraY = 0;
    if (cameraX > LARGURA_MAPA - tilesVisiveisX) cameraX = LARGURA_MAPA - tilesVisiveisX;
    if (cameraY > ALTURA_MAPA - tilesVisiveisY) cameraY = ALTURA_MAPA - tilesVisiveisY;

    // 3. Converte a posição do clique de pixels da tela para coordenadas de BLOCO no Mapa
    let alvoMapaX = cameraX + Math.floor(mouseX / TAMANHO_TILE);
    let alvoMapaY = cameraY + Math.floor(mouseY / TAMANHO_TILE);

    // Gasta uma bala
    jogador.balas--;

    // Som do tiro protegido
    try {
        const som_disparo = new Audio('./efeitos/disparo.mp3');
        som_disparo.play().catch(e => console.log("Nota: Som do tiro não carregado."));
    } catch(e) {
        console.log("Erro ao reproduzir som:", e);
    }

    // 🎯 TRAJETÓRIA DA BALA (Algoritmo de Linha de Bresenham)
    let x0 = Math.floor(jogador.x);
    let y0 = Math.floor(jogador.y);
    let x1 = alvoMapaX;
    let y1 = alvoMapaY;

    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    let alcanceMaximo = 12; 
    let passos = 0;

    while (passos < alcanceMaximo) {
        // Ignora o bloco inicial onde o próprio jogador está em pé
        if (passos > 0) {
            // 1. Checa colisão com cenário (Paredes, árvores, água)
            if (!podeAndarObjeto(x0, y0)) {
                break;
            }

            // 2. Tenta acertar um zumbi na coordenada exata atual da linha
            let acertou = atingirInimigoEmCoordenada(x0, y0, 35); 
            if (acertou) {
                // 🔥 CORREÇÃO DAQUI: Passa as variáveis certas do ponto de colisão atual do loop!
                criarSangue(x0, y0); 
                break; 
            }
        }

        // Se chegou no bloco exato onde o mouse clicou, para a bala
        if (x0 === x1 && y0 === y1) break;

        // Avança para o próximo bloco da linha matemática
        let e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }

        passos++;
    }
});

// 4. INICIALIZAÇÃO COMPLETA
gerarMapa(jogador);
gerarZumbisNoMundo();
configurarTeclado(atualizarJogo);

jogoIniciado.ativo = true; 

// 🔥 REMOVIDO: 'atualizarJogo' não é mais passado aqui para evitar duplicar o loop de render
iniciarRelogio(jogador, consumirStatusGradual); 
iniciarLoopZumbis(jogador);
atualizarJogo();