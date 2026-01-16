import React, { useState, useEffect } from 'react';
import {
  getAllMovimentacaofinanceiraDespesa, addMovimentacaofinanceiraDespesa,
  getLancamentoCompletoById, updateLancamentoDespesa,
  getLancamentoDespesaById, getParcelaByID,
  pagamentoParcela, updateMovimentacaofinanceiraDespesa,
  addParcelasDespesa, getParcelasDespesa,
  getLancamentoReceitaById
} from '../services/api';
import '../styles/MovimentacaoFinanceiraDespesa.css';
import ModalMovimentacaoFinanceiraReceitas from '../components/ModalMovimentacaoFinanceiraReceitas';
import { converterMoedaParaNumero, formatarData, dataAtual } from '../utils/functions';
import ModalLancamentoCompleto from '../components/ModalLancamentoCompleto';
import ModalUnificaLancamentos from '../components/ModalUnificaLancamentos';
import ModalPagamentosUnificados from '../components/ModalPagamentosUnificados';
import ModalLancamentoParcelas from '../components/ModalLancamentoParcelas'; // Importe o novo modal
import ModalPagarLancamentos from '../components/ModalPagarLancamentos'; // Importe o novo modal
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";
import Pagination from '../utils/Pagination';
import PaymentModal from '../components/PaymentModal';



