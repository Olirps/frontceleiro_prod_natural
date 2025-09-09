import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';

import { getAllContainers, addContainer, updateContainer, getContainerById, getAllTiposContainers, getAllContainersStatus } from '../services/api';
import ModalCadastroContainers from '../components/ModalCadastroContainers';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";

const Containers = () => {
    const [containers, setContainers] = useState([]);
    const [filteredContainers, setFilteredContainers] = useState([]);
    const [descricao, setDescricao] = useState('');
    const [tiposComContainers, setTiposComContainers] = useState([]);
    const [statusContainer, setStatusContainer] = useState([]);
    const [tipo, setTipo] = useState('');
    const [tipoId, setTipoId] = useState('');
    const [statusId, setStatusId] = useState('');
    const [status, setStatus] = useState('');
    const [selectedContainer, setSelectedContainer] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [isEdit, setIsEdit] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    //Permissoes
    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);
    const navigate = useNavigate();


    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        handleSearch();
    }, [currentPage, rowsPerPage]);

    useEffect(() => {
        checkPermission("container", "view", async () => {
            const response = await getAllContainers();
            setContainers(response.data);
            setFilteredContainers(response.data);
        });
    }, []);

    useEffect(() => {
        const carregarTiposStatus = async () => {
            try {
                const responseTipo = await getAllTiposContainers();
                const responseStatusContainer = await getAllContainersStatus();
                setTiposComContainers(responseTipo.data);
                setStatusContainer(responseStatusContainer.data);
            } catch (error) {
                console.error('Erro ao carregar tipos com containers:', error);
            }
        };

        carregarTiposStatus();
    }, []);

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
    const handleSearch = async () => {
        try {
            setLoading(true);
            const response = await getAllContainers({
                descricao,
                tipoId,
                statusId,
                page: currentPage,
                pageSize: rowsPerPage
            });
            setContainers(response.data);
            setFilteredContainers(response.data);
            setTotalPages(response.pagination.totalPages);
        } catch (error) {
            console.error('Erro ao buscar containers filtrados:', error);
            setToast({ message: 'Erro ao buscar containers', type: 'error' });
        } finally {
            setLoading(false);
        }
    };


    const handleClear = () => {
        setDescricao('');
        setTipo('');
        setStatus('');
        setFilteredContainers(containers);
        setCurrentPage(1);
    };

    const handleCadastrarModal = () => {
        checkPermission('container', 'insert', () => {
            setIsModalOpen(true);
            setIsEdit(false);
            setSelectedContainer(null);
        })
    };

    const handleRowsChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };
    const handleAtualizarPage = async () => {
        setIsModalOpen(false);
        setSelectedContainer(null);
        setIsEdit(false);
        setDescricao('');
        setTipo('');
        setTipoId('');
        setStatus('');
        setCurrentPage(1);

        try {
            const response = await getAllContainers({
                descricao,
                tipoId,
                statusId,
                page: currentPage,
                pageSize: rowsPerPage
            });
            setContainers(response.data);
            setFilteredContainers(response.data);
        } catch (error) {
            setToast({ message: 'Erro ao atualizar containers.', type: 'error' });
        }
    };

    const handleAddContainer = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const novoContainer = {
            descricao: formData.get('descricao'),
            tipo: formData.get('tipo'),
            status: formData.get('status')
        };

        try {
            await addContainer(novoContainer);
            setToast({ message: "Container cadastrado com sucesso!", type: "success" });
            setIsModalOpen(false);
            const response = await getAllContainers();
            setContainers(response.data);
            setFilteredContainers(response.data);
        } catch (err) {
            const msg = err.response?.data?.error || "Erro ao cadastrar container.";
            setToast({ message: msg, type: "error" });
        }
    };

    const handleEditClick = async (container) => {
        try {
            checkPermission('container', 'viewcadastro', async () => {
                const response = await getContainerById(container.id);
                setSelectedContainer(response);
                setIsEdit(true);
                setIsModalOpen(true);
            });

        } catch (err) {
            setToast({ message: "Erro ao carregar dados do container.", type: "error" });
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const updated = {
            descricao: formData.get('descricao'),
            tipo: formData.get('tipo'),
            status: formData.get('status')
        };

        try {
            await updateContainer(selectedContainer.id, updated);
            setToast({ message: "Container atualizado com sucesso!", type: "success" });
            setIsModalOpen(false);
            const response = await getAllContainers();
            setContainers(response.data);
            setFilteredContainers(response.data);
        } catch (err) {
            const msg = err.response?.data?.error || "Erro ao atualizar container.";
            setToast({ message: msg, type: "error" });
        }
    };


    const containersComTipoNome = filteredContainers.map(container => {
        const tipoObj = tiposComContainers.find(tipo => tipo.id === container.tipo_id);
        return {
            ...container,
            nomeTipo: tipoObj?.nome || ''
        };
    });



    //const totalPages = Math.ceil(filteredContainers.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentContainers = containersComTipoNome; // já paginado pelo backend

    return (
        <div id="containers-container">
            <h1 className="title-page">Containers</h1>

            <div id="search-container">
                <div id="search-fields">
                    <div>
                        <label htmlFor="descricao">Descrição</label>
                        <input
                            className="input-geral"
                            id="descricao"
                            type="text"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="tipo">Tipo</label>
                        <select
                            className="select-veiculos-geral"
                            id="tipo"
                            value={tipo}
                            onChange={(e) => {
                                const selectedNome = e.target.value;
                                setTipo(selectedNome);

                                const tipoEncontrado = tiposComContainers.find(t => t.nome === selectedNome);
                                if (tipoEncontrado) {
                                    setTipoId(tipoEncontrado.id);
                                } else {
                                    setTipoId('');
                                }
                            }}
                        >
                            <option value="">Todos</option>
                            {tiposComContainers.map((tipo) => (
                                <option key={tipo.id} value={tipo.nome}>
                                    {tipo.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status">Status</label>
                        <select
                            className="select-veiculos-geral"
                            id="status"
                            value={status}
                            onChange={(e) => {
                                const selectedNome = e.target.value;
                                setStatus(selectedNome);

                                const statusEncontrado = statusContainer.find(t => t.descricao === selectedNome);
                                if (statusEncontrado) {
                                    setStatusId(statusEncontrado.id);
                                } else {
                                    setStatusId('');
                                }
                            }}
                        >
                            <option value="">Todos</option>
                            {statusContainer.map((tipo) => (
                                <option key={tipo.id} value={tipo.descricao}>
                                    {tipo.descricao}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div id="button-group">
                    <button onClick={handleSearch} className="button">Pesquisar</button>
                    <button onClick={handleAtualizarPage} className="button">Limpar</button>
                    <button onClick={handleCadastrarModal} className="button">Cadastrar</button>
                </div>
            </div>

            <div id="separator-bar"></div>

            <div id="results-container">
                {loading ? (
                    <div className="spinner-container"><div className="spinner"></div></div>
                ) : containers.length === 0 ? (
                    <p className="empty-message">Nenhum container cadastrado.</p>
                ) : (
                    <div id="grid-padrao-container">
                        <table id="grid-padrao">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Descrição</th>
                                    <th>Tipo</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentContainers.map((container) => (
                                    <tr key={container.id}>
                                        <td>{container.id}</td>
                                        <td>{container.descricao}</td>
                                        <td>{container.nomeTipo}</td>
                                        <td>{container.status_nome}</td>
                                        <td>
                                            <button
                                                onClick={() => handleEditClick(container)}
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
                <ModalCadastroContainers
                    isOpen={isModalOpen}
                    onSubmit={isEdit ? handleEditSubmit : handleAddContainer}
                    container={selectedContainer}
                    onClose={handleAtualizarPage}
                    onContainerAdicionado={(container) => {
                        // Atualiza a lista após adicionar
                        setContainers(prev => [...prev, container]);
                        if (container.edit) {
                            setToast({ message: "Container atualizado com sucesso!", type: "success" });
                        } else {
                            setToast({ message: "Container adicionado com sucesso!", type: "success" });
                        }
                    }}
                    edit={isEdit}
                />
            )}
            {/* Renderização do modal de autorização */}
            <PermissionModalUI />
        </div>
    );
};

export default Containers;