import React, { useState, useEffect } from 'react';
import '../styles/ModalLancamentoParcelas.css';
import Toast from '../components/Toast';
import { formatarMoedaBRL, converterMoedaParaNumero } from '../utils/functions';
import { calcularParcelas, atualizarValorParcela, atualizarDataVencimentoParcela } from '../utils/parcelasUtils'; // Importando a função de cálculo de parcelas
import { addParcelasDespesa } from '../services/api';


const ModalLancamentoParcelas = ({ isOpen, onClose, valorTotal, despesa, onSuccess }) => {
    const [quantidadeParcelas, setQuantidadeParcelas] = useState(1);
    const [vencimento, setVencimento] = useState(new Date().toISOString().split('T')[0]);
    const [valorEntrada, setValorEntrada] = useState(0);
    const [parcelas, setParcelas] = useState([]);
    const [tipoParcelamento, setTipoParcelamento] = useState('mensal');
    const [parcelas_old, setParcelas_old] = useState([]); // Estado para armazenar as parcelas
    const [disabledSalvar, setDisabledSalvar] = useState(false); // Estado para controlar o modal de parcelas
    const [boleto, setBoleto] = useState([]); // Estado para controlar o modal de parcelas
    const [toast, setToast] = useState({ message: '', type: '' });

    useEffect(() => {
        const novasParcelas = calcularParcelas(valorTotal, valorEntrada, quantidadeParcelas, vencimento, tipoParcelamento)
        setParcelas(novasParcelas);
        setParcelas_old(novasParcelas); // Atualiza o estado das parcelas originais

    }, [quantidadeParcelas, vencimento, valorEntrada, tipoParcelamento, valorTotal]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleAlterarParcela = (index, e) => {
        const parcelasOldCopia = JSON.parse(JSON.stringify(parcelas_old));

        const novasParcelas = atualizarValorParcela(index, parcelas, e);

        // Função para lidar com a resposta de erro e retorno das parcelas antigas
        const handleError = (message) => {
            setParcelas(parcelasOldCopia);
            setDisabledSalvar(true);
            setToast({ message, type: "error" });
        };

        // Verificações de erro
        if (novasParcelas === 'Valor das Parcelas não pode ser Maior que o Valor do Lançamento.') {
            handleError("A Somatória das Parcelas não pode ser maior que o valor do lançamento");
        } else if (novasParcelas === 'Valor da Parcelas não pode ser Maior/Menor ou Igual ao Valor do Lançamento.') {
            setParcelas(parcelasOldCopia);
            setToast({ message: "Valor da Parcelas não pode ser Maior ou Igual ao Valor do Lançamento.", type: "error" });
            setDisabledSalvar(false);
        } else if (novasParcelas === 'A parcela não pode ser editada.') {
            setParcelas(parcelasOldCopia);
            setDisabledSalvar(false);
        } else {
            setParcelas(novasParcelas);
            setParcelas_old(novasParcelas);
            setDisabledSalvar(false);
        }
    };

    const handleAlterarVencimentoParcela = (index, e) => {
        const novasParcelas = atualizarDataVencimentoParcela(index, parcelas, e)
        setParcelas(novasParcelas)
    }
    const handleAlterarBoletoParcela = (index, value) => {
        setParcelas((prevParcelas) =>
            prevParcelas.map((parcela, i) =>
                i === index ? { ...parcela, boleto: value } : parcela
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // impede recarregar a página

        try {

            const parcelasPayload = {
                descricao: despesa.descricao,
                financeiro_id: despesa.id,
                quantidadeParcelas: quantidadeParcelas,
                valor: despesa.valor,
                boleto: boleto,
                vencimento: vencimento,
                valorEntrada: converterMoedaParaNumero(valorEntrada),
                tipo_parcelamento: tipoParcelamento,
                parcelas: parcelas.map(parcela => ({
                    numeroParcela: parcela.numeroParcela,
                    dataVencimento: parcela.dataVencimento,
                    valor: parcela.valor,
                    boleto: parcela.boleto || null
                }))
            };

            // Salva as parcelas
            await addParcelasDespesa(parcelasPayload);
            if (onSuccess) onSuccess(); // <-- chamar onSuccess ao final

            // Feedback e fechamento do modal
            setToast({ message: 'Parcelas salvas com sucesso!', type: 'success' });
        } catch (error) {
            console.error(error);
            setToast({ message: 'Erro ao salvar parcelas. Tente novamente.', type: 'error' });
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 relative">
                {/* Botão de fechar */}
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    ✕
                </button>

                {/* Título */}
                <h2 className="text-xl font-semibold mb-4">
                    Lançamento de Parcelas -{" "}
                    {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                    }).format(valorTotal)}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tipo de parcelamento */}
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="mensal"
                                name="tipoParcelamento"
                                checked={tipoParcelamento === "mensal"}
                                onChange={() => setTipoParcelamento("mensal")}
                                className="text-blue-600 focus:ring-blue-500"
                            />
                            Mensal
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="anual"
                                name="tipoParcelamento"
                                checked={tipoParcelamento === "anual"}
                                onChange={() => setTipoParcelamento("anual")}
                                className="text-blue-600 focus:ring-blue-500"
                            />
                            Anual
                        </label>
                    </div>

                    {/* Campos principais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Quantidade de Parcelas:</label>
                            <input
                                type="number"
                                min="1"
                                value={quantidadeParcelas}
                                onChange={(e) =>
                                    setQuantidadeParcelas(Math.max(1, Number(e.target.value)))
                                }
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Data de Vencimento:</label>
                            <input
                                type="date"
                                value={vencimento}
                                onChange={(e) => setVencimento(e.target.value)}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Boleto:</label>
                            <input
                                type="text"
                                value={boleto}
                                onChange={(e) => setBoleto(e.target.value)}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Valor de Entrada:</label>
                            <input
                                type="text"
                                value={valorEntrada}
                                onChange={(e) => setValorEntrada(formatarMoedaBRL(e.target.value))}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Lista de parcelas */}
                    {/* Lista de parcelas */}
                    {parcelas.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-lg font-medium mb-2">Parcelas</h3>
                            {/* container com scroll */}
                            <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                                {parcelas.map((parcela, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center border rounded-lg p-3 bg-white shadow-sm"
                                    >
                                        <span className="font-semibold">
                                            Parcela {parcela.numeroParcela}
                                        </span>
                                        <input
                                            type="date"
                                            value={parcela.dataVencimento}
                                            onChange={(e) =>
                                                handleAlterarVencimentoParcela(index, e.target.value)
                                            }
                                            className="border rounded-lg p-2"
                                        />
                                        <input
                                            type="text"
                                            value={parcela.boleto || ""}
                                            onChange={(e) =>
                                                handleAlterarBoletoParcela(index, e.target.value)
                                            }
                                            className="border rounded-lg p-2"
                                        />
                                        <input
                                            type="text"
                                            value={formatarMoedaBRL(parcela.valor)}
                                            onChange={(e) => handleAlterarParcela(index, e.target.value)}
                                            className="border rounded-lg p-2"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Botão de salvar */}
                    <div className="flex justify-end mt-4">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Salvar Parcelas
                        </button>
                    </div>
                </form>

                {toast.message && (
                    <Toast message={toast.message} type={toast.type} />
                )}
            </div>
        </div>
    );
};

export default ModalLancamentoParcelas;