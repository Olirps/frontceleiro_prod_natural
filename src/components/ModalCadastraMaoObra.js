import React, { useState } from 'react';
import { addProdutos } from '../services/api';
import Toast from './Toast';
import { formatarMoedaBRL, converterMoedaParaNumero } from '../utils/functions'; // Funções para formatar valores

const ModalCadastraMaoObra = ({ isOpen, onClose, onMOAdicionado }) => {
    const [xProd, setxProd] = useState('');
    const [vlrVenda, setVlrVenda] = useState('');
    const [cod_interno, setCodInterno] = useState('');
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);


    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        const tipo = 'servico'
        const novoServico = {
            xProd: xProd,
            tipo: tipo,
            cod_interno: null,
            vlrVenda: converterMoedaParaNumero(vlrVenda),
            valorTotal: converterMoedaParaNumero(vlrVenda)
        };

        try {
            const novaMaoObra = await addProdutos(novoServico);
            const maoObraCriada = { ...novaMaoObra.data, valorTotal: converterMoedaParaNumero(vlrVenda) };
            setxProd('');
            setVlrVenda('');
            setCodInterno('');
            onMOAdicionado(maoObraCriada)
            onClose();
            setLoading(false);
        } catch (err) {
            setLoading(false);
            const errorMessage = err.response.data.erro;
            setToast({ message: errorMessage, type: "error" });
        }
    };


    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>Cadastrar Mão de Obra</h2>
                <form onSubmit={handleSave} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
                    <div id='cadastro-padrão'>
                        <fieldset>
                            <label>
                                Nome do Serviço:
                                <input
                                    type="text"
                                    className='input-geral'
                                    value={xProd}
                                    onChange={(e) => setxProd(e.target.value.toUpperCase())}
                                    required
                                />
                            </label>
                            <label>
                                Valor do Serviço:
                                <input
                                    type="text"
                                    className='input-geral'
                                    value={vlrVenda}
                                    onChange={(e) => setVlrVenda(formatarMoedaBRL(e.target.value))}
                                />
                            </label>
                        </fieldset>
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

export default ModalCadastraMaoObra;