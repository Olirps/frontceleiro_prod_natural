// components/ModalCadastroOS.js
import React, { useState, useEffect, useRef } from 'react';
import { getProdutosVenda, iniciarVenda, getAllOSStatus, getVeiculos, getFuncionarios, removerProdutoOS, consultaItensVenda } from '../services/api';
import { getClientes } from '../services/ApiClientes/ApiClientes';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";
import Select from 'react-select';
import { formatarMoedaBRL, converterMoedaParaNumero, converterData } from '../utils/functions'; // Funções para formatar valores
import '../styles/ModalCadastroOS.css';
import ModalCadastraCarroSimplificado from '../components/ModalCadastraCarroSimplificado';
import ModalCadastraClienteSimplificado from '../components/ModalCadastraClienteSimplificado';
import ModalCadastraMaoObra from '../components/ModalCadastraMaoObra';
import SaleModal from '../components/SaleModal';
import ConfirmDialog from '../components/ConfirmDialog'; // Componente para o modal de confirmação
import { useClientesBusca } from "../hooks/useClientesBusca";


const ModalCadastroOS = ({ isOpen, onClose, edit, onSubmit, ordemServico, os, tipo, venda, vendaFinalizada, onVendaFinalizada }) => {
    const timerRef = useRef(null);
    const itemRefs = useRef([]);
    const [termoBusca, setTermoBusca] = useState('');
    const [clientes, setClientes] = useState([]);
    const [produtosServicos, setProdutosServicos] = useState([]);
    const [osStatuses, setOsStatuses] = useState([]);
    const [funcionariosSelecionados, setFuncionariosSelecionados] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [veiculoId, setVeiculoId] = useState('');
    const [produtoServicoId, setProdutoServicoId] = useState('');
    const [statusId, setStatusId] = useState(tipo === 'venda' ? 3 : 1); // ID do status padrão (1 - Pendente)
    const [observacoes, setObservacoes] = useState('');
    const [chaveAcesso, setChaveAcesso] = useState('');
    const [veiculos, setVeiculos] = useState([]);
    const [veiculoNome, setVeiculoNome] = useState('');
    const [produtosSelecionados, setProdutosSelecionados] = useState([]);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [permiteEditar, setPermiteEditar] = useState(false);
    const [showNovoClienteModal, setShowNovoClienteModal] = useState(false);
    const [showNovoVeiculoModal, setShowNovoVeiculoModal] = useState(false);
    const [showMaoObraModal, setShowMaoObraModal] = useState(false);
    const [qtdAdicinar, setQtdAdicinar] = useState(1); // Estado para a quantidade
    const [quantidade, setQuantidade] = useState(1); // Estado para a quantidade
    const [valorTotalProduto, setValorTotalProduto] = useState(1); // Estado para a quantidade
    const [buscaProduto, setBuscaProduto] = useState("");
    const [qtdAdicionar, setQtdAdicionar] = useState(1);
    const [sugestoes, setSugestoes] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1); // Índice do item selecionado
    const [loadingClientes, setLoadingClientes] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [produtoRetirado, setProdutoRetirado] = useState();
    const [formDataTemp, setFormDataTemp] = useState();
    const [vendaRegistrada, setVendaRegistrada] = useState();
    let [permiteVisualizar, setPermiteVisualizar] = useState(true);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [temMaisProdutos, setTemMaisProdutos] = useState(true);
    const [preVenda, setPreVenda] = useState('');
    //Permissoes
    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);
    // 🔎 Hook de busca de cliente (já usado em outros módulos)
    const {
        clienteBusca,
        setClienteBusca,
        clientesFiltrados,
        setClientesFiltrados,
        setClienteSelected,
        clienteId,
        setClienteId,
        clienteNome,
        setClienteNome,
    } = useClientesBusca(false, setToast);

    useEffect(() => {
        // Desabilita visualização se status_id = 3 ou status = 0
        setPermiteVisualizar(!(os?.status_id === 3 || os?.status === 0));
    }, [os]);

    const [paymentData, setPaymentData] = useState({
        formasPagamento: [],
        valorTotal: 0
    });

    // Verifica permissões
    useEffect(() => {
        if (isOpen) {
            checkPermission('os', edit ? 'edit' : 'insert', () => {
                setPermiteEditar(true);
            })
        }
    }, [isOpen, edit, permissions]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast, isSaving]);

    // Carrega dados iniciais
    useEffect(() => {
        const fetchData = async () => {
            try {

                let dataHoje = new Date().toLocaleString().replace(',', '');
                let DataHora = converterData(dataHoje);
                setLoading(true);
                if (!edit) {
                    const vendaIniciada = await iniciarVenda({ DataHora });
                    setPreVenda(vendaIniciada.id);
                }
                const [veiculosData, funcionariosData, osStatusesData] = await Promise.all([
                    getVeiculos(),
                    getFuncionarios(),
                    getAllOSStatus({ ativo: 1 }),
                ]);
                setVeiculos(veiculosData.data);
                setFuncionarios(funcionariosData.data);
                setOsStatuses(osStatusesData.data);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Preenche dados da OS em edição
    useEffect(() => {
        const carregarDados = async () => {
            if (os && os.tipo !== 'venda') {
                const produtosComFuncionarios = os.products.map(produto => {
                    const funcionarioResponsavel = os.funcionarios.find(
                        func => func.servico_id === produto.os_produtoserice_id
                    );
                    return {
                        ...produto,
                        funcionarioId: funcionarioResponsavel ? funcionarioResponsavel.funcionario_id : null,
                        produto_id: produto.os_produtoserice_id
                    };
                });
                setProdutosSelecionados(produtosComFuncionarios || []);

                const funcionariosSelecionados = os.funcionarios.map(funcionario => ({
                    value: funcionario.funcionario_id,
                    label: funcionario.funcionario_nome
                }));
                setClienteNome(os.cliente_nome || '');
                setFuncionariosSelecionados(funcionariosSelecionados);
                setVeiculoId(os.veiculo_id || '');
                setVeiculoNome(os.veiculo_nome || '');
                setClienteBusca(os.cliente_nome || '');
                setClienteId(os.cliente_id || '');
                setClienteSelected(true);   // 🔥 ISSO É A CHAVE
                setClientesFiltrados([]);   // limpa qualquer resíduo
                setStatusId(os.status_id || 1);
                setObservacoes(os.observacoes || '');
            } else if (os?.tipo === 'venda') {
                try {
                    const produtos = await consultaItensVenda(os.id);
                    setProdutosSelecionados(produtos.data || []);
                } catch (error) {
                    console.error("Erro ao buscar itens da venda:", error);
                }
                setClienteNome(os.cliente || 'Não Informado');
                setChaveAcesso(os.chave_acesso || '');
            }
        };

        carregarDados();
    }, [ordemServico]);


    const handleBuscarProduto = (termo) => {
        setBuscaProduto(termo);

        // Limpa o timer anterior se o usuário continuar digitando
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Só vai chamar a API depois de 500ms sem digitar
        timerRef.current = setTimeout(async () => {
            if (termo.length >= 3) {
                setPaginaAtual(1);
                const produtosVenda = await getProdutosVenda({ termo }, 1);
                setProdutosServicos(produtosVenda);
                setSugestoes(produtosVenda);
                setTemMaisProdutos(produtosVenda.length === 30);
            } else if (termo.length === 0) {
                setProdutosServicos([]);
                setSugestoes([]);
                setBuscaProduto('');
                setTemMaisProdutos(false);
            }
        }, 500); // 500ms de atraso
    };



    const handleCarregarMais = async () => {
        const proximaPagina = paginaAtual + 1;
        const novosProdutos = await getProdutosVenda({ termo: buscaProduto }, proximaPagina);

        setProdutosServicos(prev => [...prev, ...novosProdutos]);
        setSugestoes(prev => [...prev, ...novosProdutos]);
        setPaginaAtual(proximaPagina);

        // Se não trouxe 30 produtos, significa que já acabou
        setTemMaisProdutos(novosProdutos.length === 30);
    };

    const handleSelecionarProduto = (produto) => {
        if (produto) {
            setProdutoServicoId(produto.id);
            setBuscaProduto(produto.xProd);
            setSugestoes([]); // Esconde sugestões
        } else if (produtoServicoId) {
            handleAdicionarProduto();
        } else {
            setToast({ message: "Insira pelo menos um produto ou serviço !", type: "error" });
        }

    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            // Se pressionar "Seta para baixo", mover para o próximo item
            setSelectedIndex((prevIndex) => (prevIndex + 1) % sugestoes.length);
        } else if (e.key === 'ArrowUp') {
            // Se pressionar "Seta para cima", mover para o item anterior
            setSelectedIndex((prevIndex) => (prevIndex - 1 + sugestoes.length) % sugestoes.length);
        } else if (e.key === 'Enter' && selectedIndex !== -1) {
            // Se pressionar "Enter", selecionar o item destacado
            handleSelecionarProduto(sugestoes[selectedIndex]);
        }
    };


    const handleAdicionarProduto = () => {
        if (!produtoServicoId) return;

        const produto = produtosServicos.find((p) => p.id === produtoServicoId);


        let valor = (produto.vlrVenda * qtdAdicionar).toFixed(3); // Retorna 15.86

        valor = Math.round(valor * 100) / 100;

        const novoProduto = {
            id: produto.id,
            xProd: produto.xProd,
            quantidade: qtdAdicionar,
            valor_unitario: produto.vlrVenda,
            valorTotal: valor
        };

        setProdutosSelecionados([...produtosSelecionados, novoProduto]);
        setBuscaProduto("");
        setQtdAdicionar(1);
        setSugestoes([])

        setProdutoServicoId('');
    };

    // Remove produto/serviço da lista
    const handleRemoverProduto = async (index) => {
        const produtoRemovido = produtosSelecionados[index];
        const produto = produtoRemovido.os_produtoserice_id;

        if (edit && produto) {
            // Modo edição: Pega o ID do produto no índice e marca para remoção
            setProdutoRetirado(produtoRemovido.os_produtoserice_id); // Assume que `produtoRemovido.id` existe

            setIsConfirmationModalOpen(true);
        } else {
            // Modo normal: Remove diretamente pelo índice
            const novosProdutos = [...produtosSelecionados];
            novosProdutos.splice(index, 1);
            setProdutosSelecionados(novosProdutos);
        }
    };

    const handleCancel = () => {
        setIsConfirmationModalOpen(false); // Fechar o modal sem realizar nada
    };

    // Calcula o valor total da OS
    const calcularValorTotal = () => {
        return produtosSelecionados.reduce((total, produto) => {
            let valor;
            if (String(produto.vlrVenda).startsWith('R$')) {
                valor = converterMoedaParaNumero(produto.vlrVenda);
            } else {
                valor = produto.vlrVenda ? (Number(os?.tipo !== 'venda' ? produto.vlrVenda : produto.vlrUnitario) * Number(os?.tipo !== 'venda' ? produto.quantidade : produto.quantity)).toFixed(3) : (Number(produto.valor_unitario) * Number(produto.quantidade)).toFixed(3);
            }
            valor = Math.round(valor * 100) / 100;

            let totalSoma = Number(total);
            let valorSoma = Number(valor);
            let desconto = Number(produto.desconto) || 0;
            let resultado = ((totalSoma + valorSoma) - desconto).toFixed(2) || 0;
            return resultado;
        }, 0);
    };

    const handleVinculoFuncionario = (produtoId, funcionarioId) => {
        if (edit) {
            handleVinculoFuncionarioEdicao(produtoId, funcionarioId);
        } else {
            handleVinculoFuncionarioCadastro(produtoId, funcionarioId);
        }
    };

    const handleVinculoFuncionarioCadastro = (produtoId, funcionarioId) => {
        setProdutosSelecionados(prevProdutos =>
            prevProdutos.map(produto =>
                produto.id === produtoId
                    ? {
                        ...produto,
                        funcionarioId,
                        funcionarioNome: funcionarios.find(f => f.id === funcionarioId)?.cliente.nome || ''
                    }
                    : produto
            )
        );
    };

    const handleVinculoFuncionarioEdicao = (produtoServicoId, funcionarioId) => {
        setProdutosSelecionados(prevProdutos =>
            prevProdutos.map(produto =>
                produto.produto_servico_id === produtoServicoId
                    ? {
                        ...produto,
                        funcionarioId,
                        funcionarioNome: funcionarios.find(f => f.id === funcionarioId)?.cliente.nome || ''
                    }
                    : produto
            )
        );
    };

    const handleChangeStatus = (e) => {
        const { value } = e.target;
        setStatusId(value);
    }

    // Funções de controle dos modais auxiliares
    const handleAbrirModalCliente = () => setShowNovoClienteModal(true);
    const handleAbrirModalVeiculo = () => setShowNovoVeiculoModal(true);
    const handleAbrirModalMaoObra = () => {
        setSugestoes([]);
        setShowMaoObraModal(true);
    }


    // Envia o formulário
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // =========================
            // ✅ VALIDAÇÕES
            // =========================
            const camposObrigatoriosPreenchidos =
                produtosSelecionados.length > 0 &&
                clienteId &&
                produtosSelecionados.every(produto => {
                    const quantidadeValida = produto.quantidade > 0;
                    const valorValido = produto.valor_unitario
                        ? produto.valor_unitario > 0
                        : produto.vlrVenda > 0;

                    return quantidadeValida && valorValido;
                });

            if (!clienteId) {
                throw new Error("cliente");
            }

            if (!camposObrigatoriosPreenchidos) {
                throw new Error("produtos");
            }

            // =========================
            // 📦 DADOS
            // =========================
            const statusConcluido = osStatuses.find(s => s.id == statusId)?.id;

            const dataHoje = new Date().toLocaleString().replace(',', '');
            const dataAjustada = converterData(dataHoje);

            const formData = {
                preVenda,
                cliente_id: clienteId,
                cliente_nome: clienteNome || termoBusca,
                products: produtosSelecionados.map(p => ({
                    id: p.id || p.produto_servico_id,
                    xProd: p.xProd,
                    valor_unitario: p.vlrVenda || p.valor_unitario,
                    vlrVenda: p.vlrVenda || p.valor_unitario,
                    valorTotal: p.valorTotal,
                    quantidade: p.quantidade || 1,
                    funcionario_id: p.funcionarioId
                })),
                status_id: statusId,
                observacoes,
                veiculo_id: veiculoId,
                status_id: 2,
                data_criacao: dataAjustada,
                funcionarios: funcionariosSelecionados,
                totalPrice: calcularValorTotal()
            };

            // =========================
            // 🚀 SUBMIT
            // =========================
            if (statusConcluido === 3) {
                setFormDataTemp(formData);
                setIsSaleModalOpen(true);
            } else {
                await onSubmit(formData);
                setToast({
                    message: "Ordem de Serviço salva com sucesso!",
                    type: "success"
                });
                onClose();
            }

        } catch (err) {
            // =========================
            // ❌ TRATAMENTO DE ERROS
            // =========================
            if (err.message === "cliente") {
                setToast({ message: "Insira um cliente!", type: "error" });
            } else if (err.message === "produtos") {
                setToast({ message: "Insira pelo menos um produto ou serviço válido!", type: "error" });
            } else {
                setToast({ message: "Erro ao salvar Ordem de Serviço", type: "error" });
            }

        } finally {
            // =========================
            // 🔄 SEMPRE EXECUTA
            // =========================
            setIsSaving(false);
        }
    };


    // Opções para os dropdowns
    const clienteOptions = clientesFiltrados.length > 0
        ? clientesFiltrados.map(cliente => ({
            value: cliente.id,
            label: cliente.nome,
            cpfCnpj: cliente.cpfCnpj
        }))
        : '';
    const veiculoOptions = veiculos.map(veiculo => ({ value: veiculo.id, label: veiculo.modelo + ' / ' + veiculo.placa }));
    const produtoOptions = produtosServicos.map(produto => ({ value: produto.id, label: produto.xProd }));


    const funcionarioOptions = funcionarios.map(funcionario => ({ value: funcionario.id, label: funcionario.cliente.nome }));

    if (!isOpen) return null;
    if (loading) return <div className="os-spinner-container"><div className="os-spinner"></div></div>;


    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center">
            <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-6xl rounded-t-2xl md:rounded-2xl flex flex-col overflow-hidden">

                {/* =====================================================
       HEADER — CONTEXTO CLARO
    ====================================================== */}
                <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
                    <div className="min-w-0">
                        {/* CONTEXTO */}
                        <p className="text-xs text-gray-500">
                            {tipo === "venda" ? "Venda / Orçamento" : "Ordem de Serviço"}
                        </p>

                        {/* TÍTULO PRINCIPAL */}
                        <h2 className="text-base font-semibold truncate">
                            {edit
                                ? os?.cliente_nome || "Cliente não informado"
                                : "Nova Ordem de Serviço"}
                        </h2>

                        {/* INFO AUXILIAR */}
                        {edit && (
                            <p className="text-xs text-gray-400">
                                O.S. #{os.id}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
                        aria-label="Fechar"
                    >
                        ✕
                    </button>
                </header>

                {/* =====================================================
                    BODY — SCROLL
                    ====================================================== */}
                <form
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                    className="flex-1 overflow-y-auto p-4 space-y-6"
                >

                    {/* =====================================================
         MODO 1 — LANÇAMENTO RÁPIDO (CORE)
      ====================================================== */}
                    {permiteVisualizar && (
                        <section className="space-y-4">

                            {/* BUSCA PRODUTO + AUTOCOMPLETE */}
                            <div className="relative">

                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Digite código, nome ou código de barras"
                                    value={buscaProduto}
                                    onChange={(e) => handleBuscarProduto(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full text-lg border rounded-xl px-4 py-3"
                                />

                                {/* AUTOCOMPLETE */}
                                {sugestoes?.length > 0 && (
                                    <ul className="absolute left-0 right-0 mt-1 bg-white border rounded-xl divide-y shadow-lg z-50 max-h-64 overflow-auto">
                                        {sugestoes.map((produto, index) => (
                                            <li
                                                key={produto.id}
                                                ref={(el) => (itemRefs.current[index] = el)}
                                                onClick={() => handleSelecionarProduto(produto)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                className={`px-4 py-3 cursor-pointer ${selectedIndex === index
                                                        ? "bg-blue-100 font-medium"
                                                        : "hover:bg-blue-50"
                                                    }`}
                                            >
                                                <div className="flex justify-between gap-2">
                                                    <span className="truncate">{produto.xProd}</span>
                                                    <span className="text-gray-600">
                                                        {formatarMoedaBRL(produto.vlrVenda)}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}

                                        {temMaisProdutos && (
                                            <li
                                                onClick={handleCarregarMais}
                                                className="text-center py-3 text-blue-600 font-semibold cursor-pointer hover:bg-blue-50"
                                            >
                                                Carregar mais...
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>

                            {/* QUANTIDADE + AÇÕES */}
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Qtd"
                                    value={qtdAdicionar}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(",", ".");
                                        if (!isNaN(value) || value === "") setQtdAdicionar(value);
                                    }}
                                    className="border rounded-xl px-3 py-3 text-center"
                                />

                                <button
                                    type="button"
                                    onClick={handleAdicionarProduto}
                                    className="bg-blue-600 text-white rounded-xl font-semibold"
                                >
                                    Adicionar
                                </button>
                            </div>

                            {/* MÃO DE OBRA */}
                            {tipo !== "venda" && (
                                <button
                                    type="button"
                                    onClick={handleAbrirModalMaoObra}
                                    className="w-full border rounded-xl py-3"
                                >
                                    + Mão de obra
                                </button>
                            )}
                        </section>
                    )}

                    {/* =====================================================
         MODO 2 — ITENS LANÇADOS
      ====================================================== */}
                    <section className="space-y-3">

                        {/* TÍTULO SEMPRE VISÍVEL */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase">
                                Itens lançados
                            </h3>

                            <span className="text-xs text-gray-500">
                                {produtosSelecionados.length} item(ns)
                            </span>
                        </div>

                        {/* MOBILE — CARDS */}
                        <div className="space-y-3 md:hidden">
                            {produtosSelecionados.map((produto, index) => (
                                <div
                                    key={`${produto.id}-${index}`}
                                    className="border rounded-xl p-4 space-y-2"
                                >
                                    <p className="font-medium">{produto.xProd}</p>

                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>
                                            Qtd: {produto.quantidade || produto.quantity}
                                        </span>
                                        <span>
                                            {formatarMoedaBRL(
                                                produto.valorTotal || produto.vlrVenda
                                            )}
                                        </span>
                                    </div>

                                    {permiteVisualizar && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoverProduto(index)}
                                            className="text-sm text-red-600"
                                        >
                                            Remover
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* DESKTOP — TABELA */}
                        <div className="hidden md:block overflow-x-auto border rounded-xl">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Item</th>
                                        <th className="px-3 py-2 text-center">Qtd</th>
                                        <th className="px-3 py-2 text-right">Unit.</th>
                                        <th className="px-3 py-2 text-right">Total</th>
                                        {permiteVisualizar && (
                                            <th className="px-3 py-2 text-center">Ações</th>
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {produtosSelecionados.map((produto, index) => (
                                        <tr
                                            key={`${produto.id}-${index}`}
                                            className="border-t"
                                        >
                                            <td className="px-3 py-2">
                                                {produto.xProd}
                                            </td>

                                            <td className="px-3 py-2 text-center">
                                                {produto.quantidade || produto.quantity}
                                            </td>

                                            <td className="px-3 py-2 text-right">
                                                {formatarMoedaBRL(
                                                    produto.valor_unitario || produto.vlrUnitario
                                                )}
                                            </td>

                                            <td className="px-3 py-2 text-right font-medium">
                                                {formatarMoedaBRL(
                                                    produto.valorTotal || produto.vlrVenda
                                                )}
                                            </td>

                                            {permiteVisualizar && (
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoverProduto(index)}
                                                        className="text-red-600 hover:underline"
                                                    >
                                                        Remover
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </section>


                    {/* =====================================================
         MODO 3 — FINALIZAÇÃO (COLAPSÁVEL)
      ====================================================== */}
                    <section className="border rounded-2xl p-4 md:p-6 space-y-6 bg-white">

                        {/* TÍTULO */}
                        <header className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Dados do Orçamento / OS
                            </h2>
                        </header>

                        {/* CLIENTE */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Cliente
                            </label>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar cliente..."
                                    value={clienteBusca}
                                    onChange={(e) => {
                                        setClienteBusca(e.target.value);
                                        setClienteSelected(false);
                                    }}
                                    className="w-full border rounded-lg px-3 py-3 text-base"
                                />

                                {clientesFiltrados.length > 0 && (
                                    <ul className="absolute z-30 w-full mt-1 max-h-48 overflow-y-auto bg-white border rounded-lg shadow-lg">
                                        {clientesFiltrados.map((c) => (
                                            <li
                                                key={c.id}
                                                onClick={() => {
                                                    setClienteId(c.id);
                                                    setClienteNome(c.nome);
                                                    setClienteBusca(c.nome);
                                                    setClienteSelected(true);
                                                    setClientesFiltrados([]);
                                                }}
                                                className="px-3 py-3 text-sm hover:bg-blue-50 cursor-pointer"
                                            >
                                                {c.nome}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {permiteVisualizar && (
                                <button
                                    type="button"
                                    onClick={handleAbrirModalCliente}
                                    className="text-sm text-blue-600 font-medium"
                                >
                                    + Novo cliente
                                </button>
                            )}
                        </div>

                        {/* GRID CONDICIONAL */}
                        {tipo !== "venda" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* VEÍCULO */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Veículo
                                    </label>

                                    <Select
                                        options={veiculoOptions}
                                        value={veiculoOptions.find(option => option.value === veiculoId)}
                                        onChange={(selectedOption) => setVeiculoId(selectedOption.value)}
                                        isDisabled={!permiteEditar || os?.status_id == 3}
                                        placeholder="Selecione o veículo"
                                    />

                                    {permiteVisualizar && (
                                        <button
                                            type="button"
                                            onClick={handleAbrirModalVeiculo}
                                            className="text-sm text-blue-600 font-medium"
                                        >
                                            + Novo veículo
                                        </button>
                                    )}
                                </div>

                                {/* FUNCIONÁRIOS */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Funcionários
                                    </label>

                                    <Select
                                        options={funcionarioOptions}
                                        value={funcionariosSelecionados}
                                        onChange={(opts) => setFuncionariosSelecionados(opts || [])}
                                        isMulti
                                        placeholder="Selecionar funcionários"
                                    />
                                </div>
                            </div>
                        )}

                        {/* STATUS */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Status
                            </label>

                            <select
                                value={statusId}
                                onChange={handleChangeStatus}
                                className="w-full border rounded-lg px-3 py-3 text-base"
                            >
                                {osStatuses.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* OBSERVAÇÕES */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Observações
                            </label>

                            <textarea
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Ex: orçamento válido por 7 dias, observações técnicas..."
                                className="w-full border rounded-lg px-3 py-3 min-h-[96px]"
                            />
                        </div>

                    </section>

                </form>

                {/* =====================================================
       FOOTER — TOTAL SEMPRE VISÍVEL
    ====================================================== */}
                <footer className="sticky bottom-0 bg-white border-t px-4 py-3 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-xl font-bold">
                            {formatarMoedaBRL(calcularValorTotal())}
                        </p>
                    </div>

                    {permiteEditar && permiteVisualizar && (
                        <button
                            onClick={handleFormSubmit}
                            disabled={isSaving}
                            className={`
            px-6 py-3 rounded-xl font-semibold flex items-center gap-2
            ${isSaving
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700 text-white"}
        `}
                        >
                            {isSaving && (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}

                            <span>
                                {isSaving ? "Salvando..." : "Salvar"}
                            </span>
                        </button>
                    )}

                </footer>

            </div>
            {toast.message && <Toast message={toast.message} type={toast.type} />}

        </div >

    );
};

export default ModalCadastroOS;