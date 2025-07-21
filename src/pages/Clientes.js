import React, { useState, useEffect } from 'react';
import { getClientes, getClienteById } from '../services/ApiClientes/ApiClientes';
import '../styles/Clientes.css';
import ModalCliente from '../components/ModalCadastraCliente';
import { cpfCnpjMask, removeMaks } from '../components/utils';
import Toast from '../components/Toast';
import { formatarCelular } from '../utils/functions';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função
import Pagination from '../utils/Pagination';


function Clientes() {
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [executarBusca, setExecutarBusca] = useState(true);

  const [nome, setNome] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cpfCnpj, setCpf] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const { permissions } = useAuth();

  useEffect(() => {
    if (executarBusca) {
      fetchMovimentacoes();
      setExecutarBusca(false); // importante para evitar chamadas repetidas
    }
  }, [executarBusca, currentPage, rowsPerPage]);

  const fetchMovimentacoes = async () => {
    setLoading(true)
    const filtros = {
      nome: nome.trim() || undefined,
      nomeFantasia: nomeFantasia.trim() || undefined,
      cpfCnpj: removeMaks(cpfCnpj.trim()) || undefined,
      page: currentPage,
      limit: rowsPerPage
    };

    try {
      const response = await getClientes(filtros);
      setFilteredClientes(response.data.clientes || response.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setToast({ message: "Erro ao buscar clientes", type: "error" });
    }
    finally {
      setLoading(false)
    }
  };



  const handleClear = () => {
    setNome('');
    setNomeFantasia('');
    setCpf('');
    setCurrentPage(1);
    setExecutarBusca(true);
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

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const currentClientes = filteredClientes;

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
                <button onClick={() => setExecutarBusca(true)} className="button">Pesquisar</button>
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

            {currentClientes && currentClientes.length > 0 && (
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
          </div>
        </>
      )}

      {toast.message && <Toast type={toast.type} message={toast.message} />}
      {isModalOpen && (
        <ModalCliente
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setExecutarBusca(true); // isso vai disparar fetchMovimentacoes com filtros e paginação
          }}
          cliente={selectedCliente}
          edit={isEdit}
        />

      )}
    </div>
  );
}

export default Clientes;
