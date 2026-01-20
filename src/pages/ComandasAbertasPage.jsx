import React, { useEffect, useState } from "react";
import { getVendas, getVendaById, registravenda } from "../services/ApiVendas/ApiVendas";
import { consultaItensVenda, getParcelaByID, pagamentoParcela } from "../services/api";

import SaleModal from "../components/SaleModal";
import PaymentModal from '../components/PaymentModal';
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
    const [selectedParcela, setSelectedParcela] = useState(null);

    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentTotal, setPaymentTotal] = useState(0);

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

    const handleLiquidar = (venda) => {
        setIsPaymentModalOpen(true);
        setPaymentTotal(venda.totalPrice);
        setVendaSelecionada(venda);
    };

    const handlePaymentSubmit = async (dadosPagamento) => {
        setIsPaymentModalOpen(false);
        setModalVendaId(null);
        setVendaSelecionada(null);
        carregarComandas(); // Atualiza lista após pagamento
    };


    const handleConfirmPayment = async (resultado) => {
        try {
            const payload = {
                cliente_id: vendaSelecionada.cliente_id || null,
                preVenda: vendaSelecionada.venda_id || null,
                desconto: resultado.desconto.valor || 0,
                pagamentos: resultado.pagamentos,
                data_pagamento_efetivo: resultado.data_pagamento_efetivo,
                recebimentoHoje: resultado.recebimentoHoje
            };

            await registravenda(payload); // novo endpoint

            setToast({
                message: 'Pagamento registrado com sucesso!',
                type: 'success'
            });

            setIsPaymentModalOpen(false);
        } catch (error) {
            console.error(error);
            setToast({
                message: 'Erro ao realizar pagamento',
                type: 'error'
            });
        }
    };


    const handleClose = () => {
        setIsPaymentModalOpen(false);
        setModalVendaId(null);
        setVendaSelecionada(null);
        carregarComandas(); // Atualiza lista após fechamento do modal
        setToast({ message: "Venda liquidada com sucesso!", type: "success" });
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Cabeçalho com estatísticas */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Vendas em Aberto</h1>
                        <p className="text-gray-600 mt-1">Gerencie e processe pagamentos pendentes</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200">
                            <p className="text-sm text-gray-500">Comandas</p>
                            <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
                        </div>

                        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200">
                            <p className="text-sm text-gray-500">Valor Total</p>
                            <p className="text-2xl font-bold text-green-600">{formatarMoeda(estatisticas.somaTotalPrice)}</p>
                        </div>

                        {estatisticas.totalDescontos > 0 && (
                            <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200">
                                <p className="text-sm text-gray-500">Descontos</p>
                                <p className="text-2xl font-bold text-red-600">{formatarMoeda(estatisticas.totalDescontos)}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Buscar Cliente</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="cliente"
                                placeholder="Nome, CPF ou CNPJ..."
                                value={filtros.cliente}
                                onChange={handleFiltroChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                            <div className="absolute right-3 top-3 text-gray-400">🔍</div>
                        </div>
                    </div>

                    <div className="md:col-span-5">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Período</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <input
                                    type="date"
                                    name="dataInicio"
                                    value={filtros.dataInicio}
                                    onChange={handleFiltroChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-center justify-center text-gray-500">até</div>
                            <div className="flex-1">
                                <input
                                    type="date"
                                    name="dataFim"
                                    value={filtros.dataFim}
                                    onChange={handleFiltroChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <button
                            onClick={handleDataFilter}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">Carregando vendas...</p>
                </div>
            ) : (
                <>
                    {/* Lista de Vendas */}
                    {paginatedComandas.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl text-gray-400">📋</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {comandas.length === 0 ? "Nenhuma venda em aberto" : "Nenhuma venda encontrada"}
                            </h3>
                            <p className="text-gray-600 max-w-md mx-auto">
                                {comandas.length === 0
                                    ? "Todas as vendas foram processadas. Novas vendas aparecerão aqui."
                                    : "Tente ajustar os filtros para encontrar o que procura."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 mb-8">
                            {paginatedComandas.map((venda) => (
                                <div
                                    key={venda.venda_id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                                >
                                    <div className="p-5">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            {/* Informações principais */}
                                            <div className="flex-1">
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-blue-50 text-blue-600 rounded-lg p-3">
                                                        <span className="text-lg font-bold">#{venda.venda_id}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 text-lg">
                                                            {venda.cliente || "Cliente não informado"}
                                                        </h4>
                                                        <div className="flex flex-wrap gap-4 mt-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-500">📅</span>
                                                                <span className="text-sm text-gray-600">
                                                                    {formatarData(venda.dataVenda)} • {formatarHora(venda.dataVenda)}
                                                                </span>
                                                            </div>
                                                            {venda.cliente?.cpfCnpj && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-500">📄</span>
                                                                    <span className="text-sm text-gray-600">{venda.cliente.cpfCnpj}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-500">👤</span>
                                                                <span className="text-sm text-gray-600">{venda.nomeFuncionario || "Não informado"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Valores e ações */}
                                            <div className="lg:text-right">
                                                <div className="mb-3">
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {formatarMoeda(venda.totalPrice)}
                                                    </p>
                                                    {venda.pagamentos > 0 && (
                                                        <p className="text-sm text-green-600 mt-1">
                                                            Pago: {formatarMoeda(venda.pagamentos)}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => abrirConferencia(venda.venda_id, venda)}
                                                        className="flex-1 lg:flex-none bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <span>👁️</span>
                                                        <span className="hidden sm:inline">Conferir</span>
                                                    </button>

                                                    <button
                                                        onClick={() => console.log("Cancelar", venda.venda_id)}
                                                        className="flex-1 lg:flex-none bg-red-50 text-red-700 hover:bg-red-100 font-medium px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <span>🚫</span>
                                                        <span className="hidden sm:inline">Cancelar</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status indicator */}
                                    <div className={`px-5 py-2 text-sm font-medium ${venda.pagamentos > 0
                                            ? 'bg-yellow-50 text-yellow-700 border-t border-yellow-100'
                                            : 'bg-blue-50 text-blue-700 border-t border-blue-100'
                                        }`}>
                                        {venda.pagamentos > 0
                                            ? `⏳ Pagamento parcial (restante: ${formatarMoeda(venda.totalPrice - venda.pagamentos)})`
                                            : '⏱️ Aguardando pagamento total'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-gray-600 text-sm">
                                    Mostrando <span className="font-semibold">{paginatedComandas.length}</span> de{' '}
                                    <span className="font-semibold">{comandas.length}</span> vendas
                                </p>

                                <div className="flex items-center gap-1">
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        Anterior
                                    </button>

                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-10 h-10 rounded-lg font-medium transition-all ${page === pageNum
                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    {totalPages > 5 && <span className="px-2 text-gray-500">...</span>}

                                    <button
                                        disabled={page === totalPages}
                                        onClick={() => setPage(page + 1)}
                                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal de Conferência */}
            {modalVendaId && vendaSelecionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4">
                        {/* Header do Modal */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Conferência da Venda</h2>
                                    <p className="text-blue-100 mt-1">ID: #{vendaSelecionada.venda_id}</p>
                                </div>
                                <button
                                    onClick={() => setModalVendaId(null)}
                                    className="text-white hover:text-blue-200 text-3xl font-light transition-colors"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Corpo do Modal */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {/* Informações da venda */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-500 mb-1">Cliente</p>
                                    <p className="font-semibold text-gray-900">{vendaAberta.cliente || "Não informado"}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-500 mb-1">Atendente</p>
                                    <p className="font-semibold text-gray-900">{vendaSelecionada.nomeFuncionario || "Não informado"}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl">
                                    <p className="text-sm text-blue-500 mb-1">Valor Total</p>
                                    <p className="text-2xl font-bold text-blue-600">{formatarMoeda(vendaAberta.totalPrice)}</p>
                                </div>
                            </div>

                            {/* Lista de produtos */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden mb-8">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <h3 className="font-semibold text-gray-900">Produtos e Serviços</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {vendaSelecionada.produtos.map((p) => (
                                        <div key={p.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-gray-900">{p.xProd}</p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {p.quantity} {p.uCom} • Unitário: {formatarMoeda(p.vlrVenda / p.quantity)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">{formatarMoeda(p.vlrVenda)}</p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Total: {formatarMoeda(p.vlrVenda * p.quantity)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        handleLiquidar(vendaSelecionada);
                                    }}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                                >
                                    <span className="text-xl">💰</span>
                                    <span>Realizar Pagamento</span>
                                </button>

                                <button
                                    onClick={() => setModalVendaId(null)}
                                    className="px-6 py-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
                                >
                                    Voltar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modais de pagamento (mantenha como está) */}
            {isPaymentModalOpen && vendaSelecionada && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    total={paymentTotal}
                    tipo="Venda"
                    saleData={vendaSelecionada}
                    permitirDesconto={false}
                    permitirParcelamento={false}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onConfirm={handleConfirmPayment}
                />
            )}

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

            {toast.message && <Toast type={toast.type} message={toast.message} />}
        </div>
    );
}