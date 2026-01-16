import React, { useState, useEffect } from 'react';
import Toast from '../components/Toast';
import { formatarMoedaBRL, converterMoedaParaNumero } from '../utils/functions';
import ConfirmarLancarParcelas from '../components/ConfirmarLancarParcelas';
import ModalPesquisaCredor from '../components/ModalPesquisaCredor';
import ModalLancamentoParcelas from '../components/ModalLancamentoParcelas';
import { calcularParcelas, atualizarValorParcela, atualizarDataVencimentoParcela } from '../utils/parcelasUtils';

const ModalMovimentacaoFinanceiraReceitas = ({ isOpen, onConfirmar, onSubmit, edit, onClose, movimentacao, onSuccess }) => {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [tipoCredor, setTipoCredor] = useState('');
    const [credor, setCredor] = useState('');
    const [dataVencimento, setDataVencimento] = useState('');
    const [tipo, setTipo] = useState('credito');
    const [despesaAdicionada, setDespesaAdicionada] = useState('');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [tipoParcelamento, setTipoParcelamento] = useState('mensal');
    const [mensagem, setMensagem] = useState('');
    const [isModalPesquisaOpen, setIsModalPesquisaOpen] = useState(false);
    const [credorSelecionado, setCredorSelecionado] = useState(null);
    const [lancarParcelas, setLancarParcelas] = useState('');
    const [isModalParcelasOpen, setIsModalParcelasOpen] = useState(false);
    const [disabledSalvar, setDisabledSalvar] = useState(false);
    const [cancelarLancto, setCancelarLancto] = useState(false);
    const [despesaRecorrente, setDespesaRecorrente] = useState('cotaunica');
    const [valorEntradaDespesa, setValorEntradaDespesa] = useState(0);
    const [parcelas, setParcelas] = useState([]);
    const [parcelas_old, setParcelas_old] = useState([]);
    const [boleto, setBoleto] = useState('');

    const handleAlterarParcela = (index, e) => {
        const parcelasOldCopia = JSON.parse(JSON.stringify(parcelas_old));
        const novasParcelas = atualizarValorParcela(index, parcelas, e);

        const handleError = (message) => {
            setParcelas(parcelasOldCopia);
            setDisabledSalvar(true);
            setToast({ message, type: "error" });
        };

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
        const novasParcelas = atualizarDataVencimentoParcela(index, parcelas, e);
        setParcelas(novasParcelas);
    };

    const handleAlterarBoletoParcela = (index, value) => {
        setParcelas((prevParcelas) =>
            prevParcelas.map((parcela, i) =>
                i === index ? { ...parcela, boleto: value } : parcela
            )
        );
    };

    useEffect(() => {
        if (despesaRecorrente === 'parcelada' && lancarParcelas && dataVencimento) {
            const novasParcelas = calcularParcelas(valor, valorEntradaDespesa, lancarParcelas, dataVencimento, tipoParcelamento);
            setParcelas(novasParcelas);
            setParcelas_old(novasParcelas);
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
            if (movimentacao?.id && edit) {
                setDescricao(movimentacao.descricao || '');
                setValor(String(movimentacao.valor || ''));
                setDataVencimento(movimentacao.data_vencimento || '');
                setTipo(movimentacao.tipo || 'credito');

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
                setTipo('credito');
                setCredorSelecionado(null);
                setLoading(false);
            }
        }
    }, [isOpen, movimentacao, edit]);

    const handleTipoCredor = (tipo) => {
        setTipoCredor(tipo);
    };

    const handleLancaParcelas = () => {
        setIsModalParcelasOpen(true);
    };

    const handleCancelar = () => {
        if (!movimentacao) return;
        setCancelarLancto(true);
        setMensagem('Deseja realmente excluir esta receita?');
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmCancelamento = async () => {
        onConfirmar(movimentacao);
    };

    const handleSaveParcelas = (parcelas) => {
        setToast({ message: "Parcelas salvas com sucesso!", type: "success" });
        onSuccess();
        onClose();
    };

    const handleOpenPesquisaCredito = () => {
        setIsModalPesquisaOpen(true);
    };

    const handleSelectCredor = (credor) => {
        setCredorSelecionado(credor);
        setIsModalPesquisaOpen(false);
    };

    const handleCredor = (e) => {
        const { value } = e.target;
        setCredor(value);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-xl">
                    <h2 className="text-2xl font-semibold text-gray-800">
                        {movimentacao ? "Editar Crédito a Receber" : "Cadastrar Crédito a Receber"}
                    </h2>
                    <button
                        className="text-gray-500 hover:text-red-500 text-2xl font-bold transition-colors"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="p-6">
                        {/* Botão Pesquisar Cliente */}
                        <div className="mb-6">
                            <button
                                type="button"
                                onClick={handleOpenPesquisaCredito}
                                className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium"
                            >
                                🔍 Pesquisar Cliente
                            </button>
                        </div>

                        {/* Campos Principais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Cliente */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cliente *
                                </label>
                                <input type="hidden" name="tipoCredor" value={tipoCredor} />
                                <input type="hidden" name="credorSelecionado" value={credorSelecionado?.id || credor} />
                                <input
                                    type="text"
                                    name="credorSelecionado"
                                    value={credorSelecionado ? (credorSelecionado.nome || credorSelecionado.cliente?.nome) : credor}
                                    onChange={handleCredor}
                                    placeholder="Selecionar ou informe o cliente"
                                    disabled={credorSelecionado}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    required
                                />
                            </div>

                            {/* Descrição */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição *
                                </label>
                                <input
                                    type="text"
                                    name="descricao"
                                    value={descricao.toUpperCase()}
                                    onChange={(e) => setDescricao(e.target.value.toUpperCase())}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Boleto */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Boleto
                                </label>
                                <input
                                    type="text"
                                    name="boleto"
                                    value={boleto}
                                    onChange={(e) => setBoleto(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Valor */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valor *
                                </label>
                                <input
                                    type="text"
                                    name="valor"
                                    value={valor}
                                    onChange={(e) => setValor(formatarMoedaBRL(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Data de Vencimento */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Data de Vencimento *
                                </label>
                                <input
                                    type="date"
                                    name="dataVencimento"
                                    value={dataVencimento}
                                    onChange={(e) => setDataVencimento(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Tipo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo *
                                </label>
                                <select
                                    name="tipo"
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="credito">Crédito</option>
                                </select>
                            </div>
                        </div>

                        {/* Tipo de Despesa */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                Tipo de Lançamento
                            </h3>
                            <div className="flex flex-wrap gap-4">
                                {[
                                    { value: 'cotaunica', label: 'Cota Única' },
                                    { value: 'recorrente', label: 'Recorrente' },
                                    { value: 'parcelada', label: 'Parcelada' }
                                ].map((opcao) => (
                                    <label key={opcao.value} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value={opcao.value}
                                            name="despesaRecorrente"
                                            checked={despesaRecorrente === opcao.value}
                                            onChange={() => {
                                                setDespesaRecorrente(opcao.value);
                                                if (opcao.value !== 'parcelada') setLancarParcelas('');
                                            }}
                                            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{opcao.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Campos de Parcelamento */}
                        {despesaRecorrente === 'parcelada' && (
                            <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
                                <h4 className="text-md font-semibold text-gray-700 mb-3">
                                    Configuração de Parcelas
                                </h4>

                                {/* Tipo de Parcelamento */}
                                <div className="flex gap-6 mb-4">
                                    {[
                                        { value: 'mensal', label: 'Mensal' },
                                        { value: 'anual', label: 'Anual' }
                                    ].map((tipo) => (
                                        <label key={tipo.value} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value={tipo.value}
                                                name="tipoParcelamento"
                                                checked={tipoParcelamento === tipo.value}
                                                onChange={() => setTipoParcelamento(tipo.value)}
                                                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">{tipo.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Campos de Configuração */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Quantidade de Parcelas */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Quantidade de Parcelas *
                                        </label>
                                        <input
                                            type="number"
                                            name="lancarParcelas"
                                            value={lancarParcelas}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                const intValue = parseInt(value, 10);
                                                setLancarParcelas(Math.max(1, intValue || 0));
                                            }}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                            min="1"
                                        />
                                    </div>

                                    {/* Vencimento da Primeira Parcela */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vencimento 1ª Parcela *
                                        </label>
                                        <input
                                            type="date"
                                            name="dataVencimento"
                                            value={dataVencimento}
                                            onChange={(e) => setDataVencimento(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    {/* Valor de Entrada */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Valor de Entrada
                                        </label>
                                        <input
                                            type="text"
                                            name="valorEntradaDespesa"
                                            value={valorEntradaDespesa}
                                            onChange={(e) => setValorEntradaDespesa(formatarMoedaBRL(e.target.value))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Exibição das Parcelas */}
                        {despesaRecorrente === 'parcelada' && lancarParcelas && dataVencimento && parcelas.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                    Parcelas Geradas ({parcelas.length})
                                </h3>
                                <input type="hidden" name="parcelas" value={JSON.stringify(parcelas)} />
                                
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {parcelas.map((parcela, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow"
                                        >
                                            {/* Número da Parcela */}
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Parcela
                                                </label>
                                                <div className="px-3 py-2 bg-gray-100 rounded-lg text-center font-semibold text-gray-700">
                                                    {parcela.numeroParcela}
                                                </div>
                                            </div>

                                            {/* Vencimento */}
                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Vencimento
                                                </label>
                                                <input
                                                    type="date"
                                                    name={`parcelas[${index}].dataVencimento`}
                                                    value={parcela.dataVencimento}
                                                    onChange={(e) => handleAlterarVencimentoParcela(index, e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>

                                            {/* Boleto */}
                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Boleto
                                                </label>
                                                <input
                                                    type="text"
                                                    name={`parcelas[${index}].boleto`}
                                                    value={parcela.boleto || ''}
                                                    onChange={(e) => handleAlterarBoletoParcela(index, e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Nº do boleto"
                                                />
                                            </div>

                                            {/* Valor */}
                                            <div className="md:col-span-4">
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Valor
                                                </label>
                                                <input
                                                    type="text"
                                                    name={`parcelas[${index}].valor`}
                                                    value={formatarMoedaBRL(parcela.valor)}
                                                    onChange={(e) => handleAlterarParcela(index, e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Botões de Ação */}
                        <div className="flex flex-col-reverse md:flex-row gap-3 mt-6 pt-6 border-t">
                            <button
                                type="submit"
                                disabled={disabledSalvar}
                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                💾 Salvar
                            </button>
                            
                            {movimentacao && (
                                <button
                                    type="button"
                                    onClick={handleCancelar}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors font-medium"
                                >
                                    🗑️ Excluir
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {toast.message && <Toast message={toast.message} type={toast.type} />}
            </div>

            {/* Modais Auxiliares */}
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

            {isModalPesquisaOpen && (
                <ModalPesquisaCredor
                    isOpen={isModalPesquisaOpen}
                    onClose={() => setIsModalPesquisaOpen(false)}
                    onSelectCredor={handleSelectCredor}
                    onTipoCredor={handleTipoCredor}
                    tipoLancto={'credito'}
                />
            )}

            {isModalParcelasOpen && (
                <ModalLancamentoParcelas
                    isOpen={isModalParcelasOpen}
                    onClose={() => setIsModalParcelasOpen(false)}
                    valorTotal={valor}
                    despesa={despesaAdicionada}
                    onSave={handleSaveParcelas}
                />
            )}
        </div>
    );
};

export default ModalMovimentacaoFinanceiraReceitas;