import React, { useState, useEffect } from 'react';
import { getContratosLayout, getTipoContratosLayout } from '../services/api';
import ModalContratoLayout from '../components/ModalContratoLayout';
import Pagination from '../utils/Pagination';
import Toast from '../components/Toast';

const ContratosLayout = () => {
    /*Padrões*/
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [executarBusca, setExecutarBusca] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [isEdit, setIsEdit] = useState(false);

    /*Padrões*/

    const [tipoContratosLayout, setTipoContratosLayout] = useState([]);
    const [contratosLayout, setContratosLayout] = useState([]);
    const [selectedContratoLayout, setSelectedContratoLayout] = useState('');
    const [status, setStatus] = useState('todos');
    const [titulo_contrato, setTituloContratos] = useState('');
    const [IdtituloLayout, setIdTituloLayout] = useState('');
    const [isModalCadastroOpen, setIsModalCadastroOpen] = useState(false);



    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const filters = { IdtituloLayout, titulo_contrato, status };
                const data = await getTipoContratosLayout(
                    { status: 1 },
                    currentPage,
                    rowsPerPage
                );
                setTipoContratosLayout(data.data || []);
                const response = await getContratosLayout(
                    filters,
                    currentPage,
                    rowsPerPage
                )
                if (response.data.length === 0) {
                    setToast({ message: 'Nenhum Registro Encontrado.', type: 'error' });
                    setContratosLayout([])
                } else {
                    setContratosLayout(response.data);
                    setTotalPages(response.totalPaginas || 1);
                }
            } catch (error) {
                console.error('Erro ao buscar contratos layout:', error);
                setToast({ message: 'Erro ao carregar dados.', type: 'error' });
            } finally {
                setLoading(false);
                setExecutarBusca(false);
            }
        };
        fetchData();
    }, [executarBusca, currentPage, rowsPerPage]);

    const handleClear = () => {
        setTituloContratos('');
        setTipoContratosLayout([]);
        setStatus('todos')
        setIdTituloLayout('')
        setCurrentPage(1);
        setRowsPerPage(10);
        setExecutarBusca(false);
    }

    const handleCadastrarContratoLayout = () => {
        setIsEdit(false);
        setIsModalCadastroOpen(true);
    }

    const handleEditClick = (contrato) => {
        setIsEdit(true);
        setSelectedContratoLayout(contrato);
        setIsModalCadastroOpen(true);
    }
    const confirmCadastro = () => {
        setToast({ message: 'Tipo Contrato Layout Adionado com sucesso', type: "success" });
    }

    const handlePesquisa = () => {
        setExecutarBusca(true);
    }
    const handleRefresh = () => {
        setIsModalCadastroOpen(false);
        setExecutarBusca(true);
    }
    return (
        <div style={{ padding: '20px' }}>
            <h1 className='title-page'>Contratos Layout</h1>
            <div id="search-container">
                <div id="search-fields">
                    <div>
                        <label htmlFor="titulo_contrato">Titulo Contrato:</label>
                        <input
                            className='input-geral'
                            type="text"
                            id="titulo_contrato"
                            value={titulo_contrato}
                            onChange={(e) => setTituloContratos(e.target.value)}
                            maxLength="150"
                        />
                    </div>
                    <div>
                        <label htmlFor="status">Status:</label>
                        <select
                            className='input-geral'
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                            <option value="todos">Todos</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tipoContrato">Tipo de Contrato:</label>
                        {/* Corrigir o select para: */}
                        <select
                            id="tipoContrato"
                            className="input-geral"
                            value={IdtituloLayout}  // Usar o estado do ID selecionado
                            onChange={(e) => setIdTituloLayout(e.target.value)}  // Atualizar apenas o ID
                        >
                            <option value="">Selecione...</option>
                            {Array.isArray(tipoContratosLayout) && tipoContratosLayout.map((tipo) => (
                                <option key={tipo.id} value={tipo.id}>
                                    {tipo.descricao}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <div id="button-group">
                        <button
                            onClick={() => {
                                setCurrentPage(1); // reinicia na primeira página ao buscar
                                handlePesquisa();
                            }}
                            className="button"
                        >
                            Pesquisar
                        </button>
                        <button onClick={handleClear} className="button">Limpar</button>
                        <button onClick={() => {
                            handleCadastrarContratoLayout()
                        }} className="button">Cadastrar</button>
                    </div>
                </div>
            </div>
            <div id="separator-bar"></div>

            {loading ? (
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>) : (
                <>
                    <div id="results-container">
                        <div id="grid-padrao-container">
                            <table id="grid-padrao">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Titulo</th>
                                        <th>Ordem</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contratosLayout.map((contrato) => (
                                        <tr key={contrato.id}>
                                            <td>{contrato.id}</td>
                                            <td>{contrato.titulo_contrato}</td>
                                            <td>{contrato.ordem}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleEditClick(contrato)}
                                                    className="edit-button"
                                                >
                                                    Visualizar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {contratosLayout.length > 0 && (
                                <div className="mt-4">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={(page) => {
                                            setExecutarBusca(true); // sinaliza que deve buscar
                                            setCurrentPage(page); // só atualiza o estado
                                        }}
                                        onRowsChange={(rows) => {
                                            setRowsPerPage(rows);
                                            setCurrentPage(1); // resetar para primeira página ao mudar limite
                                            setExecutarBusca(true); // sinaliza que deve buscar
                                        }}
                                        rowsPerPage={rowsPerPage}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
            {toast.message && <Toast type={toast.type} message={toast.message} />}

            {isModalCadastroOpen && (
                <ModalContratoLayout
                    isOpen={isModalCadastroOpen}
                    onClose={() => handleRefresh()}
                    edit={isEdit}
                    Layout={selectedContratoLayout}
                    onLayoutAdicionado={() => confirmCadastro()}
                />
            )}
        </div>
    );
}

export default ContratosLayout;