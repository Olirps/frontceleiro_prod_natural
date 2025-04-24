import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getVinculosProdutoVeiculo } from '../services/api';
import { formatarDataResumida } from '../utils/functions';
import '../styles/MovimentacaoProdutos.css';

const MovimentacaoProdutos = () => {
    const [vinculos, setVinculos] = useState([]);
    const [filtroProduto, setFiltroProduto] = useState('');
    const [filtroVeiculo, setFiltroVeiculo] = useState('');
    const [filtroNota, setFiltroNota] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    useEffect(() => {
        fetchVinculos();
    }, []);

    const fetchVinculos = async () => {
        try {
            const response = await getVinculosProdutoVeiculo();
            setVinculos(response.data);
        } catch (error) {
            console.error('Erro ao buscar os vínculos:', error);
        }
    };

    const filtrarVinculos = () => {
        return vinculos.filter(vinculo => {
            const dentroDoIntervalo = (!dataInicio || new Date(vinculo.dataVinculo) >= new Date(dataInicio)) &&
                (!dataFim || new Date(vinculo.dataVinculo) <= new Date(dataFim));
            return (
                vinculo.xProd.toLowerCase().includes(filtroProduto.trim().toLowerCase()) &&
                vinculo.modeloVeiculo.toLowerCase().includes(filtroVeiculo.toLowerCase()) &&
                vinculo.numeroNota.toLowerCase().includes(filtroNota.toLowerCase()) &&
                dentroDoIntervalo
            );
        });
    };

    const handleImprimir = () => {
        const doc = new jsPDF();
        doc.text('Relatório de Movimentação de Produtos', 14, 10);

        const filteredData = filtrarVinculos().map(vinculo => [
            vinculo.id,
            vinculo.numeroNota,
            formatarDataResumida(vinculo.dtaEmissaoNF),
            vinculo.xProd,
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vinculo.valorUnitario),
            vinculo.quantidade,
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vinculo.quantidade * vinculo.valorUnitario),
            vinculo.modeloVeiculo
        ]);

        // 🔹 Calcula o total dos valores
        const totalValor = filtrarVinculos().reduce((acc, vinculo) => acc + (vinculo.quantidade * vinculo.valorUnitario), 0);

        // 🔹 Adiciona a linha do total com **negrito**
        filteredData.push([
            '', '', '', '', '', { content: 'TOTAL:', styles: { fontStyle: 'bold' } },
            { content: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValor), styles: { fontStyle: 'bold' } },
            ''
        ]);

        doc.autoTable({
            head: [['ID', 'Nota Fiscal', 'Data Emissão', 'Produto', 'Valor Unitário', 'Quantidade', 'Valor Total', 'Veículo']],
            body: filteredData,
            startY: 20,
            styles: { fontSize: 10 }, // 🔹 Define tamanho padrão da fonte
        });

        doc.save('Movimentacao_Produtos.pdf');
    };



    return (
        <div className="movimentacao-produtos-container">
            <h1 className='title-page'>Movimentação de Produtos</h1>

            {/* Filtros */}
            <div id='search-container'>
                <div id='search-fields'>
                    <div>
                        <input className='input-geral' type="text" placeholder="Filtrar por Produto" value={filtroProduto} onChange={(e) => setFiltroProduto(e.target.value)} />
                        <input className='input-geral' type="text" placeholder="Filtrar por Veículo" value={filtroVeiculo} onChange={(e) => setFiltroVeiculo(e.target.value)} />
                        <input className='input-geral' type="text" placeholder="Filtrar por Nota Fiscal" value={filtroNota} onChange={(e) => setFiltroNota(e.target.value)} />
                        <input className='input-geral' type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} placeholder="Data Início" />
                        <input className='input-geral' type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} placeholder="Data Fim" />
                    </div>
                    <div id='button-group'>
                        <button className="button" onClick={fetchVinculos}>Filtrar</button>
                        <button className="button" onClick={handleImprimir} >Imprimir</button>
                    </div>
                </div>

            </div>

            {/* Tabela */}
            <div id="results-container">
                <div id='grid-padrao-container'>
                    <table id="grid-padrao">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nota Fiscal</th>
                                <th>Data Emissão</th>
                                <th>Produto</th>
                                <th>Valor Unitário</th>
                                <th>Quantidade</th>
                                <th>Valor Total</th>
                                <th>Veículo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrarVinculos().length > 0 ? (
                                filtrarVinculos().map((vinculo, index) => (
                                    <tr key={index}>
                                        <td>{vinculo.id}</td>
                                        <td>{vinculo.numeroNota}</td>
                                        <td>{formatarDataResumida(vinculo.dtaEmissaoNF)}</td>
                                        <td>{vinculo.xProd}</td>
                                        <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vinculo.valorUnitario)}</td>
                                        <td>{vinculo.quantidade}</td>
                                        <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((vinculo.quantidade * vinculo.valorUnitario))}</td>
                                        <td>{vinculo.modeloVeiculo}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8">Nenhum vínculo encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                </div>
            </div>

        </div>
    );
};

export default MovimentacaoProdutos;
