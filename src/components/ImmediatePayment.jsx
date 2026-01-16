// ImmediatePayment.jsx
import { useEffect, useState } from "react";
import { formatarMoedaBRL } from "../utils/functions";
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

    const [valor, setValor] = useState(total);
    const [saldo, setSaldo] = useState(total);

    // 🔹 parcial
    const [permitirParcial, setPermitirParcial] = useState(false);

    // 🔹 recebimento
    const [recebimentoHoje, setRecebimentoHoje] = useState(true);
    const [dataRecebimento, setDataRecebimento] = useState(
        new Date().toISOString().slice(0, 10)
    );

    useEffect(() => {
        getFormasPagamento().then(res => setFormasPagamento(res.data));
        getContasBancarias().then(res => setContas(res.data));
    }, []);

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
                : dataRecebimento
        });

    }, [
        pagamentos,
        saldo,
        permitirParcial,
        recebimentoHoje,
        dataRecebimento,
        onChange
    ]);


    const isTED = formaSelecionada?.nome === "TED";

    const adicionar = () => {
        const valorNum = Number(valor);

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
            total - lista.reduce((s, p) => s + p.valor, 0);

        setPagamentos(lista);
        setSaldo(novoSaldo < 0 ? 0 : novoSaldo);
        setValor(novoSaldo < 0 ? 0 : novoSaldo);

        setFormaSelecionada(null);
        setContaSelecionada(null);
    };


    const remover = (i) => {
        const lista = pagamentos.filter((_, idx) => idx !== i);
        const novoSaldo =
            total - lista.reduce((s, p) => s + p.valor, 0);

        setPagamentos(lista);
        setSaldo(novoSaldo < 0 ? 0 : novoSaldo);
        setValor(novoSaldo < 0 ? 0 : novoSaldo);
    };

    return (
        <div className="space-y-4">

            {/* Valor */}
            <div>
                <label className="text-sm">Valor</label>
                <input
                    value={formatarMoedaBRL(valor)}
                    onChange={e =>
                        setValor(Number(e.target.value.replace(/\D/g, "")) / 100)
                    }
                    className="w-full border rounded px-3 py-2"
                />
            </div>

            {/* Forma */}
            <div>
                <label className="text-sm">Forma de pagamento</label>
                <select
                    value={formaSelecionada?.id || ""}
                    onChange={e =>
                        setFormaSelecionada(
                            formasPagamento.find(f => f.id == e.target.value)
                        )
                    }
                    className="w-full border rounded px-3 py-2"
                >
                    <option value="">Selecione</option>
                    {formasPagamento.map(f => (
                        <option key={f.id} value={f.id}>
                            {f.nome}
                        </option>
                    ))}
                </select>
            </div>

            {/* Conta TED */}
            {isTED && (
                <div>
                    <label className="text-sm">Conta bancária</label>
                    <select
                        value={contaSelecionada?.id || ""}
                        onChange={e =>
                            setContaSelecionada(
                                contas.find(c => c.id == e.target.value)
                            )
                        }
                        className="w-full border rounded px-3 py-2"
                    >
                        <option value="">Selecione</option>
                        {contas.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.banco} - {c.agencia}/{c.conta}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Recebimento */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={recebimentoHoje}
                        onChange={e => setRecebimentoHoje(e.target.checked)}
                    />
                    Recebimento hoje?
                </label>

                {!recebimentoHoje && (
                    <input
                        type="date"
                        value={dataRecebimento}
                        onChange={e => setDataRecebimento(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                    />
                )}
            </div>

            <button
                onClick={adicionar}
                className="w-full bg-green-600 text-white py-2 rounded-lg"
            >
                Adicionar pagamento
            </button>

            {/* Lista */}
            {pagamentos.map((p, i) => (
                <div
                    key={i}
                    className="flex justify-between items-center border-b py-1 text-sm"
                >
                    <div>
                        <div className="font-medium">{p.nome}</div>
                        <div className="text-xs text-gray-500">
                            Recebimento: {recebimentoHoje
                                ? new Date().toISOString().slice(0, 10)
                                : dataRecebimento}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>{formatarMoedaBRL(p.valor)}</span>
                        <button
                            onClick={() => remover(i)}
                            className="text-red-600"
                        >
                            ✖
                        </button>
                    </div>
                </div>
            ))}

            {/* Parcial */}
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={permitirParcial}
                    onChange={e => setPermitirParcial(e.target.checked)}
                />
                Permitir pagamento parcial
            </label>

            {/* Saldo */}
            <div className="flex justify-between font-medium">
                <span>Saldo</span>
                <span className={saldo > 0 ? "text-orange-600" : "text-green-600"}>
                    {formatarMoedaBRL(saldo)}
                </span>
            </div>

        </div>
    );
}
