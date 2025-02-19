import React, { useState, useEffect } from 'react';
import ModalPesquisaGN from '../components/ModalPesquisaGN';
import { vinculaProdutoNF, addProdutos } from '../services/api';
import '../styles/ModalTratarProdutosNF.css'; // Certifique-se de criar este CSS também
import Toast from '../components/Toast';


const ModalTratarProdutosNF = ({ isOpen, onClose, products, product, onVinculoSuccess }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isPesquisaGNModalOpen, setIsPesquisaGNModalOpen] = useState(false);
    const [produto, setProduto] = useState('');
    const [produtoId, setProdutoId] = useState('');
    const [vinculoSuccess, setVinculoSuccess] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Novo estado


    // Função para abrir o modal de pesquisa
    const openPesquisaGNModal = () => setIsPesquisaGNModalOpen(true);
    const closePesquisaGNModal = () => setIsPesquisaGNModalOpen(false);

    // Atualiza o produto selecionado
    const handleSelectProduto = (selectedProduto) => {
        setProduto(selectedProduto.xProd);
        setProdutoId(selectedProduto.id);
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
        const produtoVinculado = { produto_ori_id, nota_id, produto, valor_unit: valor_unit, produto_id: produtoId, tipo_movimentacao, quantidade };

        try {
            await vinculaProdutoNF(produto_ori_id, produtoVinculado);
            onVinculoSuccess("Produto vinculado com sucesso!"); // Chama a função do modal pai
            onClose();
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao atualizar produto.";
            setToast({ message: errorMessage, type: "error" });
        }
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
                            <p>ID: {product.id}</p>
                            <p>Quantidade: {product.quantidade}</p>
                            <p>Identificador: {product.identificador}</p>

                            <div id='produto-vinculado'>
                                {/* Campo de pesquisa */}
                                <div >
                                    <label htmlFor="produtoId">{produtoId}</label>
                                    <input
                                        className='input-geral'
                                        type="text"
                                        value={produto}
                                        onChange={handleSearchChange}
                                        readOnly
                                        required
                                    />
                                </div>

                                {/* Botões de ação */}
                                <div id='button-group'>
                                    <button
                                        className="button-geral"
                                        onClick={handleSave}
                                        disabled={isSaving}>
                                        Salvar
                                    </button>
                                    <button
                                        className="button-geral"
                                        onClick={handleVincular}>
                                        Vincular
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
            {/* Exibir Toast */}
            <Toast message={toast.message} type={toast.type} />
        </div>
    );
};

export default ModalTratarProdutosNF;
