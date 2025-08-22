import jsPDF from 'jspdf';
import 'jspdf-autotable';

const vendaRealizadas = (jsonData) => {
    // garante que sempre será array
    const data = Array.isArray(jsonData.data) ? jsonData.data : [];
    const somaTotalPrice = jsonData.totalPreco || 0;
    const totalDescontos = jsonData.totalDescontos || 0;

    const doc = new jsPDF();

    const tituloRelatorio = 'Relatório de Vendas';
    doc.text(tituloRelatorio, 14, 20);

    const tableColumn = ['ID', 'Cliente', 'Valor Pago', 'Desconto', 'Data de Criação'];

    let startY = 30;
    const pagamentosAgrupados = {};

    for (const venda of data) {
        const formasPagamento = Array.isArray(venda.pagamentos) ? venda.pagamentos : [];

        // Caso sem pagamentos → usa totalPrice
        if (formasPagamento.length === 0) {
            const forma = 'Vendas em Aberto';

            if (!pagamentosAgrupados[forma]) {
                pagamentosAgrupados[forma] = [];
            }

            pagamentosAgrupados[forma].push({
                id: venda.venda_id,
                cliente: venda.cliente || 'Não Informado',
                data: new Date(venda.dataVenda).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                valor: parseFloat(venda.totalPrice || 0),
                desconto: parseFloat(venda.desconto || 0)
            });

            continue;
        }

        // Processa vendas com pagamentos
        for (const pagamento of formasPagamento) {
            const forma = pagamento.descricao || 'Outro';

            if (!pagamentosAgrupados[forma]) {
                pagamentosAgrupados[forma] = [];
            }

            pagamentosAgrupados[forma].push({
                id: venda.venda_id,
                cliente: venda.cliente || 'Não Informado',
                data: new Date(venda.dataVenda).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                valor: parseFloat(pagamento.valor || 0),
                desconto: parseFloat(venda.desconto || 0)
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
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(somaTotalPrice),
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDescontos),
            ''
        ]],
        startY: startY,
        styles: { fontStyle: 'bold' }
    });

    doc.save('relatorio_vendas.pdf');
};

export default vendaRealizadas;
