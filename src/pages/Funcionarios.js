import React, { useState, useEffect } from 'react';
import { getFuncionarios, addFuncionario, updateFuncionario, getFuncionarioById } from '../services/api';
import '../styles/Funcionarios.css';
import ModalFuncionario from '../components/ModalCadastraFuncionario';
import { cpfCnpjMask, removeMaks } from '../components/utils';
import { formatarCelular, formatarMoedaBRL, converterMoedaParaNumero } from '../utils/functions';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função


function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [filteredFuncionarios, setFilteredFuncionarios] = useState([]);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [executarBusca, setExecutarBusca] = useState(true);
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const { permissions } = useAuth();


  useEffect(() => {
    const fetchFuncionarios = async () => {
      try {
        const filtros = {
          nome: nome.trim() || undefined,
          cpfCnpj: cpf || undefined,
          page: currentPage,
          limit: rowsPerPage
        };
        const response = await getFuncionarios(filtros);
        setFuncionarios(response.data);
        setFilteredFuncionarios(response.data);
      } catch (err) {
        console.error('Erro ao buscar funcionários', err);
      } finally {
        setLoading(false);
        setExecutarBusca(false); // Reseta a flag após a busca inicial
      }
    };

    fetchFuncionarios();
  }, [executarBusca]);

  const handleSearch = () => {
    setLoading(true);
    setExecutarBusca(true);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setNome('');
    setCpf('');
    setFilteredFuncionarios([]);
    setExecutarBusca(true);
    setCurrentPage(1);
  };

  const handleCpfChange = (e) => {
    setCpf(cpfCnpjMask(e.target.value));
  };

  const handleOpenModal = () => {
    if (!hasPermission(permissions, 'funcionarios', 'insert')) {
      setToast({ message: "Você não tem permissão para cadastrar funcionarios.", type: "error" });
      return; // Impede a abertura do modal
    }
    setIsNew(true);
    setIsModalOpen(true);
    setIsEdit(false);
  };

  const handleEditClick = async (funcionario) => {
    try {
      if (!hasPermission(permissions, 'funcionarios', 'viewcadastro')) {
        setToast({ message: "Você não tem permissão para visualizar o cadastro de funcionarios.", type: "error" });
        return; // Impede a abertura do modal
      }
      const response = await getFuncionarioById(funcionario.id);
      setSelectedFuncionario(response.data);
      setIsEdit(true);
      setIsModalOpen(true);
    } catch (err) {
      setToast({ message: "Erro ao buscar detalhes do funcionário.", type: "error" });
    }
  };

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div id="funcionarios-container">
      <h1 className="title-page">Consulta de Funcionários</h1>
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div id="search-container">
            <label>Nome</label>
            <input type="text" value={nome} className="input-geral" onChange={(e) => setNome(e.target.value)} />
            <label>CPF</label>
            <input type="text" value={cpf} className="input-geral" onChange={handleCpfChange} />
            <div id="button-group">

              <button onClick={handleSearch} className="button">Pesquisar</button>
              <button onClick={handleClear} className="button">Limpar</button>
              <button className="button" onClick={handleOpenModal}>Cadastrar</button>
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
                    <th>Email</th>
                    <th>Celular</th>
                    <th>Cargo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFuncionarios.map((funcionario) => (
                    <tr key={funcionario.id}>
                      <td>{funcionario.id}</td>
                      <td>{funcionario.cliente.nome}</td>
                      <td>{funcionario.cliente.email}</td>
                      <td>{formatarCelular(funcionario.cliente.celular)}</td>
                      <td>{funcionario.cargo}</td>
                      <td>
                        <button className="edit-button" onClick={() => handleEditClick(funcionario)}>Visualizar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {toast.message && <Toast type={toast.type} message={toast.message} />}
      {isModalOpen && (
        <ModalFuncionario
          isOpen={isModalOpen}
          isNew={isNew}
          onClose={() => {
            setIsModalOpen(false);
            setExecutarBusca(true); // isso vai disparar fetchMovimentacoes com filtros e paginação
          }}
          funcionario={selectedFuncionario}
          edit={isEdit}
          onSuccess={() => {
            setExecutarBusca(true); // se aplicável
          }
          }
        />
      )}
    </div>
  );
}

export default Funcionarios;