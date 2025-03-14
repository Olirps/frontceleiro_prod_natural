import React, { useState, useEffect } from 'react';
import "../styles/ContasPagarSemana.css"; // Arquivo de estilos
import { formatarData, formatarMoedaBRL } from '../utils/functions';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função

const ProdutosMaisVendidosSemana = ({ produtosVendidos }) => {
  const { permissions } = useAuth();
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Limita a exibição a 20 produtos
  const produtosLimitados = produtosVendidos.slice(0, 20);

  return (
    <div className="contas-container">
      {produtosLimitados.length === 0 ? (
        <p>Nenhum Produto Vendido nesta semana.</p>
      ) : (
        <table className="contas-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Unidade Medida</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {produtosLimitados.map((produto) => (
              <tr key={produto.id} className={produto.status}>
                <td>{produto.xProd}</td>
                <td>{produto.uCom}</td>
                <td>{produto.total_quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProdutosMaisVendidosSemana;