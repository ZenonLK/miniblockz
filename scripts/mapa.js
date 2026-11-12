// scripts/mapa.js
import { LARGURA_MAPA, ALTURA_MAPA, TILES, TILE_SIZE } from './config.js';

// Variáveis globais do mapa
export let mapa = [];
export let listaItens = [];
export let listaFogueiras = []; 
export let listaBarricadas = []; // Guarda as coordenadas das barricadas criadas

// Carrega a imagem da pistola baixada
const imgPistola = new Image();
imgPistola.src = './imagem/pistola.png'; // Caminho da sua arte 16x16 ou 32x32

// --- FUNÇÃO PRINCIPAL DE GERAÇÃO DE MUNDO ---
export function gerarMapa(jogador) { 
    mapa = []; 
    listaItens = [];
    listaFogueiras = [];
    listaBarricadas = [];

    // 1. Preenchimento inicial aleatório
    for (let y = 0; y < ALTURA_MAPA; y++) {
        let linha = [];
        for (let x = 0; x < LARGURA_MAPA; x++) {
            let chance = Math.random();
            if (chance < 0.68) linha.push(TILES.GRAMA.id);
            else if (chance < 0.88) linha.push(TILES.FLORESTA.id);
            else linha.push(TILES.AGUA.id);
        }
        mapa.push(linha);
    }

    // 2. Suavização (Algoritmo de Autômato Celular)
    for (let i = 0; i < 4; i++) {
        mapa = suavizarMapa(mapa);
    }

    // 3. Cria as estradas em cruz no meio do mapa
    criarEstradas();

    // 🏙️ Adiciona as cidades e construções antes do loot geral!
    gerarCidades();

    // 4. Espalha os loots (comida, água, materiais e armas)
    gerarLootNoMundo(); 
}

function suavizarMapa(mapaAtual) {
    let novoMapa = JSON.parse(JSON.stringify(mapaAtual));
    for (let y = 1; y < ALTURA_MAPA - 1; y++) {
        for (let x = 1; x < LARGURA_MAPA - 1; x++) {
            let vizinhosFloresta = 0;
            let vizinhosAgua = 0;

            for (let vY = -1; vY <= 1; vY++) {
                for (let vX = -1; vX <= 1; vX++) {
                    if (vX === 0 && vY === 0) continue;
                    if (mapaAtual[y + vY][x + vX] === TILES.FLORESTA.id) vizinhosFloresta++;
                    if (mapaAtual[y + vY][x + vX] === TILES.AGUA.id) vizinhosAgua++;
                }
            }

            if (vizinhosFloresta > 4) novoMapa[y][x] = TILES.FLORESTA.id;
            else if (vizinhosAgua > 4) novoMapa[y][x] = TILES.AGUA.id;
            else if (vizinhosFloresta < 2 && mapaAtual[y][x] === TILES.FLORESTA.id) novoMapa[y][x] = TILES.GRAMA.id;
            else if (vizinhosAgua < 2 && mapaAtual[y][x] === TILES.AGUA.id) novoMapa[y][x] = TILES.GRAMA.id;
        }
    }
    return novoMapa;
}

function criarEstradas() {
    let meioX = Math.floor(LARGURA_MAPA / 2);
    let meioY = Math.floor(ALTURA_MAPA / 2);
    for (let i = 0; i < LARGURA_MAPA; i++) {
        mapa[meioY][i] = TILES.ESTRADA.id;
        mapa[meioY + 1][i] = TILES.ESTRADA.id;
    }
    for (let i = 0; i < ALTURA_MAPA; i++) {
        mapa[i][meioX] = TILES.ESTRADA.id;
        mapa[i][meioX + 1] = TILES.ESTRADA.id;
    }
}

