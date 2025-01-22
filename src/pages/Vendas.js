import React, { useState, useEffect } from 'react';
import { getVendas, cancelaVenda } from '../services/api';
import '../styles/Vendas.css';
import ModalCliente from '../components/ModalCadastraCliente';
import { cpfCnpjMask, removeMaks } from '../components/utils';
import Toast from '../components/Toast';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ModalCancelaVenda from '../components/ModalCancelaVenda';



function Vendas() {
  const [loading, setLoading] = useState(true);
  const [vendas, setVendas] = useState([]);
  const [idVenda, setIdVenda] = useState('');
  const [filteredVendas, setFilteredVendas] = useState([]);
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpf] = useState('');
  const [dataVendaInicial, setdataVendaInicial] = useState('');
  const [dataVendaFinal, setdataVendaFinal] = useState('');
  const [tipoVenda, setTipoVenda] = useState('');
  const [tiposVenda, setTiposVenda] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState({ message: '', type: '' });

  ///
  const [pagamentosDetalhados, setPagamentosDetalhados] = useState([]);
  let [filteredPagamentos, setFilteredPagamentos] = useState([]);
  const [tipoPagamento, setTipoPagamento] = useState('');
  const [tiposPagamento, setTiposPagamento] = useState([]);
  const [isModalModalCancelaVendaOpen, setIsModalCancelaVendaOpen] = useState(false);




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

  const handleSearch = () => {
    const lowerNome = nome.toLowerCase();
    const lowerCpf = removeMaks(cpfCnpj.toLowerCase());

    // Certificar que as datas estão no formato correto para comparação
    const dataInicial = dataVendaInicial ? new Date(dataVendaInicial).toISOString().split('T')[0] : null;
    const dataFinal = dataVendaFinal ? new Date(dataVendaFinal).toISOString().split('T')[0] : null;

    const results = pagamentosDetalhados.filter(venda => {
      const vendaNome = venda.cliente?.toLowerCase() || '';
      const vendaCpf = removeMaks(venda.cpfCnpj || '');

      // Garantir que a data da venda esteja no formato correto
      const vendaData = new Date(venda.dataVenda).toISOString().split('T')[0];

      return (
        (lowerNome ? vendaNome.includes(lowerNome) : true) &&
        (lowerCpf ? vendaCpf.includes(lowerCpf) : true) &&
        (dataInicial ? vendaData >= dataInicial : true) &&
        (dataFinal ? vendaData <= dataFinal : true) &&
        (tipoVenda ? venda.formaPagamento === tipoVenda : true)
      );
    });

    setFilteredPagamentos(results);
    setCurrentPage(1); // Resetar para a primeira página após a busca
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

  const totalPreco = filteredPagamentos.reduce((sum, venda) => sum + parseFloat(venda.valorPago), 0);

  const handlePrint = () => {
    const doc = new jsPDF();

    // Adiciona um título
    doc.text('Relatório de Vendas', 14, 20);

    // Configura as colunas e os dados da tabela
    const tableColumn = [
      'ID',
      'Cliente',
      'Total',
      'Forma de Movimentação',
      'Data de Criação'
    ];

    // Use filteredPagamentos diretamente para incluir todos os registros filtrados
    const tableRows = filteredPagamentos.map(venda => [
      venda.vendaId,
      venda.cliente || venda.descricao || 'Não Informado',
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valorPago),
      venda.formaPagamento,
      new Date(venda.dataVenda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    ]);

    // Adiciona uma linha de rodapé com os totais
    const totalPrecoFiltrado = filteredPagamentos.reduce(
      (sum, venda) => sum + parseFloat(venda.valorPago),
      0
    );

    tableRows.push([
      'Totais:',
      '', // Cliente (vazio)
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrecoFiltrado),
      '', // Forma de Pagamento (vazio)
      '' // Data de Criação (vazio)
    ]);

    // Adiciona a tabela ao PDF
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30, // Posição inicial da tabela
    });

    // Salva o PDF
    doc.save('relatorio_vendas.pdf');
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
    setIdVenda(venda);
    setIsModalCancelaVendaOpen(true);
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
      <h1 id="vendas-title">Vendas Realizadas</h1>
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>) : (
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
              </div>
            </div>
            <div id="button-vendas-group">
              <button onClick={handleSearch} className="button-vendas">Pesquisar</button>
              <button onClick={handleClear} className="button-vendas">Limpar</button>
              <button onClick={handlePrint} className="button-vendas">Imprimir</button>
            </div>
          </div>


          <div id="separator-bar"></div>

          <div id="results-container">
            <div id="vendas-grid-container">
              <table id="vendas-grid">
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
                      {venda.tipo === "Venda" ? (
                        <td>
                          <button className="cancela-button" onClick={() => handleOpenModalCancelaVenda(venda.vendaId)}>Cancelar</button>
                        </td>
                      ) : (
                        <td></td>
                      )}
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
          </div>
          {isModalModalCancelaVendaOpen && (
            <ModalCancelaVenda
              isOpen={isModalModalCancelaVendaOpen}
              onClose={handleCloseModalCancelaVenda}
              onSubmit={handleSubmitLancamento}
              idVenda={idVenda}
            />
          )}

        </>
      )}

      {toast.message && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
}

export default Vendas;
