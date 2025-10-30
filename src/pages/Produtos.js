import React, { useState, useEffect } from 'react';
import { addProdutos, getProdutos, getProdutoById, updateProduto, inativarProduto } from '../services/api';
// import '../styles/Produtos.css';
// import '../styles/Fornecedores.css';
import ModalCadastraProduto from '../components/ModalCadastraProduto';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";
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
    const [searchParams, setSearchParams] = useState({
        nome: '',
        cEAN: '',
        tipo: '',
        status: ''
    });

    const [appliedFilters, setAppliedFilters] = useState({});
    const [needsRefresh, setNeedsRefresh] = useState(false);

    // Estados para paginação
    const [pagination, setPagination] = useState({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1
    });


    //Permissoes
    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

    useEffect(() => {
        checkPermission("produtos", "view")
    }, [])

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
            tipo: searchParams.tipo.trim(),
            status: searchParams.status
        });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleClear = () => {
        setSearchParams({
            nome: '',
            cEAN: '',
            tipo: '',
            status: ''
        });
        setAppliedFilters({
            nome: '',
            cEAN: '',
            tipo: '',
            status: ''
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
        checkPermission('clientes', 'insert', () => {
            openCadastraProdutoModal();
            setIsEdit(false);
            setSelectedProduto(null);
        })

    };

    const handleEditClick = async (produto) => {
        try {
            checkPermission('produtos', 'viewcadastro', async () => {
                const response = await getProdutoById(produto.id);
                setSelectedProduto(response.data);
                setIsEdit(true);
                openCadastraProdutoModal();
            })
        } catch (err) {
            console.error('Erro ao buscar detalhes do produto', err);
            setToast({ message: "Erro ao buscar detalhes do produto.", type: "error" });
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
        <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Consulta de Produtos</h1>

            {toast.message && <Toast type={toast.type} message={toast.message} />}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
                </div>
            ) : (
                <>
                    {/* Filtros de busca */}
                    <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row md:items-end gap-4">
                        <div className="flex flex-col md:flex-row gap-4 flex-1">
                            <div>
                                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select
                                    id="tipo"
                                    value={searchParams.tipo}
                                    onChange={(e) => setSearchParams({ ...searchParams, tipo: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Todos</option>
                                    <option value="servico">Serviço</option>
                                    <option value="produto">Produto</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    id="status"
                                    value={searchParams.status}
                                    onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="ativo">Ativo</option>
                                    <option value="inativo">Inativo</option>
                                    <option value="todos">Todos</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="xProd" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    id="xProd"
                                    value={searchParams.nome}
                                    onChange={(e) => setSearchParams({ ...searchParams, nome: e.target.value })}
                                    maxLength="150"
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="cEAN" className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                                <input
                                    type="text"
                                    id="cEAN"
                                    value={searchParams.cEAN}
                                    onChange={(e) => setSearchParams({ ...searchParams, cEAN: e.target.value })}
                                    maxLength="14"
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4 md:mt-0">
                            <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Pesquisar</button>
                            <button onClick={handleClear} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Limpar</button>
                            <button onClick={handleCadastrarModal} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Cadastrar</button>
                        </div>
                    </div>

                    {/* Resultados */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cód. Barras</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredProdutos.map((produto) => (
                                        <tr
                                            key={produto.id}
                                            className={`transition hover:bg-blue-100 ${produto.status === 0 ? 'bg-red-100 text-red-600 hover:bg-red-200' : ''
                                                }`}
                                        >
                                            <td className="px-4 py-2 text-sm text-gray-700">{produto.id}</td>
                                            <td className="px-4 py-2 text-sm text-gray-700">{produto.xProd}</td>
                                            <td className="px-4 py-2 text-sm text-gray-700">{produto.cEAN}</td>
                                            <td className="px-4 py-2">
                                                <button
                                                    onClick={() => handleEditClick(produto)}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                                >
                                                    Visualizar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>

                        {/* Paginação */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-2">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                <span className="text-sm text-gray-600">
                                    Página {pagination.currentPage} de {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                                >
                                    Próxima
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="rows-select" className="text-sm text-gray-600">Mostrar</label>
                                <select
                                    id="rows-select"
                                    value={pagination.itemsPerPage}
                                    onChange={handleRowsChange}
                                    className="border border-gray-300 rounded p-1"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="text-sm text-gray-600">por página</span>
                            </div>
                        </div>
                    </div>
                </>
            )
            }

            {
                isCadastraProdutoModalOpen && (
                    <ModalCadastraProduto
                        isOpen={isCadastraProdutoModalOpen}
                        onClose={closeCadastraProdutoModal}
                        edit={isEdit}
                        produto={selectedProduto}
                        inativar={isInativar}
                        onInativar={handleInativarProduto}
                    />
                )
            }
            {/* Renderização do modal de autorização */}
            <PermissionModalUI />
        </div >
    );
}

export default Produtos;