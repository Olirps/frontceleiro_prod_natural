import jsPDF from "jspdf";
import "jspdf-autotable";
import { getEmpresaById } from "../services/api"; // Ajuste o caminho conforme necessário

const gerarOSPDF = async (os) => {
    try {
        // Buscar dados da empresa
        const empresa = await getEmpresaById(1);

        const doc = new jsPDF();
        doc.setFont("helvetica");

        // Cabeçalho da Empresa (centralizado e clean)
        doc.setFontSize(16);
        doc.text(empresa.data.nome || empresa.data.razaosocial, 105, 20, { align: "center" });
        doc.setFontSize(10);
        doc.text(`CNPJ: ${empresa.data.cnpj}`, 105, 28, { align: "center" });
        doc.text(`${empresa.data.logradouro}, ${empresa.data.bairro}`, 105, 36, { align: "center" });
        doc.text(`Telefone: ${empresa.data.telefone || "Não informado"}`, 105, 44, { align: "center" });

        // Linha divisória
        doc.setLineWidth(0.5);
        doc.line(14, 50, 196, 50);

        // Título do Documento
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("ORDEM DE SERVIÇO", 105, 60, { align: "center" });

        // Dados da OS
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Número: ${os.id}`, 14, 70);
        doc.text(`Data: ${new Date(os.data_criacao).toLocaleDateString("pt-BR")}`, 150, 70);

        // Status da Ordem de Serviço
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Status: ${os.status}`, 14, 80);

        // Linha divisória
        doc.setLineWidth(0.5);
        doc.line(14, 85, 196, 85);

        // Dados do Cliente
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Cliente", 14, 95);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Nome: ${os.cliente_nome}`, 14, 105);
        doc.text(`Telefone: ${os.cliente_telefone || "Não informado"}`, 14, 115);

        // Dados do Veículo (se houver)
        if (os.placa || os.veiculo) {
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Veículo", 14, 130);
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`Placa: ${os.placa || "Não informado"}`, 14, 140);
            doc.text(`Modelo: ${os.veiculo || "Não informado"}`, 14, 150);
        }

        // Linha divisória antes da tabela
        doc.setLineWidth(0.5);
        doc.line(14, 155, 196, 155);

        // Tabela de Produtos e Serviços (estilo clean, bordas arredondadas)
        doc.autoTable({
            startY: 160,
            head: [["Descrição", "Qtd.", "Valor Unit.", "Total"]],
            body: os.products.map((item) => [
                item.xProd,
                item.quantidade,
                `R$ ${item.valor_unitario.toFixed(2)}`,
                `R$ ${(item.quantidade * item.valor_unitario).toFixed(2)}`
            ]),
            styles: { fontSize: 10, cellPadding: 5, lineWidth: 0.1 },
            headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.5 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 20, left: 14, right: 14 },
            theme: 'grid'
        });

        // Cálculo do total
        // 07-04-2025 alterado de os.produtos_servicos.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0); para totalPrice
        let total = os.totalPrice

        // Total Geral destacado
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Total da Ordem de Serviço: R$ ${total}`, 14, doc.autoTable.previous.finalY + 10);

        // Linha divisória antes da assinatura
        doc.setLineWidth(0.5);
        doc.line(14, doc.autoTable.previous.finalY + 20, 196, doc.autoTable.previous.finalY + 20);

        // Espaço para assinaturas (modernização com bordas suaves)
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Assinatura do Cliente:", 14, doc.autoTable.previous.finalY + 35);
        doc.line(14, doc.autoTable.previous.finalY + 40, 80, doc.autoTable.previous.finalY + 40);

        doc.text("Assinatura da Empresa:", 120, doc.autoTable.previous.finalY + 35);
        doc.line(120, doc.autoTable.previous.finalY + 40, 196, doc.autoTable.previous.finalY + 40);

        // Rodapé com dados adicionais
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, 105, doc.autoTable.previous.finalY + 60, { align: "center" });
        doc.text(`Este documento é válido para a execução do serviço contratado.`, 105, doc.autoTable.previous.finalY + 70, { align: "center" });

        // Salvar PDF
        doc.save(`Ordem_Servico_${os.id}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF da OS:", error);
    }
};

export default gerarOSPDF;
