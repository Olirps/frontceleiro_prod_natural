import React, { useEffect, useState } from "react";
import { getVendas, getVendaById } from "../services/ApiVendas/ApiVendas";
import { consultaItensVenda } from "../services/api";
import SaleModal from "../components/SaleModal";
import Toast from '../components/Toast';


export default function ComandasAbertasPage() {
    const [comandas, setComandas] = useState([]);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [estatisticas, setEstatisticas] = useState({
        total: 0,
        somaTotalPrice: 0,
        totalDescontos: 0,
    });
    const [filtros, setFiltros] = useState({ cliente: "", dataInicio: "", dataFim: "" });
    const [modalVendaId, setModalVendaId] = useState(null);
    const [vendaAberta, setVendaAberta] = useState(null);
    const [vendaSelecionada, setVendaSelecionada] = useState(null);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);


    useEffect(() => {
        carregarComandas();
    }, []);

    const carregarComandas = async (novosFiltros = null) => {
        setLoading(true);
        try {
            if (novosFiltros) setFiltros(prev => ({ ...prev, ...novosFiltros }));

            const params = { status_id: 1 };
            if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
            if (filtros.dataFim) params.dataFim = filtros.dataFim;
            if (filtros.cliente) params.cliente = filtros.cliente.toLowerCase();

            const res = await getVendas(params);
            setComandas(res?.data || []);
            if (res) {
                setEstatisticas({
                    total: res.total || 0,
                    somaTotalPrice: res.somaTotalPrice || 0,
                    totalDescontos: res.totalDescontos || 0,
                });
            }
        } catch (err) {
            console.error("Erro ao carregar comandas abertas", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    const handleDataFilter = () => carregarComandas();

    const formatarData = (dataString) => new Date(dataString).toLocaleDateString("pt-BR");
    const formatarHora = (dataString) =>
        new Date(dataString).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const formatarMoeda = (valor) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

    const comandasFiltradas = comandas.filter((c) => {
        const matchCliente = !filtros.cliente || (c.cliente?.nome || "")
            .toLowerCase()
            .includes(filtros.cliente.toLowerCase());
        const matchDataInicio = !filtros.dataInicio || new Date(c.dataVenda) >= new Date(filtros.dataInicio);
        const matchDataFim = !filtros.dataFim || new Date(c.dataVenda) <= new Date(filtros.dataFim + "T23:59:59");
        return matchCliente && matchDataInicio && matchDataFim;
    });

    const paginatedComandas = comandasFiltradas.slice((page - 1) * pageSize, page * pageSize);
    const totalPages = Math.ceil(comandasFiltradas.length / pageSize);

    const abrirConferencia = async (vendaId, venda) => {
        setModalVendaId(vendaId);
        setVendaAberta(venda);
        setVendaSelecionada(null);
        try {
            const vendaDetalhe = await getVendaById(vendaId);
            const itens = await consultaItensVenda(vendaId);

            const { id, ...rest } = vendaDetalhe;

            setVendaSelecionada({
                ...rest,
                venda_id: id, // renomeando o campo
                produtos: itens?.data || [],
            });

        } catch (err) {
            console.error("Erro ao carregar venda ou itens", err);
        }
    };

    const handlePaymentSubmit = async (dadosPagamento) => {
        setIsSaleModalOpen(false);
        setModalVendaId(null);
        setVendaSelecionada(null);
        carregarComandas(); // Atualiza lista após pagamento
    };

    const handleClose = () => {
        setIsSaleModalOpen(false);
        setModalVendaId(null);
        setVendaSelecionada(null);
        carregarComandas(); // Atualiza lista após fechamento do modal
        setToast({ message: "Venda liquidada com sucesso!", type: "success" });
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Cabeçalho */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
                <h1 className="text-2xl font-semibold text-gray-800">Vendas / OS em Aberto</h1>
                <div className="flex flex-wrap gap-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        {estatisticas.total} {estatisticas.total === 1 ? "comanda" : "comandas"}
                    </span>
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                        Total: {formatarMoeda(estatisticas.somaTotalPrice)}
                    </span>
                    {estatisticas.totalDescontos > 0 && (
                        <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                            Descontos: {formatarMoeda(estatisticas.totalDescontos)}
                        </span>
                    )}
                </div>
            </header>

            {/* Filtros */}
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <input
                        type="text"
                        name="cliente"
                        placeholder="Buscar por cliente..."
                        value={filtros.cliente}
                        onChange={handleFiltroChange}
                        className="border rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
                    <input
                        type="date"
                        name="dataInicio"
                        value={filtros.dataInicio}
                        onChange={handleFiltroChange}
                        className="border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data final</label>
                    <input
                        type="date"
                        name="dataFim"
                        value={filtros.dataFim}
                        onChange={handleFiltroChange}
                        className="border rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <button
                    onClick={handleDataFilter}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Filtrar por Data
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}

            {/* Lista de vendas */}
            {!loading && paginatedComandas.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma comanda encontrada</h3>
                    <p className="mt-1 text-gray-500">
                        {comandas.length === 0 ? "Não há comandas abertas no momento." : "Tente ajustar os filtros para ver mais resultados."}
                    </p>
                </div>
            ) : (
                <div className="p-6 bg-white rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Lista de Vendas</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border">
                            <thead className="bg-gray-100">
                                <tr>
                                    {["Nº Venda", "Cliente", "CPF/CNPJ", "Data", "Total", "Pago", "Ações"].map((title) => (
                                        <th
                                            key={title}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                                        >
                                            {title}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedComandas.map((venda) => (
                                    <tr key={venda.venda_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">{venda.venda_id}</td>
                                        <td className="px-6 py-4">{venda.cliente}</td>
                                        <td className="px-6 py-4">{venda.cliente?.cpfCnpj}</td>
                                        <td className="px-6 py-4">{formatarData(venda.dataVenda)} {formatarHora(venda.dataVenda)}</td>
                                        <td className="px-6 py-4">{formatarMoeda(venda.totalPrice)}</td>
                                        <td className="px-6 py-4">{formatarMoeda(venda.pagamentos)}</td>
                                        <td className="px-6 py-4 flex gap-2">
                                            <button
                                                onClick={() => abrirConferencia(venda.venda_id, venda)}
                                                className="text-gray-700 hover:text-black"
                                            >
                                                👁️
                                            </button>
                                            <button
                                                onClick={() => console.log("Cancelar", venda.venda_id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                🚫
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="px-3 py-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50"
                            >
                                ←
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i + 1)}
                                    className={`px-3 py-1 rounded-full ${page === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className="px-3 py-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50"
                            >
                                →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de conferência */}
            {modalVendaId && vendaSelecionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
                        <button
                            onClick={() => setModalVendaId(null)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                        >
                            &times;
                        </button>

                        <h2 className="text-xl font-bold mb-2">Venda #{vendaSelecionada.venda_id}</h2>
                        <p><strong>Cliente:</strong> {vendaAberta.cliente || "Não informado"}</p>
                        <p><strong>Atendente:</strong> {vendaSelecionada.nomeFuncionario || "Não informado"}</p>
                        <p><strong>Total:</strong> {formatarMoeda(vendaAberta.totalPrice)}</p>

                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm mt-4">
                            <h3 className="font-semibold mb-2">Produtos</h3>
                            <ul className="divide-y divide-gray-200">
                                {vendaSelecionada.produtos.map((p) => (
                                    <li key={p.id} className="py-2 flex justify-between">
                                        <span>{p.xProd} ({p.quantity} {p.uCom})</span>
                                        <span>{formatarMoeda(p.vlrVenda)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-4">
                            <button
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                onClick={() => setIsSaleModalOpen(true)}
                            >
                                Liquidar Venda
                            </button>
                        </div>

                        {isSaleModalOpen && (
                            <SaleModal
                                isOpen={isSaleModalOpen}
                                saleData={vendaSelecionada}
                                onSubmit={handlePaymentSubmit}
                                onSuccess={() => {
                                    handleClose();
                                }}
                                onClose={() => setIsSaleModalOpen(false)}
                                tipo="liquidacao"
                            />
                        )}
                    </div>
                </div>
            )}
            {toast.message && <Toast type={toast.type} message={toast.message} />}
        </div>

    );
}