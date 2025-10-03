import { useState, useEffect } from 'react';
import { getFuncionarios } from '../services/api';
import { getVendasPorFuncionarioPeriodo } from '../services/ApiRelatorios/ApiVendasPorFunc';
import Pagination from '../utils/Pagination';
import { formatarMoedaBRL, formatarDataBR } from '../utils/functions';
import { debounce } from 'lodash';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie } from 'recharts';

const RelatorioVendasFuncionariosPage = () => {
    const getDataHoje = () => {
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        return hoje.toISOString().slice(0, 10);
    };

    const [funcionarioTrigger, setFuncionarioTrigger] = useState(false);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [linhasPorPagina, setLinhasPorPagina] = useState(50);
    const [dataInicio, setDataInicio] = useState(getDataHoje());
    const [dataFim, setDataFim] = useState(getDataHoje());
    const [funcionarioBusca, setFuncionarioBusca] = useState('');
    const [funcionariosFiltrados, setFuncionariosFiltrados] = useState([]);
    const [funcionarioSelected, setFuncionarioSelected] = useState(false);
    const [funcionarioNome, setFuncionarioNome] = useState('');
    const [funcionarioId, setFuncionarioId] = useState(null);
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
        setFuncionarioBusca('');
        setFuncionarioNome('');
        setFuncionariosFiltrados([]);
        setFuncionarioSelected(false);
    }, [modoExibicao]);

    const handleChangeRowsPerPage = (newRowsPerPage) => {
        setLinhasPorPagina(newRowsPerPage);
        setPaginaAtual(1);
    };

    useEffect(() => {
        buscarRelatorio();
    }, [paginaAtual, linhasPorPagina]);

    const buscarRelatorio = async (page = 1, customLimit) => {
        setLoading(true);
        try {
            const { data, somaTotal, pagination } = await getVendasPorFuncionarioPeriodo({
                dataInicio: dataInicio || undefined,
                dataFim: dataFim || undefined,
                funcionarioId: funcionarioId || undefined,
                funcionarioNome: funcionarioNome || undefined,
                modoExibicao,
                page: paginaAtual,
                limit: linhasPorPagina,
            });

            setVendas(data);
            setTotalGeral(somaTotal);
            setTotalPages(pagination.totalPages);
        } catch (error) {
            console.error('Erro ao buscar relatório:', error);
            setToast({ message: 'Erro ao buscar relatório de vendas', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const vendasFormatadas = vendas.map((v, index) => ({
        name: v.cliente?.nome || v.funcionario?.nome || `Funcionário ${v.funcionario_id || 'Sem ID'}`,
        value: parseFloat(v.total_vendido || 0),
    }));

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

    const handleSelecionarFuncionarioDoGrafico = (nomeFuncionario) => {
        setFuncionarioBusca(nomeFuncionario);
        setFuncionarioNome(nomeFuncionario);
        setFuncionarioSelected(true);
        setModoExibicao('analitico');
        setPaginaAtual(1);
        setFuncionarioTrigger(true);
    };

    const handleClearFilters = () => {
        setDataInicio('');
        setDataFim('');
        setFuncionarioBusca('');
        setFuncionarioNome('');
        setFuncionariosFiltrados([]);
        setFuncionarioSelected(false);
        setFuncionarioId(null);
        setVendas([]);
        setTotalGeral(0);
    };

    const buscarFuncionarios = debounce(async (termo) => {
        if (termo.length < 3) return setFuncionariosFiltrados([]);
        try {
            const res = await getFuncionarios({ nome: termo });
            setFuncionariosFiltrados(res.data || []);
            if (!res.data.length) {
                setToast({ message: 'Nenhum funcionário encontrado.', type: 'warning' });
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Erro ao buscar funcionários.';
            setToast({ message: msg, type: 'error' });
        }
    }, 500);

    useEffect(() => {
        if (!funcionarioSelected) buscarFuncionarios(funcionarioBusca);
        return () => buscarFuncionarios.cancel();
    }, [funcionarioBusca]);

    useEffect(() => {
        if (funcionarioTrigger && funcionarioBusca) {
            buscarRelatorio(1);
            setFuncionarioTrigger(false);
        }
    }, [funcionarioBusca, funcionarioTrigger]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Relatório de Vendas por Funcionário</h2>

            {/* GRÁFICO - EXIBIÇÃO NO TOPO QUANDO MODO SINTÉTICO */}
            {modoExibicao === 'sintetico' && vendas.length > 0 && (
                <div className="mb-6 space-y-6">
                    <h2 className="text-lg font-bold text-center text-gray-800">Resumo de Vendas por Funcionário</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Gráfico de Pizza */}
                        <div className="bg-white border rounded p-4 shadow-sm">
                            <h3 className="text-md font-semibold mb-2 text-gray-700 text-center">Distribuição por Funcionário</h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={dadosPieChart}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {dadosPieChart.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatarMoedaBRL(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Gráfico de Barras */}
                        <div className="bg-white border rounded p-4 shadow-sm">
                            <h3 className="text-md font-semibold mb-2 text-gray-700 text-center">Top Funcionários em Vendas</h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart
                                    data={topVendas}
                                    layout="vertical"
                                    margin={{ left: 100, right: 30 }}
                                    onClick={(data) => {
                                        if (data?.activeLabel) {
                                            const nomeFuncionario = data.activeLabel;
                                            handleSelecionarFuncionarioDoGrafico(nomeFuncionario);
                                        }
                                    }}
                                >
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
                    <input
                        type="date"
                        className="w-full border rounded px-2 py-1"
                        value={dataInicio}
                        onChange={e => setDataInicio(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Data Fim</label>
                    <input
                        type="date"
                        className="w-full border rounded px-2 py-1"
                        value={dataFim}
                        onChange={e => setDataFim(e.target.value)}
                    />
                </div>

                <div className="flex items-end space-x-2">
                    <button
                        onClick={() => buscarRelatorio(1)}
                        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                    >
                        Buscar
                    </button>
                    <button
                        onClick={handleClearFilters}
                        className="bg-gray-500 text-white px-4 py-2 rounded w-full"
                    >
                        Limpar
                    </button>
                </div>
            </div>

            {/* CAMPO DE BUSCA FUNCIONÁRIO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative">
                <div>
                    <label className="block text-sm font-medium">Funcionário</label>
                    <input
                        type="text"
                        value={funcionarioBusca}
                        onChange={e => setFuncionarioBusca(e.target.value)}
                        placeholder="Nome do funcionário"
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                    />
                    {funcionariosFiltrados.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-200 max-h-48 overflow-y-auto shadow-lg mt-1 rounded">
                            {funcionariosFiltrados.map(funcionario => (
                                <li
                                    key={funcionario.id}
                                    onClick={() => {
                                        setFuncionarioSelected(true);
                                        setFuncionarioId(funcionario.id);
                                        setFuncionarioNome(funcionario.cliente?.nome || funcionario.nome);
                                        setFuncionarioBusca(funcionario.cliente?.nome || funcionario.nome);
                                        setFuncionariosFiltrados([]);
                                    }}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                >
                                    {funcionario.cliente?.nome || funcionario.nome} - {funcionario.cargo}
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
                                    <th className="px-2 py-1 border">ID Funcionário</th>
                                    <th className="px-2 py-1 border">Funcionário</th>
                                    <th className="px-2 py-1 border">Cargo</th>
                                    <th className="px-2 py-1 border text-right">Total Vendido</th>
                                    <th className="px-2 py-1 border text-center">Qtd. Vendas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendas.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-2 text-gray-500">
                                            Nenhum resultado encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {vendas.map((venda, index) => (
                                            <tr key={index}>
                                                <td className="px-2 py-1 border">{venda.funcionario_id || 'N/A'}</td>
                                                <td className="px-2 py-1 border">
                                                    {venda.cliente?.nome || venda.funcionario?.nome || 'Não Informado'}
                                                </td>
                                                <td className="px-2 py-1 border">{venda.funcionario?.cargo || '-'}</td>
                                                <td className="px-2 py-1 border text-right">
                                                    {formatarMoedaBRL(Number(venda.total_vendido || 0))}
                                                </td>
                                                <td className="px-2 py-1 border text-center">
                                                    {venda.quantidade_vendas} venda(s)
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50 font-semibold">
                                            <td colSpan={3} className="px-2 py-1 border text-right">Total Geral:</td>
                                            <td className="px-2 py-1 border text-right">
                                                {formatarMoedaBRL(totalGeral)}
                                            </td>
                                            <td className="px-2 py-1 border"></td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="min-w-full bg-white border text-sm">
                            <thead className="bg-gray-100 text-left">
                                <tr>
                                    <th className="px-2 py-1 border">Funcionário</th>
                                    <th className="px-2 py-1 border">Cargo</th>
                                    <th className="px-2 py-1 border text-right">Total Vendido</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendas && vendas.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-2 text-gray-500">
                                            Nenhum resultado encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {vendas.map((venda, index) => (
                                            <tr key={index}>
                                                <td className="px-2 py-1 border">
                                                    {venda.cliente?.nome || venda.funcionario?.nome || 'Não Informado'}
                                                </td>
                                                <td className="px-2 py-1 border">{venda.funcionario?.cargo || '-'}</td>
                                                <td className="px-2 py-1 border text-right">
                                                    {formatarMoedaBRL(Number(venda.total_vendido || 0))}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50 font-semibold">
                                            <td colSpan={2} className="px-2 py-1 border text-right">Total Geral:</td>
                                            <td className="px-2 py-1 border text-right">
                                                {formatarMoedaBRL(totalGeral)}
                                            </td>
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
                    onRowsChange={handleChangeRowsPerPage}
                    rowsPerPage={linhasPorPagina}
                    rowsPerPageOptions={[50, 100, 150]}
                />
            </div>

            {toast.message && (
                <div className={`fixed top-4 right-4 p-4 rounded-md text-white ${toast.type === 'success' ? 'bg-green-500' :
                    toast.type === 'error' ? 'bg-red-500' :
                        'bg-yellow-500'
                    }`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default RelatorioVendasFuncionariosPage;