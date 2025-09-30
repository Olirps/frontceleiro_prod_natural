import React, { useState, useEffect } from 'react';
import { getFornecedores } from '../services/ApiFornecedores/ApiFornecedores';
import '../styles/ModalPesquisaFornecedor.css'; // Certifique-se de criar este CSS também
import Toast from '../components/Toast';



const ModalPesquisaFornecedor = ({ isOpen, onClose, onSelectFornecedor }) => {
  const [fornecedores, setFornecedores] = useState([]);
  const [cpfCnpj, setCpfCnpj] = useState(''); // Estado para filtro por CPF/CNPJ
  const [nome, setNome] = useState(''); // Estado para filtro por nome
  const [toast, setToast] = useState({ message: '', type: '' });


  useEffect(() => {
    handleClear()
  }, [isOpen]);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchFornecedores = async () => {
    try {
      const response = await getFornecedores({ cpfCnpj, nome }); // Passa os filtros na requisição
      if (response.data.length === 0) {
        setToast({ message: `Fornecedor ${nome} não localizado`, type: 'error' });
      }
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 relative">
        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-lg font-bold"
        >
          ×
        </button>

        {/* Título */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Pesquisar Fornecedor
        </h2>

        {/* Campos de Pesquisa */}
        <div className="space-y-4">
          <div className="flex flex-col">
            <label htmlFor="cpfCnpj" className="text-sm font-medium text-gray-700">
              CPF/CNPJ:
            </label>
            <input
              type="text"
              id="cpfCnpj"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              placeholder="Digite o CPF ou CNPJ"
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="nome" className="text-sm font-medium text-gray-700">
              Nome:
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome do fornecedor"
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Lista de Resultados */}
        <ul className="mt-6 max-h-60 overflow-y-auto divide-y divide-gray-200 border rounded-lg">
          {fornecedores.map((fornecedor) => (
            <li
              key={fornecedor.id}
              onClick={() => handleSelectFornecedor(fornecedor)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
            >
              {fornecedor.id} - {fornecedor.nome} - {fornecedor.cpfCnpj}
            </li>
          ))}
        </ul>
      </div>

      {/* Toast */}
      {toast.message && <Toast type={toast.type} message={toast.message} />}
    </div>

  );
};

export default ModalPesquisaFornecedor;
