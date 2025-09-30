import React, { useState, useEffect } from 'react';
import { getNotafiscal, getNFeById, importNotafiscal, addNotafiscal, getMunicipiosIBGE, getUFIBGE, updateNFe } from '../services/api';
import '../styles/LancaNFe.css';
import '../App.css';
import Toast from '../components/Toast';
import ModalImportacaoXML from '../components/ModalImportacaoXML'; // Ajuste o caminho conforme necessário
import ModalProdutosNF from '../components/ModalProdutosNF'; // Ajuste o caminho conforme necessário
import ModalCadastroNFe from '../components/ModalCadastroNFe'; // Ajuste o caminho conforme necessário
import { cpfCnpjMask } from '../components/utils';
import { converterMoedaParaNumero, formatarNumero } from '../utils/functions';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";




function LancaNFe() {
  const [notasFiscais, setNotasFiscais] = useState([]);
  const [filteredNotasFiscais, setFilteredNotasFiscais] = useState([]);
  const [nNF, setNNF] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [codFornecedor, setCodFornecedor] = useState('');
  const [cnpjFornecedor, setCnpjFornecedor] = useState('');
  const [nomeFornecedor, setNomeFornecedor] = useState('');
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedNFe, setSelectedNFe] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fornecedores, setFornecedores] = useState({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isNotaFicalModalOpen, setIsNotaFicalModalOpen] = useState(false);
  const [cpfCnpj, setcpfCnpj] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [onNFOpen, setOnNFOpen] = useState(false);
  const [ufId, setUfId] = useState('');
  //Permissoes
  const { permissions } = useAuth();
  const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

  useEffect(() => {
    checkPermission("notafiscal", "view")
  }, [])

  useEffect(() => {

    fetchNotasFiscais();
  }, [importSuccess]);

  const openImportModal = () => {
    checkPermission('notafiscal', 'insert', () => {
      setIsImportModalOpen(true);
    })
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
  };

  const closeProductModal = () => {
    if (onNFOpen) {
      fetchNotasFiscais()
    }
    setIsProductModalOpen(false);
  };

  const openNotaFiscalModal = () => {
    checkPermission('notafiscal', 'insert', () => {
      setSelectedNFe(null)
      setIsReadOnly(false)
      setIsEdit(false)
      setIsNotaFicalModalOpen(true);
    })

  };

  const closeNotaFiscalModal = () => {
    setIsNotaFicalModalOpen(false);
  };

  const fetchNotasFiscais = async () => {
    try {
      const response = await getNotafiscal();
      setNotasFiscais(response.data);
      setFilteredNotasFiscais(response.data);
    } catch (err) {
      console.error('Erro ao buscar notas fiscais', err);
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = () => {
    const lowerNNF = nNF.toLowerCase();
    const lowerCodFornecedor = codFornecedor.toLowerCase();
    const lowerCnpjFornecedor = cnpjFornecedor.toLowerCase();
    const lowerNomeFornecedor = nomeFornecedor.toLowerCase();

    const results = notasFiscais.filter(notaFiscal => {
      // Acessa diretamente os dados do fornecedor dentro de notaFiscal
      const fornecedorNome = notaFiscal.nomeFornecedor ? notaFiscal.nomeFornecedor.toLowerCase() : '';
      const fornecedorCnpj = notaFiscal.cnpjFornecedor ? notaFiscal.cnpjFornecedor.toLowerCase() : '';
      const codFornecedorNota = notaFiscal.codFornecedor ? notaFiscal.codFornecedor.toString() : '';

      // Remove a máscara do CNPJ do fornecedor e da busca
      const cleanCnpjFornecedor = cpfCnpjMask(fornecedorCnpj);
      const cleanCnpjSearch = cpfCnpjMask(lowerCnpjFornecedor);

      return (
        (lowerNNF ? notaFiscal.nNF.toLowerCase().includes(lowerNNF) : true) &&
        (lowerCodFornecedor ? codFornecedorNota.includes(lowerCodFornecedor) : true) &&
        (lowerCnpjFornecedor ? cleanCnpjFornecedor.includes(cleanCnpjSearch) : true) &&
        (lowerNomeFornecedor ? fornecedorNome.trim().includes(lowerNomeFornecedor) : true)
      );
    });

    setFilteredNotasFiscais(results);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setNNF('');
    setCodFornecedor('');
    setCnpjFornecedor(''); // Adicione isso
    setNomeFornecedor(''); // Adicione isso
    setFilteredNotasFiscais(notasFiscais);
    setCurrentPage(1);

  };

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleProductClick = async (nfe) => {
    try {
      setSelectedNFe(nfe);
      setIsProductModalOpen(true);
    } catch (err) {
      console.error('Erro ao buscar detalhes da NFe', err);
      setToast({ message: "Erro ao buscar detalhes da NFe.", type: "error" });
    }
  };

  const handleNotaFiscalClick = async (e) => {
    /*e.preventDefault();
    const formData = new FormData(e.target);
    formData.forEach((value, key) => {
    });*/
    const vlrNf = (e.vNF);

    const newNf = {
      codFornecedor: e.fornecedorId,
      nNF: e.nNF,
      serie: e.serie,
      cUF: e.selectedUfCodIBGE, // Use o estado da UF
      cMunFG: e.selectedMunicipioCodIBGE,
      municipio: e.municipio,
      dataEmissao: e.dataEmissao,
      dataSaida: e.dataSaida,
      cNF: e.cNF,
      tpNF: e.tpNF,
      vNF: vlrNf
    };

    try {
      await addNotafiscal(newNf);
      const response = await getNotafiscal();
      setSelectedNFe(response.data);
      setToast({ message: "Nota fiscal salva com sucesso!", type: "success" });
      closeNotaFiscalModal();  // Fecha o modal após salvar
      setImportSuccess(prev => !prev); // Atualiza o estado para acionar re-renderização
    } catch (err) {

      console.error('Erro ao buscar detalhes da NFe', err);
      setToast({ message: err.response?.data?.error, type: "error" });
      //setToast({ message: "Erro ao buscar detalhes da NFe.", type: "error" });
    }
  };
  const handleImportSubmit = async (files) => {
    if (!files || files.length === 0) {
      setError('Nenhum arquivo selecionado.');
      return;
    }

    const formData = new FormData();

    files.forEach((f) => {
      formData.append('xml', f); // Use 'files' como chave
    });

    try {
      const response = await importNotafiscal(formData); // Chama a função que faz o upload

      response.data.resultados.forEach((resultado) => {
        if (resultado.status === 'sucesso') {
          setToast({ message: `Arquivo: ${resultado.arquivo} - ${resultado.mensagem}`, type: "success" });
        } else if (resultado.status === 'erro') {
          setToast({ message: `Arquivo: ${resultado.arquivo} - ${resultado.mensagem}`, type: "error" });
        }
      });

      setIsImportModalOpen(false);
      setImportSuccess(prev => !prev); // Atualiza o estado para acionar re-renderização

    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao importar arquivos XML.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleEditar = async (nfe) => {
    try {
      let response = await getNFeById(nfe.id);
      response.data.fornecedor = nfe.nome
      response.data.codFornecedor = nfe.codFornecedor

      setSelectedNFe(response.data);
      setIsEdit(true);
      setIsNotaFicalModalOpen(true);
      setIsReadOnly(false);  // Modal em modo de visualização
    } catch (err) {
      console.error('Erro ao buscar detalhes da NFe', err);
      setToast({ message: "Erro ao buscar detalhes da NFe.", type: "error" });
    }
  };

  const handleEditSubmit = async (e) => {

    const vlrNf = converterMoedaParaNumero(e.vNF);
    const updatedNotaFiscal = {
      codFornecedor: e.fornecedorId,
      nNF: e.nNF,
      serie: e.serie,
      cUF: e.selectedUfCodIBGE,
      municipio: e.selectedMunicipioCodIBGE,
      municipio: e.municipio,
      dataEmissao: e.dataEmissao,
      dataSaida: e.dataSaida,
      cNF: e.cNF,
      tpNF: e.tpNF,
      vNF: vlrNf
    };

    try {
      const notaEditada = await updateNFe(selectedNFe.id, updatedNotaFiscal);
      setToast({ message: "Nota Fiscal atualizada com sucesso!", type: "success" });
      setIsModalOpen(false);
      setSelectedNFe(null);
      setIsEdit(false);
      setIsNotaFicalModalOpen(false);
      const response = await getNotafiscal();
      setNotasFiscais(response.data);
      setFilteredNotasFiscais(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao atualizar nota fiscal.";
      setToast({ message: errorMessage, type: "error" });
    }
  }

  const handleDetalhes = async (nfe) => {
    try {
      let response = await getNFeById(nfe.id);
      //const fornecedor = fornecedores[nfe.codFornecedor];
      response.data.fornecedor = nfe.nomeFornecedor
      response.data.codFornecedor = nfe.codFornecedor
      const uf = await getUFIBGE(nfe.cUF);
      const mun = await getMunicipiosIBGE(nfe.cMunFG);
      response.data.sigla = uf.data.nome;
      response.data.ufId = uf.data.id;
      response.data.municipio = mun.data.nome;
      setSelectedNFe(response.data);
      setIsEdit(false);
      setIsNotaFicalModalOpen(true);
      setIsReadOnly(true);  // Modal em modo de visualização

    } catch (err) {
      console.error('Erro ao buscar detalhes da NFe', err);
      setToast({ message: "Erro ao buscar detalhes da NFe.", type: "error" });
    }
  };

  const totalPages = Math.ceil(filteredNotasFiscais.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentNotasFiscais = filteredNotasFiscais.slice(startIndex, startIndex + rowsPerPage);

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

  const handleUfChange = (newUfId) => {
    setUfId(newUfId);
  };

  return (
    <div className="p-6">
      {/* Título da página */}
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Consulta de Notas Fiscais</h1>

      {/* Spinner */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Área de filtros */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="nNF">Nota Fiscal</label>
                <input
                  type="text"
                  id="nNF"
                  value={nNF}
                  onChange={(e) => setNNF(e.target.value)}
                  maxLength={10}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="codFornecedor">Código do Fornecedor</label>
                <input
                  type="text"
                  id="codFornecedor"
                  value={codFornecedor}
                  onChange={(e) => setCodFornecedor(e.target.value)}
                  maxLength={10}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="cnpjFornecedor">CNPJ do Fornecedor</label>
                <input
                  type="text"
                  id="cnpjFornecedor"
                  value={cpfCnpjMask(cnpjFornecedor)}
                  onChange={(e) => setCnpjFornecedor(e.target.value)}
                  maxLength={18}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="nomeFornecedor">Nome do Fornecedor</label>
                <input
                  type="text"
                  id="nomeFornecedor"
                  value={nomeFornecedor}
                  onChange={(e) => setNomeFornecedor(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Pesquisar</button>
              <button onClick={handleClear} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Limpar</button>
              <button onClick={openNotaFiscalModal} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Cadastrar</button>
              <button onClick={openImportModal} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Importar XML</button>
            </div>
          </div>

          {/* Tabela de resultados */}
          <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Nota Fiscal</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Fornecedor</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">CNPJ</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Emissão</th>
                  <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">Valor NF</th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentNotasFiscais.map(nota => (
                  <tr key={nota.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">{nota.id}</td>
                    <td className="px-3 py-2 text-sm">{nota.nNF}</td>
                    <td className="px-3 py-2 text-sm">{nota.nomeFornecedor || 'Não disponível'}</td>
                    <td className="px-3 py-2 text-sm">{cpfCnpjMask(nota.cpfCnpj || '')}</td>
                    <td className="px-3 py-2 text-sm">{new Date(nota.dhEmi).toLocaleDateString('pt-BR')}</td>
                    <td className="px-3 py-2 text-sm text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nota.vNF)}</td>
                    <td className="px-3 py-2 text-center flex justify-center gap-2 flex-wrap">
                      {nota.status === 'fechada' && <button onClick={() => handleDetalhes(nota)} className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs">Detalhes</button>}
                      {nota.status === 'andamento' && <button onClick={() => handleEditar(nota)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs">Editar</button>}
                      {nota.lancto === 'manual' && (nota.status === 'aberta' || nota.status === 'andamento') && (
                        <button onClick={() => handleProductClick(nota)} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs">Lancto Prod</button>
                      )}
                      {nota.status === 'fechada' && (
                        <button onClick={() => handleProductClick(nota)} className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs">Produtos</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginação */}
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-3">
              <div className="flex gap-2">
                <button onClick={handlePreviousPage} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">Anterior</button>
                <span className="text-sm">Página {currentPage} de {totalPages}</span>
                <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">Próxima</button>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="rows-select" className="text-sm">Mostrar</label>
                <select id="rows-select" value={rowsPerPage} onChange={handleRowsChange} className="border rounded px-2 py-1 text-sm">
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm">por página</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toasts e modais */}
      {toast.message && <Toast type={toast.type} message={toast.message} />}
      {isImportModalOpen && <ModalImportacaoXML isOpen={isImportModalOpen} onClose={closeImportModal} onSubmit={handleImportSubmit} />}
      {isProductModalOpen && <ModalProdutosNF isOpen={isProductModalOpen} onClose={closeProductModal} onNFOpen={false} prod={selectedNFe} />}
      {isNotaFicalModalOpen && (
        <ModalCadastroNFe
          isOpen={isNotaFicalModalOpen}
          onClose={() => setIsNotaFicalModalOpen(false)}
          onSubmit={isEdit ? handleEditSubmit : handleNotaFiscalClick}
          onUfChange={handleUfChange}
          notaFiscal={selectedNFe}
          isReadOnly={isReadOnly}
          isEdit={isEdit}
        />
      )}
      <PermissionModalUI />
    </div>

  );
}

export default LancaNFe;