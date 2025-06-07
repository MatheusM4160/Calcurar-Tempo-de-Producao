// Dados da aplicação
const APP_DATA = {
    empresa: {
        nome: "Sublimação Colatina",
        cidade: "Colatina",
        estado: "ES"
    },
    produtos: [
        "Painéis", "Tapetes", "Totens", "Cilindros", "Almofadas", "Bolsinhas"
    ],
    modalidades_colatina: {
        motoboy: { horario: "16:00", prazo_dias: 0 },
        retirada: { horario: "16:00", prazo_dias: 0 }
    },
    modalidades_externa: {
        correios: { horario: "14:00", prazo_base: 1 },
        rodoviaria: { horario: "11:00", prazo_base: 1 },
        flex_vitoria: { horario: "17:00", prazo_dias: 1 }
    },
    prazos_estados: {
        "ES": 1,
        "MG": 2, "RJ": 2, "SP": 2,
        "BA": 3, "DF": 3, "GO": 3, "MT": 3, "MS": 3, "PR": 3, "SC": 3, "RS": 3,
        "outros": 4
    },
    cidades: [
        "Colatina - ES", "Vitória - ES", "Vila Velha - ES", "Serra - ES", "Cariacica - ES",
        "São Paulo - SP", "Rio de Janeiro - RJ", "Belo Horizonte - MG", "Brasília - DF",
        "Salvador - BA", "Fortaleza - CE", "Recife - PE", "Porto Alegre - RS",
        "Curitiba - PR", "Goiânia - GO", "Manaus - AM", "Belém - PA", "São Luís - MA"
    ]
};

// Estado da aplicação
let pedidos = [];
let pedidoEditando = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando app...');
    setTimeout(inicializarApp, 100); // Pequeno delay para garantir que tudo carregou
});

function inicializarApp() {
    console.log('Inicializando aplicação...');
    carregarDados();
    configurarNavegacao();
    configurarFormulario();
    configurarCidadeAutocomplete();
    configurarBackup();
    atualizarDashboard();
    renderizarPedidos();
    console.log('Aplicação inicializada com sucesso!');
}

// Navegação
function configurarNavegacao() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    console.log('Configurando navegação...', navBtns.length, 'botões encontrados');

    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetSection = this.dataset.section;
            console.log('Navegando para:', targetSection);
            
            // Atualizar botões ativos
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar seção correspondente
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.classList.add('active');
            }
            
            // Atualizar dashboard se necessário
            if (targetSection === 'dashboard') {
                atualizarDashboard();
            }
        });
    });
}

// Configurar formulário
function configurarFormulario() {
    const form = document.getElementById('form-pedido');
    const cidadeInput = document.getElementById('cidade');
    const modalidadeSelect = document.getElementById('modalidade');
    const dataFestaInput = document.getElementById('data-festa');

    console.log('Configurando formulário...', form ? 'Form encontrado' : 'Form não encontrado');

    if (!form || !cidadeInput || !modalidadeSelect || !dataFestaInput) {
        console.error('Elementos do formulário não encontrados');
        return;
    }

    // Evento de input na cidade
    cidadeInput.addEventListener('input', function() {
        console.log('Cidade alterada:', this.value);
        atualizarModalidades();
        calcularPrazoLimite();
    });

    // Evento de mudança na modalidade
    modalidadeSelect.addEventListener('change', function() {
        console.log('Modalidade alterada:', this.value);
        calcularPrazoLimite();
    });

    // Evento de mudança na data da festa
    dataFestaInput.addEventListener('change', function() {
        console.log('Data festa alterada:', this.value);
        calcularPrazoLimite();
    });

    // Submit do formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Formulário submetido');
        salvarPedido();
    });
}

