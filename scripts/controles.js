// scripts/controles.js
import { inventarioAberto, mapaAberto, menuCraftAberto, jogoIniciado } from './config.js'; 
import { jogador } from './jogador.js'; 
import { listaItens, podeAndarObjeto, mapa, listaFogueiras, colocarBarricadaNoMapa } from './mapa.js';
import { listaZumbis } from './inimigos.js';
import { tempoDoJogo } from './tempo.js';

const passos = new Audio('./efeitos/passos.mp3');
const comer = new Audio('./efeitos/comer.mp3');
const beber = new Audio('./efeitos/beber.mp3');
const cura = new Audio('./efeitos/cura.mp3');
const coletar = new Audio('./efeitos/coletar.mp3');

const imgPistola = new Image();
imgPistola.src = './imagem/pistola.png';

// Controle do índice da receita selecionada no menu de Craft
let receitaSelecionada = 0;
const RECEITAS = [
    { nome: "🔥 Tocha Acesa", tipo: "tocha", cor: "#fbbf24", req: { madeira: 1, bandagem: 1 } },
    { nome: "🧱 Barricada", tipo: "barricada", cor: "#4b5563", req: { madeira: 2, ferro: 1 } }
];

let ultimoMovimento = 0;
const COOLDOWN_MOVIMENTO = 220; 
let teclasPressionadas = [];

function podeAndar(novoX, novoY) {
    if (!jogador.vivo || inventarioAberto.ativo || mapaAberto.ativo || menuCraftAberto.ativo) return false;
    return podeAndarObjeto(novoX, novoY);
}

