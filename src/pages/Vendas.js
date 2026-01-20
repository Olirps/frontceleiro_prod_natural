import React, { useState, useEffect } from 'react';
import { cancelaVenda, updateVenda, geraNF, geraNFC, getFormasPagamento, statusNfe, getDanfe, cancelaNf } from '../services/api';
import { getVendas, getVendaById } from '../services/ApiVendas/ApiVendas';
import '../styles/Vendas.css';
import ModalCadastroVenda from '../components/ModalCadastroVenda';
import ModalLancarVendas from '../components/ModalLancarVendas';
import ComunicacaoSEFAZ from '../components/ComunicacaoSEFAZ';
import EmissaoNF_NFC from '../components/EmissaoNF_NFC';
import { cpfCnpjMask } from '../components/utils';
import Toast from '../components/Toast';
import 'jspdf-autotable';
import ModalCancelaVenda from '../components/ModalCancelaVenda';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";
import { converterData, formatarMoedaBRL } from '../utils/functions'; // Certifique-se de importar corretamente a função
import vendaRealizadas from '../relatorios/vendaRealizadas'; // Importe a função de geração de PDF
import imprimeVenda from '../utils/impressaovenda';
import ConfirmDialog from '../components/ConfirmDialog'; // Componente para o modal de confirmação
import Pagination from '../utils/Pagination';



