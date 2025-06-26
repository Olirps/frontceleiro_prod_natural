import React, { useEffect, useState } from 'react';
import { cpfCnpjMask, removeMaks } from '../components/utils';
import { getFormasPagamento, getClientes, processTefPayment } from '../services/api';
import Toast from '../components/Toast';
import CadClienteSimpl from '../components/CadClienteSimpl';
import TefModal from '../components/TefModal';
import TefTransactionModal from '../components/TefTransactionModal';
import { converterMoedaParaNumero, formatarData, formatarMoedaBRL, converterData } from '../utils/functions';

import '../styles/SaleModal.css'; // Estilo do modal
import { Await } from 'react-router-dom';

const SaleModal = ({
  isOpen,
  onClose,
  onSubmit,
  totalQuantity,
  totalPrice = 0,
  saleData, // Aqui vamos receber os dados da venda (JSON fornecido)
  tipo,
  pagamento
}) => {
  // 07-05-2025 Ajustado de valor_total para totalPrice para igualar o nome do banco
  totalPrice = saleData.totalPrice;
  const [cliente, setCliente] = useState(saleData.cliente_nome || ''); // Preencher com o nome do cliente se disponível
  const [cliente_id, setClienteID] = useState(saleData.cliente_id || '');
  const [veiculo_id, setVeiculoId] = useState(saleData.veiculo_id || '');
  const [status_id, setStatusId] = useState(saleData.status_id || '');
  const [desconto, setDesconto] = useState('0');
  let [valorPagamento, setValorPagamento] = useState(totalPrice);
  const [valorTotal, setValorTotal] = useState(0);

  const [pagamentos, setPagamentos] = useState([]);
  const [novaForma, setNovaForma] = useState('');
  const [formaPgtoNome, setFormaPgtoNome] = useState('');
  const [novoValor, setNovoValor] = useState(totalPrice);
  const [trocoDinheiro, settrocoDinheiro] = useState('');

  const [quantidadeItens, setQuantidadeItens] = useState(totalQuantity);

  const [formasPagamento, setFormasPagamento] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [isConsultaClienteOpen, setIsConsultaClienteOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Variáveis para o TEF
  const [tefModalOpen, setTefModalOpen] = useState(false);
  const [currentTefPayment, setCurrentTefPayment] = useState(null);
  const [tefProcessing, setTefProcessing] = useState(false);
  const [completedTefPayments, setCompletedTefPayments] = useState([]);
  const [transacaoEmAndamento, setTransacaoEmAndamento] = useState(false);


  // Para manter os funcionários e produtos/serviços

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const fetchFormasPagamento = async () => {
      try {
        const response = await getFormasPagamento();
        setFormasPagamento(response.data);
      } catch (error) {
        console.error('Erro ao buscar formas de pagamento:', error);
        setToast({ message: 'Erro ao carregar formas de pagamento', type: 'error' });
      }
    };

    if (isOpen) { // Só busca quando o modal está aberto
      fetchFormasPagamento();
    }
  }, [isOpen]); // Dependência do isOpen para buscar sempre que o modal abrir

  useEffect(() => {
    if (tipo === 'liquidacao') {
      const total = saleData.reduce((acc, curr) => acc + parseFloat(curr.valor_parcela || 0), 0);
      setValorTotal(total);
      setValorPagamento(total);
      setNovoValor(total)
    } else {
      setValorTotal(parseFloat(saleData.totalPrice || 0));
      setValorPagamento(parseFloat(saleData.totalPrice || 0));
    }
  }, [saleData, tipo]);



  // Função para buscar clientes pelo nome
  const buscarClientes = async (nome) => {
    try {
      const response = await getClientes({ nome });

      setFilteredClientes(response.data);
      setIsConsultaClienteOpen(true);

      // Verifica se a resposta está vazia
      if (response.data && response.data.length === 0) {
        setToast({
          message: 'Nenhum cliente encontrado com este nome',
          type: 'info',  // Tipo 'info' para mensagens informativas
          duration: 3000
        });
      }

    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setToast({
        message: 'Erro ao buscar clientes',
        type: 'error',
        duration: 3000
      });
    }
  };

  // Função para selecionar um cliente da lista
  const selecionarCliente = (cliente) => {
    setCliente(cliente.nome);
    setClienteID(cliente.id);
    setIsConsultaClienteOpen(false);
  };

  // Função para abrir o modal de cadastro de cliente
  const abrirModalCadastroCliente = () => {
    setIsModalOpen(true);
  };

  // Função para fechar o modal de cadastro de cliente
  const fecharModalCadastroCliente = () => {
    setIsModalOpen(false);
  };

  // Função chamada quando um novo cliente é cadastrado com sucesso
  const handleClienteCadastrado = (novoCliente) => {
    setCliente(novoCliente.nome);
    setClienteID(novoCliente.id);
    fecharModalCadastroCliente();
    setToast({ message: 'Cliente cadastrado com sucesso!', type: 'success' });
  };

  // Cálculo do saldo restante
  const saldoRestanteSemFormat =
    parseFloat(valorTotal) - (pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0) + parseFloat(converterMoedaParaNumero(desconto) || 0));

  let saldoRestante = saldoRestanteSemFormat.toFixed(2);

  if (saldoRestante < 0) {
    saldoRestante = 0;
  }

  const handleDescontoChange = (e) => {
    let rawValue = converterMoedaParaNumero(e.target.value);
    let valorDesconto = formatarMoedaBRL(rawValue)
    valorDesconto = Number(converterMoedaParaNumero(valorDesconto))
    if (valorDesconto === '' || (!isNaN(valorDesconto) && valorDesconto <= valorPagamento)) {
      const novoValorAtual = parseFloat(valorTotal) - (pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0) + (valorDesconto) || 0);
      setDesconto(formatarMoedaBRL(String(rawValue)));
      setNovoValor((novoValorAtual).toFixed(2));
    }
  };

  useEffect(() => {
    if (novaForma === 'dinheiro') {
      const valorNum = parseFloat(novoValor.replace(',', '.')) || 0;
      if (valorNum > saldoRestanteSemFormat) {
        settrocoDinheiro((valorNum - saldoRestanteSemFormat).toFixed(2));
      } else {
        settrocoDinheiro('0');
      }
    }
  }, [novaForma, novoValor, saldoRestanteSemFormat]);

  if (!isOpen) return null;


  // Novo método para lidar com pagamentos TEF
  // Função para processar pagamento TEF (integrado com a API)
  const handleTefPayment = async (paymentData) => {
    try {
      setTefProcessing(true);
      const response = await processTefPayment(paymentData);

      if (response.success) {
        // Adiciona o pagamento à lista
        setPagamentos(prev => [...prev, paymentData]);

        // Atualiza o saldo restante
        const novoSaldo = saldoRestanteSemFormat - paymentData.valor;
        setNovoValor(novoSaldo.toFixed(2));

        setToast({ message: 'Pagamento TEF realizado!', type: 'success' });
        return true;
      } else {
        setToast({ message: response.message || 'Falha no pagamento TEF', type: 'error' });
        return false;
      }
    } catch (error) {
      console.error('Erro no TEF:', error);
      const mensagemErro = error?.response?.data?.message || error?.message || 'Erro ao processar TEF';
      setToast({ message: mensagemErro, type: 'error' });
      return false;
    } finally {
      setTefProcessing(false);
    }
  };



  // Adiciona pagamento ao total
  const adicionarPagamento = () => {
    let valorNum = 0;
    if (String(novoValor).startsWith("R$")) {
      valorNum = converterMoedaParaNumero(novoValor);
    } else {
      valorNum = Number(novoValor);
    }

    valorNum = Number(valorNum);

    if (!formaPgtoNome || isNaN(valorNum) || valorNum <= 0 ||
      (valorNum > saldoRestante && formaPgtoNome !== 'Dinheiro')) {
      setToast({ message: 'Forma de pagamento inválida ou valor inválido.', type: 'error' });
      return;
    }

    // Verifica se é um pagamento TEF
    const isTefPayment = formaPgtoNome.includes('TEF');

    if (isTefPayment) {
      // Se for TEF, inicia o fluxo especial
      handleTefPayment({ novaForma, valorNum, formaPgtoNome });
      return;
    }

    // Fluxo normal para não-TEF
    if (formaPgtoNome === 'Dinheiro' && valorNum > saldoRestante) {
      settrocoDinheiro((valorNum - saldoRestante).toFixed(2));
      valorNum = saldoRestante;
    }

    if (novaForma == 8 && cliente_id == '') {
      setToast({ message: 'Selecione um cliente para pagamento a Prazo.', type: 'error' });
      return;
    }

    setPagamentos([...pagamentos, { forma: novaForma, valor: valorNum, formaPgtoNome: formaPgtoNome }]);
    setNovaForma('');
    let valorRestanteAtualizado = saldoRestanteSemFormat - valorNum;
    setNovoValor(valorRestanteAtualizado.toFixed(2));
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault(); // Evita o comportamento padrão de recarregar a página

    if (loading) return; // Evita múltiplos cliques
    setLoading(true); // Ativa o estado de carregamento

    if (saldoRestante > 0) {
      setToast({ message: 'O pagamento não foi completado.', type: 'error' });
      setLoading(false); // Desativa o carregamento ao mostrar alerta

      if (!formaPagamento) {
        alert('Selecione uma forma de pagamento.');
        setLoading(false); // Desativa o carregamento ao mostrar alerta
        return;
      }

      return;
    }

    try {
      let dataHoje = new Date().toLocaleString().replace(',', '');
      let dataAjustada = converterData(dataHoje);

      let descontoAtualizado = converterMoedaParaNumero(desconto);
      const somaTotal = (Number(valorTotal) - Number(descontoAtualizado)).toFixed(2);
      if (tipo === 'liquidacao') {

        const dadosSubmit = {
          desconto: converterMoedaParaNumero(desconto) || 0,
          tipoVenda: 'liquidacao',
          valor: somaTotal,
          pagamentos,
          data_conclusao: dataAjustada
        }
        await onSubmit(dadosSubmit);

      } else if (tipo === 'venda') {
        const dadosSubmit = {
          tipoVenda: 'Venda',
          cliente,
          cliente_id,
          veiculo_id,
          dataVenda: dataAjustada,
          products: saleData.products,
          status_id,
          valor: somaTotal,
          desconto: converterMoedaParaNumero(desconto) || 0,
          pagamentos,
          data_conclusao: dataAjustada
        }
        await onSubmit(dadosSubmit);
      }
      else {
        const dadosSubmit = {
          tipoVenda: 'VendaRest',
          cliente,
          cliente_id,
          venda_id: saleData.vendaVinculada.id,
          valor: somaTotal,
          desconto: converterMoedaParaNumero(desconto) || 0,
          pagamentos,
          data_conclusao: dataAjustada
        }
        await onSubmit(dadosSubmit);

      }

      setToast({ message: 'Venda confirmada com sucesso!', type: 'success' });
      setLoading(false); // Desativa o estado de carregamento após sucesso
      onClose();
    } catch (error) {
      console.error('Erro ao confirmar venda:', error);
      setToast({ message: 'Erro ao confirmar venda.', type: 'error' });
      setLoading(false); // Desativa o estado de carregamento após erro
    }
  };

  // Função para remover um pagamento
  const removerPagamento = (pagamentos, index, setPagamentos, setToast) => {
    const pagamento = pagamentos[index];
    const confirmar = window.confirm(
      `Deseja remover o pagamento de R$ ${pagamento.valor} feito com ${pagamento.forma}?`
    );
    if (confirmar) {
      const novosPagamentos = pagamentos.filter((_, i) => i !== index);
      setPagamentos(novosPagamentos);
      setToast({ message: 'Pagamento removido com sucesso.', type: 'success' });

      // Recalcula o troco após a remoção de um pagamento
      const saldoRestanteAtualizado =
        parseFloat(totalPrice) -
        (novosPagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0) +
          parseFloat(converterMoedaParaNumero(desconto) || 0));

      if (saldoRestanteAtualizado < 0) {
        settrocoDinheiro((-saldoRestanteAtualizado).toFixed(2));
      } else {
        settrocoDinheiro('0');
      }
      // Atualiza o valor para o próximo pagamento
      setNovoValor(saldoRestanteAtualizado.toFixed(2));
    }
  };

  return (
    <div className="modal-overlay-sales">
      <div className="modal-content-sales">
        <form onSubmit={handleSubmitSale}>
          <div className="informacaoPagamento">
            <div className="form-row">
              {tipo !== 'liquidacao' && (
                <fieldset className="inline-fieldset">
                  <legend>Dados Cliente</legend>
                  <div className="modal-field cliente-field">
                    <input
                      name='cliente'
                      type="text"
                      value={cliente}
                      onChange={(e) => {
                        setCliente(e.target.value);
                        if (e.target.value.length > 2) {
                          buscarClientes(e.target.value);
                        } else {
                          setFilteredClientes([]);
                          setIsConsultaClienteOpen(false);
                        }
                      }}
                      placeholder="Digite o nome do cliente"
                      disabled={!!cliente_id}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-cadastrar-cliente"
                        onClick={abrirModalCadastroCliente}
                        disabled={!!cliente_id}
                      >
                        Cadastrar Cliente
                      </button>

                      {cliente_id && (
                        <button
                          type="button"
                          className="btn-remover-cliente"
                          onClick={() => {
                            setCliente('');
                            setClienteID('');
                            setFilteredClientes([]);
                            setIsConsultaClienteOpen(false);
                          }}
                          style={{
                            backgroundColor: '#d9534f',
                            color: '#fff',
                            border: 'none',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remover Cliente
                        </button>
                      )}
                    </div>
                  </div>
                  {isConsultaClienteOpen && filteredClientes.length > 0 && (
                    <div className="clientes-list">
                      <ul>
                        {filteredClientes.map((cli) => (
                          <li
                            key={cli.id}
                            onClick={() => selecionarCliente(cli)}
                            className="cliente-item"
                          >
                            {cli.nome} - {cli.cpfCnpj ? cpfCnpjMask(cli.cpfCnpj) : 'Sem CPF/CNPJ'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </fieldset>
              )}
            </div>
            <div className="form-row">
              <fieldset className="payment-fieldset">
                <legend className="payment-legend">
                  Pagamentos
                  <span className="payment-remaining">
                    Saldo Restante: {formatarMoedaBRL(saldoRestante)}
                  </span>
                </legend>

                <div className="payment-container">
                  {/* Seção de Adicionar Pagamento */}
                  <div className="payment-add-section">
                    <div className="payment-input-group">
                      <label className="payment-label">Desconto</label>
                      <input
                        type="text"
                        className="payment-input"
                        value={formatarMoedaBRL(desconto)}
                        onChange={handleDescontoChange}
                        placeholder="R$ 0,00"
                      />
                    </div>

                    <div className="payment-input-group">
                      <label className="payment-label">Valor do Pagamento</label>
                      <input
                        type="text"
                        className="payment-input"
                        value={formatarMoedaBRL(novoValor)}
                        onChange={(e) => setNovoValor(formatarMoedaBRL(e.target.value))}
                        placeholder="Digite o valor"
                      />
                    </div>

                    <div className="payment-input-group">
                      <label className="payment-label">Forma de Pagamento</label>
                      <select
                        className="payment-select"
                        value={novaForma}
                        onChange={(e) => {
                          setNovaForma(e.target.value);
                          setFormaPgtoNome(e.target.options[e.target.selectedIndex].text);
                        }}
                      >
                        <option value="">Selecione a forma</option>
                        {formasPagamento.map((forma) => (
                          <option key={forma.id} value={forma.id}>
                            {forma.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      className="payment-add-button"
                      onClick={adicionarPagamento}
                      disabled={!novaForma || !novoValor || parseFloat(novoValor) <= 0}
                    >
                      <i className="fas fa-plus"></i> Adicionar Pagamento
                    </button>
                  </div>

                  {/* Lista de Pagamentos Adicionados */}
                  <div className="payment-list-section">
                    <div className="payment-list-header">
                      <span>Forma de Pagamento</span>
                      <span>Valor</span>
                      <span>Ações</span>
                    </div>

                    {pagamentos.length === 0 ? (
                      <div className="payment-empty-state">
                        <i className="fas fa-money-bill-wave"></i>
                        <p>Nenhum pagamento adicionado</p>
                      </div>
                    ) : (
                      <div className="payment-list">
                        {pagamentos.map((p, index) => (
                          <div className="payment-item" key={index}>
                            <span className="payment-method">{p.formaPgtoNome}</span>
                            <span className="payment-value">{formatarMoedaBRL(p.valor)}</span>
                            <button
                              type="button"
                              className="payment-remove-button"
                              onClick={() => removerPagamento(pagamentos, index, setPagamentos, setToast)}
                              title="Remover pagamento"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resumo de Valores */}
                    <div className="payment-summary">
                      <div className="summary-row">
                        <span>Total da Venda:</span>
                        <span>{formatarMoedaBRL(totalPrice)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Desconto:</span>
                        <span className="discount-value">- {formatarMoedaBRL(desconto)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Total Pago:</span>
                        <span>{formatarMoedaBRL(pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0))}</span>
                      </div>
                      <div className="summary-row total">
                        <span>Saldo Restante:</span>
                        <span className={saldoRestante > 0 ? 'pending-value' : 'paid-value'}>
                          {formatarMoedaBRL(saldoRestante)}
                        </span>
                      </div>
                      {trocoDinheiro > 0 && (
                        <div className="summary-row">
                          <span>Troco:</span>
                          <span className="change-value">{formatarMoedaBRL(trocoDinheiro)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>
            {/* Resto do código do modal */}
            <div className="modal-actions-sale">
              <button
                className="confirm-btn"
                type="submit"
                disabled={loading} // Desativa o botão enquanto está carregando
              >
                {loading ? 'Processando...' : 'Confirmar Venda'}
              </button>
              <button
                className="cancel-btn"
                type="button"
                onClick={() => {
                  const confirmar = window.confirm('Deseja cancelar o pagamento?');
                  if (confirmar) onClose();
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
      {/* Por este */}
      <CadClienteSimpl
        isOpen={isModalOpen}
        onClose={fecharModalCadastroCliente}
        onSuccess={handleClienteCadastrado}
      />
      {/* Aciona no Modal do TEF */}
      <TefModal
        isOpen={tefModalOpen}
        onClose={() => setTefModalOpen(false)}
        onConfirm={() => handleTefPayment(currentTefPayment)}
        paymentData={currentTefPayment}
        isProcessing={tefProcessing}
        isFullPayment={currentTefPayment?.valor >= saldoRestanteSemFormat}
      />
      <TefTransactionModal isOpen={tefProcessing} tempoTotalSegundos={90} />


      {toast.message && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
};

export default SaleModal;