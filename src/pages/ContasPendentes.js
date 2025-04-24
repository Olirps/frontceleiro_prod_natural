import React, { useState, useEffect } from 'react';
import { getMovimentacaofinanceiraDespesa } from '../services/api';
import { formatarMoedaBRL, formatarData } from '../utils/functions';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Importe o plugin autotable para criar tabelas no PDF

function ContasPendentes() {
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [filtroFornecedor, setFiltroFornecedor] = useState(''); // Substituir "produto" por "fornecedor"
    const [filtroCNPJ, setFiltroCNPJ] = useState(''); // Estado para o filtro de CNPJ
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [movimentacoesFiltrados, setMovimentacoesFiltrados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filtroStatus, setFiltroStatus] = useState(''); // Estado para o filtro de status

    ///preparacao para paginação
    const [agruparSintetico, setAgruparSintetico] = useState(false);
    const [agruparPorMovimentacao, setAgruparPorMovimentacao] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    ///preparacao para paginação  ---end

    // Função para buscar as movimentações financeiras
    const fetchMovimentacoes = async () => {
        setLoading(true);
        setError('');
        try {
            const filters = {
                dataInicio,
                dataFim,
                fornecedor: filtroFornecedor,
                status: 'Pendente',
                cnpj: filtroCNPJ
            };
            const response = await getMovimentacaofinanceiraDespesa(filters);
            setMovimentacoes(response.data); // Armazenar os dados completos
            setMovimentacoesFiltrados(response.data); // Inicialmente, os dados filtrados são iguais aos completos
        } catch (err) {
            setError('Erro ao carregar as movimentações financeiras.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // useEffect para buscar as movimentações quando o componente é montado ou quando os filtros mudam
    useEffect(() => {
        fetchMovimentacoes();
    }, []);

    // Função para limpar os filtros
    const handleLimparFiltros = () => {
        setDataInicio('');
        setDataFim('');
        setFiltroFornecedor(''); // Limpar o filtro de fornecedor
        setFiltroStatus('');
        setFiltroCNPJ(''); // Limpar o filtro de CNPJ
        fetchMovimentacoes(); // Buscar os dados completos novamente
    };

    const totalPages = Math.ceil(movimentacoesFiltrados.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentMovimentacoes = movimentacoesFiltrados.slice(startIndex, startIndex + rowsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleRowsChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1); // Resetar para a primeira página ao alterar o número de linhas
    };

    // Calcular a soma dos valores das movimentações
    const somaValores = movimentacoesFiltrados.reduce((total, movimentacao) => {
        return Number(Number(total) + Number(movimentacao.valor_parcela || 0)).toFixed(2);
    }, 0);

    const handleGerarPDF = () => {
        const doc = new jsPDF();

        // Adicionar um título ao PDF
        doc.setFontSize(18);
        doc.text('Contas à Pagar', 10, 10);

        // Definir as colunas da tabela
        const columns = [
            { title: "ID", dataKey: "id" },
            { title: "Credor", dataKey: "credor" },
            { title: "Descrição", dataKey: "descricao" },
            { title: "Valor", dataKey: "valor" },
            { title: "Data de Vencimento", dataKey: "vencimento" },
            { title: "Status", dataKey: "status" }
        ];

        // Preparar os dados para a tabela
        const rows = movimentacoesFiltrados.map(movimentacao => ({
            id: movimentacao.id,
            credor: movimentacao.cliente_nome || movimentacao.fornecedor_nome || movimentacao.funcionario_nome || movimentacao.credor_nome,
            descricao: movimentacao.descricao,
            valor: formatarMoedaBRL(movimentacao.valor_parcela),
            vencimento: formatarData(movimentacao.vencimento),
            status: movimentacao.status
        }));

        // Adicionar a tabela ao PDF
        doc.autoTable({
            head: [columns.map(col => col.title)],
            body: rows.map(row => columns.map(col => row[col.dataKey])),
            startY: 20
        });

        // Adicionar a somatória no final da tabela
        doc.autoTable({
            body: [
                [
                    { content: 'Total:', styles: { fontStyle: 'bold', halign: 'right' } },
                    { content: formatarMoedaBRL(somaValores), styles: { fontStyle: 'bold' } }
                ]
            ],
            startY: doc.lastAutoTable.finalY + 10, // Posiciona após a tabela principal
            margin: { left: 10 },
            theme: 'plain',
            styles: { cellPadding: 5 }
        });

        // Salvar o PDF
        doc.save('contas_a_pagar.pdf');
    };

    if (loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }

    return (
        <div>
            <h1 className="title-page">Contas à Pagar</h1>
            <div id="search-container">
                <div id="search-fields">
                    <label>Data de Início:
                        <input
                            className='input-geral'
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                        />
                    </label>
                    <label>Data de Fim:
                        <input
                            className='input-geral'
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                        />
                    </label>
                    <label>Fornecedor:
                        <input
                            className='input-geral'
                            type="text"
                            placeholder="Digite o nome do fornecedor"
                            value={filtroFornecedor}
                            onChange={(e) => setFiltroFornecedor(e.target.value)}
                        />
                    </label>
                    <label>CNPJ:
                        <input
                            className='input-geral'
                            type="text"
                            placeholder="Digite o CNPJ do fornecedor"
                            value={filtroCNPJ}
                            onChange={(e) => setFiltroCNPJ(e.target.value)}
                        />
                    </label>
                    {/* Dropdown para o filtro de status */}
                    <label>Status:
                        <select
                            className='input-geral'
                            value={filtroStatus}
                            onChange={(e) => setFiltroStatus(e.target.value)}
                        >
                            <option value="Pendente">Pendente</option>
                        </select>
                    </label>
                </div>
                <div id='button-group'>
                    <button className="button" onClick={fetchMovimentacoes}>Filtrar</button>
                    <button className="button" onClick={handleLimparFiltros}>Limpar</button>
                    <button className="button" onClick={handleGerarPDF}>Gerar PDF</button>
                </div>
            </div>
            <div id="separator-bar"></div>

            {/* Exibição de erro ou loading */}
            {loading && <p>Carregando...</p>}
            {error && <p className="error">{error}</p>}

            {/* Tabela para exibir os resultados */}
            <div id="results-container">
                <div id="grid-padrao-container">
                    <table id="grid-padrao">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Credor</th>
                                <th>Descrição</th>
                                <th>Valor</th>
                                <th>Data de Vencimento</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movimentacoes.length > 0 ? (
                                currentMovimentacoes.map((movimentacao) => (
                                    <tr key={movimentacao.id}>
                                        <td>{movimentacao.id}</td>
                                        <td>
                                            {movimentacao.cliente_nome || movimentacao.fornecedor_nome || movimentacao.funcionario_nome || movimentacao.credor_nome}
                                        </td>
                                        <td>{movimentacao.descricao}</td>
                                        <td>{formatarMoedaBRL(movimentacao.valor_parcela)}</td>
                                        <td>{formatarData(movimentacao.vencimento)}</td>
                                        <td>{movimentacao.status}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">Nenhuma movimentação encontrada.</td>
                                </tr>
                            )}
                            {/* Linha da somatória */}
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                                <td style={{ fontWeight: 'bold' }}>{formatarMoedaBRL(somaValores)}</td>
                                <td colSpan="2"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div id="pagination-container">
                    <button onClick={handlePreviousPage} disabled={currentPage === 1}>
                        Anterior
                    </button>
                    <span>Página {currentPage} de {totalPages}</span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages}>
                        Próxima
                    </button>
                </div>

                <div id="show-more-container">
                    <label htmlFor="rows-select">Mostrar</label>
                    <select id="rows-select" value={rowsPerPage} onChange={handleRowsChange}>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                    <label htmlFor="rows-select">por página</label>
                </div>
            </div>
        </div>
    );
}

export default ContasPendentes;