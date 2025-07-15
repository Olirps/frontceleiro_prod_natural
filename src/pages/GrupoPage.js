import React, { useState, useEffect } from 'react';
import {
  getGrupoProdutos,
  addGrupoProdutos,
  updateGrupoProduto,
  getGrupoProdutoById
} from '../services/GrupoSubGrupoProdutos';
import ModalCadastroGrupo from '../components/ModalCadastroGrupo';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission';
import Pagination from '../utils/Pagination';


const GrupoPage = () => {
  const [grupos, setGrupos] = useState([]);
  const [nome, setNome] = useState('');
  const [status, setStatus] = useState('ativo'); // <-- NOVO
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });
  const { permissions } = useAuth();
  const [executarBusca, setExecutarBusca] = useState(true);

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
  }, [currentPage, rowsPerPage, status, executarBusca]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await getGrupoProdutos({
        nome,
        status,
        currentPage,
        rowsPerPage
      });

      const todos = response.data || [];

      const filtrados = nome
        ? todos.filter(g => g.nome.toLowerCase().includes(nome.toLowerCase()))
        : todos;

      setGrupos(filtrados);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      setToast({ message: 'Erro ao buscar grupos.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setNome('');
    setStatus('');
    setCurrentPage(1);
    handleSearch();
  };

  const handleCadastrarModal = () => {
    if (!hasPermission(permissions, 'grupoproduto', 'insert')) {
      setToast({ message: "Você não tem permissão para cadastrar grupos.", type: "error" });
      return;
    }
    setIsModalOpen(true);
    setIsEdit(false);
    setSelectedGrupo(null);
  };

  const handleAtualizarPage = () => {
    setIsModalOpen(false);
    setSelectedGrupo(null);
    setIsEdit(false);
    handleSearch();
  };

  const handleAddGrupo = async (grupoData) => {
    try {
      await addGrupoProdutos(grupoData);
      setToast({ message: "Grupo cadastrado com sucesso!", type: "success" });
      handleAtualizarPage();
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao cadastrar grupo.";
      setToast({ message: msg, type: "error" });
    }
  };

  const handleEditClick = async (grupo) => {
    if (!hasPermission(permissions, 'grupoproduto', 'viewcadastro')) {
      setToast({ message: "Você não tem permissão para visualizar grupos.", type: "error" });
      return;
    }

    try {
      const response = await getGrupoProdutoById(grupo.id);
      setSelectedGrupo(response.data);
      setIsEdit(true);
      setIsModalOpen(true);
    } catch (err) {
      setToast({ message: "Erro ao carregar dados do grupo.", type: "error" });
    }
  };

  const handleEditSubmit = async (grupoData) => {
    try {
      await updateGrupoProduto(selectedGrupo.id, grupoData);
      setToast({ message: "Grupo atualizado com sucesso!", type: "success" });
      handleAtualizarPage();
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao atualizar grupo.";
      setToast({ message: msg, type: "error" });
    }
  };

  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentGrupos = grupos;

  return (
    <div id="grupo-container">
      <h1 className="title-page">Grupos</h1>

      <div id="search-container">
        <div id="search-fields">
          <div>
            <label htmlFor="nome">Nome</label>
            <input
              className="input-geral"
              id="descricao"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
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

      <div id="separator-bar"></div>

      <div id="results-container">
        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : grupos.length === 0 ? (
          <p className="empty-message">Nenhum grupo cadastrado.</p>
        ) : (
          <div id="grid-padrao-container">
            <table id="grid-padrao">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentGrupos?.length > 0 ? (
                  currentGrupos.map((grupo) => (
                    <tr key={grupo.id}>
                      <td>{grupo.id}</td>
                      <td>{grupo.nome}</td>
                      <td>{grupo.status}</td>
                      <td>
                        <button
                          onClick={() => handleEditClick(grupo)}
                          className="edit-button"
                        >
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-results">
                      Nenhum grupo encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {currentGrupos && currentGrupos.length > 0 && (
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
        <ModalCadastroGrupo
          isOpen={isModalOpen}
          onSubmit={isEdit ? handleEditSubmit : handleAddGrupo}
          grupoProduto={selectedGrupo}
          edit={isEdit}
          onClose={handleAtualizarPage}
        />
      )}
    </div>
  );
};

export default GrupoPage;
