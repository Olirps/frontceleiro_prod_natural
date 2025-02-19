import React, { useState, useEffect } from 'react';
import { getAllMovimentacaofinanceiraDespesa, addMovimentacaofinanceiraDespesa, getLancamentoCompletoById, updateLancamentoDespesa, getLancamentoDespesaById, getParcelaByID, pagamentoParcela, updateMovimentacaofinanceiraDespesa, addParcelasDespesa, getParcelasDespesa } from '../services/api';
import '../styles/MovimentacaoFinanceiraDespesa.css';
import ModalMovimentacaoFinanceiraDespesa from '../components/ModalMovimentacaoFinanceiraDespesa';
import { converterMoedaParaNumero } from '../utils/functions';
import ModalLancamentoCompleto from '../components/ModalLancamentoCompleto';
import ModalLancamentoParcelas from '../components/ModalLancamentoParcelas'; // Importe o novo modal
import ModalPagarLancamentos from '../components/ModalPagarLancamentos'; // Importe o novo modal
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função


function MovimentacaoFinanceiraDespesa() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [funcionario, setFuncionario] = useState('');
  const [filteredMovimentacoes, setFilteredMovimentacoes] = useState([]);
  const [valor, setValor] = useState('');
  const [notaId, setNotaId] = useState('');
  const [dataLancamento, setDataLancamento] = useState('');
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLancaParcelasOpen, setIsModalLancaParcelasOpen] = useState(false);
  const [isModalPagarLancamentosOpen, setIsModalPagarLancamentosOpen] = useState(false);
  const [isModalLancamentoCompletoOpen, setIsModalLancamentoCompletoOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedMovimentacao, setSelectedMovimentacao] = useState(null);
  const [selectedLancamentoCompleto, setSelectedLancamentoCompleto] = useState(null);
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const { permissions } = useAuth();

  ////handleSearch
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [cliente, setCliente] = useState('');
  ////handleSearch - Final




  // responsavel por expandir
  const [expandedRows, setExpandedRows] = useState({});
  const [parcelas, setParcelas] = useState({});

  //
  useEffect(() => {
    const fetchMovimentacao = async () => {
      try {
        const response = await getAllMovimentacaofinanceiraDespesa();
        setMovimentacoes(response.data);
        setFilteredMovimentacoes(response.data);
      } catch (err) {
        console.error('Erro ao buscar movimentações financeiras', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovimentacao();
  }, []);



  const handleSearch = () => {
    // Verifica quais filtros estão preenchidos
    const filtrosAtivos = {
      descricao: !!descricao, // true se descricao estiver preenchida
      fornecedor: !!fornecedor, // true se fornecedor estiver preenchido
      funcionario: !!funcionario, // true se funcionario estiver preenchido
      cliente: !!cliente, // true se cliente estiver preenchido
      dataVencimento: !!dataInicio && !!dataFim, // true se dataInicio e dataFim estiverem preenchidos
      pagamento: !!pagamento, // true se pagamento estiver preenchido
    };

    // Aplica os filtros dinamicamente
    const results = movimentacoes.filter(movimentacao => {
      // Filtro por descrição (se ativo)
      const descricaoMatch = !filtrosAtivos.descricao
        || movimentacao.descricao?.toLowerCase().includes(descricao.trim().toLowerCase());

      // Filtro por fornecedor (se ativo)
      const fornecedorMatch = !filtrosAtivos.fornecedor
        || movimentacao.fornecedor?.nomeFantasia?.toLowerCase().includes(fornecedor.toLowerCase());

      // Filtro por funcionário (se ativo)
      const funcionarioMatch = !filtrosAtivos.funcionario
        || movimentacao.funcionario?.nome?.toLowerCase().includes(funcionario.toLowerCase());

      // Filtro por cliente (se ativo)
      const clienteMatch = !filtrosAtivos.cliente
        || movimentacao.cliente?.nome?.toLowerCase().includes(cliente.toLowerCase());

      // Filtro por data de vencimento (se ativo)
      const dataVencimentoMatch = !filtrosAtivos.dataVencimento
        || (new Date(movimentacao.data_vencimento) >= new Date(dataInicio)
          && new Date(movimentacao.data_vencimento) <= new Date(dataFim));

      // Filtro por tipo de pagamento (se ativo)
      const pagamentoMatch = !filtrosAtivos.pagamento
        || movimentacao.pagamento === pagamento;

      // Retorna true apenas se todos os filtros ativos forem atendidos
      return descricaoMatch && fornecedorMatch && funcionarioMatch && clienteMatch && dataVencimentoMatch && pagamentoMatch;
    });

    setFilteredMovimentacoes(results);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setDescricao('');
    setFornecedor('');
    setFuncionario('');
    setFilteredMovimentacoes(movimentacoes);
    setCurrentPage(1);
  };

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleCadastrarModal = () => {
    if (!hasPermission(permissions, 'movimentacaofinanceiradespesas', 'insert')) {
      setToast({ message: "Você não tem permissão para cadastrar despesas.", type: "error" });
      return; // Impede a abertura do modal
    }
    setIsModalOpen(true);
    setIsEdit(false);
    setSelectedMovimentacao(null);
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
      pagamento,
      lancarParcelas: parcelas,
      valorEntradaDespesa: converterMoedaParaNumero(valorEntrada),
      tipo_parcelamento: formData.get('tipoParcelamento'),
      tipo: formData.get('tipo')
    };

    try {
      const valorTotalOriginal = parcelas.reduce((total, parcela) => total + converterMoedaParaNumero(parcela.valor), 0);
      if (valorTotalOriginal !== converterMoedaParaNumero(valorLancamento)) {
        throw new Error('Somatória das Parcelas devem ser o mesmo do valor do Lançamento');
      }
      await addMovimentacaofinanceiraDespesa(newMovimentacao);
      setToast({ message: "Movimentação financeira cadastrada com sucesso!", type: "success" });
      setIsModalOpen(false);
      const response = await getAllMovimentacaofinanceiraDespesa();
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
    if (!hasPermission(permissions, 'lancarparcelas', 'insert')) {
      setToast({ message: "Você não tem permissão para lançar parcelas.", type: "error" });
      return; // Impede a abertura do modal
    }
    const response = await getLancamentoDespesaById(movimentacao.id);
    setSelectedMovimentacao(response.data);
    setValor(response.data.valor);
    setIsModalLancaParcelasOpen(true);
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
      const response = await getAllMovimentacaofinanceiraDespesa();
      setMovimentacoes(response.data);
      setFilteredMovimentacoes(response.data);


    } catch (error) {

    }
  };

  const handleSavePagamento = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const valorPago = formData.get('valorPago');
    const pagamento = {
      data_pagamento: formData.get('datapagamento'),
      valor_pago: converterMoedaParaNumero(valorPago),
      conta_id: formData.get('contabancaria'),
      metodo_pagamento: formData.get('formaPagamento'),
      data_efetiva_pg: new Date().toISOString().split('T')[0],
      status: 'liquidado'
    };

    try {
      const parcelaPaga = await pagamentoParcela(selectedParcela.id, pagamento);
      // Aqui você pode enviar as parcelas para o backend ou processá-las conforme necessário
      setToast({ message: "Parcelas Liquidada com sucesso!", type: "success" });
      setIsModalPagarLancamentosOpen(false);
      const response = await getAllMovimentacaofinanceiraDespesa();
      setMovimentacoes(response.data);
      setFilteredMovimentacoes(response.data);
      toggleExpand(selectedParcela.financeiro_id)

    } catch (error) {

    }
  };
  const handlePagarParcelas = async (parcela) => {
    if (!hasPermission(permissions, 'pagamentosparcelas', 'insert')) {
      setToast({ message: "Você não tem permissão para realizar pagamentos.", type: "error" });
      return; // Impede a abertura do modal
    }
    const response = await getParcelaByID(parcela.id);
    setSelectedParcela(response.data);
    setIsModalPagarLancamentosOpen(true);
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
      const response = await getAllMovimentacaofinanceiraDespesa();
      setMovimentacoes(response.data);
      setFilteredMovimentacoes(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao atualizar movimentação financeira.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  const handleGetDespesaCompleta = async (lancto) => {
    if (!hasPermission(permissions, 'lancamento-completo', 'view')) {
      setToast({ message: "Você não tem permissão visualizar o lançamento.", type: "error" });
      return; // Impede a abertura do modal
    }
    const lancamentoCompleto = await getLancamentoCompletoById(lancto.id);
    setSelectedLancamentoCompleto(lancamentoCompleto)
    setIsModalLancamentoCompletoOpen(true)
  }
  const handleConfirmacaoParcelas = async (dadosRecebidos) => {

    try {
      await updateLancamentoDespesa(dadosRecebidos.id, { status: 'cancelada' });
      setToast({ message: "Movimentação financeira atualizada com sucesso!", type: "success" });
      setIsModalLancamentoCompletoOpen(false);
      setIsEdit(false);
      const response = await getAllMovimentacaofinanceiraDespesa();
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

  const totalPages = Math.ceil(filteredMovimentacoes.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentMovimentacoes = filteredMovimentacoes.slice(startIndex, startIndex + rowsPerPage);

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

    // Se está expandindo, busca novamente as parcelas
    try {
      const response = await getParcelasDespesa(movimentacaoId);
      setParcelas((prev) => ({ ...prev, [movimentacaoId]: response.data }));
    } catch (err) {
      console.error('Erro ao buscar parcelas', err);
    }
  };

  //responsavel por expandir a linha - final

  const formatarData = (data) => {
    const dataCorrigida = new Date(data);
    dataCorrigida.setMinutes(dataCorrigida.getMinutes() + dataCorrigida.getTimezoneOffset()); // Ajuste de fuso horário
    return dataCorrigida.toLocaleDateString('pt-BR');
  };

  return (
    <div id="movimentacoes-container">
      <h1 className="title-page">Consulta de Movimentações Financeiras</h1>
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>) : (
        <>
          <div id="search-container">
            <div id="search-fields">
              <div>
                <label htmlFor="descricao">Descrição</label>
                <input
                  type="text"
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength="150"
                />
              </div>
              <div>
                <label htmlFor="fornecedor">Fornecedor</label>
                <input
                  type="text"
                  id="fornecedor"
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  maxLength="150"
                />
              </div>
              <div>
                <label htmlFor="funcionario">Funcionário</label>
                <input
                  type="text"
                  id="funcionario"
                  value={funcionario}
                  onChange={(e) => setFuncionario(e.target.value)}
                  maxLength="150"
                />
              </div>
              <div>
                <label htmlFor="cliente">Cliente</label>
                <input
                  type="text"
                  id="cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  maxLength="150"
                />
              </div>
              <div>
                <label htmlFor="dataInicio">Data Início</label>
                <input
                  type="date"
                  id="dataInicio"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="dataFim">Data Fim</label>
                <input
                  type="date"
                  id="dataFim"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="pagamento">Tipo de Pagamento</label>
                <select
                  id="pagamento"
                  value={pagamento}
                  onChange={(e) => setPagamento(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="cotaunica">Cota Única</option>
                  <option value="parcelada">Parcelada</option>
                  <option value="recorrente">Recorrente</option>
                </select>
              </div>
            </div>
            <div>
              <div id="button-group">
                <button onClick={handleSearch} className="button">Pesquisar</button>
                <button onClick={handleClear} className="button">Limpar</button>
                <button onClick={() => {
                  handleCadastrarModal();
                }} className="button">Cadastrar</button>
              </div>
            </div>
          </div>

          <div id="separator-bar"></div>

          <div id="results-container">
            <div id="grid-padrao-container">
              <table id='grid-padrao'>
                <thead>
                  <tr>
                    <th></th>
                    <th>ID</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Data Lançamento</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMovimentacoes.map((movimentacao) => (
                    <React.Fragment key={movimentacao.id}>
                      <tr className={expandedRows[movimentacao.id] ? 'selected' : ''}>
                        <td>
                          <button onClick={() => toggleExpand(movimentacao.id)}>
                            {expandedRows[movimentacao.id] ? '▼' : '▶'}
                          </button>
                        </td>
                        <td>{movimentacao.id}</td>
                        <td>
                          {
                            (movimentacao.fornecedor ? (movimentacao.fornecedor.nomeFantasia ? movimentacao.fornecedor.nomeFantasia : movimentacao.fornecedor.nome) : '' ||
                              movimentacao.cliente?.nome ||
                              movimentacao.funcionario?.nome || movimentacao.credor_nome || '') + ' / ' + movimentacao.descricao}
                        </td>
                        <td>{
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(movimentacao.valor || 0)
                        }</td>
                        <td>{formatarData(movimentacao.data_lancamento)}</td>
                        <td>
                          <div>
                            {(movimentacao.status === 'aberta') ? (
                              <>
                                {movimentacao.tipo_lancamento !== 'automatico' && (
                                  <button
                                    onClick={() => handleEditClick(movimentacao)}
                                    className="edit-button"
                                  >
                                    Editar
                                  </button>
                                )}
                                <button
                                  onClick={() => handleLancaParcelas(movimentacao)}
                                  className="edit-button"
                                >
                                  Lançar Parcelas
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleGetDespesaCompleta(movimentacao)}
                                className="edit-button"
                              >
                                Visualizar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedRows[movimentacao.id] && parcelas[movimentacao.id] && (
                        parcelas[movimentacao.id].map((parcela) => (
                          <tr key={parcela.id} className="parcela-row">
                            <td></td>
                            <td colspan="2">Parcela {parcela.numero} - {parcela.descricao}</td>
                            <td>{new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(parcela.valor_parcela || 0)}</td>
                            <td>{formatarData(parcela.vencimento)}</td>
                            <td>
                              <button
                                className="edit-button"
                                onClick={() => {
                                  handlePagarParcelas(parcela);
                                }}
                              >
                                Pagar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </React.Fragment>
                  ))}
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
    </div>
  );
}

export default MovimentacaoFinanceiraDespesa;
