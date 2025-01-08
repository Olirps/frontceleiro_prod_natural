import React, { useState, useEffect } from 'react';
import { getVendas } from '../services/api';
import '../styles/Vendas.css';
import ModalCliente from '../components/ModalCadastraCliente';
import { cpfCnpjMask, removeMaks } from '../components/utils';
import Toast from '../components/Toast';

import jsPDF from 'jspdf';
import 'jspdf-autotable';



function Vendas() {
  const [loading, setLoading] = useState(true);
  const [vendas, setVendas] = useState([]);
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




  useEffect(() => {
    const fetchVendas = async () => {
      try {
        const response = await getVendas();
        //novo
        const data = response.data;

        // Transformar vendas em uma lista detalhada de pagamentos
        const pagamentos = data.flatMap((venda) =>
          venda.formasPagamento.map((pagamento) => ({
            vendaId: venda.vendaId,
            clienteId: venda.clienteId,
            cliente: venda.cliente,
            dataVenda: venda.dataVenda,
            formaPagamento: pagamento.formaPagamento,
            valorPago: parseFloat(pagamento.vlrPago),
          }))
        );
        setPagamentosDetalhados(pagamentos);
        setFilteredPagamentos(pagamentos);

        ///novo////


        setVendas(response.data);
        setFilteredVendas(response.data);

        // Extrair tipos de venda únicos
        //const tipos = Array.from(new Set(response.data.map(venda => venda.formaPagamento)));
        ///setTiposVenda(tipos);

        const tipos = Array.from(new Set(pagamentos.map((p) => p.formaPagamento)));
        setTiposPagamento(tipos);
      } catch (err) {
        console.error('Erro ao buscar Vendas', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendas();
  }, []);

  const handleSearch = () => {
    const lowerNome = nome.toLowerCase();
    const lowerCpf = removeMaks(cpfCnpj.toLowerCase());
    const dataInicial = new Date(dataVendaInicial).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const dataFinal = new Date(dataVendaFinal).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    const results = pagamentosDetalhados.filter(venda => {
      const vendaNome = venda.cliente?.toLowerCase() || '';
      const vendaCpf = removeMaks(venda.cpfCnpj || '');

      let vendaData = new Date(venda.dataVenda).toLocaleDateString()
      vendaData = vendaData.replace(",", "");

      return (
        (lowerNome ? vendaNome.includes(lowerNome) : true) &&
        (lowerCpf ? vendaCpf.includes(lowerCpf) : true) &&
        (dataVendaInicial ? vendaData >= dataInicial : true) &&
        (dataVendaFinal ? vendaData <= dataFinal : true) &&
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


  const totalPages = Math.ceil(filteredPagamentos.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  filteredPagamentos = filteredPagamentos.slice(startIndex, startIndex + rowsPerPage);

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

    const tableRows = filteredPagamentos.map(venda => [
      venda.vendaId,
      venda.cliente || 'Não Informado',
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valorPago),
      venda.formaPagamento,
      new Date(venda.dataVenda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    ]);

    // Adiciona uma linha de rodapé com os totais
    tableRows.push([
      'Totais:',
      '', // Cliente (vazio)
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPreco),
      '', // Quantidade (vazio)
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

  return (
    <div id="vendas-container">
      <h1 id="vendas-title">Vendas Realizadas</h1>
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>) : (
        <>
          <div id="search-container">
            <div id="search-fields">
              <div>
                <label htmlFor="cliente">Cliente</label>
                <input className="input-geral"
                  type="text"
                  id="cliente"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength="150"
                />
                <label htmlFor="dataVendaInicial">Data Inicial</label>
                <input className="input-geral"
                  type="date"
                  id="dataVendaInicial"
                  value={dataVendaInicial}
                  onChange={(e) => setdataVendaInicial(e.target.value)}
                />
                <label htmlFor="dataVendaFinal">Data Final</label>
                <input className="input-geral"
                  type="date"
                  id="dataVendaFinal"
                  value={dataVendaFinal}
                  onChange={(e) => setdataVendaFinal(e.target.value)}
                />
                <label htmlFor="cpf">CPF/CNPJ</label>
                <input className="input-geral"
                  type="text"
                  id="cpf"
                  value={cpfCnpj}
                  onChange={handleCpfChange}
                />
                <label htmlFor="tipoVenda">Tipo de Venda</label>
                <select
                  className="input-geral"
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
            <div>
              <div id="button-group">
                <button onClick={handleSearch} className="button">Pesquisar</button>
                <button onClick={handleClear} className="button">Limpar</button>
                <button onClick={handlePrint} className="button">Imprimir</button>
              </div>
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
                  {filteredPagamentos.map((venda) => (
                    <tr key={venda.id}>
                      <td>{venda.vendaId}</td>
                      <td>{venda.cliente || 'Não Informado'}</td>
                      <td>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(venda.valorPago)}
                      </td>
                      <td>{venda.formaPagamento}</td>
                      <td>{new Date(venda.dataVenda).toLocaleString().replace(",", "")}</td>
                      <td>
                        <button className="edit-button">Editar</button>
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
          </div>

        </>
      )}

      {toast.message && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
}

export default Vendas;
