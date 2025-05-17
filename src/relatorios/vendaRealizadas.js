import jsPDF from 'jspdf';
import 'jspdf-autotable';

const vendaRealizadas = (filteredPagamentos, totalPreco, totalDesconto, somarLancamentosManuais) => {
    const doc = new jsPDF();

    const tituloRelatorio = somarLancamentosManuais ? 'Relatório de Vendas/Lançamentos' : 'Relatório de Vendas';
    doc.text(tituloRelatorio, 14, 20);

    const tableColumn = ['ID', 'Cliente', 'Valor Pago', 'Desconto', 'Data de Criação'];

    let startY = 30;

    const pagamentosAgrupados = {};

    for (const venda of filteredPagamentos) {
        // Verifica se é um lançamento manual (sem formasPagamento)
        const formasPagamento = venda.formasPagamento || [];

        // Se for um lançamento manual e o modo está ativado
        if (somarLancamentosManuais && formasPagamento.length === 0 && venda.tipo) {
            const forma = venda.tipo.toLowerCase() === 'crédito' ? 'Lançamento Crédito' : 'Lançamento Débito';

            if (!pagamentosAgrupados[forma]) {
                pagamentosAgrupados[forma] = [];
            }

            pagamentosAgrupados[forma].push({
                id: venda.id || '-',
                cliente: venda.descricao || 'Lançamento Manual',
                data: new Date(venda.data || venda.dataVenda).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                valor: parseFloat(venda.valor || 0),
                desconto: 0
            });

            continue;
        }

        // Processamento normal das vendas com formas de pagamento
        const descontoTotal = parseFloat(venda.desconto || 0);
        const totalVenda = formasPagamento.reduce((acc, p) => acc + parseFloat(p.vlrPago || 0), 0);

        for (const pagamento of formasPagamento) {
            const forma = pagamento.formaPagamento;

            if (forma.toLowerCase() === 'desconto') continue;

            const valorPago = parseFloat(pagamento.vlrPago || 0);
            const proporcao = totalVenda ? valorPago / totalVenda : 0;
            const descontoProporcional = descontoTotal * proporcao;

            if (!pagamentosAgrupados[forma]) {
                pagamentosAgrupados[forma] = [];
            }

            pagamentosAgrupados[forma].push({
                id: venda.id || venda.vendaId,
                cliente: venda.cliente || venda.descricao || 'Não Informado',
                data: new Date(venda.data || venda.dataVenda).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                valor: valorPago,
                desconto: descontoProporcional
            });
        }
    }

    // Criar uma tabela por forma de pagamento
    for (const [formaPagamento, registros] of Object.entries(pagamentosAgrupados)) {
        doc.text(`Forma de Pagamento: ${formaPagamento}`, 14, startY);
        startY += 10;

        const tableRows = registros.map(r => [
            r.id,
            r.cliente,
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valor),
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.desconto),
            r.data
        ]);

        const subtotal = registros.reduce((acc, r) => acc + r.valor, 0);
        const subtotalDesconto = registros.reduce((acc, r) => acc + r.desconto, 0);

        tableRows.push([
            'Subtotal:',
            '',
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal),
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotalDesconto),
            ''
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            margin: { top: 10 }
        });

        startY = doc.lastAutoTable.finalY + 10;
    }

    // Total geral
    doc.autoTable({
        head: [[
            'Total Geral:',
            '',
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPreco),
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDesconto),
            ''
        ]],
        startY: startY,
        styles: { fontStyle: 'bold' }
    });

    doc.save('relatorio_vendas.pdf');
};

export default vendaRealizadas;
