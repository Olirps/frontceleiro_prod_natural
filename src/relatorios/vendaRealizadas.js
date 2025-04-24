// utils/generatePdf.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const vendaRealizadas = (filteredPagamentos, totalPreco, somarLancamentosManuais) => {
    const doc = new jsPDF();

    // Adiciona um título
    const tituloRelatorio = somarLancamentosManuais ? 'Relatório de Vendas/Lançamentos' : 'Relatório de Vendas';
    doc.text(tituloRelatorio, 14, 20);

    // Configura as colunas da tabela
    const tableColumn = [
        'ID',
        'Cliente',
        'Total',
        'Data de Criação'
    ];

    let startY = 30; // Posição inicial da primeira tabela

    // Agrupa vendas por forma de pagamento
    const vendasPorTipo = filteredPagamentos.reduce((acc, venda) => {
        const tipo = venda.formaPagamento;
        if (!acc[tipo]) {
            acc[tipo] = [];
        }
        acc[tipo].push(venda);
        return acc;
    }, {});

    // Para cada tipo de venda, cria uma tabela separada
    Object.entries(vendasPorTipo).forEach(([formaPagamento, vendas]) => {
        // Adiciona o cabeçalho do grupo
        doc.text(`Forma de Pagamento: ${formaPagamento}`, 14, startY);
        startY += 10;

        // Prepara as linhas da tabela para este grupo
        const tableRows = vendas.map(venda => [
            venda.vendaId,
            venda.cliente || venda.descricao || 'Não Informado',
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valorPago),
            new Date(venda.dataVenda).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        ]);

        // Calcula subtotal para o grupo
        const subtotal = vendas.reduce((sum, venda) => sum + venda.valorPago, 0);
        tableRows.push([
            'Subtotal:',
            '',
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal),
            ''
        ]);

        // Adiciona a tabela ao PDF
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            margin: { top: 10 }
        });

        // Atualiza a posição Y para a próxima tabela
        startY = doc.lastAutoTable.finalY + 10;
    });

    // Adiciona o total geral no final
    doc.autoTable({
        head: [['Total Geral:', '', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPreco), '']],
        startY: startY,
        margin: { top: 10 },
        styles: { fontStyle: 'bold' }
    });

    // Salva o PDF
    doc.save('relatorio_vendas.pdf');
};

export default vendaRealizadas;