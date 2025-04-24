// src/utils/parcelasUtils.js

export const calcularParcelas = (valorTotal, valorEntrada, lancarParcelas, dataVencimento, tipoParcelamento) => {
    // Converte os valores para números
    const valorTotalNum = converterMoedaParaNumero(valorTotal);
    const valorEntradaNum = converterMoedaParaNumero(valorEntrada || '0');

    // Calcula o valor restante após a entrada
    const valorRestante = valorTotalNum - valorEntradaNum;

    // Calcula o valor de cada parcela e arredonda para 2 casas decimais
    const valorParcela = parseFloat((valorRestante / parseInt(lancarParcelas)).toFixed(2));

    // Função para calcular a data de vencimento de cada parcela
    const calcularDataVencimento = (dataBase, index) => {
        const data = new Date(dataBase);
        if (tipoParcelamento === 'anual') {
            data.setFullYear(data.getFullYear() + index); // Incrementa anos
        } else {
            data.setMonth(data.getMonth() + index); // Incrementa meses (padrão)
        }
        return data.toISOString().split('T')[0]; // Retorna no formato YYYY-MM-DD
    };

    // Gera as parcelas iniciais
    return Array.from({ length: parseInt(lancarParcelas) }, (_, index) => {
        const dataVencimentoParcela = calcularDataVencimento(dataVencimento, index);

        // Ajusta o valor da última parcela para cobrir diferenças de arredondamento
        const valorFinal = index === parseInt(lancarParcelas) - 1
            ? (valorRestante - (valorParcela * (parseInt(lancarParcelas) - 1))).toFixed(2)
            : valorParcela;

        return {
            numeroParcela: index + 1,
            dataVencimento: dataVencimentoParcela,
            valor: parseFloat(valorFinal), // Retorna como número
            editavel: true, // Indica que a parcela pode ser editada
        };
    });
};

const formatarNumero = (valor) => {
    return valor
        .replace(/[^0-9,.-]/g, '') // Remove tudo que não for número, vírgula, ponto ou sinal de menos
        .replace(',', '.'); // Troca a vírgula pelo ponto decimal
};
// Função para atualizar o valor de uma parcela