// Autocomplete de cidades
function configurarCidadeAutocomplete() {
    const cidadeInput = document.getElementById('cidade');
    const suggestionsDiv = document.getElementById('cidade-suggestions');

    if (!cidadeInput || !suggestionsDiv) {
        console.error('Elementos do autocomplete não encontrados');
        return;
    }

    console.log('Configurando autocomplete...');

    cidadeInput.addEventListener('input', function() {
        const valor = this.value.toLowerCase();
        suggestionsDiv.innerHTML = '';
        
        console.log('Buscando cidades para:', valor);
        
        if (valor.length < 2) {
            suggestionsDiv.style.display = 'none';
            return;
        }

        const cidadesFiltradas = APP_DATA.cidades.filter(cidade => 
            cidade.toLowerCase().includes(valor)
        );

        console.log('Cidades encontradas:', cidadesFiltradas.length);

        if (cidadesFiltradas.length > 0) {
            cidadesFiltradas.slice(0, 5).forEach(cidade => { // Limitar a 5 resultados
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = cidade;
                item.addEventListener('click', function() {
                    cidadeInput.value = cidade;
                    suggestionsDiv.style.display = 'none';
                    atualizarModalidades();
                    calcularPrazoLimite();
                });
                suggestionsDiv.appendChild(item);
            });
            suggestionsDiv.style.display = 'block';
        } else {
            suggestionsDiv.style.display = 'none';
        }
    });

    // Fechar suggestions ao clicar fora
    document.addEventListener('click', function(e) {
        if (!cidadeInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
}

// Atualizar modalidades baseado na cidade
function atualizarModalidades() {
    const cidade = document.getElementById('cidade').value;
    const modalidadeSelect = document.getElementById('modalidade');
    
    if (!modalidadeSelect) {
        console.error('Select de modalidade não encontrado');
        return;
    }
    
    console.log('Atualizando modalidades para cidade:', cidade);
    
    modalidadeSelect.innerHTML = '<option value="">Selecione a modalidade</option>';
    
    if (cidade.toLowerCase().includes('colatina') && cidade.toLowerCase().includes('es')) {
        // Modalidades para Colatina
        modalidadeSelect.innerHTML += '<option value="motoboy">Motoboy (até 16h)</option>';
        modalidadeSelect.innerHTML += '<option value="retirada">Retirada na empresa (até 16h)</option>';
        console.log('Modalidades de Colatina carregadas');
    } else if (cidade.trim() !== '') {
        // Modalidades para outras cidades
        modalidadeSelect.innerHTML += '<option value="correios">Correios (saída 14h)</option>';
        modalidadeSelect.innerHTML += '<option value="rodoviaria">Rodoviária (saída 11h)</option>';
        modalidadeSelect.innerHTML += '<option value="flex_vitoria">Flex/Motoboy Vitória (até 17h)</option>';
        console.log('Modalidades externas carregadas');
    }
}

// Calcular prazo limite
function calcularPrazoLimite() {
    const cidade = document.getElementById('cidade').value;
    const modalidade = document.getElementById('modalidade').value;
    const dataFesta = document.getElementById('data-festa').value;
    const prazoDiv = document.getElementById('prazo-limite');

    if (!prazoDiv) {
        console.error('Div de prazo não encontrada');
        return;
    }

    console.log('Calculando prazo para:', { cidade, modalidade, dataFesta });

    if (!cidade || !modalidade || !dataFesta) {
        prazoDiv.textContent = 'Selecione a cidade, modalidade e data da festa';
        prazoDiv.className = 'prazo-info';
        return;
    }

    const estado = extrairEstado(cidade);
    const dataFestaObj = new Date(dataFesta);
    const hoje = new Date();
    
    // 24h de produção após aprovação
    const diasProducao = 1;
    let diasEntrega = 0;

    if (cidade.toLowerCase().includes('colatina') && cidade.toLowerCase().includes('es')) {
        // Colatina - entrega no mesmo dia
        diasEntrega = APP_DATA.modalidades_colatina[modalidade] ? 
                     APP_DATA.modalidades_colatina[modalidade].prazo_dias : 0;
    } else {
        // Outras cidades
        if (modalidade === 'flex_vitoria') {
            diasEntrega = APP_DATA.modalidades_externa.flex_vitoria.prazo_dias;
        } else {
            diasEntrega = APP_DATA.prazos_estados[estado] || APP_DATA.prazos_estados.outros;
        }
    }

    const totalDias = diasProducao + diasEntrega;
    const dataLimite = new Date(dataFestaObj);
    dataLimite.setDate(dataLimite.getDate() - totalDias);

    const formatarData = (data) => {
        return data.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const horarioLimite = obterHorarioLimite(cidade, modalidade);
    
    console.log('Prazo calculado:', { dataLimite, horarioLimite, totalDias });
    
    if (dataLimite < hoje) {
        prazoDiv.innerHTML = `<strong>ATENÇÃO:</strong> Prazo limite já passou!<br>
                              Era até ${formatarData(dataLimite)} às ${horarioLimite}`;
        prazoDiv.style.backgroundColor = '#f8d7da';
        prazoDiv.style.borderColor = '#f1aeb5';
        prazoDiv.style.color = '#721c24';
    } else {
        prazoDiv.innerHTML = `Prazo limite para aprovação e pagamento:<br>
                              <strong>${formatarData(dataLimite)} até ${horarioLimite}</strong>`;
        prazoDiv.style.backgroundColor = '#e7f3ff';
        prazoDiv.style.borderColor = '#b8daff';
        prazoDiv.style.color = '#004085';
    }
}

function extrairEstado(cidade) {
    const match = cidade.match(/- ([A-Z]{2})$/);
    return match ? match[1] : 'outros';
}

function obterHorarioLimite(cidade, modalidade) {
    if (cidade.toLowerCase().includes('colatina') && cidade.toLowerCase().includes('es')) {
        return APP_DATA.modalidades_colatina[modalidade] ? 
               APP_DATA.modalidades_colatina[modalidade].horario : '16:00';
    } else {
        if (modalidade === 'flex_vitoria') {
            return APP_DATA.modalidades_externa.flex_vitoria.horario;
        } else {
            return APP_DATA.modalidades_externa[modalidade] ? 
                   APP_DATA.modalidades_externa[modalidade].horario : '14:00';
        }
    }
}

// Salvar pedido
function salvarPedido() {
    const form = document.getElementById('form-pedido');
    if (!form) {
        console.error('Formulário não encontrado');
        return;
    }

    const formData = new FormData(form);
    
    const pedido = {
        id: pedidoEditando ? pedidoEditando.id : Date.now(),
        cliente: formData.get('cliente'),
        produto: formData.get('produto'),
        dataFesta: formData.get('data-festa'),
        cidade: formData.get('cidade'),
        modalidade: formData.get('modalidade'),
        observacoes: formData.get('observacoes'),
        status: pedidoEditando ? pedidoEditando.status : 'pendente',
        dataCriacao: pedidoEditando ? pedidoEditando.dataCriacao : new Date().toISOString()
    };

    console.log('Salvando pedido:', pedido);

    if (pedidoEditando) {
        const index = pedidos.findIndex(p => p.id === pedidoEditando.id);
        pedidos[index] = pedido;
        pedidoEditando = null;
    } else {
        pedidos.push(pedido);
    }

    salvarDados();
    form.reset();
    
    // Reset dos campos especiais
    const prazoDiv = document.getElementById('prazo-limite');
    const modalidadeSelect = document.getElementById('modalidade');
    const suggestionsDiv = document.getElementById('cidade-suggestions');
    
    if (prazoDiv) prazoDiv.textContent = 'Selecione a cidade e modalidade';
    if (modalidadeSelect) modalidadeSelect.innerHTML = '<option value="">Selecione a modalidade</option>';
    if (suggestionsDiv) suggestionsDiv.style.display = 'none';
    
    alert('Pedido salvo com sucesso!');
    atualizarDashboard();
    renderizarPedidos();
}

// Renderizar lista de pedidos
function renderizarPedidos() {
    const tbody = document.getElementById('pedidos-tbody');
    if (!tbody) {
        console.error('Tbody não encontrado');
        return;
    }

    console.log('Renderizando', pedidos.length, 'pedidos');
    tbody.innerHTML = '';

    if (pedidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Nenhum pedido cadastrado</td></tr>';
        return;
    }

    pedidos.forEach(pedido => {
        const tr = document.createElement('tr');
        
        const statusClass = `status status-${pedido.status}`;
        const statusText = {
            'pendente': 'Pendente',
            'producao': 'Produção',
            'concluido': 'Concluído',
            'atrasado': 'Atrasado'
        }[pedido.status];

        tr.innerHTML = `
            <td>${pedido.id}</td>
            <td>${pedido.cliente}</td>
            <td>${pedido.produto}</td>
            <td>${new Date(pedido.dataFesta).toLocaleDateString('pt-BR')}</td>
            <td>${pedido.cidade}</td>
            <td>${pedido.modalidade}</td>
            <td>${calcularPrazoTexto(pedido)}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-action btn-edit" onclick="editarPedido(${pedido.id})">Editar</button>
                <button class="btn-action btn-delete" onclick="excluirPedido(${pedido.id})">Excluir</button>
                <select onchange="alterarStatus(${pedido.id}, this.value)" class="btn-action">
                    <option value="">Status</option>
                    <option value="pendente" ${pedido.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="producao" ${pedido.status === 'producao' ? 'selected' : ''}>Produção</option>
                    <option value="concluido" ${pedido.status === 'concluido' ? 'selected' : ''}>Concluído</option>
                    <option value="atrasado" ${pedido.status === 'atrasado' ? 'selected' : ''}>Atrasado</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function calcularPrazoTexto(pedido) {
    const estado = extrairEstado(pedido.cidade);
    const dataFestaObj = new Date(pedido.dataFesta);
    let diasEntrega = 0;

    if (pedido.cidade.toLowerCase().includes('colatina') && pedido.cidade.toLowerCase().includes('es')) {
        diasEntrega = APP_DATA.modalidades_colatina[pedido.modalidade] ? 
                     APP_DATA.modalidades_colatina[pedido.modalidade].prazo_dias : 0;
    } else {
        if (pedido.modalidade === 'flex_vitoria') {
            diasEntrega = APP_DATA.modalidades_externa.flex_vitoria.prazo_dias;
        } else {
            diasEntrega = APP_DATA.prazos_estados[estado] || APP_DATA.prazos_estados.outros;
        }
    }

    const totalDias = 1 + diasEntrega;
    const dataLimite = new Date(dataFestaObj);
    dataLimite.setDate(dataLimite.getDate() - totalDias);
    
    const horario = obterHorarioLimite(pedido.cidade, pedido.modalidade);
    
    return dataLimite.toLocaleDateString('pt-BR') + ' ' + horario;
}

// Editar pedido
function editarPedido(id) {
    const pedido = pedidos.find(p => p.id === id);
    if (pedido) {
        pedidoEditando = pedido;
        
        console.log('Editando pedido:', pedido);
        
        document.getElementById('cliente').value = pedido.cliente;
        document.getElementById('produto').value = pedido.produto;
        document.getElementById('data-festa').value = pedido.dataFesta;
        document.getElementById('cidade').value = pedido.cidade;
        document.getElementById('observacoes').value = pedido.observacoes;
        
        atualizarModalidades();
        setTimeout(() => {
            document.getElementById('modalidade').value = pedido.modalidade;
            calcularPrazoLimite();
        }, 100);
        
        // Navegar para seção de novo pedido
        document.querySelector('[data-section="novo-pedido"]').click();
    }
}

// Excluir pedido
function excluirPedido(id) {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
        pedidos = pedidos.filter(p => p.id !== id);
        salvarDados();
        renderizarPedidos();
        atualizarDashboard();
    }
}

// Alterar status
function alterarStatus(id, novoStatus) {
    if (novoStatus) {
        const pedido = pedidos.find(p => p.id === id);
        if (pedido) {
            pedido.status = novoStatus;
            salvarDados();
            renderizarPedidos();
            atualizarDashboard();
        }
    }
}

// Dashboard
function atualizarDashboard() {
    const hoje = new Date().toDateString();
    
    const totalElement = document.getElementById('total-pedidos');
    const pendentesElement = document.getElementById('pedidos-pendentes');
    const concluidosElement = document.getElementById('pedidos-concluidos');
    const hojeElement = document.getElementById('pedidos-hoje');
    
    if (totalElement) totalElement.textContent = pedidos.length;
    if (pendentesElement) pendentesElement.textContent = 
        pedidos.filter(p => p.status === 'pendente').length;
    if (concluidosElement) concluidosElement.textContent = 
        pedidos.filter(p => p.status === 'concluido').length;
    if (hojeElement) hojeElement.textContent = 
        pedidos.filter(p => new Date(p.dataCriacao).toDateString() === hoje).length;
        
    console.log('Dashboard atualizado:', {
        total: pedidos.length,
        pendentes: pedidos.filter(p => p.status === 'pendente').length,
        concluidos: pedidos.filter(p => p.status === 'concluido').length,
        hoje: pedidos.filter(p => new Date(p.dataCriacao).toDateString() === hoje).length
    });
}

// Backup e restauração
function configurarBackup() {
    const btnBackup = document.getElementById('btn-backup');
    const btnRestaurar = document.getElementById('btn-restaurar');
    const fileBackup = document.getElementById('file-backup');
    
    if (btnBackup) {
        btnBackup.addEventListener('click', fazerBackup);
        console.log('Botão backup configurado');
    }
    
    if (btnRestaurar) {
        btnRestaurar.addEventListener('click', function() {
            if (fileBackup) fileBackup.click();
        });
        console.log('Botão restaurar configurado');
    }
    
    if (fileBackup) {
        fileBackup.addEventListener('change', restaurarBackup);
        console.log('Input file configurado');
    }
}

function fazerBackup() {
    const dados = {
        pedidos: pedidos,
        dataBackup: new Date().toISOString()
    };
    
    console.log('Fazendo backup de', pedidos.length, 'pedidos');
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-sublimacao-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Backup realizado com sucesso!');
}

function restaurarBackup(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const dados = JSON.parse(e.target.result);
                if (dados.pedidos && Array.isArray(dados.pedidos)) {
                    if (confirm('Tem certeza que deseja restaurar o backup? Isso substituirá todos os dados atuais.')) {
                        pedidos = dados.pedidos;
                        salvarDados();
                        renderizarPedidos();
                        atualizarDashboard();
                        alert('Backup restaurado com sucesso!');
                        console.log('Backup restaurado:', pedidos.length, 'pedidos');
                    }
                } else {
                    alert('Arquivo de backup inválido!');
                }
            } catch (error) {
                console.error('Erro ao restaurar backup:', error);
                alert('Erro ao ler arquivo de backup!');
            }
        };
        reader.readAsText(file);
    }
}

// LocalStorage
function salvarDados() {
    try {
        localStorage.setItem('sublimacao-pedidos', JSON.stringify(pedidos));
        console.log('Dados salvos no localStorage:', pedidos.length, 'pedidos');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
    }
}

function carregarDados() {
    try {
        const dados = localStorage.getItem('sublimacao-pedidos');
        if (dados) {
            pedidos = JSON.parse(dados);
            console.log('Dados carregados do localStorage:', pedidos.length, 'pedidos');
        } else {
            pedidos = [];
            console.log('Nenhum dado encontrado no localStorage');
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        pedidos = [];
    }
}