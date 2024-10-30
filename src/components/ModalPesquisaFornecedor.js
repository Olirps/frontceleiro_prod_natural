import React, { useState, useEffect } from 'react';
import { getFornecedores } from '../services/api'; // Importa a função que busca fornecedores
import '../styles/ModalPesquisaFornecedor.css'; // Certifique-se de criar este CSS também


const ModalPesquisaFornecedor = ({ isOpen, onClose, onSelectFornecedor }) => {
  const [fornecedores, setFornecedores] = useState([]);
  const [cpfCnpj, setCpfCnpj] = useState(''); // Estado para filtro por CPF/CNPJ
  const [nome, setNome] = useState(''); // Estado para filtro por nome

  useEffect(() => {
    handleClear()
  }, [isOpen]);

  const fetchFornecedores = async () => {
    try {
      const response = await getFornecedores({ cpfCnpj, nome }); // Passa os filtros na requisição
      setFornecedores(response.data); // Atualiza os fornecedores
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
    }
  };

  const handleSelectFornecedor = (fornecedor) => {
    onSelectFornecedor(fornecedor); // Envia o fornecedor selecionado para o modal principal
    onClose(); // Fecha o modal de pesquisa
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFornecedores(); // Recarrega a lista de fornecedores com os filtros aplicados
  };

  const handleClear = () => {
    setFornecedores([]);
    setCpfCnpj('');
    setNome('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>X</button>
        <h2>Pesquisar Fornecedor</h2>
        <div id='pesquisa-fornecedor'>
          <div>
            <label htmlFor="cpfCnpj">CPF/CNPJ:</label>
            <input
              className='input-pesquisa-fornecedor'
              type="text"
              id="cpfCnpj"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)} // Atualiza o estado de CPF/CNPJ
              placeholder="Digite o CPF ou CNPJ"
            />
          </div>
          <div>
            <label htmlFor="nome">Nome:</label>
            <input
              className='input-pesquisa-fornecedor'
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)} // Atualiza o estado de nome
              placeholder="Digite o nome do fornecedor"
            />
          </div>
          <button className="button" onClick={handleSearch}>Buscar</button> {/* Botão para acionar a busca */}
        </div>
        <ul className="fornecedores-list">
          {fornecedores.map((fornecedor) => (
            <li
              key={fornecedor.id}
              className="fornecedor-item"
              onClick={() => handleSelectFornecedor(fornecedor)}
            >
              {fornecedor.id} - {fornecedor.nome} - {fornecedor.cpfCnpj}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ModalPesquisaFornecedor;
