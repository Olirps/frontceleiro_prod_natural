import React, { useEffect, useState } from 'react';
import Pagination from '../utils/Pagination';
import Toast from '../components/Toast';
import UsuarioModal from '../components/UsuarioModal';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";
import { getUsuarios } from '../services/ApiUsers/ApiUsers'; // API fictícia, ajuste conforme seu service
import { hasPermission } from '../utils/hasPermission';


const UsuariosPage = () => {
    //controle do modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalModo, setModalModo] = useState('cadastrar');
    // Estados
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [linhasPorPagina, setLinhasPorPagina] = useState(50);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });

    // Filtros
    const [nomeFiltro, setNomeFiltro] = useState('');
    const [emailFiltro, setEmailFiltro] = useState('');
    const [grupoFiltro, setGrupoFiltro] = useState('');
    //Permissoes
    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

    // Limpar resultados quando filtros mudam
    useEffect(() => {
        setUsuarios([]);
        setTotalPaginas(1);
    }, [nomeFiltro, emailFiltro, grupoFiltro]);

    // Buscar dados ao montar página ou mudar paginação
    useEffect(() => {
        carregarUsuarios();
    }, [paginaAtual, linhasPorPagina]);

    const handleChangeRowsPerPage = (newRowsPerPage) => {
        setLinhasPorPagina(newRowsPerPage);
        setPaginaAtual(1); // Resetar para primeira página
    };

    const carregarUsuarios = async () => {
        setLoading(true);
        try {
            const response = await getUsuarios({
                page: paginaAtual,
                limit: linhasPorPagina,
                nome: nomeFiltro,
                email: emailFiltro,
                grupo: grupoFiltro,
            });

            setUsuarios(response.data || []);
            setTotalPaginas(response.totalPages || 1);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            setToast({ message: 'Erro ao carregar usuários', type: 'error' });
            setUsuarios([]);
            setTotalPaginas(1);
        } finally {
            setLoading(false);
        }
    };

    const handleVisializar = (usuario) => {
        setUsuarioSelecionado(usuario);

        if (hasPermission(permissions, 'usuarios', 'edit')) {
            setModalModo('editar');
            setIsModalOpen(true);
            return;
        }

        if (hasPermission(permissions, 'usuarios', 'viewcadastro')) {
            setModalModo('visualizar');
            setIsModalOpen(true);
            return;
        }

        // Solicita autorização para editar; se negada, tenta viewcadastro
        checkPermission(
            'usuarios',
            'edit',
            () => {
                setModalModo('editar');
                setIsModalOpen(true);
            },
            () => {
                checkPermission(
                    'usuarios',
                    'viewcadastro',
                    () => {
                        setModalModo('visualizar');
                        setIsModalOpen(true);
                    }
                );
            }
        );
    }
    return (
        <div className="p-4">
            {/* Título e filtros */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h1 className="text-xl font-bold">Usuários</h1>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        placeholder="Filtrar por nome"
                        value={nomeFiltro}
                        onChange={(e) => setNomeFiltro(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    <input
                        type="text"
                        placeholder="Filtrar por email"
                        value={emailFiltro}
                        onChange={(e) => setEmailFiltro(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    <input
                        type="text"
                        placeholder="Filtrar por grupo"
                        value={grupoFiltro}
                        onChange={(e) => setGrupoFiltro(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    <button
                        onClick={() => {
                            setPaginaAtual(1);
                            carregarUsuarios();
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                    >
                        Filtrar
                    </button>
                    {/* Botão Cadastrar Usuário */}
                    <button
                        onClick={() => {
                            setIsModalOpen(true);
                            setModalModo('cadastrar');
                            setUsuarioSelecionado(null);
                        }
                        }
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm"
                    >
                        Cadastrar Usuário
                    </button>
                </div>
            </div>

            {/* Tabela */}
            {
                loading ? (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto shadow rounded mt-6">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-100 text-left">
                                <tr>
                                    <th className="py-2 px-4">Nome</th>
                                    <th className="py-2 px-4">Grupo</th>
                                    <th className="py-2 px-4">Status</th>
                                    <th className="py-2 px-4">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map((usuario, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="py-2 px-4">{usuario.username}</td>
                                        <td className="py-2 px-4">{usuario.grupoAcessoNome}</td>
                                        <td className="py-2 px-4">
                                            {usuario.status === "1" ? 'Ativo' : 'Inativo'}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleVisializar(usuario)}
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
            {/* Modal de Usuário - Implementar lógica de abertura/fechamento */}
            {
                isModalOpen && (
                    <UsuarioModal
                        modo={modalModo}
                        usuario={usuarioSelecionado}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={() => {
                            setIsModalOpen(false);
                            carregarUsuarios();
                            setToast({ message: 'Usuário salvo com sucesso', type: 'success' });
                        }}
                    />)
            }
            {/* Toast */}
            {
                toast.message && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast({ message: '', type: '' })}
                    />
                )
            }
            {/* Renderização do modal de autorização */}
            <PermissionModalUI />
        </div >
    );
};

export default UsuariosPage;
