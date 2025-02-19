import React from "react";
import "../styles/ContasPagarSemana.css"; // Arquivo de estilos
import { formatarData,formatarMoedaBRL } from '../utils/functions';

const ContasPagarSemana = ({ contas }) => {
  return (
    <div className="contas-container">
      {contas.length === 0 ? (
        <p>Nenhuma conta a pagar nesta semana.</p>
      ) : (
        <table className="contas-tabela">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Vencimento</th>
              <th>Valor (R$)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {contas.map((conta) => (
              <tr key={conta.id} className={conta.status}>
                <td>{conta.descricao}</td>
                <td>{formatarData(conta.vencimento)}</td>
                <td>{formatarMoedaBRL(conta.valor_parcela)}</td>
                <td className={`status ${conta.status}`}>{conta.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ContasPagarSemana;
