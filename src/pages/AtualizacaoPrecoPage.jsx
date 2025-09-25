//Page
import React, { useEffect, useState } from "react";

import { getAtualizacoesPreco, getByAtualizacaoId } from "../services/ApiPreco/ApiPreco";
import AtualizacaoPrecoModal from "../components/AtualizacaoPrecoModal";
import Pagination from "../utils/Pagination";
import Toast from '../components/Toast';

import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";

export default function AtualizacaoPrecoPage() {
    const [toast, setToast] = useState({ message: '', type: '' });
    const [isEdit, setIsEdit] = useState(false);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [linhasPorPagina, setLinhasPorPagina] = useState(50);
    const [produtosAtualizados, setProdutosAtualizados] = useState([]);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [filtros, setFiltros] = useState({
        dataInicio: "",
        dataFim: "",
        status: "",
        usuario: "",
    });
    const [atualizacoes, setAtualizacoes] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [loading, setLoading] = useState(false);
    const [executar, setExecutar] = useState(false);
    const [atualizacaoSelecionada, setAtualizacaoSelecionada] = useState(null);
    //Permissoes
    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        checkPermission("atualiza-preco", "view", async () => {
            fetchAtualizacoes();
        });

    }, [filtros, paginaAtual, linhasPorPagina, executar]);

    const handleChangeRowsPerPage = (newRowsPerPage) => {
        setLinhasPorPagina(newRowsPerPage);
        setPaginaAtual(1); // Reseta para a primeira página
    };

    async function fetchAtualizacoes() {
        try {
            setLoading(true);

            const data = await getAtualizacoesPreco({
                page: paginaAtual,
                limit: linhasPorPagina,
                filtros
            });

            setAtualizacoes(data.items || []); // garante que vem array
            setTotalPaginas(data.totalPages || 1);
        } catch (error) {
            console.error("Erro ao buscar atualizações:", error);
            setAtualizacoes([]); // evita ficar com dados antigos
        } finally {
            setLoading(false);
            setExecutar(false);
        }
    }


    function handleFiltroChange(e) {
        setFiltros({ ...filtros, [e.target.name]: e.target.value });
    }

    function handleAbrirModal(atualizacao) {
        checkPermission('atualiza-preco', 'insert', async () => {
            setIsEdit(true);
            setAtualizacaoSelecionada(atualizacao);
            await getByAtualizacaoId(atualizacao.id).then(data => {
                setProdutosAtualizados(data.items || []);
            }).catch(err => {
                console.error("Erro ao buscar itens da atualização:", err);
                setProdutosAtualizados([]);
            });
            setModalAberto(true);
        })
    }

    return (
        <div className="p-6 max-w-full">
            <h1 className="text-3xl font-bold mb-6">Atualização de Preço</h1>

            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <input
                    type="date"
                    name="dataInicio"
                    value={filtros.dataInicio}
                    onChange={handleFiltroChange}
                    className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <input
                    type="date"
                    name="dataFim"
                    value={filtros.dataFim}
                    onChange={handleFiltroChange}
                    className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <select
                    name="status"
                    value={filtros.status}
                    onChange={handleFiltroChange}
                    className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                >
                    <option value="">Todos os Status</option>
                    <option value="pendente">Pendente</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="rejeitado">Rejeitado</option>
                </select>
                <input
                    type="text"
                    name="usuario"
                    value={filtros.usuario}
                    onChange={handleFiltroChange}
                    placeholder="Usuário"
                    className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => setExecutar(true)}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow-md transition-colors"
                    >
                        {loading ? "Pesquisando..." : "Pesquisar"}
                    </button>

                    <button
                        type="button"
                        onClick={() => setModalAberto(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-md transition-colors"
                    >
                        Nova Atualização
                    </button>
                </div>
            </div>

            {/* Tabela responsiva */}
            <div className="overflow-x-auto rounded-lg shadow-md">
                <table className="w-full min-w-[800px] border-collapse border border-gray-200">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="border-b p-3 text-sm font-medium text-gray-700">ID</th>
                            <th className="border-b p-3 text-sm font-medium text-gray-700">Itens</th>
                            <th className="border-b p-3 text-sm font-medium text-gray-700">Observação</th>
                            <th className="border-b p-3 text-sm font-medium text-gray-700">Usuário Criação</th>
                            <th className="border-b p-3 text-sm font-medium text-gray-700">Usuário Aprovação</th>
                            <th className="border-b p-3 text-sm font-medium text-gray-700">Status</th>
                            <th className="border-b p-3 text-sm font-medium text-gray-700">Data Criação</th>
                            <th className="border-b p-3 text-sm font-medium text-gray-700">Data Aprovação</th>
                            <th className="border-b p-3 text-sm font-medium text-gray-700 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {atualizacoes.length > 0 ? (
                            atualizacoes.map((a, index) => (
                                <tr key={a.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                    <td className="border-b p-3 text-sm">{a.id}</td>
                                    <td className="border-b p-3 text-sm">{a.quantidade_itens}</td>
                                    <td className="border-b p-3 text-sm">{a.observacao}</td>
                                    <td className="border-b p-3 text-sm">{a.usuario_create}</td>
                                    <td className="border-b p-3 text-sm">{a.usuario_approve || "-"}</td>
                                    <td className="border-b p-3 text-sm capitalize">{a.status}</td>
                                    <td className="border-b p-3 text-sm">{new Date(a.data_create).toLocaleString()}</td>
                                    <td className="border-b p-3 text-sm">
                                        {a.data_approved ? new Date(a.data_approved).toLocaleString() : "-"}
                                    </td>
                                    <td className="border-b p-3 text-sm text-center">
                                        <button
                                            onClick={() => handleAbrirModal(a)}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Ver Detalhes
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="border-b p-3 text-center text-gray-500" colSpan={9}>
                                    Nenhuma atualização de preço encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Detalhes */}
            {
                modalAberto && (
                    <AtualizacaoPrecoModal
                        modo={isEdit ? "edit" : "cadastrar"}
                        atualizacao={atualizacaoSelecionada}
                        produtosAtualizados={produtosAtualizados}
                        onSuccess={() => {
                            setAtualizacaoSelecionada(null);
                            setProdutosAtualizados([]);
                            setIsEdit(false);
                            setExecutar(!executar); // força refresh na lista
                            setToast({ type: 'success', message: isEdit ? 'Atualização editada com sucesso!' : 'Atualização criada com sucesso!' });
                        }}
                        onClose={() => {
                            setAtualizacaoSelecionada(null);
                            setModalAberto(false);
                            setProdutosAtualizados([]);
                            setIsEdit(false);
                            setExecutar(!executar); // força refresh na lista
                        }}
                    />
                )
            }

            {/* Paginação */}
            <Pagination
                currentPage={paginaAtual}
                totalPages={totalPaginas}
                onPageChange={setPaginaAtual}
                onRowsChange={handleChangeRowsPerPage}
                rowsPerPage={linhasPorPagina}
                rowsPerPageOptions={[50, 100, 150]}
            />
            {toast.message && <Toast type={toast.type} message={toast.message} />}
            {/* Renderização do modal de autorização */}
            <PermissionModalUI />
        </div >
    );
}