// ⌨️ CONFIGURAÇÃO DO TECLADO
export function configurarTeclado(atualizarJogo) {
    window.addEventListener('keydown', function(evento) {
        const tecla = evento.key.toLowerCase();

        if (tecla === 'm') {
            if (!inventarioAberto.ativo && !menuCraftAberto.ativo && jogador.vivo && jogoIniciado.ativo) {
                mapaAberto.ativo = !mapaAberto.ativo;
                atualizarJogo();
            }
            return;
        }

        if (tecla === 'i') {
            if (!mapaAberto.ativo && !menuCraftAberto.ativo && jogador.vivo && jogoIniciado.ativo) {
                inventarioAberto.ativo = !inventarioAberto.ativo;
                atualizarJogo();
            }
            return;
        }

        if (tecla === 'c') {
            if (!mapaAberto.ativo && !inventarioAberto.ativo && jogador.vivo && jogoIniciado.ativo) {
                menuCraftAberto.ativo = !menuCraftAberto.ativo;
                atualizarJogo();
            }
            return;
        }

        if (tecla === 'f' && jogador.vivo && jogoIniciado.ativo && !inventarioAberto.ativo && !mapaAberto.ativo && !menuCraftAberto.ativo) {
            let indiceMadeira = jogador.mochila.findIndex(item => item.tipo === 'madeira');
            if (indiceMadeira !== -1) {
                let jaTemFogueira = listaFogueiras.some(f => f.x === jogador.x && f.y === jogador.y);
                if (!jaTemFogueira) {
                    jogador.mochila.splice(indiceMadeira, 1);
                    listaFogueiras.push({ x: jogador.x, y: jogador.y, duracao: 60 });
                    atualizarJogo();
                }
            }
            return;
        }

        // Ações do Menu de Craft Aberto
        if (menuCraftAberto.ativo && jogador.vivo && jogoIniciado.ativo) {
            if (tecla === 'w' || tecla === 'arrowup') {
                receitaSelecionada = (receitaSelecionada > 0) ? receitaSelecionada - 1 : RECEITAS.length - 1;
                atualizarJogo(); return;
            }
            if (tecla === 's' || tecla === 'arrowdown') {
                receitaSelecionada = (receitaSelecionada < RECEITAS.length - 1) ? receitaSelecionada + 1 : 0;
                atualizarJogo(); return;
            }
            if (tecla === 'enter' || tecla === 'u') {
                let receiver = RECEITAS[receitaSelecionada];
                let mads = jogador.mochila.filter(i => i.tipo === 'madeira').length;
                let bands = jogador.mochila.filter(i => i.tipo === 'bandagem').length;
                let fers = jogador.mochila.filter(i => i.tipo === 'ferro').length;

                let nMadeira = receiver.req.madeira || 0;
                let nBandagem = receiver.req.bandagem || 0;
                let nFerro = receiver.req.ferro || 0;

                if (mads >= nMadeira && bands >= nBandagem && fers >= nFerro) {
                    for (let k = 0; k < nMadeira; k++) jogador.mochila.splice(jogador.mochila.findIndex(i => i.tipo === 'madeira'), 1);
                    for (let k = 0; k < nBandagem; k++) jogador.mochila.splice(jogador.mochila.findIndex(i => i.tipo === 'bandagem'), 1);
                    for (let k = 0; k < nFerro; k++) jogador.mochila.splice(jogador.mochila.findIndex(i => i.tipo === 'ferro'), 1);

                    if (receiver.tipo === 'barricada') {
                        colocarBarricadaNoMapa(jogador.x, jogador.y);
                    } else {
                        jogador.mochila.push({ tipo: receiver.tipo, cor: receiver.cor, nome: receiver.nome });
                    }
                    coletar.play();
                }
                atualizarJogo(); return;
            }
            return;
        }

        // Ações do Inventário Aberto
        if (inventarioAberto.ativo && jogador.vivo && jogoIniciado.ativo) {
            if (tecla === 'w' || tecla === 'arrowup') {
                jogador.slotSelecionado = (jogador.slotSelecionado > 0) ? jogador.slotSelecionado - 1 : jogador.MAX_SLOTS - 1;
                atualizarJogo(); return;
            }
            if (tecla === 's' || tecla === 'arrowdown') {
                jogador.slotSelecionado = (jogador.slotSelecionado < jogador.MAX_SLOTS - 1) ? jogador.slotSelecionado + 1 : 0;
                atualizarJogo(); return;
            }
            if (tecla === 'u') {
                let item = jogador.mochila[jogador.slotSelecionado]; 
                if (item) {
                    if (item.tipo === 'comida') { 
                        jogador.fome = Math.min(100, jogador.fome + 40); 
                        jogador.mochila.splice(jogador.slotSelecionado, 1); 
                        comer.play(); 
                    }
                    else if (item.tipo === 'agua') { 
                        jogador.sede = Math.min(100, jogador.sede + 40); 
                        jogador.mochila.splice(jogador.slotSelecionado, 1); 
                        beber.play();
                    }
                    else if (item.tipo === 'bandagem') { 
                        if (jogador.sangrando) { 
                            jogador.sangrando = false; 
                            jogador.mochila.splice(jogador.slotSelecionado, 1); 
                            cura.play(); 
                        } 
                    }
                    else if (item.tipo === 'arma') { 
                        if (jogador.armaEquipada && item.nome.includes('[EQUIPADA]')) {
                            jogador.armaEquipada = false;
                            item.nome = 'Pistola M9';
                        } else {
                            jogador.mochila.forEach(i => {
                                if (i.tipo === 'arma') i.nome = 'Pistola M9';
                            });
                            jogador.armaEquipada = true;
                            item.nome = 'Pistola M9 [EQUIPADA]';
                        }
                    }
                    else if (item.tipo === 'municao' && jogador.armaEquipada) { 
                        jogador.balas += 7; 
                        jogador.mochila.splice(jogador.slotSelecionado, 1); 
                    }
                }
                atualizarJogo(); return;
            }
            if (tecla === 'q') {
                coletar.play();
                let item = jogador.mochila[jogador.slotSelecionado];
                if (item) {
                    if (item.tipo === 'arma' && item.nome.includes('[EQUIPADA]')) {
                        jogador.armaEquipada = false;
                        item.nome = 'Pistola M9';
                    }
                    let itemRemovido = jogador.mochila.splice(jogador.slotSelecionado, 1)[0];
                    listaItens.push({ x: jogador.x, y: jogador.y, tipo: itemRemovido.tipo, cor: itemRemovido.cor, nome: itemRemovido.nome });
                }
                atualizarJogo(); return;
            }
            return;
        }

        // Coleta no E
        if (tecla === 'e' && jogador.vivo && jogoIniciado.ativo && !inventarioAberto.ativo && !mapaAberto.ativo && !menuCraftAberto.ativo) {
            let coletouAlgo = false;
            for (let i = listaItens.length - 1; i >= 0; i--) {
                let item = listaItens[i];
                if (item.x === jogador.x && item.y === jogador.y) {
                    if (jogador.mochila.length < jogador.MAX_SLOTS) {
                        coletar.play();
                        jogador.mochila.push(listaItens.splice(i, 1)[0]);
                        coletouAlgo = true; break;
                    }
                }
            }
            if (coletouAlgo) atualizarJogo();
            return;
        }

        // --- 🥊 TECLA ESPAÇO: MODIFICADA APENAS PARA ATAQUE MELEE (CORPO A CORPO) ---
        if (tecla === ' ' && jogador.vivo && jogoIniciado.ativo && !inventarioAberto.ativo && !menuCraftAberto.ativo) {
            
            // Se estiver com arma equipada, o espaço não faz nada (já que atira no clique do mouse)
            if (jogador.armaEquipada) return; 

            let alcanceAtaque = 1.5; // Colado no zumbi
            let danoAtaque = 15;     // Dano do soco/faca

            for (let i = 0; i < listaZumbis.length; i++) {
                let zumbi = listaZumbis[i];
                let dx = zumbi.x - jogador.x; 
                let dy = zumbi.y - jogador.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist <= alcanceAtaque) {
                    zumbi.vida -= danoAtaque; 
                    zumbi.tempoAlerta = 15;
                    
                    // Empurrão tático para trás ao dar o soco
                    let empurraoX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
                    let empurraoY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
                    if (podeAndarObjeto(zumbi.x + empurraoX, zumbi.y + empurraoY)) { 
                        zumbi.x += empurraoX; 
                        zumbi.y += empurraoY; 
                    }
                    
                    if (zumbi.vida <= 0) { 
                        listaZumbis.splice(i, 1); 
                        i--; 
                    }
                    break;
                }
            }
            atualizarJogo();
            return;
        }

        const mapeamentoTeclas = ['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
        if (mapeamentoTeclas.includes(tecla) && !teclasPressionadas.includes(tecla)) {
            teclasPressionadas.push(tecla);
        }
    });

    window.addEventListener('keyup', function(evento) {
        const tecla = evento.key.toLowerCase();
        teclasPressionadas = teclasPressionadas.filter(t => t !== tecla);
    });

    // Loop de movimento
    setInterval(function() {
        if (!jogoIniciado.ativo || teclasPressionadas.length === 0 || !jogador.vivo || inventarioAberto.ativo || mapaAberto.ativo || menuCraftAberto.ativo) return;

        let agora = Date.now();
        if (agora - ultimoMovimento < COOLDOWN_MOVIMENTO) return;

        let teclaAtual = teclasPressionadas[teclasPressionadas.length - 1];
        let mudouPosicao = false;
        let proximoX = jogador.x;
        let proximoY = jogador.y;

        if (teclaAtual === 'w' || teclaAtual === 'arrowup')    { proximoY--; mudouPosicao = true; }
        if (teclaAtual === 's' || teclaAtual === 'arrowdown')  { proximoY++; mudouPosicao = true; }
        if (teclaAtual === 'a' || teclaAtual === 'arrowleft')  { proximoX--; mudouPosicao = true; }
        if (teclaAtual === 'd' || teclaAtual === 'arrowright') { proximoX++; mudouPosicao = true; }

        if (mudouPosicao) {
            ultimoMovimento = agora;
            if (podeAndar(proximoX, proximoY)) {
                jogador.x = proximoX;
                jogador.y = proximoY;
                passos.play();
            }
        }
    }, 10);
}

