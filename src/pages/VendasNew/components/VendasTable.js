import React from 'react';
import VendaActions from './VendaActions';

function VendasTable({ vendas, onSearchClick, onPrintClick, onCancelClick, onEmitNFeClick }) {
  return (
    <div id="results-container">
      <div id="grid-padrao-container">
        <table id="grid-padrao">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Valor Recebido</th>
              <th>Desconto</th>
              <th>Data do Lançamento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {vendas.map((venda, index) => (
              <tr key={`${venda.vendaId}-${index}`}>
                <td>{venda.vendaId}</td>
                <td>{venda.cliente || 'Não Informado'}</td>
                <td>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(venda.valorPago)}
                </td>
                <td>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(venda.descontoTotal)}
                </td>
                <td>{new Date(venda.dataVenda).toLocaleString().replace(",", "")}</td>
                <td>
                  <VendaActions 
                    venda={venda}
                    onSearchClick={onSearchClick}
                    onPrintClick={onPrintClick}
                    onCancelClick={onCancelClick}
                    onEmitNFeClick={onEmitNFeClick}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VendasTable;