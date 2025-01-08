// src/components/Toast.js
import React from 'react';
import '../styles/Toast.css'; // Certifique-se de criar e importar este CSS

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;

  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button className="toast-close-button" onClick={onClose}>×</button>
    </div>
  );
};

export default Toast;
