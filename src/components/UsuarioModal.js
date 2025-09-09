// src/components/UsuarioModal.js
import React, { useState, useEffect } from 'react';
import { saveUsuario } from '../services/ApiUsers/ApiUsers';
import { cpfCnpjMask, removeMaks } from '../components/utils';
import { addPermissoes, getPermissoes, addGrupoAcesso, getAllGrupoAcesso, updatePermissoes } from '../services/api';



const UsuarioModal = ({ modo, usuario, onClose, onSuccess }) => {
    const [username, setUsername] = useState('');
    const [senha, setSenha] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [grupoId, setGrupoId] = useState('');
    const [ativo, setAtivo] = useState(true);
    const [grupos, setGrupos] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Carregar grupos de acesso
        const fetchGrupos = async () => {
            try {
                const response = await getAllGrupoAcesso();
                setGrupos(response.data);
            } catch (err) {
                console.error('Erro ao buscar grupos:', err);
            }
        };
        fetchGrupos();

        if (usuario) {
            setUsername(usuario.username || '');
            setEmail(usuario.email || '');
            setCpf(usuario.cpfUser || '');
            setGrupoId(usuario.grupoAcessoId || '');
            setAtivo(usuario.ativo ?? true);
        }
    }, [usuario]);

    const handleSave = async () => {
        if (!username || !email || !grupoId) return alert('Preencha todos os campos!');
        setLoading(true);
        try {
            await saveUsuario({
                id: usuario?.id,
                username,
                password: senha,
                cpfUser: removeMaks(cpf),
                email,
                grupoAcessoId: grupoId,
                ativo,
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Erro ao salvar usuário:', err);
            alert('Erro ao salvar usuário!');
        } finally {
            setLoading(false);
        }
    };

    const isView = modo === 'visualizar';
    const titulo =
        modo === 'cadastrar' ? 'Cadastrar Usuário' :
            modo === 'editar' ? 'Editar Usuário' :
                'Visualizar Usuário';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-4xl p-6 rounded shadow-lg overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{titulo}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-black">&times;</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isView}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isView}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    {/* Campo CPF */}
                    <div>
                        <label className="block text-sm font-medium mb-1">CPF</label>
                        <input
                            type="text"
                            value={cpfCnpjMask(cpf)}
                            onChange={(e) => setCpf(e.target.value)}
                            disabled={isView}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            placeholder="000.000.000-00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Grupo de Acesso</label>
                        <select
                            value={grupoId}
                            onChange={(e) => setGrupoId(e.target.value)}
                            disabled={isView}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="">Selecione</option>
                            {grupos.map((g) => (
                                <option key={g.id} value={g.id}>{g.nome}</option>
                            ))}
                        </select>
                    </div>

                    {/* Campo Senha (apenas cadastrar/editar) */}
                    {!isView && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Senha</label>
                            <input
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={ativo}
                            onChange={(e) => setAtivo(e.target.checked)}
                            disabled={isView}
                            id="ativo-checkbox"
                        />
                        <label htmlFor="ativo-checkbox" className="text-sm">Ativo</label>
                    </div>

                    {!isView && (
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                        >
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UsuarioModal;
