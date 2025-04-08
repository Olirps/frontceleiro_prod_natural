import React, { useState, useEffect } from 'react';
import { getVendas, cancelaVenda, getVendaById, updateVenda, addOS, registravenda } from '../services/api';
import '../styles/Vendas.css';
import ModalCliente from '../components/ModalCadastraCliente';
import { cpfCnpjMask, removeMaks } from '../components/utils';
import Toast from '../components/Toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ModalCancelaVenda from '../components/ModalCancelaVenda';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função
import ModalCadastroOS from '../components/ModalCadastroOS'; // Componente para o modal de cadastro
import vendaRealizadas from '../relatorios/vendaRealizadas'; // Importe a função de geração de PDF
import imprimeVenda from '../utils/impressaovenda';




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
  const [tiposVenda, setTiposVenda] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [pagamentosDetalhados, setPagamentosDetalhados] = useState([]);
  let [filteredPagamentos, setFilteredPagamentos] = useState([]);
  const [tipoPagamento, setTipoPagamento] = useState('');
  const [tiposPagamento, setTiposPagamento] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalModalCancelaVendaOpen, setIsModalCancelaVendaOpen] = useState(false);
  const [isVendaFinalizada, setIsVendaFinalizada] = useState(false);
  const [somarLancamentosManuais, setSomarLancamentosManuais] = useState(false);
  const { permissions } = useAuth();
  const [isEdit, setIsEdit] = useState(false);


  const fetchVendas = async () => {
    try {
      const response = await getVendas();
      const data = response.data.transacoes;

      if (!data || !Array.isArray(data)) {
        throw new Error('A estrutura de dados das transações está incorreta');
      }

      // Processar todas as transações
      const pagamentos = data.flatMap((venda) => {
        // Caso tenha formasPagamento, processa normalmente
        if (venda.formasPagamento) {
          return venda.formasPagamento.map((pagamento) => ({
            vendaId: venda.id,
            clienteId: venda.cliente,
            cliente: venda.cliente || 'Não Informado',
            tipo: venda.tipo,
            dataVenda: venda.data,
            formaPagamento: pagamento.formaPagamento,
            valorPago: parseFloat(pagamento.vlrPago),
          }));
        }

        // Caso seja débito ou crédito, processa separadamente
        return {
          vendaId: venda.id,
          clienteId: venda.cliente || null,
          cliente: venda.cliente || venda.descricao || 'Não Informado',
          dataVenda: venda.data,
          formaPagamento: venda.tipo, // Aqui o tipo será "débito" ou "crédito"
          valorPago: parseFloat(venda.valor || 0), // Usa o valor diretamente
        };
      });

      setPagamentosDetalhados(pagamentos);
      setFilteredPagamentos(pagamentos);
      setVendas(response.data);
      setFilteredVendas(response.data);

      // Extrair tipos únicos, incluindo "débito" e "crédito"
      const tipos = Array.from(new Set(pagamentos.map((p) => p.formaPagamento)));
      setTiposPagamento(tipos);
    } catch (err) {
      console.error('Erro ao buscar Vendas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendas();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true); // Ativa o estado de carregamento
      // Preparar os parâmetros de busca
      const params = {
        clienteNome: nome || undefined,
        cpfCnpj: cpfCnpj || undefined,
        dataInicio: dataVendaInicial || undefined,
        dataFim: dataVendaFinal || undefined,
        tipoVenda: tipoVenda || undefined
      };

      // Limpar parâmetros vazios
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });

      // Converter datas para o formato YYYY-MM-DD se existirem
      if (params.dataInicio) {
        params.dataInicio = new Date(params.dataInicio).toISOString().split('T')[0] + ' 00:00:00';
      }
      if (params.dataFim) {
        params.dataFim = new Date(params.dataFim).toISOString().split('T')[0] + ' 23:59:59';
      }

      // Enviar requisição para o backend
      const response = await getVendas(params);

      // Processar todas as transações
      const pagamentos = response.data.transacoes.flatMap((venda) => {
        // Caso tenha formasPagamento, processa normalmente
        if (venda.formasPagamento) {
          return venda.formasPagamento.map((pagamento) => ({
            vendaId: venda.id,
            clienteId: venda.cliente,
            cliente: venda.cliente || 'Não Informado',
            tipo: venda.tipo,
            dataVenda: venda.data,
            formaPagamento: pagamento.formaPagamento,
            valorPago: parseFloat(pagamento.vlrPago),
          }));
        }

        // Caso seja débito ou crédito, processa separadamente
        return {
          vendaId: venda.id,
          clienteId: venda.cliente || null,
          cliente: venda.cliente || venda.descricao || 'Não Informado',
          dataVenda: venda.data,
          formaPagamento: venda.tipo, // Aqui o tipo será "débito" ou "crédito"
          valorPago: parseFloat(venda.valor || 0), // Usa o valor diretamente
        };
      });

      // Atualizar estado com os resultados
      setFilteredPagamentos(pagamentos);
      setCurrentPage(1); // Resetar para a primeira página após a busca
      setLoading(false); // Desativa o estado de carregamento 
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      // Tratar erro conforme necessário
      setToast({ message: 'Erro ao buscar vendas', type: 'error' });
    } finally {
      setLoading(false); // Desativa o estado de carregamento
    }
  };

  const handleCadastrarModal = () => {
    if (!hasPermission(permissions, 'vendas', 'insert')) {
      setToast({ message: "Você não tem permissão para lançar Vendas.", type: "error" });
      return;
    }
    setIsModalOpen(true);
    setIsEdit(false);
    setSelectedVenda(null);
  };

  const handleAddVenda = async (e) => {
    try {
      const username = localStorage.getItem('username');
      e.login = username;
      await registravenda(e);
      setToast({ message: "Venda cadastrada com sucesso!", type: "success" });
      const response = await getVendas();
      setVendas(response.data);
      setFilteredVendas(response.data);
      setIsModalOpen(false);
      window.location.reload();

    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao cadastrar Venda.";
      setToast({ message: errorMessage, type: "error" });
    }
  };
  const handleModalClose = async (vendaFinalizada) => {

    setIsModalOpen(false);
    if (vendaFinalizada) {
      console.log("Venda foi finalizada com sucesso!");
      // Aqui você pode adicionar qualquer lógica adicional pós-venda
      setIsVendaFinalizada(false); // Reseta o status para futuras aberturas
      const response = await getVendas();
      setVendas(response.data);
      setFilteredVendas(response.data);
    }
  };

  const handleEditClick = async (os) => {
    const vendaSelecionada = await getVendaById(os.id)
    setSelectedVenda(vendaSelecionada);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleEditSubmit = async (e) => {

    try {
      const username = localStorage.getItem('username');
      e.login = username;
      await updateVenda(selectedVenda.id, e);
      setToast({ message: "Venda atualizada com sucesso!", type: "success" });
      setIsModalOpen(false);
      const response = await getVendas();
      setVendas(response.data);
      setFilteredVendas(response.data);
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

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Resetar para a primeira página ao alterar o número de linhas
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

  //const totalPreco = filteredPagamentos.reduce((sum, venda) => sum + parseFloat(venda.valorPago), 0);

  const totalPreco = filteredPagamentos
    .filter(venda => venda.tipo === "Venda" || (somarLancamentosManuais && venda.tipo !== "Venda")) // Filtra conforme a condição de somarLancamentosManuais
    .reduce((sum, venda) => sum + parseFloat(venda.valorPago), 0);

  const handlePrint = () => {
    vendaRealizadas(filteredPagamentos, totalPreco, somarLancamentosManuais);
  };

  const totalPages = Math.ceil(filteredPagamentos.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const pagamentosPaginaAtual = filteredPagamentos.slice(startIndex, startIndex + rowsPerPage);

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
  // Calcula as somas de desconto e totalPrice

  const handleOpenModalCancelaVenda = (venda) => {
    if (!hasPermission(permissions, 'vendas', 'delete')) {
      setToast({ message: "Você não tem permissão para cancelar vendas.", type: "error" });
      return; // Impede a abertura do modal
    } else {
      setIdVenda(venda);
      setIsModalCancelaVendaOpen(true);
    }
  };


  const handleCloseModalCancelaVenda = () => {
    setIsModalCancelaVendaOpen(false);
  };

  const handleSubmitLancamento = async (formElements) => {
    let dataHoje = new Date().toLocaleString().replace(',', '');
    let dataAjustada = converterData(dataHoje)
    // Extrai os valores dos elementos do formulário
    const motivo_cancelamento = formElements.motivo.value;
    const vendaId = formElements.idVenda;
    const lancamentoData = {
      motivo_cancelamento: motivo_cancelamento,
      dataCancelamento: dataAjustada
    };

    try {
      const response = await cancelaVenda(vendaId, lancamentoData);
      if (response.status === 200) {
        setToast({ message: 'Registrado(s) cancelado(s) com sucesso!', type: 'success' });
        setIsModalCancelaVendaOpen(false);
        fetchVendas();
        console.log("Lançamento registrado com sucesso:", lancamentoData);
      }
    } catch (error) {
      setToast({ message: 'Erro ao cancelar venda!', type: 'error' });
      console.error("Erro ao registrar lançamento:", error);
    }
  };


  const handleImprimeVenda = async (venda) => {
    setLoading(true); // Ativa o estado de carregamento
    imprimeVenda(venda.id)
    if (imprimeVenda) {
      setLoading(false)
    }
  };


  const handlePrintClick = async (venda) => {
    try {
      imprimeVenda(venda.vendaId)

    } catch (error) {
      console.error("Erro ao gerar OS:", error);
    }
  };

  const handleSearchClick = async (vendaId) => {
    try {
      const response = await getVendaById(vendaId);
      response.tipo = 'venda';
      setSelectedVenda(response); // Certifique-se que response.data tem a estrutura correta
      setIsModalOpen(true);
      setIsEdit(true); // Você está editando, então deve setar isso como true
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      setToast({ message: "Erro ao carregar venda", type: "error" });
    }
  };


  function converterData(dataString) {
    const partes = dataString.split(/[\/ :]/); // Divide a string em dia, mês, ano, hora, minuto e segundo
    const dia = partes[0];
    const mes = partes[1];
    const ano = partes[2];
    const hora = partes[3];
    const minuto = partes[4];
    const segundo = partes[5];

    return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`; // Usa template literals para formatar
  }


  return (
    <div id="vendas-container">
      <h1 className="title-page">Vendas Realizadas</h1>
      <>
        <div id="search-vendas">
          <div id="search-fields-vendas">
            <div className="field-group">
              <div className="field-line">
                <label htmlFor="cliente">Cliente</label>
                <input
                  className="input-consulta-vendas"
                  type="text"
                  id="cliente"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength="150"
                />
                <label htmlFor="cpf">CPF/CNPJ</label>
                <input
                  className="input-consulta-vendas"
                  type="text"
                  id="cpf"
                  value={cpfCnpj}
                  onChange={handleCpfChange}
                />
              </div>
              <div className="field-line">
                <label htmlFor="dataVendaInicial">Data Inicial</label>
                <input
                  className="input-consulta-vendas"
                  type="date"
                  id="dataVendaInicial"
                  value={dataVendaInicial}
                  onChange={(e) => setdataVendaInicial(e.target.value)}
                />
                <label htmlFor="dataVendaFinal">Data Final</label>
                <input
                  className="input-consulta-vendas"
                  type="date"
                  id="dataVendaFinal"
                  value={dataVendaFinal}
                  onChange={(e) => setdataVendaFinal(e.target.value)}
                />
              </div>
              <div className="field-line">
                <label htmlFor="tipoVenda">Tipo de Venda</label>
                <select
                  className="input-consulta-vendas"
                  id="tipoVenda"
                  value={tipoVenda}
                  onChange={(e) => setTipoVenda(e.target.value)}
                >
                  <option value="">Todos</option>
                  {tiposPagamento.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>
                  <input
                    className="input-consulta-vendas"
                    type="checkbox"
                    checked={somarLancamentosManuais}
                    onChange={() => setSomarLancamentosManuais(!somarLancamentosManuais)}
                  />
                  Deseja Somar os Lançamentos Manuais?
                </label>
              </div>
            </div>
          </div>
          <div id="button-vendas-group">
            <button onClick={handleSearch} className="button-vendas">Pesquisar</button>
            <button onClick={handleClear} className="button-vendas">Limpar</button>
            <button onClick={handlePrint} className="button-vendas">Imprimir</button>
            <button onClick={handleCadastrarModal} className="button-vendas">Lançar Venda</button>

          </div>
        </div>
        <div id="separator-bar"></div>
        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>) :
          (<div id="results-container">
            <div id="grid-padrao-container">
              <table id="grid-padrao">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Forma de Movimentação</th>
                    <th>Data do Lançamento</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentosPaginaAtual.map((venda) => (
                    <tr key={venda.id}>
                      <td>{venda.vendaId}</td>
                      <td>{venda.cliente || venda.descricao || 'Não Informado'}</td>
                      <td>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(venda.valorPago)}
                      </td>
                      <td>
                        {venda.formaPagamento} {/* Aqui pode ser exibido o tipo de pagamento */}
                      </td>
                      <td>{new Date(venda.dataVenda).toLocaleString().replace(",", "")}</td>
                      <td>
                        <div id="button-group">
                          {venda.tipo === "Venda" ? (
                            <>
                              <button className="button" onClick={() => handleOpenModalCancelaVenda(venda.vendaId)}>🚫</button>
                              <button
                                onClick={() => handleSearchClick(venda.vendaId)} // Implemente este handler
                                className="button"
                                title="Pesquisar"
                              >
                                🔍
                              </button>
                            </>
                          ) : (
                            ''
                          )}
                          <div>
                            <button
                              onClick={() => handlePrintClick(venda)} // You'll need to implement this handler
                              className="button"
                              title="Impressão"
                            >
                              🖨️
                            </button>
                          </div>

                        </div>
                      </td>

                    </tr>
                  ))}

                </tbody>
                {currentPage === totalPages && (
                  <tfoot>
                    <tr>
                      <td colSpan="2"><strong>Total</strong></td>

                      <td><strong>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(totalPreco)}</strong>
                      </td>
                      <td colSpan="3"></td>
                    </tr>
                  </tfoot>
                )}
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
          </div>)}
        {isModalOpen && (
          <ModalCadastroOS
            isOpen={isModalOpen}
            onSubmit={isEdit ? handleEditSubmit : handleAddVenda}
            os={selectedVenda}  // Mudei de 'os' para 'venda' - confira qual o nome correto
            onClose={handleModalClose}
            edit={isEdit}
            tipo={'venda'}
          />
        )}
        {isModalModalCancelaVendaOpen && (
          <ModalCancelaVenda
            isOpen={isModalModalCancelaVendaOpen}
            onClose={handleCloseModalCancelaVenda}
            onSubmit={handleSubmitLancamento}
            idVenda={idVenda}
          />
        )}
      </>

      {toast.message && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
}

export default Vendas;
