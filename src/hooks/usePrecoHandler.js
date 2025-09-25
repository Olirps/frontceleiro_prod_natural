import { useState, useCallback } from 'react';

export function usePrecoHandler(initialPrecos = {}, modo = 'cadastrar') {
    const [precosIndividuais, setPrecosIndividuais] = useState(initialPrecos);


    const handlePrecoIndividual = useCallback((id, valor, tipo = 'normal') => {
        const num = parseFloat(valor);

        if (isNaN(num)) {
            setPrecosIndividuais(prev => ({ ...prev, [id]: "" }));
            return;
        }

        if (num < 0) {
            alert('Preço não pode ser negativo');
            return;
        }

        setPrecosIndividuais(prev => ({ ...prev, [id]: num }));
    }, []);

    const aplicarPercentual = useCallback((produtos, percentual) => {
        const valor = parseFloat(percentual);
        if (!isNaN(valor)) {
            const novosPrecos = { ...precosIndividuais };

            produtos.forEach(produto => {
                // Preço normal
                novosPrecos[produto.id] =
                    Math.round((produto.vlrVenda || 0) * (1 + valor / 100) * 100) / 100;

                // Preço fracionado
                if (produto.fracionado) {
                    const fracionadoAtual = produto.preco_venda_fracionado || (produto.vlrVenda / 10);
                    novosPrecos[`${produto.id}_fracionado`] =
                        Math.round(fracionadoAtual * (1 + valor / 100) * 100) / 100;
                }

                // Preço atacado
                if (produto.atacado) {
                    const atacadoAtual = produto.preco_atacado || produto.vlrVenda;
                    novosPrecos[`${produto.id}_atacado`] =
                        Math.round(atacadoAtual * (1 + valor / 100) * 100) / 100;
                }
            });

            setPrecosIndividuais(novosPrecos);
        }
    }, [precosIndividuais]);

    return {
        precosIndividuais,
        setPrecosIndividuais,
        handlePrecoIndividual,
        aplicarPercentual
    };
}