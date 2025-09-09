import React, { useState, useEffect } from 'react';
import {
  getSubGrupoProdutos,
  addSubGrupoProdutos,
  updateSubGrupoProduto,
  getSubGrupoProdutoById,
  getGrupoProdutos
} from '../services/GrupoSubGrupoProdutos';
import Toast from '../components/Toast';
import Modal from '../components/ModalCadastroSubgrupo';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";
import Pagination from '../utils/Pagination';

const SubgrupoPage = () => {
  const [subgrupos, setSubgrupos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [nome, setNome] = useState('');
  const [grupoNome, setGrupoNome] = useState('');
  const [status, setStatus] = useState('');
  const [grupoId, setGrupoId] = useState('');
  const [executarBusca, setExecutarBusca] = useState(true);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubgrupo, setSelectedSubgrupo] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });
  //Permissoes
  const { permissions } = useAuth();
  const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    handleSearch();
  }, [currentPage, rowsPerPage, status, grupoNome, executarBusca]);

  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const response = await getGrupoProdutos({ status: 'ativo', page: 1, rowsPerPage: 100 });
        setGrupos(response.data);
        await handleSearch(); // <-- dispara a busca dos subgrupos após carregar os grupos
      } catch (error) {
        console.error('Erro ao carregar grupos de produtos:', error);
        setToast({ message: 'Erro ao carregar grupos de produtos.', type: 'error' });
      }
    };
    fetchGrupos();
  }, []);


  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await getSubGrupoProdutos({
        nome,
        status,
        grupoNome,
        grupoId,
        currentPage,
        rowsPerPage
      });
      const todos = response.data;

      const filtrados = todos.filter((sg) => {
        const matchDescricao = nome
          ? sg.nome.toLowerCase().includes(nome.toLowerCase())
          : true;
        const matchGrupo = grupoId ? sg.gpid === grupoId : true;
        return matchDescricao && matchGrupo;
      });

      setSubgrupos(filtrados);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      setToast({ message: 'Erro ao buscar subgrupos.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setNome('');
    setGrupoId('');
    setGrupoNome('');
    setCurrentPage(1);
    handleSearch();
  };

  const handleCadastrarModal = () => {
    checkPermission('subgrupoproduto', 'insert', () => {
      setIsModalOpen(true);
      setIsEdit(false);
      setSelectedSubgrupo(null);
    })

  };

  const handleAtualizarPage = () => {
    setIsModalOpen(false);
    setSelectedSubgrupo(null);
    setIsEdit(false);
    handleSearch();
  };

  const handleAddSubgrupo = async (e) => {
    const newSubgrupo = {
      nome: e.nome,
      descricao: e.descricao,
      gpid: e.grupoId,
      status: e.status
    };

    try {
      await addSubGrupoProdutos(newSubgrupo);
      setToast({ message: "Subgrupo cadastrado com sucesso!", type: "success" });
      handleAtualizarPage();
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao cadastrar subgrupo.";
      setToast({ message: msg, type: "error" });
    }
  };

  const handleEditClick = async (subgrupo) => {
    try {
      checkPermission('subgrupoproduto', 'viewcadastro', async () => {
        const response = await getSubGrupoProdutoById(subgrupo.id);
        setSelectedSubgrupo(response.data);
        setIsEdit(true);
        setIsModalOpen(true);
      })
    } catch (err) {
      setToast({ message: "Erro ao carregar dados do subgrupo.", type: "error" });
    }
  };

  const handleEditSubmit = async (e) => {
    const updated = {
      descricao: e.descricao,
      gpid: e.grupoId,
      status: e.status

    };

    try {
      await updateSubGrupoProduto(selectedSubgrupo.id, updated);
      setToast({ message: "Subgrupo atualizado com sucesso!", type: "success" });
      handleAtualizarPage();
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao atualizar subgrupo.";
      setToast({ message: msg, type: "error" });
    }
  };

  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentSubgrupos = subgrupos;

  return (
    <div id="subgrupo-container">
      <h1 className="title-page">Subgrupos</h1>

      <div id="search-container">
        <div id="search-fields">
          <div>
            <label htmlFor="descricao">Nome</label>
            <input
              className="input-geral"
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="grupo">Grupo</label>
            <select
              className="select-veiculos-geral"
              id="grupo"
              value={grupoNome}
              onChange={(e) => {
                const nomeSelecionado = e.target.value;
                setGrupoNome(nomeSelecionado);

                const grupoEncontrado = grupos.find(g => g.nome === nomeSelecionado);
                if (grupoEncontrado) {
                  setGrupoId(grupoEncontrado.id);
                } else {
                  setGrupoId('');
                }
              }}
            >
              <option value="todos">Todos</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.nome}>{g.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status">Status</label>
            <select
              className="input-geral"
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>

        <div id="button-group">
          <button onClick={handleSearch} className="button">Pesquisar</button>
          <button onClick={handleClear} className="button">Limpar</button>
          <button onClick={handleCadastrarModal} className="button">Cadastrar</button>
        </div>
      </div>

      <div id="separator-bar" />

      <div id="results-container">
        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : subgrupos.length === 0 ? (
          <p className="empty-message">Nenhum subgrupo cadastrado.</p>
        ) : (
          <div id="grid-padrao-container">
            <table id="grid-padrao">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Grupo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentSubgrupos.map((sg) => {
                  return (
                    <tr key={sg.id}>
                      <td>{sg.id}</td>
                      <td>{sg.nome}</td>
                      <td>{sg.grupoNome || '-'}</td>
                      <td>
                        <button
                          onClick={() => handleEditClick(sg)}
                          className="edit-button"
                        >
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {currentSubgrupos && currentSubgrupos.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              setExecutarBusca(true);
            }}
            onRowsChange={(rows) => {
              setRowsPerPage(rows);
              setCurrentPage(1);
              setExecutarBusca(true);
            }}
            rowsPerPage={rowsPerPage}
          />
        </div>
      )}

      {toast.message && <Toast type={toast.type} message={toast.message} />}

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onSubmit={isEdit ? handleEditSubmit : handleAddSubgrupo}
          SubGrupoProduto={selectedSubgrupo}
          edit={isEdit}
          onClose={handleAtualizarPage}
          grupos={grupos} // Se quiser popular o select do modal também
        />
      )}
      {/* Renderização do modal de autorização */}
      <PermissionModalUI />
    </div>
  );
};

export default SubgrupoPage;