function gerarLootNoMundo() {
    listaItens = [];
    const quantidadeLoot = 800; 

    for (let i = 0; i < quantidadeLoot; i++) {
        let xAleatorio = Math.floor(Math.random() * LARGURA_MAPA);
        let yAleatorio = Math.floor(Math.random() * ALTURA_MAPA);

        let tipoTile = mapa[yAleatorio][xAleatorio];
        if (tipoTile === TILES.GRAMA.id || tipoTile === TILES.ESTRADA.id) {
            let chance = Math.random();
            let tipoItem, corItem, nomeItem;

            if (chance < 0.12) { 
                tipoItem = 'agua'; corItem = '#0ea5e9'; nomeItem = 'Garrafa de Agua';
            } else if (chance < 0.28) { 
                tipoItem = 'comida'; corItem = '#f59e0b'; nomeItem = 'Feijao Enlatado';
            } else if (chance < 0.45) { 
                tipoItem = 'madeira'; corItem = '#a16207'; nomeItem = 'Pedaco de Madeira';
            } else if (chance < 0.55) { 
                tipoItem = 'ferro'; corItem = '#9ca3af'; nomeItem = 'Pedaco de Ferro';
            } else if (chance < 0.78) {
                tipoItem = 'bandagem'; corItem = '#ffffff'; nomeItem = 'Bandagem';
            } else if (chance < 0.90) {
                tipoItem = 'municao'; corItem = '#f70808'; nomeItem = 'Balas de Pistola';
            } else {
                tipoItem = 'arma'; corItem = '#4b5563'; nomeItem = 'Pistola M9';
            }

            listaItens.push({ x: xAleatorio, y: yAleatorio, tipo: tipoItem, cor: corItem, nome: nomeItem });
        }
    }
}

// --- FUNÇÃO PARA CHECAR SE O BLOCO É PASSÁVEL ---
export function podeAndarObjeto(x, y) {
    if (x < 0 || x >= LARGURA_MAPA || y < 0 || y >= ALTURA_MAPA) return false;
    let tileAlvo = mapa[y][x];
    
    // Jogador fica bloqueado por Floresta, Água, Paredes, Mesas e Baús!
    return !(
        tileAlvo === TILES.FLORESTA.id || 
        tileAlvo === TILES.AGUA.id || 
        tileAlvo === TILES.PAREDE.id ||
        (TILES.MESA && tileAlvo === TILES.MESA.id) || 
        (TILES.BAU && tileAlvo === TILES.BAU.id)
    );
}

// --- DESENHAR O CENÁRIO (TERRENO + LOOTS) ---
export function renderizarTerreno(ctx, cameraX, cameraY) {
    let tilesAtuaisX = Math.ceil(ctx.canvas.width / TILE_SIZE);
    let tilesAtuaisY = Math.ceil(ctx.canvas.height / TILE_SIZE);

    for (let y = 0; y < tilesAtuaisY; y++) {
        for (let x = 0; x < tilesAtuaisX; x++) {
            let mapaX = cameraX + x;
            let mapaY = cameraY + y;
            
            if (mapaY >= 0 && mapaY < ALTURA_MAPA && mapaX >= 0 && mapaX < LARGURA_MAPA) {
                let idTile = mapa[mapaY][mapaX];
                let cor = '#000';

                // Cores do terreno base e estruturas urbanas
                if (idTile === TILES.GRAMA.id) cor = TILES.GRAMA.cor;
                if (idTile === TILES.FLORESTA.id) {
                    let ehBarricada = listaBarricadas.some(b => b.x === mapaX && b.y === mapaY);
                    cor = ehBarricada ? '#4b5563' : TILES.FLORESTA.cor;
                }
                if (idTile === TILES.ESTRADA.id) cor = TILES.ESTRADA.cor;
                if (idTile === TILES.AGUA.id) cor = TILES.AGUA.cor;
                if (idTile === TILES.CONCRETO.id) cor = '#78716c'; 
                if (idTile === TILES.PAREDE.id) cor = '#44403c';   

                // Renderização visual dos móveis dentro das casas
                if (TILES.MESA && idTile === TILES.MESA.id) cor = '#854d0e';     
                if (TILES.CADEIRA && idTile === TILES.CADEIRA.id) cor = '#a16207'; 
                if (TILES.BAU && idTile === TILES.BAU.id) cor = '#ca8a04';     

                ctx.fillStyle = cor;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                
                // Detalhe visual extra para o Baú (borda estilo caixa de madeira)
                if (TILES.BAU && idTile === TILES.BAU.id) {
                    ctx.strokeStyle = '#713f12';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x * TILE_SIZE + 4, y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                }

                let ehBarricada = idTile === TILES.FLORESTA.id && listaBarricadas.some(b => b.x === mapaX && b.y === mapaY);
                if (ehBarricada) {
                    ctx.strokeStyle = '#374151';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }
            }
        }
    }

    // Desenha os itens caídos no chão
    for (let i = 0; i < listaItens.length; i++) {
        let item = listaItens[i];
        if (item.x >= cameraX && item.x < cameraX + tilesAtuaisX && item.y >= cameraY && item.y < cameraY + tilesAtuaisY) {
            if (item.type === 'arma' || item.tipo === 'arma') {
                ctx.drawImage(
                    imgPistola, 
                    (item.x - cameraX) * TILE_SIZE + 4, 
                    (item.y - cameraY) * TILE_SIZE + 4, 
                    TILE_SIZE - 8, 
                    TILE_SIZE - 8
                );
            } else {
                ctx.fillStyle = item.cor;
                ctx.fillRect((item.x - cameraX) * TILE_SIZE + 10, (item.y - cameraY) * TILE_SIZE + 10, TILE_SIZE - 20, TILE_SIZE - 20);
            }
        }
    }
}

