const CHAVE_LOCALSTORAGE = 'minhas_financas_gastos';

function obterGastos() {
    const dados = localStorage.getItem(CHAVE_LOCALSTORAGE);
    return dados ? JSON.parse(dados) : [];
}

function salvarGastos(gastos) {
    localStorage.setItem(CHAVE_LOCALSTORAGE, JSON.stringify(gastos));
}

function obterDataLocalISO(dataObj = new Date()) {
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function formatarData(dataIso) {
    if (!dataIso) return '';
    const partes = dataIso.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataIso;
}

function formatarCategoria(categoria) {
    const categorias = {
        alimentacao: 'Alimentação',
        transporte: 'Transporte',
        lazer: 'Lazer',
        compras: 'Compras',
        contas: 'Contas',
        saude: 'Saúde',
        outros: 'Outros'
    };
    return categorias[categoria] || categoria;
}

function salvarGasto(evento) {
    evento.preventDefault();

    const idCampo = document.getElementById('id-gasto').value;
    const descricao = document.getElementById('descricao').value.trim();
    const valor = parseFloat(document.getElementById('valor').value);
    const categoria = document.getElementById('categoria').value;
    const data = document.getElementById('data').value;

    if (!descricao || isNaN(valor) || !categoria || !data) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    const gastos = obterGastos();

    if (idCampo) {
        const indice = gastos.findIndex(g => String(g.id) === String(idCampo));
        if (indice !== -1) {
            gastos[indice] = {
                id: Number(idCampo),
                descricao,
                valor,
                categoria,
                data
            };
        }
    } else {
        const novoGasto = {
            id: Date.now(),
            descricao,
            valor,
            categoria,
            data
        };
        gastos.push(novoGasto);
    }

    salvarGastos(gastos);
    window.location.href = 'index.html';
}

function carregarGastoParaEdicao() {
    const formulario = document.getElementById('formulario-gasto');
    if (!formulario) return;

    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get('id');

    if (!id) {
        const campoData = document.getElementById('data');
        if (campoData && !campoData.value) {
            campoData.value = obterDataLocalISO();
        }
        return;
    }

    const gastos = obterGastos();
    const gasto = gastos.find(g => String(g.id) === String(id));

    if (!gasto) {
        alert('Gasto não encontrado!');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('id-gasto').value = gasto.id;
    document.getElementById('descricao').value = gasto.descricao;
    document.getElementById('valor').value = gasto.valor;
    document.getElementById('categoria').value = gasto.categoria;
    document.getElementById('data').value = gasto.data;

    const tituloFormulario = document.getElementById('titulo-formulario');
    const subtituloTela = document.getElementById('subtitulo-tela');
    const botaoSalvar = document.getElementById('botao-salvar');

    if (tituloFormulario) tituloFormulario.textContent = 'Editar Gasto';
    if (subtituloTela) subtituloTela.textContent = 'Alteração de Registro';
    if (botaoSalvar) botaoSalvar.textContent = '💾 Atualizar Gasto';
}

function obterGastosDoPeriodo() {
    const dataInicial = document.getElementById('filtro-data-inicial')?.value || '';
    const dataFinal = document.getElementById('filtro-data-final')?.value || '';

    let gastos = obterGastos();

    if (dataInicial) {
        gastos = gastos.filter(gasto => gasto.data >= dataInicial);
    }

    if (dataFinal) {
        gastos = gastos.filter(gasto => gasto.data <= dataFinal);
    }

    return gastos;
}

function listarGastos(termoFiltro = '') {
    const corpoTabela = document.getElementById('corpo-tabela-gastos');
    const mensagemVazia = document.getElementById('mensagem-vazia');
    const tabelaGastos = document.getElementById('tabela-gastos');

    if (!corpoTabela) return;

    const gastosPeriodo = obterGastosDoPeriodo();
    let gastos = [...gastosPeriodo];

    gastos.sort((a, b) => new Date(b.data) - new Date(a.data));

    if (termoFiltro) {
        const termo = termoFiltro.toLowerCase();

        gastos = gastos.filter(g =>
            g.descricao.toLowerCase().includes(termo) ||
            formatarCategoria(g.categoria).toLowerCase().includes(termo)
        );
    }

    corpoTabela.innerHTML = '';

    if (gastos.length === 0) {
        if (tabelaGastos) tabelaGastos.classList.add('escondido');

        if (mensagemVazia) {
            mensagemVazia.classList.remove('escondido');

            mensagemVazia.querySelector('p').textContent =
                gastosPeriodo.length === 0
                    ? 'Nenhum gasto encontrado neste período.'
                    : 'Nenhum gasto corresponde à pesquisa.';
        }
    } else {
        if (tabelaGastos) tabelaGastos.classList.remove('escondido');
        if (mensagemVazia) mensagemVazia.classList.add('escondido');

        gastos.forEach(gasto => {
            const linha = document.createElement('tr');
            linha.className = 'linha-gasto';

            linha.innerHTML = `
                <td class="celula-data">${formatarData(gasto.data)}</td>
                <td class="celula-descricao"></td>
                <td class="celula-categoria">
                    <span class="etiqueta etiqueta-${gasto.categoria}">${formatarCategoria(gasto.categoria)}</span>
                </td>
                <td class="celula-valor valor-negativo">${formatarMoeda(gasto.valor)}</td>
                <td class="celula-acoes">
                    <button type="button" class="botao-acao botao-editar" title="Editar gasto" onclick="editarGasto(${gasto.id})">✏️</button>
                    <button type="button" class="botao-acao botao-excluir" title="Excluir gasto" onclick="excluirGasto(${gasto.id})">🗑️</button>
                </td>
            `;

            linha.querySelector('.celula-descricao').textContent = gasto.descricao;
            corpoTabela.appendChild(linha);
        });
    }

    calcularTotais(gastos);
}

function calcularTotais(gastos = obterGastosDoPeriodo()) {
    const elementoHoje = document.getElementById('total-hoje');
    const elementoSemana = document.getElementById('total-semana');
    const elementoGeral = document.getElementById('total-geral');

    if (!elementoHoje && !elementoSemana && !elementoGeral) return;

    const hojeStr = obterDataLocalISO();

    const dataLimiteSemana = new Date();
    dataLimiteSemana.setDate(dataLimiteSemana.getDate() - 7);
    const limiteSemanaStr = obterDataLocalISO(dataLimiteSemana);

    let totalHoje = 0;
    let totalSemana = 0;
    let totalGeral = 0;

    gastos.forEach(gasto => {
        const valor = Number(gasto.valor) || 0;

        totalGeral += valor;

        if (gasto.data === hojeStr) {
            totalHoje += valor;
        }

        if (gasto.data >= limiteSemanaStr && gasto.data <= hojeStr) {
            totalSemana += valor;
        }
    });

    if (elementoHoje) elementoHoje.textContent = formatarMoeda(totalHoje);
    if (elementoSemana) elementoSemana.textContent = formatarMoeda(totalSemana);
    if (elementoGeral) elementoGeral.textContent = formatarMoeda(totalGeral);

    const rotuloGeral = document.querySelector('.cartao-geral .rotulo-cartao');

    const filtroAtivo =
        document.getElementById('filtro-data-inicial')?.value ||
        document.getElementById('filtro-data-final')?.value;

    if (rotuloGeral) {
        rotuloGeral.textContent = filtroAtivo ? 'Total do Período' : 'Total Geral';
    }

    atualizarGraficoCategorias(gastos);
}

function pesquisarGastos() {
    const campo = document.getElementById('campo-pesquisa');
    const termo = campo ? campo.value.trim() : '';

    listarGastos(termo);
}

function filtrarPeriodo() {
    const dataInicial = document.getElementById('filtro-data-inicial').value;
    const dataFinal = document.getElementById('filtro-data-final').value;

    if (dataInicial && dataFinal && dataInicial > dataFinal) {
        alert('A data inicial não pode ser posterior à data final.');
        return;
    }

    pesquisarGastos();
}

function limparFiltroPeriodo() {
    document.getElementById('filtro-data-inicial').value = '';
    document.getElementById('filtro-data-final').value = '';

    pesquisarGastos();
}

function gerarRelatorioPDF() {
    // Verifica se as bibliotecas foram carregadas
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Erro ao carregar a biblioteca de geração de PDF.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Obtém os gastos conforme os filtros da tela
    let gastos = obterGastosDoPeriodo();

    const campoPesquisa = document.getElementById('campo-pesquisa');
    const termo = campoPesquisa ? campoPesquisa.value.trim().toLowerCase() : '';

    if (termo) {
        gastos = gastos.filter(gasto =>
            gasto.descricao.toLowerCase().includes(termo) ||
            formatarCategoria(gasto.categoria).toLowerCase().includes(termo)
        );
    }

    // Ordena pela data, da mais recente para a mais antiga
    gastos.sort((a, b) => new Date(b.data) - new Date(a.data));

    if (gastos.length === 0) {
        alert('Não existem gastos para gerar o relatório.');
        return;
    }

    // Calcula o total
    const totalGeral = gastos.reduce(
        (total, gasto) => total + (Number(gasto.valor) || 0), 0
    );

    // Agrupa os valores por categoria
    const totaisCategorias = {};

    gastos.forEach(gasto => {
        const categoria = gasto.categoria;
        totaisCategorias[categoria] =
            (totaisCategorias[categoria] || 0) + Number(gasto.valor || 0);
    });

    const dadosCategorias = Object.entries(totaisCategorias)
        .sort((a, b) => b[1] - a[1])
        .map(([categoria, valor]) => [
            formatarCategoria(categoria),
            formatarMoeda(valor),
            `${((valor / totalGeral) * 100).toFixed(1)}%`
        ]);

    // Identifica o período consultado
    const dataInicial = document.getElementById('filtro-data-inicial')?.value || '';
    const dataFinal = document.getElementById('filtro-data-final')?.value || '';

    let periodo = 'Todos os registros';

    if (dataInicial && dataFinal) {
        periodo = `${formatarData(dataInicial)} a ${formatarData(dataFinal)}`;
    } else if (dataInicial) {
        periodo = `A partir de ${formatarData(dataInicial)}`;
    } else if (dataFinal) {
        periodo = `Até ${formatarData(dataFinal)}`;
    }

    // Data e hora da geração
    const agora = new Date();

    const dataGeracao = agora.toLocaleDateString('pt-BR');
    const horaGeracao = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Configurações visuais
    const azul = [38, 83, 145];
    const cinza = [90, 100, 115];

    // Cabeçalho
    doc.setFillColor(...azul);
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('CONTROLE FINANCEIRO', 14, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Relatório de despesas pessoais', 14, 26);

    // Informações do relatório
    doc.setTextColor(40, 50, 65);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('RESUMO DO RELATÓRIO', 14, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...cinza);

    doc.text(`Período: ${periodo}`, 14, 59);
    doc.text(`Gerado em: ${dataGeracao} às ${horaGeracao}`, 14, 66);

    // Destaques do resumo
    doc.setFillColor(241, 245, 250);
    doc.roundedRect(14, 74, 88, 25, 3, 3, 'F');
    doc.roundedRect(108, 74, 88, 25, 3, 3, 'F');

    doc.setTextColor(...cinza);
    doc.setFontSize(9);
    doc.text('TOTAL DE DESPESAS', 20, 83);
    doc.text('QUANTIDADE DE LANÇAMENTOS', 114, 83);

    doc.setTextColor(...azul);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(formatarMoeda(totalGeral), 20, 93);
    doc.text(String(gastos.length), 114, 93);

    // Tabela por categoria
    doc.setTextColor(40, 50, 65);
    doc.setFontSize(11);
    doc.text('DESPESAS POR CATEGORIA', 14, 112);

    doc.autoTable({
        startY: 117,
        head: [['Categoria', 'Valor', 'Participação']],
        body: dadosCategorias,
        theme: 'striped',
        headStyles: {
            fillColor: azul,
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'right' }
        },
        margin: { left: 14, right: 14 }
    });

    // Tabela detalhada
    const posicaoTabela = doc.lastAutoTable.finalY + 15;

    doc.setTextColor(40, 50, 65);
    doc.setFontSize(11);
    doc.text('DETALHAMENTO DAS DESPESAS', 14, posicaoTabela);

    const dadosDetalhados = gastos.map(gasto => [
        formatarData(gasto.data),
        gasto.descricao,
        formatarCategoria(gasto.categoria),
        formatarMoeda(gasto.valor)
    ]);

    doc.autoTable({
        startY: posicaoTabela + 5,
        head: [['Data', 'Descrição', 'Categoria', 'Valor']],
        body: dadosDetalhados,
        theme: 'striped',
        headStyles: {
            fillColor: azul,
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak'
        },
        columnStyles: {
            0: { cellWidth: 27 },
            1: { cellWidth: 75 },
            2: { cellWidth: 43 },
            3: { halign: 'right', cellWidth: 37 }
        },
        margin: { left: 14, right: 14 }
    });

    // Rodapé com numeração das páginas
    const totalPaginas = doc.internal.getNumberOfPages();

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        doc.setPage(pagina);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(130, 140, 150);

        doc.text(
            `Controle Financeiro - Página ${pagina} de ${totalPaginas}`,
            105,
            287,
            { align: 'center' }
        );
    }

    // Nome do arquivo
    const nomeArquivo = `Relatorio_Financeiro_${agora.getFullYear()}-${String(
        agora.getMonth() + 1
    ).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}.pdf`;

    doc.save(nomeArquivo);
}

function atualizarGraficoCategorias(gastos) {
    const canvas = document.getElementById('grafico-categorias');
    const legenda = document.getElementById('legenda-grafico');

    if (!canvas || !legenda) return;

    const contexto = canvas.getContext('2d');

    const cores = {
        alimentacao: '#ed8b32',
        transporte: '#2688c7',
        lazer: '#8056cf',
        compras: '#d65c9b',
        contas: '#d95353',
        saude: '#159b78',
        outros: '#718096'
    };

    const totais = {};

    gastos.forEach(gasto => {
        const categoria = gasto.categoria;
        const valor = Number(gasto.valor) || 0;

        totais[categoria] = (totais[categoria] || 0) + valor;
    });

    const dados = Object.entries(totais)
        .filter(([categoria, valor]) => valor > 0)
        .sort((a, b) => b[1] - a[1]);

    const totalGeral = dados.reduce((total, item) => total + item[1], 0);

    contexto.clearRect(0, 0, 240, 240);
    legenda.innerHTML = '';

    contexto.beginPath();
    contexto.arc(120, 120, 82, 0, Math.PI * 2);
    contexto.strokeStyle = '#edf0f5';
    contexto.lineWidth = 25;
    contexto.stroke();

    if (totalGeral === 0) {
        contexto.fillStyle = '#8792a5';
        contexto.font = 'bold 14px Arial';
        contexto.textAlign = 'center';
        contexto.textBaseline = 'middle';
        contexto.fillText('Sem gastos', 120, 120);

        legenda.innerHTML = '<p class="mensagem-grafico">Nenhuma despesa registrada.</p>';
        return;
    }

    let anguloInicial = -Math.PI / 2;

    dados.forEach(([categoria, valor]) => {
        const percentual = valor / totalGeral;
        const anguloFinal = anguloInicial + percentual * Math.PI * 2;
        const abertura = anguloFinal - anguloInicial;
        const espacamento = Math.min(0.015, abertura / 2);

        contexto.beginPath();
        contexto.arc(
            120,
            120,
            82,
            anguloInicial + espacamento,
            anguloFinal - espacamento
        );

        contexto.strokeStyle = cores[categoria] || '#718096';
        contexto.lineWidth = 25;
        contexto.lineCap = 'butt';
        contexto.stroke();

        anguloInicial = anguloFinal;

        const item = document.createElement('div');
        item.className = 'item-legenda';

        const cor = document.createElement('span');
        cor.className = 'cor-legenda';
        cor.style.backgroundColor = cores[categoria] || '#718096';

        const nome = document.createElement('span');
        nome.className = 'nome-legenda';
        nome.textContent = formatarCategoria(categoria);

        const valorElemento = document.createElement('span');
        valorElemento.className = 'valor-legenda';
        valorElemento.textContent =
            `${formatarMoeda(valor)} (${(percentual * 100).toFixed(1)}%)`;

        item.appendChild(cor);
        item.appendChild(nome);
        item.appendChild(valorElemento);

        legenda.appendChild(item);
    });

    contexto.textAlign = 'center';
    contexto.textBaseline = 'middle';

    contexto.fillStyle = '#8792a5';
    contexto.font = '12px Arial';
    const filtroAtivo =
        document.getElementById('filtro-data-inicial')?.value ||
        document.getElementById('filtro-data-final')?.value;

    contexto.fillText(
        filtroAtivo ? 'TOTAL DO PERÍODO' : 'TOTAL GERAL',
        120,
        108
    );

    contexto.fillStyle = '#263247';
    contexto.font = 'bold 16px Arial';
    contexto.fillText(formatarMoeda(totalGeral), 120, 132);
}

function editarGasto(id) {
    window.location.href = `cadastrar.html?id=${id}`;
}

function excluirGasto(id) {
    const confirmar = confirm('Tem certeza que deseja excluir este gasto?');

    if (!confirmar) return;

    const gastos = obterGastos();
    const novosGastos = gastos.filter(
        gasto => String(gasto.id) !== String(id)
    );

    if (novosGastos.length === gastos.length) {
        alert('Gasto não encontrado.');
        return;
    }

    salvarGastos(novosGastos);

    pesquisarGastos();
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('corpo-tabela-gastos')) {
        listarGastos();
    }
    if (document.getElementById('formulario-gasto')) {
        carregarGastoParaEdicao();
    }
});