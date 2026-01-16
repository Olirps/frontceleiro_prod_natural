import React, { useState, useEffect } from 'react';
import ConfirmarLancarParcelas from '../components/ConfirmarLancarParcelas';
import { cpfCnpjMask } from './utils';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";
import { formatarMoedaBRL } from '../utils/functions';
import { getParcelaByID, pagamentoParcela } from '../services/api';
import PaymentModal from '../components/PaymentModal';
import Toast from '../components/Toast';

const StatusBadge = ({ status }) => {
    const map = {
        PAGO: 'bg-green-100 text-green-700',
        ABERTO: 'bg-yellow-100 text-yellow-700',
        ATRASADO: 'bg-red-100 text-red-700',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
};

const ModalLancamentoCompleto = ({
    isOpen,
    onClose,
    onConfirmar,
    isDespesa,
    lancamento,
    onReceita,
    onSuccess
}) => {

    const [lancamentoCompleto, setLancamentoCompleto] = useState(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [cancelarLancto, setCancelarLancto] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [parcelaSelecionada, setParcelaSelecionada] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentTotal, setPaymentTotal] = useState(0);
    const [selectedParcela, setSelectedParcela] = useState(null);


    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

    useEffect(() => {
        if (lancamento?.data) {
            setLancamentoCompleto(lancamento.data);
        }
    }, [lancamento]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    if (!isOpen || !lancamentoCompleto) return null;

    const formatarData = (data) => {
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
    };

    const formatarDataHora = (data) => {
        if (!data) return '-';
        return new Date(data).toLocaleString('pt-BR');
    };

    const handlePagarParcelas = async (parcela) => {
        checkPermission('pagamentosparcelas', 'insert', async () => {
            const response = await getParcelaByID(parcela.id);
            setSelectedParcela(response.data);
            setPaymentTotal(parcela.valor_parcela);
            setIsPaymentModalOpen(true);
        });
    };

    const handleCancelar = () => {
        checkPermission('lancamento-completo', 'delete', () => {
            setCancelarLancto(true);
            setMensagem('Deseja realmente excluir este lançamento?');
            setIsConfirmDialogOpen(true);
        });
    };

    const handleConfirmPayment = async (resultado) => {
        try {
            const payload = {
                parcela_id: selectedParcela.id,
                pagamentos: resultado.pagamentos,
                data_pagamento_efetivo: resultado.data_pagamento_efetivo,
                recebimentoHoje: resultado.recebimentoHoje
            };

            await pagamentoParcela(selectedParcela.id, payload); // novo endpoint

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

    const handleConfirmCancelamento = () => {
        onConfirmar(lancamentoCompleto);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div
                    className="
        bg-white w-full h-full
        md:h-[90vh] md:max-w-5xl
        md:rounded-xl shadow-xl
        relative
        flex flex-col
      "
                >
                    {/* ================= HEADER (FIXO) ================= */}
                    <div className="flex justify-between items-center border-b px-4 py-3 md:px-6 shrink-0">
                        <h2 className="text-xl font-semibold">
                            {isDespesa ? 'Despesa' : 'Recebível do Cliente'}
                        </h2>

                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-red-600 text-xl"
                        >
                            ✕
                        </button>
                    </div>

                    {/* ================= BODY (SCROLL) ================= */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-6 overscroll-contain">

                        {/* Cliente + Resumo */}
                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">

                            {/* Cliente */}
                            {!isDespesa && lancamentoCompleto.cliente && (
                                <div className="sm:col-span-2 p-4 rounded-xl bg-blue-50 border border-blue-100">
                                    <p className="text-xs text-blue-600 font-semibold uppercase mb-1">
                                        Cliente
                                    </p>

                                    <p className="font-semibold text-gray-800">
                                        {lancamentoCompleto.cliente.nome}
                                    </p>

                                    <p className="text-sm text-gray-600">
                                        {cpfCnpjMask(lancamentoCompleto.cliente.cpfCnpj)}
                                    </p>
                                </div>
                            )}

                            {/* Resumo financeiro */}
                            <div className="sm:col-span-4">
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Valor total</p>
                                        <p className="text-xl font-bold text-blue-600">
                                            {formatarMoedaBRL(
                                                lancamentoCompleto._previousDataValues.valor
                                            )}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Valor Pago</p>
                                        <p className="text-xl font-bold text-green-600">
                                            {formatarMoedaBRL(
                                                lancamentoCompleto._previousDataValues.valor_pago
                                            )}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Valor Restante</p>
                                        <p className="text-xl font-bold text-red-600">
                                            {formatarMoedaBRL(lancamentoCompleto.dataValues.valor)}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Data do lançamento</p>
                                        <p className="font-medium">
                                            {formatarData(
                                                lancamentoCompleto.dataValues.data_lancamento
                                            )}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Qtd. parcelas</p>
                                        <p className="font-medium">
                                            {lancamentoCompleto.parcelas.length}
                                        </p>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* ================= PARCELAS ================= */}
                        <div>
                            <h3 className="font-semibold mb-3">Parcelas</h3>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm border rounded-lg overflow-hidden">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Descrição</th>
                                            <th className="px-4 py-2">Valor</th>
                                            <th className="px-4 py-2">Vencimento</th>
                                            <th className="px-4 py-2">Status</th>
                                            {!isDespesa && <th className="px-4 py-2">Ação</th>}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {lancamentoCompleto.parcelas.map((parcela) => (
                                            <tr key={parcela.id} className="border-t">
                                                <td className="px-4 py-2">{parcela.descricao}</td>
                                                <td className="px-4 py-2">
                                                    {formatarMoedaBRL(parcela.valor_parcela)}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {formatarData(parcela.vencimento)}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <StatusBadge status={parcela.status} />
                                                </td>

                                                {!isDespesa && (
                                                    <td className="px-4 py-2">
                                                        {parcela.status !== 'liquidado' && (
                                                            <button
                                                                onClick={() => handlePagarParcelas(parcela)}
                                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                                                            >
                                                                Receber
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ================= PAGAMENTOS ================= */}
                        {lancamentoCompleto.pagamentos?.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-3">Pagamentos realizados</h3>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm border rounded-lg overflow-hidden">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Forma</th>
                                                <th className="px-4 py-2">Valor</th>
                                                <th className="px-4 py-2">Data</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {lancamentoCompleto.pagamentos.map((pagamento) => (
                                                <tr key={pagamento.id} className="border-t">
                                                    <td className="px-4 py-2">
                                                        {pagamento.formaPagamento?.nome || '—'}
                                                    </td>

                                                    <td className="px-4 py-2 text-green-600 font-medium">
                                                        {formatarMoedaBRL(pagamento.vlrPago)}
                                                    </td>

                                                    <td className="px-4 py-2">
                                                        {formatarDataHora(pagamento.createdAt)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ================= FOOTER (FIXO) ================= */}
                    {isDespesa && (
                        <div className="border-t px-4 py-3 md:px-6 flex justify-end shrink-0 bg-white">
                            <button
                                onClick={handleCancelar}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Excluir Lançamento
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {toast.message && <Toast type={toast.type} message={toast.message} />}

            {isConfirmDialogOpen && (
                <ConfirmarLancarParcelas
                    isOpen={isConfirmDialogOpen}
                    message={mensagem}
                    cancelarLancto={cancelarLancto}
                    onConfirmar={handleConfirmCancelamento}
                    onConfirm={handleConfirmCancelamento}
                    onCancel={() => setIsConfirmDialogOpen(false)}
                />
            )}

            {isPaymentModalOpen && selectedParcela && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    total={paymentTotal}
                    tipo="liquidacao"
                    permitirDesconto={false}
                    permitirParcelamento={false}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onConfirm={handleConfirmPayment}
                />
            )}

            <PermissionModalUI />
        </>

    );
};

export default ModalLancamentoCompleto;
