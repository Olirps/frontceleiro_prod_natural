import { useState, useEffect, useCallback, useMemo } from 'react';
import { getFormasPagamento } from '../../../services/api';
import { getVendas } from '../../../services/ApiVendas/ApiVendas';

export function useVendasData(filters) {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagamentosDetalhados, setPagamentosDetalhados] = useState([]);
  const [pagamentosComTransacoes, setPagamentosComTransacoes] = useState([]);
  const [filteredPagamentos, setFilteredPagamentos] = useState([]);
  const [tiposPagamento, setTiposPagamento] = useState([]);
  const [somarLancamentosManuais, setSomarLancamentosManuais] = useState(false);

  const processVendasData = (data) => {
    return data.flatMap((venda) => {
      let valorPago = 0;
      let descontoTotal = 0;

      if (venda.formasPagamento) {
        venda.formasPagamento.forEach(pagamento => {
          if (pagamento.formaPagamento.toLowerCase() === 'desconto') {
            descontoTotal += parseFloat(pagamento.vlrPago);
          } else {
            valorPago += parseFloat(pagamento.vlrPago);
          }
        });
      } else {
        valorPago += parseFloat(venda.valor || 0);
      }

      return {
        vendaId: venda.id,
        clienteId: venda.cliente || null,
        cliente: venda.clienteNome || venda.descricao || 'Não Informado',
        dataVenda: venda.data,
        tipo: venda.tipo,
        valorPago,
        descontoTotal
      };
    });
  };

  const fetchVendas = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      let response;

      // Limpar parâmetros vazios
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
      );

      // Converter datas se existirem
      if (cleanParams.dataInicio) {
        cleanParams.dataInicio = new Date(cleanParams.dataInicio).toISOString().split('T')[0] + ' 00:00:00';
      }
      if (cleanParams.dataFim) {
        cleanParams.dataFim = new Date(cleanParams.dataFim).toISOString().split('T')[0] + ' 23:59:59';
      }

      if (Object.keys(cleanParams).length > 0) {
        response = await getVendas(cleanParams);
      } else {
        response = await getVendas();
      }

      const responseTipos = await getFormasPagamento();
      const data = response.data.transacoes;
      const tiposVenda = [{ id: 0, nome: 'Desconto' }, ...responseTipos.data];

      const pagamentos = processVendasData(data);

      setPagamentosDetalhados(pagamentos);
      setFilteredPagamentos(pagamentos);
      setVendas(response.data);
      setPagamentosComTransacoes(data);
      setTiposPagamento(tiposVenda);
    } catch (err) {
      console.error('Erro ao buscar Vendas', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cálculo de totais
  const totalPreco = useMemo(() => {
    return filteredPagamentos
      .filter(venda => venda.tipo === "Venda" || (somarLancamentosManuais && venda.tipo !== "Venda"))
      .reduce((sum, venda) => sum + (Number(venda.valorPago) || 0), 0);
  }, [filteredPagamentos, somarLancamentosManuais]);

  const totalDescontos = useMemo(() => {
    return filteredPagamentos
      .filter(venda => venda.tipo === "Venda" || (somarLancamentosManuais && venda.tipo !== "Venda"))
      .reduce((sum, venda) => sum + Math.abs(Number(venda.descontoTotal) || 0), 0);
  }, [filteredPagamentos, somarLancamentosManuais]);

  return {
    vendasData: {
      vendas,
      pagamentosDetalhados,
      pagamentosComTransacoes,
      filteredPagamentos,
      tiposPagamento,
      totalPages: Math.ceil(filteredPagamentos.length / filters?.rowsPerPage || 10),
      pagamentosPaginaAtual: filteredPagamentos.slice(
        ((filters?.currentPage || 1) - 1) * (filters?.rowsPerPage || 10),
        (filters?.currentPage || 1) * (filters?.rowsPerPage || 10)
      )
    },
    loading,
    fetchVendas,
    totalPreco,
    totalDescontos,
    somarLancamentosManuais,
    setSomarLancamentosManuais
  };
}