import { useState } from 'react';
import { addTipoContratosLayout, alterarTipoContratosLayout } from '../services/api';
import Toast from '../components/Toast';
import { useEffect } from 'react';

const ModalTipoContratoLayout = ({ isOpen, onClose, onTipoLayoutAdicionado, tipoLayout, edit }) => {
    const [descricao, setDescricao] = useState('');
    const [status, setStatus] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (edit) {
            setDescricao(tipoLayout.descricao || '');
            setStatus(tipoLayout.status || '');
        } else {
            setDescricao('');
            setStatus('');

        }
    }, [isOpen, edit]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const tipoContrato = { descricao,status };
            if (!edit) {
                const tipo = await addTipoContratosLayout(tipoContrato);
                if (tipo) {
                    setDescricao('')
                    onTipoLayoutAdicionado(tipo);
                    setToast({ message: 'Tipo Contrato Layout Adionado com sucesso', type: "success" })
                    onClose();
                }
            } else {
                const tipo = await alterarTipoContratosLayout(tipoLayout.id, { descricao, status })
                setToast({ message: 'Tipo Contrato Layout Alterado com sucesso', type: "success" })
            }

        } catch (err) {
            setLoading(false);
            const errorMessage = err.response?.data?.error || "Erro ao cadastrar Tipo Layout Contrato.";
            setToast({ message: errorMessage, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2> {edit ? 'Editar Tipo Contrato' : 'Cadastrar Tipo Contrato'}</h2>
                <form onSubmit={handleSave} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
                    <div id='cadastro-padrão'>
                        <label htmlFor="descricao">Tipo Contrato:  Ativo?
                            <input
                                type="checkbox"
                                checked={status}
                                onChange={(e) => setStatus(e.target.checked)}
                            /></label>
                        <input
                            type="text"
                            className='input-geral'
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value.toUpperCase())}
                            required
                        />
                    </div>

                    <div id='button-group'>
                        <button className='button' type="submit" disabled={loading}>{loading ? 'Salvando' : 'Salvar'}</button>
                    </div>
                </form>
                {toast.message && <Toast type={toast.type} message={toast.message} />}
            </div>
        </div>
    );
};

export default ModalTipoContratoLayout;
