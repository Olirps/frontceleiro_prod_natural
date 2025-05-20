// ModalInputCFOP.jsx
import React, { useState } from 'react';

const ModalInputCFOP = ({ isOpen, onClose, onConfirm }) => {
    const [cfop, setCfop] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!cfop.trim()) return; // não deixa confirmar vazio
        onConfirm(cfop.trim());
        setCfop('');
    };
    const handleChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        if (/^\d+$/.test(value) || value === '') {
            setCfop(value);
        }
    }
    const handleClose = () => {
        setCfop('');
        onClose();
    };
    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <h3>Informe o CFOP correto</h3>
                <input
                    type="text"
                    value={cfop}
                    onChange={handleChange}
                    placeholder="Digite o CFOP"
                    className='input-geral'
                    maxLength={4}
                />
                <div id="button-group">
                    <button className='button' style={{ backgroundColor: "red", color: "white", buttonStyle }} onClick={handleClose} >Cancelar</button>
                    <button className='button' onClick={handleConfirm} disabled={!cfop.trim()}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div >
    );
};

const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 10000,
};

const modalStyle = {
    backgroundColor: '#fff', padding: '20px', borderRadius: '6px', width: '300px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
};

const buttonStyle = {
    padding: '8px 16px', cursor: 'pointer',
};

export default ModalInputCFOP;
