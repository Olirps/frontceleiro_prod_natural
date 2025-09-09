import React, { useEffect, useState } from 'react';
import { cpfCnpjMask, removeMaks } from '../components/utils';
import { getFormasPagamento, getEmpresaById } from '../services/api';
import { processTefPayment, cancelaTefPayment } from '../services/ApiTef/ApiTef';
import { registravenda } from '../services/ApiVendas/ApiVendas';
import { getClientes } from '../services/ApiClientes/ApiClientes';
import Toast from '../components/Toast';
import CadClienteSimpl from '../components/CadClienteSimpl';
import TefModal from '../components/TefModal';
import TefTransactionModal from '../components/TefTransactionModal';
import { converterMoedaParaNumero, formatarData, formatarMoedaBRL, converterData } from '../utils/functions';

const SaleModal = ({
  isOpen,
  onClose,
  onSuccess,
  totalQuantity,
  saleData,
  tipo,
  selectedProducts,
}) => {
  // Adicionado um if pois quando é via PDV não tem saleData
  if (!saleData) {
    saleData = { totalPrice: totalPrice };
  }


  const [cliente, setCliente] = useState(saleData.cliente_nome || saleData.cliente || '');
  const [cliente_id, setClienteID] = useState(saleData.cliente_id || '');
  const [desconto, setDesconto] = useState('0');
  let [valorPagamento, setValorPagamento] = useState(saleData.totalPrice || 0);
  const [valorTotal, setValorTotal] = useState(0);

  const [pagamentos, setPagamentos] = useState([]);
  const [novaForma, setNovaForma] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [formaPgtoNome, setFormaPgtoNome] = useState('');
  const [valorPagar, setValorPagar] = useState(saleData.totalPrice || 0);
  const [novoValor, setNovoValor] = useState(saleData.totalPrice || 0);
  const [totalPrice, setTotalPrice] = useState(saleData.totalPrice || 0);
  const [trocoDinheiro, settrocoDinheiro] = useState('');
  const [saldoRestante, setSaldoRestante] = useState(saleData.totalPrice || 0);
  const [descontoInput, setDescontoInput] = useState('0'); // valor digitado no input
  const [descontoTipo, setDescontoTipo] = useState(); // 'value' = R$, 'percent' = %
  const [descontoReal, setDescontoReal] = useState(true); // 'value' = R$, 'percent' = %
  const [descontoPercente, setDescontoPercente] = useState(false); // 'value' = R$, 'percent' = %
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [isConsultaClienteOpen, setIsConsultaClienteOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Variáveis para o TEF
  const [tefModalOpen, setTefModalOpen] = useState(false);
  const [pagamentoTef, setPagamentoTef] = useState(false);
  const [currentTefPayment, setCurrentTefPayment] = useState(null);
  const [tefProcessing, setTefProcessing] = useState(false);
  const [liberarFinalizacao, setLiberarFinalizacao] = useState(false);
  const [transacoesTef, setTransacoesTef] = useState([]);

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

    if (isOpen) {
      fetchFormasPagamento();
    }
  }, [isOpen]);

  useEffect(() => {
    if (tipo === 'liquidacao') {

      let total = 0;

      if (Array.isArray(saleData)) {
        // Se for array, soma valor_parcela de cada item
        total = saleData.reduce((acc, curr) => acc + parseFloat(curr.valor_parcela ?? 0), 0);

      } else if (saleData && typeof saleData === 'object') {
        // Se não for array, assume que é um objeto único
        total = parseFloat(saleData.totalPrice ?? 0);
      }
      setTotalPrice(total);
      setSaldoRestante(total);
      setValorTotal(total);
      setValorPagar(total);
      setValorPagamento(total);
      setNovoValor(total)
    } else {
      setValorTotal(parseFloat(saleData.totalPrice || 0));
      setValorPagamento(parseFloat(saleData.totalPrice || 0));
    }
  }, [saleData, tipo]);

  const buscarClientes = async (nome) => {
    try {
      const response = await getClientes({ nome });
      setFilteredClientes(response.data.clientes || []);
      setIsConsultaClienteOpen(true);

      if (response.data && response.data.length === 0) {
        setToast({
          message: 'Nenhum cliente encontrado com este nome',
          type: 'info',
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

  const selecionarCliente = (cliente) => {
    setCliente(cliente.nome);
    setClienteID(cliente.id);
    setIsConsultaClienteOpen(false);
  };

  const abrirModalCadastroCliente = () => {
    setIsModalOpen(true);
  };

  const fecharModalCadastroCliente = () => {
    setIsModalOpen(false);
  };

  const handleClienteCadastrado = (novoCliente) => {
    setCliente(novoCliente.nome);
    setClienteID(novoCliente.id);
    fecharModalCadastroCliente();
    setToast({ message: 'Cliente cadastrado com sucesso!', type: 'success' });
  };

  /*const saldoRestanteSemFormat =
    parseFloat(valorTotal) - (pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0) + parseFloat(converterMoedaParaNumero(desconto) || 0));

  let saldoRestante = saldoRestanteSemFormat.toFixed(2);

  if (saldoRestante < 0) {
    saldoRestante = 0;
  }*/


  const handleDescontoChange = (e) => {
    let rawValue;
    if (descontoPercente) {
      rawValue = (e.target.value);
      if (rawValue.includes(',')) {
        rawValue = rawValue.replace(',', '.');
      }
    } else {
      rawValue = converterMoedaParaNumero(e.target.value);
    }

    let valorDesconto = formatarMoedaBRL(rawValue)
    valorDesconto = Number(converterMoedaParaNumero(valorDesconto))
    if (descontoPercente) {
      if (rawValue > 100) rawValue = 100;
      // remover zeros à esquerda somente se NÃO tiver ponto decimal
      if (!String(rawValue).includes('.') && String(rawValue).length > 1 && String(rawValue).startsWith('0')) {
        rawValue = String(rawValue).replace(/^0+/, '');
        if (rawValue === '') rawValue = '0';
      }
      const descontoCalculado = (totalPrice * rawValue) / 100;
      setDesconto(formatarMoedaBRL(String(descontoCalculado.toFixed(2))));
      setDescontoInput(String(rawValue));
      //setDescontoInput(String(rawValue));
      const novoValorAtual = valorTotal - pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0) - descontoCalculado;
      setSaldoRestante(novoValorAtual < 0 ? '0.00' : novoValorAtual.toFixed(2));
      setValorPagar(novoValorAtual < 0 ? '0.00' : novoValorAtual.toFixed(2));

      return;
    } else {
      const novoValorAtual = valorTotal - pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0) - valorDesconto;
      setSaldoRestante(novoValorAtual < 0 ? '0.00' : novoValorAtual.toFixed(2));
      setValorPagar(novoValorAtual < 0 ? '0.00' : novoValorAtual.toFixed(2));
      setDescontoInput(formatarMoedaBRL(String(rawValue)));
      setDesconto(formatarMoedaBRL(String(rawValue)));
      return;
    }
  };

  useEffect(() => {
    if (novaForma === 'dinheiro') {
      const valorNum = parseFloat(novoValor.replace(',', '.')) || 0;
      const troco = valorNum - novoValor;
      settrocoDinheiro(troco > 0 ? troco.toFixed(2) : '0.00');
    }
  }, [novaForma, novoValor]);

  const handleTefPayment = async (paymentData) => {
    try {
      setTefProcessing(true);
      setMensagem('Pagamento');
      const response = await processTefPayment(paymentData);

      if (response.success) {
        // Adiciona o token retornado ao array de transações TEF        
        setTransacoesTef(prev => [
          ...prev,
          response.data.controlPayResponse.intencaoVenda.token
        ]);

        // Atualiza paymentData com o token
        paymentData.token = response.data.controlPayResponse.intencaoVenda.token;

        // Atualiza pagamentos de uma vez só, incluindo todas as informações necessárias
        setPagamentos(prev => [...prev, {
          forma: paymentData.novaForma,
          valor: paymentData.valorPagarNum,
          formaPgtoNome: paymentData.formaPgtoNome,
          token: response.data.controlPayResponse.intencaoVenda.token,
          // inclua outras propriedades do paymentData que sejam relevantes
          ...paymentData
        }]);

        // Se ainda precisar do array simplificado para outra finalidade
        const pagamentosAtualizados = [...pagamentos, {
          forma: paymentData.novaForma,
          valor: paymentData.valorPagarNum,
          formaPgtoNome: paymentData.formaPgtoNome,
          token: response.data.controlPayResponse.intencaoVenda.token // ← adiciona o token aqui também
        }];


        const novoSaldo = saldoRestante - pagamentosAtualizados.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
        setNovoValor(novoSaldo < 0 ? '0.00' : novoSaldo.toFixed(2));
        setSaldoRestante(novoSaldo < 0 ? '0.00' : novoSaldo.toFixed(2));
        setValorPagar(novoSaldo < 0 ? '0.00' : novoSaldo.toFixed(2));
        setPagamentoTef(true);

        if (novoSaldo <= 0) {
          setLiberarFinalizacao(true);
          setValorPagar('0.00');
        } else {
          setValorPagar(novoSaldo.toFixed(2));
        }
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
      setMensagem('');
    }
  };

  const adicionarPagamento = () => {
    let valorNum = 0;

    if (String(saldoRestante).startsWith("R$")) {
      valorNum = converterMoedaParaNumero(saldoRestante);
    } else {
      valorNum = Number(saldoRestante);
    }

    valorNum = Number(valorNum);

    if (!formaPgtoNome || isNaN(valorNum) || valorNum <= 0) {
      setToast({
        message: "Forma de pagamento inválida ou valor inválido.",
        type: "error",
      });
      return;
    }
    const novoValorNum = parseFloat(saldoRestante.toString().replace(',', '.'));
    let valorPagarNum = 0;

    if (String(valorPagar).startsWith("R$")) {
      valorPagarNum = converterMoedaParaNumero(valorPagar);
    } else {
      valorPagarNum = Number(valorPagar);
    }

    if (valorPagarNum > novoValorNum && formaPgtoNome !== "Dinheiro") {
      setToast({
        message: "Valor não pode ser maior que o saldo restante.",
        type: "error",
      });
      return;
    }


    const isTefPayment = formaPgtoNome.includes("TEF");
    if (isTefPayment) {
      handleTefPayment({ novaForma, valorPagarNum, formaPgtoNome });
      return;
    }

    // tratamento do troco
    if (formaPgtoNome === "Dinheiro" && valorPagar > saldoRestante) {
      const troco = valorPagarNum - saldoRestante;
      valorPagarNum = saldoRestante;
      settrocoDinheiro((troco).toFixed(2));
      valorNum = saldoRestante;
    }

    if (novaForma == 8 && cliente_id == "") {
      setToast({
        message: "Selecione um cliente para pagamento a Prazo.",
        type: "error",
      });
      return;
    }

    const novoPagamento = {
      forma: novaForma,
      valor: valorPagarNum,
      formaPgtoNome,
    };

    const pagamentosAtualizados = [...pagamentos, novoPagamento];
    setPagamentos(pagamentosAtualizados);
    setNovaForma("");

    const novoSaldo =
      saldoRestante -
      pagamentosAtualizados.reduce(
        (sum, p) => sum + parseFloat(p.valor || 0),
        0
      );

    if (novoSaldo <= 0) {
      setLiberarFinalizacao(true);
      setValorPagar('0.00');
    } else {
      setValorPagar(novoSaldo.toFixed(2));
    }
    setSaldoRestante(novoSaldo < 0 ? '0.00' : novoSaldo.toFixed(2));
  };


  const handleSubmitSale = async (e) => {
    e.preventDefault();
    setLoading(true);
    let dataHoje = new Date().toLocaleString().replace(',', '');
    let dataAjustada = converterData(dataHoje)
    const clearDesconto = converterMoedaParaNumero(desconto);
    if (loading) return; // Evita múltiplos cliques

    if (saldoRestante > 0) {
      setToast({ message: 'O pagamento não foi completado.', type: 'error' });
      setLoading(false); // Desativa o carregamento ao mostrar alerta

      if (!formaPgtoNome) {
        alert('Selecione uma forma de pagamento.');
        setLoading(false); // Desativa o carregamento ao mostrar alerta
        return;
      }

      return;
    }
    try {
      const username = localStorage.getItem('username');
      const empresa = await getEmpresaById(1);

      const registra_venda = {
        totalQuantity: totalQuantity,
        totalPrice: clearDesconto > 0 ? (totalPrice - clearDesconto) : totalPrice,
        products: selectedProducts ? selectedProducts : saleData.produtos,
        cliente: cliente,
        cliente_id: cliente_id,
        desconto: clearDesconto,
        pagamentos: pagamentos,
        status: 0,
        status_id: 2,
        preVenda: saleData.venda_id ? saleData.venda_id : null,
        dataVenda: dataAjustada,
        tipoVenda: 'Venda',
        login: username,
        empresa: empresa.data,
        transacoesTef: transacoesTef
      };

      await registravenda(registra_venda);
      setToast({ message: "Venda cadastrada com sucesso!", type: "success" });
      onClose();
      onSuccess();
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao cadastrar Venda.";
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setLoading(false);

    }
  };

  const removerPagamento = async (
    pagamentos,
    index,
    setPagamentos,
    setToast
  ) => {
    const pagamento = pagamentos[index];
    const confirmar = window.confirm(
      `Deseja remover o pagamento de R$ ${pagamento.valor} feito com ${pagamento.forma}?`
    );

    if (!confirmar) return;

    try {
      // 🔹 Se for TEF, chama endpoint para cancelar
      if (
        (pagamento.forma === "9" ||
          pagamento.forma === "10" ||
          pagamento.forma === "12") &&
        typeof cancelaTefPayment === "function"
      ) {
        setTefProcessing(true); // indica que está processando TEF
        setMensagem('Cancelando');
        await cancelaTefPayment({ intencaoVendaId: pagamento.token });
        setToast({ message: 'Pagamento TEF cancelado com sucesso.', type: 'success' });
      }

      // 🔹 Remove do array local
      const novosPagamentos = pagamentos.filter((_, i) => i !== index);
      setPagamentos(novosPagamentos);

      // 🔹 Verifica se ainda existe algum TEF
      const existeTef = novosPagamentos.some(
        (p) => p.forma === "9" || p.forma === "10" || p.forma === "12"
      );
      if (!existeTef) setPagamentoTef(false);

      // 🔹 Atualiza saldo
      const totalPagamentos = novosPagamentos.reduce(
        (sum, p) => sum + parseFloat(p.valor || 0),
        0
      );
      const descontoValor = parseFloat(converterMoedaParaNumero(desconto) || 0);
      const novoSaldo = valorTotal - totalPagamentos - descontoValor;

      setNovoValor(novoSaldo < 0 ? '0.00' : novoSaldo.toFixed(2));
      settrocoDinheiro(novoSaldo < 0 ? (-novoSaldo).toFixed(2) : '0.00');
      setSaldoRestante(novoSaldo < 0 ? '0.00' : novoSaldo.toFixed(2));
      setValorPagar(novoSaldo < 0 ? '0.00' : novoSaldo.toFixed(2));
      // 🔹 Feedback geral para pagamentos não TEF
      if (!["9", "10", "12"].includes(pagamento.forma)) {
        setToast({ message: 'Pagamento removido com sucesso.', type: 'success' });
      }

    } catch (error) {
      console.error("Erro ao remover pagamento:", error);
      setToast({ message: 'Erro ao remover pagamento TEF.', type: 'error' });
    } finally {
      setTefProcessing(false); // sempre desativa o estado de processamento
      setMensagem('');
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">

        {/* Cabeçalho */}
        <div className="flex justify-between items-center border-b px-3 py-2">
          <h2 className="text-lg font-semibold text-gray-800">Finalizar Pagamento</h2>
          <button
            onClick={onClose}
            disabled={pagamentoTef}
            className="text-gray-500 hover:text-gray-800 disabled:opacity-50"
          >
            ✖
          </button>
        </div>


        {/* Conteúdo */}
        <form id="saleForm" onSubmit={handleSubmitSale} className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Coluna Esquerda */}
            <div className="space-y-6 flex flex-col">

              {/* Cliente compacto */}
              {tipo !== 'liquidacao' && (
                <div className="border border-gray-200 rounded-xl p-3 shadow-sm bg-gray-50">
                  <h3 className="text-md font-semibold text-gray-700 mb-2">Cliente</h3>

                  <input
                    name="cliente"
                    type="text"
                    value={cliente}
                    onChange={(e) => {
                      setCliente(e.target.value);
                      if (e.target.value.length > 2) buscarClientes(e.target.value);
                      else { setFilteredClientes([]); setIsConsultaClienteOpen(false); }
                    }}
                    placeholder="Digite o nome"
                    disabled={!!cliente_id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={abrirModalCadastroCliente}
                      disabled={!!cliente_id}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                    >
                      Cadastrar
                    </button>
                    {cliente_id && (
                      <button
                        type="button"
                        onClick={() => { setCliente(''); setClienteID(''); setFilteredClientes([]); setIsConsultaClienteOpen(false); }}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  {isConsultaClienteOpen && filteredClientes.length > 0 && (
                    <ul className="mt-2 border border-gray-200 rounded-lg max-h-32 overflow-y-auto divide-y divide-gray-200 bg-white">
                      {filteredClientes.map((cli) => (
                        <li
                          key={cli.id}
                          onClick={() => selecionarCliente(cli)}
                          className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                        >
                          {cli.nome} - {cli.cpfCnpj ? cpfCnpjMask(cli.cpfCnpj) : 'Sem CPF/CNPJ'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Adicionar Pagamento */}
              <div className="border border-gray-200 rounded-xl p-4 shadow-sm flex-1">
                <h3 className="text-md font-semibold text-gray-700 mb-3">Adicionar Pagamento</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de desconto */}
                  <div>
                    <div className="flex items-center gap-4 mb-1">
                      <label className="text-sm font-medium text-gray-700">Desconto</label>
                      <div className="flex gap-2 text-sm text-gray-600">
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="descontoTipo"
                            checked={descontoReal}
                            onChange={() => {
                              setDescontoReal(true);
                              setDescontoPercente(false);
                              setDescontoInput("0");
                              setNovoValor(totalPrice);
                            }}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          R$
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="descontoTipo"
                            checked={descontoPercente}
                            onChange={() => {
                              setDescontoReal(false);
                              setDescontoPercente(true);
                              setDescontoInput("0");
                              setNovoValor(totalPrice);
                            }}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          %
                        </label>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={descontoReal ? formatarMoedaBRL(descontoInput) : descontoInput}
                      onChange={handleDescontoChange}
                      placeholder={descontoReal ? "R$ 0,00" : "0%"}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                    <input
                      type="text"
                      value={formatarMoedaBRL(valorPagar)}
                      onChange={(e) => {
                        const valorNumerico = e.target.value.replace(/\D/g, "");
                        setValorPagar(Number(valorNumerico) / 100);
                      }}
                      placeholder="Digite o valor"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                  <select
                    value={novaForma}
                    onChange={(e) => {
                      setNovaForma(e.target.value);
                      setFormaPgtoNome(e.target.options[e.target.selectedIndex].text);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {formasPagamento.map((forma) => (
                      <option key={forma.id} value={forma.id}>{forma.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Botão Adicionar */}
                <button
                  type="button"
                  onClick={adicionarPagamento}
                  disabled={!novaForma || !novoValor || parseFloat(novoValor) <= 0}
                  className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  ➕ Adicionar
                </button>
              </div>

            </div>

            {/* Coluna Direita */}
            <div className="space-y-6 flex flex-col">
              {/* Lista de Pagamentos */}
              <div className="border border-gray-200 rounded-xl p-4 shadow-sm max-h-60 overflow-y-auto">
                <h3 className="text-md font-semibold text-gray-700 mb-3">Pagamentos</h3>

                {pagamentos.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    Nenhum pagamento adicionado
                  </div>
                ) : (
                  pagamentos.map((p, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-3 gap-2 items-center py-2 border-b text-sm"
                    >
                      <span className="font-medium">{p.formaPgtoNome}</span>
                      <span>{formatarMoedaBRL(p.valor)}</span>
                      <button
                        type="button"
                        onClick={() =>
                          removerPagamento(pagamentos, index, setPagamentos, setToast)
                        }
                        className="text-red-600 hover:text-red-800 justify-self-center"
                      >
                        ❌
                      </button>
                    </div>
                  ))
                )}
              </div>
              {/* Resumo */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 shadow-inner">
                <div className="flex justify-between text-sm"><span>Total:</span><span>{formatarMoedaBRL(totalPrice)}</span></div>
                <div className="flex justify-between text-sm"><span>Desconto:</span><span className="text-red-600">- {formatarMoedaBRL(desconto)}</span></div>
                <div className="flex justify-between text-sm"><span>Total Pago:</span><span>{formatarMoedaBRL(pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0))}</span></div>
                <div className="flex justify-between text-base font-semibold border-t pt-2">
                  <span>Saldo:</span>
                  <span className={saldoRestante > 0 ? 'text-orange-600' : 'text-green-600'}>
                    {formatarMoedaBRL(saldoRestante)}
                  </span>
                </div>
                {trocoDinheiro > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Troco:</span>
                    <span className="text-green-600">{formatarMoedaBRL(trocoDinheiro)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Ações */}
        <div className="border-t px-6 py-4 flex justify-end gap-4">
          <button
            type="submit"
            form="saleForm"
            disabled={loading || !liberarFinalizacao}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex justify-center items-center gap-2"
          >
            {loading ? 'Processando...' : 'Confirmar Venda'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={pagamentoTef}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Modais auxiliares */}
      <CadClienteSimpl isOpen={isModalOpen} onClose={fecharModalCadastroCliente} onSuccess={handleClienteCadastrado} />
      <TefModal isOpen={tefModalOpen} onClose={() => setTefModalOpen(false)} onConfirm={() => handleTefPayment(currentTefPayment)} paymentData={currentTefPayment} isProcessing={tefProcessing} isFullPayment={currentTefPayment?.valor >= novoValor} />
      <TefTransactionModal
        isOpen={tefProcessing}
        mensagem={mensagem || "Pagamento"}
        tempoTotalSegundos={90}
      />
      {toast.message && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
};

export default SaleModal;