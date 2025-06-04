import React, { useEffect, useState } from 'react';
import { getLancamentosAReceber, getClientes, registraPagamento } from '../services/api';
import Toast from '../components/Toast';
import SaleModal from '../components/SaleModal';
import { converterData } from '../utils/functions'; // Funções para formatar valores

export default function ModalPagamentosUnificados({ isOpen, onClose }) {
    const [clientes, setClientes] = useState([]);
    const [clienteSelecionado, setClienteSelecionado] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [lancamentos, setLancamentos] = useState([]);
    const [selecionados, setSelecionados] = useState([]);
    const [selecionadosFull, setSelecionadosFull] = useState([]);
    const [filtroCliente, setFiltroCliente] = useState('');
    const debouncedFiltroCliente = useDebounce(filtroCliente, 500);
    const [clienteSelecionadoManualmente, setClienteSelecionadoManualmente] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });


    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        const buscarClientes = async () => {
            if (clienteSelecionadoManualmente) return;

            // Se o filtro for vazio, limpar lista e não buscar nada
            if (!debouncedFiltroCliente || debouncedFiltroCliente.trim().length === 0 || !filtroCliente) {
                setClientes([]);
                return;
            }
            // Se o filtro for menor que 3 caracteres, não buscar
            if (debouncedFiltroCliente.length < 3) {
                setClientes([]);
                return;
            }

            try {
                const { data } = await getClientes({ nome: debouncedFiltroCliente });
                if (data.length > 0) {
                    setClientes(data);
                } else {
                    setClientes([]);
                    setToast({ message: 'Nenhum cliente encontrado', type: 'info' });
                }
            } catch (error) {
                console.error('Erro ao buscar clientes:', error);
            }
        };

        buscarClientes();
    }, [debouncedFiltroCliente, clienteSelecionadoManualmente]);




    function useDebounce(value, delay) {
        const [debouncedValue, setDebouncedValue] = useState(value);

        useEffect(() => {
            const handler = setTimeout(() => setDebouncedValue(value), delay);
            return () => clearTimeout(handler);
        }, [value, delay]);

        return debouncedValue;
    }

    const handleInputChange = (e) => {
        const value = e.target.value;
        if (value.trim() === '') {
            setClientes([]);
        }

        setFiltroCliente(value);

        // Quando o valor é apagado ou for menor que 3, reseta os dados
        if (value.trim().length < 3) {
            setClientes([]);
            setClienteSelecionado('');
            setClienteSelecionadoManualmente(false);
        } else {
            // Se estiver digitando novamente, libera nova busca
            setClienteSelecionado('');
            setClienteSelecionadoManualmente(false);
        }
    };


    const buscarLancamentos = async () => {
        if (!clienteSelecionado || !dataInicio || !dataFim) {
            setToast({ message: 'Preencha todos os campos obrigatórios.', type: 'error' });
            return;
        }

        try {
            setLoading(true);

            const filtros = {
                cliente_id: clienteSelecionado,
                dataInicio,
                dataFim,
            };

            const { data } = await getLancamentosAReceber(filtros);
            if (data.length > 0) {
                setLancamentos(data);
                setSelecionados(data.map(l => l.id));
                setSelecionadosFull(data); // Armazena os objetos completos

            } else {
                setLancamentos([]);
                setToast({ message: 'Nenhum lançamento encontrado', type: 'info' });
            }
        } catch (error) {
            console.error('Erro ao buscar lançamentos:', error);
            setToast({ message: 'Erro ao buscar lançamentos.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleLiquidarSelecionados = async (dadosPagamento) => {
        if (dadosPagamento.length === 0) {
            setToast({ message: 'Nenhum lançamento selecionado.', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            let dataHoje = new Date().toLocaleString().replace(',', '');
            let dataAjustada = converterData(dataHoje);
            dadosPagamento.dataVenda = dataAjustada;
            dadosPagamento.movimenta = selecionadosFull
            // Aqui você deve implementar a lógica para liquidar os lançamentos selecionados
            // Por exemplo, enviar uma requisição para o backend com os IDs selecionados
            // await liquidarLancamentos(selecionados);
            await registraPagamento(dadosPagamento);

            setToast({ message: 'Lançamentos liquidados com sucesso!', type: 'success' });
            setLancamentos(prev => prev.filter(l => !selecionados.includes(l.id)));
            setSelecionados([]);
        } catch (error) {
            console.error('Erro ao liquidar lançamentos:', error);
            setToast({ message: 'Erro ao liquidar lançamentos.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    const totalSelecionado = selecionadosFull.reduce(
        (acc, curr) => acc + parseFloat(curr.valor_parcela), 0
    );


    const toggleSelecionado = (id) => {
        setSelecionadosFull(prev => {
            const jaSelecionado = prev.some(s => s.id === id);
            if (jaSelecionado) {
                return prev.filter(s => s.id !== id);
            } else {
                const lancamento = lancamentos.find(l => l.id === id);
                return lancamento ? [...prev, lancamento] : prev;
            }
        });
    };

    const toggleTodos = () => {
        if (selecionadosFull.length === lancamentos.length) {
            setSelecionadosFull([]);
        } else {
            setSelecionadosFull(lancamentos);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-4xl p-6 rounded shadow-lg overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Pagamentos Unificados</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-black">&times;</button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="relative">
                            <label className="text-sm block mb-1">Cliente:</label>
                            <input
                                type="text"
                                placeholder="Digite ao menos 3 letras..."
                                className="w-full border rounded p-2"
                                value={filtroCliente}
                                onChange={handleInputChange}
                            />
                            {clientes.length > 0 && (
                                <ul className="absolute z-10 bg-white border rounded w-full max-h-40 overflow-y-auto mt-1">
                                    {clientes.map(cliente => (
                                        <li
                                            key={cliente.id}
                                            onClick={() => {
                                                setClienteSelecionado(cliente.id.toString());
                                                setFiltroCliente(cliente.nome);
                                                setClienteSelecionadoManualmente(true);
                                                setClientes([]); // esconde a lista
                                            }}
                                            className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                                        >
                                            {cliente.nome}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div>
                            <label className="text-sm block mb-1">Data Início:</label>
                            <input
                                type="date"
                                className="w-full border rounded p-2"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm block mb-1">Data Fim:</label>
                            <input
                                type="date"
                                className="w-full border rounded p-2"
                                value={dataFim}
                                onChange={(e) => setDataFim(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            onClick={buscarLancamentos}
                            disabled={loading}
                        >
                            {loading ? 'Buscando Lançamentos...' : 'Buscar'}
                        </button>
                    </div>

                    {lancamentos.length > 0 && (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Débitos encontrados</h3>
                                <button
                                    className="border px-3 py-1 rounded"
                                    onClick={toggleTodos}
                                >
                                    {selecionadosFull.length === lancamentos.length ? 'Desmarcar todos' : 'Marcar todos'}
                                </button>
                            </div>

                            <div className="border rounded overflow-y-auto max-h-96">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="p-2">#</th>
                                            <th className="p-2 text-left">Descrição</th>
                                            <th className="p-2 text-center">Vencimento</th>
                                            <th className="p-2 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lancamentos.map((l) => (
                                            <tr key={l.id} className="border-t">
                                                <td className="p-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selecionadosFull.some(s => s.id === l.id)}
                                                        onChange={() => toggleSelecionado(l.id)}
                                                    />
                                                </td>
                                                <td className="p-2">{l.financeiro?.descricao || 'Sem descrição'}</td>
                                                <td className="p-2 text-center">
                                                    {new Date(l.vencimento).toLocaleDateString()}
                                                </td>
                                                <td className="p-2 text-right">
                                                    R$ {parseFloat(l.valor_parcela).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-2">
                                <div className="text-right font-semibold text-lg text-gray-700">
                                    Total Selecionado: R$ {totalSelecionado.toFixed(2)}
                                </div>
                                <button
                                    disabled={selecionadosFull.length === 0}
                                    className={`px-4 py-2 rounded text-white ${selecionadosFull.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                    onClick={() => setIsSaleModalOpen(true)}
                                >
                                    Liquidar Selecionados ({selecionadosFull.length})
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {isSaleModalOpen && (
                <SaleModal
                    isOpen={isSaleModalOpen}
                    onSubmit={handleLiquidarSelecionados}
                    tipo={"liquidacao"}
                    saleData={selecionadosFull}
                    onClose={() => setIsSaleModalOpen(false)}
                />
            )}
            {toast.message && <Toast type={toast.type} message={toast.message} />}
        </div>
    );
}
