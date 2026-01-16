// ================================
// InstallmentPayment.jsx
// ================================
import { useEffect, useState } from "react";
import { formatarMoedaBRL } from "../utils/functions";
import { gerarParcelas } from "../utils/parcelasUtils";

export default function InstallmentPayment({ total, onChange }) {
  const [entrada, setEntrada] = useState(0);
  const [qtd, setQtd] = useState(1);
  const [primeiroVenc, setPrimeiroVenc] = useState(new Date().toISOString().slice(0, 10));
  const [parcelas, setParcelas] = useState([]);

  useEffect(() => {
    const restante = total - entrada;
    if (restante <= 0 || qtd <= 0) return;

    const lista = gerarParcelas(restante, qtd, primeiroVenc);
    setParcelas(lista);
  }, [entrada, qtd, primeiroVenc, total]);

  useEffect(() => {
    const soma = parcelas.reduce((s, p) => s + p.valor, 0) + Number(entrada);
    if (soma === total) {
      onChange({
        tipo: "parcelado",
        entrada: entrada > 0 ? { valor: entrada, data: new Date().toISOString().slice(0, 10) } : null,
        parcelas
      });
    } else {
      onChange(null);
    }
  }, [parcelas, entrada, total, onChange]);

  const atualizarParcela = (index, campo, valor) => {
    const nova = [...parcelas];
    nova[index][campo] = campo === "valor" ? Number(valor) : valor;
    setParcelas(nova);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Entrada</label>
          <input
            value={formatarMoedaBRL(entrada)}
            onChange={e => setEntrada(Number(e.target.value.replace(/\D/g, "")) / 100)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="text-sm">Parcelas</label>
          <input
            type="number"
            min={1}
            value={qtd}
            onChange={e => setQtd(Number(e.target.value))}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      </div>

      <div>
        <label className="text-sm">Primeiro vencimento</label>
        <input
          type="date"
          value={primeiroVenc}
          onChange={e => setPrimeiroVenc(e.target.value)}
          className="w-full border rounded px-2 py-1"
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        {parcelas.map((p, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 items-center px-3 py-2 border-b">
            <span className="text-sm">{p.numero}ª</span>
            <input
              type="date"
              value={p.vencimento}
              onChange={e => atualizarParcela(i, "vencimento", e.target.value)}
              className="border rounded px-2 py-1"
            />
            <input
              value={formatarMoedaBRL(p.valor)}
              onChange={e => atualizarParcela(i, "valor", e.target.value.replace(/\D/g, "") / 100)}
              className="border rounded px-2 py-1"
            />
          </div>
        ))}
      </div>
    </div>
  );
}