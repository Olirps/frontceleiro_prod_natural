import React, { useState, useEffect } from 'react';
import '../styles/ModalMovimentacaoFinanceiraDespesa.css';
import Toast from '../components/Toast';
import { formatarMoedaBRL, converterMoedaParaNumero } from '../utils/functions';
import ConfirmarLancarParcelas from '../components/ConfirmarLancarParcelas'; // Importando o novo modal
import ModalPesquisaCredor from '../components/ModalPesquisaCredor'; // Importando o modal de pesquisa
import ModalLancamentoParcelas from '../components/ModalLancamentoParcelas'; // Importe o novo modal
import { calcularParcelas, atualizarValorParcela, atualizarDataVencimentoParcela } from '../utils/parcelasUtils'; // Importando a função de cálculo de parcelas

const ModalMovimentacaoFinanceiraDespesa = ({ isOpen, onConfirmar, onSubmit, edit, onClose, movimentacao, onSuccess }) => {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [tipoCredor, setTipoCredor] = useState('');
    const [credor, setCredor] = useState('');
    const [dataVencimento, setDataVencimento] = useState('');
    const [tipo, setTipo] = useState('debito');  // Tipo de movimentação (crédito ou débito)
    const [despesaAdicionada, setDespesaAdicionada] = useState('');  // Tipo de movimentação (crédito ou débito)
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [tipoParcelamento, setTipoParcelamento] = useState('mensal');
    const [mensagem, setMensagem] = useState('');
    const [isModalPesquisaOpen, setIsModalPesquisaOpen] = useState(false);  // Controle do Modal de Pesquisa
    const [credorSelecionado, setCredorSelecionado] = useState(null);  // Crédito selecionado do Modal de Pesquisa
    const [lancarParcelas, setLancarParcelas] = useState(''); // Estado para controlar a opção de parcelamento
    const [isModalParcelasOpen, setIsModalParcelasOpen] = useState(false); // Estado para controlar o modal de parcelas
    const [disabledSalvar, setDisabledSalvar] = useState(false); // Estado para controlar o modal de parcelas
    const [cancelarLancto, setCancelarLancto] = useState(false); // Estado para controlar o modal de parcelas
    const [despesaRecorrente, setDespesaRecorrente] = useState('cotaunica'); // Estado para controlar o modal de parcelas
    const [valorEntradaDespesa, setValorEntradaDespesa] = useState(0); // Estado para controlar o modal de parcelas
    const [parcelas, setParcelas] = useState([]); // Estado para armazenar as parcelas
    const [parcelas_old, setParcelas_old] = useState([]); // Estado para armazenar as parcelas
    const [boleto, setBoleto] = useState(''); // Estado para controlar o modal de parcelas



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
    // Gerar parcelas iniciais quando os dados mudarem
    useEffect(() => {
        if (despesaRecorrente === 'parcelada' && lancarParcelas && dataVencimento) {
            const novasParcelas = calcularParcelas(valor, valorEntradaDespesa, lancarParcelas, dataVencimento, tipoParcelamento);
            setParcelas(novasParcelas);
            setParcelas_old(novasParcelas); // Atualiza o estado das parcelas originais

        }
    }, [valor, valorEntradaDespesa, lancarParcelas, dataVencimento, tipoParcelamento, despesaRecorrente]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        if (isOpen) {
            // Reseta os estados quando o modal é aberto
            if (movimentacao?.id && edit) {
                setDescricao(movimentacao.descricao || '');
                setValor(String(movimentacao.valor || '')); // Convertendo para string
                setDataVencimento(movimentacao.data_vencimento || '');
                setTipo(movimentacao.tipo || 'debito'); // Garante que o tipo esteja correto

                // Verifica o tipo de credor e define o estado adequado
                if (movimentacao.funcionario_id) {
                    setCredorSelecionado(movimentacao.funcionario.cliente);
                } else if (movimentacao.fornecedor_id) {
                    setCredorSelecionado(movimentacao.fornecedor);
                } else if (movimentacao.cliente_id) {
                    setCredorSelecionado(movimentacao.cliente);
                }
                setLoading(false);

            } else {
                setDescricao('');
                setValor('');
                setDataVencimento('');
                setTipo('debito');
                setCredorSelecionado(null); // Reseta o crédito selecionado
                setLoading(false);
            }
        }
    }, [isOpen, movimentacao]);

    const handleTipoCredor = (tipo) => {
        setTipoCredor(tipo); // Aqui, o tipo de credor é atualizado no estado do componente pai
    };

    const handleLancaParcelas = () => {
        setIsModalParcelasOpen(true)
    }

    const handleCancelar = () => {
        if (!movimentacao) return;
        setCancelarLancto(true)
        setMensagem('Deseja realmente excluir esta despesa?')
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmCancelamento = async () => {
        onConfirmar(movimentacao);
    }

    const handleSaveParcelas = (parcelas) => {
        // Aqui você pode enviar as parcelas para o backend ou processá-las conforme necessário
        setToast({ message: "Parcelas salvas com sucesso!", type: "success" });
        onSuccess();
        onClose();
    };


    const handleOpenPesquisaCredito = () => {
        setIsModalPesquisaOpen(true);
    };

    const handleSelectCredor = (credor) => {
        setCredorSelecionado(credor);  // Atualiza o crédito selecionado
        setIsModalPesquisaOpen(false);  // Fecha o modal de pesquisa
    };
    const handleCredor = (e) => {
        const { value } = e.target;
        setCredor(value);
    };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 relative overflow-y-auto max-h-[90vh]">

                {/* Botão de Fechar */}
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-lg font-bold"
                    onClick={onClose}
                >
                    ✕
                </button>

                <h2 className="text-2xl font-semibold mb-4">
                    {movimentacao ? "Editar Despesa" : "Cadastrar Despesa"}
                </h2>

                <div className="mb-4">
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                        onClick={handleOpenPesquisaCredito}
                    >
                        Pesquisar Credor
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
                    </div>
                ) : (
                    <>
                        <form onSubmit={onSubmit} className="space-y-6">

                            {/* Campos principais */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Credor</label>
                                    <input type="hidden" name="tipoCredor" value={tipoCredor} />
                                    <input type="hidden" name="credorSelecionado" value={credorSelecionado?.id || credor} />
                                    <input
                                        type="text"
                                        name="credorSelecionado"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                        value={credorSelecionado ? (credorSelecionado.nome || credorSelecionado.cliente?.nome) : credor}
                                        onChange={handleCredor}
                                        placeholder="Selecionar ou Informe o Credor"
                                        disabled={credorSelecionado}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                                    <input
                                        type="text"
                                        name="descricao"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        value={descricao.toUpperCase()}
                                        onChange={(e) => setDescricao(e.target.value.toUpperCase())}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Boleto</label>
                                    <input
                                        type="text"
                                        name="boleto"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        value={boleto}
                                        onChange={(e) => setBoleto(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Valor</label>
                                    <input
                                        type="text"
                                        name="valor"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        value={valor}
                                        onChange={(e) => setValor(formatarMoedaBRL(e.target.value))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                                    <input
                                        type="date"
                                        name="dataVencimento"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        value={dataVencimento}
                                        onChange={(e) => setDataVencimento(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                                    <select
                                        name="tipo"
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="debito">Débito</option>
                                    </select>
                                </div>
                            </div>

                            {/* Tipo de despesa */}
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Tipo de Despesa</h2>
                                <div className="flex gap-6">
                                    {["cotaunica", "recorrente", "parcelada"].map((op) => (
                                        <label key={op} className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                value={op}
                                                name="despesaRecorrente"
                                                checked={despesaRecorrente === op}
                                                onChange={() => {
                                                    setDespesaRecorrente(op);
                                                    if (op === "parcelada") setLancarParcelas("");
                                                }}
                                            />
                                            {op === "cotaunica" && "Cota Única"}
                                            {op === "recorrente" && "Recorrente"}
                                            {op === "parcelada" && "Parcelada"}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Campos de parcelamento */}
                            {despesaRecorrente === "parcelada" && (
                                <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                value="mensal"
                                                name="tipoParcelamento"
                                                checked={tipoParcelamento === "mensal"}
                                                onChange={() => setTipoParcelamento("mensal")}
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
                                            />
                                            Anual
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Quantidade de Parcelas</label>
                                            <input
                                                type="number"
                                                name="lancarParcelas"
                                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                                value={lancarParcelas}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, "");
                                                    const intValue = parseInt(value, 10);
                                                    setLancarParcelas(Math.max(1, intValue || 0));
                                                }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Vencimento da Primeira Parcela</label>
                                            <input
                                                type="date"
                                                name="dataVencimento"
                                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                                value={dataVencimento}
                                                onChange={(e) => setDataVencimento(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Valor de Entrada</label>
                                            <input
                                                type="text"
                                                name="valorEntradaDespesa"
                                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                                value={valorEntradaDespesa}
                                                onChange={(e) => setValorEntradaDespesa(formatarMoedaBRL(e.target.value))}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {despesaRecorrente === "parcelada" && lancarParcelas && dataVencimento && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold mb-3">Parcelas</h3>

                                    {/* mantém o hidden como no comportamento anterior */}
                                    <input type="hidden" name="parcelas" value={parcelas} />

                                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                        {parcelas.map((parcela, index) => (
                                            <div
                                                key={index}
                                                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border rounded-lg p-3 bg-white"
                                            >
                                                <div className="md:col-span-2">
                                                    <div className="text-sm text-gray-600">Parcela</div>
                                                    <div className="text-base font-medium">{parcela.numeroParcela}</div>
                                                </div>

                                                <div className="md:col-span-3">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Vencimento
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name={`parcelas[${index}].dataVencimento`}
                                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                                        value={parcela.dataVencimento}
                                                        onChange={(e) =>
                                                            handleAlterarVencimentoParcela(index, e.target.value)
                                                        }
                                                    />
                                                </div>

                                                <div className="md:col-span-4">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Boleto
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name={`parcelas[${index}].boleto`}
                                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                                        value={parcela.boleto || ""}
                                                        onChange={(e) => handleAlterarBoletoParcela(index, e.target.value)}
                                                    />
                                                </div>

                                                <div className="md:col-span-3">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Valor
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name={`parcelas[${index}].valor`}
                                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                                        value={formatarMoedaBRL(parcela.valor)}
                                                        onChange={(e) => handleAlterarParcela(index, e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Botões */}
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 disabled:opacity-50"
                                    disabled={disabledSalvar}
                                >
                                    Salvar
                                </button>
                                {movimentacao && (
                                    <button
                                        type="button"
                                        className="px-5 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
                                        onClick={handleCancelar}
                                    >
                                        Excluir
                                    </button>
                                )}
                            </div>
                        </form>
                    </>
                )}

                {toast.message && <Toast message={toast.message} type={toast.type} />}
                {isConfirmDialogOpen && (
                    <ConfirmarLancarParcelas
                        isOpen={isConfirmDialogOpen}
                        message={mensagem}
                        cancelarLancto={cancelarLancto}
                        onConfirmar={handleConfirmCancelamento}
                        onConfirm={cancelarLancto ? handleConfirmCancelamento : handleLancaParcelas}
                        onCancel={() => setIsConfirmDialogOpen(false)}
                    />
                )}

                <ModalPesquisaCredor
                    isOpen={isModalPesquisaOpen}
                    onClose={() => setIsModalPesquisaOpen(false)}
                    onSelectCredor={handleSelectCredor}
                    onTipoCredor={handleTipoCredor}
                />

                <ModalLancamentoParcelas
                    isOpen={isModalParcelasOpen}
                    onClose={() => setIsModalParcelasOpen(false)}
                    valorTotal={valor}
                    despesa={despesaAdicionada}
                    onSave={handleSaveParcelas}
                />
            </div>
        </div>
    );

};

export default ModalMovimentacaoFinanceiraDespesa;