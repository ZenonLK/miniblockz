// scripts/inimigo.js
import { TILE_SIZE, LARGURA_MAPA, ALTURA_MAPA, TILES } from './config.js'; 
import { mapa, podeAndarObjeto, listaBarricadas } from './mapa.js'; 
import { criarSangue } from './particulas.js';

// Listas globais de ameaças ativas
export let listaZumbis = [];
export let listaBots = []; // 🔥 NOVA: Guarda os sobreviventes inimigos

// Efeitos sonoros
const ataque_zumbi = new Audio('./efeitos/ataque_zumbi.mp3'); 
const som_tiro_bot = new Audio('./efeitos/disparo.mp3'); // Certifique-se de ter esse som na pasta!

// Atributos dos Infectados
const TIPOS_ZUMBI = {
    COMUM: { nome: 'Comum', cor: '#3f6212', vidaMax: 100, dano: 8, raioVisao: 6, tamanhoMenos: 4 },
    CORREDOR: { nome: 'Corredor', cor: '#991b1b', vidaMax: 100, dano: 5, raioVisao: 8, tamanhoMenos: 6 },
    TANQUE: { nome: 'Tanque', cor: '#14532d', vidaMax: 100, dano: 20, raioVisao: 5, tamanhoMenos: 0 } 
};

// --- FUNÇÃO PARA CRIAR ZUMBIS E BOTS NO MUNDO ---
export function gerarZumbisNoMundo() {
    listaZumbis = [];
    listaBots = []; // Reseta a lista de bots
    
    let zumbisCriados = 0;
    let botsCriados = 0;
    
    const totalZumbisAlvo = 50; 
    const totalBotsAlvo = 15; // 🤖 Quantidade de bots armados espalhados pelo mapa

    // Mapeia os blocos urbanos para concentrar o spawn nelas
    let blocosUrbanos = [];
    for (let y = 0; y < ALTURA_MAPA; y++) {
        for (let x = 0; x < LARGURA_MAPA; x++) {
            if (mapa[y][x] === TILES.CONCRETO.id) {
                blocosUrbanos.push({ x: x, y: y });
            }
        }
    }

    if (blocosUrbanos.length === 0) {
        blocosUrbanos.push({ x: Math.floor(LARGURA_MAPA/2), y: Math.floor(ALTURA_MAPA/2) });
    }

    // --- LOOP GERADOR DE ZUMBIS ---
    while (zumbisCriados < totalZumbisAlvo) {
        let blocoAleatorio = blocosUrbanos[Math.floor(Math.random() * blocosUrbanos.length)];
        let xAleatorio = blocoAleatorio.x + Math.floor(Math.random() * 7) - 3;
        let yAleatorio = blocoAleatorio.y + Math.floor(Math.random() * 7) - 3;

        if (xAleatorio >= 0 && xAleatorio < LARGURA_MAPA && yAleatorio >= 0 && yAleatorio < ALTURA_MAPA) {
            if (podeAndarObjeto(xAleatorio, yAleatorio)) {
                let chanceTipo = Math.random();
                let configAtributos = chanceTipo < 0.20 ? TIPOS_ZUMBI.CORREDOR : (chanceTipo < 0.35 ? TIPOS_ZUMBI.TANQUE : TIPOS_ZUMBI.COMUM);

                listaZumbis.push({
                    x: xAleatorio, y: yAleatorio,
                    tipo: configAtributos.nome, cor: configAtributos.cor,
                    vida: configAtributos.vidaMax, dano: configAtributos.dano,
                    raioVisao: configAtributos.raioVisao, tamanhoMenos: configAtributos.tamanhoMenos,
                    tempoAlerta: 0
                });
                zumbisCriados++;
            }
        }
    }

    // --- 🤖 LOOP GERADOR DE BOTS INIMIGOS ---
    while (botsCriados < totalBotsAlvo) {
        let blocoAleatorio = blocosUrbanos[Math.floor(Math.random() * blocosUrbanos.length)];
        let xAleatorio = blocoAleatorio.x + Math.floor(Math.random() * 5) - 2;
        let yAleatorio = blocoAleatorio.y + Math.floor(Math.random() * 5) - 2;

        if (xAleatorio >= 0 && xAleatorio < LARGURA_MAPA && yAleatorio >= 0 && yAleatorio < ALTURA_MAPA) {
            if (podeAndarObjeto(xAleatorio, yAleatorio)) {
                listaBots.push({
                    x: xAleatorio,
                    y: yAleatorio,
                    cor: '#1e3a8a', // Azul escuro (jaqueta de sobrevivente)
                    vida: 40,       // HP do Bot humano
                    raioVisao: 10,   // 🔥 Enxergam bem mais longe que os zumbis!
                    danoTiro: 12,   // Dano do tiro da pistola deles
                    cooldownTiro: 0 // Controle para não atirarem igual metralhadora
                });
                botsCriados++;
            }
        }
    }
}

