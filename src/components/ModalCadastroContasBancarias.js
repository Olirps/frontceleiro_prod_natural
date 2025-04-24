import React, { useState, useEffect } from 'react';
import '../styles/ModalCadastroContasBancarias.css';
import { addContabancaria, getAllBancos } from '../services/api';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função


const ModalCadastroContasBancarias = ({ isOpen, onClose, edit, onSubmit, conta }) => {
    const [bancoId, setBancoId] = useState('');
    const [banco, setBanco] = useState('');
    const [nome, setNome] = useState('');
    const [agencia, setAgencia] = useState('');
    const [numero, setNumero] = useState('');
    const [bancos, setBancos] = useState([]);
    const [tipoconta, setTipoConta] = useState('');
    const [documento, setDocumento] = useState('');
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [permiteEditar, setPermiteEditar] = useState(true);
    const { permissions } = useAuth();

    useEffect(() => {
        if (isOpen && edit) {
            const canEdit = hasPermission(permissions, 'contasbancarias', edit ? 'edit' : 'insert');
            setPermiteEditar(canEdit)
        }
    }, [isOpen, edit, permissions]);



    useEffect(() => {
        if (conta) {
            setBancoId(conta.banco_id || '');
            setNome(conta.nome || '');
            setAgencia(conta.agencia || '');
            setNumero(conta.conta || '');
            setTipoConta(conta.tipo_conta || '');
            setDocumento(conta.documento || '');
            // Preencher UF e Município com base nos IDs
            if (conta.banco_id) {
                const bancoCorrespondente = bancos.find((banco) => parseInt(banco.id) === parseInt(conta.banco_id));
                setBanco(bancoCorrespondente ? bancoCorrespondente.id : '');
            }
        } else {
            setBancoId('');
            setAgencia('');
            setNumero('');
        }
    }, [conta]);

    useEffect(() => {
        const fetchBancos = async () => {
            try {
                const response = await getAllBancos();
                setBancos(response.data);
            } catch (err) {
                console.error('Erro ao buscar bancos', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBancos();
    }, []);

    if (!isOpen) return null;
    if (loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }


    const handleBancoChange = (e) => setBancoId(e.target.value);
    const handleAgenciaChange = (e) => setAgencia(e.target.value);
    const handleNumeroChange = (e) => setNumero(e.target.value);
    const handleNomeChange = (e) => setNome(e.target.value);
    const handleDocumentoChange = (e) => setDocumento(e.target.value);
    const handleTipoContaChange = (e) => setTipoConta(e.target.value);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>{edit ? 'Editar Conta Bancária' : 'Cadastrar Conta Bancária'}</h2>
                <form onSubmit={onSubmit}>
                    <div id='cadastro-padrao'>
                        <div>
                            <label htmlFor="banco">Banco</label>
                            <select
                                className='input-geral'
                                id="banco"
                                name="banco"
                                value={bancoId}
                                onChange={handleBancoChange}
                                disabled={!permiteEditar}
                            >
                                <option value="">Selecione o Banco</option>
                                {bancos.map((banco) => (
                                    <option key={banco.id} value={banco.id}>
                                        {banco.codBancario + ' - ' + banco.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="nome">Nome</label>
                            <input
                                className='input-geral'
                                type="text"
                                id="nome"
                                name="nome"
                                value={nome}
                                onChange={handleNomeChange}
                                disabled={!permiteEditar}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="agencia">Agência</label>
                            <input
                                className='input-geral'
                                type="text"
                                id="agencia"
                                name="agencia"
                                value={agencia}
                                onChange={handleAgenciaChange}
                                disabled={!permiteEditar}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="numero">Número da Conta</label>
                            <input
                                className='input-geral'
                                type="text"
                                id="numero"
                                name="numero"
                                value={numero}
                                onChange={handleNumeroChange}
                                disabled={!permiteEditar}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="tipoconta">Tipo de Conta</label>
                            <select
                                className='input-geral'
                                id="tipoconta"
                                name="tipoconta"
                                value={tipoconta}
                                onChange={handleTipoContaChange}
                                disabled={!permiteEditar}
                                required
                            >
                                <option value="">Selecione o Tipo de Conta</option>
                                <option value="corrente">Corrente</option>
                                <option value="poupanca">Poupança</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="documento">Complemento</label>
                            <input
                                className='input-geral'
                                type="text"
                                id="documento"
                                name="documento"
                                value={documento}
                                onChange={handleDocumentoChange}
                                disabled={!permiteEditar}
                                maxLength={254}
                            />
                        </div>
                        <div id='button-group'>
                            {permiteEditar ? (
                                <button
                                    type="submit"
                                    id="btnsalvar"
                                    className="button"
                                >
                                    Salvar
                                </button>
                            ) : ''}
                        </div>
                    </div>
                </form>
            </div>
            {toast.message && <Toast type={toast.type} message={toast.message} />}
        </div>
    );
};

export default ModalCadastroContasBancarias;
