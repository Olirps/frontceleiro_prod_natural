import React, { useEffect, useState } from 'react';
import { listarVendasEmAberto, getVendasComanda, registraPagamento } from '../services/api';
import SaleModal from '../components/SaleModal';
import Toast from '../components/Toast';

import { formatarMoedaBRL, converterMoedaParaNumero, converterData } from '../utils/functions'; // Funções para formatar valores


export default function ComandasAbertasPage() {
    const [comandas, setComandas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [vendaSelecionada, setVendaSelecionada] = useState(null);
    const [erro, setErro] = useState(null);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [formDataTemp, setFormDataTemp] = useState();



    useEffect(() => {
        carregarComandas();
    }, []);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const carregarComandas = async () => {
        setLoading(true);
        try {
            const res = await listarVendasEmAberto();
            setComandas(res?.dados?.vendas || []);
        } catch (err) {
            setErro('Erro ao carregar comandas abertas.');
        } finally {
            setLoading(false);
        }
    };

    const selecionarComanda = async (comandaId) => {
        setLoading(true);
        try {
            const detalhes = await getVendasComanda(comandaId);
            setVendaSelecionada(detalhes.data);
        } catch (err) {
            setErro('Erro ao carregar dados da comanda.');
        } finally {
            setLoading(false);
        }
    };

    const encerrarVenda = async (vendaId) => {
        if (!window.confirm('Deseja realmente encerrar esta venda?')) return;

        try {
            setIsSaleModalOpen(true)
            //await registraPagamento(`/vendas/${vendaId}/encerrar`);
            alert('Venda encerrada com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao encerrar a venda.');
        } finally {
            carregarComandas(); // Recarrega a lista atualizada
            setIsSaleModalOpen(false);
        }
    };

    const handlePaymentSubmit = async (dadosPagamento) => {
        try {
            let dataHoje = new Date().toLocaleString().replace(',', '');
            let dataAjustada = converterData(dataHoje);
            dadosPagamento.tipoVenda = 'VendaRest';
            dadosPagamento.dataVenda = dataAjustada;
            dadosPagamento.status = 0;
            dadosPagamento.formapgto_id = dadosPagamento.id
            await registraPagamento(dadosPagamento);
            setToast({ message: "Venda registrada com sucesso!", type: "success" });
        } catch (error) {
            setToast({ message: "Erro ao registrar venda", type: "error" });
        } finally {
            setIsSaleModalOpen(false);
            setFormDataTemp(null);
        }
    };


    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Vendas Abertas</h2>

            {loading && <p className="text-blue-500">Carregando...</p>}
            {erro && <p className="text-red-500">{erro}</p>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {comandas.map((venda) => (
                    <button
                        key={venda.venda_id}
                        className="bg-white border rounded-2xl shadow p-4 hover:bg-blue-100 transition"
                        onClick={() => selecionarComanda(venda.venda_id)}
                    >
                        <p className="font-semibold">Venda #{venda.venda_id}</p>
                        {venda.cliente ? <p className="font-semibold">Cliente: {venda.cliente.nome}</p> : <p className="font-semibold">Cliente: Não informado</p>}
                        <p>Status: {venda.status_id === 1 ? 'Aberta' : 'Outro'}</p>
                        <p>Total: R$ {Number(venda.totalPrice).toFixed(2)}</p>
                        <p>Data: {new Date(venda.dataVenda).toLocaleString()}</p>
                    </button>
                ))}
            </div>


            {vendaSelecionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                        {/* Botão de fechar */}
                        <button
                            onClick={() => setVendaSelecionada(null)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                        >
                            &times;
                        </button>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">Venda #{vendaSelecionada.vendaVinculada.comanda_id ? vendaSelecionada.vendaVinculada.comanda_id : vendaSelecionada.vendaVinculada.id}</h3>
                                {vendaSelecionada.vendaVinculada.comanda_id ? <p></p> : <p><strong>{vendaSelecionada.vendaVinculada.cliente}</strong></p>}
                                <span className="text-sm px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full">
                                    Status: {vendaSelecionada.comanda_status ? vendaSelecionada.comanda_status : vendaSelecionada.venda_status === 1 ? 'Aberta' : 'Fechada'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p><strong>Total:</strong> R$ {Number(vendaSelecionada.vendaVinculada.totalPrice).toFixed(2)}</p>
                                    <p><strong>Data da Venda:</strong> {new Date(vendaSelecionada.vendaVinculada.dataVenda).toLocaleString()}</p>
                                    <p><strong>Status da Venda:</strong> {vendaSelecionada.venda_status === 1 ? 'Aberta' : 'Fechada'}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-lg font-semibold mt-4 mb-2">Produtos</h4>
                                <ul className="divide-y divide-gray-200">
                                    {vendaSelecionada.produtos.map((produto) => (
                                        <li key={produto.id} className="py-2 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{produto.xProd}</p>
                                                <p className="text-sm text-gray-500">
                                                    {produto.quantity} {produto.uCom} x R$ {produto.valor_unitario.toFixed(2)}
                                                </p>
                                            </div>
                                            <span className="font-semibold text-right">R$ {produto.vlrVenda.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-4">
                                <button
                                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                                    onClick={() => setIsSaleModalOpen(true)}
                                >
                                    Encerrar Venda
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isSaleModalOpen && (
                <SaleModal
                    isOpen={isSaleModalOpen}
                    onSubmit={handlePaymentSubmit}
                    tipo={"VendaRest"}
                    saleData={vendaSelecionada}
                    onClose={() => setIsSaleModalOpen(false)}
                />
            )}
            {toast.message && <Toast type={toast.type} message={toast.message} />}

        </div>
    );
}
