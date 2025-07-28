import React, { useEffect, useState } from 'react';
import { formatarMoedaBRL } from '../utils/functions';
import { getFluxoCaixa } from '../services/ApiRelatorios/ApiFinanceiro';
import { getFormasPagamento } from '../services/api';
import Pagination from '../utils/Pagination';
import Toast from '../components/Toast';


const FluxoCaixaPage = () => {
  const getDataHoje = () => {
    const hoje = new Date();
    hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset()); // ajusta para timezone local
    return hoje.toISOString().slice(0, 10);
  };
  const [dados, setDados] = useState([]);
  const [modoExibicao, setModoExibicao] = useState('analitico');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [linhasPorPagina, setLinhasPorPagina] = useState(50);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [agrupamento, setAgrupamento] = useState('dia');
  const [loading, setLoading] = useState(true);



  // Filtros
  const [dataInicial, setDataInicial] = useState(getDataHoje());
  const [dataFinal, setDataFinal] = useState(getDataHoje());
  const [descricaoFiltro, setDescricaoFiltro] = useState('');
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [formaId, setFormaId] = useState('');
  const [formaPgtoNome, setFormaPgtoNome] = useState('');
  const [saldoEntrada, setSaldoEntrada] = useState('');
  const [saldoSaida, setSaldoSaida] = useState('');
  const [saldoFinal, setSaldoFinal] = useState('');
  const [apenasRecebidos, setApenasRecebidos] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`; // ex: '2025-07'
  });



  // Limpar resultados sempre que qualquer filtro for alterado
  useEffect(() => {
    setDados([]);
    setTotalPaginas(1);
    setSaldoEntrada(0);
    setSaldoSaida(0);
    setSaldoFinal(0);
    if (modoExibicao === 'analitico') {
      setAgrupamento('dia')
      setDataInicial(getDataHoje());
      setDataFinal(getDataHoje())
    }
  }, [dataInicial, dataFinal, formaId, apenasRecebidos, modoExibicao]);

  useEffect(() => {
    carregarDados();
    fetchFormasPagamento();
  }, [paginaAtual, linhasPorPagina]);

  useEffect(() => {
    if (modoExibicao === 'sintetico') {
      ajustarPeriodoAgrupamento();
    }
  }, [agrupamento, modoExibicao]);

  const handleChangeRowsPerPage = (newRowsPerPage) => {
    setLinhasPorPagina(newRowsPerPage);
    setPaginaAtual(1);  // Reseta para a primeira página
  };
  const fetchFormasPagamento = async () => {
    try {
      const response = await getFormasPagamento();
      // Adiciona Crédito e Débito manualmente
      const formasComExtras = [
        ...response.data,
        { id: 'credito', nome: 'Crédito (Manual)' },
        { id: 'debito', nome: 'Débito (Manual)' }
      ];

      setFormasPagamento(formasComExtras);
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento:', error);
      setToast({ message: 'Erro ao carregar formas de pagamento', type: 'error' });
    }
  };

  // Ajuste inicial para dataInicial e dataFinal conforme agrupamento
  const getMesAtual = () => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  };

  const getAnoAtual = () => {
    return new Date().getFullYear().toString();
  };

  const carregarDados = async () => {
    setLoading(true); // Inicia o loading no início da requisição

    try {
      const response = await getFluxoCaixa({
        page: paginaAtual,
        limit: linhasPorPagina,
        dataInicial,
        dataFinal,
        formaId,
        apenasRecebidos,
        agrupamento: modoExibicao === 'sintetico' ? agrupamento : null,
      });

      // Atualiza os estados com os dados da resposta
      setDados(response.data || []);
      setTotalPaginas(response.totalPages || 1);
      setSaldoEntrada(response.resumo?.entrada || 0);
      setSaldoSaida(response.resumo?.saida || 0);
      setSaldoFinal(response.resumo?.saldo || 0);

    } catch (error) {
      console.error('Erro ao carregar dados do fluxo de caixa:', error);

      // Você pode adicionar tratamento específico para diferentes tipos de erro
      if (error instanceof Error) {
        // Exibir mensagem de erro para o usuário (ex: usando um toast/notification)
        // toast.error(`Erro: ${error.message}`);
      }

      // Resetar estados em caso de erro (opcional)
      setDados([]);
      setTotalPaginas(1);
      setSaldoEntrada(0);
      setSaldoSaida(0);
      setSaldoFinal(0);

    } finally {
      setLoading(false); // Garante que o loading seja desativado independente de sucesso/erro
    }
  };
  const ajustarPeriodoAgrupamento = () => {
    const hoje = new Date();
    let inicio, fim;

    switch (agrupamento) {
      case 'semana': {
        const diaSemana = hoje.getDay(); // 0 (Domingo) a 6 (Sábado)
        const diffSegunda = hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
        inicio = new Date(hoje.setDate(diffSegunda));
        fim = new Date(inicio);
        fim.setDate(inicio.getDate() + 6);

        const formatarData = (d) => d.toISOString().slice(0, 10);
        setDataInicial(formatarData(inicio));
        setDataFinal(formatarData(fim));
        break;
      }

      case 'mes': {
        const mesAtual = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
        if (!dataInicial || dataInicial.length > 7) {
          setDataInicial(mesAtual);
        }
        if (!dataFinal || dataFinal.length > 7) {
          setDataFinal(mesAtual);
        }
        break;
      }
      case 'semestral':
        setDataInicial((prev) => (prev.length === 7 ? prev : getMesAtual()));
        setDataFinal((prev) => (prev.length === 7 ? prev : getMesAtual()));
        break;
      case 'anual':
        setDataInicial((prev) => (prev.length === 4 ? prev : getAnoAtual()));
        setDataFinal((prev) => (prev.length === 4 ? prev : getAnoAtual()));
        break;


      default: {
        const hojeFormatado = hoje.toISOString().slice(0, 10);
        setDataInicial(hojeFormatado);
        setDataFinal(hojeFormatado);
        break;
      }
    }
  };


  return (
    <div className="p-4">
      {/* Título e Controles Superiores */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-xl font-bold">Fluxo de Caixa</h1>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Botões de Exibição */}
          <div className="flex items-center">
            <label className="text-sm font-medium mr-2">Exibição:</label>
            <div className="flex space-x-1">
              <button
                onClick={() => setModoExibicao('analitico')}
                className={`px-3 py-1 text-sm rounded-md ${modoExibicao === 'analitico' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Analítico
              </button>
              <button
                onClick={() => setModoExibicao('sintetico')}
                className={`px-3 py-1 text-sm rounded-md ${modoExibicao === 'sintetico' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Sintético
              </button>
            </div>
          </div>

          {/* Botão de Imprimir */}
          <button
            onClick={() => window.print()}
            className="bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1 rounded-md flex items-center"
          >

            Imprimir
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Datas */}
        <div>
          <label className="block text-sm font-medium mb-1">Data Inicial</label>
          <input
            type={
              agrupamento === 'mes' || agrupamento === 'semestral'
                ? 'month'
                : agrupamento === 'anual'
                  ? 'number'
                  : 'date'
            }
            value={dataInicial}
            onChange={(e) => {
              let val = e.target.value;
              if (agrupamento === 'anual') {
                if (/^\d{0,4}$/.test(val)) setDataInicial(val);
              } else {
                setDataInicial(val);
              }
            }}
            min={agrupamento === 'anual' ? '2000' : undefined}
            max={agrupamento === 'anual' ? '2100' : undefined}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data Final</label>
          <input
            type={
              agrupamento === 'mes' || agrupamento === 'semestral'
                ? 'month'
                : agrupamento === 'anual'
                  ? 'number'
                  : 'date'
            }
            value={dataFinal}
            onChange={(e) => {
              let val = e.target.value;
              if (agrupamento === 'anual') {
                if (/^\d{0,4}$/.test(val)) setDataFinal(val);
              } else {
                setDataFinal(val);
              }
            }}
            min={agrupamento === 'anual' ? '2000' : undefined}
            max={agrupamento === 'anual' ? '2100' : undefined}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {/* Tipo Recebimento */}
        <div>
          <label className="block text-sm font-medium mb-1">Tipo Recebimento</label>
          <select
            className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
            value={formaId}
            onChange={(e) => {
              setFormaId(e.target.value);
              setFormaPgtoNome(e.target.options[e.target.selectedIndex].text);
            }}
          >
            <option value="">Todas as formas</option>
            {formasPagamento.map((forma) => (
              <option key={forma.id} value={forma.id}>
                {forma.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Agrupamento (apenas sintético) */}
        {modoExibicao === 'sintetico' && (
          <div>
            <label className="block text-sm font-medium mb-1">Agrupar por</label>
            <select
              value={agrupamento}
              onChange={(e) => setAgrupamento(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
            >
              <option value="dia">Dia</option>
              <option value="semana">Semana</option>
              <option value="mes">Mês</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
        )}

        {/* Checkbox e Botão de Filtrar */}
        <div className="flex items-end gap-4">
          <div className="flex items-center h-full">
            <input
              id="checkbox-recebidos"
              type="checkbox"
              checked={apenasRecebidos}
              onChange={(e) => setApenasRecebidos(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
            />
            <label htmlFor="checkbox-recebidos" className="text-sm font-medium">Apenas Recebidos</label>
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setPaginaAtual(1);
              carregarDados();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md w-full text-sm"
          >
            Filtrar
          </button>
        </div>
      </div>
      <div>
        <input invisible />
      </div>
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 text-green-800 p-4 rounded-lg shadow-sm">
          <h2 className="font-semibold text-sm">Entradas</h2>
          <p className="text-xl font-bold">{formatarMoedaBRL(saldoEntrada) || 'R$ 0,00'}</p>
        </div>
        <div className="bg-red-50 border border-red-100 text-red-800 p-4 rounded-lg shadow-sm">
          <h2 className="font-semibold text-sm">Saídas</h2>
          <p className="text-xl font-bold">{formatarMoedaBRL(saldoSaida) || 'R$ 0,00'}</p>
        </div>
        <div className={`border ${saldoFinal >= 0 ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-yellow-50 border-yellow-100 text-yellow-800'} p-4 rounded-lg shadow-sm`}>
          <h2 className="font-semibold text-sm">Saldo Final</h2>
          <p className="text-xl font-bold">{formatarMoedaBRL(saldoFinal) || 'R$ 0,00'}</p>
        </div>
      </div>

      <div id="separator-bar"></div>
      {/* Tabela */}
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) :
        (<div className="overflow-x-auto shadow rounded mt-6">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="py-2 px-4">Data</th>
                <th className="py-2 px-4">Tipo Recebimento</th>
                <th className="py-2 px-4">Tipo</th>
                <th className="py-2 px-4">Valor</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4 capitalize">
                    {agrupamento === 'mes' || agrupamento === 'semestral' ? (
                      agrupamento === 'mes' ? (
                        new Date(item.data_movimento + '-01T12:00:00').toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric',
                        })
                      ) : (
                        (() => {
                          // Semestral, ex: "2025-1" ou "2025-2"
                          const [ano, semestre] = item.data_movimento.split('-');
                          const nomeSemestre = semestre === '1' ? '1º Semestre' : '2º Semestre';
                          return `${nomeSemestre} de ${ano}`;
                        })()
                      )
                    ) : agrupamento === 'anual' ? (
                      `${item.data_movimento}` // Ex: "2025"
                    ) : agrupamento === 'semana' ? (
                      (() => {
                        // Converte número tipo 202530 em ano + semana ISO
                        const dataMov = item.data_movimento.toString();
                        const ano = parseInt(dataMov.substring(0, 4), 10);
                        const semana = parseInt(dataMov.substring(4), 10);

                        function getDateOfISOWeek(w, y) {
                          const simple = new Date(y, 0, 1 + (w - 1) * 7);
                          const dow = simple.getDay();
                          const ISOweekStart = simple;
                          if (dow <= 4) {
                            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
                          } else {
                            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
                          }
                          return ISOweekStart;
                        }

                        const inicioSemana = getDateOfISOWeek(semana, ano);
                        const fimSemana = new Date(inicioSemana);
                        fimSemana.setDate(inicioSemana.getDate() + 6);

                        const formatar = (data) =>
                          data.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          });

                        return `${formatar(inicioSemana)} a ${formatar(fimSemana)}`;
                      })()
                    ) : (
                      // Para analítico (datas completas com horário)
                      (() => {
                        // Para dados agrupados por dia (formato YYYY-MM-DD)
                        if (modoExibicao === 'sintetico' && agrupamento === 'dia') {
                          // Adiciona meio-dia UTC para evitar problemas de fuso horário
                          const dateObj = new Date(`${item.data_movimento}T12:00:00Z`);
                          return dateObj.toLocaleDateString('pt-BR');
                        }
                        // Converte string "2025-07-05 11:33:24" para Date local
                        // Adiciona 'T' para criar formato ISO completo
                        const dataISO = item.data_movimento.replace(' ', 'T');
                        return new Date(dataISO).toLocaleDateString('pt-BR');
                      })()
                    )}
                  </td>
                  <td className="py-2 px-4">{item.descricao}</td>
                  <td className="py-2 px-4 capitalize">{item.origem === 'lancamento' ? 'Manual' : item.origem}</td>
                  <td className="py-2 px-4">{formatarMoedaBRL(item.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>)}

      {/* Paginação */}

      <Pagination
        currentPage={paginaAtual}
        totalPages={totalPaginas}
        onPageChange={setPaginaAtual}
        onRowsChange={handleChangeRowsPerPage}  // Alterado para usar função personalizada
        rowsPerPage={linhasPorPagina}
        rowsPerPageOptions={[50, 100, 150]}
      />

    </div>
  );
};

export default FluxoCaixaPage;
