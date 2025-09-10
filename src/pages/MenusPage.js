import React, { useState, useEffect } from 'react';
import { getMenus, createMenu, updateMenu, deleteMenu, reorderMenus } from '../services/ApiMenus';
import ModalCadastroMenu from '../components/ModalCadastroMenu';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from '../hooks/usePermissionModal';
import '../styles/Menus.css';

const MenusPage = () => {
    const [menus, setMenus] = useState([]);
    const [filteredMenus, setFilteredMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [menuToDelete, setMenuToDelete] = useState(null);

    // Estados para filtros e busca
    const [searchTerm, setSearchTerm] = useState('');
    const [filterByPermission, setFilterByPermission] = useState('');

    // Estados para paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Permissões
    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

    useEffect(() => {
        checkPermission("menus", "view");
    }, []);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        fetchMenus();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [menus, searchTerm, filterByPermission, currentPage, itemsPerPage]);

    const fetchMenus = async () => {
        try {
            setLoading(true);
            const menusData = await getMenus();
            setMenus(menusData);
        } catch (error) {
            console.error('Erro ao buscar menus:', error);
            setToast({
                message: 'Erro ao carregar menus: ' + (error.response?.data?.message || error.message),
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...menus];

        // Filtro por termo de busca
        if (searchTerm) {
            filtered = filtered.filter(menu =>
                menu.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (menu.path && menu.path.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (menu.permission && menu.permission.toString().toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Filtro por permissão
        if (filterByPermission) {
            filtered = filtered.filter(menu => {
                if (Array.isArray(menu.permission)) {
                    return menu.permission.includes(filterByPermission);
                }
                return menu.permission === filterByPermission;
            });
        }

        // Paginação
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedMenus = filtered.slice(startIndex, endIndex);

        setFilteredMenus(paginatedMenus);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    };

    const handleAddMenu = () => {
        setSelectedMenu(null);
        setIsEdit(false);
        setIsModalOpen(true);
    };

    const handleEditMenu = (menu) => {
        setSelectedMenu(menu);
        setIsEdit(true);
        setIsModalOpen(true);
    };

    const handleDeleteMenu = (menu) => {
        setMenuToDelete(menu);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteMenu(menuToDelete.id);
            setToast({ message: 'Menu deletado com sucesso!', type: 'success' });
            fetchMenus();
        } catch (error) {
            console.error('Erro ao deletar menu:', error);
            setToast({
                message: 'Erro ao deletar menu: ' + (error.response?.data?.message || error.message),
                type: 'error'
            });
        } finally {
            setIsDeleteModalOpen(false);
            setMenuToDelete(null);
        }
    };

    const handleModalSubmit = async (menuData) => {
        try {
            if (isEdit) {
                await updateMenu(selectedMenu.id, menuData);
                setToast({ message: 'Menu atualizado com sucesso!', type: 'success' });
            } else {
                await createMenu(menuData);
                setToast({ message: 'Menu criado com sucesso!', type: 'success' });
            }
            setIsModalOpen(false);
            fetchMenus();
        } catch (error) {
            console.error('Erro ao salvar menu:', error);
            setToast({
                message: 'Erro ao salvar menu: ' + (error.response?.data?.message || error.message),
                type: 'error'
            });
        }
    };

    const handleReorder = async (dragIndex, hoverIndex) => {
        try {
            const newMenus = [...menus];
            const draggedMenu = newMenus[dragIndex];
            newMenus.splice(dragIndex, 1);
            newMenus.splice(hoverIndex, 0, draggedMenu);

            // Atualizar ordem no backend
            const menuOrder = newMenus.map((menu, index) => ({ id: menu.id, order: index + 1 }));
            await reorderMenus(menuOrder);

            setMenus(newMenus);
            setToast({ message: 'Ordem dos menus atualizada!', type: 'success' });
        } catch (error) {
            console.error('Erro ao reordenar menus:', error);
            setToast({
                message: 'Erro ao reordenar menus: ' + (error.response?.data?.message || error.message),
                type: 'error'
            });
        }
    };

    const renderMenuTree = (menuList, level = 0) => {
        return menuList.map((menu) => (
            <React.Fragment key={menu.id}>
                <tr className={`menu-row level-${level}`}>
                    <td>
                        <div style={{ paddingLeft: `${level * 20}px` }}>
                            {level > 0 && '└─ '}
                            {menu.label}
                        </div>
                    </td>
                    <td>{menu.path || '-'}</td>
                    <td>
                        {Array.isArray(menu.permission)
                            ? menu.permission.join(', ')
                            : menu.permission || '-'
                        }
                    </td>
                    <td>
                        <span className={`status-badge ${menu.visible !== false ? 'active' : 'inactive'}`}>
                            {menu.visible !== false ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td>
                        <div className="action-buttons">
                            <button
                                onClick={() => handleEditMenu(menu)}
                                className="btn-edit"
                                title="Editar menu"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={() => handleDeleteMenu(menu)}
                                className="btn-delete"
                                title="Deletar menu"
                            >
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
                {menu.submenu && menu.submenu.length > 0 &&
                    renderMenuTree(menu.submenu, level + 1)
                }
            </React.Fragment>
        ));
    };

    if (loading) {
        return (
            <div className="menus-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Carregando menus...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Gerenciar Menus</h1>
                <button
                    onClick={handleAddMenu}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow"
                >
                    ➕ Novo Menu
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Buscar por label, path ou permissão..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
                <div className="min-w-[150px]">
                    <select
                        value={filterByPermission}
                        onChange={(e) => setFilterByPermission(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">Todas as permissões</option>
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                        <option value="delete">Delete</option>
                        <option value="insert">Insert</option>
                    </select>
                </div>
                <div className="min-w-[120px]">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value={10}>10 por página</option>
                        <option value={25}>25 por página</option>
                        <option value={50}>50 por página</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Label</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Path</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Permissão</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredMenus.length > 0 ? (
                            renderMenuTree(filteredMenus)
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                    Nenhum menu encontrado
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-gray-700">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                        Próxima
                    </button>
                </div>
            )}

            {/* Modals */}
            {isModalOpen && (
                <ModalCadastroMenu
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleModalSubmit}
                    menu={selectedMenu}
                    edit={isEdit}
                    allMenus={menus}
                />
            )}

            {isDeleteModalOpen && (
                <ConfirmDialog
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    message={`Tem certeza que deseja deletar o menu "${menuToDelete?.label}"?`}
                />
            )}

            {toast.message && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast({ message: '', type: '' })}
                />
            )}

            <PermissionModalUI />
        </div>
    );
};

export default MenusPage;
