// utils/generatePdf.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const vendaRealizadas = (filteredPagamentos, totalPreco, somarLancamentosManuais) => {
    const doc = new jsPDF();

    // Adiciona um título
    const tituloRelatorio = somarLancamentosManuais ? 'Relatório de Vendas/Lançamentos' : 'Relatório de Vendas';
    doc.text(tituloRelatorio, 14, 20);

    // Configura as colunas e os dados da tabela
    const tableColumn = [
        'ID',
        'Cliente',
        'Total',
        'Forma de Movimentação',
        'Data de Criação'
    ];

    // Use filteredPagamentos diretamente para incluir todos os registros filtrados
    const tableRows = filteredPagamentos.map(venda => [
        venda.vendaId,
        venda.cliente || venda.descricao || 'Não Informado',
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valorPago),
        venda.formaPagamento,
        new Date(venda.dataVenda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    ]);

    tableRows.push([
        'Totais:',
        '', // Cliente (vazio)
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPreco),
        '', // Forma de Pagamento (vazio)
        '' // Data de Criação (vazio)
    ]);

    // Adiciona a tabela ao PDF
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30, // Posição inicial da tabela
    });

    // Salva o PDF
    doc.save('relatorio_vendas.pdf');
};

export default vendaRealizadas;
