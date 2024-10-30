// src/components/Toast.js
import React from 'react';
import '../styles/Toast.css'; // Certifique-se de criar e importar este CSS

const Toast = ({ message, type }) => {
  if (!message) return null;

  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
};

export default Toast;
