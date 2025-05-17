import React from 'react';
import '../styles/ComunicacaoSEFAZ.css'; // Import your CSS file for styling

const ComunicacaoSEFAZ = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="nfe-modal-overlay">
            <div className="nfe-modal-content">
                <h2>Enviando NFe</h2>
                <div className="nfe-anim-container">
                    <div className="nfe-pc"></div>
                    <div className="nfe-paper"></div>
                    <div className="nfe-arrow"></div>
                </div>
                <p className="nfe-status-text">
                    Comunicando com a SEFAZ. Aguarde a finalização do processo...
                </p>
            </div>
        </div>
    );
};

export default ComunicacaoSEFAZ;
