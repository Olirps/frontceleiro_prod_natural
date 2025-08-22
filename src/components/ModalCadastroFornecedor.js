import React, { useEffect, useState } from 'react';
import { cpfCnpjMask } from './utils';
import { getUfs, getMunicipiosUfId } from '../services/api';
import { addFornecedor, updateFornecedor } from '../services/ApiFornecedores/ApiFornecedores';
import { formatarCelular } from '../utils/functions';
import Toast from '../components/Toast';

const ModalCadastroFornecedor = ({ isOpen, onClose, isEdit, onSubmit, fornecedor }) => {
  const [abaAtiva, setAbaAtiva] = useState('dados');

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
  const [ufs, setUfs] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '' });


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
    getUfs().then((res) => setUfs(res.data || []));
  }, []);

  useEffect(() => {
    if (uf) {
      getMunicipiosUfId(uf).then((res) => setMunicipios(res.data || []));
    } else {
      setMunicipios([]);
    }
  }, [uf]);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (fornecedor) {
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
  }, [fornecedor]);

  useEffect(() => {
    if (fornecedor?.municipio && municipios.length) {
      const m = municipios.find(m => parseInt(m.id) === parseInt(fornecedor.municipio));
      setMunicipio(m ? m.id : '');
    }
  }, [municipios, fornecedor]);


  const handleSubmit = async (e) => {
    e.preventDefault(); // <-- impede refresh

    const fornecedorPayload = {
      tipo_fornecedor: tipofornecedor,
      nome: nome,
      nomeFantasia: nomeFantasia,
      fornecedor_contato: fornecedorContato,
      cpfCnpj: cpfCnpj,
      inscricaoestadual: inscricaoestadual,
      email: email,
      celular: celular.replace(/\D/g, ''),
      logradouro: logradouro,
      numero: numero,
      bairro: bairro,
      municipio: municipio,
      uf: uf,
      cep: cep.replace(/\D/g, '')
    };

    try {
      if (isEdit && fornecedor?.id) {
        await updateFornecedor(fornecedor.id, fornecedorPayload);
        setToast({ message: "Fornecedor atualizado com sucesso!", type: "success" });
        onClose();
      } else {
        const fornecedorResp = await addFornecedor(fornecedorPayload);
        setToast({ message: `Fornecedor cadastrado com sucesso! ${fornecedorResp.nome}`, type: "success" });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao cadastrar fornecedor.";
      setToast({ message: errorMessage, type: "error" });
    }
  };



  if (!isOpen) return null;

  const renderAbaDados = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div>
        <label>Tipo de Fornecedor</label>
        <select className="input" value={tipofornecedor} onChange={(e) => setTipoFornecedor(e.target.value)} required>
          <option value="">Selecione</option>
          {tiposFornecedor.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
      </div>
      <div>
        <label>Nome</label>
        <input className="input" value={nome} onChange={e => setNome(e.target.value)} required />
      </div>
      <div>
        <label>Nome Fantasia</label>
        <input className="input" value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} />
      </div>
      <div>
        <label>Contato</label>
        <input className="input" value={fornecedorContato} onChange={e => setfornecedorContato(e.target.value)} />
      </div>
      <div>
        <label>CPF/CNPJ</label>
        <input
          className="input"
          value={cpfCnpjMask(cpfCnpj)}
          onChange={(e) => setCpf(e.target.value)}
          disabled={isEdit}
        />
        {isEdit && <input type="hidden" name="cpfCnpj" value={cpfCnpj} />}
      </div>
      <div>
        <label>Inscrição Estadual</label>
        <input className="input" value={inscricaoestadual} onChange={e => setInscricaoEstadual(e.target.value)} />
      </div>
      <div>
        <label>Email</label>
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div>
        <label>Celular</label>
        <input className="input" value={formatarCelular(celular)} onChange={e => setCelular(e.target.value)} />
      </div>
    </div>
  );

  const renderAbaEndereco = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div>
        <label>Logradouro</label>
        <input className="input" value={logradouro} onChange={e => setLogradouro(e.target.value)} />
      </div>
      <div>
        <label>Número</label>
        <input className="input" value={numero} onChange={e => setNumero(e.target.value)} />
      </div>
      <div>
        <label>Bairro</label>
        <input className="input" value={bairro} onChange={e => setBairro(e.target.value)} />
      </div>
      <div>
        <label>UF</label>
        <select className="input" value={uf} onChange={e => setUf(e.target.value)} required>
          <option value="">Selecione</option>
          {ufs.map(u => <option key={u.id} value={u.codIBGE}>{u.nome}</option>)}
        </select>
      </div>
      <div>
        <label>Município</label>
        <select className="input" value={municipio} onChange={e => setMunicipio(e.target.value)} required>
          <option value="">Selecione</option>
          {municipios.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
      </div>
      <div>
        <label>CEP</label>
        <input className="input" value={cep} onChange={e => setCep(e.target.value)} />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-lg relative">
        <button className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-xl" onClick={onClose}>✕</button>
        <h2 className="text-2xl font-semibold mb-4">{isEdit ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}</h2>

        {/* Tabs */}
        <div className="flex space-x-4 border-b mb-4">
          <button
            type="button"
            onClick={() => setAbaAtiva('dados')}
            className={`pb-2 border-b-2 ${abaAtiva === 'dados' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500'}`}
          >
            Dados
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('endereco')}
            className={`pb-2 border-b-2 ${abaAtiva === 'endereco' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500'}`}
          >
            Endereço
          </button>
        </div>

        <form onSubmit={handleSubmit}        >
          {/* Conteúdo da aba ativa */}
          {abaAtiva === 'dados' && renderAbaDados()}
          {abaAtiva === 'endereco' && renderAbaEndereco()}

          <div className="mt-6 flex justify-end">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700">
              Salvar
            </button>
          </div>
        </form>
      </div>
      {toast.message && <Toast type={toast.type} message={toast.message} />}

    </div>
  );
};

export default ModalCadastroFornecedor;