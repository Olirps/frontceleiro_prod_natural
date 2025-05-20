import React, { useState, useEffect } from 'react';
import ModalPesquisaGN from '../components/ModalPesquisaGN';
import { vinculaProdutoNF, addProdutos } from '../services/api';
import '../styles/ModalTratarProdutosNF.css'; // Certifique-se de criar este CSS também
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog'; // Componente para o modal de confirmação


const ModalTratarProdutosNF = ({ isOpen, onClose, products, product, onVinculoSuccess, similares }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isPesquisaGNModalOpen, setIsPesquisaGNModalOpen] = useState(false);
    const [produto, setProduto] = useState('');
    const [novoNome, setNovoNome] = useState(product.descricao);
    const [produtoId, setProdutoId] = useState('');
    const [vinculoSuccess, setVinculoSuccess] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Novo estado
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);



    // Função para abrir o modal de pesquisa
    const openPesquisaGNModal = () => setIsPesquisaGNModalOpen(true);
    const closePesquisaGNModal = () => setIsPesquisaGNModalOpen(false);

    // Atualiza o produto selecionado
    const handleSelectProduto = (selectedProduto) => {
        setProduto(selectedProduto.xProd);
        setProdutoId(selectedProduto.id);

        setIsConfirmationModalOpen(true);
    };

    // Filtra produtos existentes com base na pesquisa
    // Exibe o toast por 3 segundos e depois o oculta
    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => {
                setToast({ message: '', type: '' });
            }, 3000);

            return () => clearTimeout(timer); // Limpa o timer ao desmontar
        }
    }, [toast, vinculoSuccess]);

    if (!isOpen || !product) return null;

    // Atualiza o estado da busca
    const handleSearchChange = (event) => setSearchQuery(event.target.value);

    // Função para salvar o produto
    const handleSave = async () => {
        try {
            setIsSaving(true); // Desabilita o botão
            const produto_ori_id = { produto_ori_id: product.id };
            await addProdutos(produto_ori_id);
            onVinculoSuccess("Produto Cadastrado com sucesso!"); // Chama a função do modal pai
            onClose();

        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao cadastrar produto.";
            setToast({ message: errorMessage, type: "error" });
        } finally {
            setIsSaving(false); // Desabilita o botão

        }
    };

    // Função para vincular produto
    const handleVincular = async () => {
        if (!produtoId) {
            setToast({ message: "Selecione um produto antes de vincular.", type: "error" });
            return;
        }
        const produto_ori_id = product.id;
        const { nota_id, quantidade, valor_unit } = product;
        const tipo_movimentacao = "entrada";
        const produtoVinculado = { produto_ori_id, nota_id, produto, valor_total: valor_unit, produto_id: produtoId, tipo_movimentacao, quantidade };

        try {
            await vinculaProdutoNF(produto_ori_id, produtoVinculado);
            onVinculoSuccess("Produto vinculado com sucesso!"); // Chama a função do modal pai
            onClose();
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao atualizar produto.";
            setToast({ message: errorMessage, type: "error" });
        } finally {
            setLoading(false); // Desabilita o botão
            setIsConfirmationModalOpen(false);

        }
    };

    const handleCancel = () => {
        setIsConfirmationModalOpen(false); // Fechar o modal sem realizar nada
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                {loading ? (
                    <div className="spinner"></div>
                ) : (
                    <>
                        <div>
                            <h2>Tratar Produto: {product.descricao}</h2>
                            <button className="button-geral" onClick={openPesquisaGNModal}>Pesquisar Produto</button>
                            <div id='produto-vinculado'>
                                <div id='cadastro-padrao'>
                                    <div>
                                        <label htmlFor="novoNome">Nome Nota:</label>
                                        <input
                                            className="input-geral"
                                            type="text"
                                            id="novoNome"
                                            value={novoNome}
                                            onChange={e => setNovoNome(e.target.value)}
                                            placeholder="Digite o novo nome do produto"
                                        />
                                    </div>
                                    <div >
                                        <label htmlFor="produtoId">ID: {produtoId}</label>
                                        <input
                                            className='input-geral'
                                            type="text"
                                            value={produto}
                                            onChange={handleSearchChange}
                                            readOnly
                                            required
                                        />
                                    </div>
                                </div>
                                <div id="separator-bar"></div>
                                <div id="results-container">
                                    <div id="grid-padrao-container">
                                        <table id="grid-padrao">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Nome</th>
                                                    <th>EAN</th>
                                                    <th>Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {similares && similares.length > 0 ? (
                                                    similares.map((sim, idx) => (
                                                        <tr key={sim.produto.id || idx}>
                                                            <td>{sim.produto.id}</td>
                                                            <td>{sim.produto.xProd}</td>
                                                            <td>{sim.cEAN || 'SEM GTIN'}</td>
                                                            <td>
                                                                <button
                                                                    className="button-geral"
                                                                    type="button"
                                                                    onClick={() => handleSelectProduto(sim.produto)}
                                                                >
                                                                    Vincular
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" style={{ textAlign: 'center' }}>Nenhum produto similar encontrado.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {/* Botões de ação */}
                                <div id='button-group'>
                                    <button
                                        className="button-geral"
                                        onClick={handleSave}
                                        disabled={isSaving}>
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modal de pesquisa de produtos */}
            <ModalPesquisaGN
                isOpen={isPesquisaGNModalOpen}
                onClose={closePesquisaGNModal}
                onSelectProduto={handleSelectProduto}
            />
            <ConfirmDialog
                isOpen={isConfirmationModalOpen}
                onClose={handleCancel}
                onConfirm={() => handleVincular()}
                onCancel={() => setIsConfirmationModalOpen(false)}
                message={`Você tem certeza que deseja Vincular o Produto ID: ${produtoId || ''} -  ${produto || ''} na NFe?`}
            />
            {/* Exibir Toast */}
            <Toast message={toast.message} type={toast.type} />
        </div>
    );
};

export default ModalTratarProdutosNF;
