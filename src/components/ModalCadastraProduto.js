import React, { useEffect, useState } from 'react';
import '../styles/ModalCadastraProduto.css';
import { addProdutos, updateNFe } from '../services/api';
import {
  getGrupoProdutos,
  getSubGrupoProdutos,
  getGrupoProdutoById,
  getSubGrupoProdutoById
} from '../services/GrupoSubGrupoProdutos';
import Toast from '../components/Toast';
import { formatarMoedaBRL, converterMoedaParaNumero, formatarValor } from '../utils/functions';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";

const ModalCadastraProduto = ({ isOpen, onClose, onSubmit, produto, prod, edit, isInativar, onInativar, additionalFields = [] }) => {
  const [formData, setFormData] = useState({});
  const [toast, setToast] = useState({ message: '', type: '' });
  const [tab, setTab] = useState('identificação');
  const [open, setOpen] = useState(false);
  const [subGrupoNome, setSubGrupoNome] = useState('');
  const [subGrupoId, setSubGrupoId] = useState('');
  const [subGrupos, setSubgrupos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [grupoNome, setGrupoNome] = useState('');
  const [grupoId, setGrupoId] = useState('');
  const [cEAN, setcEAN] = useState('');
  const [cod_interno, setCodInterno] = useState('');
  const [qtdMinima, setqtdMinima] = useState('');
  const [uCom, setuCom] = useState('');
  const [qCom, setqCom] = useState('');
  const [vUnCom, setvUnCom] = useState('');
  const [ncm, setNcm] = useState('');
  const [cfop, setCfop] = useState('');
  const [cest, setCest] = useState('');
  const [vlrVenda, setVlrVenda] = useState('');
  const [vlrVendaAtacado, setvlrVendaAtacado] = useState('');
  const [margemSobreVlrCusto, setmargemSobreVlrCusto] = useState('');
  const [margemSobreVlrCustoAtacado, setmargemSobreVlrCustoAtacado] = useState('');
  const [percentual, setPercentual] = useState('');
  const [xProd, setxProd] = useState('');
  const [isService, setIsService] = useState(false);
  const [isInativado, setIsInativado] = useState(isInativar);
  const [permiteEditar, setPermiteEditar] = useState(false);
  const [openGrupo, setOpenGrupo] = useState(false);
  const [openSubGrupo, setOpenSubGrupo] = useState(false);
  //Permissoes
  const { permissions } = useAuth();
  const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

  useEffect(() => {
    if (produto) {
      setxProd(produto.xProd || '');
      setCodInterno(produto.cod_interno || '');
      setIsService(produto.tipo === 'servico' ? true : false);
      setcEAN(produto.cEAN || '');
      setqtdMinima(produto.qtdMinima || '');
      setuCom(produto.uCom || '');
      setqCom(produto.qCom || '');
      setvUnCom(produto.vUnCom || '');
      setNcm(produto.NCM || '');
      setCfop(produto.CFOP || '');
      setCest(produto.CEST || '');
      setVlrVenda(produto.vlrVenda || '');
      setvlrVendaAtacado(produto.vlrVendaAtacado || '');
      setmargemSobreVlrCusto(produto.margemSobreVlrCusto || '');
      setmargemSobreVlrCustoAtacado(produto.margemSobreVlrCustoAtacado || '');
      setPercentual(produto.pct_servico || '');
    }
  }, [produto]);

  useEffect(() => {
    setIsInativado(isInativar);
  }, [isInativar]);

  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const response = await getGrupoProdutos({ status: 'ativo', page: 1, rowsPerPage: 100 });
        const listaGrupos = response.data;
        setGrupos(listaGrupos);

      } catch (error) {
        console.error('Erro ao carregar grupos de produtos:', error);
        setToast({ message: 'Erro ao carregar grupos de produtos.', type: 'error' });
      }
    };

    fetchGrupos();
  }, [edit]);

  useEffect(() => {
    if (isOpen && edit) {
      checkPermission('produtos', edit ? 'edit' : 'insert', () => {
        setPermiteEditar(true);
      });
    } else {
      setPermiteEditar(true);
    }
  }, [isOpen, edit, permissions]);

  // Limpa toast após 3 segundos
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);


  const handleBuscaSubGrupo = async (grupoId) => {
    try {
      const response = await getSubGrupoProdutos({
        status: 'ativo',
        grupoId, // Supondo que o backend aceite esse filtro
        currentPage: 1,
        rowsPerPage: 100
      });

      setSubgrupos(response.data);
    } catch (error) {
      console.error('Erro ao carregar subgrupos:', error);
      setToast({ message: 'Erro ao carregar subgrupos.', type: 'error' });
    }
  };

  useEffect(() => {
    const carregarNomesGrupoESubgrupo = async () => {
      if (produto && edit) {
        try {
          if (produto.gpid) {
            const grupo = await getGrupoProdutoById(produto.gpid);
            console.log('Grupo:', grupo); // Veja aqui se vem nome e id
            setGrupoNome(grupo.data?.nome || '---'); // força preenchimento
            setGrupoId(grupo.data?.id || '');
            await handleBuscaSubGrupo(grupo.data?.id); // Carrega subgrupos do grupo
          }

          if (produto.subgpid) {
            const subgrupo = await getSubGrupoProdutoById(produto.subgpid);
            setSubGrupoNome(subgrupo.data?.nome || '');
            setSubGrupoId(subgrupo.data?.id || '');
          }
        } catch (error) {
          console.error('Erro ao carregar nomes do grupo ou subgrupo:', error);
          setToast({
            message: 'Erro ao carregar grupo ou subgrupo do produto.',
            type: 'error'
          });
        }
      }
    };

    carregarNomesGrupoESubgrupo();
  }, [produto, edit]);

  const handlevUnComChange = (e) => {
    const novoValor = formatarMoedaBRL(e.target.value);
    const valorFormatado = formatarValor(novoValor);
    setvUnCom(valorFormatado);

    const margem = ((vlrVenda - valorFormatado) / valorFormatado) * 100;
    setmargemSobreVlrCusto(margem.toFixed(4));

    const margemAtacado = ((vlrVendaAtacado - valorFormatado) / valorFormatado) * 100;
    setmargemSobreVlrCustoAtacado(margemAtacado.toFixed(4));
  };

  const handlevlrVendaChange = (e) => {
    const novoValor = formatarMoedaBRL(e.target.value);
    const valorFormatado = formatarValor(novoValor);
    setVlrVenda(valorFormatado);

    const valorCusto = Number(vUnCom);
    const margem = ((valorFormatado - valorCusto) / valorCusto) * 100;
    setmargemSobreVlrCusto(margem.toFixed(4));
  };

  const handlevlrVendaAtacadoChange = (e) => {
    const novoValor = formatarMoedaBRL(e.target.value);
    const valorFormatado = formatarValor(novoValor);
    setvlrVendaAtacado(valorFormatado);

    const valorCusto = Number(vUnCom);
    const margemAtacado = ((valorFormatado - valorCusto) / valorCusto) * 100;
    setmargemSobreVlrCustoAtacado(margemAtacado.toFixed(4));
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const camposObrigatorios = isService
      ? [
        { nome: 'Nome do Serviço', valor: xProd },
        { nome: 'Valor do Serviço', valor: vlrVenda },
        { nome: 'Percentual', valor: percentual }
      ]
      : [
        { nome: 'Nome do Produto', valor: xProd },
        { nome: 'Unidade de Medida', valor: uCom },
        { nome: 'Quantidade Mínima', valor: qtdMinima },
        { nome: 'Quantidade', valor: qCom },
        { nome: 'Valor de Custo', valor: vUnCom },
        { nome: 'Valor de Venda', valor: vlrVenda },
      ];

    const camposFaltando = camposObrigatorios
      .filter(c => !c.valor || c.valor.toString().trim() === '')
      .map(c => c.nome);

    if (camposFaltando.length > 0) {
      setToast({
        message: `Preencha os seguintes campos obrigatórios: ${camposFaltando.join(', ')}.`,
        type: 'error'
      });
      return;
    }


    onSubmit({
      xProd,
      isService,
      cod_interno: cod_interno !== '' ? cod_interno : null,
      cEAN,
      qtdMinima,
      uCom,
      qCom,
      vUnCom,
      grupoId: grupoId !== '' ? grupoId : 0,
      subGrupoId: subGrupoId !== '' ? subGrupoId : 0,
      vlrVenda,
      margemSobreVlrCusto,
      ncm,
      cfop,
      cest,
      vlrVendaAtacado,
      margemSobreVlrCustoAtacado,
      percentual
    });
  };

  const handleTabClick = (tabName) => setTab(tabName);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>X</button>
        <h2>{edit ? (isService ? 'Editar Serviço' : 'Editar Produto') : (isService ? 'Cadastrar Serviço' : 'Cadastrar Produto')}</h2>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="productType"
              value="product"
              checked={!isService}
              onChange={() => setIsService(false)}
              disabled={!permiteEditar}
            />
            Produto
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="productType"
              value="service"
              checked={isService}
              onChange={() => {
                setIsService(true);
                setTab('identificação');
                // Zerar campos fiscais caso seja serviço
                setNcm('');
                setCfop('');
                setCest('');
              }}
              disabled={!permiteEditar}
            />
            Serviço
          </label>
        </div>
        <div className="flex border-b mb-4">
          {['identificação', 'estoque', 'fiscal', 'preços', ...(isService ? ['serviço'] : [])].map((t) => (
            <button
              key={t}
              onClick={() => handleTabClick(t)}
              className={`px-4 py-2 ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'identificação' && (
            <div className="grid grid-cols-2 gap-4">

              {/* Grupo */}
              <div>
                <label htmlFor="grupo" className="block text-sm font-medium text-gray-700">
                  Grupo
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenGrupo(!openGrupo)}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 text-left"
                  >
                    {grupoNome || 'Selecione um grupo'}
                  </button>
                  {openGrupo && (
                    <div className="absolute z-10 w-full max-h-40 overflow-y-auto bg-white border border-gray-300 rounded shadow-md">
                      {grupos.map((g) => (
                        <div
                          key={g.id}
                          onClick={() => {
                            setGrupoNome(g.nome);
                            setGrupoId(g.id);
                            setOpenGrupo(false);
                            setSubGrupoNome('');
                            setSubGrupoId('');
                            handleBuscaSubGrupo(g.id);
                          }}
                          className="p-2 hover:bg-blue-100 cursor-pointer"
                        >
                          {g.nome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Subgrupo */}
              <div>
                <label htmlFor="subGrupo" className="block text-sm font-medium text-gray-700">
                  Subgrupo
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenSubGrupo(!openSubGrupo)}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 text-left"
                  >
                    {subGrupoNome || 'Selecione um subgrupo'}
                  </button>
                  {openSubGrupo && (
                    <div className="absolute z-10 w-full max-h-40 overflow-y-auto bg-white border border-gray-300 rounded shadow-md">
                      {subGrupos.map((g) => (
                        <div
                          key={g.id}
                          onClick={() => {
                            setSubGrupoNome(g.nome);
                            setSubGrupoId(g.id);
                            setOpenSubGrupo(false);
                          }}
                          className="p-2 hover:bg-blue-100 cursor-pointer"
                        >
                          {g.nome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label>Nome</label>
                <input className="input-geral" type="text" value={xProd} onChange={(e) => setxProd(e.target.value.toUpperCase())} required disabled={!permiteEditar} />
              </div>
              <div>
                <label>Código Interno</label>
                <input className="input-geral" type="text" value={cod_interno} onChange={(e) => setCodInterno(e.target.value)} disabled={!permiteEditar} maxLength={6} />
              </div>
              <div>
                <label>Código de Barras</label>
                <input className="input-geral" type="text" value={cEAN} onChange={(e) => setcEAN(e.target.value)} disabled={!permiteEditar} maxLength={13} />
              </div>
              <div>
                <label htmlFor="uCom">Unidade Medida</label>
                <select
                  className="input-geral"
                  id="uCom"
                  name="uCom"
                  value={uCom}
                  onChange={(e) => { setuCom(e.target.value) }}
                  required={!isService}
                  disabled={!permiteEditar}
                >
                  <option value="">Selecione uma opção</option>
                  <option value="CX">Caixa</option>
                  <option value="UN">Unidade</option>
                  <option value="KG">Quilo</option>
                  <option value="LT">Litro</option>
                  <option value="MT">Metro</option>
                  <option value="PC">Pacote</option>
                  <option value="SC">Saca</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'fiscal' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>NCM</label>
                <input className="input-geral" type="text" value={ncm} onChange={(e) => setNcm(e.target.value)} disabled={!permiteEditar} />
              </div>
              <div>
                <label>CFOP</label>
                <input className="input-geral" type="text" value={cfop} onChange={(e) => setCfop(e.target.value)} disabled={!permiteEditar} />
              </div>
              <div>
                <label>CEST</label>
                <input className="input-geral" type="text" value={cest} onChange={(e) => setCest(e.target.value)} disabled={!permiteEditar} />
              </div>
            </div>
          )}

          {tab === 'estoque' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="qtdMinima">Quantidade Mínima</label>
                <input
                  className="input-geral"
                  type="number"
                  id="qtdMinima"
                  name="qtdMinima"
                  value={qtdMinima}
                  onChange={(e) => { setqtdMinima(e.target.value) }} // Atualiza o estado do nome
                  maxLength="50"
                  required={!isService}
                  disabled={!permiteEditar}
                />
              </div>
              <div>
                <label htmlFor="qCom">Quantidade</label>
                <input
                  className="input-geral"
                  type="text"
                  id="qCom"
                  name="qCom"
                  value={qCom}
                  onChange={(e) => { setqCom(e.target.value) }} // Atualiza o estado do nome
                  maxLength="150"
                  required={!isService}
                  disabled={!permiteEditar}
                />
              </div>
            </div>
          )}

          {tab === 'preços' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Valor de Custo</label>
                <input className="input-geral" type="text" value={formatarMoedaBRL(vUnCom)} onChange={handlevUnComChange} required disabled={!permiteEditar} />
              </div>
              <div>
                <label htmlFor="vlrVenda">Valor de Venda</label>
                <input
                  className='input-geral'
                  type="text"
                  id="vlrVenda"
                  name="vlrVenda"
                  value={formatarMoedaBRL(vlrVenda)}
                  onChange={handlevlrVendaChange}
                  maxLength="150"
                  required
                  disabled={!permiteEditar}
                />
              </div>
              <div>
                <label htmlFor="vlrVendaAtacado">Valor de Venda Atacado</label>
                <input
                  className='input-geral'
                  type="text"
                  id="vlrVendaAtacado"
                  name="vlrVendaAtacado"
                  value={formatarMoedaBRL(vlrVendaAtacado)}
                  onChange={handlevlrVendaAtacadoChange}
                  maxLength="150"
                  disabled={!permiteEditar}
                />
              </div>
              <div>
                <label htmlFor="margemSobreVlrCusto">Percentual do Vlr de Venda/Vlr Custo</label>
                <input
                  className="input-geral"
                  type="text"
                  id="margemSobreVlrCusto"
                  name="margemSobreVlrCusto"
                  value={margemSobreVlrCusto}
                  onChange={(e) => { setmargemSobreVlrCusto(e.target.value) }}// Atualiza o estado do nome
                  maxLength="150"
                  disabled
                />
              </div>
              <div>
                <label htmlFor="margemSobreVlrCustoAtacado">Percentual do Vlr de Venda Atacado/Vlr Custo</label>
                <input
                  className="input-geral"
                  type="text"
                  id="margemSobreVlrCustoAtacado"
                  name="margemSobreVlrCustoAtacado"
                  value={margemSobreVlrCustoAtacado}
                  onChange={(e) => { setmargemSobreVlrCustoAtacado(e.target.value) }} // Atualiza o estado do nome
                  maxLength="150"
                  disabled
                />
              </div>
            </div>
          )}

          {tab === 'serviço' && isService && (
            <div className="grid grid-cols-2 gap-4">
              <div className="form-line">
                <label htmlFor="vlrVenda">Preço do Serviço</label>
                <input
                  className="input-geral"
                  type="text"
                  id="vlrVenda"
                  name="vlrVenda"
                  value={formatarMoedaBRL(vlrVenda)}
                  onChange={handlevlrVendaChange}
                />
              </div>
              <div className="form-line">
                <label htmlFor="percentual">Percentual sobre o preço</label>
                <input
                  className="input-geral"
                  type="text"
                  id="percentual"
                  name="percentual"
                  value={percentual}
                  onChange={(e) => { setPercentual(e.target.value.replace(',', '.')) }}
                />
              </div>

            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={!permiteEditar}
            >
              Salvar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => onInativar(produto?.id, !isInativado)}
            >
              Inativar
            </button>
          </div>
        </form>
        {toast.message && <Toast type={toast.type} message={toast.message} />}
        {/* Renderização do modal de autorização */}
        <PermissionModalUI />
      </div>
    </div>
  );
};

export default ModalCadastraProduto;
