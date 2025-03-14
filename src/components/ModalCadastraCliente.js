import React, { useEffect, useState } from 'react';
import '../styles/ModalCadastraCliente.css'; // Certifique-se de criar este CSS também
import { cpfCnpjMask } from './utils';
import { getUfs, getMunicipiosUfId } from '../services/api';
import Toast from '../components/Toast';
import { formatarCelular } from '../utils/functions';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função



const ModalCadastraCliente = ({ isOpen, onClose, onSubmit, cliente, edit }) => {
    const [nome, setNome] = useState('');
    const [nomeFantasia, setNomeFantasia] = useState('');
    const [cpfCnpj, setCpf] = useState('');
    const [email, setEmail] = useState('');
    const [celular, setCelular] = useState('');
    const [logradouro, setLogradouro] = useState('');
    const [numero, setNumero] = useState('');
    const [bairro, setBairro] = useState('');
    const [municipio, setMunicipio] = useState('');
    const [uf, setUf] = useState('');
    const [cep, setCep] = useState('');
    const [permiteEditar, setPermiteEditar] = useState(true);
    const [ufs, setUfs] = useState([]); // Estado para armazenar os UFs
    const [municipios, setMunicipios] = useState([]); // Estado para armazenar os municípios
    const [toast, setToast] = useState({ message: '', type: '' });
    const { permissions } = useAuth();
    const [hasAccess, setHasAccess] = useState(true);

    const [isExpanded, setIsExpanded] = useState({
        dadosBasicos: true,
        dadosJuridicos: false,
        contato: false,
        endereco: false
    });

    useEffect(() => {
        if (isOpen && edit) {
            const canEdit = hasPermission(permissions, 'clientes', edit ? 'edit' : 'insert');
            setPermiteEditar(canEdit)
        }
    }, [isOpen, edit, permissions]);

    useEffect(() => {
        const preencherDadosCliente = async () => {
            if (cliente) {
                setNome(cliente.nome || '');
                setNomeFantasia(cliente.nomeFantasia || '');
                setCpf(cliente.cpfCnpj || '');
                setEmail(cliente.email || '');
                setCelular(cliente.celular || '');
                setLogradouro(cliente.logradouro || '');
                setNumero(cliente.numero || '');
                setBairro(cliente.bairro || '');
                setCep(cliente.cep || '');

                // Preencher UF e Município com base nos IDs
                if (cliente.uf_id) {
                    const ufCorrespondente = ufs.find((uf) => parseInt(uf.codIBGE) === parseInt(cliente.uf_id));
                    setUf(ufCorrespondente ? ufCorrespondente.codIBGE : '');
                }

                // Preencher Município com base no ID
                if (cliente.municipio_id) {
                    const municipioCorrespondente = municipios.find((municipio) => parseInt(municipio.id) === parseInt(cliente.municipio_id));
                    setMunicipio(municipioCorrespondente ? municipioCorrespondente.id : '');
                }
            } else {
                // Limpar os campos
                setNome('');
                setNomeFantasia('');
                setCpf('');
                setEmail('');
                setCelular('');
                setLogradouro('');
                setNumero('');
                setBairro('');
                setMunicipio('');
                setUf('');
                setCep('');
            }
        };
        preencherDadosCliente();
    }, [cliente, ufs]); // Adicione dependências relevantes


    useEffect(() => {
        const fetchUfs = async () => {
            try {
                let munsUf;
                const ufsData = await getUfs(); // Supõe-se que isso retorna o JSON fornecido

                if (edit) {
                    munsUf = await getMunicipiosUfId(cliente.uf_id);
                }

                if (Array.isArray(ufsData.data)) {
                    setUfs(ufsData.data);
                } else {
                    console.error("O retorno de getUfs não é um array:", JSON.stringify(ufsData.data));
                }

                if (edit) {
                    if (Array.isArray(munsUf.data)) {
                        setMunicipios(munsUf.data);
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar UFs:", error);
                setUfs([]); // Define como um array vazio em caso de erro

                // Adicionando o toast de erro
                setToast({
                    message: "Erro ao buscar as UFs. Tente novamente.",
                    type: "error", // Tipo de mensagem: pode ser "success", "error", etc.
                    duration: 3000, // Duração do toast em milissegundos
                });
            }
        };


        fetchUfs();
    }, [getUfs]);

    const handleUfChange = async (e) => {
        const selectedUf = e.target.value;
        setUf(selectedUf);
        if (selectedUf) {
            try {
                const municipiosData = await getMunicipiosUfId(selectedUf);
                if (Array.isArray(municipiosData.data)) {
                    setMunicipios(municipiosData.data);
                } else {
                    console.error('O retorno de getMunicipiosUfId não é um array:', JSON.stringify(municipiosData.data));
                    setMunicipios([]); // Resetar em caso de erro
                }
            } catch (error) {
                console.error('Erro ao buscar municípios:', error);
                setMunicipios([]);
            }
        } else {
            setMunicipios([]);
        }
    };



    if (!isOpen) return null;

    const toggleSection = (section) => {
        setIsExpanded((prevState) => ({
            ...prevState,
            [section]: !prevState[section],
        }));
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>
                    {edit
                        ? `Editar Cliente - ${nomeFantasia ? nomeFantasia : nome}`
                        : `Cadastrar Cliente : ${nomeFantasia ? nomeFantasia : nome}`}
                </h2>
                <form onSubmit={onSubmit}>
                    <div >
                        {/* Dados Básicos do Cliente */}
                        <fieldset>
                            <legend>
                                Dados Básicos
                                <button
                                    type="button"
                                    onClick={() => toggleSection('dadosBasicos')}
                                    className="expand-button"
                                >
                                    {isExpanded.dadosBasicos ? '-' : '+'}
                                </button>
                            </legend>
                            <div style={{ display: isExpanded.dadosBasicos ? 'block' : 'none' }}>
                                <div>
                                    <div className="form-line">
                                        <label htmlFor="nome">Nome</label>
                                        <input
                                            className='input-geral'
                                            type="text"
                                            id="nome"
                                            name="nome"
                                            value={nome}
                                            onChange={(e) => { setNome(e.target.value.toUpperCase()) }} //forma resumida de atualizar o input
                                            maxLength="150"
                                            disabled={!permiteEditar}
                                            required
                                        />
                                        <label htmlFor="nomeFantasia">Nome Fantasia</label>
                                        <input
                                            className='input-geral'
                                            type="text"
                                            id="nomeFantasia"
                                            name="nomeFantasia"
                                            value={nomeFantasia}
                                            onChange={(e) => { setNomeFantasia(e.target.value.toUpperCase()) }} //forma resumida de atualizar o input
                                            maxLength="150"
                                            disabled={!permiteEditar}
                                        />
                                    </div>
                                </div>
                            </div>

                        </fieldset>
                        <fieldset>
                            <legend>
                                Dados Jurídicos
                                <button
                                    type="button"
                                    onClick={() => toggleSection('dadosJuridicos')}
                                    className="expand-button"
                                >
                                    {isExpanded.dadosJuridicos ? '-' : '+'}
                                </button>
                            </legend>
                            <div style={{ display: isExpanded.dadosJuridicos ? 'block' : 'none' }}>
                                <div className="form-line">
                                    <label htmlFor="cpfCnpj">CPF/CNPJ</label>
                                    <input
                                        className='input-geral'
                                        type="text"
                                        id="cpfCnpj"
                                        name="cpfCnpj"
                                        value={cpfCnpjMask(cpfCnpj)} // Controlado pelo estado
                                        onChange={(e) => { setCpf(cpfCnpjMask(e.target.value)) }} //forma resumida de atualizar o input
                                        disabled={!permiteEditar}
                                        required
                                    />
                                </div>
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend>
                                Contato
                                <button
                                    type="button"
                                    onClick={() => toggleSection('contato')}
                                    className="expand-button"
                                >
                                    {isExpanded.contato ? '-' : '+'}
                                </button>
                            </legend>
                            <div style={{ display: isExpanded.contato ? 'block' : 'none' }}>
                                <div className="form-line">
                                    <div>
                                        <label htmlFor="email">Email</label>
                                        <input
                                            className='input-geral'
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value.toLowerCase()) }}
                                            maxLength={100}
                                            disabled={!permiteEditar}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="celular">Celular</label>
                                        <input
                                            className='input-geral'
                                            type="text"
                                            id="celular"
                                            name="celular"
                                            value={formatarCelular(celular)}
                                            onChange={(e) => { setCelular(e.target.value) }}
                                            maxLength={20}
                                            disabled={!permiteEditar}
                                        />
                                    </div>
                                </div>
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend>
                                Endereço
                                <button
                                    type="button"
                                    onClick={() => toggleSection('endereco')}
                                    className="expand-button"
                                >
                                    {isExpanded.endereco ? '-' : '+'}
                                </button>
                            </legend>
                            <div style={{ display: isExpanded.endereco ? 'block' : 'none' }}>
                                <div className="form-line">
                                    <div>
                                        <label htmlFor="logradouro">Logradouro</label>
                                        <input
                                            className='input-geral'
                                            type="text"
                                            id="logradouro"
                                            name="logradouro"
                                            value={logradouro}
                                            onChange={(e) => { setLogradouro(e.target.value.toUpperCase()) }}
                                            maxLength={100}
                                            disabled={!permiteEditar}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="numero">Número</label>
                                        <input
                                            className='input-geral'
                                            type="text"
                                            id="numero"
                                            name="numero"
                                            value={numero}
                                            onChange={(e) => { setNumero(e.target.value) }}
                                            maxLength={8}
                                            disabled={!permiteEditar}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="bairro">Bairro</label>
                                        <input
                                            className='input-geral'
                                            type="text"
                                            id="bairro"
                                            name="bairro"
                                            value={bairro}
                                            onChange={(e) => { setBairro(e.target.value.toUpperCase()) }}
                                            maxLength={100}
                                            disabled={!permiteEditar}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="cep">CEP</label>
                                        <input
                                            className='input-geral'
                                            type="text"
                                            id="cep"
                                            name="cep"
                                            value={cep}
                                            onChange={(e) => { setCep(e.target.value) }}
                                            maxLength={9}
                                            disabled={!permiteEditar}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="uf">UF</label>
                                        <select
                                            className="input-geral"
                                            id="uf"
                                            name="uf"
                                            value={uf}
                                            onChange={handleUfChange}
                                            disabled={!permiteEditar}
                                            required
                                        >
                                            <option value="">Selecione um estado</option>
                                            {ufs.map((uf) => (
                                                <option key={uf.id} value={uf.codIBGE}>
                                                    {uf.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="municipio">Município</label>
                                        <select
                                            className="input-geral"
                                            id="municipio"
                                            name="municipio"
                                            value={municipio}
                                            onChange={(e) => { setMunicipio(e.target.value) }}
                                            disabled={!permiteEditar}
                                            required
                                        >
                                            <option value="">Selecione um município</option>
                                            {Array.isArray(municipios) &&
                                                municipios.map((mun) => (
                                                    <option key={mun.id} value={mun.id}>
                                                        {mun.nome}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </fieldset>
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
                </form>
                {toast.message && (
                    <Toast
                        type={toast.type}
                        message={toast.message}
                        onClose={() => setToast({ message: '', type: '' })}
                    />
                )}
            </div>
        </div>
    );
};

export default ModalCadastraCliente;
