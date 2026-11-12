// scripts/config.js

// 📺 CAPTURA DO CANVAS E CONTEXTO
// Aceita tanto o ID antigo quanto o novo para não quebrar de jeito nenhum!
export const canvas = document.getElementById('mapCanvas') || document.getElementById('canvasJogo');
export const ctx = canvas.getContext('2d');

// --- 🌍 CONFIGURAÇÕES DO MUNDO ---
export const TILE_SIZE = 32; // Voltamos para o seu padrão original!
export const LARGURA_MAPA = 250;    
export const ALTURA_MAPA = 250;    

export const VISIVEL_LARGURA = 15;  
export const VISIVEL_ALTURA = 15;

// Ajusta o tamanho baseado nos blocos visíveis
canvas.width = VISIVEL_LARGURA * TILE_SIZE;
canvas.height = VISIVEL_ALTURA * TILE_SIZE;

// --- 🧱 DEFINIÇÃO DOS TIPOS DE TERRENO ---
export const TILES = {
    GRAMA: { id: 0, cor: 'rgb(1, 133, 56)' },
    FLORESTA: { id: 1, cor: 'rgb(4, 71, 29)' },
    AGUA: { id: 2, cor: '#3b82f6' },
    ESTRADA: { id: 3, cor: '#451a03' },
    CONCRETO: { id: 4, cor: '#78716c' },
    PAREDE: { id: 5, cor: '#44403c' },
    // 🪵 NOVOS TILES ADICIONADOS AQUI:
    MESA: { id: 6, cor: '#854d0e' },
    CADEIRA: { id: 7, cor: '#a16207' },
    BAU: { id: 8, cor: '#ca8a04' }
};

// --- 🎒 ESTADOS DOS MENUS IN-GAME ---
export let inventarioAberto = { ativo: false };
export let mapaAberto = { ativo: false };
export let menuCraftAberto = { ativo: false };

// --- 🚀 ESTADO DO JOGO ---
export let jogoIniciado = { ativo: true };