export function renderizarFogueiras(ctx, cameraX, cameraY) {
    let tilesAtuaisX = Math.ceil(ctx.canvas.width / TILE_SIZE);
    let tilesAtuaisY = Math.ceil(ctx.canvas.height / TILE_SIZE);

    for (let i = 0; i < listaFogueiras.length; i++) {
        let fogueira = listaFogueiras[i];
        
        if (fogueira.x >= cameraX && fogueira.x < cameraX + tilesAtuaisX &&
            fogueira.y >= cameraY && fogueira.y < cameraY + tilesAtuaisY) {
            
            let centroX = (fogueira.x - cameraX) * TILE_SIZE + (TILE_SIZE / 2);
            let centroY = (fogueira.y - cameraY) * TILE_SIZE + (TILE_SIZE / 2);
            
            ctx.save(); 
            let luz = ctx.createRadialGradient(centroX, centroY, 5, centroX, centroY, 90);
            luz.addColorStop(0, 'rgba(251, 146, 60, 0.4)');  
            luz.addColorStop(0.3, 'rgba(253, 224, 71, 0.2)'); 
            luz.addColorStop(1, 'rgba(253, 224, 71, 0)');    
            
            ctx.fillStyle = luz;
            ctx.beginPath();
            ctx.arc(centroX, centroY, 90, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore(); 
            
            ctx.fillStyle = '#ea580c'; 
            ctx.fillRect((fogueira.x - cameraX) * TILE_SIZE + 8, (fogueira.y - cameraY) * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        }
    }
}

export function colocarBarricadaNoMapa(x, y) {
    mapa[y][x] = TILES.FLORESTA.id; 
    listaBarricadas.push({ x: x, y: y });
}

function gerarCidades() {
    const qtdCidades = 4;
    const tamanhoCidade = 12; // Tamanho do quarteirão (12x12 blocos)
    const distanciaMinima = 50; // 🔥 Nenhuma cidade pode nascer a menos de 50 blocos da outra
    
    let cidadesCriadas = []; // Guarda as coordenadas {x, y} das cidades que já deram certo

    for (let c = 0; c < qtdCidades; c++) {
        let centroX, centroY;
        let tentativa = 0;
        let posicaoValida = false;

        // Tenta encontrar uma posição boa até 100 vezes
        while (!posicaoValida && tentativa < 100) {
            centroX = Math.floor(Math.random() * (LARGURA_MAPA - 40)) + 20;
            centroY = Math.floor(Math.random() * (ALTURA_MAPA - 40)) + 20;
            posicaoValida = true;

            // Verifica a distância contra todas as cidades que já foram criadas
            for (let outraCidade of cidadesCriadas) {
                let dx = centroX - outraCidade.x;
                let dy = centroY - outraCidade.y;
                let distancia = Math.sqrt(dx * dx + dy * dy); // Pitágoras puro!

                if (distancia < distanciaMinima) {
                    posicaoValida = false; // Perto demais! Rejeita e tenta outra coordenada
                    break;
                }
            }
            tentativa++;
        }

        // Se achou uma posição válida (ou estourou o limite de segurança), salva e cria!
        cidadesCriadas.push({ x: centroX, y: centroY });

        // 1. Carimba o asfalto/concreto do quarteirão urbano
        for (let y = centroY - tamanhoCidade; y <= centroY + tamanhoCidade; y++) {
            for (let x = centroX - tamanhoCidade; x <= centroX + tamanhoCidade; x++) {
                if (y > 0 && y < ALTURA_MAPA && x > 0 && x < LARGURA_MAPA) {
                    if (mapa[y][x] !== TILES.AGUA.id) {
                        mapa[y][x] = TILES.CONCRETO.id;
                    }
                }
            }
        }

        // 2. Conecta a cidade à estrada principal criando uma "rua de acesso"
        let meioMundoX = Math.floor(LARGURA_MAPA / 2);
        if (centroX < meioMundoX) {
            for (let x = centroX; x <= meioMundoX; x++) {
                mapa[centroY][x] = TILES.ESTRADA.id;
                mapa[centroY + 1][x] = TILES.ESTRADA.id;
            }
        } else {
            for (let x = meioMundoX; x <= centroX; x++) {
                mapa[centroY][x] = TILES.ESTRADA.id;
                mapa[centroY + 1][x] = TILES.ESTRADA.id;
            }
        }

        // 3. Constrói as 3 casinhas clássicas dentro dessa cidade
        criarCasa(centroX - 5, centroY - 5, 5, 4);
        criarCasa(centroX + 3, centroY - 6, 4, 4);
        criarCasa(centroX - 4, centroY + 4, 6, 5);
    }
}

// Auxiliar para erguer paredes e posicionar móveis internos com o loot
function criarCasa(inicioX, inicioY, larg, alt) {
    for (let y = inicioY; y < inicioY + alt; y++) {
        for (let x = inicioX; x < inicioX + larg; x++) {
            if (y > 0 && y < ALTURA_MAPA && x > 0 && x < LARGURA_MAPA) {
                if (y === inicioY || y === inicioY + alt - 1 || x === inicioX || x === inicioX + larg - 1) {
                    if (y === inicioY + alt - 1 && x === inicioX + Math.floor(larg / 2)) {
                        mapa[y][x] = TILES.CONCRETO.id; 
                    } else {
                        mapa[y][x] = TILES.PAREDE.id;
                    }
                } else {
                    mapa[y][x] = TILES.CONCRETO.id;
                }
            }
        }
    }

    // 🛋️ MOBILIANDO O ESPAÇO INTERNO (Caso existam as definições no config)
    if (TILES.MESA && TILES.CADEIRA && TILES.BAU) {
        let centroCasaX = inicioX + Math.floor(larg / 2);
        let topoCasaY = inicioY + 1;

        // Adiciona conjunto de mesa e cadeira no topo interno da casa
        if (topoCasaY < inicioY + alt - 1) {
            mapa[topoCasaY][centroCasaX] = TILES.MESA.id;
            if (centroCasaX - 1 > inicioX) {
                mapa[topoCasaY][centroCasaX - 1] = TILES.CADEIRA.id;
            }
        }

        // Coloca o baú no canto superior oposto
        let cantoX = inicioX + larg - 2;
        let cantoY = inicioY + 1;
        if (cantoX > inicioX && cantoY < inicioY + alt - 1) {
            mapa[cantoY][cantoX] = TILES.BAU.id;
        }
    }

    // O loot principal agora spawna exatamente na posição do baú!
    let itemX = inicioX + larg - 2;
    let itemY = inicioY + 1;
    let chanceUrbana = Math.random();
    if (chanceUrbana < 0.5) {
        listaItens.push({ x: itemX, y: itemY, tipo: 'municao', cor: '#f70808', nome: 'Balas de Pistola' });
    } else {
        listaItens.push({ x: itemX, y: itemY, tipo: 'arma', cor: '#4b5563', nome: 'Pistola M9' });
    }
}