import React, { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import '../styles/ModalCancelaVenda.css';

const ModalCancelaVenda = ({ idVenda, isOpen, onClose, onSubmit }) => {
    const [id, setId] = useState('');
    const [motivo, setMotivo] = useState('');
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return; // Evita múltiplos cliques
        setLoading(true); // Ativa o estado de carregamento

        try {
            let formData = e.target.elements;
            formData.idVenda = idVenda;

            if (!formData.motivo.value.trim()) {
                setToast({ message: 'Por favor, preencha todos os campos.', type: 'error' });
                setLoading(false); // Desativa o estado de carregamento
                return;
            }

            onSubmit(formData); // Envia os dados
            setId(''); // Limpa o valor
            setLoading(false); // Desativa o estado de carregamento após sucesso
        } catch (error) {
            setToast({ message: 'Ocorreu um erro ao processar sua solicitação.', type: 'error' });
            console.error('Erro ao enviar os dados:', error);
            setLoading(false); // Desativa o estado de loading  
        } finally {
            setLoading(false); // Garante que o estado de carregamento seja desativado
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Cancela Vendas: {idVenda}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div id='motivo-cancelamento'>
                        <label htmlFor="motivo"> Motivo:</label>
                        <input
                            className='input-geral'
                            type="text"
                            name="motivo"
                            required />
                        <div className="modal-footer">
                            <button className="button-primary"
                                type="submit"
                                disabled={loading}// Desativa o botão enquanto está carregando 
                            >
                                {loading ? 'Processando...' : 'Cancelar Venda'}

                            </button>
                            <button className="button-secondary" type="button" onClick={onClose}>
                                Fechar
                            </button>
                        </div>
                    </div>


                </form>
                {toast.message && <Toast message={toast.message} type={toast.type} />}
            </div>
        </div>
    );
};

export default ModalCancelaVenda;
