import React, { useEffect, useState } from 'react';
import '../styles/ModalCadastraCliente.css'; // Certifique-se de criar este CSS também
import { cpfCnpjMask } from './utils';
import { getUfs, getMunicipiosUfId, getMunicipiosIBGE } from '../services/api';


const ModalCadastraCliente = ({ isOpen, onClose, onSubmit, cliente ,edit}) => {
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
    const [ufs, setUfs] = useState([]); // Estado para armazenar os UFs
    const [municipios, setMunicipios] = useState([]); // Estado para armazenar os municípios


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
                    const ufCorrespondente = ufs.find((uf) => uf.codIBGE === cliente.uf_id);
                    setUf(ufCorrespondente ? ufCorrespondente.codIBGE : '');
                }

                // Preencher Município com base no ID
                if (cliente.municipio_id) {
                    const municipioCorrespondente = municipios.find((municipio) => municipio.codMunIBGE === cliente.municipio_id);
                    setMunicipio(municipioCorrespondente ? municipioCorrespondente.codMunIBGE : '');
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
                if(edit){
                    munsUf = await getMunicipiosUfId(cliente.uf_id)
                }
                
                if (Array.isArray(ufsData.data)) {
                    setUfs(ufsData.data);
                } else {
                    console.error("O retorno de getUfs não é um array:", JSON.stringify(ufsData.data));
                }
                if(edit){
                    if (Array.isArray(munsUf.data)) {
                        setMunicipios(munsUf.data);
                    }
                }
                

            } catch (error) {
                console.error("Erro ao buscar UFs:", error);
                setUfs([]); // Define como um array vazio em caso de erro
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

    const handleCpfChange = (e) => {
        const { value } = e.target;
        setCpf(cpfCnpjMask(value)); // Aplica a máscara ao CPF e atualiza o estado
    };

    const handleNomeChange = (e) => {
        setNome(e.target.value); // Atualiza o estado do nome
    };

    const handleNomeFantasiaChange = (e) => {
        setNomeFantasia(e.target.value); // Atualiza o estado do nome
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value); // Atualiza o estado do email
    };

    const handleCelularChange = (e) => {
        setCelular(e.target.value); // Atualiza o estado do email
    };

    const handleLogradouroChange = (e) => {
        setLogradouro(e.target.value); // Atualiza o estado do logradouro
    };

    const handleNumeroChange = (e) => {
        setNumero(e.target.value); // Atualiza o estado do número
    };

    const handleBairroChange = (e) => {
        setBairro(e.target.value); // Atualiza o estado do bairro
    };

    const handleMunicipioChange = (e) => {
        setMunicipio(e.target.value); // Atualiza o estado do município
    };


    const handleCepChange = (e) => {
        setCep(e.target.value); // Atualiza o estado do CEP
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content-cad-cli">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>Cadastro de Cliente</h2>
                <form onSubmit={onSubmit}>
                    <div id='cadastro-cliente'>
                        <div>
                            <label htmlFor="nome">Nome</label>
                            <input
                                className='input-geral'
                                type="text"
                                id="nome"
                                name="nome"
                                value={nome}
                                onChange={handleNomeChange} // Adiciona o onChange para atualizar o estado
                                maxLength="150"
                                required
                            />
                            <label htmlFor="nomeFantasia">Nome Fantasia</label>
                            <input
                                className='input-geral'
                                type="text"
                                id="nomeFantasia"
                                name="nomeFantasia"
                                value={nomeFantasia}
                                onChange={handleNomeFantasiaChange} // Adiciona o onChange para atualizar o estado
                                maxLength="150"
                            />
                        </div>
                        <div>
                            <label htmlFor="cpfCnpj">CPF/CNPJ</label>
                            <input
                                className='input-geral'
                                type="text"
                                id="cpfCnpj"
                                name="cpfCnpj"
                                value={cpfCnpjMask(cpfCnpj)} // Controlado pelo estado
                                onChange={handleCpfChange}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email">Email</label>
                            <input
                                className='input-geral'
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={handleEmailChange} // Adiciona o onChange para atualizar o estado
                                maxLength="50"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="celular">Celular</label>
                            <input
                                className='input-geral'
                                type="text"
                                id="celular"
                                name="celular"
                                value={celular}
                                onChange={handleCelularChange} // Adiciona o onChange para atualizar o estado
                                maxLength="150"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="logradouro">Logradouro</label>
                            <input
                                className='input-geral'
                                type="text"
                                id="logradouro"
                                name="logradouro"
                                value={logradouro}
                                onChange={handleLogradouroChange}
                                required
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
                                onChange={handleNumeroChange}
                                required
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
                                onChange={handleBairroChange}
                                required
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
                                onChange={handleCepChange}
                                required
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
                                onChange={handleMunicipioChange}
                                required
                            >
                                <option value="">Selecione um município</option>
                               
                                {Array.isArray(municipios) &&
                                    municipios.map((mun) => (
                                        <option key={mun.id} value={mun.codMunIBGE}>
                                            {mun.nome}
                                        </option>
                                    ))
                                }

                            </select>
                        </div>

                        <div id='botao-salva'>
                            <button type="submit" id="btnsalvar" className="button">Salvar</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalCadastraCliente;
