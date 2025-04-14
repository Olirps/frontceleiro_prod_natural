import React, { useState, useEffect } from 'react';
import { getClientes, getProdutos, getAllOSStatus, getVeiculos, getFuncionarios, removerProdutoOS, consultaItensVenda } from '../services/api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission';
import Select from 'react-select';
import { formatarMoedaBRL, converterMoedaParaNumero, converterData } from '../utils/functions'; // Funções para formatar valores
import '../styles/ModalCadastroOS.css';
import ModalCadastraCarroSimplificado from '../components/ModalCadastraCarroSimplificado';
import ModalCadastraClienteSimplificado from '../components/ModalCadastraClienteSimplificado';
import ModalCadastraMaoObra from '../components/ModalCadastraMaoObra';
import SaleModal from '../components/SaleModal';
import ConfirmDialog from '../components/ConfirmDialog'; // Componente para o modal de confirmação


const ModalCadastroOS = ({ isOpen, onClose, edit, onSubmit, ordemServico, os, tipo, venda, vendaFinalizada, onVendaFinalizada }) => {
    const [termoBusca, setTermoBusca] = useState('');
    const [clientes, setClientes] = useState([]);
    const [clienteNome, setClienteNome] = useState('');
    const [produtosServicos, setProdutosServicos] = useState([]);
    const [osStatuses, setOsStatuses] = useState([]);
    const [funcionariosSelecionados, setFuncionariosSelecionados] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [clienteId, setClienteId] = useState('');
    const [veiculoId, setVeiculoId] = useState('');
    const [produtoServicoId, setProdutoServicoId] = useState('');
    const [statusId, setStatusId] = useState(tipo === 'venda' ? 3 : 1); // ID do status padrão (1 - Pendente)
    const [observacoes, setObservacoes] = useState('');
    const [veiculos, setVeiculos] = useState([]);
    const [veiculoNome, setVeiculoNome] = useState('');
    const [produtosSelecionados, setProdutosSelecionados] = useState([]);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [permiteEditar, setPermiteEditar] = useState(true);
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
    const [clientesFiltrados, setClientesFiltrados] = useState([]);
    const [loadingClientes, setLoadingClientes] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [produtoRetirado, setProdutoRetirado] = useState();
    const [formDataTemp, setFormDataTemp] = useState();
    let [permiteVisualizar, setPermiteVisualizar] = useState(true);

    useEffect(() => {
        // Desabilita visualização se status_id = 3 ou status = 0
        setPermiteVisualizar(!(os?.status_id === 3 || os?.status === 0));
    }, [os]);



    const [paymentData, setPaymentData] = useState({
        formasPagamento: [],
        valorTotal: 0
    });


    const { permissions } = useAuth();

    // Verifica permissões
    useEffect(() => {
        if (isOpen && edit) {
            const canEdit = hasPermission(permissions, 'os', edit ? 'edit' : 'insert');
            setPermiteEditar(canEdit);
        }
    }, [isOpen, edit, permissions]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Carrega dados iniciais
    useEffect(() => {
        const fetchData = async () => {

            try {
                const [produtosServicosData, veiculosData, funcionariosData, osStatusesData] = await Promise.all([
                    getProdutos(),
                    getVeiculos(),
                    getFuncionarios(),
                    getAllOSStatus({ ativo: 1 }),
                ]);
                setProdutosServicos(produtosServicosData.data);
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
                setClienteId(os.cliente_id || '');
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
            }
        };

        carregarDados();
    }, [ordemServico]);


    const handleGetCliente = async () => {
        try {
            setLoadingClientes(true);
            const clientesData = await getClientes()
            setClientes(clientesData.data);
        } catch (error) {
            setToast({ message: "Erro ao Buscar Clientes", type: "error" });
            console.error('Erro ao buscar Clientes:', error);
        } finally {
            setLoadingClientes(false);
        }
    }

    const handleFiltrarClientes = (termo) => {
        setTermoBusca(termo);

        // Limpa se termo estiver vazio ou só com espaços
        if (!termo.trim()) {
            setClientesFiltrados([]);
            return;
        }

        // Pré-processamento do termo (executado uma vez)
        const termoLimp = termo.toLowerCase().replace(/[^a-z0-9 ]/g, ''); // Adicionei um espaço dentro dos colchetes
        const termoSomenteNumeros = termoLimp.replace(/[^0-9]/g, '');

        // Só filtra se houver algo para buscar (evita includes(""))
        if (!termoLimp) {
            setClientesFiltrados([]);
            return;
        }

        const filtro = clientes.filter(cliente => {
            const nome = cliente.nome.toLowerCase();
            const cpfCnpj = cliente.cpfCnpj.replace(/[^0-9]/g, '');

            // Verifica se o termo limpo está no nome
            const matchNome = termoLimp && nome.includes(termoLimp);

            // Verifica se há números e se estão no CPF/CNPJ
            const matchCpf = termoSomenteNumeros && termoSomenteNumeros.length >= 3 &&
                cpfCnpj.includes(termoSomenteNumeros);

            return matchNome || matchCpf;
        });
        if (filtro.length == 0) {
            setClientesFiltrados([]);
        } else {
            setClientesFiltrados(filtro);
        }


    };
    const handleBuscarProduto = (termo) => {
        setBuscaProduto(termo);

        const resultados = produtosServicos.filter((produto) => {
            const codBarras = produto.cEAN ? String(produto.cEAN).toLowerCase() : "";
            const codInterno = produto.cod_interno ? String(produto.cod_interno).toLowerCase() : "";
            const nomeProduto = produto.xProd ? produto.xProd.toLowerCase() : "";

            return (
                codBarras.includes(termo) ||
                codInterno.includes(termo) ||
                nomeProduto.includes(termo.toLowerCase())
            );
        });

        setSugestoes(resultados);
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


    const handleRemover = async () => {
        try {
            
            const produtoRemovido = await removerProdutoOS(produtoRetirado,produtosSelecionados);
            setProdutosSelecionados(produtosSelecionados.filter(p => p.produto_id !== produtoRetirado));
            setToast({ message: "Item Removido com Sucesso !", type: "sucess" });
        } catch (error) {
            console.error('Erro ao buscar dados:', error);

            setToast({ message: "Insira um cliente !", type: "error" });
        } finally {
            setIsConfirmationModalOpen(false);
        }
    }
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

        // Verifica se todos os campos obrigatórios foram preenchidos
        const camposObrigatoriosPreenchidos = produtosSelecionados.length > 0 && clienteId && produtosSelecionados.every(produto => {
            const quantidadeValida = produto.quantidade > 0;
            const valorValido = produto.valor_unitario ? produto.valor_unitario : produto.vlrVenda > 0;
            const clienteValido = clienteId;
            return quantidadeValida && valorValido && clienteValido;
        });
        if (!camposObrigatoriosPreenchidos) {
            if (!clienteId) {
                setToast({ message: "Insira um cliente !", type: "error" });
            } else {
                setToast({ message: "Insira pelo menos um produto ou serviço !", type: "error" });
            }
            return;
        }
        // Verifica se o status é "Concluída" (assumindo que o ID do status concluído é conhecido)
        // 05-04-2025 ajustado de produtos_servicos para products para igualar as rotinas de OS e Venda
        const statusConcluido = osStatuses.find(s => s.id == statusId)?.id;
        let dataHoje = new Date().toLocaleString().replace(',', '');
        let dataAjustada = converterData(dataHoje);

        // 07-04-2025 alterado termoBusca para clienteNome 
        const formData = {
            cliente_id: clienteId,
            cliente_nome: clienteNome ? clienteNome : termoBusca,
            products: produtosSelecionados.map(p => ({
                id: p.id ? p.id : p.produto_servico_id,
                xProd: p.xProd,
                valor_unitario: p.vlrVenda ? p.vlrVenda : p.valor_unitario,
                vlrVenda: p.vlrVenda ? p.vlrVenda : p.valor_unitario, // Inclui o valor de venda
                valorTotal: p.valorTotal,
                quantidade: p.quantidade || 1, // Inclui a quantidade
                funcionario_id: p.funcionarioId
            })),
            status_id: statusId,
            observacoes: observacoes,
            veiculo_id: veiculoId,
            data_criacao: dataAjustada,
            funcionarios: funcionariosSelecionados, // 07-04-2025 removi .map(f => f.value),
            totalPrice: calcularValorTotal(), // Inclui o valor total da OS // 07-05-2025 Ajustado de valor_total para totalPrice para igualar o nome do banco
        };
        try {

            if (statusConcluido === 3) {
                setFormDataTemp(formData);
                setIsSaleModalOpen(true);
            } else {
                await onSubmit(formData);
                setToast({ message: "Ordem de Serviço salva com sucesso!", type: "success" });
                onClose();
            }
        } catch (err) {
            setToast({ message: "Erro ao salvar Ordem de Serviço", type: "error" });
        }
    };

    const handlePaymentSubmit = async (dadosPagamento) => {
        try {
            let dataHoje = new Date().toLocaleString().replace(',', '');
            let dataAjustada = converterData(dataHoje);

            dadosPagamento.tipoVenda = 'Venda';
            dadosPagamento.dataVenda = dataAjustada;
            dadosPagamento.status = 0;
            dadosPagamento.formapgto_id = dadosPagamento.id

            await onSubmit(dadosPagamento);
            setToast({ message: "Venda registrada com sucesso!", type: "success" });
        } catch (error) {
            setToast({ message: "Erro ao registrar venda", type: "error" });
        } finally {
            setIsSaleModalOpen(false);
            setFormDataTemp(null);
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
        <div className="os-modal-overlay">
            <div className="os-modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2 className="os-modal-title">{edit ? tipo === 'venda' ? (os.id + ' - Venda - ' + os.cliente) : (os.id + ' - Ordem de Serviço - ' + os.cliente_nome + (os.veiculo ? '/ ' + os.veiculo + ' ' + os.placa : '')) : tipo === 'venda' ? ('Lançar Venda') : ('Cadastrar Ordem de Serviço')}</h2>
                <form className="os-form" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}>
                    <div className="os-form-row">
                        {/* Campo Cliente */}
                        <div className="os-form-group">
                            {<input type="hidden" name="clienteId" value={clienteId} />}
                            <label htmlFor="cliente" className="os-form-label">Cliente</label>
                            <div className="os-form-input-group">
                                <input
                                    onFocus={handleGetCliente}
                                    type="text"
                                    value={edit && clienteNome ? clienteNome : termoBusca}
                                    onChange={(e) => handleFiltrarClientes(e.target.value)}
                                    placeholder={loadingClientes ? "Carregando clientes..." : "Digite o nome ou CPF/CNPJ"}
                                    className="os-form-input"
                                    disabled={os?.tipo === 'venda' || os?.status_id == 3}
                                />
                                {clienteOptions.length > 0 && termoBusca.length > 2 && (
                                    <ul className="autocomplete-list">
                                        {clienteOptions.map((cliente) => (
                                            <li
                                                key={cliente.value}
                                                className={`os-form-dropdown-item ${cliente.value === clienteId ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setClienteId(cliente.value);
                                                    setTermoBusca(cliente.label); // Atualiza o input com o nome do cliente selecionado
                                                    setClientesFiltrados([]); // Fecha a lista após seleção
                                                    setClientes([]);
                                                }}
                                            >
                                                {cliente.label} - {cliente.cpfCnpj}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {permiteVisualizar && (<button type="button" className="os-form-button-add" onClick={handleAbrirModalCliente}>
                                    + Novo Cliente
                                </button>)}
                            </div>
                        </div>

                        {/* Campo Veículo */}
                        {tipo !== 'venda' &&
                            (<div className="os-form-group">
                                <label htmlFor="veiculo_nome" className="os-form-label">Veículo</label>
                                <div className="os-form-input-group">
                                    <Select
                                        options={veiculoOptions}
                                        value={veiculoOptions.find(option => option.value === veiculoId)}
                                        onChange={(selectedOption) => setVeiculoId(selectedOption.value)}
                                        isDisabled={!permiteEditar || os?.status_id == 3}
                                        placeholder="Selecione o Veículo"
                                        className="os-form-select"

                                    />
                                    {permiteVisualizar && (<button type="button" className="os-form-button-add" onClick={handleAbrirModalVeiculo}>
                                        + Novo Veículo
                                    </button>)}
                                </div>
                            </div>)}
                    </div>
                    <div className="os-form-container">
                        {/* Barra de busca e botão "Adicionar" */}

                        {permiteVisualizar && (<div className="busca-adicionar-container">
                            <input
                                type="text"
                                placeholder="Código de Barras, Código Interno ou Nome"
                                value={buscaProduto}
                                onChange={(e) => handleBuscarProduto(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="input-busca"
                                autoFocus
                            />
                            <div>
                                <label><strong> Quantidade: </strong></label>
                                <input
                                    type="text"
                                    min="1"
                                    placeholder="Qtd"
                                    value={qtdAdicionar}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(',', '.');
                                        if (!isNaN(value) || value === '') {
                                            setQtdAdicionar(value);
                                        }
                                    }}
                                    className="input-busca"
                                />
                            </div>
                            <button
                                type="button"
                                className="botao-adicionar"
                                onClick={handleAdicionarProduto}
                            >
                                Adicionar
                            </button>
                            {tipo !== 'venda' && (<button
                                type="button"
                                className="botao-adicionar"
                                onClick={handleAbrirModalMaoObra}                            >
                                + Mão de Obra
                            </button>)}

                        </div>)}

                        {/* Sugestões de autocompletar */}
                        {sugestoes.length > 0 && (
                            <ul className="autocomplete-list">
                                {sugestoes.map((produto, index) => (
                                    <li
                                        key={produto.id}
                                        onClick={() => handleSelecionarProduto(produto)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={selectedIndex === index ? 'selected' : ''}
                                    >
                                        {produto.xProd} - {formatarMoedaBRL(produto.vlrVenda)}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Lista de Produtos/Serviços Selecionados */}
                        <div className="produtos-selecionados-container">
                            <h4 className="painel-titulo">Produtos/Serviços Selecionados</h4>
                            {/* Tabela (Desktop) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="tabela-produtos">
                                    <thead>
                                        <tr>
                                            <th>Produto/Serviço</th>
                                            <th>Qtd</th>
                                            <th>Valor Unit.</th>
                                            <th>Total</th>
                                            {funcionariosSelecionados.length > 1 && produtosSelecionados.length > 1 && <th>Responsável</th>}
                                            {permiteVisualizar && (<th>Ações</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {produtosSelecionados.map((produto, index) => (
                                            <tr key={`${produto.id}-${index}`}>
                                                <td>{produto.xProd}</td>
                                                <td>{os?.tipo !== 'venda' ? produto.quantidade : produto.quantity}</td>
                                                <td>{formatarMoedaBRL(edit ? (os?.tipo !== 'venda' ? produto.valor_unitario : produto.vlrUnitario) : produto.vlrVenda)}</td>
                                                <td>{formatarMoedaBRL(os?.tipo !== 'venda' ? (produto.tipo === 'servico' ? produto.vlrVenda : produto.valorTotal) : produto.vlrVenda)}</td>
                                                {funcionariosSelecionados.length > 1 && produtosSelecionados.length > 1 && (
                                                    <td>
                                                        <select
                                                            value={produto.funcionarioId || ""}
                                                            onChange={(e) => handleVinculoFuncionario(produto.id || produto.produto_servico_id, e.target.value)}
                                                            className="select-responsavel"
                                                            disabled={!permiteVisualizar}
                                                        >
                                                            <option value="">Selecione</option>
                                                            {funcionariosSelecionados.map((func) => (
                                                                <option key={func.value} value={func.value}>
                                                                    {func.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                )}
                                                {permiteVisualizar && (<td>
                                                    <button
                                                        type="button"
                                                        className="botao-remover"
                                                        onClick={() => handleRemoverProduto(index)}
                                                    >
                                                        Remover
                                                    </button>
                                                </td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: "right", fontWeight: "bold" }}>Total:</td>
                                            <td>{formatarMoedaBRL(calcularValorTotal())}</td>
                                            {os?.tipo !== 'venda' && (<td></td>)}
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Informação do Funcionario */}

                    {tipo !== 'venda' && (<div className="os-form-row">
                        <div className="os-form-group">
                            <label htmlFor="funcionarios">Funcionários Responsáveis</label>
                            <Select
                                options={funcionarioOptions}
                                value={funcionariosSelecionados}
                                onChange={(selectedOptions) => setFuncionariosSelecionados(selectedOptions || [])}
                                isMulti
                                placeholder="Selecione os Funcionários"
                                className="os-form-select"
                                isDisabled={os?.status_id == 3} // Desabilita se status_id NÃO for 3
                            />
                        </div>
                    </div>)}

                    {/* Outros campos */}
                    <div className="os-form-row">
                        <div className="os-form-group">
                            <label htmlFor="status" className="os-form-label">Status</label>
                            <select
                                id="status"
                                name="status"
                                value={statusId}
                                onChange={handleChangeStatus}
                                disabled={!permiteEditar || os?.tipo === 'venda' || os?.status_id == 3}
                                className="os-form-select"
                                required
                            >
                                {tipo !== 'venda' && <option value="">Selecione o Status</option>}
                                {osStatuses.map((status) => (
                                    <option key={status.id} value={status.id}>{status.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="os-form-group">
                        <label htmlFor="observacoes" className="os-form-label">Observações</label>
                        <textarea
                            id="observacoes"
                            name="observacoes"
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            disabled={!permiteEditar}
                            className="os-form-textarea"
                            maxLength="500"
                        />
                    </div>
                    {/* Botão de Salvar */}
                    <div className="os-form-actions">
                        {permiteEditar && permiteVisualizar && (
                            <button onClick={handleFormSubmit} className="os-form-button-submit">
                                Salvar
                            </button>
                        )}
                    </div>
                </form>
            </div >
            {toast.message && <Toast type={toast.type} message={toast.message} />}
            {/* Modais de Cadastro */}
            <ModalCadastraClienteSimplificado
                isOpen={showNovoClienteModal}
                onClose={() => setShowNovoClienteModal(false)}
                tipo={tipo}
                onClienteAdicionado={(cliente) => {
                    setClientes([...clientes, cliente]);
                    setClienteId(cliente.id);
                    setTermoBusca(cliente.nome);
                    setToast({ message: "Cliente cadastrado com sucesso!", type: "success" });
                }}
                onVeiculoAdicionado={(veiculo) => {
                    setVeiculos([...veiculos, veiculo]);
                    setVeiculoId(veiculo.id);
                    setToast({ message: "Veículo cadastrado com sucesso!", type: "success" });

                }}
            />
            <ModalCadastraCarroSimplificado
                isOpen={showNovoVeiculoModal}
                onClose={() => setShowNovoVeiculoModal(false)}
                onVeiculoAdicionado={(veiculo) => {
                    setVeiculos([...veiculos, veiculo]);
                    setVeiculoId(veiculo.id);
                    setToast({ message: "Veículo cadastrado com sucesso!", type: "success" });
                }}
            />
            <ModalCadastraMaoObra
                isOpen={showMaoObraModal}
                onClose={() => setShowMaoObraModal(false)}
                onMOAdicionado={(mo) => {
                    mo.quantidade = 1;
                    mo.valor_unitario = mo.valorTotal;
                    setProdutosSelecionados([...produtosSelecionados, mo]);
                    setToast({ message: "Mão de Obra cadastrada com sucesso!", type: "success" });
                }}
            />
            {/* Modal de Confirmação */}
            <ConfirmDialog
                isOpen={isConfirmationModalOpen}
                onClose={handleCancel}
                onConfirm={() => handleRemover()}
                onCancel={() => setIsConfirmationModalOpen(false)}
                message="Você tem certeza que deseja removar o item ?"
            />
            {isSaleModalOpen && (
                <SaleModal
                    isOpen={isSaleModalOpen}
                    onSubmit={handlePaymentSubmit}
                    tipo={tipo}
                    saleData={formDataTemp}
                    onClose={() => setIsSaleModalOpen(false)}
                />
            )}
        </div >
    );
};

export default ModalCadastroOS;