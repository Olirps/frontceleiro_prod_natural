import React, { useState, useEffect } from 'react';
import { addOS, getAllOS, getByIdOS, updateOS, getWorkFlowIdOS, aprovarOS, getEmpresaById } from '../services/api'; // Adicione os serviços corretos
import { registravenda } from '../services/ApiVendas/ApiVendas';
import ModalCadastroOS from '../components/ModalCadastroOS'; // Componente para o modal de cadastro
import ConfirmDialog from '../components/ConfirmDialog'; // Componente para o modal de confirmação
import SaleModal from '../components/SaleModal'; // Componente para o modal de confirmação
import { formatarDataHora, formatarData, formatarMoedaBRL } from '../utils/functions';
import Pagination from '../utils/Pagination'; // Importando o componente
import gerarOSPDF from '../relatorios/gerarOSPDF'; // Importando o componente
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";

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
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [workFlow, setWorkFlow] = useState([]);
    const [venda, setVenda] = useState();
    const [saleSuccess, setSaleSuccess] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [osToApprove, setOsToApprove] = useState(null); // Guardar a O.S. a ser aprovada
    const [dataInicio, setDataInicio] = useState("");
    const [totalPages, setTotalPages] = useState(1);
    const [openActionMenu, setOpenActionMenu] = useState(null);


    //Permissoes
    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

    useEffect(() => {
        checkPermission("os", "view")
    }, [])

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        const fetchOS = async () => {
            try {
                const params = {
                    page: currentPage,
                    limit: rowsPerPage,
                };
                const response = await getAllOS(params);
                setOsList(response.data);
                setFilteredOsList(response.data);
                setTotalPages(response.totalPages || 1);
            } catch (error) {
                console.error('Erro ao buscar ordens de serviço:', error);
                setOsList([]);
                setFilteredOsList([]);
                setTotalPages(1);
            } finally {
                setLoading(false);
            }
        };
        fetchOS();
    }, [currentPage, rowsPerPage]);

    const handleSearch = async () => {
        try {
            setLoading(true);

            const params = {
                cliente: descricao || undefined,
                data_inicio: dataInicio || undefined,
                status: status || undefined,
                page: 1, // Resetar para primeira página ao pesquisar
                limit: rowsPerPage,
            };

            const response = await getAllOS(params);

            setOsList(response.data);
            setFilteredOsList(response.data);
            setTotalPages(response.totalPages || 1);
            setCurrentPage(1); // Garantir que volta para primeira página
        } catch (error) {
            setToast({
                type: "error",
                message: "Erro ao buscar Ordens de Serviço",
            });
        } finally {
            setLoading(false);
        }
    };


    const handleClear = async () => {
        setDescricao('');
        setStatus('');
        setDataInicio('');
        setCurrentPage(1);

        try {
            setLoading(true);
            const params = {
                page: 1,
                limit: rowsPerPage,
            };
            const response = await getAllOS(params);
            setOsList(response.data);
            setFilteredOsList(response.data);
            setTotalPages(response.totalPages || 1);
        } catch (error) {
            console.error('Erro ao buscar ordens de serviço:', error);
            setToast({ message: 'Erro ao carregar ordens de serviço', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCadastrarModal = () => {
        checkPermission('os', 'insert', () => {
            setIsModalOpen(true);
            setIsEdit(false);
            setSelectedOs(null);
        })
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

            // Atualizar a lista de O.S. após a aprovação com paginação
            const params = {
                page: currentPage,
                limit: rowsPerPage,
            };
            const responseOS = await getAllOS(params);
            setOsList(responseOS.data);
            setFilteredOsList(responseOS.data);
            setTotalPages(responseOS.totalPages || 1);

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

            const params = {
                page: currentPage,
                limit: rowsPerPage,
            };
            const response = await getAllOS(params);
            setOsList(response.data);
            setFilteredOsList(response.data);
            setTotalPages(response.totalPages || 1);
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

            const params = {
                page: currentPage,
                limit: rowsPerPage,
            };
            const response = await getAllOS(params);
            setOsList(response.data);
            setFilteredOsList(response.data);
            setTotalPages(response.totalPages || 1);
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
                const params = {
                    page: currentPage,
                    limit: rowsPerPage,
                };
                const updatedOSList = await getAllOS(params);
                setOsList(updatedOSList.data);
                setFilteredOsList(updatedOSList.data);
                setTotalPages(updatedOSList.totalPages || 1);

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

    // Usar dados paginados do servidor diretamente
    const currentOsList = filteredOsList;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Cadastro de Ordem de Serviço</h1>

            {/* LOADING */}
            {loading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* FILTROS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium">Cliente</label>
                            <input
                                type="text"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                maxLength={150}
                                placeholder="Nome do cliente"
                                className="w-full border rounded px-2 py-1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Data de Início</label>
                            <input
                                type="date"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                                className="w-full border rounded px-2 py-1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full border rounded px-2 py-1"
                            >
                                <option value="">Todos</option>
                                <option value="1">Ativo</option>
                                <option value="0">Inativo</option>
                            </select>
                        </div>
                    </div>

                    {/* BOTÕES */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button
                            onClick={handleSearch}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Pesquisar
                        </button>

                        <button
                            onClick={handleClear}
                            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                        >
                            Limpar
                        </button>

                        <button
                            onClick={handleCadastrarModal}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            Cadastrar O.S.
                        </button>
                    </div>

                    {/* TABELA */}
                    {filteredOsList.length === 0 ? (
                        <p className="text-gray-500">Nenhuma O.S. encontrada.</p>
                    ) : (
                        <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 text-left text-sm font-medium">#</th>
                                        <th className="p-2 text-left text-sm font-medium">ID</th>
                                        <th className="p-2 text-left text-sm font-medium">Cliente</th>
                                        <th className="p-2 text-left text-sm font-medium">Veículo</th>
                                        <th className="p-2 text-left text-sm font-medium">Status</th>
                                        <th className="p-2 text-left text-sm font-medium">Início</th>
                                        <th className="p-2 text-left text-sm font-medium">Término</th>
                                        <th className="p-2 text-left text-sm font-medium">Ações</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {currentOsList.map((os) => (
                                        <React.Fragment key={os.id}>
                                            <tr className={expandedRow === os.id ? "bg-blue-50" : ""}>
                                                <td className="p-2">
                                                    <button
                                                        onClick={() => toggleExpand(os.id)}
                                                        className="text-xs"
                                                    >
                                                        {expandedRow === os.id ? "▼" : "▶"}
                                                    </button>
                                                </td>

                                                <td className="p-2">{os.id}</td>
                                                <td className="p-2">{os.cliente_nome}</td>
                                                <td className="p-2">{os.veiculo || "-"}</td>
                                                <td className="p-2">{os.status_nome}</td>
                                                <td className="p-2">{formatarData(os.data_criacao)}</td>
                                                <td className="p-2">
                                                    {os.data_conclusao
                                                        ? formatarData(os.data_conclusao)
                                                        : "-"}
                                                </td>

                                                <td className="p-2 text-sm">
                                                    <div className="flex items-center gap-2">

                                                        {/* BOTÃO PRINCIPAL (contextual) */}
                                                        {os.status_nome === "Aguardando Aprovação" && (
                                                            <button
                                                                onClick={() => handleApproveClick(os.id)}
                                                                className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition"
                                                            >
                                                                Aprovar
                                                            </button>
                                                        )}

                                                        {os.status_nome === "Em Andamento" && (
                                                            <button
                                                                onClick={() => handleFinishClick(os.id)}
                                                                className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium hover:bg-indigo-200 transition"
                                                            >
                                                                Finalizar
                                                            </button>
                                                        )}

                                                        {/* DESKTOP: ações secundárias visíveis */}
                                                        <div className="hidden md:flex gap-2">
                                                            {os.status_nome !== "Concluída" ? (
                                                                <button
                                                                    onClick={() => handleEditClick(os)}
                                                                    className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs hover:bg-blue-200"
                                                                >
                                                                    Editar
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleSearchClick(os.id)}
                                                                    className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
                                                                >
                                                                    Visualizar
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => handlePrintClick(os.id)}
                                                                className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
                                                            >
                                                                Imprimir
                                                            </button>
                                                        </div>

                                                        {/* MOBILE: menu compacto */}
                                                        <div className="relative md:hidden">
                                                            <button
                                                                onClick={() =>
                                                                    setOpenActionMenu(openActionMenu === os.id ? null : os.id)
                                                                }
                                                                className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                                                            >
                                                                ⋯
                                                            </button>

                                                            {openActionMenu === os.id && (
                                                                <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow z-10">
                                                                    {os.status_nome !== "Concluída" ? (
                                                                        <button
                                                                            onClick={() => handleEditClick(os)}
                                                                            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                                                                        >
                                                                            Editar
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleSearchClick(os.id)}
                                                                            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                                                                        >
                                                                            Visualizar
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        onClick={() => handlePrintClick(os.id)}
                                                                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                                                                    >
                                                                        Imprimir
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                            </tr>

                                            {/* EXPANSÃO */}
                                            {expandedRow === os.id && (
                                                <tr className="bg-gray-50 text-sm">
                                                    <td colSpan={8} className="p-3">
                                                        <h4 className="font-semibold mb-2">
                                                            Histórico de Status
                                                        </h4>
                                                        <ul className="list-disc pl-4 space-y-1">
                                                            {workFlow.map((item, index) => (
                                                                <li key={index}>
                                                                    {item.status_nome} –{" "}
                                                                    {formatarDataHora(item.data_mudanca)}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* PAGINAÇÃO */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                        onRowsChange={(rows) => {
                            setRowsPerPage(rows);
                            setCurrentPage(1);
                        }}
                        rowsPerPage={rowsPerPage}
                    />
                </>
            )}

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

            <ConfirmDialog
                isOpen={isConfirmationModalOpen}
                onClose={handleCancel}
                onConfirm={() =>
                    handleApprove(osToApprove, {
                        status: "Aprovada",
                        data_aprovacao: new Date(),
                    })
                }
                onCancel={() => setIsConfirmationModalOpen(false)}
                message="Você tem certeza que deseja aprovar esta O.S.?"
            />

            <PermissionModalUI />
        </div>

    );
};

export default OSPage;