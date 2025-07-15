import React, { useState, useEffect } from 'react';
import {
    getGrupoProdutos
} from '../services/GrupoSubGrupoProdutos';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission';

const ModalCadastroSubgrupo = ({ isOpen, onClose, edit, onSubmit, SubGrupoProduto }) => {
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [ativo, setAtivo] = useState(true); // novo estado
    const [grupos, setGrupos] = useState([]);
    const [grupoNome, setGrupoNome] = useState('');
    const [grupoId, setGrupoId] = useState('');
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [permiteEditar, setPermiteEditar] = useState(true);
    const { permissions } = useAuth();
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (isOpen) {
            const canEdit = hasPermission(permissions, 'grupoproduto', edit ? 'edit' : 'insert');
            setPermiteEditar(canEdit);
        }
    }, [isOpen, edit, permissions]);

    useEffect(() => {
        const fetchGrupos = async () => {
            try {
                const response = await getGrupoProdutos({ status: 'ativo', page: 1, rowsPerPage: 100 });
                const listaGrupos = response.data;
                setGrupos(listaGrupos);

                // Se estiver em modo edição, define grupoId e grupoNome baseado em SubGrupoProduto
                if (edit && SubGrupoProduto?.gpid) {
                    setNome(SubGrupoProduto.nome);
                    if (SubGrupoProduto.status !== 'ativo') setAtivo(false)
                    const grupoSelecionado = listaGrupos.find(g => g.id === SubGrupoProduto.gpid);
                    if (grupoSelecionado) {
                        setGrupoId(grupoSelecionado.id);
                        setGrupoNome(grupoSelecionado.nome); // Ou .descricao se preferir
                    }
                }

            } catch (error) {
                console.error('Erro ao carregar grupos de produtos:', error);
                setToast({ message: 'Erro ao carregar grupos de produtos.', type: 'error' });
            }
        };

        fetchGrupos();
    }, [edit, SubGrupoProduto]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        const fetchGrupos = async () => {
            try {
                const response = await getGrupoProdutos({ status: 'ativo', page: 1, rowsPerPage: 100 });
                setGrupos(response.data);
            } catch (error) {
                console.error('Erro ao carregar grupos de produtos:', error);
                setToast({ message: 'Erro ao carregar grupos de produtos.', type: 'error' });
            }
        };
        fetchGrupos();
    }, []);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit({ nome, descricao, grupoId, status: ativo ? 'ativo' : 'inativo' });
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6 relative">
                <button
                    className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-lg"
                    onClick={onClose}
                >
                    ×
                </button>

                <h2 className="text-xl font-semibold mb-4">
                    {edit ? 'Editar Sub Grupo de Produto' : 'Cadastrar Sub Grupo de Produto'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="grupo" className="block text-sm font-medium text-gray-700">
                            Grupo <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setOpen(!open)}
                                className="w-full border border-gray-300 rounded-md p-2 mt-1 text-left"
                            >
                                {grupoNome || 'Selecione um grupo'}
                            </button>
                            {open && (
                                <div className="absolute z-10 w-full max-h-40 overflow-y-auto bg-white border border-gray-300 rounded shadow-md">
                                    {grupos.map((g) => (
                                        <div
                                            key={g.id}
                                            onClick={() => {
                                                setGrupoNome(g.nome);
                                                setGrupoId(g.id);
                                                setOpen(false);
                                            }}
                                            className="p-2 hover:bg-blue-100 cursor-pointer"
                                        >
                                            {g.nome}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>


                        <label className="block text-sm font-medium text-gray-700">
                            Nome <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={nome}
                            autoFocus
                            onChange={(e) => setNome(e.target.value)}
                            maxLength={100}
                            disabled={!permiteEditar}
                            required
                            className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição</label>
                        <textarea
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            rows={3}
                            maxLength={254}
                            disabled={!permiteEditar}
                            className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="ativo"
                            checked={ativo}
                            onChange={(e) => setAtivo(e.target.checked)}
                            disabled={!permiteEditar}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label htmlFor="ativo" className="text-sm text-gray-700">Ativo</label>
                    </div>

                    {permiteEditar && (
                        <div className="text-right">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                            >
                                {loading ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    )}
                </form>
            </div >

            {toast.message && <Toast type={toast.type} message={toast.message} />}
        </div >
    );
};

export default ModalCadastroSubgrupo;