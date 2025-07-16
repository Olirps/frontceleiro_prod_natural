import React, { useState, useEffect } from 'react';
import { addProdutos, getProdutos, getProdutoById, updateProduto, inativarProduto } from '../services/api';
import '../styles/Produtos.css';
import '../styles/Fornecedores.css';
import ModalCadastraProduto from '../components/ModalCadastraProduto';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission';

function Produtos() {
    const [produtos, setProdutos] = useState([]);
    const [filteredProdutos, setFilteredProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [selectedProduto, setSelectedProduto] = useState(null);
    const [isCadastraProdutoModalOpen, setIsCadastraProdutoModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isInativar, setIsInativar] = useState(false);
    const [importSuccess, setCadastroSuccess] = useState(false);
    const { permissions } = useAuth();
    const [searchParams, setSearchParams] = useState({
        nome: '',
        cEAN: '',
        tipo: ''
    });

    const [appliedFilters, setAppliedFilters] = useState({});
    const [needsRefresh, setNeedsRefresh] = useState(false);

    // Estados para filtros
    const [filters, setFilters] = useState({
        nome: '',
        cEAN: '',
        tipo: ''
    });

    // Estados para paginação
    const [pagination, setPagination] = useState({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1
    });

    // Busca produtos com paginação
    useEffect(() => {
        const fetchProdutos = async () => {
            try {
                setLoading(true);
                const { data, pagination: apiPagination } = await getProdutos({
                    ...appliedFilters,
                    page: pagination.currentPage,
                    pageSize: pagination.itemsPerPage
                });

                setProdutos(data);
                setFilteredProdutos(data);
                setPagination(prev => ({
                    ...prev,
                    totalItems: apiPagination.totalItems,
                    totalPages: apiPagination.totalPages
                }));
            } catch (err) {
                console.error('Erro ao buscar produtos', err);
                setToast({ message: err.message || 'Erro ao carregar produtos', type: 'error' });
            } finally {
                setLoading(false);
                setNeedsRefresh(false);
            }
        };

        fetchProdutos();
    }, [pagination.currentPage, pagination.itemsPerPage, appliedFilters, importSuccess]);

    // Limpa toast após 3 segundos
    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleSearch = () => {
        setAppliedFilters({
            nome: searchParams.nome.trim(),
            cEAN: searchParams.cEAN.trim(),
            tipo: searchParams.tipo.trim()
        });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleClear = () => {
        setSearchParams({
            nome: '',
            cEAN: '',
            tipo: ''
        });
        setAppliedFilters({
            nome: '',
            cEAN: '',
            tipo: ''
        });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleRowsChange = (e) => {
        setPagination(prev => ({
            ...prev,
            itemsPerPage: Number(e.target.value),
            currentPage: 1
        }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    };

    const openCadastraProdutoModal = () => {
        setIsCadastraProdutoModalOpen(true);
    };

    const closeCadastraProdutoModal = () => {
        setIsCadastraProdutoModalOpen(false);
    };

    const handleCadastrarModal = () => {
        if (!hasPermission(permissions, 'clientes', 'insert')) {
            setToast({ message: "Você não tem permissão para cadastrar clientes.", type: "error" });
            return;
        }
        openCadastraProdutoModal();
        setIsEdit(false);
        setSelectedProduto(null);
    };

    const handleaddProdutos = async (e) => {
        const tipo = e.isService === true ? 'servico' : 'produto';
        const newProduto = {
            xProd: e.xProd,
            tipo: tipo,
            cod_interno: e.cod_interno,
            cEAN: e.cEAN,
            qtdMinima: e.qtdMinima,
            uCom: e.uCom,
            qCom: e.qCom,
            NCM: e.ncm,
            gpid: e.grupoId,
            subgpid: e.subGrupoId,
            CFOP: e.cfop,
            CEST: e.cest,
            vUnCom: Number(e.vUnCom),
            vlrVenda: Number(e.vlrVenda),
            vlrVendaAtacado: Number(e.vlrVendaAtacado),
            pct_servico: Number(e.percentual)
        };

        try {
            const newProd = await addProdutos(newProduto);
            setToast({ message: `Produto: ${newProd.data.id} - ${newProd.data.xProd}`, type: "success" });
            handleClear();
            setCadastroSuccess(prev => !prev);
            closeCadastraProdutoModal();
        } catch (err) {
            const errorMessage = err.response?.data?.erro || 'Erro ao cadastrar produto';
            setToast({ message: errorMessage, type: "error" });
        }
    };

    const handleEditClick = async (produto) => {
        try {
            if (!hasPermission(permissions, 'produtos', 'viewcadastro')) {
                setToast({ message: "Você não tem permissão para visualizar o cadastro de produtos/serviços.", type: "error" });
                return;
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
        if (!hasPermission(permissions, 'produtos', 'edit')) {
            setToast({ message: "Você não tem permissão para editar produtos.", type: "error" });
            return;
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
            CFOP: e.cfop,
            gpid: e.grupoId,
            subgpid: e.subGrupoId,
            CEST: e.cest,
            vlrVenda: Number(e.vlrVenda),
            vlrVendaAtacado: Number(e.vlrVendaAtacado),
            pct_servico: Number(e.percentual)
        };

        try {
            await updateProduto(selectedProduto.id, updatedProduto);
            setToast({ message: "Produto atualizado com sucesso!", type: "success" });
            setIsEdit(false);
            closeCadastraProdutoModal();
            setCadastroSuccess(prev => !prev);
        } catch (err) {
            const errorMessage = err.response?.data?.erro || 'Erro ao atualizar produto';
            setToast({ message: errorMessage, type: "error" });
        }
    };

    const handleInativarProduto = async (produtoId, novoStatus) => {
        try {
            setLoading(true);
            await inativarProduto(produtoId);
            setToast({
                message: `Produto ${produtoId} foi ${novoStatus ? 'inativado' : 'reativado'} com sucesso!`,
                type: "success"
            });
            closeCadastraProdutoModal();
            setCadastroSuccess(prev => !prev);
        } catch (err) {
            console.error('Erro ao inativar produto', err);
            setToast({ message: "Erro ao inativar produto.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="produtos-container">
            <h1 className="title-page">Consulta de Produtos</h1>

            {toast.message && <Toast type={toast.type} message={toast.message} />}

            {loading ? (
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            ) : (
                <>
                    <div id="search-container">
                        <div id="search-fields">
                            <div>
                                <label htmlFor="tipo">Tipo</label>
                                <select
                                    id="tipo"
                                    value={searchParams.tipo}
                                    onChange={(e) => setSearchParams({ ...searchParams, tipo: e.target.value })}
                                >
                                    <option value="">Todos</option>
                                    <option value="servico">Serviço</option>
                                    <option value="produto">Produto</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="xProd">Nome</label>
                                <input
                                    className="input-geral"
                                    type="text"
                                    id="xProd"
                                    value={searchParams.nome}
                                    onChange={(e) => setSearchParams({ ...searchParams, nome: e.target.value })}
                                    maxLength="150"
                                />
                            </div>
                            <div>
                                <label htmlFor="cEAN">Código de Barras</label>
                                <input
                                    className="input-geral"
                                    type="text"
                                    id="cEAN"
                                    value={searchParams.cEAN}
                                    onChange={(e) => setSearchParams({ ...searchParams, cEAN: e.target.value })}
                                    maxLength="14"
                                />
                            </div>
                        </div>
                        <div>
                            <div id="button-group">
                                <button onClick={handleSearch} className="button">Pesquisar</button>
                                <button onClick={handleClear} className="button">Limpar</button>
                                <button onClick={handleCadastrarModal} className="button">Cadastrar</button>
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
                                    {filteredProdutos.map((produto) => (
                                        <tr key={produto.id}>
                                            <td>{produto.id}</td>
                                            <td>{produto.xProd}</td>
                                            <td>{produto.cEAN}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleEditClick(produto)}
                                                    className="edit-button"
                                                >
                                                    Visualizar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div id="pagination-container">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                            >
                                Anterior
                            </button>
                            <span>
                                Página {pagination.currentPage} de {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                            >
                                Próxima
                            </button>
                        </div>

                        <div id="show-more-container">
                            <label htmlFor="rows-select">Mostrar</label>
                            <select
                                id="rows-select"
                                value={pagination.itemsPerPage}
                                onChange={handleRowsChange}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <label htmlFor="rows-select">por página</label>
                        </div>
                    </div>
                </>
            )}

            {isCadastraProdutoModalOpen && (
                <ModalCadastraProduto
                    isOpen={isCadastraProdutoModalOpen}
                    onClose={closeCadastraProdutoModal}
                    onSubmit={isEdit ? handleEditSubmit : handleaddProdutos}
                    edit={isEdit}
                    produto={selectedProduto}
                    inativar={isInativar}
                    onInativar={handleInativarProduto}
                />
            )}
        </div>
    );
}

export default Produtos;