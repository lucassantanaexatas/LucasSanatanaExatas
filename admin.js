/* ==========================================
   NAVBAR — MENU MOBILE E MODAL EM BREVE
   ========================================== */

function toggleMenu() {
    const menu = document.getElementById('navbarMenu');
    menu.classList.toggle('aberto');
}

// Fecha o menu mobile ao clicar em qualquer link
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.navbar-menu .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            document.getElementById('navbarMenu').classList.remove('aberto');
        });
    });
});

// Fecha menu ao clicar fora
document.addEventListener('click', (e) => {
    const menu   = document.getElementById('navbarMenu');
    const toggle = document.querySelector('.navbar-toggle');
    if (menu && toggle && !menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove('aberto');
    }
});

function abrirBreve() {
    const modal = document.getElementById('modal-breve');
    if (modal) modal.classList.add('aberto');
}

function fecharBreve() {
    const modal = document.getElementById('modal-breve');
    if (modal) modal.classList.remove('aberto');
}

// Fecha modal breve com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharBreve();
});

/* ==========================================
   LÓGICA DO USUÁRIO COMUM
   ========================================== */
function iniciarCompra() {
    alert('Processando redirecionamento para o gateway de pagamento seguro...');
}

/* ==========================================
   MÓDULO DE GALERIA E ZOOM
   ========================================== */

// 1. Scroll da galeria com a RODA DO MOUSE (Exclusivo para PC)
const galeria = document.querySelector('.preview-gallery');

if (galeria) {
    galeria.addEventListener('wheel', (evt) => {
        evt.preventDefault();
        galeria.scrollLeft += evt.deltaY;
    });
}

// 2. Scroll da galeria com as SETINHAS
function scrollGaleria(direcao) {
    const galeriaElem = document.querySelector('.preview-gallery');
    const imgElem = document.querySelector('.preview-img');
    if (!galeriaElem || !imgElem) return;
    const larguraImagem = imgElem.clientWidth + 20;
    galeriaElem.scrollBy({
        left: direcao * larguraImagem,
        behavior: 'smooth'
    });
}

// 3. MÓDULO DE ZOOM + ARRASTAR (transform-based)
const Zoom = {
    nivelAtual: 1.0,
    passo: 0.10,         // 10% por clique

    abrir(src) {
        const modal     = document.getElementById('modal-imagem');
        const imgFull   = document.getElementById('img-full');
        const container = document.querySelector('.zoom-container');
        if (!modal || !imgFull || !container) return;

        // Reseta posição e zoom
        this.nivelAtual = 1.0;
        Drag.resetarPosicao();

        imgFull.src = src;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Aplica zoom inicial de 100% após carregar
        imgFull.onload = () => {
            this.nivelAtual = 1.0;
            this.aplicar();
        };
        this.atualizarLabel();
    },

    fechar() {
        const modal = document.getElementById('modal-imagem');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            Drag.resetarPosicao();
        }
    },

    aplicar() {
        const imgFull = document.getElementById('img-full');
        if (!imgFull) return;

        // Base: 85vw no desktop, 92vw no mobile
        const baseVw = window.innerWidth <= 768 ? 0.92 : 0.85;
        const basePx = window.innerWidth * baseVw;

        imgFull.style.width  = (basePx * this.nivelAtual) + 'px';
        imgFull.style.height = 'auto';
        this.atualizarLabel();

        // Ao mudar o zoom, re-centraliza se ficou fora dos limites
        Drag.limitar();
    },

    atualizarLabel() {
        const label = document.getElementById('zoom-label');
        if (label) label.textContent = Math.round(this.nivelAtual * 100) + '%';
    },

    aumentar() {
        this.nivelAtual = Math.min(this.nivelAtual + this.passo, 4.0);
        this.aplicar();
    },

    diminuir() {
        this.nivelAtual = Math.max(this.nivelAtual - this.passo, 0.3);
        this.aplicar();
    },

    resetar() {
        this.nivelAtual = 1.0;
        this.aplicar();
        Drag.resetarPosicao();
    }
};

/* ==========================================
   MÓDULO DE ARRASTAR (usa transform: translate)
   ========================================== */
