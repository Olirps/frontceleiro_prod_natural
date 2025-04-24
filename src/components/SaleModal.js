import React, { useEffect, useState } from 'react';
import { cpfCnpjMask, removeMaks } from '../components/utils';
import { getFormasPagamento } from '../services/api';
import Toast from '../components/Toast';
import ModalCadastraCliente from '../components/ModalCadastraCliente';
import { converterMoedaParaNumero, formatarData, formatarMoedaBRL, converterData } from '../utils/functions';

import '../styles/SaleModal.css'; // Estilo do modal

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

  const [pagamentos, setPagamentos] = useState([]);
  const [novaForma, setNovaForma] = useState('');
  const [formaPgtoNome, setFormaPgtoNome] = useState('');
  const [novoValor, setNovoValor] = useState(totalPrice);
  const [trocoDinheiro, settrocoDinheiro] = useState('');

  const [quantidadeItens, setQuantidadeItens] = useState(totalQuantity);

  const [formasPagamento, setFormasPagamento] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpf] = useState('');
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [isConsultaClienteOpen, setIsConsultaClienteOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [onSucesso, setOnSucesso] = useState(false);

  // Para manter os funcionários e produtos/serviços
  const [funcionarios, setFuncionarios] = useState(saleData.funcionarios || []);
  const [produtosServicos, setProdutosServicos] = useState(saleData.products || []); //alterado de produtos_servicos para products para ficar com o comportamento correto ao Lançar O.S.
  const [status, setStatus] = useState(saleData.status || '');

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



  // Cálculo do saldo restante
  const saldoRestanteSemFormat =
    parseFloat(totalPrice) - (pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0) + parseFloat(converterMoedaParaNumero(desconto) || 0));

  let saldoRestante = saldoRestanteSemFormat.toFixed(2);

  if (saldoRestante < 0) {
    saldoRestante = 0;
  }

  const handleDescontoChange = (e) => {
    let rawValue = converterMoedaParaNumero(e.target.value);
    let valorDesconto = formatarMoedaBRL(rawValue)
    valorDesconto = Number(converterMoedaParaNumero(valorDesconto))
    if (valorDesconto === '' || (!isNaN(valorDesconto) && valorDesconto <= valorPagamento)) {
      const novoValorAtual = parseFloat(totalPrice) - (pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0) + (valorDesconto) || 0);
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

  // Adiciona pagamento ao total
  const adicionarPagamento = () => {
    let valorNum = 0;
    if (novoValor.startsWith("R$")) {
      valorNum = converterMoedaParaNumero(novoValor);
    } else {
      valorNum = Number(novoValor);
    }

    valorNum = Number(valorNum)
    if (!formaPgtoNome || isNaN(valorNum) || valorNum <= 0 || (valorNum > saldoRestante && formaPgtoNome !== 'Dinheiro')) {
      setToast({ message: 'Forma de pagamento inválida ou valor inválido.', type: 'error' });
      return;
    }

    if (formaPgtoNome === 'Dinheiro' && valorNum > saldoRestante) {
      settrocoDinheiro((valorNum - saldoRestante).toFixed(2));
      valorNum = saldoRestante;
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
      const valortTotal = (Number(totalPrice) - Number(descontoAtualizado)).toFixed(2);
      // 04-04-2025 Alterado totalPrice para valor_total para ficar com o comportamento correto ao Lançar O.S.
      // 05-04-2025 Alterado produtos_servicos para products para ficar com o comportamento correto ao Lançar O.S.
      // 07-05-2025 Ajustado de valor_total para totalPrice para igualar o nome do banco
      await onSubmit({
        cliente,
        cliente_id,
        veiculo_id,
        totalQuantity,
        status_id,
        totalPrice: valortTotal,
        desconto: converterMoedaParaNumero(desconto) || 0,
        valorPagamento: valorPagamento - (parseFloat(desconto) || 0),
        pagamentos,
        funcionarios,
        data_conclusao: dataAjustada,
        products: produtosServicos,
      });

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
            <div className='inf-venda'>
              <label className="modal-field">
                Valor à Pagar R$: {saldoRestante}
              </label>
              <label className="modal-field">
                Total de Itens: {quantidadeItens}
              </label>
              {trocoDinheiro > '0' && (
                <label className="modal-field">
                  Troco R$: {trocoDinheiro}
                </label>
              )}
            </div>
            <div className="form-row">
              <fieldset className="inline-fieldset">
                <legend>Dados Cliente</legend>
                <div className="modal-field">
                  <input
                    name='cliente'
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Selecione um cliente na consulta"
                    disabled={!!cliente_id}
                  />
                </div>
              </fieldset>

              {tipo !== 'venda' && (<fieldset className="inline-fieldset">
                <legend>Funcionarios</legend>
                <div className="modal-field">
                  <ul>
                    {funcionarios.map((funcionario, index) => (
                      <li key={index}>{funcionario.funcionario_nome || funcionario.label}</li>
                    ))}
                  </ul>
                </div>
              </fieldset>)}
            </div>

            <div className="form-row">
              <fieldset>
                <legend>Serviços/Produtos:</legend>
                <div className="modal-field">
                  <table id="grid-padrao">
                    <thead>
                      <tr>
                        <th>Produto/Serviço</th>
                        <th>Valor Unitário</th>
                        <th>Quantidade</th>
                        <th>Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtosServicos.map((item, index) => (
                        <tr key={index}>
                          <td>{item.xProd}</td>
                          <td>{formatarMoedaBRL(item.valor_unitario)}</td>
                          <td>
                            {item.quantidade || 1}
                          </td>
                          <td>{formatarMoedaBRL(item.valorTotal || item.vlrVenda)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="total-label"><strong>Total Geral:</strong></td>
                        <td className="total-value"><strong>{formatarMoedaBRL(totalPrice)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </fieldset>
            </div>
            <div className="form-row">
              <fieldset>
                <legend>
                  Pagamentos:
                </legend>
                <div className="pagamentos">
                  <div className="conteudo-pagamentos">
                    {/* Coluna 1 */}
                    <div className="coluna-opcoes">
                      <div className="modal-field-pgto">
                        <label>Desconto: </label>
                        <input
                          type="text"
                          className='input-geral'
                          value={formatarMoedaBRL(desconto)}
                          onChange={handleDescontoChange}
                          placeholder="Digite o desconto"
                        />
                        <label>Valor:</label>
                        <input
                          type="text"
                          value={formatarMoedaBRL(novoValor)}
                          onChange={(e) => setNovoValor(formatarMoedaBRL(e.target.value))}
                          placeholder="Digite o valor"
                        />
                        <label>Forma de Pagamento:</label>
                        <input type="hidden" name="formaPgtoNome" value={formaPgtoNome} />
                        <select
                          value={novaForma}
                          onChange={(e) => {
                            setNovaForma(e.target.value); // Atualiza o ID da forma de pagamento
                            setFormaPgtoNome(e.target.options[e.target.selectedIndex].text); // Atualiza o nome
                          }}
                        >
                          <option value="">Selecione</option>
                          {formasPagamento.map((forma) => (
                            <option key={forma.id} value={forma.id}>
                              {forma.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button type="button" onClick={adicionarPagamento}>
                        Adicionar Pagamento
                      </button>
                    </div>
                    {/* Coluna 2 */}
                    <div className="coluna-pagamentos">
                      <div className="grid-pagamentos">
                        {pagamentos.map((p, index) => (
                          <div className="pagamento-item" key={index}>
                            <div className="pagamento-info">
                              <span className="pagamento-forma">{p.formaPgtoNome}</span>
                              <span className="pagamento-valor"> {formatarMoedaBRL(p.valor)}</span>
                            </div>
                            <button
                              type="button"
                              className="btn-remover"
                              onClick={() => removerPagamento(pagamentos, index, setPagamentos, setToast)}
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
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
      {toast.message && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
};

export default SaleModal;
