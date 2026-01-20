// ImmediatePayment.jsx
import { useEffect, useState } from "react";
import { formatarMoedaBRL, converterMoedaParaNumero as removerFormatacaoMoeda } from "../utils/functions";
import {
    getFormasPagamento,
    getAllContas as getContasBancarias
} from "../services/api";

export default function ImmediatePayment({ total, onChange }) {
    const [formasPagamento, setFormasPagamento] = useState([]);
    const [contas, setContas] = useState([]);

    const [pagamentos, setPagamentos] = useState([]);
    const [formaSelecionada, setFormaSelecionada] = useState(null);
    const [contaSelecionada, setContaSelecionada] = useState(null);

    const [valorPagamento, setValorPagamento] = useState(total);
    const [saldo, setSaldo] = useState(total);

    // 🔹 desconto
    const [descontoTipo, setDescontoTipo] = useState("valor"); // "valor" ou "percentual"
    const [descontoValor, setDescontoValor] = useState(0);
    const [totalComDesconto, setTotalComDesconto] = useState(total);

    // 🔹 parcial
    const [permitirParcial, setPermitirParcial] = useState(false);

    // 🔹 recebimento
    const [recebimentoHoje, setRecebimentoHoje] = useState(true);
    const [dataRecebimento, setDataRecebimento] = useState(
        new Date().toISOString().slice(0, 10)
    );

    // Carrega dados iniciais
    useEffect(() => {
        getFormasPagamento().then(res => setFormasPagamento(res.data));
        getContasBancarias().then(res => setContas(res.data));
    }, []);

    // Atualiza total com desconto sempre que desconto mudar
    useEffect(() => {
        const totalPagamentos = pagamentos.reduce((s, p) => s + p.valor, 0);

        let novoTotal = total - totalPagamentos;

        if (descontoValor > 0) {
            const valorFinal = total - totalPagamentos;

            if (descontoTipo === "valor") {
                novoTotal = Math.max(
                    0,
                    Math.round((valorFinal - descontoValor) * 100) / 100
                );
            } else if (descontoTipo === "percentual") {
                const percentual = Math.min(100, descontoValor);
                novoTotal = Math.max(
                    0,
                    Math.round((valorFinal - (valorFinal * percentual / 100)) * 100) / 100
                );
            }
        }

        setTotalComDesconto(novoTotal);
        setValorPagamento(novoTotal);
        setSaldo(novoTotal);
    }, [total, descontoTipo, descontoValor]);

    // Notifica mudanças para o componente pai
    useEffect(() => {
        const status =
            saldo > 0
                ? permitirParcial
                    ? "parcial"
                    : null
                : "liquidado";

        if (!status) {
            onChange(null);
            return;
        }

        onChange({
            origem: "avista",
            pagamentos,
            status,
            recebimentoHoje,
            saldo,
            data_recebimento: recebimentoHoje
                ? new Date().toISOString().slice(0, 10)
                : dataRecebimento,
            desconto: {
                tipo: descontoTipo,
                valor: descontoValor,
                total_original: total,
                total_com_desconto: totalComDesconto
            }
        });

    }, [
        pagamentos,
        saldo,
        permitirParcial,
        recebimentoHoje,
        dataRecebimento,
        totalComDesconto,
        descontoTipo,
        descontoValor,
        total,
        onChange
    ]);

    const isTED = formaSelecionada?.nome === "TED";

    const adicionar = () => {
        const valorNum = Number(valorPagamento);

        if (!formaSelecionada || valorNum <= 0) return;
        if (valorNum > saldo) return;
        if (isTED && !contaSelecionada) return;
        if (!recebimentoHoje && !dataRecebimento) return;

        const novo = {
            forma: formaSelecionada.id,
            nome: formaSelecionada.nome,
            valor: valorNum,
            conta_id: isTED ? contaSelecionada.id : null
        };

        const lista = [...pagamentos, novo];
        const novoSaldo =
            totalComDesconto - lista.reduce((s, p) => s + p.valor, 0);

        setPagamentos(lista);
        setSaldo(novoSaldo < 0 ? 0 : novoSaldo);
        setValorPagamento(novoSaldo < 0 ? 0 : novoSaldo);

        setFormaSelecionada(null);
        setContaSelecionada(null);
    };

    const remover = (i) => {
        const lista = pagamentos.filter((_, idx) => idx !== i);
        const novoSaldo =
            totalComDesconto - lista.reduce((s, p) => s + p.valor, 0);

        setPagamentos(lista);
        setSaldo(novoSaldo < 0 ? 0 : novoSaldo);
        setValorPagamento(novoSaldo < 0 ? 0 : novoSaldo);
    };

    return (
        <div className="space-y-1">


            <div className="border rounded-lg p-3 bg-gray-50 space-y-3">

                <div className="font-semibold text-sm">Receber</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                    {/* 🔹 COLUNA ESQUERDA — RECEBIDO + DESCONTO */}
                    <div className="space-y-3">

                        {/* Recebido */}
                        <div>
                            <label className="text-xs text-gray-600">Recebido</label>
                            <input
                                value={formatarMoedaBRL(valorPagamento)}
                                onChange={(e) => {
                                    const valorNumerico = e.target.value.replace(/\D/g, "");
                                    setValorPagamento(Number(valorNumerico) / 100);
                                }
                                }
                                className="w-full border rounded px-3 py-2 text-lg font-bold text-center"
                            />
                        </div>

                        {/* Desconto */}
                        <div>
                            <label className="text-xs text-gray-600">Desconto</label>

                            <div className="flex gap-3 mb-1">
                                <label className="flex items-center gap-1 text-xs">
                                    <input
                                        type="radio"
                                        checked={descontoTipo === "valor"}
                                        onChange={() => setDescontoTipo("valor")}
                                    />
                                    R$
                                </label>

                                <label className="flex items-center gap-1 text-xs">
                                    <input
                                        type="radio"
                                        checked={descontoTipo === "percentual"}
                                        onChange={() => setDescontoTipo("percentual")}
                                    />
                                    %
                                </label>
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    value={descontoValor || ""}
                                    onChange={(e) =>
                                        setDescontoValor(Number(e.target.value) || 0)
                                    }
                                    className="w-full border rounded px-3 py-2 pr-8"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                    {descontoTipo === "percentual" ? "%" : "R$"}
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* 🔹 COLUNA DIREITA — FORMA + CONTAS + PAGAMENTOS */}
                    <div className="space-y-3">

                        {/* Forma */}
                        <div>
                            <label className="text-xs text-gray-600">Forma de pagamento</label>
                            <select
                                value={formaSelecionada?.id || ""}
                                onChange={(e) =>
                                    setFormaSelecionada(
                                        formasPagamento.find(f => f.id == e.target.value)
                                    )
                                }
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="">Selecione...</option>
                                {formasPagamento.map(f => (
                                    <option key={f.id} value={f.id}>{f.nome}</option>
                                ))}
                            </select>
                        </div>

                        {/* Conta bancária */}
                        {isTED && (
                            <div>
                                <label className="text-xs text-gray-600">Conta bancária</label>
                                <select
                                    value={contaSelecionada?.id || ""}
                                    onChange={(e) =>
                                        setContaSelecionada(
                                            contas.find(c => c.id == e.target.value)
                                        )
                                    }
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="">Selecione...</option>
                                    {contas.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.banco} • Ag {c.agencia} • C/C {c.conta}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Pagamentos */}
                        {pagamentos.map((p, i) => (
                            <div key={i} className="flex justify-between items-center border rounded p-3">
                                <div>
                                    <div className="font-medium">{p.nome}</div>
                                    <div className="text-xs text-gray-500">
                                        {recebimentoHoje ? "Hoje" : dataRecebimento}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="font-bold">{formatarMoedaBRL(p.valor)}</span>
                                    <button
                                        onClick={() => remover(i)}
                                        className="text-red-600"
                                    >
                                        ✖
                                    </button>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>

                {/* 🔹 AÇÃO */}
                <div className="flex justify-between items-center border-t pt-3">
                    <label className="flex items-center gap-2 text-xs">
                        <input
                            type="checkbox"
                            checked={permitirParcial}
                            onChange={(e) => setPermitirParcial(e.target.checked)}
                        />
                        Permitir pagamento parcial
                    </label>

                    <button
                        onClick={adicionar}
                        disabled={!formaSelecionada || valorPagamento <= 0}
                        className={`px-6 py-2 rounded font-bold ${!formaSelecionada || valorPagamento <= 0
                            ? "bg-gray-300 text-gray-500"
                            : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                    >
                        Receber
                    </button>
                </div>

            </div>
        </div>
    );


}