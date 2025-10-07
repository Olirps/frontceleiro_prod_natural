import React, { useState, useEffect, useRef } from "react";
import { cpfCnpjMask, converterMoedaParaNumero, formatarMoedaBRL } from "../utils/functions";
import { getFormasPagamento, getEmpresaById } from "../services/api";
import { processTefPayment, cancelaTefPayment } from "../services/ApiTef/ApiTef";
import { registravenda } from "../services/ApiVendas/ApiVendas";
import Toast from "../components/Toast";

const QuickPaymentModal = ({ isOpen, onClose, saleData, totalPrice, selectedProducts, onSuccess }) => {
    const [formasPagamento, setFormasPagamento] = useState([]);
    const [pagamentos, setPagamentos] = useState([]);
    const [novaForma, setNovaForma] = useState("");
    const [valorPagar, setValorPagar] = useState(saleData.totalPrice);
    const [saldoRestante, setSaldoRestante] = useState(saleData.totalPrice);
    const [troco, setTroco] = useState(0);
    const [qtdParcelas, setQtdParcelas] = useState(1);
    const [valorParcela, setValorParcela] = useState(0);
    const [liberarFinalizacao, setLiberarFinalizacao] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "" });
    const selectRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        // Buscar formas de pagamento
        getFormasPagamento().then(res => setFormasPagamento(res.data));
        setSaldoRestante(saleData.totalPrice);
        setValorPagar(saleData.totalPrice);
    }, [isOpen, saleData]);

    useEffect(() => {
        // Calcula valor parcela se parcelado
        if (novaForma === "parcelado") {
            setValorParcela((saldoRestante / qtdParcelas).toFixed(2));
        }
    }, [qtdParcelas, saldoRestante, novaForma]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: "", type: "" }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const adicionarPagamento = async () => {
        if (!novaForma || saldoRestante <= 0) return;

        let pagamento = {
            forma: novaForma,
            valor: valorPagar,
            qtdParcelas: novaForma === "parcelado" ? qtdParcelas : 1,
            valorParcela: novaForma === "parcelado" ? valorParcela : valorPagar
        };

        // TEF
        if (novaForma.includes("TEF")) {
            try {
                const response = await processTefPayment(pagamento);
                if (!response.success) {
                    setToast({ message: "Erro no TEF", type: "error" });
                    return;
                }
                pagamento.token = response.data.controlPayResponse.intencaoVenda.token;
            } catch (err) {
                setToast({ message: "Falha TEF", type: "error" });
                return;
            }
        }

        const novosPagamentos = [...pagamentos, pagamento];
        setPagamentos(novosPagamentos);

        // Atualiza saldo e troco
        const totalPago = novosPagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
        const novoSaldo = totalPrice - totalPago;
        setSaldoRestante(novoSaldo > 0 ? novoSaldo : 0);
        setTroco(novoSaldo < 0 ? Math.abs(novoSaldo) : 0);

        if (novoSaldo <= 0) setLiberarFinalizacao(true);

        // Limpa seleção
        setNovaForma("");
        setQtdParcelas(1);
        setValorParcela(0);

        // Foco de volta no select
        selectRef.current?.focus();
    };

    const removerPagamento = (index) => {
        const novosPagamentos = pagamentos.filter((_, i) => i !== index);
        setPagamentos(novosPagamentos);

        const totalPago = novosPagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
        const novoSaldo = totalPrice - totalPago;
        setSaldoRestante(novoSaldo > 0 ? novoSaldo : 0);
        setTroco(novoSaldo < 0 ? Math.abs(novoSaldo) : 0);
        setLiberarFinalizacao(novoSaldo <= 0);
    };

    const handleConfirmarVenda = async () => {
        if (!liberarFinalizacao) {
            setToast({ message: "Pagamento não completo", type: "error" });
            return;
        }
        try {
            const saleData = {
                totalPrice,
                products: selectedProducts,
                pagamentos
            };
            await registravenda(saleData);
            setToast({ message: "Venda finalizada!", type: "success" });
            onClose();
            onSuccess();
        } catch (err) {
            setToast({ message: "Erro ao finalizar venda", type: "error" });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 flex flex-col">
                <h2 className="text-lg font-semibold mb-4">Pagamento Rápido</h2>

                {/* Seleção de forma */}
                <div className="flex gap-2 mb-4">
                    <select
                        ref={selectRef}
                        value={novaForma}
                        onChange={(e) => setNovaForma(e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Selecione forma</option>
                        {formasPagamento.map(f => (
                            <option key={f.id} value={f.nome}>{f.nome}</option>
                        ))}
                    </select>

                    <button
                        onClick={adicionarPagamento}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        ➕
                    </button>
                </div>

                {/* Parcelamento inline */}
                {novaForma === "parcelado" && (
                    <div className="flex gap-2 mb-4">
                        <input
                            type="number"
                            min="1"
                            value={qtdParcelas}
                            onChange={(e) => setQtdParcelas(Number(e.target.value))}
                            placeholder="Parcelas"
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span>Valor p/ parcela: {formatarMoedaBRL(valorParcela)}</span>
                    </div>
                )}

                {/* Lista de pagamentos */}
                <div className="border rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
                    {pagamentos.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center">Nenhum pagamento</p>
                    ) : (
                        pagamentos.map((p, i) => (
                            <div key={i} className="flex justify-between items-center mb-1">
                                <span>{p.forma} - {formatarMoedaBRL(p.valor)}</span>
                                <button onClick={() => removerPagamento(i)} className="text-red-600 hover:text-red-800">❌</button>
                            </div>
                        ))
                    )}
                </div>

                {/* Resumo rápido */}
                <div className="border-t pt-2 flex justify-between font-semibold mb-4">
                    <span>Saldo:</span>
                    <span>{formatarMoedaBRL(saldoRestante)}</span>
                </div>
                {troco > 0 && <div className="text-green-600 mb-2">Troco: {formatarMoedaBRL(troco)}</div>}

                {/* Ações */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={handleConfirmarVenda}
                        className={`px-6 py-2 rounded-lg text-white ${liberarFinalizacao ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
                        disabled={!liberarFinalizacao}
                    >
                        Confirmar
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                    >
                        Cancelar
                    </button>
                </div>

                {toast.message && <Toast message={toast.message} type={toast.type} />}
            </div>
        </div>
    );
};

export default QuickPaymentModal;