const Drag = {
    ativo:   false,
    startX:  0,
    startY:  0,
    // posição acumulada do container
    posX:    0,
    posY:    0,

    init() {
        const modal     = document.getElementById('modal-imagem');
        const container = document.querySelector('.zoom-container');
        if (!modal || !container) return;

        // --- MOUSE (PC) ---
        container.addEventListener('mousedown', (e) => {
            // Ignora clique nos botões de controle
            if (e.target.closest('.zoom-controls')) return;
            e.preventDefault();
            this.iniciar(e.clientX, e.clientY, container);
        });
        document.addEventListener('mousemove', (e) => {
            if (this.ativo) this.mover(e.clientX, e.clientY, container);
        });
        document.addEventListener('mouseup', () => {
            if (this.ativo) this.parar(container);
        });

        // --- TOUCH (Celular / Tablet) ---
        container.addEventListener('touchstart', (e) => {
            if (e.target.closest('.zoom-controls')) return;
            if (e.touches.length === 1) {
                const t = e.touches[0];
                this.iniciar(t.clientX, t.clientY, container);
            }
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && this.ativo) {
                e.preventDefault();
                const t = e.touches[0];
                this.mover(t.clientX, t.clientY, container);
            }
        }, { passive: false });

        container.addEventListener('touchend', () => {
            if (this.ativo) this.parar(container);
        });

        // Fechar clicando no fundo escuro (fora do container)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharModal();
        });
    },

    iniciar(x, y, container) {
        this.ativo  = true;
        this.startX = x;
        this.startY = y;
        container.classList.add('dragging');
    },

    mover(x, y, container) {
        const dx = x - this.startX;
        const dy = y - this.startY;
        this.startX = x;
        this.startY = y;
        this.posX += dx;
        this.posY += dy;
        container.style.transform = `translate(${this.posX}px, ${this.posY}px)`;
    },

    parar(container) {
        this.ativo = false;
        container.classList.remove('dragging');
        this.limitar();
    },

    // Limita o arrastar para não sumir da tela
    limitar() {
        const container = document.querySelector('.zoom-container');
        const imgFull   = document.getElementById('img-full');
        if (!container || !imgFull) return;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const iw = imgFull.offsetWidth;
        const ih = imgFull.offsetHeight;

        // Margem mínima visível (px)
        const margem = 80;

        const maxX =  Math.max(0, iw / 2 - margem);
        const minX = -Math.max(0, iw / 2 - margem);
        const maxY =  Math.max(0, ih / 2 - margem + (ih > vh ? (ih - vh) / 2 : 0));
        const minY = -Math.max(0, ih / 2 - margem + (ih > vh ? (ih - vh) / 2 : 0));

        this.posX = Math.max(minX, Math.min(maxX, this.posX));
        this.posY = Math.max(minY, Math.min(maxY, this.posY));
        container.style.transform = `translate(${this.posX}px, ${this.posY}px)`;
    },

    resetarPosicao() {
        this.posX = 0;
        this.posY = 0;
        const container = document.querySelector('.zoom-container');
        if (container) container.style.transform = 'translate(0, 0)';
    }
};

// Funções globais chamadas pelo HTML
function abrirModal(src)    { Zoom.abrir(src); }
function fecharModal()      { Zoom.fechar(); }
function alterarZoom(delta) { delta > 0 ? Zoom.aumentar() : Zoom.diminuir(); }
function resetarZoom()      { Zoom.resetar(); }

// Fechar com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharModal();
});

// Zoom com scroll do mouse dentro do modal
document.getElementById('modal-imagem')?.addEventListener('wheel', (e) => {
    if (document.getElementById('modal-imagem').style.display === 'flex') {
        e.preventDefault();
        e.deltaY < 0 ? Zoom.aumentar() : Zoom.diminuir();
    }
}, { passive: false });

/* ==========================================
   MÓDULO DO PAINEL DE ADMINISTRADOR
   ========================================== */
const AdminPanel = {
    senhaCorreta: 'fg@2000',
    precoEbook: 55.00,
    dadosVendas: 0,

    modal: null,
    loginView: null,
    dashboardView: null,
    senhaInput: null,
    vendasDisplay: null,
    receitaDisplay: null,

    init() {
        this.modal          = document.getElementById('adminModal');
        this.loginView      = document.getElementById('adminLogin');
        this.dashboardView  = document.getElementById('adminDashboard');
        this.senhaInput     = document.getElementById('adminSenha');
        this.vendasDisplay  = document.getElementById('vendasCount');
        this.receitaDisplay = document.getElementById('receitaTotal');

        const btnAbrir = document.getElementById('adminBtn');
        if (btnAbrir) btnAbrir.addEventListener('click', () => this.abrir());

        if (this.senhaInput) {
            this.senhaInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.autenticar();
            });
        }
        this.atualizarInterface();
    },

    abrir()  { this.modal.classList.remove('hidden'); },

    fechar() {
        this.modal.classList.add('hidden');
        this.senhaInput.value = '';
        this.loginView.classList.remove('hidden');
        this.dashboardView.classList.add('hidden');
    },

    autenticar() {
        if (this.senhaInput.value === this.senhaCorreta) {
            this.loginView.classList.add('hidden');
            this.dashboardView.classList.remove('hidden');
            this.atualizarInterface();
        } else {
            alert('Senha incorreta! Acesso negado.');
            this.senhaInput.value = '';
        }
    },

    simularVenda() {
        this.dadosVendas++;
        this.atualizarInterface();
    },

    zerarDados() {
        if (confirm('Atenção: Tem certeza que deseja zerar o histórico de vendas?')) {
            this.dadosVendas = 0;
            this.atualizarInterface();
        }
    },

    atualizarInterface() {
        const receita = this.dadosVendas * this.precoEbook;
        if (this.vendasDisplay)  this.vendasDisplay.textContent  = this.dadosVendas;
        if (this.receitaDisplay) this.receitaDisplay.textContent = receita.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AdminPanel.init();
    Drag.init();
});
