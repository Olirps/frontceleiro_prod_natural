import jsPDF from "jspdf";
import "jspdf-autotable";
import { formatarMoedaBRL } from '../utils/functions';


export async function handleImprimir(produtosSelecionados) {
  const doc = new jsPDF();

  // Cabeçalho
  doc.setFontSize(18);
  doc.text("Relatório de Atualização de Preços", 14, 20);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Data: ${new Date().toLocaleString("pt-BR")}`, 14, 28);

  const body = [];
  let totalDifReais = 0;
  let totalPct = 0;
  let countPct = 0;

  const pushRow = (nome, tipo, precoAntigo, precoNovo) => {
    const difAbs = precoNovo - precoAntigo;
    const difPct = precoAntigo ? ((difAbs / precoAntigo) * 100) : 0;

    totalDifReais += difAbs;
    totalPct += difPct;
    countPct++;

    body.push([
      nome,
      tipo,
      formatarMoedaBRL(precoAntigo),
      formatarMoedaBRL(precoNovo),
      {
        content: difAbs.toFixed(2),
        styles: { textColor: difAbs >= 0 ? [0, 128, 0] : [200, 0, 0] }
      },
      {
        content: `${difPct.toFixed(2)}%`,
        styles: { textColor: difPct >= 0 ? [0, 128, 0] : [200, 0, 0] }
      }
    ]);
  };

  produtosSelecionados.forEach((produto) => {
    // Normal
    if (produto.novoPreco !== undefined) {
      pushRow(
        produto.nome || produto.xProd || '',
        "Normal",
        produto.vlrVenda || 0,
        produto.novoPreco || 0
      );
    }

    // Fracionado
    if (produto.fracionado && produto.novoPrecoFracionado !== undefined) {
      pushRow(
        produto.nome || produto.xProd || '',
        "Fracionado",
        produto.vlrVendaFracionado || 0,
        produto.novoPrecoFracionado || 0
      );
    }

    // Atacado
    if (produto.atacado && produto.novoPrecoAtacado !== undefined) {
      pushRow(
        produto.nome || produto.xProd || '',
        "Atacado",
        produto.vlrVendaAtacado || 0,
        produto.novoPrecoAtacado || 0
      );
    }
  });

  const mediaPct = countPct > 0 ? (totalPct / countPct) : 0;

  // Tabela com estilo + cores dinâmicas
  doc.autoTable({
    head: [["Produto", "Tipo", "Antigo (R$)", "Novo (R$)", "Dif. (R$)", "Dif. (%)"]],
    body,
    startY: 40,
    theme: "grid",
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: 50,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    foot: [[
      { content: "Totais", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
      {
        content: totalDifReais.toFixed(2),
        styles: { fontStyle: "bold", textColor: totalDifReais >= 0 ? [255, 255, 255] : [200, 0, 0] }
      },
      {
        content: `${mediaPct.toFixed(2)}%`,
        styles: { fontStyle: "bold", textColor: mediaPct >= 0 ? [255, 255, 255] : [200, 0, 0] }
      },
    ]],
    footStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: "bold",
    },
  });

  doc.save("relatorio-precos.pdf");
}
