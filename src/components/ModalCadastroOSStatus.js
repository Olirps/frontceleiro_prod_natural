import React, { useState, useEffect } from 'react';
import { addOSStatus, getAllOSStatus } from '../services/api'; // Funções de API
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Função de permissão

const ModalCadastroOSStatus = ({ isOpen, onClose, edit, onSubmit, osStatus,status }) => {
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [ativo, setAtivo] = useState(true);
    const [ordem, setOrdem] = useState('');
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [permiteEditar, setPermiteEditar] = useState(true);
    const { permissions } = useAuth();

    useEffect(() => {
        if (isOpen && edit) {
            const canEdit = hasPermission(permissions, 'osstatus', edit ? 'edit' : 'insert');
            setPermiteEditar(canEdit);
        }
    }, [isOpen, edit, permissions]);

    useEffect(() => {
        if (status) {
            setNome(status.nome || '');
            setDescricao(status.descricao || '');
            setAtivo(status.ativo || true);
            setOrdem(status.ordem || '');
        } else {
            setNome('');
            setDescricao('');
            setAtivo(true);
            setOrdem('');
        }
    }, [status]);

    if (!isOpen) return null;
    if (loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>{edit ? 'Editar Status da Ordem de Serviço' : 'Cadastrar Status da Ordem de Serviço'}</h2>
                <form onSubmit={onSubmit}>
                    <div id='cadastro-padrao'>
                        <div>
                            <label htmlFor="ativo">Ativo</label>
                            <input
                                type="checkbox"
                                id="ativo"
                                name="ativo"
                                checked={ativo}
                                onChange={(e) => setAtivo(e.target.checked)}
                                disabled={!permiteEditar}
                            />
                        </div>
                        <div>
                            <label htmlFor="nome">Nome</label>
                            <input
                                className='input-geral'
                                type="text"
                                id="nome"
                                name="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                disabled={!permiteEditar}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="descricao">Descrição</label>
                            <input
                                className='input-geral'
                                type="text"
                                id="descricao"
                                name="descricao"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                disabled={!permiteEditar}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="ordem">Ordem</label>
                            <input
                                className='input-geral'
                                type="number"
                                id="ordem"
                                name="ordem"
                                value={ordem}
                                onChange={(e) => setOrdem(e.target.value)}
                                disabled={!permiteEditar}
                            />
                        </div>
                        <div id='button-group'>
                            {permiteEditar ? (
                                <button
                                    type="submit"
                                    id="btnsalvar"
                                    className="button"
                                >
                                    Salvar
                                </button>
                            ) : ''}
                        </div>
                    </div>
                </form>
            </div>
            {toast.message && <Toast type={toast.type} message={toast.message} />}
        </div>
    );
};

export default ModalCadastroOSStatus;
