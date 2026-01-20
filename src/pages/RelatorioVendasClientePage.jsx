import { useState, useEffect } from 'react';
import {
    getVendasPorClientePeriodo,
    getClientes,
    getProdutos
} from '../services/api';
import Pagination from '../utils/Pagination';
import { formatarMoedaBRL, formatarDataBR } from '../utils/functions';
import { debounce } from 'lodash';
import { BarChart, Pie, Bar, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart } from 'recharts';

const RelatorioVendasClientePage = () => {
    const getDataHoje = () => {
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset()); // ajusta para timezone local
        return hoje.toISOString().slice(0, 10);
    };
    const [clienteTrigger, setClienteTrigger] = useState(false);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [linhasPorPagina, setLinhasPorPagina] = useState(50);
    const [dataInicio, setDataInicio] = useState(getDataHoje());
    const [dataFim, setDataFim] = useState(getDataHoje());
    const [clienteBusca, setClienteBusca] = useState('');
    const [clientesFiltrados, setClientesFiltrados] = useState([]);
    const [produtoBusca, setProdutoBusca] = useState('');
    const [produtoId, setProdutoId] = useState(null);
    const [produtosFiltrados, setProdutosFiltrados] = useState([]);
    const [clienteSelected, setClienteSelected] = useState(false);
    const [produtoSelected, setProdutoSelected] = useState(false);
    const [clienteNome, setClienteNome] = useState('');
    const [clienteId, setClienteId] = useState(null);
    const [produtoDescricao, setProdutoDescricao] = useState('');
    const [vendas, setVendas] = useState([]);
    const [totalGeral, setTotalGeral] = useState(0);
    const [modoExibicao, setModoExibicao] = useState('analitico');
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const COLORS = [
        '#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#8dd1e1',
        '#a4de6c', '#d0ed57', '#f5a623', '#e74c3c', '#3b82f6'
    ];

    // Limpar resultados sempre que qualquer filtro for alterado
    useEffect(() => {
        setVendas([]);
        setTotalGeral(0);
        setPaginaAtual(1);
        setClienteBusca('');
        setClienteNome('');
        setClientesFiltrados([]);
        setClienteSelected(false);
    }, [modoExibicao]);

    const handleChangeRowsPerPage = (newRowsPerPage) => {
        setLinhasPorPagina(newRowsPerPage);
        setPaginaAtual(1);  // Reseta para a primeira página
    };
    useEffect(() => {
        buscarRelatorio();
    }, [paginaAtual, linhasPorPagina]);

    const buscarRelatorio = async (page = 1, customLimit) => {
        setLoading(true);
        try {
            const { data, somaTotal, pagination } = await getVendasPorClientePeriodo({
                dataInicio: dataInicio || undefined,
                dataFim: dataFim || undefined,
                clienteNome: clienteNome || undefined,
                produtoNome: produtoDescricao || undefined,
                produtoId: produtoId || undefined,
                modoExibicao,
                page: paginaAtual,
                limit: linhasPorPagina,
            });

            setVendas(data);
            setTotalGeral(somaTotal);
            setTotalPages(pagination.totalPages);
        } catch (error) {
            console.error('Erro ao buscar relatório:', error);
        } finally {
            setLoading(false);
        }
    };
    const vendasFormatadas = vendas.map((v, index) => ({
        name: v.cliente || `Cliente ${v.cliente_id}`,
        value: parseFloat(v.total_vendido),
        cliente_id: v.cliente_id
    }));

    // Exemplo de agrupamento (JS)
    const topLimit = 10;

    const topVendas = [...vendasFormatadas]
        .sort((a, b) => b.value - a.value)
        .slice(0, topLimit);

    const outrosTotal = vendasFormatadas
        .slice(topLimit)
        .reduce((acc, curr) => acc + curr.value, 0);

    const dadosPieChart = [...topVendas];

    if (outrosTotal > 0) {
        dadosPieChart.push({ name: 'Outros', value: outrosTotal });
    }

    const handleSelecionarClienteDoGrafico = (nomeCliente) => {
        setClienteBusca(nomeCliente);
        setClienteNome(nomeCliente);
        setClienteSelected(true);
        setModoExibicao('analitico');
        setPaginaAtual(1);
        setClienteTrigger(true); // dispara trigger para fazer a busca depois
    };

    const handleClearFilters = () => {
        setDataInicio('');
        setDataFim('');
        setClienteBusca('');
        setClienteNome('');
        setClientesFiltrados([]);
        setClienteSelected(false);
        setClienteId(null);
        setProdutoBusca('');
        setProdutoDescricao('');
        setProdutosFiltrados([]);
        setProdutoSelected(false);
        setVendas([]);
        setProdutoId(null);
        setTotalGeral(0);
        setPaginaAtual(1);
    };

    const buscarClientes = debounce(async (termo) => {
        if (termo.length < 3) return setClientesFiltrados([]);
        try {
            const res = await getClientes({ nome: termo });
            setClientesFiltrados(res.data || []);
            if (!res.data.length) {
                setToast({ message: 'Nenhum cliente encontrado.', type: 'warning' });
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Erro ao buscar clientes.';
            setToast({ message: msg, type: 'error' });
        }
    }, 500);

    const buscarProdutos = debounce(async (termo) => {
        if (termo.length < 2) return setProdutosFiltrados([]);
        try {
            const res = await getProdutos({ nome: termo });
            setProdutosFiltrados(res.data || []);
            if (!res.data.length) {
                setToast({ message: 'Nenhum produto encontrado.', type: 'warning' });
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Erro ao buscar produtos.';
            setToast({ message: msg, type: 'error' });
        }
    }, 500);

    useEffect(() => {
        if (!clienteSelected) buscarClientes(clienteBusca);
        return () => buscarClientes.cancel();
    }, [clienteBusca]);

    useEffect(() => {
        if (!produtoSelected) buscarProdutos(produtoBusca);
        return () => buscarProdutos.cancel();
    }, [produtoBusca]);

    useEffect(() => {
        if (clienteTrigger && clienteBusca) {
            buscarRelatorio(1); // agora clienteBusca já está atualizado
            setClienteTrigger(false); // reseta a trigger
        }
    }, [clienteBusca, clienteTrigger]);


    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Relatório de Vendas por Período</h2>
            {/* GRÁFICO - EXIBIÇÃO NO TOPO QUANDO MODO SINTÉTICO */}
            {modoExibicao === 'sintetico' && vendas.length > 0 && (
                <div className="mb-6 space-y-6">
                    <h2 className="text-lg font-bold text-center text-gray-800">Resumo de Vendas por Cliente</h2>

                    {/* Container lado a lado em telas médias+ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Gráfico de Pizza */}

                        {/* Gráfico de Barras */}
                        <div className="bg-white border rounded p-4 shadow-sm">
                            <h3 className="text-md font-semibold mb-2 text-gray-700 text-center">Top Clientes em Valor</h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart
                                    data={topVendas}
                                    layout="vertical"
                                    margin={{ left: 100, right: 30 }}
                                    onClick={(data) => {
                                        if (data?.activeLabel) {
                                            const nomeCliente = data.activeLabel;
                                            handleSelecionarClienteDoGrafico(nomeCliente);
                                            setClienteId(data.activePayload[0].payload.cliente_id || null);
                                        }
                                    }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={150} />
                                    <Tooltip formatter={(value) => formatarMoedaBRL(value)} />
                                    <Bar dataKey="value" fill="#3b82f6">
                                        {topVendas.map((entry, index) => (
                                            <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            )}
            {/* FILTROS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                <div className="flex items-center">
                    <label className="text-sm font-medium mr-2">Exibição:</label>
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setModoExibicao('analitico')}
                            className={`px-3 py-1 text-sm rounded-md ${modoExibicao === 'analitico' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            Analítico
                        </button>
                        <button
                            onClick={() => setModoExibicao('sintetico')}
                            className={`px-3 py-1 text-sm rounded-md ${modoExibicao === 'sintetico' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            Sintético
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium">Data Início</label>
                    <input type="date" className="w-full border rounded px-2 py-1" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                </div>

                <div>
                    <label className="block text-sm font-medium">Data Fim</label>
                    <input type="date" className="w-full border rounded px-2 py-1" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                </div>

                <div className="flex items-end space-x-2">
                    <button onClick={() => buscarRelatorio(1)} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Buscar</button>
                    <button onClick={handleClearFilters} className="bg-gray-500 text-white px-4 py-2 rounded w-full">Limpar</button>
                </div>
            </div>

            {/* CAMPOS DE BUSCA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative">
                <div>
                    <label className="block text-sm font-medium">Cliente</label>
                    <input type="text" value={clienteBusca} onChange={e => setClienteBusca(e.target.value)} placeholder="Nome ou CPF/CNPJ"
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
                    {clientesFiltrados.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-200 max-h-48 overflow-y-auto shadow-lg mt-1 rounded">
                            {clientesFiltrados.map(cliente => (
                                <li key={cliente.id} onClick={() => {
                                    setClienteSelected(true);
                                    setClienteId(cliente.id);
                                    setClienteNome(cliente.nome);
                                    setClienteBusca(cliente.nome);
                                    setClientesFiltrados([]);
                                }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                    {cliente.nome} - {cliente.cpfCnpj}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium">Produto</label>
                    <input type="text" value={produtoBusca} onChange={e => setProdutoBusca(e.target.value)} placeholder="Descrição do produto"
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
                    {produtosFiltrados.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-200 max-h-48 overflow-y-auto shadow-lg mt-1 rounded">
                            {produtosFiltrados.map(produto => (
                                <li key={produto.id} onClick={() => {
                                    setProdutoSelected(true);
                                    setProdutoId(produto.id);
                                    setProdutoDescricao(produto.xProd);
                                    setProdutoBusca(produto.xProd);
                                    setProdutosFiltrados([]);
                                }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                    {produto.xProd}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <div id="separator-bar"></div>
            {/* TABELA */}
            {loading ? (
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    {modoExibicao === 'analitico' ? (
                        <table className="min-w-full bg-white border text-sm">
                            <thead className="bg-gray-100 text-left">
                                <tr>
                                    <th className="px-2 py-1 border">Cliente ID</th>
                                    <th className="px-2 py-1 border">Cliente</th>
                                    <th className="px-2 py-1 border text-right">Total Vendido</th>
                                    <th className="px-2 py-1 border text-center">Data Venda</th>
                                </tr>
                            </thead>
                            <tbody>

                                {vendas.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-2 text-gray-500">Nenhum resultado encontrado.</td>
                                    </tr>
                                ) : (
                                    <>
                                        {vendas.map((venda, index) => (
                                            <tr
                                                key={index}
                                                className={venda.possuiFinanceiro === true && venda.financeiroLiquidado === false ? 'bg-pink-100' : ''}
                                            >
                                                <td className="px-2 py-1 border">{venda.cliente_id}</td>
                                                <td className="px-2 py-1 border">{venda.cliente || 'Não Informado'}</td>
                                                <td className="px-2 py-1 border text-right">
                                                    {formatarMoedaBRL(
                                                        Number(
                                                            venda.possuiFinanceiro !== true
                                                                ? venda.totalPago
                                                                : venda.totalPrice ?? 0
                                                        )
                                                    )}
                                                </td>
                                                <td className="px-2 py-1 border text-center">
                                                    {formatarDataBR(venda.dataVenda)}
                                                </td>
                                            </tr>

                                        ))}
                                        <tr className="bg-gray-50 font-semibold">
                                            <td colSpan={2} className="px-2 py-1 border text-right">Total Geral:</td>
                                            <td className="px-2 py-1 border text-right">{formatarMoedaBRL(totalGeral)}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="min-w-full bg-white border text-sm">
                            <thead className="bg-gray-100 text-left">
                                <tr>
                                    <th className="px-2 py-1 border">Cliente</th>
                                    <th className="px-2 py-1 border text-right">Total Vendido</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendas && vendas.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="text-center py-2 text-gray-500">Nenhum resultado encontrado.</td>
                                    </tr>
                                ) : (
                                    <>
                                        {vendas.map((venda, index) => (
                                            <tr key={index}>
                                                <td className="px-2 py-1 border">{venda.cliente || 'Não Informado'}</td>
                                                <td className="px-2 py-1 border text-right">{formatarMoedaBRL(Number(venda.total_vendido))}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50 font-semibold">
                                            <td className="px-2 py-1 border text-right">Total Geral:</td>
                                            <td className="px-2 py-1 border text-right">{formatarMoedaBRL(totalGeral)}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            <div className="mt-4">
                <Pagination
                    currentPage={paginaAtual}
                    totalPages={totalPages}
                    onPageChange={setPaginaAtual}
                    onRowsChange={handleChangeRowsPerPage}  // Alterado para usar função personalizada
                    rowsPerPage={linhasPorPagina}
                    rowsPerPageOptions={[50, 100, 150]}
                />
            </div>
        </div>
    );
};

export default RelatorioVendasClientePage;
