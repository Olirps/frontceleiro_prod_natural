import React, { useState, useEffect } from 'react';
import { addOS, getAllOS, getByIdOS, updateOS, getWorkFlowIdOS, aprovarOS, registravenda, getEmpresaById } from '../services/api'; // Adicione os serviços corretos
import ModalCadastroOS from '../components/ModalCadastroOS'; // Componente para o modal de cadastro
import ConfirmDialog from '../components/ConfirmDialog'; // Componente para o modal de confirmação
import SaleModal from '../components/SaleModal'; // Componente para o modal de confirmação
import { formatarDataHora, formatarData, formatarMoedaBRL } from '../utils/functions';
import Pagination from '../utils/Pagination'; // Importando o componente
import gerarOSPDF from '../relatorios/gerarOSPDF'; // Importando o componente
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission';

const OSPage = () => {
    const [osList, setOsList] = useState([]);
    const [filteredOsList, setFilteredOsList] = useState([]);
    const [descricao, setDescricao] = useState('');
    const [status, setStatus] = useState('');
    const [selectedOs, setSelectedOs] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [isEdit, setIsEdit] = useState(false);
    const { permissions } = useAuth();
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [workFlow, setWorkFlow] = useState([]);
    const [venda, setVenda] = useState();
    const [saleSuccess, setSaleSuccess] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [osToApprove, setOsToApprove] = useState(null); // Guardar a O.S. a ser aprovada



    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        const fetchOS = async () => {
            try {
                const response = await getAllOS();
                setOsList(response.data);
                setFilteredOsList(response.data);
            } catch (error) {
                console.error('Erro ao buscar ordens de serviço:', error);
                setOsList([]);
            } finally {
                setLoading(false);
            }
        };
        fetchOS();
    }, []);

    const handleSearch = () => {
        const lowerDescricao = descricao.toLowerCase();

        const results = osList.filter(os =>
            (lowerDescricao ? os.descricao.toLowerCase().includes(lowerDescricao) : true) &&
            (status ? os.status === status : true)
        );

        setFilteredOsList(results);
        setCurrentPage(1); // Resetar para a primeira página após a busca
    };

    const handleClear = () => {
        setDescricao('');
        setStatus('');
        setFilteredOsList(osList);
        setCurrentPage(1); // Resetar para a primeira página ao limpar a busca
    };

    const handleCadastrarModal = () => {
        if (!hasPermission(permissions, 'os', 'insert')) {
            setToast({ message: "Você não tem permissão para cadastrar O.S.", type: "error" });
            return;
        }
        setIsModalOpen(true);
        setIsEdit(false);
        setSelectedOs(null);
    };

    const handleApproveClick = (os) => {
        setOsToApprove(os); // Guardar a O.S. a ser aprovada
        setIsConfirmationModalOpen(true); // Abrir o modal de confirmação
    };

    const handleApprove = async (osId, body) => {
        if (!osToApprove) return;

        try {
            const username = localStorage.getItem('username');
            body.login = username;
            // Lógica para aprovar a O.S. (enviar os dados para o backend)
            const response = await aprovarOS(osId, body);

            // Sucesso na aprovação
            setToast({ message: "O.S. Aprovada", type: "success" });

            // Fechar o modal e atualizar a lista de O.S.
            setIsConfirmationModalOpen(false);
            // Atualizar a lista de O.S. após a aprovação
            const responseOS = await getAllOS();
            setOsList(responseOS.data);
            setFilteredOsList(responseOS.data);

        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao aprovar O.S.";
            setToast({ message: errorMessage, type: "error" });
        }
    };

    const handleCancel = () => {
        setIsConfirmationModalOpen(false); // Fechar o modal sem realizar nada
    };

    const handleAddOS = async (e) => {
        try {
            const username = localStorage.getItem('username');
            e.login = username;
            await addOS(e);
            setToast({ message: "O.S. cadastrada com sucesso!", type: "success" });
            setIsModalOpen(false);
            const response = await getAllOS();
            setOsList(response.data);
            setFilteredOsList(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao cadastrar O.S.";
            setToast({ message: errorMessage, type: "error" });
        }
    };

    const handleEditClick = async (os) => {
        const osSelected = await getByIdOS(os.id)
        setSelectedOs(osSelected);
        setIsEdit(true);
        setIsModalOpen(true);
    };

    const handleEditSubmit = async (e) => {

        try {
            const username = localStorage.getItem('username');
            e.login = username;
            await updateOS(selectedOs.id, e);
            setToast({ message: "O.S. atualizada com sucesso!", type: "success" });
            setIsModalOpen(false);
            const response = await getAllOS();
            setOsList(response.data);
            setFilteredOsList(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao atualizar O.S.";
            setToast({ message: errorMessage, type: "error" });
        }
    };

    const handleFinishClick = async (id) => {
        try {
            const osFinalizar = await getByIdOS(id);
            setSelectedOs(osFinalizar);
            setIsSaleModalOpen(true);
        } catch (error) {
            console.error("Erro ao finalizar OS:", error);
        }

    };

    function converterData(dataString) {
        const partes = dataString.split(/[\/ :]/); // Divide a string em dia, mês, ano, hora, minuto e segundo
        const dia = partes[0];
        const mes = partes[1];
        const ano = partes[2];
        const hora = partes[3];
        const minuto = partes[4];
        const segundo = partes[5];

        return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`; // Usa template literals para formatar
    };

    const handleSubmitSale = async (e) => {
        let dataHoje = new Date().toLocaleString().replace(',', '');
        let dataAjustada = converterData(dataHoje);
        const username = localStorage.getItem('username');

        const saleData = {
            os_id: selectedOs.id,
            login: username,
            totalQuantity: e.totalQuantity,
            totalPrice: e.totalPrice,
            products: e.products,
            cliente: e.cliente,
            cliente_id: e.cliente_id,
            desconto: e.desconto,
            pagamentos: e.pagamentos,
            status: 0,
            dataVenda: dataAjustada,
            data_conclusao: e.data_conclusao
        };

        try {
            const empresa = await getEmpresaById(1);
            saleData.empresa = empresa.data;
            const response = await registravenda(saleData);

            if (response.status === 201) {
                setVenda(response.data.venda);
                setToast({ message: "O.S. finalizada com sucesso!", type: "success" });

                // Atualiza a lista de O.S. sem recarregar a página
                const updatedOSList = await getAllOS();
                setOsList(updatedOSList.data);
                setFilteredOsList(updatedOSList.data);

                // Fecha o modal de venda
                setIsSaleModalOpen(false);

                // Fecha o modal de OS se estiver aberto
                setIsModalOpen(false);

                // Reseta o estado da linha expandida se necessário
                setExpandedRow(null);
            }
        } catch (error) {
            console.error("Erro ao finalizar OS:", error);
            setToast({ message: "Erro ao finalizar O.S.", type: "error" });
        }
    };

    const handleSearchClick = async (vendaId) => {
        try {
            const response = await getByIdOS(vendaId);
            setSelectedOs(response); // Certifique-se que response.data tem a estrutura correta
            setIsModalOpen(true);
            setIsEdit(true); // Você está editando, então deve setar isso como true
        } catch (error) {
            console.error("Erro ao buscar O.S:", error);
            setToast({ message: "Erro ao carregar O.S", type: "error" });
        }
    };

    const handlePrintClick = async (id) => {
        try {
            const osCompleta = await getByIdOS(id); // Busca os dados completos da OS
            gerarOSPDF(osCompleta); // Gera o PDF
        } catch (error) {
            console.error("Erro ao gerar OS:", error);
        }
    };


    const toggleExpand = async (id) => {
        if (!expandedRow) {
            const work = await getWorkFlowIdOS(id)
            setWorkFlow(work)
        }
        setExpandedRow(expandedRow === id ? null : id); // Se a linha já estiver expandida, fecha; caso contrário, expande
    };

    // Cálculo da paginação
    const totalPages = Math.ceil(filteredOsList.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentOsList = filteredOsList.slice(startIndex, startIndex + rowsPerPage);

    return (
        <div id="os-page-container">
            <h1 className="title-page">Cadastro de Ordem de Serviço</h1>
            <div id="search-container">
                <div id="search-fields">
                    <div>
                        <label htmlFor="descricao">Descrição</label>
                        <input
                            className="input-geral"
                            type="text"
                            id="descricao"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            maxLength="150"
                        />
                    </div>
                    <div>
                        <label htmlFor="status">Status</label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
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
                        <button onClick={handleCadastrarModal} className="button">Cadastrar O.S.</button>
                    </div>
                </div>
            </div>
            <div id="separator-bar"></div>
            <div id="results-container">
                {loading ? (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>
                ) : filteredOsList.length === 0 ? (
                    <p className="empty-message">Nenhuma O.S. encontrada.</p>
                ) : (
                    <>
                        <div id="grid-padrao-container">
                            <table id="grid-padrao">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Cliente</th>
                                        <th>Veículo</th>
                                        <th>Status</th>
                                        <th>Data Início</th>
                                        <th>Data Término</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentOsList.map((os) => (
                                        <React.Fragment key={os.id}>
                                            <tr>
                                                <td>
                                                    <button
                                                        onClick={() => toggleExpand(os.id)}
                                                        className="expand-button"
                                                        title={expandedRow === os.id ? "Recolher" : "Expandir"}
                                                    >
                                                        {expandedRow === os.id ? "▼" : "▶"}
                                                    </button>
                                                    {os.id}
                                                </td>
                                                <td>{os.cliente_nome}</td>
                                                <td>{os.veiculo}</td>
                                                <td>{os.status_nome}</td>
                                                <td>{formatarData(os.data_criacao)}</td>
                                                <td>{os.data_conclusao ? formatarData(os.data_conclusao) : ''}</td>
                                                <td>
                                                    <div id="button-group">
                                                        {os.status_nome === "Aguardando Aprovação" ? (
                                                            <button
                                                                onClick={() => handleApproveClick(os.id)}
                                                                className="button"
                                                                title="Aprovar"
                                                            >
                                                                ✅
                                                            </button>
                                                        ) : os.status_nome === "Em Andamento" ? (
                                                            <button
                                                                onClick={() => handleFinishClick(os.id)} // You'll need to implement this handler
                                                                className="button"
                                                                title="Finalizar"
                                                            >
                                                                🎯
                                                            </button>
                                                        ) : ''}
                                                        {os.status_nome != "Concluída" ?
                                                            (<button
                                                                onClick={() => handleEditClick(os)}
                                                                className="button"
                                                                title="Editar"
                                                            >
                                                                ✏️
                                                            </button>) : <button
                                                                onClick={() => handleSearchClick(os.id)} // Implemente este handler
                                                                className="button"
                                                                title="Pesquisar"
                                                            >
                                                                🔍
                                                            </button>}
                                                        <button
                                                            onClick={() => handlePrintClick(os.id)} // You'll need to implement this handler
                                                            className="button"
                                                            title="Impressão"
                                                        >
                                                            🖨️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedRow === os.id && (
                                                <tr>
                                                    <td colSpan="7">
                                                        <div className="workflow-history">
                                                            <h4>Histórico de Status:</h4>
                                                            <ul>
                                                                {workFlow.map((status, index) => (
                                                                    <li key={index}>
                                                                        {status.status_nome} - {formatarDataHora(status.data_mudanca)}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            onRowsChange={setRowsPerPage}
                            rowsPerPage={rowsPerPage}
                        />
                    </>
                )}
            </div>
            {toast.message && <Toast type={toast.type} message={toast.message} />}
            {isModalOpen && (
                <ModalCadastroOS
                    isOpen={isModalOpen}
                    onSubmit={isEdit ? handleEditSubmit : handleAddOS}
                    os={selectedOs}
                    onClose={() => setIsModalOpen(false)}
                    edit={isEdit}
                />
            )}
            {isSaleModalOpen && (
                <SaleModal
                    isOpen={isSaleModalOpen}
                    onSubmit={handleSubmitSale}
                    saleData={selectedOs}
                    onClose={() => setIsSaleModalOpen(false)}
                    edit={isEdit}
                />
            )}
            {/* Modal de Confirmação */}
            <ConfirmDialog
                isOpen={isConfirmationModalOpen}
                onClose={handleCancel}
                onConfirm={() => handleApprove(osToApprove, { status: "Aprovada", data_aprovacao: new Date() })}
                onCancel={() => setIsConfirmationModalOpen(false)}
                message="Você tem certeza que deseja aprovar esta O.S.?"
            />
        </div>
    );
};

export default OSPage;