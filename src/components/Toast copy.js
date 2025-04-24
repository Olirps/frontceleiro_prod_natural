import React, { useEffect } from 'react';
import '../styles/Toast.css';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    if (!onClose || typeof onClose !== 'function') return; // Verifica se onClose é uma função

    const timer = setTimeout(() => {
      onClose(); // Fecha o Toast após 3 segundos
    }, 3000);

    return () => clearTimeout(timer); // Limpa o timer se o componente for desmontado
  }, [onClose]);

  if (!message) return null; // Evita renderizar se não houver mensagem

  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
};

export default Toast;