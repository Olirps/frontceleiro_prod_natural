import React, { useState, useEffect } from 'react';
import {
    getGrupoProdutos,
    addGrupoProdutos,
    getSubGrupoProdutos,
    addSubGrupoProdutos,
    deleteGrupoProduto,
    deleteSubGrupoProduto
} from '../services/api';
import '../styles/GrupoSubgrupoPage.css'; // Importa o CSS

const GrupoSubgrupoPage = () => {
    const [grupos, setGrupos] = useState([]);
    const [subgrupos, setSubgrupos] = useState([]);
    const [novoGrupo, setNovoGrupo] = useState('');
    const [novoSubgrupo, setNovoSubgrupo] = useState('');
    const [grupoSelecionado, setGrupoSelecionado] = useState(null);

    const carregarGrupos = async () => {
        try {
            const response = await getGrupoProdutos();
            setGrupos(response.data);
        } catch (error) {
            console.error('Erro ao carregar grupos:', error);
        }
    };

    const carregarSubgrupos = async (grupoId) => {
        try {
            const response = await getSubGrupoProdutos({ gpid: grupoId });
            setSubgrupos(response.data);
        } catch (error) {
            console.error('Erro ao carregar subgrupos:', error);
        }
    };

    useEffect(() => {
        carregarGrupos();
    }, []);

    const criarGrupo = async () => {
        if (novoGrupo.trim()) {
            try {
                await addGrupoProdutos({ descricao: novoGrupo });
                setNovoGrupo('');
                carregarGrupos();
            } catch (error) {
                console.error('Erro ao criar grupo:', error.message);
            }
        }
    };

    const criarSubgrupo = async () => {
        if (novoSubgrupo.trim() && grupoSelecionado) {
            try {
                await addSubGrupoProdutos({ descricao: novoSubgrupo, gpid: grupoSelecionado });
                setNovoSubgrupo('');
                carregarSubgrupos(grupoSelecionado);
            } catch (error) {
                console.error('Erro ao criar subgrupo:', error.message);
            }
        }
    };

    const excluirGrupo = async (id) => {
        const confirmacao = window.confirm('Tem certeza que deseja excluir este grupo?');
        if (confirmacao) {
            try {
                await deleteGrupoProduto(id);
                setGrupoSelecionado(null); // Limpa a seleção
                setSubgrupos([]); // Limpa a lista de subgrupos
                carregarGrupos();
            } catch (error) {
                console.error('Erro ao excluir grupo:', error.message);
            }
        }
    };

    const excluirSubgrupo = async (id) => {
        const confirmacao = window.confirm('Tem certeza que deseja excluir este subgrupo?');
        if (confirmacao) {
            try {
                await deleteSubGrupoProduto(id);
                carregarSubgrupos(grupoSelecionado);
            } catch (error) {
                console.error('Erro ao excluir subgrupo:', error.message);
            }
        }
    };

    return (
        <div className="container">
            <h1 className="header">Gestão de Grupo e Subgrupo</h1>

            <div className="grupos-section">
                <h2>Grupos de Produtos</h2>
                <div id="search-container">
                    <div id="search-fields">

                        {grupos.length > 0 ? (
                            <div>
                                {grupos.map((grupo) => (
                                    <div key={grupo.id} className="grupo-item">
                                        <h3 className="grupo-title">{grupo.descricao}</h3>
                                        <button onClick={() => {
                                            setGrupoSelecionado(grupo.id);
                                            carregarSubgrupos(grupo.id);
                                        }}>
                                            Ver Subgrupos
                                        </button>
                                        <button className="button" onClick={() => excluirGrupo(grupo.id)}>Excluir</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>Nenhum grupo encontrado.</p>
                        )}

                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Novo grupo"
                                value={novoGrupo}
                                onChange={(e) => setNovoGrupo(e.target.value)}
                            />
                            <button onClick={criarGrupo}>Adicionar Grupo</button>
                        </div>
                    </div>
                </div>
            </div>

            {grupoSelecionado && (
                <div className="subgrupos-section">
                    <h2>Subgrupos do Grupo Selecionado</h2>
                    {subgrupos.length > 0 ? (
                        <div>
                            {subgrupos.map((subgrupo) => (
                                <div key={subgrupo.id} className="subgrupo-item">
                                    <h4 className="subgrupo-title">{subgrupo.descricao}</h4>
                                    <button className="button" onClick={() => excluirSubgrupo(subgrupo.id)}>Excluir</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Nenhum subgrupo encontrado.</p>
                    )}

                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Novo subgrupo"
                            value={novoSubgrupo}
                            onChange={(e) => setNovoSubgrupo(e.target.value)}
                        />
                        <button onClick={criarSubgrupo}>Adicionar Subgrupo ao grupo: {grupos.find(grupo => grupo.id === grupoSelecionado)?.descricao}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GrupoSubgrupoPage;
