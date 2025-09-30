import React, { useState, useEffect } from 'react';
import ModalPesquisaGN from '../components/ModalPesquisaGN';
import { vinculaProdutoNF, addProdutos, getEmpresaById } from '../services/api';
import '../styles/ModalTratarProdutosNF.css'; // Certifique-se de criar este CSS também
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog'; // Componente para o modal de confirmação
import { use } from 'react';
import ModalInputCFOP from '../components/ModalInputCFOP';


const ModalTratarProdutosNF = ({ isOpen, onClose, products, product, onVinculoSuccess, similares, onProdutoVinculado }) => {
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
    const [confirmAction, setConfirmAction] = useState(null); // 'delete' | 'efetivar'
    const [mensagem, setMensagem] = useState('');
    const [empresa, setEmpresa] = useState('');
    const [isCFOPModalOpen, setIsCFOPModalOpen] = useState(false);
    const [cfopInformado, setCfopInformado] = useState('');
    const [valorVenda, setValorVenda] = useState(0);




    // Função para abrir o modal de pesquisa
    const openPesquisaGNModal = () => setIsPesquisaGNModalOpen(true);
    const closePesquisaGNModal = () => setIsPesquisaGNModalOpen(false);

    // Atualiza o produto selecionado
    const handleSelectProduto = (selectedProduto) => {
        setProduto(selectedProduto.xProd);
        setProdutoId(selectedProduto.id);
        setValorVenda(selectedProduto.vlrVenda);
        setConfirmAction('vincular');
        setIsConfirmationModalOpen(true);
        setMensagem(`Deseja Vincular o produto o CFOP Padrão ID: ${selectedProduto.id} ${selectedProduto.xProd} ?`);
    };



    useEffect(() => {
        if (isOpen) {
            const fetchEmpresa = async () => {
                try {
                    const response = await getEmpresaById(1);
                    setEmpresa(response.data);
                } catch (error) {
                    console.error('Erro ao buscar empresa:', error);
                }
            };
            fetchEmpresa();
        }
    }, [isOpen]);

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

            setConfirmAction('salvar');
            setIsConfirmationModalOpen(true);
            setMensagem(`Deseja utilizar o CFOP Padrão ? ${empresa.cfop_padrao}`);

        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao cadastrar produto.";
            setToast({ message: errorMessage, type: "error" });
        } finally {
            setIsSaving(false); // Desabilita o botão

        }
    };

    const handleConfirmDialog = async () => {
        if (confirmAction === 'salvar') {
            // lógica de exclusão
            await handleConfirm();
        } else if (confirmAction === 'vincular') {
            // lógica de efetivação
            await handleVincular();
        }

        setIsConfirmationModalOpen(false);
        setConfirmAction(null);
    };

    const handleConfirm = async () => {
        const response = await addProdutos(product, novoNome, empresa.cfop_padrao);
        if (response) {
            onVinculoSuccess(response); // Chama a função do modal pai
            onClose();
        }
    }

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
            const prodVinculado = await vinculaProdutoNF(produto_ori_id, produtoVinculado);
            onVinculoSuccess("Produto vinculado com sucesso!"); // Chama a função do modal pai
            if (onProdutoVinculado) {
                onProdutoVinculado(prodVinculado); // <-- Retorno ao componente pai
            }
            onClose();
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao atualizar produto.";
            setToast({ message: errorMessage, type: "error" });
        } finally {
            setLoading(false); // Desabilita o botão
            setIsConfirmationModalOpen(false);

        }
    };

    const handleCancelConfirm = () => {
        setIsConfirmationModalOpen(false); // Fecha o modal de confirmação
        setIsCFOPModalOpen(true); // Abre o modal para informar CFOP
    };

    const handleCFOPConfirm = async (cfop) => {
        setIsCFOPModalOpen(false);
        setCfopInformado(cfop);

        try {
            product.produto_ori_id = product.id; // Atualiza o ID do produto original
            product.cfop = cfop; // Atualiza o CFOP do produto
            // Aqui você pode usar o CFOP informado para continuar o fluxo,
            // por exemplo, chamar addProdutos com o CFOP informado
            await addProdutos(product);
            setToast({ message: `Produto salvo com CFOP: ${cfop}`, type: 'success' });
            onClose();
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Erro ao salvar com CFOP informado.";
            setToast({ message: errorMessage, type: 'error' });
        }
    };



    const handleCancel = () => {
        setIsConfirmationModalOpen(false); // Fechar o modal sem realizar nada
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="relative bg-white rounded-2xl shadow-lg w-full max-w-4xl p-6">
                {/* Botão de fechar */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>

                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <div>
                            <h2 className="text-xl font-semibold mb-4">
                                Tratar Produto:{" "}
                                <span className="text-blue-600">{product.descricao}</span>
                            </h2>

                            <button
                                onClick={openPesquisaGNModal}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-6"
                            >
                                Pesquisar Produto
                            </button>

                            <div>
                                {/* Cadastro padrão */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label
                                            htmlFor="novoNome"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Nome Nota:
                                        </label>
                                        <input
                                            id="novoNome"
                                            type="text"
                                            value={novoNome}
                                            onChange={(e) => setNovoNome(e.target.value)}
                                            placeholder="Digite o novo nome do produto"
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="produtoId"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            ID: {produtoId}
                                        </label>
                                        <input
                                            type="text"
                                            value={produto}
                                            onChange={handleSearchChange}
                                            readOnly
                                            required
                                            className="w-full rounded-lg border-gray-300 shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                {/* Separador */}
                                <div className="my-6 border-t border-gray-300"></div>

                                {/* Resultados */}
                                <div className="overflow-x-auto">
                                    <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                                        <thead className="bg-gray-100 text-gray-700">
                                            <tr>
                                                <th className="px-4 py-2 text-left">ID</th>
                                                <th className="px-4 py-2 text-left">Nome</th>
                                                <th className="px-4 py-2 text-left">EAN</th>
                                                <th className="px-4 py-2 text-center">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {similares && similares.length > 0 ? (
                                                similares.map((sim, idx) => (
                                                    <tr
                                                        key={sim.produto.id || idx}
                                                        className="border-t border-gray-200"
                                                    >
                                                        <td className="px-4 py-2">{sim.produto.id}</td>
                                                        <td className="px-4 py-2">{sim.produto.xProd}</td>
                                                        <td className="px-4 py-2">
                                                            {sim.cEAN || "SEM GTIN"}
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSelectProduto(sim.produto)}
                                                                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                                                            >
                                                                Vincular
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="4"
                                                        className="px-4 py-6 text-center text-gray-500"
                                                    >
                                                        Nenhum produto similar encontrado.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Botões */}
                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Outros Modais */}
            <ModalPesquisaGN
                isOpen={isPesquisaGNModalOpen}
                onClose={closePesquisaGNModal}
                onSelectProduto={handleSelectProduto}
            />
            <ConfirmDialog
                isOpen={isConfirmationModalOpen}
                onClose={handleCancel}
                message={mensagem}
                onConfirm={() => handleConfirmDialog()}
                onCancel={() => handleCancelConfirm()}
            />
            <ModalInputCFOP
                isOpen={isCFOPModalOpen}
                onClose={() => setIsCFOPModalOpen(false)}
                onConfirm={handleCFOPConfirm}
                cfop={0}
            />

            {/* Toast */}
            <Toast message={toast.message} type={toast.type} />
        </div>

    );
};

export default ModalTratarProdutosNF;
