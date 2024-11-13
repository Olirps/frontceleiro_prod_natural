import React, { useState, useEffect } from 'react';
import { getGrupoProdutos, addGrupoProdutos, updateGrupoProduto, getGrupoProdutoById } from '../services/api';
import '../styles/GrupoPage.css';
import ModalCadastroGrupo from '../components/ModalCadastroGrupo';

import Toast from '../components/Toast';

function GrupoPage() {
  const [grupos, setGrupos] = useState([]);
  const [filteredGrupos, setFilteredGrupos] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const response = await getGrupoProdutos();
        setGrupos(response.data);
        setFilteredGrupos(response.data);
      } catch (err) {
        console.error('Erro ao buscar grupos', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrupos();
  }, []);

  const handleSearch = () => {
    const lowerDescricao = descricao.toLowerCase();
    const results = grupos.filter(grupo =>
      lowerDescricao ? grupo.descricao.toLowerCase().includes(lowerDescricao) : true
    );
    setFilteredGrupos(results);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setDescricao('');
    setFilteredGrupos(grupos);
    setCurrentPage(1);
  };

  const handleAddGrupo = async (grupoData) => {
    try {
      await addGrupoProdutos(grupoData);
      setToast({ message: "Grupo cadastrado com sucesso!", type: "success" });
      setIsModalOpen(false);
      //fetchGrupos(); // Atualiza a lista de grupos
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao cadastrar grupo.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  const handleEditSubmit = async (grupoData) => {
    try {
      await updateGrupoProduto(grupoData.id, grupoData);
      setToast({ message: "Grupo atualizado com sucesso!", type: "success" });
      setIsModalOpen(false);
      //fetchGrupos(); // Atualiza a lista de grupos
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao atualizar grupo.";
      setToast({ message: errorMessage, type: "error" });
    }
  };


  const handleEditClick = async (grupo) => {
    try {
      const response = await getGrupoProdutoById(grupo.id);
      setSelectedGrupo(response.data);
      setIsEdit(true);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Erro ao buscar detalhes do grupo', err);
      setToast({ message: "Erro ao buscar detalhes do grupo.", type: "error" });
    }
  };

  const totalPages = Math.ceil(filteredGrupos.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentGrupos = filteredGrupos.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div id="grupo-container">
      <h1 id="grupo-title">Consulta de Grupos</h1>
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>) : (
        <>
          <div id="search-container">
            <input
              type="text"
              placeholder="Descrição do Grupo"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
            <button onClick={handleSearch} className="button">Pesquisar</button>
            <button onClick={handleClear} className="button">Limpar</button>
            <button onClick={() => { setIsModalOpen(true); setIsEdit(false); setSelectedGrupo(null); }} className="button">Cadastrar</button>
          </div>

          <div id="results-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Descrição</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentGrupos.map((grupo) => (
                  <tr key={grupo.id}>
                    <td>{grupo.id}</td>
                    <td>{grupo.descricao}</td>
                    <td>
                      <button onClick={() => handleEditClick(grupo)} className="edit-button">Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div id="pagination-container">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Anterior</button>
            <span>Página {currentPage} de {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Próxima</button>
          </div>

          <div id="show-more-container">
            <label htmlFor="rows-select">Mostrar</label>
            <select id="rows-select" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <label>por página</label>
          </div>
        </>
      )}

      {toast.message && <Toast type={toast.type} message={toast.message} />}
      {isModalOpen && (
        <ModalCadastroGrupo
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={isEdit ? handleEditSubmit : handleAddGrupo}
          grupo={selectedGrupo}
        />
      )}
    </div>
  );
}

export default GrupoPage;
