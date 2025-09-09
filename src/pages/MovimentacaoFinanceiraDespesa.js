import React, { useState, useEffect } from 'react';
import { getAllMovimentacaofinanceiraDespesa, addMovimentacaofinanceiraDespesa, getLancamentoCompletoById, updateLancamentoDespesa, getLancamentoDespesaById, getParcelaByID, pagamentoParcela, updateMovimentacaofinanceiraDespesa, addParcelasDespesa, getParcelasDespesa } from '../services/api';
import '../styles/MovimentacaoFinanceiraDespesa.css';
import ModalMovimentacaoFinanceiraDespesa from '../components/ModalMovimentacaoFinanceiraDespesa';
import { converterMoedaParaNumero, dataAtual, formatarDataNew } from '../utils/functions';
import ModalLancamentoCompleto from '../components/ModalLancamentoCompleto';
import ModalUnificaLancamentos from '../components/ModalUnificaLancamentos';
import ModalLancamentoParcelas from '../components/ModalLancamentoParcelas'; // Importe o novo modal
import ModalPagarLancamentos from '../components/ModalPagarLancamentos'; // Importe o novo modal
import Toast from '../components/Toast';
import Pagination from '../utils/Pagination';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";


function MovimentacaoFinanceiraDespesa() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [filteredMovimentacoes, setFilteredMovimentacoes] = useState([]);
  const [valor, setValor] = useState('');
  const [boleto, setBoleto] = useState('');
  const [loading, setLoading] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [linhasPorPagina, setLinhasPorPagina] = useState(50);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLancaParcelasOpen, setIsModalLancaParcelasOpen] = useState(false);
  const [isModalUnificaLancamentosOpen, setIsModalUnificaLancamentosOpen] = useState(false);
  const [isModalPagarLancamentosOpen, setIsModalPagarLancamentosOpen] = useState(false);
  const [isModalLancamentoCompletoOpen, setIsModalLancamentoCompletoOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedMovimentacao, setSelectedMovimentacao] = useState(null);
  const [selectedLancamentoCompleto, setSelectedLancamentoCompleto] = useState(null);
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [executarBusca, setExecutarBusca] = useState(false);
  //Permissoes
  const { permissions } = useAuth();
  const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

  ////handleSearch
  const [descricao, setDescricao] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [funcionario, setFuncionario] = useState('');
  const [cliente, setCliente] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pagamento, setPagamento] = useState('');
  ////handleSearch - Final




  // responsavel por expandir
  const [expandedRows, setExpandedRows] = useState({});

  const [parcelas, setParcelas] = useState({});
  const handleChangeRowsPerPage = (newRowsPerPage) => {
    setLinhasPorPagina(newRowsPerPage);
    setPaginaAtual(1);  // Reseta para a primeira página
  };

  //
  useEffect(() => {
    const fetchMovimentacao = async (
      page = currentPage,
      limit = rowsPerPage
    ) => {
      try {
        setLoading(true);

        // monta os filtros dinamicamente
        const filtros = { tipo: "debito" };
        if (descricao) filtros.descricao = descricao.trim();
        if (fornecedor) filtros.fornecedor = fornecedor;
        if (funcionario) filtros.funcionario = funcionario;
        if (cliente) filtros.cliente = cliente;
        if (dataInicio) filtros.dataInicio = dataInicio;
        if (dataFim) filtros.dataFim = dataFim;
        if (boleto) filtros.boleto = boleto;
        if (pagamento) filtros.pagamento = pagamento;

        // adiciona paginação
        filtros.page = page;
        filtros.limit = limit;

        // chamada API
        const response = await getAllMovimentacaofinanceiraDespesa(filtros);

        // supondo que o backend retorna { data, total, totalPages }
        setMovimentacoes(response.data);
        setFilteredMovimentacoes(response.data);
        setTotalPages(
          response.totalPages || Math.ceil((response.total || 0) / limit)
        );
      } catch (err) {
        console.error("Erro ao buscar movimentações financeiras", err);
      } finally {
        setLoading(false);
        setExecutarBusca(false); // Reseta o estado após a busca
      }
    };


    fetchMovimentacao();
  }, [paginaAtual, linhasPorPagina, executarBusca]);



  const handleSearch = async () => {
    // Cria um objeto para armazenar os filtros apenas se estiverem preenchidos
    const filtros = {};
    filtros.tipo = 'debito';

    if (descricao) filtros.descricao = descricao.trim();
    if (fornecedor) filtros.fornecedor = fornecedor;
    if (funcionario) filtros.funcionario = funcionario;
    if (cliente) filtros.cliente = cliente;
    if (dataInicio) filtros.dataInicio = dataInicio;
    if (dataFim) filtros.dataFim = dataFim;
    if (boleto) filtros.boleto = boleto;
    if (pagamento) filtros.pagamento = pagamento;

    try {
      // Chama a função para buscar as movimentações com os filtros aplicados
      const results = await getAllMovimentacaofinanceiraDespesa(filtros);

      // Atualiza o estado com os resultados filtrados
      setFilteredMovimentacoes(results.data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      // Trate o erro conforme necessário (ex: exibir uma mensagem para o usuário)
    }
  };


  const handleClear = () => {
    setDescricao('');
    setFornecedor('');
    setFuncionario('');
    setFilteredMovimentacoes(movimentacoes);
    setCurrentPage(1);
    setDataInicio('');
    setDataFim('');
    setExpandedRows({});
    setParcelas({});
    setPagamento('');
    setBoleto('');
  };

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleCadastrarModal = () => {
    checkPermission('movimentacaofinanceiradespesas', 'insert', () => {
      setIsModalOpen(true);
      setIsEdit(false);
      setSelectedMovimentacao(null);
    });
  };

  const handleUnificarModal = () => {
    checkPermission('unificar-lancamentos', 'insert', () => {
      setIsModalUnificaLancamentosOpen(true);
    });
  };

  const handleAddMovimentacao = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const credor = formData.get('credorSelecionado');
    let credorNom = '';

    if (isNaN(credor)) {
      credorNom = credor
    }

    const tipoCredor = formData.get('tipoCredor');
    const credorId = formData.get('credorSelecionado'); // Supondo que o campo 'credor' contenha o ID
    const despesaRecorrenteInput = e.target.elements.despesaRecorrente;
    const pagamento = despesaRecorrenteInput ? despesaRecorrenteInput.value : null;
    const valorLancamento = formData.get('valor');
    const valorEntrada = formData.get('valorEntradaDespesa');
    const data_lancamento = new Date().toISOString().split('T')[0]; // Define a data atual

    // Converte para um objeto
    const dados = Object.fromEntries(formData.entries());

    // A FormData agora vai gerar um objeto com as parcelas separadas
    // Vamos fazer o parse adequado
    const parcelas = [];
    Object.keys(dados).forEach(key => {
      if (key.startsWith('parcelas')) {
        const [_, index, field] = key.match(/^parcelas\[(\d+)\]\.(\w+)$/) || [];
        if (index && field) {
          if (!parcelas[index]) parcelas[index] = {}; // Cria o objeto para a parcela, se não existir
          parcelas[index][field] = dados[key];
        }
      }
    });

    const lanctoSelecionados = formData.get('selectedLancamentos') // "67,69"
      ?.split(',') // Divide a string em um array ["67", "69"]
      .map(Number) // Converte para números [67, 69]
      .filter(num => !isNaN(num));


    const newMovimentacao = {
      descricao: formData.get('descricao'),
      valor: converterMoedaParaNumero(valorLancamento),
      credor_nome: credorNom,
      fornecedor_id: tipoCredor === 'fornecedor' ? credorId : null,
      funcionario_id: tipoCredor === 'funcionario' ? credorId : null,
      cliente_id: tipoCredor === 'cliente' ? credorId : null,
      nota_id: formData.get('notaId'),
      data_lancamento,
      data_vencimento: formData.get('dataVencimento'),
      boleto: formData.get('boleto'),
      pagamento,
      lancarParcelas: parcelas,
      valorEntradaDespesa: converterMoedaParaNumero(valorEntrada),
      tipo_parcelamento: formData.get('tipoParcelamento'),
      tipo: formData.get('tipo'),
      lanctoSelecionados
    };

    try {
      await addMovimentacaofinanceiraDespesa(newMovimentacao);
      setToast({ message: "Movimentação financeira cadastrada com sucesso!", type: "success" });
      setIsModalOpen(false);
      setIsModalUnificaLancamentosOpen(false);
      const response = await getAllMovimentacaofinanceiraDespesa({ tipo: 'debito' });
      setMovimentacoes(response.data);
      setFilteredMovimentacoes(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao cadastrar movimentação financeira.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  const handleEditClick = async (movimentacao) => {
    const response = await getLancamentoDespesaById(movimentacao.id);
    setSelectedMovimentacao(response.data);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleLancaParcelas = async (movimentacao) => {
    checkPermission('lancarparcelas', 'insert', async () => {
      const response = await getLancamentoDespesaById(movimentacao.id);
      setSelectedMovimentacao(response);
      setValor(response.valor);
      setIsModalLancaParcelasOpen(true);
    });
  };

  const handleSaveParcelas = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);


    // Converte para um objeto
    const dados = Object.fromEntries(formData.entries());

    // A FormData agora vai gerar um objeto com as parcelas separadas
    // Vamos fazer o parse adequado
    const parcelas = [];
    Object.keys(dados).forEach(key => {
      if (key.startsWith('parcelas')) {
        const [_, index, field] = key.match(/^parcelas\[(\d+)\]\.(\w+)$/) || [];
        if (index && field) {
          if (!parcelas[index]) parcelas[index] = {}; // Cria o objeto para a parcela, se não existir
          parcelas[index][field] = dados[key];
        }
      }
    });

    const valorEntrada = formData.get('valorEntrada');

    const lancaParcelas = {
      descricao: selectedMovimentacao.descricao,
      financeiro_id: selectedMovimentacao.id,
      quantidadeParcelas: formData.get('quantidadeParcelas'),
      valor: selectedMovimentacao.valor,
      boleto: formData.get('boleto'),
      vencimento: formData.get('vencimento'),
      valorEntrada: converterMoedaParaNumero(valorEntrada),
      tipo_parcelamento: formData.get('tipoParcelamento'),
      parcelas: parcelas
    };

    try {
      const lancaparcelas = await addParcelasDespesa(lancaParcelas);
      // Aqui você pode enviar as parcelas para o backend ou processá-las conforme necessário
      setToast({ message: "Parcelas salvas com sucesso!", type: "success" });
      setIsModalLancaParcelasOpen(false);
      const response = await getAllMovimentacaofinanceiraDespesa({ tipo: 'debito' });
      setMovimentacoes(response.data);
      setFilteredMovimentacoes(response.data);


    } catch (error) {
      const errorMessage = error.response?.data?.error || "Erro ao cadastrar movimentação financeira.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  const handleSavePagamento = async (e) => {
    e.preventDefault();
    const dataEfetivaPgto = dataAtual();
    const formData = new FormData(e.target);
    const valorPago = formData.get('valorPago');
    const pagamento = {
      data_pagamento: formData.get('datapagamento'),
      valor_pago: converterMoedaParaNumero(valorPago),
      conta_id: formData.get('contabancaria'),
      metodo_pagamento: formData.get('formaPagamento'),
      data_efetiva_pg: dataEfetivaPgto,
      status: 'liquidado'
    };

    try {
      const parcelaPaga = await pagamentoParcela(selectedParcela.id, pagamento);
      // Aqui você pode enviar as parcelas para o backend ou processá-las conforme necessário
      setToast({ message: "Parcelas Liquidada com sucesso!", type: "success" });
      setIsModalPagarLancamentosOpen(false);
      const response = await getAllMovimentacaofinanceiraDespesa({ tipo: 'debito' });
      setMovimentacoes(response.data);
      setFilteredMovimentacoes(response.data);
      toggleExpand(selectedParcela.financeiro_id)

    } catch (error) {

    }
  };
  const handlePagarParcelas = async (parcela) => {
    checkPermission('pagamentosparcelas', 'insert', async () => {
      const response = await getParcelaByID(parcela.id);
      setSelectedParcela(response.data);
      setIsModalPagarLancamentosOpen(true);
    })
  };


  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const valor = converterMoedaParaNumero(formData.get('valor'));
    const updatedMovimentacao = {
      descricao: formData.get('descricao'),
      valor: valor,
      fornecedor_id: formData.get('fornecedor'),
      funcionario_id: formData.get('funcionario'),
      nota_id: formData.get('notaId'),
      data_lancamento: formData.get('dataLancamento'),
      tipo: formData.get('tipo')
    };

    try {
      await updateMovimentacaofinanceiraDespesa(selectedMovimentacao.id, updatedMovimentacao);
      setToast({ message: "Movimentação financeira atualizada com sucesso!", type: "success" });
      setIsModalOpen(false);
      setSelectedMovimentacao(null);
      setIsEdit(false);
      const response = await getAllMovimentacaofinanceiraDespesa({ tipo: 'debito' });
      setMovimentacoes(response.data);
      setFilteredMovimentacoes(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao atualizar movimentação financeira.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  const handleGetDespesaCompleta = async (lancto) => {
    checkPermission('lancamento-completo', 'view', async () => {
      const lancamentoCompleto = await getLancamentoCompletoById(lancto.id);
      setSelectedLancamentoCompleto(lancamentoCompleto)
      setIsModalLancamentoCompletoOpen(true)
    });
  };
  const handleConfirmacaoParcelas = async (dadosRecebidos) => {

    try {
      await updateLancamentoDespesa(dadosRecebidos.id, { status: 'cancelada' });
      setToast({ message: "Movimentação financeira atualizada com sucesso!", type: "success" });
      setIsModalLancamentoCompletoOpen(false);
      setIsEdit(false);
      const response = await getAllMovimentacaofinanceiraDespesa({ tipo: 'debito' });
      setMovimentacoes(response.data);
      setFilteredMovimentacoes(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao atualizar movimentação financeira.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentMovimentacoes = filteredMovimentacoes.slice(startIndex, startIndex + rowsPerPage);

  //responsavel por expandir a linha
  const toggleExpand = async (movimentacaoId) => {
    setExpandedRows((prev) => {
      const isExpanded = !prev[movimentacaoId];

      // Fecha a linha e limpa as parcelas se for recolhida
      if (!isExpanded) {
        setParcelas((prevParcelas) => {
          const updatedParcelas = { ...prevParcelas };
          delete updatedParcelas[movimentacaoId]; // Remove as parcelas armazenadas
          return updatedParcelas;
        });
      }

      return { ...prev, [movimentacaoId]: isExpanded };
    });

    const filtros = {};


    if (dataInicio) filtros.dataInicio = dataInicio;
    if (dataFim) filtros.dataFim = dataFim;

    // Se está expandindo, busca novamente as parcelas
    try {
      const response = await getParcelasDespesa(movimentacaoId, filtros);
      setParcelas((prev) => ({ ...prev, [movimentacaoId]: response.data }));
    } catch (err) {
      console.error('Erro ao buscar parcelas', err);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Título */}
      <h1 className="text-2xl font-bold text-gray-700">
        Consulta de Movimentações Financeiras - Contas a Pagar
      </h1>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="bg-white p-4 rounded-xl shadow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="descricao">
                  Descrição
                </label>
                <input
                  type="text"
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength="150"
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="fornecedor">
                  Fornecedor
                </label>
                <input
                  type="text"
                  id="fornecedor"
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  maxLength="150"
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="funcionario">
                  Funcionário
                </label>
                <input
                  type="text"
                  id="funcionario"
                  value={funcionario}
                  onChange={(e) => setFuncionario(e.target.value)}
                  maxLength="150"
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="cliente">
                  Cliente
                </label>
                <input
                  type="text"
                  id="cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  maxLength="150"
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="dataInicio">
                  Data Início
                </label>
                <input
                  type="date"
                  id="dataInicio"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="dataFim">
                  Data Fim
                </label>
                <input
                  type="date"
                  id="dataFim"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="boleto">
                  Boleto
                </label>
                <input
                  type="text"
                  id="boleto"
                  value={boleto}
                  onChange={(e) => setBoleto(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600" htmlFor="pagamento">
                  Tipo de Pagamento
                </label>
                <select
                  id="pagamento"
                  value={pagamento}
                  onChange={(e) => setPagamento(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="cotaunica">Cota Única</option>
                  <option value="parcelada">Parcelada</option>
                  <option value="recorrente">Recorrente</option>
                </select>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button onClick={() => setExecutarBusca(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">
                Pesquisar
              </button>
              <button onClick={handleClear} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow hover:bg-gray-300">
                Limpar
              </button>
              <button onClick={handleCadastrarModal} className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700">
                Cadastrar
              </button>
              <button onClick={handleUnificarModal} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700">
                Unificar Lançamentos
              </button>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2"></th>
                  <th className="p-2">ID</th>
                  <th className="p-2">Descrição</th>
                  <th className="p-2">Valor</th>
                  <th className="p-2">Data Lançamento</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentMovimentacoes.map((movimentacao) => (
                  <React.Fragment key={movimentacao.id}>
                    <tr className={`${expandedRows[movimentacao.id] ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                      <td className="p-2">
                        <button onClick={() => toggleExpand(movimentacao.id)} className="text-lg">
                          {expandedRows[movimentacao.id] ? "▼" : "▶"}
                        </button>
                      </td>
                      <td className="p-2">{movimentacao.id}</td>
                      <td className="p-2">
                        {(movimentacao.fornecedor?.nomeFantasia || movimentacao.fornecedor?.nome || movimentacao.cliente?.nome || movimentacao.funcionario?.nome || movimentacao.credor_nome || "") + " / " + movimentacao.descricao}
                      </td>
                      <td className="p-2 font-medium text-green-600">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(movimentacao.valor || 0)}
                      </td>
                      <td className="p-2">{formatarDataNew(movimentacao.data_lancamento)}</td>
                      <td className="p-2 flex gap-2">
                        {movimentacao.status === "aberta" ? (
                          <>
                            {movimentacao.tipo_lancamento !== "automatico" && (
                              <button onClick={() => handleEditClick(movimentacao)} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                                Editar
                              </button>
                            )}
                            <button onClick={() => handleLancaParcelas(movimentacao)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                              Lançar Parcelas
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleGetDespesaCompleta(movimentacao)} className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700">
                            Visualizar
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Parcelas expand */}
                    {expandedRows[movimentacao.id] &&
                      parcelas[movimentacao.id]?.map((parcela) => (
                        <tr key={parcela.id} className="bg-gray-50">
                          <td></td>
                          <td colSpan="2" className="p-2">
                            Parcela {parcela.numero} - {parcela.descricao} - Boleto: {parcela.boleto}
                          </td>
                          <td className="p-2 font-medium text-blue-600">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parcela.valor_parcela || 0)}
                          </td>
                          <td className="p-2">{formatarDataNew(parcela.vencimento)}</td>
                          <td className="p-2">
                            <button onClick={() => handlePagarParcelas(parcela)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                              Pagar
                            </button>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="mt-4">
            <Pagination
              currentPage={paginaAtual}
              totalPages={totalPages}
              onPageChange={setPaginaAtual}
              onRowsChange={handleChangeRowsPerPage}  // Alterado para usar função personalizada
              rowsPerPage={linhasPorPagina}
              rowsPerPageOptions={[50, 100, 150]}
            />
          </div>
        </>
      )}

      {toast.message && <Toast type={toast.type} message={toast.message} />}
      {isModalOpen && (
        <ModalMovimentacaoFinanceiraDespesa
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirmar={handleConfirmacaoParcelas}
          onSubmit={isEdit ? handleEditSubmit : handleAddMovimentacao}
          movimentacao={selectedMovimentacao}
          edit={isEdit}
        />
      )}
      {isModalLancaParcelasOpen && (
        <ModalLancamentoParcelas
          isOpen={isModalLancaParcelasOpen}
          onClose={() => setIsModalLancaParcelasOpen(false)}
          valorTotal={valor}
          onSubmit={handleSaveParcelas}
          despesa={selectedMovimentacao}
          onSave={handleSaveParcelas}
          onSuccess={() => {
            setIsModalLancaParcelasOpen(false);
            setToast({ message: "Parcelas salvas com sucesso!", type: "success" });
            setExecutarBusca(true); // Recarrega a lista após salvar
          }}


        />
      )}
      {isModalPagarLancamentosOpen && (
        <ModalPagarLancamentos
          isOpen={isModalPagarLancamentosOpen}
          onClose={() => setIsModalPagarLancamentosOpen(false)}
          onSubmit={handleSavePagamento}
          parcela={selectedParcela}
        />
      )}
      {isModalLancamentoCompletoOpen && (
        <ModalLancamentoCompleto
          isOpen={isModalLancamentoCompletoOpen}
          onClose={() => setIsModalLancamentoCompletoOpen(false)}
          lancamento={selectedLancamentoCompleto}
          onConfirmar={handleConfirmacaoParcelas}
        />
      )}
      {isModalUnificaLancamentosOpen && (
        <ModalUnificaLancamentos
          isOpen={isModalUnificaLancamentosOpen}
          onClose={() => setIsModalUnificaLancamentosOpen(false)}
          onSubmit={handleAddMovimentacao}
        />
      )}
      {/* Renderização do modal de autorização */}
      <PermissionModalUI />
    </div>
  );
}

export default MovimentacaoFinanceiraDespesa;
