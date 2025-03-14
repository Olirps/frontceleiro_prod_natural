import React, { useEffect, useState } from 'react';
import '../styles/ModalCadastroFornecedor.css'; // Certifique-se de criar este CSS também
import { cpfCnpjMask } from './utils';
import { getUfs, getMunicipiosUfId } from '../services/api';
import Toast from '../components/Toast';
import { formatarCelular } from '../utils/functions';


const ModalCadastroFornecedor = ({ isOpen, onClose, isEdit, onSubmit, fornecedor }) => {
  const [tipofornecedor, setTipoFornecedor] = useState('');
  const [nome, setNome] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [fornecedorContato, setfornecedorContato] = useState('');
  const [cpfCnpj, setCpf] = useState('');
  const [inscricaoestadual, setInscricaoEstadual] = useState('');
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
  const [toast, setToast] = useState({ message: '', type: '' });


  // Lista fixa de tipos de fornecedor
  const tiposFornecedor = [
    { id: 'maquinario', nome: 'Maquinário' },
    { id: 'bancario', nome: 'Bancário' },
    { id: 'combustivel', nome: 'Combustível' },
    { id: 'peça', nome: 'Peça' },
    { id: 'servico', nome: 'Serviço' },
    { id: 'suplemento', nome: 'Suplemento' },
    { id: 'transporte', nome: 'Transporte' },
  ];
  useEffect(() => {
    const fetchUfs = async () => {
      try {
        const ufsData = await getUfs();
        if (Array.isArray(ufsData.data)) {
          setUfs(ufsData.data);
        } else {
          console.error("Erro ao carregar UFs:", ufsData);
        }
      } catch (error) {
        console.error("Erro ao buscar UFs:", error);
      }
    };
    fetchUfs();
  }, []);

  useEffect(() => {
    if (uf) {
      const fetchMunicipios = async () => {
        try {
          const municipiosData = await getMunicipiosUfId(uf);
          if (Array.isArray(municipiosData.data)) {
            setMunicipios(municipiosData.data);
          } else {
            console.error("Erro ao carregar municípios:", municipiosData);
          }
        } catch (error) {
          console.error("Erro ao buscar municípios:", error);
        }
      };
      fetchMunicipios();
    } else {
      setMunicipios([]);
    }
  }, [uf]);


  useEffect(() => {
    const preencherDadosFornecedor = async () => {
      if (fornecedor) {
        // Preencher os campos com os dados da pessoa selecionada para edição
        setTipoFornecedor(fornecedor.tipo_fornecedor || '');
        setNome(fornecedor.nome || '');
        setNomeFantasia(fornecedor.nomeFantasia || '');
        setfornecedorContato(fornecedor.fornecedor_contato || '');
        setCpf(fornecedor.cpfCnpj || '');
        setInscricaoEstadual(fornecedor.inscricaoestadual || '');
        setEmail(fornecedor.email || '');
        setCelular(fornecedor.celular || '');
        setLogradouro(fornecedor.logradouro || '');
        setNumero(fornecedor.numero || '');
        setBairro(fornecedor.bairro || '');
        setUf(fornecedor.uf || '');
        setCep(fornecedor.cep || '');
      } else {
        // Limpar os campos quando não há pessoa selecionada
        setTipoFornecedor('');
        setNome('');
        setNomeFantasia('');
        setfornecedorContato('');
        setCpf('');
        setInscricaoEstadual('');
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
    preencherDadosFornecedor();

  }, [fornecedor]);



  useEffect(() => {
    if (fornecedor?.municipio && municipios.length) {
      const municipioEncontrado = municipios.find(m => parseInt(m.id) === parseInt(fornecedor.municipio));
      setMunicipio(municipioEncontrado ? municipioEncontrado.id : '');
    }
  }, [municipios, fornecedor]);

  if (!isOpen) return null;

  const handleCpfChange = (e) => {
    const { value } = e.target;
    setCpf(cpfCnpjMask(value)); // Aplica a máscara ao CPF e atualiza o estado
  };

  const handleInscricaoEstadualChange = (e) => {
    const { value } = e.target;
    setInscricaoEstadual(value); // Aplica a máscara ao CPF e atualiza o estado
  };

  const handleNomeChange = (e) => {
    setNome(e.target.value); // Atualiza o estado do nome
  };

  const handleNomeFantasiaChange = (e) => {
    setNomeFantasia(e.target.value); // Atualiza o estado do nome
  };
  const handleFornecedorContatoChange = (e) => {
    setfornecedorContato(e.target.value); // Atualiza o estado do nome
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
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>X</button>
        <h2>{isEdit ? 'Editar Fornecedor' : 'Cadastrar Cadastro de Fornecedor'}</h2>
        <form onSubmit={onSubmit}>
          <div id='cadastro-padrao'>
            <div>
              <label htmlFor="tipofornecedor">Selecione um Tipo de Fornecedor:</label>
              <select
                id="tipofornecedor"
                name="tipofornecedor"
                value={tipofornecedor}
                onChange={(e) => setTipoFornecedor(e.target.value)}
                required
              >
                <option value="">Selecione um Tipo</option>
                {tiposFornecedor.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
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
                onChange={handleNomeChange} // Adiciona o onChange para atualizar o estado
                maxLength="150"
                required
              />
            </div>
            <div>
              <label htmlFor="nome">Nome Fantasia</label>
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
              <label htmlFor="fornecedorContato">Contato Fornecedor</label>
              <input
                className='input-geral'
                type="text"
                id="fornecedorContato"
                name="fornecedorContato"
                value={fornecedorContato}
                onChange={handleFornecedorContatoChange} // Adiciona o onChange para atualizar o estado
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
                disabled={isEdit}
              />
              {isEdit && <input type="hidden" name="cpfCnpj" value={cpfCnpj} />}

            </div>
            <div>
              <label htmlFor="inscricaoestadual">Inscrição Estadual</label>
              <input
                className='input-geral'
                type="text"
                id="inscricaoestadual"
                name="inscricaoestadual"
                value={inscricaoestadual} // Controlado pelo estado
                onChange={handleInscricaoEstadualChange}
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
                onChange={handleCelularChange} // Adiciona o onChange para atualizar o estado
                maxLength="150"
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
              />
            </div>
            <div>
              <label htmlFor="uf">UF</label>
              <select
                className="select-geral"
                id="uf"
                name="uf"
                value={uf}
                onChange={(e) => setUf(e.target.value)}
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
                className="select-geral"
                id="municipio"
                name="municipio"
                value={municipio}
                onChange={(e) => { setMunicipio(e.target.value) }}
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
            <div>
              <label htmlFor="cep">CEP</label>
              <input
                className='input-geral'
                type="text"
                id="cep"
                name="cep"
                value={cep}
                onChange={handleCepChange}
              />
            </div>
            <div id='button-group'>
              <button type="submit" id="btnsalvar" className="button">Salvar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCadastroFornecedor;
