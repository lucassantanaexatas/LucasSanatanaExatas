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
        evt.preventDefault(); // Impede que a tela inteira desça
        galeria.scrollLeft += evt.deltaY; // Faz a rolagem ir para o lado
    });
}

// 2. Scroll da galeria com as SETINHAS
function scrollGaleria(direcao) {
    const galeriaElem = document.querySelector('.preview-gallery');
    const larguraImagem = document.querySelector('.preview-img').clientWidth + 20; 
    
    galeriaElem.scrollBy({
        left: direcao * larguraImagem,
        behavior: 'smooth'
    });
}

// 3. Função de ZOOM ao clicar na imagem
function abrirModal(src) {
    const modal = document.getElementById("modal-imagem");
    const imgFull = document.getElementById("img-full");
    
    if (modal && imgFull) {
        modal.style.display = "flex"; 
        imgFull.src = src;
        document.body.style.overflow = "hidden"; // Trava o scroll do fundo
    }
}

function fecharModal() {
    const modal = document.getElementById("modal-imagem");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto"; // Libera o scroll do fundo
    }
}


/* ==========================================
   MÓDULO DO PAINEL DE ADMINISTRADOR
   ========================================== */
const AdminPanel = {
    senhaCorreta: 'fg@2000',
    precoEbook: 55.00,
    dadosVendas: 0,

    modal: document.getElementById('adminModal'),
    loginView: document.getElementById('adminLogin'),
    dashboardView: document.getElementById('adminDashboard'),
    senhaInput: document.getElementById('adminSenha'),
    vendasDisplay: document.getElementById('vendasCount'),
    receitaDisplay: document.getElementById('receitaTotal'),

    init() {
        const btnAbrir = document.getElementById('adminBtn');
        if(btnAbrir) {
            btnAbrir.addEventListener('click', () => this.abrir());
        }
        
        if(this.senhaInput) {
            this.senhaInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.autenticar();
            });
        }
        this.atualizarInterface();
    },

    abrir() {
        this.modal.classList.remove('hidden');
    },

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
        this.vendasDisplay.textContent = this.dadosVendas;
        this.receitaDisplay.textContent = receita.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AdminPanel.init();
});