// --- INTELIGÊNCIA ARTIFICIAL ATUALIZADA ---
export function atualizarZumbis(jogador) {
    if (!jogador.vivo) return;

    // 1. Atualizar os Zumbis
    for (let i = 0; i < listaZumbis.length; i++) {
        let zumbi = listaZumbis[i];
        let distX = jogador.x - zumbi.x;
        let distY = jogador.y - zumbi.y;
        let distancia = Math.sqrt(distX * distX + distY * distY);

        if (distancia < zumbi.raioVisao) zumbi.tempoAlerta = 12;

        if (zumbi.tempoAlerta > 0) {
            zumbi.tempoAlerta--;
            
            // Ritmo de ataque do Tanque (checa se já está colado antes de prosseguir)
            if (zumbi.tipo === 'Tanque' && zumbi.tempoAlerta % 2 === 0) {
                checarAtaqueJogador(zumbi, jogador);
                continue;
            }

            let proximoX = zumbi.x + (Math.abs(distX) > Math.abs(distY) ? (distX > 0 ? 1 : -1) : 0);
            let proximoY = zumbi.y + (Math.abs(distX) <= Math.abs(distY) ? (distY > 0 ? 1 : -1) : 0);

            // Se o próximo bloco for o jogador, ele NÃO anda, mas não pulamos o turno com 'continue'
            let destinoOcupadoPeloJogador = (proximoX === jogador.x && proximoY === jogador.y);

            let ehBarricada = mapa[proximoY]?.[proximoX] === TILES.FLORESTA.id && listaBarricadas.some(b => b.x === proximoX && b.y === proximoY);
            if (ehBarricada) {
                try { ataque_zumbi.play(); } catch(e){}
                mapa[proximoY][proximoX] = TILES.GRAMA.id;
                let index = listaBarricadas.findIndex(b => b.x === proximoX && b.y === proximoY);
                if (index !== -1) listaBarricadas.splice(index, 1);
                continue; 
            }

            // Só altera a posição física se o destino NÃO for o bloco do jogador
            if (!destinoOcupadoPeloJogador && podeAndarObjeto(proximoX, proximoY)) { 
                zumbi.x = proximoX; 
                zumbi.y = proximoY; 
            }
            
            // Independentemente de ter andado ou ficado parado na barreira, ele tenta morder!
            checarAtaqueJogador(zumbi, jogador);

        } else {
            let chanceMover = zumbi.tipo === 'Corredor' ? 0.25 : (zumbi.tipo === 'Tanque' ? 0.05 : 0.15);
            if (Math.random() < chanceMover) { 
                let dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
                let dir = dirs[Math.floor(Math.random() * dirs.length)];
                
                let randX = zumbi.x + dir.x;
                let randY = zumbi.y + dir.y;

                if (randX !== jogador.x || randY !== jogador.y) {
                    if (podeAndarObjeto(randX, randY)) { zumbi.x = randX; zumbi.y = randY; }
                }
            }
        }
    }

    // 2. 🤖 IA DOS BOTS HUMANOS
    for (let i = 0; i < listaBots.length; i++) {
        let bot = listaBots[i];
        let distX = jogador.x - bot.x;
        let distY = jogador.y - bot.y;
        let distancia = Math.sqrt(distX * distX + distY * distY);

        if (bot.cooldownTiro > 0) bot.cooldownTiro--;

        if (distancia < bot.raioVisao) {
            if (bot.cooldownTiro === 0) {
                try { som_tiro_bot.play(); } catch(e){}
                
                jogador.vida -= bot.danoTiro;
                jogador.tempoUltimoDano = Date.now();
                bot.cooldownTiro = 4;

                console.log(`⚠️ 🤖 Um Sobrevivente Inimigo atirou em você! Vida restante: ${jogador.vida}`);

                if (jogador.vida <= 0) {
                    jogador.vida = 0;
                    jogador.vivo = false;
                }
            }

            if (distancia > 4) {
                let proximoX = bot.x + (Math.abs(distX) > Math.abs(distY) ? (distX > 0 ? 1 : -1) : 0);
                let proximoY = bot.y + (Math.abs(distX) <= Math.abs(distY) ? (distY > 0 ? 1 : -1) : 0);
                
                if (proximoX !== jogador.x || proximoY !== jogador.y) {
                    if (podeAndarObjeto(proximoX, proximoY)) { bot.x = proximoX; bot.y = proximoY; }
                }
            } else if (distancia < 3) {
                let proximoX = bot.x - (distX > 0 ? 1 : -1);
                let proximoY = bot.y - (distY > 0 ? 1 : -1);
                if (podeAndarObjeto(proximoX, proximoY)) { bot.x = proximoX; bot.y = proximoY; }
            }
        } else {
            if (Math.random() < 0.20) {
                let dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
                let dir = dirs[Math.floor(Math.random() * dirs.length)];
                
                let randX = bot.x + dir.x;
                let randY = bot.y + dir.y;

                if (randX !== jogador.x || randY !== jogador.y) {
                    if (podeAndarObjeto(randX, randY)) { bot.x = randX; bot.y = randY; }
                }
            }
        }
    }
}

