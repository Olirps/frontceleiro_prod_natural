import React, { useState, useEffect } from 'react';
import { getClientes } from '../services/ApiClientes/ApiClientes';
import { debounce, set } from 'lodash';
import {
    getProdutosVenda,
    iniciarVenda,
    consultaItensVenda,
    getFuncionarios,
    getEmpresaById
} from '../services/api';
import { registravenda, atualizaVenda } from '../services/ApiVendas/ApiVendas';
import { formatarMoedaBRL, converterData } from '../utils/functions';
import SaleModal from './SaleModal';
import Toast from './Toast';

const ModalCadastroVenda = ({ isOpen, onClose, edit, os, onSubmit, onVendaSuccess, statusVenda, formaPagamento }) => {
    const [clientes, setClientes] = useState([]);
    const [clienteNome, setClienteNome] = useState('');
    const [clienteBusca, setClienteBusca] = useState('');
    const [clientesFiltrados, setClientesFiltrados] = useState([]);
    const [clienteSelected, setClienteSelected] = useState(false);
    const [cliente_id, setClienteId] = useState(null);
    const [buscaProduto, setBuscaProduto] = useState('');
    const [produtos, setProdutos] = useState([]);
    const [chaveAcesso, setChaveAcesso] = useState(null);
    const [qtd, setQtd] = useState(1);
    const [sugestoes, setSugestoes] = useState([]);
    const [produtosSelecionados, setProdutosSelecionados] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [funcionario_id, setFuncionarioId] = useState(null);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [formDataTemp, setFormDataTemp] = useState(null);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [disabled, setDisabled] = useState(true);
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);
    const [totalPrice, setTotalPrice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [vendaId, setVendaId] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const isViewMode = os?.status_id === 2;


    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);


    useEffect(() => {
        getFuncionarios().then(res => setFuncionarios(res.data));
    }, [edit]);

    useEffect(() => {
        if (edit && os?.tipo === 'venda') {
            setIsInitialLoad(true);
            consultaItensVenda(os.id).then(res => {
                const itensFormatados = res.data.map(item => ({
                    id: item.id,
                    produto_id: item.produto_id,
                    quantidade: item.quantity,
                    valor_unitario: item.valor_unitario,
                    venda_id: item.venda_id,
                    valor_unitario: item.vlrUnitario,
                    vlrVenda: item.vlrUnitario,
                    valorTotal: item.vlrVenda,
                    xProd: item.xProd
                }));

                setProdutosSelecionados(itensFormatados);
            });
            setChaveAcesso(os.chave_acesso || null);
            setClienteNome(os.cliente || '');
            setClienteBusca(os.cliente || '');
            setClienteId(os.cliente_id || null);
            setFuncionarioId(os.funcionario_id || null);
            
            // Permite edição do cliente se status_id === 1
            if (os.status_id === 1) {
                setDisabled(false);
            } else {
                setDisabled(true);
            }
            
            // Marca que a carga inicial foi concluída
            setTimeout(() => setIsInitialLoad(false), 100);
        } else {
            setIsInitialLoad(false);
        }
    }, [edit, os]);

    useEffect(() => {
        if (!clienteSelected && !isInitialLoad) {
            buscarClientes(clienteBusca);
            return () => buscarClientes.cancel();
        }
        setClienteSelected(false);
    }, [clienteBusca]);

    const buscarClientes = debounce(async (termo) => {
        if (termo.length < 3) {
            setClientesFiltrados([]);
            return;
        }

        try {
            const nome = termo;
            if (!disabled) {
                const res = await getClientes({ nome });
                setClientesFiltrados(res.data.clientes || []);
            }
        } catch {
            setToast({ message: 'Erro ao buscar clientes', type: 'error' });
        }
    }, 500);

    const buscarProdutos = async (termo) => {
        if (termo.length < 3) {
            setSugestoes([]);
            setSelectedSuggestionIndex(-1);
            return;
        }
        const res = await getProdutosVenda({ termo });
        setSugestoes(res);
        setSelectedSuggestionIndex(-1);
    };

    const adicionarProduto = (produto) => {
        if (produto.tem_promocao) {
            produto.vlrVenda = produto.valor_atual;
        }

        const total = (produto.vlrVenda * qtd).toFixed(2);
        setProdutosSelecionados(prev => [
            ...prev,
            {
                ...produto,
                quantidade: qtd,
                valor_unitario: produto.vlrVenda,
                valorTotal: total
            }
        ]);
        setBuscaProduto('');
        setQtd(1);
        setSugestoes([]);
        setProdutoSelecionado(null);
        setSelectedSuggestionIndex(-1);
    };

    const removerProduto = (index) => {
        const novaLista = [...produtosSelecionados];
        novaLista.splice(index, 1);
        setProdutosSelecionados(novaLista);
    };

    const calcularTotal = () => {
        const total = produtosSelecionados.reduce((acc, p) => acc + (p.valor_unitario * p.quantidade), 0).toFixed(2);
        return total;
    }
    const handleAddVenda = async (e) => {
        try {
            setLoading(true);
            let dataHoje = new Date().toLocaleString().replace(',', '');
            let dataAjustada = converterData(dataHoje);

            const username = localStorage.getItem('username');
            if (!username) {
                throw new Error('Usuário não autenticado');
            }

            const empresaResponse = await getEmpresaById(1);
            if (!empresaResponse?.data) {
                throw new Error('Dados da empresa não encontrados');
            }

            const calculatedTotal = calcularTotal();
            setTotalPrice(calculatedTotal);

            const vendaData = {
                cliente_id,
                cliente: clienteNome,
                products: produtosSelecionados,
                funcionario_id,
                totalPrice: calculatedTotal,
                dataVenda: dataAjustada,
                login: username,
                empresa: empresaResponse.data,
                tipoVenda: 'Venda',
                status_id: 1
            };

            if (edit) {
                await atualizaVenda(os.id, vendaData);
                setVendaId(os.id);
                setToast({
                    message: "Venda atualizada com sucesso!",
                    type: "success"
                });
            } else {
                const response = await registravenda(vendaData);
                setVendaId(response.data.venda?.id || response.data.id);
                setToast({
                    message: "Venda salva com sucesso! Agora você pode finalizá-la.",
                    type: "success"
                });
            }

        } catch (err) {
            console.error('Erro ao cadastrar venda:', err);

            let errorMessage = "Erro ao cadastrar Venda.";

            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setToast({
                message: errorMessage,
                type: "error",
                duration: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFinalizarVenda = () => {
        if (!vendaId && !os?.id) {
            setToast({
                message: "Salve a venda antes de finalizar!",
                type: "error"
            });
            return;
        }

        const calculatedTotal = calcularTotal();
        setTotalPrice(calculatedTotal);

        const vendaData = {
            venda_id: vendaId || os?.id,
            cliente_id,
            cliente_nome: clienteNome,
            cliente: clienteNome,
            totalPrice: calculatedTotal,
            products: produtosSelecionados
        };

        setFormDataTemp(vendaData);
        setIsSaleModalOpen(true);
    };

    const handleSaleModalSuccess = () => {
        setIsSaleModalOpen(false);
        setToast({
            message: "Venda finalizada com sucesso!",
            type: "success"
        });
        onClose();
        if (typeof onVendaSuccess === 'function') {
            onVendaSuccess();
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 bg-white rounded-full p-1 hover:bg-gray-100"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        {statusVenda === 2 ? (
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                        ) : edit ? (
                            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                {statusVenda === 2 ? 'Visualizar Venda' : edit ? 'Editar Venda' : 'Nova Venda'}
                            </h2>
                            {statusVenda === 2 && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                        Venda Finalizada
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        ID: {vendaId}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Grid Layout para melhor organização */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Cliente */}
                    <div className="space-y-4">
                        <h3 className="section-title">Cliente</h3>
                        <div>
                            <label className="field-label">Nome do Cliente</label>
                            {statusVenda === 2 ? (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="value-display">{clienteNome || 'Não informado'}</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={clienteBusca}
                                        onChange={e => setClienteBusca(e.target.value)}
                                        placeholder="Digite nome ou CPF/CNPJ"
                                        disabled={disabled}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                    />

                                    {clientesFiltrados.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                                            {clientesFiltrados.map(cliente => (
                                                <div
                                                    key={cliente.id}
                                                    onClick={() => {
                                                        setClienteSelected(true);
                                                        setClienteId(cliente.id);
                                                        setClienteNome(cliente.nome);
                                                        setClienteBusca(cliente.nome);
                                                        setClientesFiltrados([]);
                                                    }}
                                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                                                >
                                                    <div className="font-medium text-gray-900">{cliente.nome}</div>
                                                    <div className="text-sm text-gray-500">{cliente.cpfCnpj}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Funcionário */}
                    <div className="space-y-4">
                        <h3 className="section-title">Funcionário</h3>
                        <div>
                            <label className="field-label">Responsável</label>
                            {statusVenda === 2 ? (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="value-display">
                                        {funcionarios.find(f => f.id === funcionario_id)?.cliente?.nome ||
                                            funcionarios.find(f => f.id === funcionario_id)?.nome ||
                                            'Não informado'}
                                    </p>
                                </div>
                            ) : (
                                <select
                                    value={funcionario_id}
                                    onChange={e => setFuncionarioId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                                >
                                    <option value="" className="text-gray-500">Selecione um funcionário</option>
                                    {funcionarios.map(func => (
                                        <option key={func.id} value={func.id} className="text-gray-900">
                                            {func.cliente?.nome || func.nome}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                {/* Produtos - Seção */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-title">Produtos</h3>
                        {!disabled && produtosSelecionados.length > 0 && (
                            <div className="text-sm font-medium text-gray-700">
                                Total: <span className="text-lg text-green-600 ml-1">{formatarMoedaBRL(calcularTotal())}</span>
                            </div>
                        )}
                    </div>

                    {/* Adicionar Produto (apenas se não for visualização) */}
                    {os?.status_id !== 2 && !disabled && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={buscaProduto}
                                            onChange={e => {
                                                setBuscaProduto(e.target.value);
                                                buscarProdutos(e.target.value);
                                            }}
                                            onKeyDown={e => {
                                                if (sugestoes.length === 0) return;
                                                
                                                if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    setSelectedSuggestionIndex(prev => 
                                                        prev < sugestoes.length - 1 ? prev + 1 : prev
                                                    );
                                                } else if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    setSelectedSuggestionIndex(prev => 
                                                        prev > 0 ? prev - 1 : -1
                                                    );
                                                } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
                                                    e.preventDefault();
                                                    const produtoSelecionadoNavegacao = sugestoes[selectedSuggestionIndex];
                                                    setProdutoSelecionado(produtoSelecionadoNavegacao);
                                                    setBuscaProduto('');
                                                    setSugestoes([]);
                                                    setSelectedSuggestionIndex(-1);
                                                }
                                            }}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                                            placeholder="Buscar produto por nome..."
                                        />
                                        <svg className="absolute right-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>

                                    {sugestoes.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                                            {sugestoes.map((prod, index) => (
                                                <div
                                                    key={prod.id}
                                                    onClick={() => {
                                                        setProdutoSelecionado(prod);
                                                        setBuscaProduto('');
                                                        setSugestoes([]);
                                                        setSelectedSuggestionIndex(-1);
                                                    }}
                                                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 transition-colors duration-150 ${
                                                        index === selectedSuggestionIndex 
                                                            ? 'bg-blue-100 border-l-4 border-l-blue-500' 
                                                            : 'hover:bg-blue-50'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-900">{prod.xProd}</span>
                                                        <div className="flex items-center gap-3">
                                                            {prod.tem_promocao ? (
                                                                <>
                                                                    <span className="text-sm text-gray-400 line-through">{formatarMoedaBRL(prod.vlrVenda)}</span>
                                                                    <span className="font-bold text-green-600">{formatarMoedaBRL(prod.valor_atual)}</span>
                                                                </>
                                                            ) : (
                                                                <span className="font-bold text-gray-900">{formatarMoedaBRL(prod.vlrVenda)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Preview do produto selecionado */}
                            {produtoSelecionado && (
                                <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{produtoSelecionado.xProd}</h4>
                                            <div className="flex items-center gap-4 mt-1">
                                                {produtoSelecionado.tem_promocao ? (
                                                    <>
                                                        <span className="text-sm text-gray-400 line-through">{formatarMoedaBRL(produtoSelecionado.vlrVenda)}</span>
                                                        <span className="text-lg font-bold text-green-600">{formatarMoedaBRL(produtoSelecionado.valor_atual)}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-lg font-bold text-gray-900">{formatarMoedaBRL(produtoSelecionado.vlrVenda)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Qtd:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={qtd}
                                                    onChange={e => setQtd(Number(e.target.value))}
                                                    className="w-20 border border-gray-300 rounded px-3 py-2 text-center focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <button
                                                onClick={() => adicionarProduto(produtoSelecionado)}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Adicionar
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setProdutoSelecionado(null);
                                                    setQtd(1);
                                                }}
                                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tabela de produtos - Versão melhorada */}
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                        <div className="max-h-80 overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="p-4 text-left text-sm font-semibold text-gray-700">Produto</th>
                                        <th className="p-4 text-center text-sm font-semibold text-gray-700">Quantidade</th>
                                        <th className="p-4 text-center text-sm font-semibold text-gray-700">Unitário</th>
                                        <th className="p-4 text-center text-sm font-semibold text-gray-700">Total</th>
                                        {!disabled && <th className="p-4 text-center text-sm font-semibold text-gray-700">Ações</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {produtosSelecionados.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                    <p>Nenhum produto adicionado</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        produtosSelecionados.map((p, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="p-4">
                                                    <div className="font-medium text-gray-900">{p.xProd}</div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="inline-flex items-center justify-center min-w-12 px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                                                        {p.quantidade}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center font-medium text-gray-900">
                                                    {formatarMoedaBRL(p.valor_unitario)}
                                                </td>
                                                <td className="p-4 text-center font-bold text-gray-900">
                                                    {formatarMoedaBRL(p.valorTotal)}
                                                </td>
                                                {!disabled && (
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => removerProduto(i)}
                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200"
                                                            title="Remover produto"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {produtosSelecionados.length > 0 && (
                                    <tfoot className="bg-gray-50 border-t border-gray-200">
                                        <tr>
                                            <td colSpan={disabled ? 3 : 2} className="p-4 text-right">
                                                <span className="text-lg font-bold text-gray-700">Total Geral:</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="text-2xl font-bold text-green-600">
                                                    {formatarMoedaBRL(calcularTotal())}
                                                </span>
                                            </td>
                                            {!disabled && <td className="p-4"></td>}
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </div>

                {/* Informações adicionais - Layout em grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Formas de Pagamento */}
                    {formaPagamento && formaPagamento.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="section-title">Formas de Pagamento</h3>
                            <div className="space-y-3">
                                {formaPagamento.map((forma, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-600">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{forma.descricao}</div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-lg text-green-600">
                                            {forma.valor ? formatarMoedaBRL(forma.valor) : 'N/A'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chave de Acesso */}
                    {chaveAcesso && (
                        <div className="space-y-4">
                            <h3 className="section-title">Nota Fiscal</h3>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <span className="font-medium text-blue-700">Chave de Acesso</span>
                                </div>
                                <div className="p-3 bg-white rounded border border-blue-100">
                                    <code className="text-sm text-gray-700 break-all font-mono select-all">
                                        {chaveAcesso}
                                    </code>
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <button
                                        onClick={() => navigator.clipboard.writeText(chaveAcesso)}
                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copiar chave
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botões de ação */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex justify-end gap-4">
                        {!disabled && os?.status_id !== 2 && (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={handleAddVenda}
                                    disabled={loading || produtosSelecionados.length === 0}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Salvando...
                                        </>
                                    ) : edit ? (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Atualizar Venda
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                            </svg>
                                            Salvar Venda
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleFinalizarVenda}
                                    disabled={produtosSelecionados.length === 0 || (!vendaId && !edit)}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Finalizar Venda
                                </button>
                            </>
                        )}

                        {disabled && (
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                            >
                                Fechar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {toast.message && <Toast message={toast.message} type={toast.type} />}
            {isSaleModalOpen && (
                <SaleModal
                    isOpen={isSaleModalOpen}
                    saleData={formDataTemp}
                    selectedProducts={produtosSelecionados}
                    totalQuantity={produtosSelecionados.reduce(
                        (sum, p) => sum + Number(p.quantidade || 0),
                        0
                    )}
                    vendaId={vendaId || os?.id}
                    onClose={() => setIsSaleModalOpen(false)}
                    onSuccess={handleSaleModalSuccess}
                    tipo="liquidacao"
                />
            )}
        </div>
    );
};

export default ModalCadastroVenda;