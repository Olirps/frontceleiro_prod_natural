import React, { useState, useEffect } from 'react';
import { getFornecedores, addFornecedor, updateFornecedor, getFornecedorById } from '../services/api';
import '../styles/Fornecedores.css';
import Modal from '../components/ModalCadastroFornecedor';
import { cpfCnpjMask, removeMaks } from '../components/utils';
import Toast from '../components/Toast';

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [filteredFornecedores, setFilteredFornecedores] = useState([]);
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpf] = useState('');
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedFornecedor, setSelectedFornecedor] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        const response = await getFornecedores();
        setFornecedores(response.data);
        setFilteredFornecedores(response.data);
      } catch (err) {
        console.error('Erro ao buscar fornecedores', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFornecedores();
  }, []);

  const handleSearch = () => {
    const lowerNome = nome.toLowerCase();
    let lowerCpf = cpfCnpj.toLowerCase();
    lowerCpf = removeMaks(lowerCpf);
    const results = fornecedores.filter(fornecedor =>
      (lowerNome ? fornecedor.nome.toLowerCase().includes(lowerNome) : true) &&
      (lowerCpf ? fornecedor.cpfCnpj.toLowerCase().includes(lowerCpf) : true)
    );

    setFilteredFornecedores(results);
    setCurrentPage(1); // Resetar para a primeira página após a busca
  };

  const handleClear = () => {
    setNome('');
    setCpf('');
    setFilteredFornecedores(fornecedores);
    setCurrentPage(1); // Resetar para a primeira página ao limpar a busca
  };

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Resetar para a primeira página ao alterar o número de linhas
  };

  const handleCpfChange = (e) => {
    const { value } = e.target;
    setCpf(cpfCnpjMask(value));
  };

  const handleAddFornecedor = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newFornecedor = {
      nome: formData.get('nome'),
      cpfCnpj: formData.get('cpfCnpj'),
      email: formData.get('email'),
      celular: formData.get('celular').replace(/\D/g, ''),
      logradouro: formData.get('logradouro'),
      numero: formData.get('numero'),
      bairro: formData.get('bairro'),
      municipio: formData.get('municipio'),
      uf: formData.get('uf'),
      cep: formData.get('cep').replace(/\D/g, '')
    };

    try {
      await addFornecedor(newFornecedor);
      setToast({ message: "Fornecedor cadastrado com sucesso!", type: "success" });
      setIsModalOpen(false);
      const response = await getFornecedores();
      setFornecedores(response.data);
      setFilteredFornecedores(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao cadastrar fornecedor.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  const handleEditClick = async (fornecedor) => {
    try {
      const response = await getFornecedorById(fornecedor.id);
      setSelectedFornecedor(response.data);
      setIsEdit(true);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Erro ao buscar detalhes do fornecedor', err);
      setToast({ message: "Erro ao buscar detalhes do fornecedor.", type: "error" });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedFornecedor = {
      nome: formData.get('nome'),
      cpfCnpj: formData.get('cpfCnpj'),
      email: formData.get('email'),
      celular: formData.get('celular').replace(/\D/g, ''),
      logradouro: formData.get('logradouro'),
      numero: formData.get('numero'),
      bairro: formData.get('bairro'),
      municipio: formData.get('municipio'),
      uf: formData.get('uf'),
      cep: formData.get('cep').replace(/\D/g, '')
    };

    try {
      await updateFornecedor(selectedFornecedor.id, updatedFornecedor);
      setToast({ message: "Fornecedor atualizado com sucesso!", type: "success" });
      setIsModalOpen(false);
      setSelectedFornecedor(null);
      setIsEdit(false);
      const response = await getFornecedores();
      setFornecedores(response.data);
      setFilteredFornecedores(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao atualizar fornecedor.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const totalPages = Math.ceil(filteredFornecedores.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentFornecedores = filteredFornecedores.slice(startIndex, startIndex + rowsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div id="fornecedores-container">
      <h1 id="fornecedores-title">Consulta de Fornecedores</h1>
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>) : (
        <>
          <div id="search-container">
            <div id="search-fields">
              <div>
                <label htmlFor="nome">Nome</label>
                <input className="input-geral"
                  type="text"
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength="150"
                />
              </div>
              <div>
                <label htmlFor="cpfCnpj">CPF/CNPJ</label>
                <input className="input-geral"
                  type="text"
                  id="cpfCnpj"
                  value={cpfCnpjMask(cpfCnpj)}
                  onChange={handleCpfChange}
                  maxLength="18"
                />
              </div>
            </div>
            <div>
              <div id="button-group">
                <button onClick={handleSearch} className="button">Pesquisar</button>
                <button onClick={handleClear} className="button">Limpar</button>
                <button onClick={() => {
                  setIsModalOpen(true);
                  setIsEdit(false);
                  setSelectedFornecedor(null);
                }} className="button">Cadastrar</button>
              </div>
            </div>
          </div>

          <div id="separator-bar"></div>

          <div id="results-container">
            <div id="fornecedores-grid-container">
              <table id="fornecedores-grid">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>CPF/CNPJ</th>
                    <th>Email</th>
                    <th>Data Criação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentFornecedores.map((fornecedor) => (
                    <tr key={fornecedor.id}>
                      <td>{fornecedor.id}</td>
                      <td>{fornecedor.nome}</td>
                      <td>{cpfCnpjMask(fornecedor.cpfCnpj)}</td>
                      <td>{fornecedor.email}</td>
                      <td>{new Date(fornecedor.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <button
                          onClick={() => handleEditClick(fornecedor)}
                          className="edit-button"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div id="pagination-container">
              <button onClick={handlePreviousPage} disabled={currentPage === 1}>
                Anterior
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button onClick={handleNextPage} disabled={currentPage === totalPages}>
                Próxima
              </button>
            </div>

            <div id="show-more-container">
              <label htmlFor="rows-select">Mostrar</label>
              <select id="rows-select" value={rowsPerPage} onChange={handleRowsChange}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <label htmlFor="rows-select">por página</label>
            </div>
          </div>
        </>
      )}

      {toast.message && <Toast type={toast.type} message={toast.message} />}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={isEdit ? handleEditSubmit : handleAddFornecedor}
          fornecedor={selectedFornecedor}
        />
      )}
    </div>
  );
}

export default Fornecedores;
