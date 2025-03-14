import { useEffect, useState } from "react";
import { addPermissoes, getPermissoes, addGrupoAcesso, getAllGrupoAcesso, updatePermissoes } from '../services/api';
import '../styles/Permissions.css';
import Toast from '../components/Toast';

export default function PermissionsPage() {
    const [groups, setGroups] = useState([]);
    const [accessGroups, setAccessGroups] = useState([]);
    const [filteredPermissions, setFilteredPermissions] = useState([]);

    const [formData, setFormData] = useState({
        grupoAcessoId: '',
        pagename: '',
        view: false,
        edit: false,
        delete: false,
        insert: false,
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [editMode, setEditMode] = useState(false); // Novo estado para controlar o modo de edição
    const [currentPermissionId, setCurrentPermissionId] = useState(null); // Para armazenar o id da permissão sendo editada

    useEffect(() => {
        fetchPermissions();
        fetchAccessGroups();
    }, []);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const fetchPermissions = async () => {
        try {
            const response = await getPermissoes();
            setGroups(response.data);
        } catch (error) {
            console.error("Erro ao buscar permissões", error);
        }
    };

    const fetchAccessGroups = async () => {
        try {
            const response = await getAllGrupoAcesso();
            setAccessGroups(response.data);
        } catch (error) {
            console.error("Erro ao buscar grupos de acesso", error);
        }
    };

    useEffect(() => {
        if (formData.grupoAcessoId) {
            const grupoId = parseInt(formData.grupoAcessoId, 10);
            const grupoSelecionado = groups.find(group => group.id === grupoId);
            setFilteredPermissions(grupoSelecionado ? grupoSelecionado.permissoes : []);
        } else {
            setFilteredPermissions([]);
        }
    }, [formData.grupoAcessoId, groups]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const dataToSend = {
            grupoAcessoId: formData.get('grupoAcessoId'),
            permissoes: [{
                pagename: formData.get('pagename'),
                view: formData.get('view') === 'on', // FormData retorna 'on' para checkbox
                viewcadastro: formData.get('viewcadastro') === 'on', 
                edit: formData.get('edit') === 'on',
                delete: formData.get('delete') === 'on',
                insert: formData.get('insert') === 'on',
            }]
        };

        if (editMode) {
            // Se estamos em modo de edição, incluímos o ID da permissão
            dataToSend.id = currentPermissionId;
            try {
                await updatePermissoes(currentPermissionId, dataToSend); // Envia para a API
                setToastMessage({ type: "success", text: "Permissão atualizada com sucesso!" });
            } catch (error) {
                console.error("Erro ao atualizar permissão", error);
                setToastMessage({ type: "error", text: 'Erro ao atualizar permissão: '+ error });
            }
        } else {
            try {
                await addPermissoes(dataToSend); // Envia para a API
                setToastMessage({ type: "success", text: "Permissão adicionada com sucesso!" });
            } catch (error) {
                console.error("Erro ao adicionar permissão", error);
                setToastMessage({ type: "error", text: 'Erro ao adicionar permissão ' + error.response.data.error });
            }
        }

        fetchPermissions();  // Atualiza a lista de permissões
        setFormData({
            grupoAcessoId: '',
            pagename: '',
            view: false,
            viewcadastro: false,
            edit: false,
            delete: false,
            insert: false,
        });
        setIsLoading(false);  // Desabilita o botão de carregamento
        setEditMode(false);  // Resetando o estado de edição
    };


    const handleEditPermission = (permission) => {
        setFormData({
            grupoAcessoId: permission.grupoAcessoId, // Aqui você pode precisar ajustar conforme a estrutura do seu modelo
            pagename: permission.pagename,
            view: permission.view,
            viewcadastro: permission.viewcadastro,
            edit: permission.edit,
            delete: permission.delete,
            insert: permission.insert,
        });
        setCurrentPermissionId(permission.id); // Armazenar o ID da permissão
        setEditMode(true); // Ativar o modo de edição
    };

    const handleAddGroup = async () => {
        try {
            await addGrupoAcesso({ nome: newGroupName });
            setIsModalOpen(false);
            setToastMessage({ type: "success", text: "Grupo criado com sucesso!" });
            setNewGroupName('');
            fetchPermissions();
            fetchAccessGroups();
        } catch (error) {
            console.error("Erro ao adicionar grupo de acesso", error);
            setToastMessage({ type: "error", text: "Falha ao criar o Grupo de Acesso!" });
        }
    };

    return (
        <div className="permissions-page">
            <div className="card">
                <div className="card-header">
                    <h2>Gerenciar Permissões</h2>
                </div>
                <div id="button-group">
                    <button onClick={() => setIsModalOpen(true)} className="button">
                        Adicionar Grupo de Acesso
                    </button>
                </div>
                <div className="card-content">
                    <form onSubmit={handleSubmit} className="form">
                        <select
                            name="grupoAcessoId"
                            value={formData.grupoAcessoId}
                            onChange={handleChange}
                            required
                            className="input"
                        >
                            <option value="">Selecione um Grupo de Acesso</option>
                            {accessGroups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.nome}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            name="pagename"
                            value={formData.pagename}
                            onChange={handleChange}
                            placeholder="Nome da Página"
                            required
                            className="input"
                        />
                        <div className="checkbox-group">
                            <label>
                                <input type="checkbox" name="view" checked={formData.view} onChange={handleChange} /> View
                            </label>
                            <label>
                                <input type="checkbox" name="viewcadastro" checked={formData.viewcadastro} onChange={handleChange} /> View Cadastro
                            </label>
                            <label>
                                <input type="checkbox" name="edit" checked={formData.edit} onChange={handleChange} /> Edit
                            </label>
                            <label>
                                <input type="checkbox" name="delete" checked={formData.delete} onChange={handleChange} /> Delete
                            </label>
                            <label>
                                <input type="checkbox" name="insert" checked={formData.insert} onChange={handleChange} /> Insert
                            </label>
                        </div>
                        <button type="submit" className="submit-button" disabled={isLoading}>
                            {isLoading ? (editMode ? 'Atualizando...' : 'Adicionando...') : (editMode ? 'Atualizar Permissão' : 'Adicionar Permissão')}
                        </button>
                    </form>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Permissões do Grupo Selecionado</h2>
                </div>
                <div className="card-content">
                    <table className="permissions-table">
                        <thead>
                            <tr>
                                <th>Página</th>
                                <th>Permissões</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPermissions.length > 0 ? (
                                filteredPermissions.map((perm) => (
                                    <tr key={perm.id}>
                                        <td>{perm.pagename}</td>
                                        <td>
                                            {perm.view && "👁️ "} {perm.viewcadastro && "🔍"} {perm.edit && "✏️ "} {perm.delete && "🗑️ "} {perm.insert && "➕ "}
                                        </td>
                                        <td>
                                            <div id="button-group">
                                                <button onClick={() => handleEditPermission(perm)} className="button">Editar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: "center", fontStyle: "italic" }}>
                                        Nenhuma permissão encontrada para este grupo.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Adicionar Grupo de Acesso</h2>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Nome do Grupo"
                            required
                            className="input"
                        />
                        <div id="button-group">
                            <button onClick={handleAddGroup} className="button">Salvar</button>
                            <button onClick={() => setIsModalOpen(false)} className="cancel-button">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {toastMessage && (
                <Toast
                    type={toastMessage.type}
                    message={toastMessage.text}
                    onClose={() => setToastMessage('')}
                />
            )}
        </div>
    );
}
