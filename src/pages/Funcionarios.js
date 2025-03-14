import React, { useState, useEffect } from 'react';
import { getFuncionarios, addFuncionario, updateFuncionario, getFuncionarioById } from '../services/api';
import '../styles/Funcionarios.css';
import ModalFuncionario from '../components/ModalCadastraFuncionario';
import { cpfCnpjMask, removeMaks } from '../components/utils';
import { formatarCelular,formatarMoedaBRL,converterMoedaParaNumero } from '../utils/functions';
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
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const { permissions } = useAuth();


  useEffect(() => {
    const fetchFuncionarios = async () => {
      try {
        const response = await getFuncionarios();
        setFuncionarios(response.data);
        setFilteredFuncionarios(response.data);
      } catch (err) {
        console.error('Erro ao buscar funcionários', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFuncionarios();
  }, []);

  const handleSearch = () => {
    const lowerNome = nome.toLowerCase();
    let lowerCpf = cpf.toLowerCase();
    lowerCpf = removeMaks(lowerCpf);
    const results = funcionarios.filter(funcionario =>
      (lowerNome ? funcionario.cliente.nome.toLowerCase().includes(lowerNome) : true) &&
      (lowerCpf ? removeMaks(funcionario.cliente.cpfCnpj).includes(lowerCpf) : true)
    );

    setFilteredFuncionarios(results);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setNome('');
    setCpf('');
    setFilteredFuncionarios(funcionarios);
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
    setIsModalOpen(true);
    setIsEdit(false);
  };


  const handleAddFuncionario = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const cpfCnpj = formData.get('cpf')
    const newFuncionario = {
      nome: formData.get('nome'),
      cpfCnpj: removeMaks(cpfCnpj),
      email: formData.get('email'),
      celular: formData.get('celular').replace(/\D/g, ''),
      tipoFuncionario: formData.get('tipoFuncionario'),
      dataContratacao: formData.get('dataContratacao'),
      cargo: formData.get('cargo'),
      numero: formData.get('numero'),
      bairro: formData.get('bairro'),
      uf_id: formData.get('uf'),
      municipio_id: formData.get('municipio'),
      cep: formData.get('cep'),
      salario: converterMoedaParaNumero(formData.get('salario')),
      logradouro: formData.get('logradouro')
    };

    try {
      await addFuncionario(newFuncionario);
      setToast({ message: "Funcionário cadastrado com sucesso!", type: "success" });
      setIsModalOpen(false);
      const response = await getFuncionarios();
      setFuncionarios(response.data);
      setFilteredFuncionarios(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao cadastrar funcionário.";
      setToast({ message: errorMessage, type: "error" });
    }
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedFuncionario = {
      nome: formData.get('nome'),
      cpfCnpj: formData.get('cpf'),
      email: formData.get('email'),
      celular: formData.get('celular').replace(/\D/g, ''),
      tipoFuncionario: formData.get('tipoFuncionario'),
      dataContratacao: formData.get('dataContratacao'),
      cargo: formData.get('cargo'),
      numero: formData.get('numero'),
      bairro: formData.get('bairro'),
      uf_id: formData.get('uf'),
      municipio_id: formData.get('municipio'),
      cep: formData.get('cep'),
      salario: converterMoedaParaNumero(formData.get('salario')),
      logradouro: formData.get('logradouro')
    };

    try {
      await updateFuncionario(selectedFuncionario.id, updatedFuncionario);
      setToast({ message: "Funcionario atualizado com sucesso!", type: "success" });
      setIsModalOpen(false);
      setSelectedFuncionario(null);
      setIsEdit(false);
      const response = await getFuncionarios();
      setFuncionarios(response.data);
      setFilteredFuncionarios(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao atualizar funcionario.";
      setToast({ message: errorMessage, type: "error" });
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
          onClose={() => setIsModalOpen(false)}
          onSubmit={isEdit ? handleEditSubmit : handleAddFuncionario}
          funcionario={selectedFuncionario}
          edit={isEdit}
        />
      )}
    </div>
  );
}

export default Funcionarios;