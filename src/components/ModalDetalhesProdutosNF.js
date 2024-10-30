import React from 'react';

const ModalDetalhesProdutosNF = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>X</button>
        <h2>Detalhes do Produto: {product.descricao}</h2>
        <p>ID: {product.id}</p>
        <p>Quantidade: {product.quantidade}</p>
        <p>Identificador: {product.identificador}</p>
        {/* Adicione aqui o conteúdo e os campos para tratar o produto */}
      </div>
    </div>
  );
};

export default ModalDetalhesProdutosNF;
