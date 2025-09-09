// src/pages/TefTransacoesPage.js
import React, { useEffect, useState } from 'react';
import { formatarMoedaBRL } from '../utils/functions';
import { getTefTransacoes, imprimirComprovante, cancelaTefPayment } from '../services/ApiTef/ApiTef';
import Pagination from '../utils/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import TefTransactionModal from '../components/TefTransactionModal';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";

const TefTransacoesPage = () => {
    const getDataHoje = () => {
        const hoje = new Date();
        hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
        return hoje.toISOString().slice(0, 10);
    };
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [tefProcessing, setTefProcessing] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [transacaoId, setTransacaoId] = useState('');
    const [dados, setDados] = useState([]);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [linhasPorPagina, setLinhasPorPagina] = useState(50);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(true);
    //Permissoes
    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

    // Filtros
    const [dataInicial, setDataInicial] = useState(getDataHoje());
    const [dataFinal, setDataFinal] = useState(getDataHoje());
    const [status, setStatus] = useState('');
    const [nsuFiltro, setNsuFiltro] = useState('');

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        carregarDados();
    }, [paginaAtual, linhasPorPagina]);

    const handleChangeRowsPerPage = (newRowsPerPage) => {
        setLinhasPorPagina(newRowsPerPage);
        setPaginaAtual(1);
    };

    const carregarDados = async () => {
        setLoading(true);
        try {
            const response = await getTefTransacoes({
                page: paginaAtual,
                limit: linhasPorPagina,
                dataInicial,
                dataFinal,
                status,
                nsu: nsuFiltro,
            });

            setDados(response.data || []);
            setTotalPaginas(response.totalPages || 1);
        } catch (error) {
            console.error('Erro ao carregar transações TEF:', error);
            setToast({ message: 'Erro ao carregar transações TEF', type: 'error' });
            setDados([]);
            setTotalPaginas(1);
        } finally {
            setLoading(false);
        }
    };

    // Dentro do seu componente React
    const handleImprimir = async (transacao) => {
        try {
            const res = await imprimirComprovante(transacao.transacaoId);
        } catch (error) {
            setToast({ message: 'Erro ao gerar comprovante.', type: 'error' });
            console.error('Erro ao gerar comprovante:', error);
        } finally {

        }
    };

    const handleCancelar = (transacaoId) => {
        checkPermission('movimentacaotef', 'delete', () => {
            setTransacaoId(transacaoId);
            setIsConfirmationModalOpen(true);
        })
    };

    const handleCancel = () => {
        setIsConfirmationModalOpen(false); // Fechar o modal sem realizar nada
    };

    const confirmaCancelamentoTEF = async () => {
        try {
            setIsConfirmationModalOpen(false);
            setTefProcessing(true);
            setMensagem('Cancelamento');
            const response = await cancelaTefPayment({ intencaoVendaId: transacaoId.transacaoId });
            if (response.success) {
                setToast({ message: "Transação cancelada com sucesso!", type: "success" });
                carregarDados(); // Recarrega os dados para refletir a mudança
            } else {
                setToast({ message: `Erro ao cancelar a transação: ${response.error}`, type: "error" });
            }
        } catch (error) {
            console.error("Erro ao cancelar a transação:", error);
            setToast({ message: "Ocorreu um erro ao cancelar a transação.", type: "error" });
        } finally {
            setIsConfirmationModalOpen(false);
            setTransacaoId('');
            setTefProcessing(false);
            setMensagem('');
        }
    };

    return (
        <div className="p-4">
            {/* Título */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-xl font-bold">Transações TEF</h1>
                <button
                    onClick={() => window.print()}
                    className="bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1 rounded-md"
                >
                    Imprimir
                </button>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Data Inicial</label>
                    <input
                        type="date"
                        value={dataInicial}
                        onChange={(e) => setDataInicial(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Data Final</label>
                    <input
                        type="date"
                        value={dataFinal}
                        onChange={(e) => setDataFinal(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                    >
                        <option value="">Todos</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="pendente">Pendente</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="erro">Erro</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">NSU</label>
                    <input
                        type="text"
                        value={nsuFiltro}
                        onChange={(e) => setNsuFiltro(e.target.value)}
                        placeholder="Digite o NSU"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                </div>

                <div className="flex items-end">
                    <button
                        onClick={() => {
                            setPaginaAtual(1);
                            carregarDados();
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md w-full text-sm"
                    >
                        Filtrar
                    </button>
                </div>
            </div>

            {/* Tabela */}
            {loading ? (
                <div className="spinner-container mt-6">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="overflow-x-auto shadow rounded mt-6">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100 text-left">
                            <tr>
                                <th className="py-2 px-4">Venda</th>
                                <th className="py-2 px-4">Transação</th>
                                <th className="py-2 px-4">Data/Hora</th>
                                <th className="py-2 px-4">Bandeira</th>
                                <th className="py-2 px-4">Forma</th>
                                <th className="py-2 px-4">Valor</th>
                                <th className="py-2 px-4">Cancelado</th>
                                <th className="py-2 px-4">Ações</th> {/* Nova coluna */}
                            </tr>
                        </thead>
                        <tbody>
                            {dados.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className='py-2 px-4'>{item.venda_id || '-'}</td>
                                    <td className='py-2 px-4'>{item.transacaoId || '-'}</td>
                                    <td className="py-2 px-4">{item.dataHora ? new Date(item.dataHora).toLocaleString('pt-BR') : '-'}</td>
                                    <td className="py-2 px-4">{item.bandeira_cartao}</td>
                                    <td className="py-2 px-4">{item.tipo_transacao_nome}</td>
                                    <td className="py-2 px-4">{formatarMoedaBRL(item.valor)}</td>
                                    <td className="py-2 px-4 capitalize">{item.cancelamento ? 'Sim' : 'Não'}</td>
                                    <td className="py-2 px-4 flex gap-2">
                                        {/* Botão Cancelar */}
                                        <button
                                            onClick={() => handleCancelar(item)}
                                            disabled={item.cancelamento}
                                            className={`text-red-600 hover:text-red-800 ${item.cancelamento ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title="Cancelar"
                                        >
                                            🚫
                                        </button>

                                        {/* Botão Imprimir */}
                                        <button
                                            onClick={() => handleImprimir(item)}
                                            className="text-gray-700 hover:text-black"
                                            title="Imprimir"
                                        >
                                            🖨️
                                        </button>
                                    </td>

                                </tr>
                            ))}
                            {dados.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="text-center py-4">
                                        Nenhuma transação encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Paginação */}
            <Pagination
                currentPage={paginaAtual}
                totalPages={totalPaginas}
                onPageChange={setPaginaAtual}
                onRowsChange={handleChangeRowsPerPage}
                rowsPerPage={linhasPorPagina}
                rowsPerPageOptions={[50, 100, 150]}
            />
            {/* Modal de Confirmação */}
            <ConfirmDialog
                isOpen={isConfirmationModalOpen}
                onClose={handleCancel}
                onConfirm={() => confirmaCancelamentoTEF()}
                onCancel={() => setIsConfirmationModalOpen(false)}
                message="Tem certeza que deseja cancelar esta transação?"
            />
            <TefTransactionModal
                isOpen={tefProcessing}
                mensagem={mensagem || "Pagamento"}
                tempoTotalSegundos={90}
            />
            {/* Toast */}
            {toast.message && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ message: '', type: '' })}
                />
            )}
            {/* Renderização do modal de autorização */}
            <PermissionModalUI />

        </div>
    );
};

export default TefTransacoesPage;