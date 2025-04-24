import React, { useState, useEffect } from 'react';
import { addCliente, addVeiculos } from '../services/api';
import Toast from '../components/Toast';
import { cpfCnpjMask } from './utils';
import { formatarCelular, formatPlaca } from '../utils/functions';

const ModalCadastraClienteSimplificado = ({ isOpen, onClose, onClienteAdicionado, onVeiculoAdicionado, tipo }) => {
    const [nome, setNome] = useState('');
    const [celular, setCelular] = useState('');
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [modelo, setModelo] = useState('');
    const [placa, setPlaca] = useState('');
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);



    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true)
        const cliente = {
            nome: nome, // Nome do cliente
            celular: celular.replace(/\D/g, ''), // Remove caracteres não numéricos do celular
            cpfCnpj: cpfCnpj // CPF ou CNPJ do cliente
        };

        let veiculo;
        if (modelo) {
            veiculo = { modelo, placa };
        }

        try {
            const clienteAdicionado = await addCliente(cliente);
            onClienteAdicionado(clienteAdicionado.data);
            if (veiculo) {
                const veiculoAdicionado = await addVeiculos(veiculo);
                onVeiculoAdicionado(veiculoAdicionado.data);
            }
            setNome('');
            setCelular('');
            setCpfCnpj('');
            setModelo('');
            setPlaca('');
            onClose();  // Fecha o modal
        } catch (err) {
            setLoading(false);
            const errorMessage = err.response?.data?.error || "Erro ao cadastrar cliente.";
            setToast({ message: errorMessage, type: "error" });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>{tipo !== 'venda' ? 'Cadastrar Cliente e Veículo' : 'Cadastrar Cliente'}</h2>
                <form onSubmit={handleSave} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
                    <fieldset>
                        <legend>Cadastro Cliente</legend>
                        <label>
                            Nome:
                            <input
                                type="text"
                                className='input-geral'
                                value={nome}
                                onChange={(e) => setNome(e.target.value.toUpperCase())}
                                required
                            />
                        </label>
                        <label>
                            Telefone:
                            <input
                                type="text"
                                className='input-geral'
                                value={celular}
                                onChange={(e) => setCelular(formatarCelular(e.target.value))}
                                required
                            />
                        </label>
                        <label>
                            CPF/CNPJ:
                            <input
                                type="text"
                                className='input-geral'
                                value={cpfCnpj}
                                onChange={(e) => setCpfCnpj(cpfCnpjMask(e.target.value))}
                            />
                        </label>
                    </fieldset>

                    {tipo !== 'venda' && (<fieldset>
                        <legend>Cadastro Veículo</legend>
                        <label>
                            Modelo:
                            <input
                                type="text"
                                className='input-geral'
                                value={modelo}
                                onChange={(e) => setModelo(e.target.value.toUpperCase())}
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
                    )}
                    <div id='button-group'>
                        <button className='button' type="submit" disabled={loading}>{loading ? 'Salvando' : 'Salvar'}</button>
                    </div>
                </form>
                {toast.message && <Toast type={toast.type} message={toast.message} />}
            </div>
        </div>
    );
};

export default ModalCadastraClienteSimplificado;
