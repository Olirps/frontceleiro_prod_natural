import React, { useState, useEffect } from 'react';
import { getEmpresaById } from '../services/api';
import { getProdutosSold } from '../services/ApiProdutos/ApiProdutos';
import { formatarData, formatarMoedaBRL } from '../utils/functions';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Pagination from '../utils/Pagination';
import { use } from 'react';
import Toast from '../components/Toast';


const ProdutosVendidos = () => {
    const [produtosVendidos, setProdutosVendidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalQuantidade, setTotalQuantidade] = useState('');
    const [totalValor, setTotalValor] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [produtosFiltrados, setProdutosFiltrados] = useState([]);
    const [filtroProduto, setFiltroProduto] = useState('');
    const [analitico, setAnalitico] = useState(true);
    const [linhasPorPagina, setLinhasPorPagina] = useState(50);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [empresa, setEmpresa] = useState(null);
    const [agruparSintetico, setAgruparSintetico] = useState(false);
    const [executarBusca, setExecutarBusca] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });




    useEffect(() => {
        if (executarBusca) {
            fetchProdutosVendidos();
            setExecutarBusca(false); // Impede reexecução desnecessária
            setProdutosVendidos([]);
            setProdutosFiltrados([]);

            setLoading(true);
            setError(null);
            setTotalQuantidade('');
            setTotalValor('');
        }
    }, [executarBusca, paginaAtual, linhasPorPagina]);

    useEffect(() => {
        setProdutosFiltrados([]);
        setTotalValor(0);
        setTotalQuantidade(0);

    }, [filtroProduto, dataInicio, dataFim, analitico, agruparSintetico]);


    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);


    const limparFiltros = () => {
        setDataInicio('');
        setDataFim('');
        setFiltroProduto('');
        setProdutosFiltrados(produtosVendidos);
    };

    const fetchProdutosVendidos = async () => {
        try {
            const filtros = {
                xProd: filtroProduto.trim() || undefined,
                dataInicio: dataInicio || undefined,
                dataFim: dataFim || undefined,
                tipo: analitico ? 'analitico' : 'sintetico',
                page: Number(paginaAtual),
                limit: Number(linhasPorPagina)
            };

            const data = await getProdutosSold(filtros);
            setTotalValor(data.totalVendas || 0);
            setTotalQuantidade(data.totalProdutos || 0);
            setTotalPaginas(data.totalPages)
            setLoading(false);
            setError(null);
            setProdutosVendidos(data.items || []);
            setProdutosFiltrados(data.items || []);
            if (data.items.length === 0) {
                setToast({ message: "Nenhum produto encontrado para os filtros aplicados.", type: "info" });
            }else{
                setToast({ message: "Produtos vendidos carregados com sucesso!", type: "success" });
            }

            // Buscar informações da empresa (substitua 1 pelo ID correto da empresa)
            const dataEmpresa = await getEmpresaById(1); // Substitua 1 pelo ID da empresa
            setEmpresa(dataEmpresa.data);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const gerarPDF = () => {
        const doc = new jsPDF();
        let startY = 20; // Posição inicial do conteúdo
        // Adicionar cabeçalho com informações da empresa
        if (empresa) {
            doc.setFontSize(14);
            doc.text(`Empresa: ${empresa.nome}`, 14, startY);
            startY += 10;
            doc.setFontSize(12);
            doc.text(`Endereço: ${empresa.logradouro}, ${empresa.bairro}`, 14, startY);
            startY += 10;
            doc.text(`Período: ${dataInicio ? formatarData(dataInicio) : 'Início'} a ${dataFim ? formatarData(dataFim) : 'Fim'}`, 14, 52);
            startY += 20;

        }

        if (analitico) {
            // Agrupar por produto
            const produtosAgrupados = {};
            let totalGeralQuantidade = 0;
            let totalGeralValor = 0;

            // Gerar tabela para cada produto
            Object.keys(produtosAgrupados).forEach((produtoId) => {
                const produto = produtosAgrupados[produtoId];

                // Título do produto
                doc.setFontSize(12);
                doc.text(`ID Produto: ${produtoId} - ${produto.produto}`, 14, startY);
                startY += 10;

                // Cabeçalho da tabela
                const headers = [['ID', 'Produto', 'Quantidade', 'Valor Total', 'Data Venda']];
                const body = produto.vendas.map((venda) => [
                    produtoId,
                    produto.produto,
                    venda.quantidade,
                    formatarMoedaBRL(venda.valorTotal),
                    venda.dataVenda
                ]);

                // Adicionar linha de total do produto
                body.push([
                    'Total',
                    '',
                    produto.quantidadeTotal.toFixed(3),
                    formatarMoedaBRL(produto.valorTotal),
                    ''
                ]);

                // Gerar tabela
                doc.autoTable({
                    startY: startY,
                    head: headers,
                    body: body,
                    theme: 'grid',
                    styles: { fontSize: 10 },
                    headStyles: {
                        fillColor: [0, 123, 255], // Cor de fundo do cabeçalho (azul)
                        textColor: [255, 255, 255], // Cor do texto do cabeçalho (branco)
                        fontStyle: 'bold', // Texto em negrito
                    },
                    columnStyles: {
                        0: { cellWidth: 20 }, // ID Produto
                        1: { cellWidth: 50 }, // Produto
                        2: { cellWidth: 30 }, // Quantidade
                        3: { cellWidth: 30 }, // Valor Total
                        4: { cellWidth: 30 } // Data Venda
                    }
                });

                // Atualizar a posição Y para o próximo produto
                startY = doc.autoTable.previous.finalY + 10;
            });

            // Adicionar total geral
            doc.setFontSize(12);
            doc.text(`Total Geral: Quantidade: ${totalGeralQuantidade.toFixed(3)} | Valor Total: ${formatarMoedaBRL(totalGeralValor)}`, 14, startY);
        } else if (agruparSintetico) {
            // Lógica de agrupamento sintético
            const produtosAgrupados = {};
            let totalGeralQuantidade = 0;
            let totalGeralValor = 0;

            produtosFiltrados.forEach((item) => {
                item.produtos.forEach((produto) => {
                    if (!produtosAgrupados[produto.produto_id]) {
                        produtosAgrupados[produto.produto_id] = {
                            produto: produto.xProd,
                            quantidadeTotal: 0,
                            valorTotal: 0
                        };
                    }
                    const valorTotalVenda = produto.vlrVenda;
                    produtosAgrupados[produto.produto_id].quantidadeTotal = (Number(produtosAgrupados[produto.produto_id].quantidadeTotal) + Number(produto.quantity));
                    produtosAgrupados[produto.produto_id].valorTotal = Number(Number(produtosAgrupados[produto.produto_id].valorTotal) + Number(valorTotalVenda)).toFixed(2);

                    // Soma geral
                    totalGeralQuantidade += Number(produto.quantity);
                    totalGeralValor = Number(Number(totalGeralValor) + Number(valorTotalVenda)).toFixed(2);
                });
            });

            // Gerar tabela para cada produto
            const headers = [['ID Produto', 'Produto', 'Quantidade Total', 'Valor Total']];
            const body = Object.keys(produtosAgrupados).map((produtoId) => [
                produtoId,
                produtosAgrupados[produtoId].produto,
                produtosAgrupados[produtoId].quantidadeTotal.toFixed(3),
                formatarMoedaBRL(produtosAgrupados[produtoId].valorTotal)
            ]);

            // Adicionar linha de total geral
            body.push([
                'Total Geral',
                '',
                totalGeralQuantidade.toFixed(3),
                formatarMoedaBRL(totalGeralValor)
            ]);

            // Gerar tabela
            doc.autoTable({
                startY: startY,
                head: headers,
                body: body,
                theme: 'grid',
                styles: { fontSize: 10 },
                headStyles: {
                    fillColor: [0, 123, 255], // Cor de fundo do cabeçalho (azul)
                    textColor: [255, 255, 255], // Cor do texto do cabeçalho (branco)
                    fontStyle: 'bold', // Texto em negrito
                },
                columnStyles: {
                    0: { cellWidth: 20 }, // ID Produto
                    1: { cellWidth: 50 }, // Produto
                    2: { cellWidth: 30 }, // Quantidade Total
                    3: { cellWidth: 30 } // Valor Total
                }
            });
        }
        else {
            // Visualização padrão
            let totalGeralQuantidade = 0;
            let totalGeralValor = 0;

            const body = produtosFiltrados.flatMap((item) =>
                item.produtos.map((produto) => {
                    const valorTotalVenda = Number(produto.vlrVenda).toFixed(2);
                    totalGeralQuantidade += Number(produto.quantity);
                    totalGeralValor = Number(Number(totalGeralValor) + Number(valorTotalVenda)).toFixed(2);

                    return [
                        produto.produto_id,
                        produto.xProd,
                        produto.quantity,
                        formatarMoedaBRL(valorTotalVenda),
                        formatarData(item.venda.dataVenda)
                    ];
                })
            );

            // Adicionar linha de total
            body.push([
                'Total',
                '',
                totalGeralQuantidade.toFixed(3),
                formatarMoedaBRL(totalGeralValor),
                ''
            ]);

            doc.autoTable({
                startY: startY,
                head: [['ID', 'Produto', 'Quantidade', 'Valor Total', 'Data Venda']],
                body: body,
                theme: 'grid',
                styles: { fontSize: 10 },
                headStyles: {
                    fillColor: [0, 123, 255], // Cor de fundo do cabeçalho (azul)
                    textColor: [255, 255, 255], // Cor do texto do cabeçalho (branco)
                    fontStyle: 'bold', // Texto em negrito
                },
                columnStyles: {
                    0: { cellWidth: 20 }, // ID Produto
                    1: { cellWidth: 50 }, // Produto
                    2: { cellWidth: 30 }, // Quantidade
                    3: { cellWidth: 30 }, // Valor Total
                    4: { cellWidth: 30 } // Data Venda
                }
            });
        }

        doc.save('produtos_vendidos.pdf');
    };
    const handleChangePage = (newPage) => {
        setPaginaAtual(newPage);
        setExecutarBusca(true); // Garante que o useEffect dispare
    };


    const handleChangeRowsPerPage = (newRowsPerPage) => {
        setLinhasPorPagina(newRowsPerPage);
        setPaginaAtual(1);  // Reseta para a primeira página
        setExecutarBusca(true); // Garante que o useEffect dispare
    };
    // Calcular o número total de páginas
    const produtosNivelados = produtosFiltrados.flatMap(item =>
        (item.produtos || []).map(produto => ({
            ...produto,
            dataVenda: item.venda?.dataVenda // Adiciona a dataVenda em cada produto
        }))
    );

    const produtosAgrupadosSintetico = produtosNivelados.reduce((acc, produto) => {
        if (!acc[produto.produto_id]) {
            acc[produto.produto_id] = {
                produto: produto.xProd,
                quantidadeTotal: 0,
                dataVenda: produto.dataVenda,
                valorTotal: 0
            };
        }
        acc[produto.produto_id].quantidadeTotal = Number(Number(produto.quantity) + Number(acc[produto.produto_id].quantidadeTotal)).toFixed(3);
        acc[produto.produto_id].valorTotal = Number(Number(produto.vlrVenda) + Number(acc[produto.produto_id].valorTotal)).toFixed(2);
        return acc;
    }, {});

    const produtosExibidos = agruparSintetico ? Object.keys(produtosAgrupadosSintetico).map(produtoId => ({
        produto_id: produtoId,
        xProd: produtosAgrupadosSintetico[produtoId].produto,
        quantity: produtosAgrupadosSintetico[produtoId].quantidadeTotal,
        vlrVenda: produtosAgrupadosSintetico[produtoId].valorTotal,
        dataVenda: produtosAgrupadosSintetico[produtoId].dataVenda
    })) : produtosNivelados;


    if (loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }
    if (error) {
        return <div>Erro: {error}</div>;
    }

    return (
        <div>
            <h1 className="title-page">Produtos Vendidos</h1>
            <div className="bg-white p-4 rounded-lg shadow mb-4 space-y-4">
                {/* Campos de filtro */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data de Início</label>
                        <input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            className="input input-bordered w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data de Fim</label>
                        <input
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            className="input input-bordered w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Produto</label>
                        <input
                            type="text"
                            placeholder="Digite o nome ou ID do produto"
                            value={filtroProduto}
                            onChange={(e) => setFiltroProduto(e.target.value)}
                            className="input input-bordered w-full"
                        />
                    </div>
                </div>

                {/* Botões de ação */}
                <div className="flex items-end space-x-2">
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                        onClick={() => {
                            setPaginaAtual(1);
                            setExecutarBusca(true);
                        }}
                    >
                        Filtrar
                    </button>
                    <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={limparFiltros}>
                        Limpar
                    </button>
                    <button className="bg-blue-300 text-white px-4 py-2 rounded" onClick={gerarPDF}>
                        Gerar PDF
                    </button>
                </div>

                {/* Opções de visualização */}
                <div className="flex flex-wrap gap-4 items-center">
                    <label className="flex items-center space-x-2">
                        <input
                            type="radio"
                            value="agrupado"
                            checked={analitico && !agruparSintetico}
                            onChange={() => {
                                setAnalitico(true);
                                setAgruparSintetico(false);
                            }}
                        />
                        <span>Analítico</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input
                            type="radio"
                            value="sintetico"
                            checked={agruparSintetico}
                            onChange={() => {
                                setAnalitico(false);
                                setAgruparSintetico(true);
                            }}
                        />
                        <span>Sintético</span>
                    </label>
                </div>
            </div>
            <div id="separator-bar"></div>
            <div id="results-container">
                <div id="grid-padrao-container">
                    <table className="w-full border border-gray-300 rounded-md shadow-sm mt-4 text-sm">
                        {analitico ? (
                            <>
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 border">ID Produto</th>
                                        <th className="p-2 border">Produto</th>
                                        <th className="p-2 border">Medida</th>
                                        <th className="p-2 border">Quantidade</th>
                                        <th className="p-2 border">Valor</th>
                                        <th className="p-2 border">Data Venda</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {produtosFiltrados.map((produto) => (
                                        <tr key={produto.id} className="hover:bg-gray-50">
                                            <td className="p-2 border">{produto.id}</td>
                                            <td className="p-2 border">{produto.xProd}</td>
                                            <td className="p-2 border">{produto.unidade}</td>
                                            <td className="p-2 border">{produto.quantity}</td>
                                            <td className="p-2 border">{formatarMoedaBRL(produto.vlrVenda)}</td>
                                            <td className="p-2 border">{produto.dataVenda}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-100 font-semibold">
                                        <td className="p-2 border" colSpan="3">Total</td>
                                        <td className="p-2 border">{new Intl.NumberFormat('pt-BR').format(totalQuantidade)}</td>
                                        <td className="p-2 border">{formatarMoedaBRL(totalValor)}</td>
                                    </tr>
                                </tfoot>
                            </>
                        ) : (
                            <>
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 border">ID Produto</th>
                                        <th className="p-2 border">Produto</th>
                                        <th className="p-2 border">Medida</th>
                                        <th className="p-2 border">Quantidade Total</th>
                                        <th className="p-2 border">Valor Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {produtosFiltrados.map((produto) => (
                                        <tr key={produto.id} className="hover:bg-gray-50">
                                            <td className="p-2 border">{produto.id}</td>
                                            <td className="p-2 border">{produto.xProd}</td>
                                            <td className="p-2 border">{produto.unidade}</td>
                                            <td className="p-2 border">{produto.quantity}</td>
                                            <td className="p-2 border">{formatarMoedaBRL(produto.vlrTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-100 font-semibold">
                                        <td className="p-2 border" colSpan="2">Total</td>
                                        <td className="p-2 border">{new Intl.NumberFormat('pt-BR').format(totalQuantidade)}</td>
                                        <td className="p-2 border">{formatarMoedaBRL(totalValor)}</td>
                                    </tr>
                                </tfoot>
                            </>
                        )}

                    </table>

                </div>
                {toast.message && <Toast type={toast.type} message={toast.message} />}
                {produtosVendidos && produtosVendidos.length > 0 && (
                    <div className="mt-4">
                        {/* Paginação */}
                        <Pagination
                            currentPage={paginaAtual}
                            totalPages={totalPaginas}
                            onPageChange={handleChangePage}
                            onRowsChange={handleChangeRowsPerPage}
                            rowsPerPage={linhasPorPagina}
                            rowsPerPageOptions={[50, 100, 150]}
                        />
                    </div>
                )}
            </div>
        </div >
    );
}

export default ProdutosVendidos;