function Vendas() {
  const [loading, setLoading] = useState(true);
  const [vendas, setVendas] = useState([]);
  const [idVenda, setIdVenda] = useState('');
  const [filteredVendas, setFilteredVendas] = useState([]);
  const [selectedVenda, setSelectedVenda] = useState('');
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpf] = useState('');
  const [dataVendaInicial, setdataVendaInicial] = useState('');
  const [dataVendaFinal, setdataVendaFinal] = useState('');
  const [tipoVenda, setTipoVenda] = useState('');
  const [linhasPorPagina, setLinhasPorPagina] = useState(50);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [pagamentosDetalhados, setPagamentosDetalhados] = useState([]);
  const [pagamentosComTransacoes, setPagamentosComTransacoes] = useState([]);
  let [filteredPagamentos, setFilteredPagamentos] = useState([]);
  const [tipoPagamento, setTipoPagamento] = useState('');
  const [totalPreco, setTotalPreco] = useState('');
  const [totalDescontos, setTotalDescontos] = useState('');
  const [tiposPagamento, setTiposPagamento] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isEmissaoModalOpen, setIsEmissaoModalOpen] = useState(false);

  const [isModalModalCancelaVendaOpen, setIsModalCancelaVendaOpen] = useState(false);
  const [isComunicacaoSefazOpen, setIsComunicacaoSEFAZOpen] = useState(false);
  const [isVendaFinalizada, setIsVendaFinalizada] = useState(false);
  const [somarLancamentosManuais, setSomarLancamentosManuais] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [status, setStatus] = useState('');
  const [statusVenda, setStatusVenda] = useState('');
  const [formaPagamento, setFormaPagamento] = useState([]);
  const [executarBusca, setExecutarBusca] = useState(true);
  //Permissoes
  const { permissions } = useAuth();
  const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

  useEffect(() => {
    checkPermission("vendas", "view")
  }, [])

  useEffect(() => {
    setExecutarBusca(true);
  }, [paginaAtual, linhasPorPagina]);

  const fetchVendas = async () => {
    setLoading(true);

    try {
      const params = {
        clienteNome: nome || undefined,
        cpfCnpj: cpfCnpj || undefined,
        dataInicio: dataVendaInicial || undefined,
        dataFim: dataVendaFinal || undefined,
        tipoVenda: tipoVenda || undefined,
        page: paginaAtual,
        limit: linhasPorPagina,
      };

      const [responseVendas, responseFormas] = await Promise.all([
        getVendas(params),
        getFormasPagamento()
      ]);

      setVendas(responseVendas.data);
      setTotalPreco(responseVendas.somaTotalPrice || 0);
      setTotalDescontos(responseVendas.totalDescontos || 0);
      setPagamentosComTransacoes(responseVendas.data || []);
      setTotalPages(responseVendas.totalPages || 1);
      setTiposPagamento(responseFormas.data);

    } catch (error) {
      console.error('Erro ao buscar vendas ou formas de pagamento:', error);
    } finally {
      setLoading(false);
      setExecutarBusca(false);
    }
  };


  useEffect(() => {
    fetchVendas();
  }, [executarBusca]);

  const handleChangeRowsPerPage = (newRowsPerPage) => {
    setLinhasPorPagina(newRowsPerPage);
    setPaginaAtual(1);  // Reseta para a primeira página
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };


  const handleCadastrarModal = () => {
    checkPermission('vendas', 'insert', () => {
      setStatusVenda('');
      setIsModalOpen(true);
      setIsEdit(false);
      setSelectedVenda(null);
    })
  };


  const handleModalClose = async (vendaFinalizada) => {

    setIsModalOpen(false);
    if (vendaFinalizada) {
      console.log("Venda foi finalizada com sucesso!");
      // Aqui você pode adicionar qualquer lógica adicional pós-venda
      setIsVendaFinalizada(false); // Reseta o status para futuras aberturas
    }
  };

  const handleEditSubmit = async (e) => {

    try {
      const username = localStorage.getItem('username');
      e.login = username;
      await updateVenda(selectedVenda.id, e);
      setToast({ message: "Venda atualizada com sucesso!", type: "success" });
      setIsModalOpen(false);
      setExecutarBusca(true);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao atualizar Vendas.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  const handleClear = () => {
    setNome('');
    setdataVendaInicial('');
    setdataVendaFinal('');
    setCpf('');
    setTipoVenda('');
    setFilteredPagamentos(pagamentosDetalhados)
    setCurrentPage(1); // Resetar para a primeira página ao limpar a busca
  };

  const handleCpfChange = (e) => {
    const { value } = e.target;
    setCpf(cpfCnpjMask(value));
  };

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);


  const handlePrint = () => {
    vendaRealizadas({ data: pagamentosComTransacoes, totalPreco, totalDescontos });
  };

  // Calcula as somas de desconto e totalPrice

  const handleOpenModalCancelaVenda = async (venda) => {
    checkPermission('vendas', 'delete', async () => {
      const status = await statusNfe(venda)
      setIdVenda(venda);
      setStatus(status);
      setIsModalCancelaVendaOpen(true);
    })
  };


  const handleCloseModalCancelaVenda = () => {
    setIsModalCancelaVendaOpen(false);
  };

  const handleSubmitLancamento = async (formElements) => {
    let dataHoje = new Date().toLocaleString().replace(',', '');
    let dataAjustada = converterData(dataHoje);
    // Extrai os valores dos elementos do formulário
    const motivo_cancelamento = formElements.motivo.value;
    const venda = formElements.idVenda;
    const lancamentoData = {
      motivo_cancelamento: motivo_cancelamento,
      dataCancelamento: dataAjustada
    };
    try {
      if (status.response === 'ANDAMENTO') {
        const response = await cancelaVenda(venda, lancamentoData);
        if (response.status === 200) {
          setToast({ message: 'Registrado(s) cancelado(s) com sucesso!', type: 'success' });
        } else {
          setToast({ message: 'Erro ao cancelar venda!', type: 'error' });
        }
      } else {
        const response = await cancelaNf(venda, lancamentoData);
        if (response.status === 200) {
          setToast({ message: 'Registrado(s) cancelado(s) com sucesso!', type: 'success' });
        } else {
          setToast({ message: 'Erro ao cancelar venda!', type: 'error' });
        }
      }
    } catch (error) {
      const Message = error.response.data.erro || 'Erro ao cancelar venda!';

      setToast({ message: Message, type: 'error' });
      console.error("Erro ao registrar lançamento:", error);
    } finally {
      setIsModalCancelaVendaOpen(false);
      setCurrentPage(1); // Resetar para a primeira página após a busca
      fetchVendas();
    }
  };


  const handlePrintClick = async (venda) => {
    try {
      setLoading(true);

      const status = await statusNfe(venda.venda_id);
      if (status.response === 'AUTORIZADA') {
        await getDanfe(venda.venda_id); // Vai abrir o PDF no navegador
      } else {
        imprimeVenda(venda.venda_id)
      }

    } catch (error) {
      console.error('Erro ao imprimir DANFE NF-e:', error);
      alert('Erro ao imprimir DANFE NF-e');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = async (vendaId, status, formaPgto) => {
    try {
      const response = await getVendaById(vendaId);
      response.tipo = 'venda';
      setStatusVenda(status);
      setFormaPagamento(formaPgto);
      setSelectedVenda(response); // Certifique-se que response.data tem a estrutura correta
      setIsModalOpen(true);
      setIsEdit(true); // Você está editando, então deve setar isso como true
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      setToast({ message: "Erro ao carregar venda", type: "error" });
    }
  };

  const handleConfirmacaoEmitirNFe = (venda_id) => {
    checkPermission('emitir-nf', 'insert', () => {
      setIdVenda(venda_id);
      setIsEmissaoModalOpen(true);
    })
  }
  const handleCancel = () => {
    setIsConfirmationModalOpen(false); // Fechar o modal sem realizar nada
  };

  const handleCloseEmissaoModal = () => {
    setIsEmissaoModalOpen(false);
  };

  const handleEmitirNFe = async () => {
    setIsEmissaoModalOpen(false);
    setIsComunicacaoSEFAZOpen(true);

    try {
      const response = await geraNF(idVenda);
      // supondo que geraxml faça a requisição fetch e retorne a resposta completa
      if (response.status === 200) {
        setToast({
          message: "NF-e autorizada com sucesso!",
          type: "success",
        });
      } else if (response.status === 412) {
        const data = await response.data;
        setToast({
          message: `NF-e rejeitada: ${data.motivo || data.erro || "Motivo não informado"}`,
          type: "error",
        });
      } else {
        setToast({
          message: "Erro inesperado na emissão da NF-e.",
          type: "error",
        });
      }
    } catch (error) {
      setToast({
        message: `Erro na comunicação: ${error.message}`,
        type: "error",
      });
    } finally {
      setIsComunicacaoSEFAZOpen(false);
      fetchVendas(); // Atualiza a lista após emissão
    }
  };

  const handleEmitirNFCe = async () => {
    setIsEmissaoModalOpen(false);
    setIsComunicacaoSEFAZOpen(true);

    try {
      const response = await geraNFC(idVenda);
      if (response.status === 200) {
        setToast({
          message: "NFC-e autorizada com sucesso!",
          type: "success",
        });
      } else if (response.status === 412) {
        const data = await response.data;
        setToast({
          message: `NFC-e rejeitada: ${data.motivo || data.erro || "Motivo não informado"}`,
          type: "error",
        });
      } else {
        setToast({
          message: `Error: ${response.data.erro || "Erro inesperado na emissão da NFC-e."}  `,
          type: "error",
        });
      }
    } catch (error) {
      setToast({
        message: `Erro na comunicação: ${error.message}`,
        type: "error",
      });
    } finally {
      setIsComunicacaoSEFAZOpen(false);
      fetchVendas(); // Atualiza a lista após emissão
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">📊 Vendas Realizadas</h1>

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="cliente" className="block text-sm font-medium text-gray-700">Cliente</label>
            <input
              type="text"
              id="cliente"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength="150"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF/CNPJ</label>
            <input
              type="text"
              id="cpf"
              value={cpfCnpj}
              onChange={handleCpfChange}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="tipoVenda" className="block text-sm font-medium text-gray-700">Tipo de Venda</label>
            <select
              id="tipoVenda"
              value={tipoVenda}
              onChange={(e) => setTipoVenda(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {tiposPagamento.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dataVendaInicial" className="block text-sm font-medium text-gray-700">Data Inicial</label>
            <input
              type="date"
              id="dataVendaInicial"
              value={dataVendaInicial}
              onChange={(e) => setdataVendaInicial(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="dataVendaFinal" className="block text-sm font-medium text-gray-700">Data Final</label>
            <input
              type="date"
              id="dataVendaFinal"
              value={dataVendaFinal}
              onChange={(e) => setdataVendaFinal(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => setExecutarBusca(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Pesquisar</button>
          <button onClick={handleClear} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Limpar</button>
          <button onClick={handlePrint} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Imprimir</button>
          <button onClick={handleCadastrarModal} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ Lançar Venda</button>
        </div>
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* --- DESKTOP TABLE --- */}
          <div className="hidden sm:block">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Cliente</th>
                  <th className="px-4 py-2">Valor Venda</th>
                  <th className="px-4 py-2">Desconto</th>
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((venda, index) => (
                  <tr key={`${venda.id}-${index}`} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{venda.venda_id}</td>
                    <td className="px-4 py-2">{venda.cliente || 'Não informado'}</td>
                    <td className="px-4 py-2">
                      {venda.totalPrice === null
                        ? 'R$ 0,00'
                        : formatarMoedaBRL(venda.totalPrice)}
                    </td>
                    <td className="px-4 py-2">
                      {venda.desconto === 0 || venda.desconto === null
                        ? 'R$ 0,00'
                        : formatarMoedaBRL(venda.desconto)}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(venda.dataVenda).toLocaleString().replace(',', '')}
                    </td>
                    <td className="px-4 py-2 flex gap-3 justify-center text-lg">
                      <button
                        onClick={() => handleOpenModalCancelaVenda(venda.venda_id)}
                        className="text-red-600 hover:text-red-800"
                        title="Cancelar venda"
                      >
                        🚫
                      </button>
                      <button
                        onClick={() =>
                          handleSearchClick(venda.venda_id, venda.status_id, venda.pagamentos)
                        }
                        className="text-blue-600 hover:text-blue-800"
                        title="Visualizar detalhes"
                      >
                        🔍
                      </button>
                      <button
                        onClick={() => handlePrintClick(venda)}
                        className="text-gray-700 hover:text-black"
                        title="Imprimir"
                      >
                        🖨️
                      </button>
                      <button
                        onClick={() => handleConfirmacaoEmitirNFe(venda.venda_id)}
                        className="text-green-600 hover:text-green-800"
                        title="Emitir NF-e"
                      >
                        📤
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {currentPage === totalPages && (
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan="2" className="px-4 py-2">
                      Total
                    </td>
                    <td className="px-4 py-2">{formatarMoedaBRL(totalPreco)}</td>
                    <td className="px-4 py-2">{formatarMoedaBRL(totalDescontos)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* --- MOBILE CARD VIEW --- */}
          <div className="sm:hidden">
            {vendas.map((venda, index) => (
              <div
                key={`${venda.id}-${index}`}
                className="border-b border-gray-200 p-4 flex flex-col gap-2"
              >
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 font-medium">
                    ID: {venda.venda_id}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(venda.dataVenda).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-gray-800 font-semibold">{venda.cliente}</div>

                <div className="flex justify-between text-sm text-gray-700">
                  <span>Venda: {formatarMoedaBRL(venda.totalPrice || 0)}</span>
                  <span>Desc: {formatarMoedaBRL(venda.desconto || 0)}</span>
                </div>

                {/* Ações visíveis no mobile */}
                <div className="flex justify-between mt-3 text-lg">
                  <button
                    onClick={() => handleOpenModalCancelaVenda(venda.venda_id)}
                    className="text-red-600 hover:text-red-800"
                    title="Cancelar venda"
                  >
                    🚫
                  </button>
                  <button
                    onClick={() =>
                      handleSearchClick(venda.venda_id, venda.status_id, venda.pagamentos)
                    }
                    className="text-blue-600 hover:text-blue-800"
                    title="Visualizar"
                  >
                    🔍
                  </button>
                  <button
                    onClick={() => handlePrintClick(venda)}
                    className="text-gray-700 hover:text-black"
                    title="Imprimir"
                  >
                    🖨️
                  </button>
                  <button
                    onClick={() => handleConfirmacaoEmitirNFe(venda.venda_id)}
                    className="text-green-600 hover:text-green-800"
                    title="Emitir NF-e"
                  >
                    📤
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Paginação */}
      {vendas && vendas.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={paginaAtual}
            totalPages={totalPages}
            onPageChange={setPaginaAtual}
            onRowsChange={handleChangeRowsPerPage}
            rowsPerPage={linhasPorPagina}
            rowsPerPageOptions={[50, 100, 150]}
          />
        </div>
      )}

      {/* Modais */}
      {isModalOpen && (
        isEdit ? (
          <ModalCadastroVenda
            isOpen={isModalOpen}
            open={true}
            onSubmit={handleEditSubmit}
            os={selectedVenda}
            onClose={() => {
              handleModalClose();
              setExecutarBusca(true);
            }}
            edit={isEdit}
            statusVenda={statusVenda}
            formaPagamento={formaPagamento}
            tipo="venda"
          />
        ) : (
          <ModalLancarVendas
            isOpen={isModalOpen}
            open={true}
            onSubmit={() => setToast({ message: 'Submit Executado', type: 'info' })}
            os={selectedVenda}
            onClose={() => {
              handleModalClose();
              setExecutarBusca(true);
            }}
            edit={isEdit}
            statusVenda={statusVenda}
            formaPagamento={formaPagamento}
            tipo="venda"
          />
        )
      )}
      {isModalModalCancelaVendaOpen && (
        <ModalCancelaVenda
          isOpen={isModalModalCancelaVendaOpen}
          onClose={handleCloseModalCancelaVenda}
          onSubmit={handleSubmitLancamento}
          idVenda={idVenda}
          status={status}
        />
      )}
      <EmissaoNF_NFC
        isOpen={isEmissaoModalOpen}
        onClose={handleCloseEmissaoModal}
        onEmitirNFe={handleEmitirNFe}
        onEmitirNFCe={handleEmitirNFCe}
      />

      <ComunicacaoSEFAZ isOpen={isComunicacaoSefazOpen} onClose={handleCloseModal} />

      <ConfirmDialog
        isOpen={isConfirmationModalOpen}
        onClose={handleCancel}
        onConfirm={() => handleEmitirNFe()}
        onCancel={() => setIsConfirmationModalOpen(false)}
        message="Você tem certeza que deseja Emitir a NFe desta venda?"
      />

      {toast.message && <Toast type={toast.type} message={toast.message} />}
      {/* Renderização do modal de autorização */}
      <PermissionModalUI />
    </div>

  );
}

export default Vendas;