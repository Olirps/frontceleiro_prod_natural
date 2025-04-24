import React, { useState } from 'react';
import { addVeiculos } from '../services/api';
import Toast from '../components/Toast';
import { formatPlaca } from '../utils/functions';

const ModalCadastraCarroSimplificado = ({ isOpen, onClose, onVeiculoAdicionado }) => {
    const [modelo, setModelo] = useState('');
    const [placa, setPlaca] = useState('');
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);


    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true)
        const veiculo = { modelo, placa };
        try {
            const carroAdicionado = await addVeiculos(veiculo);
            onVeiculoAdicionado(carroAdicionado.data);
            setModelo('');
            setPlaca('');
            onClose();
        } catch (err) {
            setLoading(false);
            const errorMessage = err.response?.data?.error || "Erro ao cadastrar veículo.";
            setToast({ message: errorMessage, type: "error" });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>Cadastrar Veículo</h2>
                <form onSubmit={handleSave} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
                    <div id='cadastro-padrão'>
                        <fieldset>
                            <legend>Cadastro Veículo</legend>
                            <label>
                                Modelo:
                                <input
                                    type="text"
                                    className='input-geral'
                                    value={modelo}
                                    onChange={(e) => setModelo(e.target.value.toUpperCase())}
                                    required
                                />
                            </label>
                            <label>
                                Placa:
                                <input
                                    type="text"
                                    className='input-geral'
                                    value={placa}
                                    onChange={(e) => setPlaca(formatPlaca(e.target.value))}
                                />
                            </label>
                        </fieldset>
                    </div>
                    <div id='button-group'>
                        <button className='button' type="submit" disabled={loading}>{loading?'Salvando':'Salvar'}</button>
                    </div>
                </form>
                {toast.message && <Toast type={toast.type} message={toast.message} />}
            </div>
        </div>
    );
};

export default ModalCadastraCarroSimplificado;
