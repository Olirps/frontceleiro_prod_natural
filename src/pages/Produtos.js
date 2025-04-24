import React, { useState, useEffect } from 'react';
import { addProdutos, getProdutos, getProdutoById, updateProduto, inativarProduto } from '../services/api';
import '../styles/Produtos.css';
import '../styles/Fornecedores.css';
import ModalCadastraProduto from '../components/ModalCadastraProduto';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função
import { converterMoedaParaNumero } from '../utils/functions';


function Produtos() {
    const [produtos, setProdutos] = useState([]);
    const [cEAN, setcEAN] = useState('');
    const [filteredProdutos, setFilteredProdutos] = useState([]);
    const [xProd, setxProd] = useState('');
    const [tipo, setTipo] = useState('');
    const [loading, setLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [selectedProduto, setSelectedProduto] = useState(null);
    const [isCadastraProdutoModalOpen, setIsCadastraProdutoModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isInativar, setIsInativar] = useState(false);
    const [importSuccess, setCadastroSuccess] = useState(false);
    const { permissions } = useAuth();


    useEffect(() => {
        const fetchProdutos = async () => {
            try {
                const response = await getProdutos();
                setProdutos(response.data);
                setFilteredProdutos(response.data);
            } catch (err) {
                console.error('Erro ao buscar produtos', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProdutos();
    }, [importSuccess]);


    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const openCadastraProdutoModal = () => {
        setIsCadastraProdutoModalOpen(true);
    };

    const closeCadastraProdutoModal = () => {
        setIsCadastraProdutoModalOpen(false);
    };

    const handleSearch = () => {
        const lowerNome = xProd ? xProd.toLowerCase() : '';
        const lowercEAN = cEAN ? cEAN.toLowerCase() : '';

        const tipoProduto = tipo;

        const results = produtos.filter(produto =>
            (produto.xProd ? produto.xProd.toLowerCase().includes(lowerNome) : !lowerNome) &&
            (produto?.cEAN ? produto.cEAN.toLowerCase().includes(lowercEAN) : !lowercEAN) &&
            (produto?.tipo ? produto.tipo.includes(tipoProduto) : !tipoProduto));
        setFilteredProdutos(results);
        setCurrentPage(1); // Resetar para a primeira página após a busca
    };

    const handleClear = () => {
        setxProd('');
        setcEAN('');
        setTipo('');
        setFilteredProdutos(produtos);
        setCurrentPage(1); // Resetar para a primeira página ao limpar a busca
    };

    const handleRowsChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1); // Resetar para a primeira página ao alterar o número de linhas
    };

    const handlecEanChange = (e) => {
        setcEAN(e.target.value);
    };

    const handleCadastrarModal = () => {
        if (!hasPermission(permissions, 'clientes', 'insert')) {
            setToast({ message: "Você não tem permissão para cadastrar clientes.", type: "error" });
            return; // Impede a abertura do modal
        }
        openCadastraProdutoModal();
        setIsEdit(false);
        setSelectedProduto(null);

    };

    const handleaddProdutos = async (e) => {

        const tipo = e.isService === true ? 'servico' : 'produto'
        const newProduto = {
            xProd: e.xProd,
            tipo: tipo,
            cod_interno: e.cod_interno,
            cEAN: e.cEAN,
            qtdMinima: e.qtdMinima,
            uCom: e.uCom,
            qCom: e.qCom,
            NCM: e.ncm,
            vUnCom: Number(e.vUnCom),
            vlrVenda: Number(e.vlrVenda),
            vlrVendaAtacado: Number(e.vlrVendaAtacado),
            pct_servico: Number(e.percentual)
        };

        try {
            const newProd = await addProdutos(newProduto);
            setToast({ message: `Produto: ${newProd.data.id} - ${newProd.data.xProd}`, type: "success" });
            const response = await getProdutos();
            handleClear();
            setProdutos(response.data);
            closeCadastraProdutoModal();
            setCadastroSuccess(prev => !prev); // Atualiza o estado para acionar re-renderização
        } catch (err) {
            const errorMessage = err.response.data.erro;
            setToast({ message: errorMessage, type: "error" });
        }
    };

    const handleEditClick = async (produto) => {
        try {
            if (!hasPermission(permissions, 'produtos', 'viewcadastro')) {
                setToast({ message: "Você não tem permissão para visualizar o cadastro de produtos/serviços.", type: "error" });
                return; // Impede a abertura do modal
            }
            const response = await getProdutoById(produto.id);
            setSelectedProduto(response.data);
            setIsEdit(true);
            openCadastraProdutoModal();
        } catch (err) {
            console.error('Erro ao buscar detalhes do produto', err);
            setToast({ message: "Erro ao buscar detalhes do produto.", type: "error" });
        }
    };

    const handleEditSubmit = async (e) => {
        //e.preventDefault();
        //const formData = new FormData(e.target);
        if (!hasPermission(permissions, 'produtos', 'edit')) {
            return; // Impede a abertura do modal
        }
        const updatedProduto = {
            xProd: e.xProd,
            cod_interno: e.cod_interno,
            tipo: e.productType,
            cEAN: e.cEAN,
            qtdMinima: e.qtdMinima,
            uCom: e.uCom,
            qCom: e.qCom,
            vUnCom: Number(e.vUnCom),
            NCM: e.ncm,
            vlrVenda: Number(e.vlrVenda),
            vlrVendaAtacado: Number(e.vlrVendaAtacado),
            pct_servico: Number(e.percentual)
        };

        try {
            await updateProduto(selectedProduto.id, updatedProduto);
            setToast({ message: "Produto atualizado com sucesso!", type: "success" });
            setIsEdit(false);
            closeCadastraProdutoModal();
            handleClear();
            setCadastroSuccess(prev => !prev); // Atualiza o estado para acionar re-renderização
        } catch (err) {
            const errorMessage = err.response.data.erro;
            setToast({ message: errorMessage, type: "error" });
        }
    };

    const handleInativarProduto = async (produtoId, novoStatus) => {

        // Aqui faz uma chamada à API para atualizar o status do produto no backend
        try {
            setLoading(true);
            const produtoInativado = await inativarProduto(produtoId);
            setToast({ message: `Produto ${produtoId} foi ${novoStatus ? 'inativado' : 'reativado'} com sucesso!`, type: "success" });
            closeCadastraProdutoModal();
            const response = await getProdutos();
            setProdutos(response.data);
            handleClear();
            setCadastroSuccess(prev => !prev); // Atualiza o estado para acionar re-renderização
            setLoading(false);
        } catch (err) {
            console.error('Erro ao inativar produto', err);
            setToast({ message: "Erro ao inativar produto.", type: "error" });
        }

    };

    const totalPages = Math.ceil(filteredProdutos.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentProdutos = filteredProdutos.slice(startIndex, startIndex + rowsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div id="produtos-container">
            <h1 className="title-page">Consulta de Produtos</h1>
            {loading ? (
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>) : (
                <>
                    <div id="search-container">
                        <div id="search-fields">
                            <div>
                                <label htmlFor="tipo">Status</label>
                                <select
                                    id="tipo"
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    <option value="servico">Serviço</option>
                                    <option value="produto">Produto</option>
                                </select>
                            </div>
                            <div >
                                <label htmlFor="xProd">Nome</label>
                                <input
                                    className="input-geral"
                                    type="text"
                                    id="xProd"
                                    value={xProd}
                                    onChange={(e) => setxProd(e.target.value)}
                                    maxLength="150"
                                />
                            </div>
                            <div>
                                <label htmlFor="cEAN">Código de Barras</label>
                                <input
                                    className="input-geral"
                                    type="text"
                                    id="cEAN"
                                    value={cEAN}
                                    onChange={handlecEanChange}
                                    maxLength="14"
                                />
                            </div>
                        </div>
                        <div>
                            <div id="button-group">
                                <button onClick={handleSearch} className="button">Pesquisar</button>
                                <button onClick={handleClear} className="button">Limpar</button>
                                <button onClick={() => {
                                    handleCadastrarModal();
                                }} className="button">Cadastrar</button>
                            </div>
                        </div>
                    </div>

                    <div id="separator-bar"></div>

                    <div id="results-container">
                        <div id="produtos-grid-container">
                            <table id="produtos-grid">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nome</th>
                                        <th>Cód. Barras</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentProdutos.map((produto) => (
                                        <tr key={produto.id}>
                                            <td>{produto.id}</td>
                                            <td>{produto.xProd}</td>
                                            <td>{produto.cEAN}</td>
                                            <td>
                                                <button onClick={() => handleEditClick(produto)} className="edit-button">Visualizar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div id="pagination-container">
                            <button onClick={handlePreviousPage} disabled={currentPage === 1}>
                                Anterior
                            </button>
                            <span>Página {currentPage} de {totalPages}</span>
                            <button onClick={handleNextPage} disabled={currentPage === totalPages}>
                                Próxima
                            </button>
                        </div>

                        <div id="show-more-container">
                            <label htmlFor="rows-select">Mostrar</label>
                            <select id="rows-select" value={rowsPerPage} onChange={handleRowsChange}>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <label htmlFor="rows-select">por página</label>
                        </div>
                    </div>
                </>
            )}

            {toast.message && <Toast type={toast.type} message={toast.message} />}
            {isCadastraProdutoModalOpen && (
                <ModalCadastraProduto
                    isOpen={isCadastraProdutoModalOpen}
                    onClose={closeCadastraProdutoModal}
                    onSubmit={isEdit ? handleEditSubmit : handleaddProdutos}
                    edit={isEdit}
                    produto={selectedProduto}
                    inativar={isInativar}
                    onInativar={handleInativarProduto} // Passamos a função como callback
                />
            )}
        </div>
    );
}

export default Produtos;
