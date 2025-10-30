import { useEffect, useState } from 'react';
import Pagination from '../utils/Pagination';
import { getProdutosVendidosNaPromocao, getPromocoes } from '../services/ApiPromocao/ApiPromocao';
import { useProduto } from '../hooks/useProduto'; // Adicione o import

export default function RelatorioItensVendidosPromocaoPage() {
    const [filtros, setFiltros] = useState({
        promocao_id: '',
        produto_id: '',
        data_de: '',
        data_ate: '',
        termo: '',
        sintetico: false,
        porProduto: false,
        page: 1,
        limit: 20,
    });
    const [loading, setLoading] = useState(false);
    const [itens, setItens] = useState([]);
    const [error, setError] = useState('');
    const [totalPaginas, setTotalPaginas] = useState(1);

    // Estados para busca de produto
    const [produtoBusca, setProdutoBusca] = useState('');
    const [produtosSugestao, setProdutosSugestao] = useState([]);
    const { searchProdutos, loading: loadingProduto } = useProduto();

    // Estados para busca de promoção
    const [promocaoBusca, setPromocaoBusca] = useState('');
    const [promocoesSugestao, setPromocoesSugestao] = useState([]);
    const [loadingPromocao, setLoadingPromocao] = useState(false);


    // Busca produtos ao digitar
    const handleProdutoBusca = async (e) => {
        const termo = e.target.value;
        setProdutoBusca(termo);
        if (termo.length >= 2) {
            try {
                const produtos = await searchProdutos(termo.trim());
                setProdutosSugestao(produtos);
            } catch (err) {
                setProdutosSugestao([]);
            }
        } else {
            setProdutosSugestao([]);
        }
    };

    // Busca promoções ao digitar
    const handlePromocaoBusca = async (e) => {
        const termo = e.target.value;
        setPromocaoBusca(termo);
        if (termo.length >= 2) {
            setLoadingPromocao(true);

            try {
                const promocoes = await getPromocoes({ termo: termo.trim() });
                setPromocoesSugestao(promocoes.promocoes || []);
            } catch (err) {
                setPromocoesSugestao([]);
            } finally {
                setLoadingPromocao(false);
            }
        } else {
            setPromocoesSugestao([]);
        }
    };

    // Seleciona produto para filtro
    const handleSelecionaProduto = (produto) => {
        setFiltros(f => ({ ...f, produto_id: produto.id }));
        setProdutoBusca(produto.xProd);
        setProdutosSugestao([]);
    };

    // Seleciona promoção para filtro
    const handleSelecionaPromocao = (promocao) => {
        setFiltros(f => ({ ...f, promocao_id: promocao.id }));
        setPromocaoBusca(promocao.descricao);
        setPromocoesSugestao([]);
    };

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        // Se for o input de promoção, atualiza o estado promocaoBusca
        if (name === 'promocaoBusca') {
            setPromocaoBusca(value);
        } else {
            setFiltros(f => ({
                ...f,
                [name]: type === 'checkbox' ? checked : value,
            }));
            if (itens.length > 0) {
                setItens([]);
            }
        }
    };

    const buscarItens = async (page = filtros.page, limit = filtros.limit) => {
        setLoading(true);
        setError('');
        try {
            const data = await getProdutosVendidosNaPromocao({ ...filtros, page, limit });
            setItens(data?.items || []);
            setTotalPaginas(data?.totalPages || 1);
        } catch (err) {
            setError('Erro ao buscar itens vendidos.');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        setFiltros(f => ({ ...f, page }));
        buscarItens(page, filtros.limit);
    };

    const handleRowsChange = (limit) => {
        setFiltros(f => ({ ...f, limit, page: 1 }));
        buscarItens(1, limit);
    };

    const limparFiltros = () => {
        setFiltros({
            promocao_id: '',
            produto_id: '',
            data_de: '',
            data_ate: '',
            sintetico: false,
        });
        setPromocaoBusca('');
        setProdutoBusca('');
        setItens([]);
    };

    return (
        <div className="p-1 space-y-1">
            <h1 className="text-2xl font-bold mb-4">Relatório de Itens Vendidos na Promoção</h1>
            {/* Filtros principais */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-4 relative">
                {/* Linha 1: Promoção e Produto */}
                <div className="flex flex-wrap gap-4">
                    {/* Promoção */}
                    <div className="flex-1 min-w-[220px] relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Promoção</label>
                        <input
                            name="promocaoBusca"
                            value={promocaoBusca}
                            onChange={handlePromocaoBusca}
                            className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Buscar promoção"
                            autoComplete="off"
                        />
                        {loadingPromocao && <div className="text-xs text-gray-400 mt-1">Buscando...</div>}

                        {promocoesSugestao.length > 0 && (
                            <ul className="absolute bg-white border border-gray-200 rounded shadow-md max-h-48 overflow-y-auto z-20 w-full mt-1">
                                {promocoesSugestao.map(promocao => (
                                    <li
                                        key={promocao.id}
                                        onClick={() => handleSelecionaPromocao(promocao)}
                                        className="p-2 hover:bg-blue-50 cursor-pointer transition"
                                    >
                                        {'ID: ' + promocao.id + ' - ' + promocao.descricao}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Produto */}
                    <div className="flex-1 min-w-[220px] relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
                        <input
                            name="produtoBusca"
                            value={produtoBusca}
                            onChange={handleProdutoBusca}
                            className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Buscar produto"
                            autoComplete="off"
                        />
                        {loadingProduto && <div className="text-xs text-gray-400 mt-1">Buscando...</div>}

                        {produtosSugestao.length > 0 && (
                            <ul className="absolute bg-white border border-gray-200 rounded shadow-md max-h-48 overflow-y-auto z-20 w-full mt-1">
                                {produtosSugestao.map(prod => (
                                    <li
                                        key={prod.id}
                                        onClick={() => handleSelecionaProduto(prod)}
                                        className="p-2 hover:bg-blue-50 cursor-pointer transition"
                                    >
                                        {'ID: ' + prod.id + ' - ' + prod.xProd}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Botão buscar (na mesma linha) */}
                    <div className="flex items-end">
                        <button
                            onClick={() => buscarItens()}
                            className="h-[42px] px-6 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                {/* Linha 2: Filtros secundários */}
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data De</label>
                        <input
                            type="date"
                            name="data_de"
                            value={filtros.data_de}
                            onChange={handleChange}
                            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Até</label>
                        <input
                            type="date"
                            name="data_ate"
                            value={filtros.data_ate}
                            onChange={handleChange}
                            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Sintético</label>
                        <input
                            type="checkbox"
                            name="sintetico"
                            checked={filtros.sintetico}
                            onChange={handleChange}
                            className="w-4 h-4 accent-blue-600"
                        />
                    </div>
                    {filtros.sintetico && (<div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Por Produto</label>
                        <input
                            type="checkbox"
                            name="porProduto"
                            checked={filtros.porProduto}
                            onChange={handleChange}
                            className="w-4 h-4 accent-blue-600"
                        />
                    </div>)}
                </div>
                <div className="flex items-end">

                    <button
                        onClick={limparFiltros}
                        className="h-[42px] px-6 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>
            {loading ? (<div className="flex justify-center items-center h-32">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>) : (
                <>
                    {filtros.sintetico ? (
                        <>
                            <table className="w-full text-left border border-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 border">{!filtros.porProduto ? 'Promoção ID' : 'Produto ID'}</th>
                                        <th className="p-2 border">{!filtros.porProduto ? 'Promoção Nome' : 'Produto Nome'}</th>
                                        {filtros.porProduto && (<>
                                            <th className="p-2 border">Quantidade</th>
                                            <th className="p-2 border">Valor Unitário</th>
                                        </>

                                        )}
                                        <th className="p-2 border">Valor Total Vendido</th>
                                    </tr >
                                </thead >
                                <tbody>
                                    {itens.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-gray-400">Nenhum item encontrado</td>
                                        </tr>
                                    )}
                                    {itens.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-2 border">{!filtros.porProduto ? item.promocao_id : item.produto_id}</td>
                                            <td className="p-2 border">{!filtros.porProduto ? item.promocao_descricao : item.produto_descricao}</td>
                                            {filtros.porProduto && (
                                                <>
                                                    <td className="p-2 border">{item.quantidade_vendida || 0}</td>
                                                    <td className="p-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_unitario || 0)}</td>
                                                </>

                                            )}
                                            <td className="p-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_vendido || 0)}</td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table >
                        </>)
                        :
                        (<>
                            <table className="w-full text-left border border-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 border">Promoção</th>
                                        <th className="p-2 border">Produto</th>
                                        <th className="p-2 border">Quantidade</th>
                                        <th className="p-2 border">Valor Unitário</th>
                                        <th className="p-2 border">Valor Total</th>
                                        <th className="p-2 border">Data Venda</th>
                                    </tr >
                                </thead >
                                <tbody>
                                    {itens.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-gray-400">Nenhum item encontrado</td>
                                        </tr>
                                    )}
                                    {itens.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-2 border">{item.promocao_nome || item.promocao_id}</td>
                                            <td className="p-2 border">{item.produto_nome || item.produto_id}</td>
                                            <td className="p-2 border">{item.quantidade}</td>
                                            <td className="p-2 border">R$ {item.valor_unitario?.toFixed(2)}</td>
                                            <td className="p-2 border">R$ {item.valor_total?.toFixed(2)}</td>
                                            <td className="p-2 border">{item.data_venda}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table >
                        </>)
                    }
                </>
            )}


            <Pagination
                currentPage={filtros.page}
                totalPages={totalPaginas}
                onPageChange={handlePageChange}
                onRowsChange={handleRowsChange}
                rowsPerPage={filtros.limit}
                rowsPerPageOptions={[10, 20, 50, 100]}
            />
        </div >
    );
}