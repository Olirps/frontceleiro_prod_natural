import React, { useState, useEffect } from 'react';
import { getSubGrupoProdutos, addSubGrupoProdutos, updateSubGrupoProduto, getSubGrupoProdutoById } from '../services/api';
import '../styles/SubgrupoPage.css';
import Modal from '../components/ModalCadastroSubgrupo';
import Toast from '../components/Toast';

function SubgrupoPage() {
  const [subgrupos, setSubgrupos] = useState([]);
  const [filteredSubgrupos, setFilteredSubgrupos] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedSubgrupo, setSelectedSubgrupo] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const fetchSubgrupos = async () => {
      try {
        const response = await getSubGrupoProdutos();
        setSubgrupos(response.data);
        setFilteredSubgrupos(response.data);
      } catch (err) {
        console.error('Erro ao buscar subgrupos', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubgrupos();
  }, []);

  const handleSearch = () => {
    const lowerDescricao = descricao.toLowerCase();
    const results = subgrupos.filter(subgrupo =>
      lowerDescricao ? subgrupo.descricao.toLowerCase().includes(lowerDescricao) : true
    );
    setFilteredSubgrupos(results);
    setCurrentPage(1); 
  };

  const handleClear = () => {
    setDescricao('');
    setFilteredSubgrupos(subgrupos);
    setCurrentPage(1);
  };

  const handleAddSubgrupo = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newSubgrupo = { descricao: formData.get('descricao') };

    try {
      await addSubGrupoProdutos(newSubgrupo);
      setToast({ message: "Subgrupo cadastrado com sucesso!", type: "success" });
      setIsModalOpen(false);
      const response = await getSubGrupoProdutos();
      setSubgrupos(response.data);
      setFilteredSubgrupos(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao cadastrar subgrupo.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  const handleEditClick = async (subgrupo) => {
    try {
      const response = await getSubGrupoProdutoById(subgrupo.id);
      setSelectedSubgrupo(response.data);
      setIsEdit(true);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Erro ao buscar detalhes do subgrupo', err);
      setToast({ message: "Erro ao buscar detalhes do subgrupo.", type: "error" });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedSubgrupo = { descricao: formData.get('descricao') };

    try {
      await updateSubGrupoProduto(selectedSubgrupo.id, updatedSubgrupo);
      setToast({ message: "Subgrupo atualizado com sucesso!", type: "success" });
      setIsModalOpen(false);
      setSelectedSubgrupo(null);
      setIsEdit(false);
      const response = await getSubGrupoProdutos();
      setSubgrupos(response.data);
      setFilteredSubgrupos(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao atualizar subgrupo.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  const totalPages = Math.ceil(filteredSubgrupos.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentSubgrupos = filteredSubgrupos.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div id="subgrupo-container">
      <h1 id="subgrupo-title">Consulta de Subgrupos</h1>
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>) : (
        <>
          <div id="search-container">
            <input
              type="text"
              placeholder="Descrição do Subgrupo"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
            <button onClick={handleSearch} className="button">Pesquisar</button>
            <button onClick={handleClear} className="button">Limpar</button>
            <button onClick={() => { setIsModalOpen(true); setIsEdit(false); setSelectedSubgrupo(null); }} className="button">Cadastrar</button>
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
                {currentSubgrupos.map((subgrupo) => (
                  <tr key={subgrupo.id}>
                    <td>{subgrupo.id}</td>
                    <td>{subgrupo.descricao}</td>
                    <td>
                      <button onClick={() => handleEditClick(subgrupo)} className="edit-button">Editar</button>
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
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={isEdit ? handleEditSubmit : handleAddSubgrupo}
          subgrupo={selectedSubgrupo}
        />
      )}
    </div>
  );
}

export default SubgrupoPage;
