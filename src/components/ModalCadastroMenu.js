import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from '../hooks/usePermissionModal';
import Toast from './Toast';

const ModalCadastroMenu = ({ isOpen, onClose, onSubmit, menu, edit, allMenus = [] }) => {
    const [formData, setFormData] = useState({
        label: '',
        path: '',
    menu_key: '',
        permission: '',
        visible: true,
        parentId: '',
        order: 1,
        icon: ''
    });

    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ message: '', type: '' });
    const [permiteEditar, setPermiteEditar] = useState(true);

    // Permissões
    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

    useEffect(() => {
        if (isOpen && edit) {
            checkPermission('menus', 'edit', () => {
                setPermiteEditar(true);
            });
        } else if (isOpen) {
            checkPermission('menus', 'insert', () => {
                setPermiteEditar(true);
            });
        }
    }, [isOpen, edit]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        if (isOpen) {
            if (edit && menu) {
                // Preencher dados para edição
                setFormData({
                    label: menu.label || '',
                    path: menu.path || '',
                    menu_key: menu.menu_key || '',
                    permission: Array.isArray(menu.permissions)
                        ? menu.permissions.join(', ')
                        : menu.permissions || '',
                    visible: menu.visible !== false,
                    parentId: menu.parent_id || '',
                    order: menu.order || 1,
                    icon: menu.icon || ''
                });
            } else {
                // Limpar dados para novo menu
                setFormData({
                    label: '',
                    path: '',
                    menu_key: '',
                    permission: '',
                    visible: true,
                    parentId: '',
                    order: allMenus.length + 1,
                    icon: ''
                });
            }
            setErrors({});
        }
    }, [isOpen, edit, menu, allMenus]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Limpar erro do campo quando usuário começar a digitar
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.label.trim()) {
            newErrors.label = 'Label é obrigatório';
        }

        if (formData.path && !formData.path.startsWith('/')) {
            newErrors.path = 'Path deve começar com /';
        }
        /*
                if (formData.permission && formData.permission.includes(',')) {
                    // Validar se as permissões são válidas
                    const permissions = formData.permission.split(',').map(p => p.trim());
                    //const validPermissions = ['view', 'edit', 'delete', 'insert', 'viewcadastro'];
                    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
        
                    if (invalidPermissions.length > 0) {
                        newErrors.permission = `Permissões inválidas: ${invalidPermissions.join(', ')}`;
                    }
                }*/

        if (formData.parentId && formData.parentId === menu?.id) {
            newErrors.parentId = 'Um menu não pode ser pai de si mesmo';
        }

        if (formData.order && (isNaN(formData.order) || formData.order < 1)) {
            newErrors.order = 'Ordem deve ser um número maior que 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setToast({
                message: 'Por favor, corrija os erros no formulário',
                type: 'error'
            });
            return;
        }

        // Processar dados do formulário
        const menuData = {
            ...formData,
            permission: formData.permission
                ? formData.permission.split(',').map(p => p.trim()).filter(p => p)
                : null,
            order: parseInt(formData.order) || 1,
            parent_id: formData.parentId || null
        };

        onSubmit(menuData);
    };

    const handleClose = () => {
        setFormData({
            label: '',
            path: '',
            menu_key: '',
            permission: '',
            visible: true,
            parentId: '',
            order: 1,
            icon: ''
        });
        setErrors({});
        onClose();
    };

    // Filtrar menus que podem ser pais (excluir o próprio menu se estiver editando)
    const availableParentMenus = allMenus.filter(m =>
        (m.path === null || m.path === '') && (!edit || m.id !== menu?.id)
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                    ×
                </button>

                <h2 className="text-xl font-semibold text-gray-800 mb-6">{edit ? 'Editar Menu' : 'Novo Menu'}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="label" className="block text-gray-700 font-medium mb-1">Label *</label>
                            <input
                                type="text"
                                id="label"
                                name="label"
                                value={formData.label}
                                onChange={handleChange}
                                disabled={!permiteEditar}
                                required
                                maxLength={100}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.label ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.label && <p className="text-red-500 text-sm mt-1">{errors.label}</p>}
                        </div>

                        <div>
                            <label htmlFor="path" className="block text-gray-700 font-medium mb-1">Path</label>
                            <input
                                type="text"
                                id="path"
                                name="path"
                                value={formData.path}
                                onChange={handleChange}
                                disabled={!permiteEditar}
                                placeholder="/exemplo"
                                maxLength={200}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.path ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.path && <p className="text-red-500 text-sm mt-1">{errors.path}</p>}
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="permission" className="block text-gray-700 font-medium mb-1">Permissões</label>
                            <input
                                type="text"
                                id="permission"
                                name="permission"
                                value={formData.permission}
                                onChange={handleChange}
                                disabled={!permiteEditar}
                                placeholder="view, edit, delete, insert"
                                maxLength={200}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.permission ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.permission && <p className="text-red-500 text-sm mt-1">{errors.permission}</p>}
                            <p className="text-gray-500 text-sm mt-1">
                                Separe múltiplas permissões com vírgula (view, edit, delete, insert)
                            </p>
                        </div>
                        <div>
                            <label htmlFor="menu_key" className="block text-gray-700 font-medium mb-1">Chave (menu_key)</label>
                            <input
                                type="text"
                                id="menu_key"
                                name="menu_key"
                                value={formData.menu_key}
                                onChange={handleChange}
                                disabled={!permiteEditar}
                                placeholder="ex: users.view"
                                maxLength={100}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.menu_key ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.menu_key && <p className="text-red-500 text-sm mt-1">{errors.menu_key}</p>}
                            <p className="text-gray-500 text-sm mt-1">Usada para referência de permissão ou rotas</p>
                        </div>

                        <div>
                            <label htmlFor="icon" className="block text-gray-700 font-medium mb-1">Ícone</label>
                            <input
                                type="text"
                                id="icon"
                                name="icon"
                                value={formData.icon}
                                onChange={handleChange}
                                disabled={!permiteEditar}
                                placeholder="🏠 ou nome do ícone"
                                maxLength={50}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="parentId" className="block text-gray-700 font-medium mb-1">Menu Pai</label>
                            <select
                                id="parentId"
                                name="parentId"
                                value={formData.parentId}
                                onChange={handleChange}
                                disabled={!permiteEditar}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="">Selecione um menu pai (opcional)</option>
                                {availableParentMenus.map(parentMenu => (
                                    <option key={parentMenu.id} value={parentMenu.id}>
                                        {parentMenu.label}
                                    </option>
                                ))}
                            </select>
                            {errors.parentId && <p className="text-red-500 text-sm mt-1">{errors.parentId}</p>}
                        </div>

                        <div>
                            <label htmlFor="order" className="block text-gray-700 font-medium mb-1">Ordem</label>
                            <input
                                type="number"
                                id="order"
                                name="order"
                                value={formData.order}
                                onChange={handleChange}
                                disabled={!permiteEditar}
                                min="1"
                                max="999"
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.order ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.order && <p className="text-red-500 text-sm mt-1">{errors.order}</p>}
                        </div>
                    </div>

                    {/* Checkbox */}
                    <div>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                name="visible"
                                checked={formData.visible}
                                onChange={handleChange}
                                disabled={!permiteEditar}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-700">Menu visível</span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        {permiteEditar && (
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow"
                            >
                                {edit ? 'Atualizar' : 'Criar'} Menu
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>

                {toast.message && (
                    <Toast
                        type={toast.type}
                        message={toast.message}
                        onClose={() => setToast({ message: '', type: '' })}
                    />
                )}

                <PermissionModalUI />
            </div>
        </div>

    );
};

export default ModalCadastroMenu;