// 🎒 RENDERIZAR MENUS SOBREPOSTOS DO INGAME
export function renderizarMenusSobrepostos(ctx, canvas) {

    if (jogador.vivo && !inventarioAberto.ativo && !mapaAberto.ativo && !menuCraftAberto.ativo) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, canvas.height - 25, canvas.width, 25);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Courier New"';
        ctx.textAlign = 'center'; 
        
        // 🔥 TEXTO DA HUD ATUALIZADO: Mostra as instruções certas para armas e socos!
        ctx.fillText("[M] Mapa    [C] Craft    [I] Inventário    [F] Fogueira    [CLICK] Atirar    [ESPAÇO] Soco", canvas.width / 2, canvas.height - 8);
        
        ctx.textAlign = 'left'; 
    }

    if (jogador.vivo && jogador.sangrando) {
        let gotaX = 181; let gotaY = 18;
        ctx.fillStyle = '#ef4444'; ctx.beginPath();
        ctx.moveTo(gotaX + 7, gotaY);
        ctx.bezierCurveTo(gotaX + 1, gotaY + 7,  gotaX + 1, gotaY + 13, gotaX + 7, gotaY + 13);
        ctx.bezierCurveTo(gotaX + 13, gotaY + 13, gotaX + 13, gotaY + 7,  gotaX + 7, gotaY);
        ctx.fill();
    }

    if (jogador.vivo) {
        let termoX = 179; let termoY = 91;
        ctx.font = '12px "Courier New"'; ctx.textBaseline = 'middle';
        if (jogador.pertoDaFogueira) { ctx.fillText("🔥", termoX, termoY); } 
        else {
            let ehNoite = (typeof tempoDoJogo !== 'undefined') && (tempoDoJogo.hora >= 20 || tempoDoJogo.hora < 6);
            if (ehNoite) { ctx.fillText("❄️", termoX, termoY); }
        }
    }
    ctx.textBaseline = 'alphabetic';

    if (inventarioAberto.ativo) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);
        ctx.strokeStyle = '#ffffff'; ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px "Courier New"'; ctx.fillText("🎒 INVENTÁRIO", 60, 75);
        ctx.font = '11px "Courier New"'; ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`Slots: ${jogador.mochila.length} / ${jogador.MAX_SLOTS}`, 60, 95);

        for (let i = 0; i < jogador.MAX_SLOTS; i++) {
            let yItem = 120 + (i * 35);
            if (i === jogador.slotSelecionado) {
                ctx.fillStyle = 'rgba(80, 80, 80, 0.8)'; ctx.fillRect(60, yItem, canvas.width - 120, 28);
                ctx.strokeStyle = '#facc15'; ctx.strokeRect(60, yItem, canvas.width - 120, 28);
            } else {
                ctx.fillStyle = 'rgba(25, 25, 25, 0.6)'; ctx.fillRect(60, yItem, canvas.width - 120, 28);
            }
            let item = jogador.mochila[i];
            if (item) {
                if (item.tipo === 'arma') {
                    ctx.drawImage(imgPistola, 70, yItem + 6, 16, 16);
                } else {
                    ctx.fillStyle = item.cor; 
                    ctx.fillRect(70, yItem + 6, 16, 16);
                }
                
                ctx.fillStyle = (i === jogador.slotSelecionado) ? '#facc15' : '#ffffff';
                ctx.font = '12px "Courier New"'; ctx.fillText(item.nome, 95, yItem + 18);
            } else {
                ctx.fillStyle = '#444444'; ctx.font = 'italic 12px "Courier New"'; ctx.fillText("< Slot Vazio >", 95, yItem + 18);
            }
        }
        ctx.fillStyle = '#facc15'; ctx.font = '10px "Courier New"';
        ctx.fillText("[Setas/WS] Navegar   [U] Usar   [Q] Dropar   [I] Fechar", 55, canvas.height - 60);
    }

    if (menuCraftAberto.ativo) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);
        ctx.strokeStyle = '#e2e8f0'; ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px "Courier New"'; ctx.fillText("🛠️ FABRICAÇÃO (CRAFT)", 60, 75);

        let mads = jogador.mochila.filter(i => i.tipo === 'madeira').length;
        let bands = jogador.mochila.filter(i => i.tipo === 'bandagem').length;
        let fers = jogador.mochila.filter(i => i.tipo === 'ferro').length;
        ctx.font = '11px "Courier New"'; ctx.fillStyle = '#94a3b8';
        ctx.fillText(`Seus Materiais: 🪵x${mads}   🩹x${bands}   🔩x${fers}`, 60, 100);

        for (let i = 0; i < RECEITAS.length; i++) {
            let yItem = 130 + (i * 45); let rec = RECEITAS[i];
            if (i === receitaSelecionada) {
                ctx.fillStyle = 'rgba(51, 65, 85, 0.9)'; ctx.fillRect(60, yItem, canvas.width - 120, 38);
                ctx.strokeStyle = '#38bdf8'; ctx.strokeRect(60, yItem, canvas.width - 120, 38);
            } else {
                ctx.fillStyle = 'rgba(30, 41, 59, 0.5)'; ctx.fillRect(60, yItem, canvas.width - 120, 38);
            }
            ctx.fillStyle = rec.cor; ctx.fillRect(70, yItem + 11, 16, 16);
            ctx.fillStyle = (i === receitaSelecionada) ? '#38bdf8' : '#ffffff';
            ctx.font = 'bold 12px "Courier New"'; ctx.fillText(rec.nome, 95, yItem + 18);

            let textoReq = "Requer: ";
            if (rec.req.madeira) textoReq += `Madeira x${rec.req.madeira} `;
            if (rec.req.bandagem) textoReq += `Bandagem x${rec.req.bandagem} `;
            if (rec.req.ferro) textoReq += `Ferro x${rec.req.ferro} `;
            ctx.fillStyle = '#94a3b8'; ctx.font = '9px "Courier New"'; ctx.fillText(textoReq, 95, yItem + 30);
        }
        ctx.fillStyle = '#38bdf8'; ctx.font = '10px "Courier New"';
        ctx.fillText("[Setas/WS] Navegar   [Enter/U] Fabricar   [C] Fechar", 52, canvas.height - 60);
    }

    if (mapaAberto.ativo) {
        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        let linhasMapa = mapa.length;       
        let colunasMapa = mapa[0].length;   

        let pixelTamanho = 1.5; 
        
        let offsetX = (canvas.width - (colunasMapa * pixelTamanho)) / 2;
        let offsetY = (canvas.height - (linhasMapa * pixelTamanho)) / 2;

        for (let y = 0; y < linhasMapa; y++) {
            for (let x = 0; x < colunasMapa; x++) {
                let idTile = mapa[y][x]; 
                let cor = '#557a2b'; 
                
                if (idTile === 1) cor = '#2d4a16'; 
                if (idTile === 2) cor = '#5a5a5a'; 
                if (idTile === 3) cor = '#32527b'; 
                if (idTile === 4) cor = '#78716c'; 
                if (idTile === 5) cor = '#44403c'; 
                
                ctx.fillStyle = cor; 
                ctx.fillRect(offsetX + (x * pixelTamanho), offsetY + (y * pixelTamanho), pixelTamanho, pixelTamanho);
            }
        }
        for (let i = 0; i < listaItens.length; i++) {
            let item = listaItens[i]; ctx.fillStyle = item.cor;
            ctx.fillRect(offsetX + (item.x * pixelTamanho), offsetY + (item.y * pixelTamanho), pixelTamanho, pixelTamanho);
        }
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < listaZumbis.length; i++) {
            let zumbi = listaZumbis[i]; ctx.fillRect(offsetX + (zumbi.x * pixelTamanho), offsetY + (zumbi.y * pixelTamanho), pixelTamanho, pixelTamanho);
        }
        if (jogador.vivo && Math.floor(Date.now() / 300) % 2 === 0) {
            ctx.fillStyle = '#ff0000'; ctx.fillRect(offsetX + (jogador.x * pixelTamanho) - 1, offsetY + (jogador.y * pixelTamanho) - 1, pixelTamanho + 2, pixelTamanho + 2);
        }
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px "Courier New"'; ctx.fillText("🗺️ MAPA GLOBAL", 20, 30);
        ctx.font = '10px "Courier New"'; ctx.fillStyle = '#facc15'; ctx.fillText("[M] Fechar Mapa", 20, 45);
    }
}