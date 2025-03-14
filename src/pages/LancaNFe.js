import React, { useState, useEffect } from 'react';
import { getNotafiscal, getNFeById, importNotafiscal, addNotafiscal, getMunicipiosIBGE, getUFIBGE, updateNFe } from '../services/api';
import '../styles/LancaNFe.css';
import '../App.css';
import Toast from '../components/Toast';
import ModalImportacaoXML from '../components/ModalImportacaoXML'; // Ajuste o caminho conforme necessário
import ModalProdutosNF from '../components/ModalProdutosNF'; // Ajuste o caminho conforme necessário
import ModalCadastroNFe from '../components/ModalCadastroNFe'; // Ajuste o caminho conforme necessário
import { cpfCnpjMask } from '../components/utils';
import { converterMoedaParaNumero,formatarNumero } from '../utils/functions';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função




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
  const { permissions } = useAuth();


  useEffect(() => {

    fetchNotasFiscais();
  }, [importSuccess]);

  const openImportModal = () => {
    if (!hasPermission(permissions, 'notafiscal', 'insert')) {
      setToast({ message: "Você não tem permissão para cadastrar nota fiscal.", type: "error" });
      return; // Impede a abertura do modal
    }
    setIsImportModalOpen(true);
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
    if (!hasPermission(permissions, 'notafiscal', 'insert')) {
      setToast({ message: "Você não tem permissão para cadastrar nota fiscal.", type: "error" });
      return; // Impede a abertura do modal
    }
    setSelectedNFe(null)
    setIsReadOnly(false)
    setIsEdit(false)
    setIsNotaFicalModalOpen(true);
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
    const vlrNf = converterMoedaParaNumero(e.vNF);

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
    <div id="notas-fiscais-container">
      <h1 className='title-page'>Consulta de Notas Fiscais</h1>
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Conteúdo da página quando o carregamento estiver completo */}
          <div id="search-container">
            <div id="search-fields">
              <div>
                <label htmlFor="nNF">Nota Fiscal</label>
                <input
                  className="input-geral"
                  type="text"
                  id="nNF"
                  value={nNF}
                  onChange={(e) => setNNF(e.target.value)}
                  maxLength="10"
                />
              </div>
              <div>
                <label htmlFor="codFornecedor">Código do Fornecedor</label>
                <input
                  className="input-geral"
                  type="text"
                  id="codFornecedor"
                  value={codFornecedor}
                  onChange={(e) => setCodFornecedor(e.target.value)}
                  maxLength="10"
                />
              </div>
              <div>
                <label htmlFor="cnpjFornecedor">CNPJ do Fornecedor</label>
                <input
                  className="input-geral"
                  type="text"
                  id="cnpjFornecedor"
                  value={cpfCnpjMask(cnpjFornecedor)}
                  onChange={(e) => setCnpjFornecedor(e.target.value)}
                  maxLength="18" // CNPJ geralmente tem 14 dígitos
                />
              </div>
              <div>
                <label htmlFor="nomeFornecedor">Nome do Fornecedor</label>
                <input
                  className="input-geral"
                  type="text"
                  id="nomeFornecedor"
                  value={nomeFornecedor}
                  onChange={(e) => setNomeFornecedor(e.target.value)}
                />
              </div>
            </div>
            <div>
              <div id="button-group">
                <button onClick={handleSearch} className="button">Pesquisar</button>
                <button onClick={handleClear} className="button">Limpar</button>
                <button onClick={openNotaFiscalModal} className="button">Cadastrar</button>
                <button onClick={openImportModal} className="button">Importar XML</button>
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
                    <th>Nota Fiscal</th>
                    <th>Fornecedor</th>
                    <th>CNPJ</th>
                    <th>Emissão</th>
                    <th>Valor NF</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentNotasFiscais.map((notaFiscal) => {
                    const tipoLancto = notaFiscal.lancto;
                    const status = notaFiscal.status;

                    return (
                      <tr key={notaFiscal.id}>
                        <td>{notaFiscal.id}</td>
                        <td>{notaFiscal.nNF}</td>
                        <td>{notaFiscal.nomeFornecedor || 'Nome do Fornecedor não disponível'}</td>
                        <td>{cpfCnpjMask(notaFiscal.cpfCnpj || 'CNPJ não disponível')}</td>
                        <td>{new Date(notaFiscal.dhEmi).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                        <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(notaFiscal.vNF)}</td>
                        <td id="button-action">
                          {status === 'fechada' && (
                            <button className="detalhes-button"
                              onClick={() => handleDetalhes(notaFiscal)}
                            >Detalhes</button>
                          )}
                          {status !== 'fechada' && status === 'andamento' && (
                            <button className="detalhes-button"
                              onClick={() => handleEditar(notaFiscal)}
                            >Editar</button>
                          )}
                          {tipoLancto === 'manual' && (status === 'aberta' || status === 'andamento') && (
                            <button onClick={() => handleProductClick(notaFiscal)} className="lancto-prod-button">Lancto Prod</button>
                          )}
                          {status === 'fechada' && (
                            <button onClick={() => handleProductClick(notaFiscal)} className="edit-button">Produtos</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

      {isImportModalOpen && (
        <ModalImportacaoXML
          isOpen={isImportModalOpen}
          onClose={closeImportModal}
          onSubmit={handleImportSubmit}
        />
      )}
      {isProductModalOpen && (
        <ModalProdutosNF
          isOpen={isProductModalOpen}
          onClose={closeProductModal}
          onNFOpen={false}
          prod={selectedNFe} // Certifique-se de passar o dado correto
        />
      )}
      {isNotaFicalModalOpen && (
        <ModalCadastroNFe
          isOpen={isNotaFicalModalOpen}
          onClose={() => setIsNotaFicalModalOpen(false)}
          onSubmit={isEdit ? handleEditSubmit : handleNotaFiscalClick}
          onUfChange={handleUfChange} // Adicione a função para atualizar a UF
          notaFiscal={selectedNFe}
          isReadOnly={isReadOnly}  // Passa o estado isReadOnly para o modal
          isEdit={isEdit}  // Passa o estado isReadOnly para o modal
        />
      )}
    </div>
  );
}

export default LancaNFe;