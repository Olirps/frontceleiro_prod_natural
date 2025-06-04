import React, { useEffect, useState } from 'react';
import { cpfCnpjMask } from './utils';
import { getUfs, getMunicipiosUfId, addCliente } from '../services/api';
import Toast from '../components/Toast';

const CadClienteSimpl = ({ isOpen, onClose, onSuccess }) => {
    const [nome, setNome] = useState('');
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [inscricaoEstadual, setInscricaoEstadual] = useState('');
    const [logradouro, setLogradouro] = useState('');
    const [numero, setNumero] = useState('');
    const [bairro, setBairro] = useState('');
    const [municipio, setMunicipio] = useState('');
    const [uf, setUf] = useState('');
    const [ufs, setUfs] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [showInscricaoEstadual, setShowInscricaoEstadual] = useState(false);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        const fetchUfs = async () => {
            try {
                const ufsData = await getUfs();
                if (Array.isArray(ufsData.data)) {
                    setUfs(ufsData.data);
                }
            } catch (error) {
                console.error("Erro ao buscar UFs:", error);
                setToast({
                    message: "Erro ao buscar as UFs. Tente novamente.",
                    type: "error",
                });
            }
        };

        if (isOpen) {
            fetchUfs();
        }
    }, [isOpen]);

    useEffect(() => {
        // Verifica se o CPF/CNPJ é um CNPJ (14 dígitos)
        setShowInscricaoEstadual(cpfCnpj.replace(/\D/g, '').length === 14);
    }, [cpfCnpj]);

    const handleUfChange = async (e) => {
        const selectedUf = e.target.value;
        setUf(selectedUf);
        setMunicipio(''); // Reseta o município quando muda a UF

        if (selectedUf) {
            try {
                const municipiosData = await getMunicipiosUfId(selectedUf);
                if (Array.isArray(municipiosData.data)) {
                    setMunicipios(municipiosData.data);
                }
            } catch (error) {
                console.error('Erro ao buscar municípios:', error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const clienteData = {
            nome: nome.toUpperCase(),
            cpfCnpj: cpfCnpj.replace(/\D/g, ''),
            inscricaoEstadual: showInscricaoEstadual ? inscricaoEstadual : null,
            logradouro: logradouro.toUpperCase(),
            numero,
            bairro: bairro.toUpperCase(),
            municipio_id: municipio,
            uf_id: uf
        };

        try {
            const response = await addCliente(clienteData);
            setToast({ message: "Cliente cadastrado com sucesso!", type: "success" });
            setTimeout(() => {
                onSuccess(response.data); // Retorna os dados do cliente cadastrado
                onClose();
            }, 1500);
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Erro ao cadastrar cliente.";
            setToast({ message: errorMessage, type: "error" });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content simplified">
                <button className="modal-close" onClick={onClose}>×</button>
                <h2>Cadastro de Cliente</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="nome">Nome*</label>
                        <input
                            type="text"
                            id="nome"
                            className='input-simplified'
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            maxLength="150"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="cpfCnpj">CPF/CNPJ*</label>
                        <input
                            type="text"
                            className='input-simplified'
                            id="cpfCnpj"
                            value={cpfCnpjMask(cpfCnpj)}
                            onChange={(e) => setCpfCnpj(e.target.value)}
                            required
                        />
                    </div>

                    {showInscricaoEstadual && (
                        <div className="form-group">
                            <label htmlFor="inscricaoEstadual">Inscrição Estadual</label>
                            <input
                                type="text"
                                id="inscricaoEstadual"
                                className='input-simplified'
                                value={inscricaoEstadual}
                                onChange={(e) => setInscricaoEstadual(e.target.value)}
                                maxLength="20"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="logradouro">Logradouro</label>
                        <input
                            type="text"
                            id="logradouro"
                            className='input-simplified'
                            value={logradouro}
                            onChange={(e) => setLogradouro(e.target.value)}
                            maxLength="100"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="numero">Número</label>
                            <input
                                type="text"
                                id="numero"
                                className='input-simplified'
                                value={numero}
                                onChange={(e) => setNumero(e.target.value)}
                                maxLength="20"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="bairro">Bairro</label>
                            <input
                                type="text"
                                id="bairro"
                                className='input-simplified'
                                value={bairro}
                                onChange={(e) => setBairro(e.target.value)}
                                maxLength="100"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="uf">UF*</label>
                            <select
                                id="uf"
                                value={uf}
                                className='input-simplified'
                                onChange={handleUfChange}
                                required
                            >
                                <option value="">Selecione</option>
                                {ufs.map((uf) => (
                                    <option key={uf.id} value={uf.codIBGE}>
                                        {uf.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="municipio">Município*</label>
                            <select
                                id="municipio"
                                value={municipio}
                                className='input-simplified'
                                onChange={(e) => setMunicipio(e.target.value)}
                                required
                                disabled={!uf}
                            >
                                <option value="">Selecione</option>
                                {municipios.map((mun) => (
                                    <option key={mun.id} value={mun.id}>
                                        {mun.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="submit-btn">
                            Salvar
                        </button>
                    </div>
                </form>
                {toast.message && <Toast type={toast.type} message={toast.message} />}
            </div>
        </div>
    );
};

export default CadClienteSimpl;