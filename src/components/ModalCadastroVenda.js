import React, { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import {
    getClientes,
    getProdutosVenda,
    iniciarVenda,
    consultaItensVenda,
    getFuncionarios,
    getEmpresaById,
    registravenda
} from '../services/api';
import { formatarMoedaBRL, converterData } from '../utils/functions';
import SaleModal from './SaleModal';
import Toast from './Toast';

const ModalCadastroVenda = ({ isOpen, onClose, edit, os, onSubmit, onVendaSuccess }) => {
    const [clientes, setClientes] = useState([]);
    const [clienteNome, setClienteNome] = useState('');
    const [clienteBusca, setClienteBusca] = useState('');
    const [clientesFiltrados, setClientesFiltrados] = useState([]);
    const [clienteSelected, setClienteSelected] = useState(false);
    const [cliente_id, setClienteId] = useState(null);
    const [buscaProduto, setBuscaProduto] = useState('');
    const [produtos, setProdutos] = useState([]);
    const [qtd, setQtd] = useState(1);
    const [sugestoes, setSugestoes] = useState([]);
    const [produtosSelecionados, setProdutosSelecionados] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [funcionarioId, setFuncionarioId] = useState('');
    const [toast, setToast] = useState({ message: '', type: '' });
    const [formDataTemp, setFormDataTemp] = useState(null);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);
    const [totalPrice, setTotalPrice] = useState(null);

    useEffect(() => {
        getFuncionarios().then(res => setFuncionarios(res.data));
    }, [edit]);

    useEffect(() => {
        if (edit && os?.tipo === 'venda') {
            consultaItensVenda(os.id).then(res => {
                const itensFormatados = res.data.map(item => ({
                    id: item.id,
                    produto_id: item.produto_id,
                    quantidade: item.quantity,
                    valor_unitario: item.valor_unitario,
                    venda_id: item.venda_id,
                    vlrUnitario: item.vlrUnitario,
                    valorTotal: item.vlrVenda,
                    xProd: item.xProd
                }));

                setProdutosSelecionados(itensFormatados);
            });

            setClienteNome(os.cliente || '');
            setClienteBusca(os.cliente || '');
            setFuncionarioId(os.funcionario_id || '');
        }
    }, [edit, os]);

    useEffect(() => {
        if (!clienteSelected) {
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
            if (!edit) {
                const res = await getClientes({ nome });
                setClientesFiltrados(res.data);
            }
        } catch {
            setToast({ message: 'Erro ao buscar clientes', type: 'error' });
        }
    }, 500);

    const buscarProdutos = async (termo) => {
        if (termo.length < 3) return;
        const res = await getProdutosVenda({ termo });
        setSugestoes(res);
    };

    const adicionarProduto = (produto) => {
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
            let dataHoje = new Date().toLocaleString().replace(',', '');
            let dataAjustada = converterData(dataHoje);

            // Obter dados do usuário e empresa
            const username = localStorage.getItem('username');
            if (!username) {
                throw new Error('Usuário não autenticado');
            }

            // Obter dados da empresa
            const empresaResponse = await getEmpresaById(1);
            if (!empresaResponse?.data) {
                throw new Error('Dados da empresa não encontrados');
            }
            // Calcular o total antes de criar o objeto vendaData
            const calculatedTotal = calcularTotal();
            setTotalPrice(calculatedTotal); // Atualiza o estado se necessário
            // Preparar dados da venda
            const vendaData = {
                cliente_id,
                cliente: clienteNome,
                products: produtosSelecionados,
                funcionarioId,
                totalPrice: calculatedTotal,
                dataVenda: dataAjustada,
                login: username,
                empresa: empresaResponse.data
            };

            // Registrar a venda
            const response = await registravenda(vendaData);

            // Feedback de sucesso
            setToast({
                message: "Venda cadastrada com sucesso!",
                type: "success"
            });

            // Fechar modais e atualizar a página
            setIsSaleModalOpen(false);
            onClose(); // Fecha o modal principal

            // Atualizar os dados sem recarregar toda a página (melhor performance)
            // window.location.reload(); // Removido - não é a melhor prática
            if (typeof onVendaSuccess === 'function') {
                onVendaSuccess(); // Callback para atualizar dados
            }

        } catch (err) {
            console.error('Erro ao cadastrar venda:', err);

            // Tratamento aprimorado de erros
            let errorMessage = "Erro ao cadastrar Venda.";

            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setToast({
                message: errorMessage,
                type: "error",
                duration: 5000 // 5 segundos para mensagens de erro
            });
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl p-6 relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-red-600 font-bold text-lg">×</button>
                <h2 className="text-2xl font-semibold mb-4">{edit ? 'Editar Venda' : 'Nova Venda'}</h2>

                {/* Cliente */}
                <div className="mb-4 relative">
                    <label className="block text-sm font-medium">Cliente</label>
                    <input
                        type="text"
                        value={clienteBusca}
                        onChange={e => setClienteBusca(e.target.value)}
                        placeholder="Nome ou CPF/CNPJ"
                        disabled={edit}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                    />

                    {clientesFiltrados.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-200 max-h-48 overflow-y-auto shadow-lg mt-1 rounded">
                            {clientesFiltrados.map(cliente => (
                                <li
                                    key={cliente.id}
                                    onClick={() => {
                                        setClienteSelected(true);
                                        setClienteId(cliente.id);
                                        setClienteNome(cliente.nome);
                                        setClienteBusca(cliente.nome);
                                        setClientesFiltrados([]);
                                    }}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                >
                                    {cliente.nome} - {cliente.cpfCnpj}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Funcionário */}
                <div className="mb-4">
                    <label className="block text-sm font-medium">Funcionário Responsável</label>
                    <select
                        value={funcionarioId}
                        onChange={e => setFuncionarioId(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                    >
                        <option value="">Selecione um funcionário</option>
                        {funcionarios.map(func => (
                            <option key={func.id} value={func.id}>
                                {func.cliente?.nome || func.nome}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Produto - Seção de seleção */}
                <div className="mb-4">
                    <label className="block text-sm font-medium">Produtos</label>

                    {produtoSelecionado ? (
                        <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded">
                            <div className="flex-1">
                                <p className="font-medium">{produtoSelecionado.xProd}</p>
                                <p className="text-sm text-gray-600">{formatarMoedaBRL(produtoSelecionado.vlrVenda)}</p>
                            </div>
                            <input
                                type="number"
                                min="1"
                                value={qtd}
                                onChange={e => setQtd(Number(e.target.value))}
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-center"
                            />
                            <button
                                onClick={() => adicionarProduto(produtoSelecionado)}
                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                                Adicionar
                            </button>
                            <button
                                onClick={() => {
                                    setProdutoSelecionado(null);
                                    setQtd(1);
                                }}
                                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <>
                            {os?.status_id !== 2 && (<div className="flex items-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={buscaProduto}
                                    onChange={e => {
                                        setBuscaProduto(e.target.value);
                                        buscarProdutos(e.target.value);
                                    }}
                                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                                    placeholder="Buscar produto"
                                />
                            </div>)}

                            {sugestoes.length > 0 && (
                                <ul className="border border-gray-200 rounded max-h-40 overflow-y-auto">
                                    {sugestoes.map(prod => (
                                        <li
                                            key={prod.id}
                                            onClick={() => {
                                                setProdutoSelecionado(prod);
                                                setBuscaProduto('');
                                                setSugestoes([]);
                                            }}
                                            className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                                        >
                                            <span>{prod.xProd}</span>
                                            <span className="font-medium">{formatarMoedaBRL(prod.vlrVenda)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>

                {/* Tabela de produtos selecionados */}
                <div className="overflow-x-auto mb-4">
                    <table className="w-full table-auto text-sm border">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left">Produto</th>
                                <th className="p-2">Qtd</th>
                                <th className="p-2">Unitário</th>
                                <th className="p-2">Total</th>
                                <th className="p-2">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {produtosSelecionados.map((p, i) => (
                                <tr key={i}>
                                    <td className="p-2">{p.xProd}</td>
                                    <td className="p-2 text-center">{p.quantidade}</td>
                                    <td className="p-2 text-center">{formatarMoedaBRL(p.valor_unitario)}</td>
                                    <td className="p-2 text-center">{formatarMoedaBRL(p.valorTotal)}</td>
                                    <td className="p-2 text-center">
                                        {os?.status_id !== 2 && (<button
                                            onClick={() => removerProduto(i)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Remover
                                        </button>)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold">
                                <td colSpan="3" className="text-right p-2">Total:</td>
                                <td className="p-2">{formatarMoedaBRL(calcularTotal())}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="mt-6 text-right">
                    {os?.status_id !== 2 && (<button
                        onClick={handleAddVenda}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                        Finalizar Venda
                    </button>)}
                </div>
            </div>

            {toast.message && <Toast message={toast.message} type={toast.type} />}
            {isSaleModalOpen && (
                <SaleModal
                    isOpen={isSaleModalOpen}
                    onSubmit={onSubmit}
                    saleData={formDataTemp}
                    onClose={() => setIsSaleModalOpen(false)}
                    tipo="venda"
                />
            )}
        </div>
    );
};

export default ModalCadastroVenda;