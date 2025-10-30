import React, { useState, useEffect } from 'react';
import { getProdutos } from '../services/api';
import ModalCadastraProduto from '../components/ModalCadastraProduto';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";

const Produtos = () => {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [selectedProduto, setSelectedProduto] = useState(null);
    const [isCadastraProdutoModalOpen, setIsCadastraProdutoModalOpen] = useState(false);
    const [needsRefresh, setNeedsRefresh] = useState(false);

    // Estados para filtros e pesquisa
    const [searchParams, setSearchParams] = useState({
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

    // Hook de permissões
    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

    useEffect(() => {
        checkPermission("produtos", "view");
    }, []);

    // Busca produtos com paginação e filtros
    useEffect(() => {
        const fetchProdutos = async () => {
            try {
                setLoading(true);
                const response = await getProdutos({
                    ...searchParams,
                    page: pagination.currentPage,
                    pageSize: pagination.itemsPerPage
                });

                setProdutos(response.data);
                setPagination(prev => ({
                    ...prev,
                    totalItems: response.pagination.totalItems,
                    totalPages: response.pagination.totalPages
                }));
            } catch (err) {
                showToast(err.message || 'Erro ao carregar produtos', 'error');
            } finally {
                setLoading(false);
                setNeedsRefresh(false);
            }
        };

        fetchProdutos();
    }, [pagination.currentPage, pagination.itemsPerPage, searchParams, needsRefresh]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleClear = () => {
        setSearchParams({
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

    const handleCadastrarModal = () => {
        checkPermission('produtos', 'insert', () => {
            setSelectedProduto(null);
            setIsCadastraProdutoModalOpen(true);
        });
    };

    const handleProductUpdate = () => {
        setNeedsRefresh(true);
        showToast('Produto atualizado com sucesso!');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
                Consulta de Produtos
            </h1>

            {/* Loading Spinner */}
            {loading && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            )}

            {/* Search Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                        </label>
                        <select
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={searchParams.tipo}
                            onChange={(e) => setSearchParams({ ...searchParams, tipo: e.target.value })}
                        >
                            <option value="">Todos</option>
                            <option value="servico">Serviço</option>
                            <option value="produto">Produto</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome
                        </label>
                        <input
                            type="text"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={searchParams.nome}
                            onChange={(e) => setSearchParams({ ...searchParams, nome: e.target.value })}
                            maxLength="150"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Código de Barras
                        </label>
                        <input
                            type="text"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={searchParams.cEAN}
                            onChange={(e) => setSearchParams({ ...searchParams, cEAN: e.target.value })}
                            maxLength="14"
                        />
                    </div>
                </div>

                <div className="flex justify-center gap-3">
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Pesquisar
                    </button>
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Limpar
                    </button>
                    <button
                        onClick={handleCadastrarModal}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Cadastrar
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nome
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cód. Barras
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {produtos.map((produto) => (
                                <tr key={produto.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {produto.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {produto.xProd}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {produto.cEAN}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => {
                                                setSelectedProduto(produto);
                                                setIsCadastraProdutoModalOpen(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Visualizar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Próxima
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Mostrando{' '}
                                <span className="font-medium">
                                    {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                                </span>
                                {' '}a{' '}
                                <span className="font-medium">
                                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                                </span>
                                {' '}de{' '}
                                <span className="font-medium">{pagination.totalItems}</span>
                                {' '}resultados
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                >
                                    Próxima
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Items per page selector */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <div className="flex items-center justify-end">
                        <span className="text-sm text-gray-700 mr-2">Itens por página:</span>
                        <select
                            value={pagination.itemsPerPage}
                            onChange={handleRowsChange}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isCadastraProdutoModalOpen && (
                <ModalCadastraProduto
                    isOpen={isCadastraProdutoModalOpen}
                    onClose={() => setIsCadastraProdutoModalOpen(false)}
                    produto={selectedProduto}
                    onUpdate={handleProductUpdate}
                />
            )}

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Permission Modal */}
            <PermissionModalUI />
        </div>
    );
};

export default Produtos;