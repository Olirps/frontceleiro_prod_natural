import { jsPDF } from "jspdf";
import { consultaVenda, consultaItensVenda, consultaPagamentosById, consultaVendaPorId } from '../services/api';

 const imprimeVenda = async (idVenda) => {
    try {
        // Aguarda as 3 requisições simultaneamente
        const [responseVenda, responseItensVenda, responsePagamentosVenda] = await Promise.all([
            consultaVendaPorId(idVenda),
            consultaItensVenda(idVenda),
            consultaPagamentosById(idVenda)
        ]);

        // Verifica se todas as respostas são válidas
        if (responseVenda.status === 200 && responseItensVenda.status === 200 && responsePagamentosVenda.status === 200) {
            // Unifica os dados em um único objeto
            const vendaComDetalhes = {
                ...responseVenda.data, // Dados da venda
                itens: responseItensVenda.data, // Itens da venda
                pagamentos: responsePagamentosVenda.data // Pagamentos da venda
            };

            // Chama a função de geração de PDF com os dados unificados
            generatePDF(vendaComDetalhes);
        } else {
            console.error('Erro inesperado ao obter os dados da venda:', responseVenda, responseItensVenda, responsePagamentosVenda);
        }
    } catch (err) {
        if (err.response && err.response.status === 403) {
            // Redireciona para a página de login
            window.location.href = '/login';
        } else {
            console.error('Erro ao obter os dados da venda:', err);
        }
    }
};

export const generatePDF = (data) => {
        // Cálculo da altura dinâmica: 150mm para até 6 itens, aumentando 5mm por item extra
        const baseHeight = 150;
        const itemsPerPage = 6;
        const extraHeight = Math.max(0, (data.itens.length - itemsPerPage) * 5);
        const pageHeight = baseHeight + extraHeight;
    
    const doc = new jsPDF({
        unit: 'mm',  // Unidade de medida em milímetros
        format: [70, pageHeight]  // Definindo o tamanho da página: 7 cm de largura x 15 cm de altura
    });

    // Largura e altura da página
    const margin = 2; // Margem da esquerda
    const contentWidth = 66; // Largura para o conteúdo (7cm - margens)

    // Reduzir o tamanho da fonte para ajustar melhor ao layout
    doc.setFontSize(7);

    // Cabeçalho
    const headerText = 'DOCUMENTO NÃO FISCAL DE CONSUMIDOR ELETRÔNICA';
    const headerLines = doc.splitTextToSize(headerText, contentWidth);
    let yOffset = 10;
    headerLines.forEach((line, index) => {
        doc.text(line, 35, yOffset + (index * 5), { align: 'center' });
    });

    // Informações da Empresa
    yOffset += headerLines.length * 5 + 5; // Ajusta o deslocamento após o cabeçalho
    doc.text(`Nome Fantasia: Celeiro Produtos Naturais`, margin, yOffset);
    yOffset += 5;
    doc.text(`CNPJ: 45.393.325/0001-10`, margin, yOffset);
    yOffset += 5;
    doc.text(`Razão Social: ANDRESSA MULLER`, margin, yOffset);
    yOffset += 5;


    // Endereço com quebra de linha
    const enderecoText = `Endereço: Av. Paraná, R. Piracicaba, 621 - Primavera II, Primavera do Leste - MT, 78850-000`;
    const enderecoLines = doc.splitTextToSize(enderecoText, contentWidth);
    enderecoLines.forEach((line, index) => {
        doc.text(line, margin, yOffset + (index * 5));
    });
    yOffset += enderecoLines.length * 5;

    // Informações adicionais
    yOffset += 10;
    doc.text(`Cliente: ${data.cliente}`, margin, yOffset);
    yOffset += 5;
    doc.text(`Data da Venda: ${data.dataVenda}`, margin, yOffset);

    // Tabela de Produtos
    yOffset += 10;
    const colWidth = [35, 20, 12]; // Largura das colunas (Produto, Quantidade, Valor Unit., Total)
    doc.text('Produto', margin, yOffset);
    doc.text('Qtd', margin + colWidth[0], yOffset, { align: 'center' });
    doc.text('Valor Unit.', margin + colWidth[0] + colWidth[1], yOffset, { align: 'right' });
    doc.text('Total', margin + colWidth[0] + colWidth[1] + colWidth[2], yOffset, { align: 'right' });

    yOffset += 5;

    // Adiciona os itens da tabela
    data.itens.forEach(item => {
        // Cortar o nome do produto para 18 caracteres
        let productText = item.xProd;
        if (productText.length > 18) {
            productText = productText.substring(0, 18);  // Cortar o nome para 18 caracteres
        }

        // Desenha o nome do produto cortado
        doc.text(productText, margin, yOffset);

        // Preenche as colunas de Qtd, Valor Unitário e Total
        doc.text(item.quantity.toString(), margin + colWidth[0], yOffset, { align: 'center' });
        doc.text(`R$ ${parseFloat(item.vlrUnitario).toFixed(2)}`, margin + colWidth[0] + colWidth[1], yOffset, { align: 'right' });

        const itemTotal = parseFloat(item.vlrVenda).toFixed(2);  // Total de cada item
        doc.text(`R$ ${itemTotal}`, margin + colWidth[0] + colWidth[1] + colWidth[2], yOffset, { align: 'right' });

        // Ajusta o deslocamento para a próxima linha
        yOffset += 5;
    });

    // Desconto e Total Pago
    
    // Exibe o Total da Venda (a variável vlrVenda)
    const totalVenda = (parseFloat(data.totalPrice) || 0) + (parseFloat(data.desconto) || 0);
    doc.text(`Total da Venda: R$ ${parseFloat(totalVenda).toFixed(2)}`, margin, yOffset);  // Agora usa o valor de vlrVenda diretamente
    yOffset += 5;
    doc.text(`Desconto: R$ ${parseFloat(data.desconto).toFixed(2)}`, margin, yOffset);
    yOffset += 5;
    doc.text(`Total Pago: R$ ${parseFloat(data.totalPrice).toFixed(2)}`, margin, yOffset); 
    yOffset += 5;

    // Forma de Pagamento
    yOffset += 5;
    doc.text('FORMA DE PAGAMENTO', margin, yOffset);
    yOffset += 5;
    const formasPagamento = {
        dinheiro: 'Dinheiro',
        pix: 'PIX',
        cartaoDebito: 'Cartão de Débito',
        cartaoCredito: 'Cartão de Crédito'
    };
    
    data.pagamentos.forEach(pagamento => {
        const formaPagamento = formasPagamento[pagamento.formaPagamento] || pagamento.formaPagamento;
        
        doc.text(`${formaPagamento}: R$ ${parseFloat(pagamento.vlrPago).toFixed(2)}`, margin, yOffset);
        yOffset += 5;
    });

    // Gerar o PDF
    doc.save("nota_fiscal.pdf");
};

export default imprimeVenda;