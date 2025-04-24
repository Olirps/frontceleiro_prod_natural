import React, { useState, useEffect } from 'react';
import { getClientes, addCliente, updateCliente, getClienteById } from '../services/api';
import '../styles/Clientes.css';
import ModalCliente from '../components/ModalCadastraCliente';
import { cpfCnpjMask, removeMaks } from '../components/utils';
import Toast from '../components/Toast';
import { formatarCelular } from '../utils/functions';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função


function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [nome, setNome] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cpfCnpj, setCpf] = useState('');
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const { permissions } = useAuth();


  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await getClientes();
        setClientes(response.data);
        setFilteredClientes(response.data);
      } catch (err) {
        console.error('Erro ao buscar clientes', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  const handleSearch = () => {
    const lowerNome = nome.toLowerCase();
    const lowerNomeFantasia = nomeFantasia.toLowerCase();
    let lowerCpf = cpfCnpj.toLowerCase();
    lowerCpf = removeMaks(lowerCpf);
    const results = clientes.filter(cliente =>
      (lowerNome ? cliente.nome.toLowerCase().includes(lowerNome) : true) &&
      (lowerNomeFantasia ? cliente.nomeFantasia?.toLowerCase().includes(lowerNomeFantasia) : true) &&
      (lowerCpf ? cliente.cpfCnpj.toLowerCase().includes(lowerCpf) : true)
    );

    setFilteredClientes(results);
    setCurrentPage(1); // Resetar para a primeira página após a busca
  };

  const handleClear = () => {
    setNome('');
    setNomeFantasia('');
    setCpf('');
    setFilteredClientes(clientes);
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

  const handleCadastrarModal = () => {
    if (!hasPermission(permissions, 'clientes', 'insert')) {
      setToast({ message: "Você não tem permissão para cadastrar clientes.", type: "error" });
      return; // Impede a abertura do modal
    }
    setIsModalOpen(true);
    setIsEdit(false);
    setSelectedCliente(null);
  };


  const handleAddCliente = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newCliente = {
      nome: formData.get('nome'),
      nomeFantasia: formData.get('nomeFantasia'),
      cpfCnpj: formData.get('cpfCnpj'),
      email: formData.get('email'),
      celular: formData.get('celular').replace(/\D/g, ''),
      logradouro: formData.get('logradouro'),
      numero: formData.get('numero'),
      bairro: formData.get('bairro'),
      municipio_id: formData.get('municipio'),
      uf_id: formData.get('uf'),
      cep: formData.get('cep').replace(/\D/g, ''),
    };

    try {
      await addCliente(newCliente);
      setToast({ message: "Cliente cadastrado com sucesso!", type: "success" });
      setIsModalOpen(false);
      const response = await getClientes();
      setClientes(response.data);
      setFilteredClientes(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao cadastrar cliente.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  const handleEditClick = async (cliente) => {
    try {
      if (!hasPermission(permissions, 'clientes', 'viewcadastro')) {
        setToast({ message: "Você não tem permissão para visualizar o cadastro de clientes.", type: "error" });
        return; // Impede a abertura do modal
      }
      const response = await getClienteById(cliente.id);
      setSelectedCliente(response.data);
      setIsEdit(true);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Erro ao buscar detalhes do cliente', err);
      setToast({ message: "Erro ao buscar detalhes do cliente.", type: "error" });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedCliente = {
      nome: formData.get('nome'),
      nomeFantasia: formData.get('nomeFantasia'),
      cpfCnpj: formData.get('cpfCnpj'),
      email: formData.get('email'),
      celular: formData.get('celular').replace(/\D/g, ''),
      logradouro: formData.get('logradouro'),
      numero: formData.get('numero'),
      bairro: formData.get('bairro'),
      municipio_id: formData.get('municipio'),
      uf_id: formData.get('uf'),
      cep: formData.get('cep').replace(/\D/g, '')
    };

    try {
      await updateCliente(selectedCliente.id, updatedCliente);
      setToast({ message: "Cliente atualizado com sucesso!", type: "success" });
      setIsModalOpen(false);
      setSelectedCliente(null);
      setIsEdit(false);
      const response = await getClientes();
      setClientes(response.data);
      setFilteredClientes(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao atualizar cliente.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const totalPages = Math.ceil(filteredClientes.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentClientes = filteredClientes.slice(startIndex, startIndex + rowsPerPage);

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
    <div id="clientes-container">
      <h1 className="title-page">Consulta de Clientes</h1>
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
                <label htmlFor="nomeFantasia">Nome Fantasia</label>
                <input className="input-geral"
                  type="text"
                  id="nomeFantasia"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
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
                  handleCadastrarModal();
                }} className="button">Cadastrar</button>
              </div>
            </div>
          </div>

          <div id="separator-bar"></div>

          <div id="results-container">
            <div id="grid-padrao-container">
              <table id="grid-padrao">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>CPF/CNPJ</th>
                    <th>Email</th>
                    <th>Celular</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentClientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>{cliente.id}</td>
                      <td>{cliente.nome}</td>
                      <td>{cpfCnpjMask(cliente.cpfCnpj)}</td>
                      <td>{cliente.email}</td>
                      <td>{formatarCelular(cliente.celular)}</td>
                      <td>
                        <button
                          onClick={() => handleEditClick(cliente)}
                          className="edit-button"
                        >
                          Visualizar
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
        <ModalCliente
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={isEdit ? handleEditSubmit : handleAddCliente}
          cliente={selectedCliente}
          edit={isEdit}
        />
      )}
    </div>
  );
}

export default Clientes;