// 🔥 SISTEMA DE ATAQUE CALIBRADO: Ataca se estiver na mesma posição OU colado nas bordinhas (distância <= 1 bloco)
function checarAtaqueJogador(zumbi, jogador) {
    let dx = Math.abs(jogador.x - zumbi.x);
    let dy = Math.abs(jogador.y - zumbi.y);

    // Se estiver exatamente no mesmo quadrado (caso antigo) OU a exatamente 1 bloco de distância (adjacente)
    if ((dx === 0 && dy === 0) || (dx + dy === 1)) {
        jogador.vida -= zumbi.dano;
        try { ataque_zumbi.play(); } catch(e){}
        jogador.tempoUltimoDano = Date.now();
        let chanceSangrar = zumbi.tipo === 'Corredor' ? 0.50 : 0.25;
        if (!jogador.sangrando && Math.random() < chanceSangrar) {
            jogador.sangrando = true;
            console.log("🩸 Ferimento grave! Você começou a sangrar!");
        }
        if (jogador.vida <= 0) { jogador.vida = 0; jogador.vivo = false; }
    }
}

// --- DESENHAR INIMIGOS (ZUMBIS + BOTS) NA TELA ---
export function renderizarZumbis(ctx, cameraX, cameraY) {
    let tilesAtuaisX = Math.ceil(ctx.canvas.width / TILE_SIZE);
    let tilesAtuaisY = Math.ceil(ctx.canvas.height / TILE_SIZE);

    // 1. Renderiza os Zumbis
    for (let i = 0; i < listaZumbis.length; i++) {
        let zumbi = listaZumbis[i];
        if (zumbi.x >= cameraX && zumbi.x < cameraX + tilesAtuaisX && zumbi.y >= cameraY && zumbi.y < cameraY + tilesAtuaisY) {
            let recuo = zumbi.tamanhoMenos;
            let xTela = (zumbi.x - cameraX) * TILE_SIZE;
            let yTela = (zumbi.y - cameraY) * TILE_SIZE;

            ctx.fillStyle = zumbi.cor;
            ctx.fillRect(xTela + (recuo/2), yTela + (recuo/2), TILE_SIZE - recuo, TILE_SIZE - recuo);
            
            ctx.fillStyle = '#ff0000';
            if (zumbi.tipo === 'Tanque') {
                ctx.fillRect(xTela + 6, yTela + 6, 6, 6); ctx.fillRect(xTela + 20, yTela + 6, 6, 6);
            } else {
                ctx.fillRect(xTela + 5, yTela + 6, 4, 4); ctx.fillRect(xTela + 15, yTela + 6, 4, 4);
            }
        }
    }

    // 2. 🤖 Renderiza os Bots Inimigos
    for (let i = 0; i < listaBots.length; i++) {
        let bot = listaBots[i];
        if (bot.x >= cameraX && bot.x < cameraX + tilesAtuaisX && bot.y >= cameraY && bot.y < cameraY + tilesAtuaisY) {
            let xTela = (bot.x - cameraX) * TILE_SIZE;
            let yTela = (bot.y - cameraY) * TILE_SIZE;

            ctx.fillStyle = bot.cor;
            ctx.fillRect(xTela + 4, yTela + 4, TILE_SIZE - 8, TILE_SIZE - 8);

            ctx.fillStyle = '#fbcfe8';
            ctx.fillRect(xTela + 10, yTela + 6, TILE_SIZE - 20, 10);

            ctx.fillStyle = '#4b5563';
            ctx.fillRect(xTela + TILE_SIZE - 10, yTela + 14, 8, 4);
        }
    }
}

export function iniciarLoopZumbis(jogador) {
    setInterval(function() {
        atualizarZumbis(jogador);
    }, 400); 
}

// --- FUNÇÃO PARA O JOGADOR ACERTAR OS INIMIGOS ---
export function atingirInimigoEmCoordenada(x, y, dano) {
    // 1. Procura na lista de Zumbis
    for (let i = listaZumbis.length - 1; i >= 0; i--) {
        let zumbi = listaZumbis[i];
        if (zumbi.x === x && zumbi.y === y) {
            zumbi.vida -= dano;
            console.log(`💥 Tiro certeiro no Zumbi! HP dele: ${zumbi.vida}`);

            criarSangue(zumbi.x, zumbi.y);
            
            zumbi.tempoAlerta = 15; 

            if (zumbi.vida <= 0) {
                listaZumbis.splice(i, 1);
                console.log("💀 Zumbi eliminado!");
            }
            return true;
        }
    }

    // 2. Procura na lista de Bots Humanos
    for (let i = listaBots.length - 1; i >= 0; i--) {
        let bot = listaBots[i];
        if (bot.x === x && bot.y === y) {
            bot.vida -= dano;
            console.log(`💥 Você atingiu o Sobrevivente Inimigo! HP dele: ${bot.vida}`);
            
            criarSangue(bot.x, bot.y);

            bot.raioVisao = 16;

            if (bot.vida <= 0) {
                listaBots.splice(i, 1);
                console.log("💀 Bot inimigo eliminado! A vingança é sua!");
            }
            return true;
        }
    }

    return false;
}