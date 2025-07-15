import React, { useState, useEffect } from 'react';
import {
    getAllTiposContainers,
    addTipoContainer,
    updateTipoContainer,
    getTiposContainerById,
} from '../services/api';
import ModalCadastroTipoContainer from '../components/ModalCadastroTipoContainer';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission';

const TipoContainer = () => {
    const [tipos, setTipos] = useState([]);
    const [nome, setNome] = useState('');
    const [selectedTipo, setSelectedTipo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [isEdit, setIsEdit] = useState(false);
    const { permissions } = useAuth();
    const [statusTipoContainer, setStatusTipoContainer] = useState([]);

    // Paginação
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Toast timeout
    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Fetch tipos com paginação e filtro
    const fetchTipos = async () => {
        setLoading(true);
        try {
            const response = await getAllTiposContainers({
                nome, // substituindo descricao
                status: statusTipoContainer, // usando o estado atualizado
                page: currentPage,
                pageSize: rowsPerPage,
            });
            setTipos(response.data);
            setTotalPages(response.pagination.totalPages);
        } catch (error) {
            console.error('Erro ao buscar tipos de container:', error);
            setToast({ message: 'Erro ao buscar tipos de container', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTipos();
    }, [currentPage, rowsPerPage, statusTipoContainer]);

    // Manipuladores de paginação
    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleRowsChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    // Busca pelo filtro descricao
    const handleSearch = () => {
        setCurrentPage(1);
        fetchTipos();
    };

    const handleClear = () => {
        setNome('');
        setStatusTipoContainer([]);
        setCurrentPage(1);
        fetchTipos();
    };

    // Abrir modal para cadastro
    const handleCadastrarModal = () => {
        if (!hasPermission(permissions, 'tipocontainer', 'insert')) {
            setToast({ message: 'Você não tem permissão para cadastrar tipos.', type: 'error' });
            return;
        }
        setIsModalOpen(true);
        setIsEdit(false);
        setSelectedTipo(null);
    };

    // Abrir modal para editar
    const handleEditClick = async (tipo) => {
        if (!hasPermission(permissions, 'tipocontainer', 'viewcadastro')) {
            setToast({ message: 'Você não tem permissão para visualizar tipos.', type: 'error' });
            return;
        }
        try {
            const response = await getTiposContainerById(tipo.id);
            setSelectedTipo(response);
            setIsEdit(true);
            setIsModalOpen(true);
        } catch (err) {
            setToast({ message: 'Erro ao carregar dados do tipo.', type: 'error' });
        }
    };

    // Submit do form para adicionar
    const handleAddTipo = async (e) => {
        if (!hasPermission(permissions, 'tipocontainer', 'insert')) {
            setToast({ message: 'Você não tem permissão para cadastrar tipos.', type: 'error' });
            return;
        }
        const novoTipo = {
            nome: e.nome,
            descricao: e.descricao,
            status: e.status
        };

        try {
            await addTipoContainer(novoTipo);
            setToast({ message: 'Tipo cadastrado com sucesso!', type: 'success' });
            setIsModalOpen(false);
            fetchTipos();
        } catch (err) {
            const msg = err.response?.data?.error || 'Erro ao cadastrar tipo.';
            setToast({ message: msg, type: 'error' });
        }
    };

    // Submit do form para editar
    const handleEditSubmit = async (e) => {
        if (!hasPermission(permissions, 'tipocontainer', 'edit')) {
            setToast({ message: 'Você não tem permissão para editar tipos.', type: 'error' });
            return;
        }
        const updated = {
            nome: e.nome,
            descricao: e.descricao,
            status: e.status
        };

        try {
            await updateTipoContainer(selectedTipo.id, updated);
            setToast({ message: 'Tipo atualizado com sucesso!', type: 'success' });
            setIsModalOpen(false);
            fetchTipos();
        } catch (err) {
            const msg = err.response?.data?.error || 'Erro ao atualizar tipo.';
            setToast({ message: msg, type: 'error' });
        }
    };

    return (
        <div id="tipo-container-container">
            <h1 className="title-page">Tipos de Container</h1>

            <div id="search-container">
                <div id="search-fields">
                    <div>
                        <label htmlFor="descricao">Descrição</label>
                        <input
                            className="input-geral"
                            id="nome"
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="status">Status</label>
                        <select
                            className="select-veiculos-geral"
                            id="status"
                            value={statusTipoContainer}
                            onChange={(e) => {
                                const selectedNome = e.target.value;
                                setStatusTipoContainer(selectedNome);

                            }}
                        >
                            <option value="">Todos</option>
                            <option value="Ativo">Ativo</option>
                            <option value="Inativo">Inativo</option>
                        </select>
                    </div>
                </div>
                <div id="button-group">
                    <button onClick={handleSearch} className="button">Pesquisar</button>
                    <button onClick={handleClear} className="button">Limpar</button>
                    <button onClick={handleCadastrarModal} className="button">Cadastrar</button>
                </div>
            </div>

            <div id="separator-bar"></div>

            <div id="results-container">
                {loading ? (
                    <div className="spinner-container"><div className="spinner"></div></div>
                ) : tipos.length === 0 ? (
                    <p className="empty-message">Nenhum tipo de container cadastrado.</p>
                ) : (
                    <div id="grid-padrao-container">
                        <table id="grid-padrao">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>Descrição</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(tipos) && tipos.map((tipo) => (
                                    <tr key={tipo.id}>
                                        <td>{tipo.id}</td>
                                        <td>{tipo.nome}</td>
                                        <td>{tipo.descricao}</td>
                                        <td>
                                            <button
                                                onClick={() => handleEditClick(tipo)}
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
                )}

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

            {toast.message && <Toast type={toast.type} message={toast.message} />}

            {isModalOpen && (
                <ModalCadastroTipoContainer
                    isOpen={isModalOpen}
                    onSubmit={isEdit ? handleEditSubmit : handleAddTipo}
                    tipoContainer={selectedTipo}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedTipo(null);
                        setIsEdit(false);
                        fetchTipos();
                    }}
                    edit={isEdit}
                />
            )}
        </div>
    );
};

export default TipoContainer;
