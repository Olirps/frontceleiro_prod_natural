// ModalFuncionario.js
import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { cpfCnpjMask } from './utils';
import { formatarCelular, converterMoedaParaNumero, formatarMoedaBRL, formatarCEP, } from '../utils/functions';
import { getUfs, getMunicipiosUfId, addFuncionario, updateFuncionario, getAllGrupoAcesso } from '../services/api';
import { getClientes } from '../services/ApiClientes/ApiClientes';

import Toast from './Toast';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";

function ModalFuncionario({ isOpen, isNew, onClose, onSubmit, funcionario, edit }) {
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
  const [permiteEditar, setPermiteEditar] = useState(false);
  const [gruposAcesso, setGruposAcesso] = useState([]);
  const [grupoAcessoId, setGrupoAcessoId] = useState('');
  const [criarUsuario, setCriarUsuario] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [alterarSenha, setAlterarSenha] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  //Permissoes
  const { permissions } = useAuth();
  const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const carregarUfs = async () => {
      const result = await getUfs();
      setUfs(result.data || []);
    };
    if (isOpen && edit) {
      checkPermission(permissions, 'funcionarios', 'edit', () => {
        setPermiteEditar(true);
      });

    } else {
      setPermiteEditar(true);
    }
    if (isOpen && isNew) {
      carregarUfs();
    }
    getAllGrupoAcesso().then((res) => {
      setGruposAcesso(res.data || []);
    }).catch(err => {
      console.error('Erro ao carregar grupos de acesso', err);
    });
  }, [isOpen, edit, permissions]);

  useEffect(() => {
    if (!isOpen || !edit || !funcionario || gruposAcesso.length === 0) return;

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
      setSalario(formatarMoedaBRL(funcionario.salario || 0));
      setLogradouro(funcionario.cliente?.logradouro || '');
      setNumero(funcionario.cliente?.numero || '');
      setBairro(funcionario.cliente?.bairro || '');
      setCep(formatarCEP(funcionario.cliente?.cep || ''));
      setUf(funcionario.cliente?.uf_id || '');
      setMunicipio(funcionario.cliente?.municipio_id || '');

      if (funcionario.login && funcionario.login !== '') {
        setCriarUsuario(true);
        setLogin(funcionario.login);

        // Buscar no array de grupos o correspondente ao grupoAcessoId
        const grupoEncontrado = gruposAcesso.find(
          grupo => grupo.id === funcionario.grupoAcessoId
        );

        if (grupoEncontrado) {
          setGrupoAcessoId(grupoEncontrado.id); // ou setGrupoAcessoId(grupoEncontrado) se for objeto inteiro
        } else {
          setGrupoAcessoId('');
        }
      } else {
        setCriarUsuario(false);
      }

    }
  }, [isOpen, edit, funcionario, gruposAcesso]);


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
    setLoading(true);
    if (criarUsuario) {
      if (!login || !grupoAcessoId) {
        setToast({ message: 'Preencha login e grupo de acesso.', type: 'error' });
        return;
      }

      if ((!edit && !password) || (edit && alterarSenha && !password)) {
        setToast({ message: 'Senha obrigatória.', type: 'error' });
        return;
      }
    }
    const funcionarioPayload = {
      tipoFuncionario,
      dataContratacao,
      cargo: cargo.toUpperCase(),
      salario: converterMoedaParaNumero(salario),
      criarUsuario,
      alterarSenha,
      grupoAcessoId: criarUsuario ? grupoAcessoId : null,
      login: criarUsuario ? login : null,
      password: criarUsuario ? password : null, // só envia no modo criação
      cliente: {
        nome,
        cpfCnpj: cpf.replace(/[^\d]/g, ''),
        email,
        celular: celular.replace(/[^\d]+/g, ''),
        logradouro,
        numero,
        bairro,
        cep,
        uf: uf,
        municipio: municipio
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
      const mensagemErro = error?.response?.data?.error || 'Erro ao salvar cliente.';

      setToast({
        message: mensagemErro,
        type: 'error'
      });
    } finally {
      setLoading(false);
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
          {['dados', 'contratacao', 'endereco', ...(criarUsuario ? ['sistema'] : [])].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 ${tab === t ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
            >
              {t === 'dados' && 'Dados Pessoais'}
              {t === 'contratacao' && 'Contratação'}
              {t === 'endereco' && 'Endereço'}
              {t === 'sistema' && 'Sistema'}
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
                <div className="col-span-2 mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600"
                      checked={criarUsuario}
                      onChange={(e) => setCriarUsuario(e.target.checked)}
                      disabled={!permiteEditar}
                    />
                    <span className="ml-2 text-gray-700">Usuário de sistema?</span>
                  </label>
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
                  <select className="input" value={tipoFuncionario} onChange={e => settipoFuncionario(e.target.value)} disabled={!permiteEditar} >
                    <option value="">Selecione</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="servico">Serviço</option>
                    <option value="gestao">Gestão</option>
                  </select>
                </div>
                <div>
                  <label>Cargo</label>
                  <input type="text" className="input" value={cargo.toUpperCase()} onChange={e => setCargo(e.target.value)} disabled={!permiteEditar} />
                </div>
                <div>
                  <label>Salário</label>
                  <input type="text" className="input" value={salario} onChange={e => setSalario(formatarMoedaBRL(e.target.value))} disabled={!permiteEditar} />
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
                  <input type="text" className="input" value={cep} onChange={e => setCep(formatarCEP(e.target.value))} disabled={!permiteEditar} required />
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
          {tab === 'sistema' && criarUsuario && (
            <div className="col-span-2 space-y-3">
              <div>
                <label>Login</label>
                <input
                  type="text"
                  className="input"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
              </div>
              {edit && criarUsuario && (
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600"
                      checked={alterarSenha}
                      onChange={(e) => setAlterarSenha(e.target.checked)}
                    />
                    <span className="ml-2 text-gray-700">Alterar senha do usuário?</span>
                  </label>
                </div>
              )}
              <div id="password-container" className="password-container">
                <label>Senha</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={edit && !alterarSenha}
                  placeholder={edit ? 'Senha oculta por segurança' : ''}
                  required={criarUsuario && (!edit || alterarSenha)}
                />
                {(criarUsuario || (edit && alterarSenha)) && (
                  <span
                    id="password-toggle"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                )}
              </div>


              <div>
                <label>Grupo de Acesso</label>
                <select
                  className="input"
                  value={grupoAcessoId}
                  onChange={(e) => setGrupoAcessoId(e.target.value)}
                  required
                >
                  <option value="">Selecione um grupo</option>
                  {gruposAcesso.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>{grupo.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {permiteEditar && (
            <div className="text-right mt-6">

              <button type="submit"
                className={`px-4 py-2 rounded text-white ${loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                  }`}
                disabled={loading}
              >{loading ? 'Salvando' : 'Salvar'}</button>
            </div>
          )}
        </form>

        {toast.message && (
          <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: '' })} />
        )}
        {/* Renderização do modal de autorização */}
        <PermissionModalUI />
      </div>
    </div>
  );
}

export default ModalFuncionario;
