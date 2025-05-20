import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getEmpresaById } from "../services/api"; // Ajuste o caminho conforme necessário

export const gerarPDFRelatorioEstoque = async ({ tipoRelatorio, dataImpressao, relatorio, nomeProduto }) => {
    const empresa = await getEmpresaById(1);

    const doc = new jsPDF();

    // Cabeçalho da Empresa (centralizado no topo)
    doc.setFontSize(14);
    doc.text(empresa.data.nome || empresa.data.razaosocial, 105, 12, { align: "center" });
    doc.setFontSize(10);
    doc.text(`CNPJ: ${empresa.data.cnpj}`, 105, 17, { align: "center" });
    doc.text(`${empresa.data.logradouro}, ${empresa.data.bairro}`, 105, 22, { align: "center" });
    doc.text(`Telefone: ${empresa.data.telefone || "Não informado"}`, 105, 27, { align: "center" });

    // Título do relatório e filtros (à esquerda)
    doc.setFontSize(14);
    doc.text('Relatório de Estoque', 14, 36);

    doc.setFontSize(11);
    if (tipoRelatorio === 'resumo') {
        doc.text(`Data de corte: ${dataImpressao}`, 14, 44);
    } else if (tipoRelatorio === 'saldo' && nomeProduto) {
        doc.text(`Filtro: Produto contém "${nomeProduto}"`, 14, 44);
    }

    // Define startY da tabela baseado nas informações anteriores
    const startY = tipoRelatorio === 'resumo' || (tipoRelatorio === 'saldo' && nomeProduto) ? 50 : 44;

    // Tabela
    if (tipoRelatorio === 'resumo') {
        autoTable(doc, {
            startY,
            head: [['Produto ID', 'Nome Produto', 'Entradas', 'Saídas', 'Saldo']],
            body: relatorio.map(item => [
                item.produto_id,
                item.nome_produto,
                item.entradas_ate_data,
                item.saidas_ate_data,
                item.saldo_ate_data
            ])
        });
    } else if (tipoRelatorio === 'saldo') {
        autoTable(doc, {
            startY,
            head: [['Produto ID', 'Nome Produto', 'Entradas', 'Saídas', 'Saldo Atual']],
            body: relatorio.map(item => [
                item.produto_id,
                item.nome_produto,
                item.entradas_ate_data,
                item.saidas_ate_data,
                item.saldo
            ])
        });
    } else if (tipoRelatorio === 'estoque') {
        autoTable(doc, {
            startY,
            head: [['Produto ID', 'Nome Produto', 'Unidade', 'Estoque Atual']],
            body: relatorio.map(item => [
                item.produto_id,
                item.nome_produto,
                item.unidade,
                item.estoque_atual
            ])
        });
    }

    doc.save(`relatorio_${tipoRelatorio}_${dataImpressao || 'atual'}.pdf`);
};