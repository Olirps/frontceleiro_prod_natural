import React, { useState, useEffect } from 'react';
import { formatarMoedaBRL } from '../utils/functions';

export function PrecoProdutoInput({
    id,
    tipo,
    valorAtual,
    valorAntigo,
    modo,
    onChange,
    label
}) {
    const [novoValor, setNovoValor] = useState(valorAtual || 0);

    useEffect(() => {
        setNovoValor(valorAtual || 0); 
    }, [valorAtual]);

    const handleChange = (e) => {
        const valor = parseFloat(e.target.value) || 0;
        setNovoValor(valor);
        onChange(id, valor, tipo);
    };

    // Função para arredondar com duas casas decimais
    const arredondar = (valor) => Math.round(valor * 100) / 100;

    const diffReais = arredondar(novoValor - (valorAntigo || 0));
    const diffPercent = valorAntigo 
        ? arredondar(((novoValor - valorAntigo) / valorAntigo) * 100)
        : 0;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
                <p className="text-sm text-gray-500">{label} Atual</p>
                <p>{formatarMoedaBRL(valorAntigo || 0)}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Novo {label}</p>
                <input
                    type="number"
                    step="0.01"
                    value={novoValor}
                    onChange={handleChange}
                    className="border rounded-md p-1 w-full"
                />
            </div>
            <div>
                <p className="text-sm text-gray-500">Dif %</p>
                <p>{diffPercent}%</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Dif R$</p>
                <p>{formatarMoedaBRL(diffReais)}</p>
            </div>
        </div>
    );
}
