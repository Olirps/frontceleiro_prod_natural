import React, { useState, useEffect } from 'react';
import { getResumoAteData, getSaldoPorProduto, getProdutosEstoque } from '../services/api';
import Pagination from '../utils/Pagination';
import { gerarPDFRelatorioEstoque } from '../relatorios/gerarPDFRelatorioEstoque';
import Toast from '../components/Toast';


const RelatorioSaldoEstoquePage = () => {
    const dataAtual = () => {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    };
    const [data, setData] = useState('');
    const [dataImpressao, setDataImpressao] = useState('');
    const [loading, setLoading] = useState(false);
    const [tipoRelatorio, setTipoRelatorio] = useState('saldo'); // 'resumo', 'saldo', 'estoque'
    const [nomeProduto, setNomeProduto] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [relatorio, setRelatorio] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [executarBusca, setExecutarBusca] = useState(false);


    useEffect(() => {
        setRelatorio([]);
        setCurrentPage(1);
        setData(dataAtual());
        setDataImpressao('');
        setNomeProduto('');
    }, [tipoRelatorio]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        if (executarBusca) {
            fetchRelatorio();
        }
    }, [currentPage, rowsPerPage, executarBusca]);



    const fetchRelatorio = async () => {
        if (!data && tipoRelatorio === 'resumo') return;

        try {
            setLoading(true);
            setDataImpressao(data);
            let response;

            if (tipoRelatorio === 'resumo') {
                response = await getResumoAteData(data, currentPage, rowsPerPage);
            } else if (tipoRelatorio === 'saldo') {
                response = await getSaldoPorProduto(data, nomeProduto.trim(), currentPage, rowsPerPage);
            } else if (tipoRelatorio === 'estoque') {
                response = await getProdutosEstoque(data, currentPage, rowsPerPage);
            }

            const { dados, totalPaginas, totalRegistros } = response.data;

            if (dados.length === 0) {
                setToast({ message: 'Nenhum resultado encontrado.', type: 'warning' });
                setRelatorio([]);
                setTotalPages(1);
            } else {
                setToast({ message: 'Relatório gerado com sucesso.', type: 'success' });
                setRelatorio(dados);
                setTotalPages(totalPaginas);
            }
        } catch (error) {
            setToast({ message: 'Erro ao Buscar os dados', type: 'warning' });
            console.error('Erro ao buscar relatório:', error);
        } finally {
            setLoading(false);
            setExecutarBusca(false); // desliga flag
        }
    };

    const fetchRelatorioCompleto = async () => {
        try {
            let response;

            if (tipoRelatorio === 'saldo') {
                response = await getSaldoPorProduto(data, nomeProduto, 1, 0); // limit 0 = sem paginação
            } else if (tipoRelatorio === 'resumo') {
                response = await getResumoAteData(data, 1, 0);
            } else if (tipoRelatorio === 'estoque') {
                response = await getProdutosEstoque(1, 0);
            }

            const { dados } = response.data;

            gerarPDFRelatorioEstoque({
                tipoRelatorio,
                dataImpressao,
                relatorio: dados,
                nomeProduto
            });

        } catch (error) {
            setToast({ message: 'Erro ao gerar PDF', type: 'warning' });
            console.error('Erro ao buscar dados completos para PDF:', error);
        }
    };

    // const totalPages = Math.ceil(relatorioCompleto.length / rowsPerPage);

    return (
        <div className="p-6">
            <h1 className='title-page'>Relatório de Saldo de Estoque</h1>

            <div id="search-container">
                <div id="search-fields">
                    <select
                        className="border p-2 rounded"
                        value={tipoRelatorio}
                        onChange={(e) => setTipoRelatorio(e.target.value)}
                    >
                        <option value="resumo">Resumo até data</option>
                        <option value="saldo">Saldo por Produto</option>
                        <option value="estoque">Produtos em Estoque</option>
                    </select>
                    {tipoRelatorio === 'saldo' && (
                        <>
                            <div>
                                <input
                                    type="text"
                                    className="border p-2 rounded"
                                    placeholder="Nome do produto"
                                    value={nomeProduto}
                                    onChange={(e) => setNomeProduto(e.target.value)}
                                />
                            </div>
                            <div>
                                <input
                                    type="date"
                                    className="border p-2 rounded"
                                    value={data}
                                    onChange={(e) => setData(e.target.value)}
                                />
                            </div>
                        </>

                    )}

                    {tipoRelatorio === 'resumo' && (
                        <input
                            type="date"
                            className="border p-2 rounded"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                        />
                    )}
                </div>
                <div id="button-group">
                    <button
                        className="button"
                        onClick={() => {
                            setCurrentPage(1);
                            setExecutarBusca(true); // sinaliza que deve buscar
                        }}
                        disabled={!data || loading}
                    >
                        {loading ? 'Carregando...' : 'Buscar'}
                    </button>

                    {relatorio.length > 0 && (
                        <button
                            className="button"
                            onClick={fetchRelatorioCompleto}
                        >
                            Exportar PDF
                        </button>
                    )}
                </div>
            </div>
            <div id="separator-bar"></div>
            {loading ? (
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>) : (
                <>
                    <div id="results-container">
                        <div id="grid-padrao-container">
                            <table id="grid-padrao">
                                <thead>
                                    <tr className="bg-gray-200 text-left">
                                        {tipoRelatorio === 'resumo' && (
                                            <>
                                                <th className="p-2 border">Produto</th>
                                                <th className="p-2 border">Entradas</th>
                                                <th className="p-2 border">Saídas</th>
                                                <th className="p-2 border">Saldo</th>
                                            </>
                                        )}
                                        {tipoRelatorio === 'saldo' && (
                                            <>
                                                <th className="p-2 border">Produto</th>
                                                <th className="p-2 border">Entradas</th>
                                                <th className="p-2 border">Saídas</th>
                                                <th className="p-2 border">Saldo Atual</th>
                                            </>
                                        )}
                                        {tipoRelatorio === 'estoque' && (
                                            <>
                                                <th className="p-2 border">Produto</th>
                                                <th className="p-2 border">Unidade</th>
                                                <th className="p-2 border">Estoque Atual</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {relatorio.map((item, index) => (
                                        <tr key={index} className="border-t">
                                            {tipoRelatorio === 'resumo' && (
                                                <>
                                                    <td className="p-2 border">{item.nome_produto}</td>
                                                    <td className="p-2 border">{item.entradas_ate_data}</td>
                                                    <td className="p-2 border">{item.saidas_ate_data}</td>
                                                    <td className="p-2 border">{item.saldo_ate_data}</td>
                                                </>
                                            )}
                                            {tipoRelatorio === 'saldo' && (
                                                <>
                                                    <td className="p-2 border">{item.nome_produto}</td>
                                                    <td className="p-2 border">{item.entradas_ate_data}</td>
                                                    <td className="p-2 border">{item.saidas_ate_data}</td>
                                                    <td className="p-2 border">{item.saldo}</td>
                                                </>
                                            )}
                                            {tipoRelatorio === 'estoque' && (
                                                <>
                                                    <td className="p-2 border">{item.nome_produto}</td>
                                                    <td className="p-2 border">{item.unidade}</td>
                                                    <td className="p-2 border">{item.saldo_movimentado}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {relatorio.length > 0 && (
                                <div className="mt-4">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={(page) => {
                                            setExecutarBusca(true); // sinaliza que deve buscar
                                            setCurrentPage(page); // só atualiza o estado
                                        }}
                                        onRowsChange={(rows) => {
                                            setRowsPerPage(rows);
                                            setCurrentPage(1); // resetar para primeira página ao mudar limite
                                            setExecutarBusca(true); // sinaliza que deve buscar
                                        }}
                                        rowsPerPage={rowsPerPage}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
            {toast.message && <Toast type={toast.type} message={toast.message} />}
        </div>

    );
};

export default RelatorioSaldoEstoquePage;
