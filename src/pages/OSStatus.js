import React, { useState, useEffect } from 'react';
import { addOSStatus, getAllOSStatus, updateOSStatus } from '../services/api'; // Adicione os serviços corretos
import ModalCadastroOSStatus from '../components/ModalCadastroOSStatus'; // Importe o componente de modal
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission';

const OSStatus = () => {
    const [statuses, setStatuses] = useState([]);
    const [statusFiltro, setStatusFiltro] = useState('');
    const [filteredStatuses, setFilteredStatuses] = useState([]);
    const [nome, setNome] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [isEdit, setIsEdit] = useState(false);
    const [ativo, setAtivo] = useState(''); // Estado para o filtro ativo/inativo
    const { permissions } = useAuth();
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                const response = await getAllOSStatus();
                setStatuses(response.data);
                setFilteredStatuses(response.data);
            } catch (error) {
                console.error('Erro ao buscar status de ordens de serviço:', error);
                setStatuses([]);
            } finally {
                setLoading(false);
            }
        };
        fetchStatuses();
    }, []);

    const handleSearch = () => {
        const lowerNome = nome.toLowerCase();

        const results = statuses.filter(status =>
            (lowerNome ? status.nome.toLowerCase().includes(lowerNome) : true) &&
            (statusFiltro !== '' ? status.ativo === (statusFiltro == 1 ? true : false) : true) // Filtro de ativo/inativo
        );

        setFilteredStatuses(results);
        setCurrentPage(1);
    };


    const handleClear = () => {
        setNome('');
        setFilteredStatuses(statuses);
        setCurrentPage(1);
    };

    const handleCadastrarModal = () => {
        if (!hasPermission(permissions, 'osstatus', 'insert')) {
            setToast({ message: "Você não tem permissão para cadastrar status.", type: "error" });
            return;
        }
        setIsModalOpen(true);
        setIsEdit(false);
        setSelectedStatus(null);
    };

    const handleAddOSStatus = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newStatus = {
            nome: formData.get('nome'),
            status: formData.get('ativo'),
            descricao: formData.get('descricao'),
            ordem: formData.get('ordem'),
        };

        try {
            await addOSStatus(newStatus);
            setToast({ message: "Status cadastrado com sucesso!", type: "success" });
            setIsModalOpen(false);
            const response = await getAllOSStatus();
            setStatuses(response.data);
            setFilteredStatuses(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao cadastrar status.";
            setToast({ message: errorMessage, type: "error" });
        }
    };

    const handleEditClick = (status) => {
        setSelectedStatus(status);
        setIsEdit(true);
        setIsModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const ativo = formData.get('ativo');

        const updatedStatus = {
            nome: formData.get('nome'),
            ativo: ativo === 'on' ? 1 : 0,
            descricao: formData.get('descricao'),
            ordem: formData.get('ordem'),
        };

        try {
            await updateOSStatus(selectedStatus.id, updatedStatus);
            setToast({ message: "Status atualizado com sucesso!", type: "success" });
            setIsModalOpen(false);
            const response = await getAllOSStatus();
            handleClear();
            setStatuses(response.data);
            setFilteredStatuses(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao atualizar status.";
            setToast({ message: errorMessage, type: "error" });
        }
    };

    return (
        <div id="os-status-container">
            <h1 className="title-page">Status da Ordem de Serviço</h1>
            <div id="search-container">
                <div id="search-fields">
                    <div>
                        <label htmlFor="nome">Nome</label>
                        <input
                            className="input-geral"
                            type="text"
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            maxLength="150"
                        />
                    </div>
                    <div>
                        <label htmlFor="statusFiltro">Status</label>
                        <select
                            id="statusFiltro"
                            value={statusFiltro}
                            onChange={(e) => setStatusFiltro(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="1">Ativo</option>
                            <option value="0">Inativo</option>
                        </select>
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
                {loading ? (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>
                ) : statuses.length === 0 ? (
                    <p className="empty-message">Nenhum status cadastrado.</p>
                ) : (
                    <div id="grid-padrao-container">
                        <table id="grid-padrao">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStatuses.map((status) => (
                                    <tr key={status.id}>
                                        <td>{status.id}</td>
                                        <td>{status.nome}</td>
                                        <td>
                                            <button
                                                onClick={() => handleEditClick(status)}
                                                className="edit-button"
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {toast.message && <Toast type={toast.type} message={toast.message} />}
            {isModalOpen && (
                <ModalCadastroOSStatus
                    isOpen={isModalOpen}
                    onSubmit={isEdit ? handleEditSubmit : handleAddOSStatus}
                    status={selectedStatus}
                    onClose={() => setIsModalOpen(false)}
                    edit={isEdit}
                />
            )}
        </div>
    );
};

export default OSStatus;
