import React, { useState, useEffect } from 'react';
import '../styles/ModalCadastroGrupo.css';

function ModalCadastroGrupo({ isOpen, onClose, onSubmit, grupo }) {
    const [nome, setNome] = useState(grupo?.nome || '');
    const [descricao, setDescricao] = useState(grupo?.descricao || '');

    useEffect(() => {
        if (grupo) {
            setNome(grupo.nome || '');
            setDescricao(grupo.descricao || '');
        }
    }, [grupo]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            id: grupo?.id,
            nome,
            descricao,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{grupo ? 'Editar Grupo' : 'Cadastrar Grupo'}</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Nome do Grupo:
                        <input
                            type="text"
                            name="nome"
                            placeholder="Digite o nome do grupo"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Descrição:
                        <textarea
                            name="descricao"
                            placeholder="Descrição do grupo (opcional)"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />
                    </label>
                    <button type="submit">Salvar</button>
                    <button type="button" onClick={onClose}>Cancelar</button>
                </form>
            </div>
        </div>
    );
}

export default ModalCadastroGrupo;
