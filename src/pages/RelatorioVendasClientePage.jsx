import { useState, useEffect } from 'react';
import {
    getVendasPorClientePeriodo,
    getClientes,
    getProdutos
} from '../services/api';
import Pagination from '../utils/Pagination';
import { debounce } from 'lodash';

const RelatorioVendasClientePage = () => {
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [clienteNome, setClienteNome] = useState('');
    const [clienteBusca, setClienteBusca] = useState('');
    const [clientesFiltrados, setClientesFiltrados] = useState([]);
    const [produtoDescricao, setProdutoDescricao] = useState('');
    const [produtoBusca, setProdutoBusca] = useState('');
    const [produtosFiltrados, setProdutosFiltrados] = useState([]);
    const [produtoSelected, setProdutoSelected] = useState(false);
    const [clienteSelected, setClienteSelected] = useState(false);
    const [clienteId, setClienteId] = useState(null);
    const [vendas, setVendas] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [pesquisar, setPesquisar] = useState(true);
    const [totalGeral, setTotalGeral] = useState(0);


    const buscarRelatorio = async (page = 1, customLimit) => {
        setLoading(true);
        setPesquisar(true);
        try {
            const { data, somaTotal, pagination } = await getVendasPorClientePeriodo({
                dataInicio: dataInicio || undefined,
                dataFim: dataFim || undefined,
                clienteNome: clienteNome || undefined,
                produtoNome: produtoDescricao || undefined,
                page,
                limit: customLimit ?? rowsPerPage, // usa o novo valor se fornecido
            });

            setVendas(data);
            setTotalGeral(somaTotal)
            setTotalPages(pagination.totalPages);
            setCurrentPage(pagination.currentPage);
        } catch (error) {
            console.error('Erro ao buscar relatório:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearFilters = () => {
        setDataInicio('');
        setDataFim('');
        setClienteBusca('');
        setClienteNome('');
        setClientesFiltrados([]);
        setClienteSelected(false);
        setClienteId(null);
        setVendas([]);
        setCurrentPage(1);
    }

    const buscarClientes = debounce(async (termo) => {
        if (termo.length < 3) {
            setClientesFiltrados([]);
            return;
        }
        try {
            const res = await getClientes({ nome: termo });
            if (res.data.length === 0) {
                setToast({ message: 'Nenhum cliente encontrado.', type: 'warning' });
                setClientesFiltrados([]);
            } else {
                setClientesFiltrados(res.data);
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Erro ao buscar clientes.';

            setToast({ message: errorMessage, type: 'error' });
            setClientesFiltrados([]);
        }
    }, 500);

    const buscarProdutos = debounce(async (termo) => {
        if (termo.length < 2) {
            setProdutosFiltrados([]);
            return;
        }
        try {
            const res = await getProdutos({ nome: termo });
            if (res.data.length === 0) {
                setToast({ message: 'Nenhum produto encontrado.', type: 'warning' });
                setProdutosFiltrados([]);
            } else {
                setProdutosFiltrados(res.data);
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Erro ao buscar produtos.';

            setToast({ message: errorMessage, type: 'error' });
            setProdutosFiltrados([]);
        }
    }, 500);


    useEffect(() => {
        if (!clienteSelected) {
            buscarClientes(clienteBusca);
            return () => buscarClientes.cancel();
        }
        setClienteSelected(false);
    }, [clienteBusca]);

    useEffect(() => {
        if (!produtoSelected) {
            buscarProdutos(produtoBusca);
            return () => buscarProdutos.cancel();
        }
        setProdutoSelected(false);
    }, [produtoBusca]);



    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Relatório de Vendas por Período</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium">Data Início</label>
                    <input
                        type="date"
                        className="w-full border rounded px-2 py-1"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Data Fim</label>
                    <input
                        type="date"
                        className="w-full border rounded px-2 py-1"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Cliente</label>
                    <input
                        type="text"
                        value={clienteBusca}
                        onChange={e => setClienteBusca(e.target.value)}
                        placeholder="Nome ou CPF/CNPJ"
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                    />
                    {clientesFiltrados.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-200 max-h-48 overflow-y-auto shadow-lg mt-1 rounded">
                            {clientesFiltrados.map(cliente => (
                                <li
                                    key={cliente.id}
                                    onClick={() => {
                                        setClienteSelected(true);
                                        setClienteId(cliente.id);
                                        setClienteNome(cliente.nome);
                                        setClienteBusca(cliente.nome);
                                        setClientesFiltrados([]);
                                    }}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                >
                                    {cliente.nome} - {cliente.cpfCnpj}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium">Produto</label>
                    <input
                        type="text"
                        value={produtoBusca}
                        onChange={(e) => setProdutoBusca(e.target.value)}
                        placeholder="Descrição do produto"
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                    />
                    {produtosFiltrados.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-200 max-h-48 overflow-y-auto shadow-lg mt-1 rounded">
                            {produtosFiltrados.map(produto => (
                                <li
                                    key={produto.id}
                                    onClick={() => {
                                        setProdutoSelected(true);
                                        setProdutoDescricao(produto.xProd);
                                        setProdutoBusca(produto.xProd);
                                        setProdutosFiltrados([]);
                                    }}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                >
                                    {produto.xProd}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="flex items-end space-x-2">
                    <button
                        onClick={() => buscarRelatorio(1)}
                        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                    >
                        Buscar
                    </button>
                    <button
                        onClick={() => handleClearFilters()}
                        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                    >
                        Limpar
                    </button>
                </div>
            </div>

            {loading ? (
                <p>Carregando...</p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border text-sm">
                            <thead>
                                <tr className="bg-gray-100 text-left">
                                    <th className="px-2 py-1 border">Data</th>
                                    <th className="px-2 py-1 border">Cliente</th>
                                    <th className="px-2 py-1 border">Produto</th>
                                    <th className="px-2 py-1 border">Qtd</th>
                                    <th className="px-2 py-1 border">V. Unit.</th>
                                    <th className="px-2 py-1 border">V. Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendas.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-2 text-gray-500">
                                            Nenhum resultado encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {vendas.map((venda, index) => (
                                            <tr key={index}>
                                                <td className="px-2 py-1 border">
                                                    {new Intl.DateTimeFormat('pt-BR').format(new Date(venda.dataVenda))}
                                                </td>
                                                <td className="px-2 py-1 border">{venda.cliente_nome}</td>
                                                <td className="px-2 py-1 border">{venda.produto_descricao}</td>
                                                <td className="px-2 py-1 border">{venda.quantity}</td>
                                                <td className="px-2 py-1 border">
                                                    R$ {Number(venda.valor_unitario).toFixed(2)}
                                                </td>
                                                <td className="px-2 py-1 border">
                                                    R$ {Number(venda.valor_total_item).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50 font-semibold">
                                            <td colSpan={5} className="px-2 py-1 border text-right">Total Geral:</td>
                                            <td><strong>
                                                {new Intl.NumberFormat('pt-BR', {
                                                    style: 'currency',
                                                    currency: 'BRL',
                                                }).format(totalGeral)}
                                            </strong></td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => buscarRelatorio(page)}
                            rowsPerPage={rowsPerPage}
                            onRowsChange={(newLimit) => {
                                setRowsPerPage(newLimit);
                                buscarRelatorio(1, newLimit); // passa o novo valor explicitamente
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default RelatorioVendasClientePage;
