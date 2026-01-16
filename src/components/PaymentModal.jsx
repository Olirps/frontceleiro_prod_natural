import { useEffect, useState } from "react";
import ImmediatePayment from "./ImmediatePayment";
import InstallmentPayment from "./InstallmentPayment";

export default function PaymentModal({
    isOpen,
    total = 0,
    onConfirm,
    onClose
}) {
    const [modo, setModo] = useState("avista");
    const [dadosPagamento, setDadosPagamento] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setModo("avista");
            setDadosPagamento(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!dadosPagamento) return;

        // 🔥 CONTRATO ANTIGO — NÃO MEXE NA API
        if (modo === "avista") {
            onConfirm({
                pagamentos: dadosPagamento.pagamentos,
                data_pagamento_efetivo: dadosPagamento.data_recebimento,
                recebimentoHoje: dadosPagamento.recebimentoHoje,
                status: dadosPagamento.status,
                saldo: dadosPagamento.saldo
            });
        }


        if (modo === "parcelado") {
            onConfirm({
                pagamentos: dadosPagamento.pagamentos || [],
                parcelas: dadosPagamento.parcelas,
                status: "parcelado",
                saldo: 0,
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white w-full max-w-4xl rounded-xl p-6">

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setModo("avista")}
                        className={`px-4 py-2 rounded ${modo === "avista" ? "bg-blue-600 text-white" : "bg-gray-100"
                            }`}
                    >
                        À vista
                    </button>

                    <button
                        onClick={() => setModo("parcelado")}
                        className={`px-4 py-2 rounded ${modo === "parcelado" ? "bg-blue-600 text-white" : "bg-gray-100"
                            }`}
                    >
                        Parcelado
                    </button>
                </div>

                {/* Conteúdo */}
                {modo === "avista" && (
                    <ImmediatePayment
                        total={total}
                        onChange={setDadosPagamento}
                    />
                )}

                {modo === "parcelado" && (
                    <InstallmentPayment
                        total={total}
                        onChange={setDadosPagamento}
                    />
                )}

                {/* Footer */}
                <div className="flex justify-end gap-2 mt-6 border-t pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded"
                    >
                        Cancelar
                    </button>

                    <button
                        disabled={!dadosPagamento}
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