export const atualizarValorParcela = (index, parcelas, novoValor) => {

    let valorNovaParcela = 0;
    let valorFormatado = formatarNumero(novoValor);
    const casasDecimais = valorFormatado.split(".")[1]?.length || 0;
    let novasParcelas = [...parcelas];


    // Formata o valor da nova parcela
    if (casasDecimais > 2) {
        const pontosCount = (valorFormatado.match(/\./g) || []).length;
        if (pontosCount > 1) {
            valorFormatado = valorFormatado.replace(/\./g, '')
            valorFormatado = valorFormatado / 100;
            valorNovaParcela = valorFormatado.toFixed(2)
        } else {
            valorFormatado = valorFormatado * 10;
            valorNovaParcela = valorFormatado.toFixed(2);
        }

    } else if (casasDecimais === 2) {
        valorNovaParcela = parseFloat(valorFormatado).toFixed(2); // Garante 2 casas decimais
    } else {
        valorNovaParcela = parseFloat(valorFormatado).toFixed(2); // Garante 2 casas decimais
        valorNovaParcela = valorNovaParcela / 100;
    }


    if (isNaN(valorNovaParcela)) {
        valorNovaParcela = 0
    }
    // 1ª Pegar Valor Total das Parcelas Originais

    // Captura o valor total original antes de qualquer alteração
    const valorTotalOriginal = parcelas.reduce((total, parcela) => total + parseFloat(parcela.valor), 0).toFixed(2);

    //2º Salvar Parcelas Originais 
    const parcelas_originais = parcelas;
    if (parcelas_originais[index].editavel === false) {
        return 'A parcela não pode ser editada.'
    }

    //3º Pegar qual Parcela será aletada e o valor da nova parcela
    const parc_alterada = index + 1;
    const valor_parcela_alterada_original = parcelas_originais[index];


    //4º verificar se o soma das demais parcelas + novo valor da parcela alterada não é maior que o valorTotalOriginal 
    const parcelas_nao_alteradas = parcelas_originais.filter((_, i) => i !== index);


    if (valorNovaParcela >= parseFloat(valorTotalOriginal) && parcelas_originais.length > 1) {
        valorNovaParcela = valor_parcela_alterada_original.valor;
        return 'Valor da Parcelas não pode ser Maior/Menor ou Igual ao Valor do Lançamento.'
    }

    if (valorNovaParcela <= 0 && parcelas_originais.length > 1) {
        valorNovaParcela = valor_parcela_alterada_original.valor;
        return 'Valor da Parcelas não pode ser Maior/Menor ou Igual ao Valor do Lançamento.'
    }
    //5º Atualiza com o valor da nova parcela
    novasParcelas[index].manual = true;
    novasParcelas[index].valor = parseFloat(valorNovaParcela);

    let valorTotalAtualizado = novasParcelas.reduce((total, parcela) => total + parseFloat(parcela.valor), 0);


    //6º Pega as parcelas que nunca tiveram seu valor atualizado
    const parcelas_nao_alteradas_disponiveis = novasParcelas.filter(parcela => !parcela.manual);
    const parc_restante = parcelas_nao_alteradas_disponiveis.length

    //7º Pega as parcelas que tiveram seu valor alterado
    const parcelas_alteradas = novasParcelas.filter(parcela => parcela.manual);
    const parcelas_alteradas_qtd = parcelas_alteradas.length
    const valor_parcelas_alteradas = parcelas_alteradas.reduce((total, parcela) => total + parseFloat(parcela.valor), 0);


    const diferenca = valorTotalOriginal - valor_parcelas_alteradas;

    if (diferenca <= 0) {
        novasParcelas[index].valor = parseFloat(valor_parcela_alterada_original.valor);
        return 'Valor das Parcelas não pode ser Maior que o Valor do Lançamento.'
    }


    if (parc_restante === 1) {
        // Encontra o índice da parcela com base no `numeroParcela`
        const indexParc = novasParcelas.findIndex(parcela => parcela.numeroParcela === parcelas_nao_alteradas_disponiveis[0].numeroParcela);

        // Verifica se a parcela foi encontrada antes de alterar
        if (indexParc !== -1) {
            novasParcelas[indexParc].editavel = false;
        }
    }

    const valor_redistribuicao = diferenca / parc_restante;

    if (valor_redistribuicao < 0.01) {
        novasParcelas[index].valor = parseFloat(valor_parcela_alterada_original.valor);
        return 'Valor das Parcelas não pode ser Maior que o Valor do Lançamento.'
    }


    // Filtra as parcelas que não foram alteradas manualmente
    //const parcelasManuais = novasParcelas.filter((parcela, i) => parcela.manual);

    /*if (parcelasManuais.length === (parcelas.length - 1)) {
        novasParcelas[parcelas.length - 1].editavel = false;
    }*/

    // Redistribui a diferença entre as demais parcelas
    if (novasParcelas.length > 1) {
        // Aplica o ajuste nas parcelas restantes
        novasParcelas = novasParcelas.map((parcela, i) => {
            if (i !== index && !novasParcelas[i].manual) {
                return { ...parcela, valor: parseFloat(valor_redistribuicao.toFixed(2)) };
            }
            return parcela;
        });

        // Verifica se há um "resto" após a redistribuição e adiciona na última parcela
        valorTotalAtualizado = novasParcelas.reduce((total, parcela) => total + parseFloat(parcela.valor), 0);
        const resto = valorTotalOriginal - valorTotalAtualizado;

        if (resto !== 0) {
            // TEM um BO aqui dentro quando altero o valor da ultima parcela e sobra resto..17/02/2025 16:15
            // Não tem mais o BO...17/02/2025 20:20. Mas não sei não !
            const ultimaParcelaIndex = novasParcelas.length - 1;

            const qualParcelaAleterei = novasParcelas[index];
            const nroParcelaAltereda = qualParcelaAleterei.numeroParcela;
            const nroParcelaUltima = novasParcelas[ultimaParcelaIndex].numeroParcela;
            if (nroParcelaAltereda === nroParcelaUltima) {
                const ultimaParcelaDisponivel = parcelas_nao_alteradas_disponiveis.length - 1;
                let parcelaNovaParaAlterar = novasParcelas[ultimaParcelaDisponivel];

                const indexParc = novasParcelas.findIndex(parcela => parcela.numeroParcela === parcelaNovaParaAlterar.numeroParcela);

                novasParcelas[indexParc].valor = parseFloat(
                    (parseFloat(novasParcelas[indexParc].valor) + resto).toFixed(2)
                );
            } else {
                novasParcelas[ultimaParcelaIndex].valor = parseFloat(
                    (parseFloat(novasParcelas[ultimaParcelaIndex].valor) + resto).toFixed(2)
                );
            }
        }
        valorTotalAtualizado = novasParcelas.reduce((total, parcela) => total + parseFloat(parcela.valor), 0).toFixed(2);

        if (valorTotalAtualizado > valorTotalOriginal) {
            novasParcelas = parcelas_originais;
            return 'Valor da Parcelas não pode ser Maior/Menor ou Igual ao Valor do Lançamento.'
        }

    }

    return novasParcelas;
};

// Função para atualizar a data de vencimento de uma parcela
export const atualizarDataVencimentoParcela = (index, parcelas, novaData) => {
    const novasParcelas = [...parcelas];
    novasParcelas[index].dataVencimento = novaData;
    return novasParcelas;
};


const converterMoedaParaNumero = (valor) => {

    if (/,/.test(valor.toString())) {
        return parseFloat(valor.replace(/[^0-9,-]/g, '').replace(',', '.'));
    } else {
        return parseFloat(valor);

    }

};
