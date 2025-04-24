import React, { useState, useEffect } from 'react';
import { getProdutosVendidos, getEmpresaById } from '../services/api';
import { formatarData, formatarMoedaBRL } from '../utils/functions';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function ProdutosVendidos() {
    const [produtosVendidos, setProdutosVendidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [produtosFiltrados, setProdutosFiltrados] = useState([]);
    const [filtroProduto, setFiltroProduto] = useState('');
    const [agruparPorProduto, setAgruparPorProduto] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [empresa, setEmpresa] = useState(null);
    const [agruparSintetico, setAgruparSintetico] = useState(false);



    useEffect(() => {
        async function fetchProdutosVendidos() {
            try {
                const data = await getProdutosVendidos();
                setProdutosVendidos(data.data || []);
                setProdutosFiltrados(data.data || []);

                // Buscar informações da empresa (substitua 1 pelo ID correto da empresa)
                const dataEmpresa = await getEmpresaById(1); // Substitua 1 pelo ID da empresa
                setEmpresa(dataEmpresa.data);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchProdutosVendidos();
    }, []);

    const aplicarFiltro = () => {
        setLoading(true);
        const produtosFiltrados = produtosVendidos
            .map((item) => {
                const dataVenda = new Date(item.venda.dataVenda);
                const inicio = dataInicio ? new Date(dataInicio) : null;
                const fim = dataFim ? new Date(dataFim + 'T23:59:59') : null;
                const filtroData = (!inicio || dataVenda >= inicio) && (!fim || dataVenda <= fim);
                if (!filtroData) return null;
                const produtosFiltradosNaVenda = item.produtos.filter((produto) => (
                    !filtroProduto ||
                    produto.produto_id.toString().includes(filtroProduto) ||
                    (produto.xProd && produto.xProd.toLowerCase().includes(filtroProduto.trim().toLowerCase()))
                ));
                if (produtosFiltradosNaVenda.length === 0) return null;
                return { ...item, produtos: produtosFiltradosNaVenda };
            })
            .filter((item) => item !== null);
        setProdutosFiltrados(produtosFiltrados);
        setLoading(false);
    };

    const limparFiltros = () => {
        setDataInicio('');
        setDataFim('');
        setFiltroProduto('');
        setProdutosFiltrados(produtosVendidos);
    };

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

        if (agruparPorProduto) {
            // Agrupar por produto
            const produtosAgrupados = {};
            let totalGeralQuantidade = 0;
            let totalGeralValor = 0;

            produtosFiltrados.forEach((item) => {
                item.produtos.forEach((produto) => {
                    if (!produtosAgrupados[produto.produto_id]) {
                        produtosAgrupados[produto.produto_id] = {
                            produto: produto.xProd,
                            vendas: [],
                            quantidadeTotal: 0,
                            valorTotal: 0
                        };
                    }
                    const valorTotalVenda = produto.vlrVenda;
                    produtosAgrupados[produto.produto_id].vendas.push({
                        dataVenda: formatarData(item.venda.dataVenda),
                        quantidade: Number(produto.quantity).toFixed(3),
                        valorTotal: valorTotalVenda
                    });
                    produtosAgrupados[produto.produto_id].quantidadeTotal = (Number(produtosAgrupados[produto.produto_id].quantidadeTotal) + Number(produto.quantity));
                    produtosAgrupados[produto.produto_id].valorTotal = Number(Number(produtosAgrupados[produto.produto_id].valorTotal) + Number(valorTotalVenda)).toFixed(2);

                    // Soma geral
                    totalGeralQuantidade += Number(produto.quantity);
                    totalGeralValor = Number(Number(totalGeralValor) + Number(valorTotalVenda)).toFixed(2);
                });
            });

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

    const handleRowsChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1); // Resetar para a primeira página ao alterar o número de linhas
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
                dataVenda:produto.dataVenda,
                valorTotal: 0
            };
        }
        acc[produto.produto_id].quantidadeTotal = Number(Number(produto.quantity) + Number(acc[produto.produto_id].quantidadeTotal)).toFixed(3);
        acc[produto.produto_id].valorTotal = Number(Number(produto.vlrVenda) +  Number(acc[produto.produto_id].valorTotal)).toFixed(2);
        return acc;
    }, {});

    const produtosExibidos = agruparSintetico ? Object.keys(produtosAgrupadosSintetico).map(produtoId => ({
        produto_id: produtoId,
        xProd: produtosAgrupadosSintetico[produtoId].produto,
        quantity: produtosAgrupadosSintetico[produtoId].quantidadeTotal,
        vlrVenda: produtosAgrupadosSintetico[produtoId].valorTotal,
        dataVenda: produtosAgrupadosSintetico[produtoId].dataVenda
    })) : produtosNivelados;

    const totalPages = Math.ceil(produtosExibidos.length / rowsPerPage);

    // Obter os produtos da página atual
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentProdutos = produtosExibidos.slice(startIndex, endIndex);


    const calcularTotais = () => {
        let totalQuantidade = 0;
        let totalValor = 0;

        produtosFiltrados.forEach((item) => {
            item.produtos.forEach((produto) => {
                totalQuantidade += Number(produto.quantity);
                totalValor += Number(produto.vlrVenda);
            });
        });

        return { totalQuantidade, totalValor };
    };

    const { totalQuantidade, totalValor } = calcularTotais();


    if (loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }
    if (error) {
        return <div>Erro: {error}</div>;
    }

    return (
        <div>
            <h1 className="title-page">Produtos Vendidos</h1>
            <div id="search-container">
                <div id="search-fields">
                    <label>Data de Início:
                        <input className='input-geral' type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                    </label>
                    <label>Data de Fim:
                        <input className='input-geral' type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                    </label>
                    <label>Produto:
                        <input className='input-geral' type="text" placeholder="Digite o nome ou ID do produto" value={filtroProduto} onChange={(e) => setFiltroProduto(e.target.value)} />
                    </label>
                </div>
                <div id='button-group'>
                    <button className="button" onClick={aplicarFiltro}>Filtrar</button>
                    <button className="button" onClick={limparFiltros}>Limpar</button>
                    <button className="button" onClick={gerarPDF}>Gerar PDF</button>
                </div>
                <div id="radio-group">
                    <label>
                        <input
                            type="radio"
                            value="padrao"
                            checked={!agruparPorProduto && !agruparSintetico}
                            onChange={() => {
                                setAgruparPorProduto(false);
                                setAgruparSintetico(false);
                            }}
                        />
                        Visualização Padrão
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="agrupado"
                            checked={agruparPorProduto && !agruparSintetico}
                            onChange={() => {
                                setAgruparPorProduto(true);
                                setAgruparSintetico(false);
                            }}
                        />
                        Agrupar por Produto
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="sintetico"
                            checked={agruparSintetico}
                            onChange={() => {
                                setAgruparPorProduto(false);
                                setAgruparSintetico(true);
                            }}
                        />
                        Agrupado Sintético
                    </label>
                </div>
            </div>
            <div id="separator-bar"></div>
            <div id="results-container">
                <div id="grid-padrao-container">
                    <table id="grid-padrao">
                        <thead>
                            <tr>
                                <th>ID Produto</th>
                                <th>Produto</th>
                                <th>Valor do Produto</th>
                                <th>Quantidade</th>
                                <th>Data da Venda</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                currentProdutos.map((produto) => (
                                    <tr key={produto.id}>
                                        <td>{produto.produto_id}</td>
                                        <td>{produto.xProd}</td>
                                        <td>{formatarMoedaBRL(produto.vlrVenda)}</td>
                                        <td>{produto.quantity}</td>
                                        <td>{formatarData(produto.dataVenda)}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="3"><strong>Total</strong></td>
                                <td><strong>{totalQuantidade.toFixed(3)}</strong></td>
                                <td><strong>{formatarMoedaBRL(totalValor.toFixed(2))}</strong></td>
                            </tr>
                        </tfoot>
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
        </div>
    );
}

export default ProdutosVendidos;