function MovimentacaoFinanceiraReceitas() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [filteredMovimentacoes, setFilteredMovimentacoes] = useState([]);
  const [valor, setValor] = useState('');
  const [boleto, setBoleto] = useState('');
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDespesa, setIsDespesa] = useState(false);
  const [isModalLancaParcelasOpen, setIsModalLancaParcelasOpen] = useState(false);
  const [isModalUnificaLancamentosOpen, setIsModalUnificaLancamentosOpen] = useState(false);
  const [isModalPagamentoUnificadoOpen, setIsModalPagamentoUnificadoOpen] = useState(false);
  const [isModalPagarLancamentosOpen, setIsModalPagarLancamentosOpen] = useState(false);
  const [isModalLancamentoCompletoOpen, setIsModalLancamentoCompletoOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedMovimentacao, setSelectedMovimentacao] = useState(null);
  const [selectedLancamentoCompleto, setSelectedLancamentoCompleto] = useState(null);
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [executarBusca, setExecutarBusca] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTotal, setPaymentTotal] = useState(0);


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

  //
  useEffect(() => {
    const fetchMovimentacao = async () => {
      try {
        const response = await getAllMovimentacaofinanceiraDespesa({ tipo: 'credito' });
        setMovimentacoes(response.data);
        setFilteredMovimentacoes(response.data);
      } catch (err) {
        console.error('Erro ao buscar movimentações financeiras', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovimentacao();
  }, [executarBusca]);



  const handleSearch = async () => {
    // Cria um objeto para armazenar os filtros apenas se estiverem preenchidos
    const filtros = {};
    filtros.tipo = 'credito';
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
    })

  };

  const handleUnificarModal = () => {
    checkPermission('unificar-lancamentos', 'insert', () => {
      setIsModalUnificaLancamentosOpen(true);
    })
  };

  const handlePagamentoUnificado = () => {
    checkPermission('unificar-pagamentos', 'insert', () => {
      setIsModalPagamentoUnificadoOpen(true);
    })
  };

  const handleAddPagamentoUnificado = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const lanctoSelecionados = formData.get('selectedLancamentos') // "67,69"
      ?.split(',') // Divide a string em um array ["67", "69"]
      .map(Number) // Converte para números [67, 69]
      .filter(num => !isNaN(num));

    const valorLancamento = formData.get('valorLancamento');
    const data_lancamento = new Date().toISOString().split('T')[0]; // Define a data atual

    const newMovimentacao = {
      descricao: formData.get('descricao'),
      valor: converterMoedaParaNumero(valorLancamento),
      data_lancamento,
      data_vencimento: formData.get('dataVencimento'),
      boleto: formData.get('boleto'),
      tipo_parcelamento: formData.get('tipoParcelamento'),
      tipo: 'credito',
      lanctoSelecionados
    };

    try {
      await addMovimentacaofinanceiraDespesa(newMovimentacao);
      setToast({ message: "Movimentação financeira cadastrada com sucesso!", type: "success" });
      setIsModalPagamentoUnificadoOpen(false);
      const response = await getAllMovimentacaofinanceiraDespesa({ tipo: 'credito' });
      setMovimentacoes(response.data);
      setFilteredMovimentacoes(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao cadastrar movimentação financeira.";
      setToast({ message: errorMessage, type: "error" });
    }
  }

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
      let valorTotalOriginal;
      if (parcelas.length > 1) {
        valorTotalOriginal = (parcelas.reduce((total, parcela) => total + converterMoedaParaNumero(parcela.valor), 0));
        const valorEntradaSum = converterMoedaParaNumero(valorEntrada);
        valorTotalOriginal = Number((Number(valorTotalOriginal) + Number(valorEntradaSum)));
        const valorLancamentoLimpo = converterMoedaParaNumero(valorLancamento);

        if (Number(valorTotalOriginal) !== valorLancamentoLimpo) {
          throw new Error('Somatória das Parcelas devem ser o mesmo do valor do Lançamento');
        }
      }

      await addMovimentacaofinanceiraDespesa(newMovimentacao);
      setToast({ message: "Movimentação financeira cadastrada com sucesso!", type: "success" });
      setIsModalOpen(false);
      setIsModalUnificaLancamentosOpen(false);
      const response = await getAllMovimentacaofinanceiraDespesa({ tipo: 'credito' });
      setMovimentacoes(response.data);
      setFilteredMovimentacoes(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao cadastrar movimentação financeira.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  const handleEditClick = async (movimentacao) => {
    try {
      const response = await getLancamentoReceitaById(movimentacao.id);
      setSelectedMovimentacao(response);
      setIsEdit(true);
      setIsModalOpen(true);
    } catch (err) {
      const status = err?.status;
      const message = typeof err?.message === 'string' ? err.message : 'Erro desconhecido';

      setToast({ message: message, type: "error" });


      console.error('Erro ao buscar movimentação:', err);
    }
  };



  const handleLancaParcelas = async (movimentacao) => {
    checkPermission('lancarparcelas', 'insert', async () => {
      const response = await getLancamentoReceitaById(movimentacao.id);
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
      const response = await getAllMovimentacaofinanceiraDespesa({ tipo: 'credito' });
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
      metodo_pagamento: formData.get('formaPgtoNome'),
      data_efetiva_pg: dataEfetivaPgto,
      status: 'liquidado'
    };

    try {
      const parcelaPaga = await pagamentoParcela(selectedParcela.id, pagamento);
      // Aqui você pode enviar as parcelas para o backend ou processá-las conforme necessário
      setToast({ message: "Parcelas Liquidada com sucesso!", type: "success" });
      setIsModalPagarLancamentosOpen(false);
      const response = await getAllMovimentacaofinanceiraDespesa({ tipo: 'credito' });
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
      setPaymentTotal(parcela.valor_parcela);
      setIsPaymentModalOpen(true);
    });
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
      const response = await getAllMovimentacaofinanceiraDespesa({ tipo: 'credito' });
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
      setSelectedLancamentoCompleto(lancamentoCompleto);
      setIsModalLancamentoCompletoOpen(true);
    });
  }

  const handleConfirmacaoParcelas = async (dadosRecebidos) => {

    try {
      await updateLancamentoDespesa(dadosRecebidos.id, { status: 'cancelada' });
      setToast({ message: "Movimentação financeira atualizada com sucesso!", type: "success" });
      setIsModalLancamentoCompletoOpen(false);
      setIsEdit(false);
      const response = await getAllMovimentacaofinanceiraDespesa({ tipo: 'credito' });
      setMovimentacoes(response.data);
      setFilteredMovimentacoes(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao atualizar movimentação financeira.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  const handleConfirmPayment = async (resultado) => {
    try {
      const payload = {
        parcela_id: selectedParcela.id,
        pagamentos: resultado.pagamentos,
        data_pagamento_efetivo: resultado.data_pagamento_efetivo,
        recebimentoHoje: resultado.recebimentoHoje
      };

      await pagamentoParcela(selectedParcela.id, payload); // novo endpoint

      setToast({
        message: 'Pagamento registrado com sucesso!',
        type: 'success'
      });

      setIsPaymentModalOpen(false);

      const response = await getAllMovimentacaofinanceiraDespesa({
        tipo: 'credito'
      });
      setMovimentacoes(response.data);
      setFilteredMovimentacoes(response.data);

      toggleExpand(selectedParcela.financeiro_id);
    } catch (error) {
      console.error(error);
      setToast({
        message: 'Erro ao realizar pagamento',
        type: 'error'
      });
    }
  };



  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const totalPages = Math.ceil(filteredMovimentacoes.length / rowsPerPage);
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Consulta de Movimentações Financeiras - Contas a Receber</h1>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* FILTROS */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium">Descrição</label>
              <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium">Fornecedor</label>
              <input type="text" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium">Funcionário</label>
              <input type="text" value={funcionario} onChange={(e) => setFuncionario(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium">Cliente</label>
              <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium">Data Início</label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium">Data Fim</label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium">Boleto</label>
              <input type="text" value={boleto} onChange={(e) => setBoleto(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium">Tipo de Pagamento</label>
              <select value={pagamento} onChange={(e) => setPagamento(e.target.value)} className="w-full border rounded px-2 py-1">
                <option value="">Todos</option>
                <option value="cotaunica">Cota Única</option>
                <option value="parcelada">Parcelada</option>
                <option value="recorrente">Recorrente</option>
              </select>
            </div>
          </div>

          {/* BOTÕES */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Pesquisar</button>
            <button onClick={handleClear} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Limpar</button>
            <button onClick={handleCadastrarModal} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Cadastrar</button>
            <button onClick={handleUnificarModal} className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600">Unificar</button>
            <button onClick={handlePagamentoUnificado} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Pagto. Unificado</button>
          </div>

          {/* TABELA */}
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left text-sm font-medium">#</th>
                  <th className="p-2 text-left text-sm font-medium">ID</th>
                  <th className="p-2 text-left text-sm font-medium">Descrição</th>
                  <th className="p-2 text-left text-sm font-medium">Valor</th>
                  <th className="p-2 text-left text-sm font-medium">Data</th>
                  <th className="p-2 text-left text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentMovimentacoes.map((movimentacao) => (
                  <React.Fragment key={movimentacao.id}>
                    <tr className={expandedRows[movimentacao.id] ? 'bg-blue-50' : ''}>
                      <td className="p-2">
                        <button onClick={() => toggleExpand(movimentacao.id)} className="text-xs">
                          {expandedRows[movimentacao.id] ? '▼' : '▶'}
                        </button>
                      </td>
                      <td className="p-2">{movimentacao.id}</td>
                      <td className="p-2">{(movimentacao.fornecedor?.nomeFantasia || movimentacao.fornecedor?.nome || movimentacao.cliente?.nome || movimentacao.funcionario?.nome || movimentacao.credor_nome || '') + ' / ' + movimentacao.descricao}</td>
                      <td className="p-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(movimentacao.valor || 0)}</td>
                      <td className="p-2">{formatarData(movimentacao.data_lancamento)}</td>
                      <td className="p-2 space-x-1">
                        {movimentacao.status === 'aberta' ? (
                          <>
                            {movimentacao.tipo_lancamento !== 'automatico' && (
                              <button onClick={() => handleEditClick(movimentacao)} className="text-blue-500 hover:underline text-sm">Editar</button>
                            )}
                            <button onClick={() => handleLancaParcelas(movimentacao)} className="text-green-500 hover:underline text-sm">Parcelas</button>
                          </>
                        ) : (
                          <button onClick={() => handleGetDespesaCompleta(movimentacao)} className="text-gray-500 hover:underline text-sm">Visualizar</button>
                        )}
                      </td>
                    </tr>

                    {/* Parcelas Expandida */}
                    {expandedRows[movimentacao.id] && parcelas[movimentacao.id]?.map((parcela) => (
                      <tr key={parcela.id} className="bg-gray-50 text-sm">
                        <td></td>
                        <td colSpan={2}>Parcela {parcela.numero} - {parcela.descricao} - Boleto: {parcela.boleto}</td>
                        <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parcela.valor_parcela || 0)}</td>
                        <td>{new Date(parcela.vencimento).toLocaleDateString('pt-BR')}</td>
                        <td>
                          <button onClick={() => handlePagarParcelas(parcela)} className="text-red-500 hover:underline">Pagar</button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {currentMovimentacoes && currentMovimentacoes.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  setExecutarBusca(true);
                }}
                onRowsChange={(rows) => {
                  setRowsPerPage(rows);
                  setCurrentPage(1);
                  setExecutarBusca(true);
                }}
                rowsPerPage={rowsPerPage}
              />
            </div>
          )}
        </>
      )}
      {toast.message && <Toast type={toast.type} message={toast.message} />}
      {
        isModalOpen && (
          <ModalMovimentacaoFinanceiraReceitas
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirmar={handleConfirmacaoParcelas}
            onSubmit={isEdit ? handleEditSubmit : handleAddMovimentacao}
            movimentacao={selectedMovimentacao}
            edit={isEdit}
          />
        )
      }
      {
        isModalLancaParcelasOpen && (
          <ModalLancamentoParcelas
            isOpen={isModalLancaParcelasOpen}
            onClose={() => setIsModalLancaParcelasOpen(false)}
            valorTotal={valor}
            onSubmit={handleSaveParcelas}
            despesa={selectedMovimentacao}
            onSave={handleSaveParcelas}

          />
        )
      }
      {
        isPaymentModalOpen && selectedParcela && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            total={paymentTotal}
            tipo="liquidacao"
            permitirDesconto={false}
            permitirParcelamento={false}
            onClose={() => setIsPaymentModalOpen(false)}
            onConfirm={handleConfirmPayment}
          />
        )
      }

      {
        isModalLancamentoCompletoOpen && (
          <ModalLancamentoCompleto
            isOpen={isModalLancamentoCompletoOpen}
            isDespesa={isDespesa}
            onClose={() => setIsModalLancamentoCompletoOpen(false)}
            lancamento={selectedLancamentoCompleto}
            onConfirmar={handleConfirmacaoParcelas}
            onReceita={true}
          />
        )
      }
      {
        isModalUnificaLancamentosOpen && (
          <ModalUnificaLancamentos
            isOpen={isModalUnificaLancamentosOpen}
            onClose={() => setIsModalUnificaLancamentosOpen(false)}
            onSubmit={handleAddMovimentacao}
          />
        )
      }
      {
        isModalPagamentoUnificadoOpen && (
          <ModalPagamentosUnificados
            isOpen={isModalPagamentoUnificadoOpen}
            onClose={() => setIsModalPagamentoUnificadoOpen(false)}
            onSuccess={() => {
              setToast({ message: 'Lançamentos liquidados com sucesso!', type: 'success' });
              setExecutarBusca(true); // se aplicável
            }}
          />
        )
      }
      {/* Renderização do modal de autorização */}
      <PermissionModalUI />
    </div>
  );
}

export default MovimentacaoFinanceiraReceitas;
