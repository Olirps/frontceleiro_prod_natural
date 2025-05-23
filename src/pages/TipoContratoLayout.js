import React, { useState, useEffect } from 'react';
import { getTipoContratosLayout } from '../services/api';
import Pagination from '../utils/Pagination';
import ModalTipoContratoLayout from '../components/ModalTipoContratoLayout';
import Toast from '../components/Toast';

const TipoContratosLayout = () => {
    /*Padrões*/
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [executarBusca, setExecutarBusca] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [isEdit, setIsEdit] = useState(false);

    /*Padrões*/
    const [tipoContratos, setTipoContratos] = useState([]);
    const [descricao, setDescricao] = useState([]);
    const [status, setStatus] = useState('todos');
    const [selectedTipoContrato, setSelectedTipoContrato] = useState('');
    const [isModalCadastroOpen, setIsModalCadastroOpen] = useState(false);


    useEffect(() => {
        setExecutarBusca(true);
    }, []);


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const nomeFiltro = { descricao, status };
                const data = await getTipoContratosLayout(
                    nomeFiltro === '' ? undefined : nomeFiltro,
                    currentPage,
                    rowsPerPage
                );
                setTipoContratos(data.data || []);
                setTotalPages(data.totalPaginas || 1);
            } catch (error) {
                console.error('Erro ao buscar tipos de contratos:', error);
                setToast({ message: 'Erro ao carregar dados.', type: 'error' });
            } finally {
                setLoading(false);
                setExecutarBusca(false);
            }
        };
        fetchData();
    }, [executarBusca, status, currentPage, rowsPerPage]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleClear = () => {
        setDescricao('');
        setTipoContratos([]);
        setCurrentPage(1);
        setRowsPerPage(10);
        setExecutarBusca(true);
    }

    const handleCadastrarTipoLayout = () => {
        setIsEdit(false);
        setIsModalCadastroOpen(true);
    }

    const handleEditClick = (contrato) => {
        setIsEdit(true);
        setSelectedTipoContrato(contrato);
        setIsModalCadastroOpen(true);
    }
    const confirmCadastro = () => {
        setToast({ message: 'Tipo Contrato Layout Adionado com sucesso', type: "success" });
    }

    const handleRefresh = () => {
        setIsModalCadastroOpen(false);
        setExecutarBusca(true);
    }
    return (
        <div style={{ padding: '20px' }}>
            <h1 className='title-page'>Tipo Contratos Layout</h1>
            <div id="search-container">
                <div id="search-fields">
                    <div>
                        <label htmlFor="descricao">Descricao:</label>
                        <input
                            className='input-geral'
                            type="text"
                            id="descricao"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
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
                </div>
                <div>
                    <div id="button-group">
                        <button
                            onClick={() => {
                                setCurrentPage(1); // reinicia na primeira página ao buscar
                                setExecutarBusca(true);
                            }}
                            className="button"
                        >
                            Pesquisar
                        </button>
                        <button onClick={handleClear} className="button">Limpar</button>
                        <button onClick={() => {
                            handleCadastrarTipoLayout()
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
                                        <th>descricao</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tipoContratos.map((contrato) => (
                                        <tr key={contrato.id}>
                                            <td>{contrato.id}</td>
                                            <td>{contrato.descricao}</td>
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
                            {tipoContratos.length > 0 && (
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
                <ModalTipoContratoLayout
                    isOpen={isModalCadastroOpen}
                    onClose={() => handleRefresh()}
                    edit={isEdit}
                    tipoLayout={selectedTipoContrato}
                    onTipoLayoutAdicionado={() => confirmCadastro()}
                />
            )}
        </div>
    );
}
export default TipoContratosLayout;