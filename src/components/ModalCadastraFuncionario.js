// ModalFuncionario.js
import React, { useState, useEffect } from 'react';
import { cpfCnpjMask } from './utils';
import { formatarCelular, converterMoedaParaNumero, formatarMoedaBRL ,formatarCEP} from '../utils/functions';
import { getUfs, getMunicipiosUfId, addFuncionario, updateFuncionario } from '../services/api';
import { getClientes } from '../services/ApiClientes/ApiClientes';

import Toast from './Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission';

function ModalFuncionario({ isOpen, onClose, onSubmit, funcionario, edit }) {
  const [tab, setTab] = useState('dados'); // 'dados' | 'contratacao' | 'endereco'
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [tipoFuncionario, settipoFuncionario] = useState('');
  const [dataContratacao, setdataContratacao] = useState('');
  const [cargo, setCargo] = useState('');
  const [salario, setSalario] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [uf, setUf] = useState('');
  const [cep, setCep] = useState('');
  const [ufs, setUfs] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [permiteEditar, setPermiteEditar] = useState(true);
  const { permissions } = useAuth();

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen && edit) {
      const canEdit = hasPermission(permissions, 'funcionarios', 'edit');
      setPermiteEditar(canEdit);
    }
  }, [isOpen, edit, permissions]);

  useEffect(() => {
    if (isOpen) {
      const carregarUfs = async () => {
        const result = await getUfs();
        setUfs(result.data || []);
      };

      carregarUfs();

      if (edit && funcionario) {
        setNome(funcionario.cliente?.nome || '');
        setCpf(funcionario.cliente?.cpfCnpj || '');
        setEmail(funcionario.cliente?.email || '');
        setCelular(funcionario.cliente?.celular || '');
        setdataContratacao(funcionario.dataContratacao?.split('T')[0] || '');
        settipoFuncionario(funcionario.tipoFuncionario || '');
        setCargo(funcionario.cargo || '');
        setSalario(formatarMoedaBRL(funcionario.salario) || '');
        setLogradouro(funcionario.cliente?.logradouro || '');
        setNumero(funcionario.cliente?.numero || '');
        setBairro(funcionario.cliente?.bairro || '');
        setCep(formatarCEP(funcionario.cliente?.cep) || '');
        setUf(funcionario.cliente?.uf_id || '');
        setMunicipio(funcionario.cliente?.municipio_id || '');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (uf) {
      getMunicipiosUfId(uf).then((res) => {
        setMunicipios(res.data || []);
      });
    }
  }, [uf]);


  const handleCpfBlur = async () => {
    const cpfLimpo = cpf.replace(/[^\d]+/g, '');

    if (cpfLimpo.length !== 11) return;

    try {
      const response = await getClientes({ cpfCnpj: cpfLimpo });
      if (response?.data?.clientes?.length > 0) {
        const cliente = response.data.clientes[0];
        setNome(cliente.nome || '');
        setEmail(cliente.email || '');
        setCelular(cliente.celular || '');
        setLogradouro(cliente.logradouro || '');
        setNumero(cliente.numero || '');
        setBairro(cliente.bairro || '');
        setCep(cliente.cep || '');
        setUf(cliente.uf_id || '');
        setMunicipio(cliente.municipio_id || '');

        setToast({
          message: 'Cliente já existente, dados preenchidos automaticamente.',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Erro ao consultar cliente por CPF:', err);
      setToast({
        message: 'Erro ao buscar cliente. Tente novamente.',
        type: 'error',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const funcionarioPayload = {
      tipoFuncionario,
      dataContratacao,
      cargo: cargo.toUpperCase(),
      salario: converterMoedaParaNumero(salario),
      cliente: {
        nome,
        cpfCnpj: cpf.replace(/[^\d]/g, ''),
        email,
        celular,
        logradouro,
        numero,
        bairro,
        cep,
        uf_id: uf,
        municipio_id: municipio
      }
    };

    try {
      if (edit && funcionario?.id) {
        await updateFuncionario(funcionario.id, funcionarioPayload);
        setToast({ message: 'Funcionário atualizado com sucesso.', type: 'success' });
      } else {
        await addFuncionario(funcionarioPayload);
        setToast({ message: 'Funcionário cadastrado com sucesso.', type: 'success' });
      }

      if (onSubmit) onSubmit(); // callback para recarregar lista, se necessário
      onClose(); // fecha o modal
    } catch (error) {
      console.error(error);
      setToast({ message: 'Erro ao salvar funcionário.', type: 'error' });
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-red-500">✕</button>
        <h2 className="text-xl font-semibold mb-4">{edit ? 'Editar Funcionário' : 'Cadastrar Funcionário'}</h2>

        {/* Tabs */}
        <div className="flex space-x-4 border-b mb-4">
          {['dados', 'contratacao', 'endereco'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 ${tab === t ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
            >
              {t === 'dados' && 'Dados Pessoais'}
              {t === 'contratacao' && 'Contratação'}
              {t === 'endereco' && 'Endereço'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'dados' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>CPF</label>
                  <input
                    type="text"
                    className="input"
                    value={cpfCnpjMask(cpf)}
                    onChange={(e) => setCpf(cpfCnpjMask(e.target.value))}
                    onBlur={handleCpfBlur}
                    disabled={edit}
                    required
                  />
                </div>

                <div>
                  <label>Nome</label>
                  <input
                    type="text"
                    className="input"
                    value={nome}
                    onChange={(e) => setNome(e.target.value.toUpperCase())}
                    disabled={!permiteEditar}
                    required
                  />
                </div>

                <div>
                  <label>Email</label>
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!permiteEditar}
                  />
                </div>

                <div>
                  <label>Celular</label>
                  <input
                    type="text"
                    className="input"
                    value={formatarCelular(celular)}
                    onChange={(e) => setCelular(e.target.value)}
                    disabled={!permiteEditar}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {tab === 'contratacao' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Data de Contratação</label>
                  <input type="date" className="input" value={dataContratacao} onChange={e => setdataContratacao(e.target.value)} disabled={!permiteEditar} required />
                </div>
                <div>
                  <label>Tipo</label>
                  <select className="input" value={tipoFuncionario} onChange={e => settipoFuncionario(e.target.value)} disabled={!permiteEditar} required>
                    <option value="">Selecione</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="servico">Serviço</option>
                    <option value="gestao">Gestão</option>
                  </select>
                </div>
                <div>
                  <label>Cargo</label>
                  <input type="text" className="input" value={cargo.toUpperCase()} onChange={e => setCargo(e.target.value)} disabled={!permiteEditar} required />
                </div>
                <div>
                  <label>Salário</label>
                  <input type="text" className="input" value={salario} onChange={e => setSalario(formatarMoedaBRL(e.target.value))} disabled={!permiteEditar} required />
                </div>
              </div>
            </>
          )}

          {tab === 'endereco' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Logradouro</label>
                  <input type="text" className="input" value={logradouro.toUpperCase()} onChange={e => setLogradouro(e.target.value)} disabled={!permiteEditar} />
                </div>
                <div>
                  <label>Número</label>
                  <input type="text" className="input" value={numero} onChange={e => setNumero(e.target.value)} disabled={!permiteEditar} required />
                </div>
                <div>
                  <label>Bairro</label>
                  <input type="text" className="input" value={bairro.toUpperCase()} onChange={e => setBairro(e.target.value)} disabled={!permiteEditar} required />
                </div>
                <div>
                  <label>CEP</label>
                  <input type="text" className="input" value={cep} onChange={e => setCep(e.target.value)} disabled={!permiteEditar} required />
                </div>
                <div>
                  <label>UF</label>
                  <select className="input" value={uf} onChange={e => setUf(e.target.value)} disabled={!permiteEditar} required>
                    <option value="">Selecione</option>
                    {ufs.map((u) => (
                      <option key={u.codIBGE} value={u.codIBGE}>{u.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Município</label>
                  <select className="input" value={municipio} onChange={e => setMunicipio(e.target.value)} disabled={!permiteEditar} required>
                    <option value="">Selecione</option>
                    {municipios.map((m) => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {permiteEditar && (
            <div className="text-right mt-6">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Salvar</button>
            </div>
          )}
        </form>

        {toast.message && (
          <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: '' })} />
        )}
      </div>
    </div>
  );
}

export default ModalFuncionario;
