import React, { useEffect, useState } from 'react';
import '../styles/ModalCadastraProduto.css';
import { addProdutos, updateProduto, inativarProduto } from '../services/api';
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

const ModalCadastraProduto = ({ isOpen, onClose, produto, edit, isInativar, additionalFields = [] }) => {
  const username = localStorage.getItem('username');
  if (!username) {
    throw new Error('Usuário não autenticado');
  }

  // Função para salvar ou editar produto
  const handleSave = async (dados) => {
    try {
      setLoading(true);
      if (edit && produto?.id) {
        await updateProduto(produto.id, dados);
        setToast({ message: 'Produto atualizado com sucesso!', type: 'success' });
      } else {
        await addProdutos(dados);
        setToast({ message: 'Produto cadastrado com sucesso!', type: 'success' });
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      setToast({ message: `Erro: ${error.response.data.erro}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Função para inativar produto
  const handleInativar = async (id) => {
    try {
      await inativarProduto(id);
      setIsInativado(true);
      setToast({ message: 'Produto inativado com sucesso!', type: 'success' });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      setToast({ message: 'Erro ao inativar produto.', type: 'error' });
    }
  };
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
  const [cod_interno_fracionado, setCodInternoFracionado] = useState('');
  const [qtdMinima, setqtdMinima] = useState('');
  const [uCom, setuCom] = useState('');
  const [qCom, setqCom] = useState('');
  const [vUnCom, setvUnCom] = useState('');
  const [ncm, setNcm] = useState('');
  const [cfop, setCfop] = useState('');
  const [cest, setCest] = useState('');
  const [vlrVenda, setVlrVenda] = useState('');
  const [valorFracionado, setValorFracionado] = useState(null);
  const [vlrVendaAtacado, setvlrVendaAtacado] = useState(null);
  const [margemSobreVlrCusto, setmargemSobreVlrCusto] = useState('');
  const [margemSobreVlrCustoAtacado, setmargemSobreVlrCustoAtacado] = useState('');
  const [percentual, setPercentual] = useState('');
  const [xProd, setxProd] = useState('');
  const [isService, setIsService] = useState(false);
  const [isInativado, setIsInativado] = useState(isInativar);
  const [permiteEditar, setPermiteEditar] = useState(false);
  const [openGrupo, setOpenGrupo] = useState(false);
  const [openSubGrupo, setOpenSubGrupo] = useState(false);
  const [atacado, setAtacado] = useState(false);
  const [fracionado, setFracionado] = useState(false);
  const [loading, setLoading] = useState(false);

  //Permissoes
  const { permissions } = useAuth();
  const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

  useEffect(() => {
    if (produto) {
      setxProd(produto.xProd || '');
      setCodInterno(produto.cod_interno || '');
      setCodInternoFracionado(produto.cod_interno_fracionado || '');
      setIsService(produto.tipo === 'servico' ? true : false);
      setcEAN(produto.cEAN || '');
      setqtdMinima(produto.qtdMinima || '');
      setuCom(produto.uCom || '');
      setqCom(produto.qCom || '');
      setvUnCom(produto.vUnCom || '');
      setNcm(produto.NCM || '');
      setCfop(produto.CFOP || '');
      setCest(produto.CEST || '');
      setVlrVenda(produto.Precos.length > 0 ? produto.Precos[0].preco_venda : produto.vlrVenda || null);
      setFracionado(produto.fracionado || false);
      setAtacado(produto.atacado || false);
      setValorFracionado(produto.Precos.length > 0 ? produto.Precos[0].preco_venda_fracionado : null);
      setvlrVendaAtacado(produto.vlrVendaAtacado || null);
      setmargemSobreVlrCusto(produto.margemSobreVlrCusto || null);
      setmargemSobreVlrCustoAtacado(produto.margemSobreVlrCustoAtacado || null);
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

  const handlevlrVendaFracionado = (e) => {
    const novoValor = formatarMoedaBRL(e.target.value);
    const valorFormatado = formatarValor(novoValor);
    setValorFracionado(valorFormatado);
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

  const handleSubmit = async (e) => {
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

    const dados = {
      xProd,
      isService,
      cod_interno: cod_interno !== '' ? cod_interno : null,
      cod_interno_fracionado: cod_interno_fracionado !== '' ? cod_interno_fracionado : null,
      cEAN,
      qtdMinima,
      uCom,
      qCom,
      vUnCom,
      gpid: grupoId !== '' ? grupoId : 0,
      subgpid: subGrupoId !== '' ? subGrupoId : 0,
      vlrVenda,
      margemSobreVlrCusto,
      ncm,
      cfop,
      cest,
      vlrVendaAtacado,
      margemSobreVlrCustoAtacado,
      percentual,
      valor_fracionado: valorFracionado !== '' ? valorFracionado : null,
      atacado,
      fracionado,
      username
    };
    await handleSave(dados);
  };

  const handleTabClick = (tabName) => setTab(tabName);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {edit
              ? (isService ? "Editar Serviço" : "Editar Produto - " + `${xProd}`)
              : (isService ? "Cadastrar Serviço" : "Cadastrar Produto - " + `${xProd}`)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <div className="px-6 py-4 overflow-y-auto">

          {/* Toggle Produto/Serviço */}
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="productType"
                value="product"
                checked={!isService}
                onChange={() => setIsService(false)}
                disabled={!permiteEditar}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Produto</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="productType"
                value="service"
                checked={isService}
                onChange={() => {
                  setIsService(true);
                  setTab("identificação");
                  setNcm("");
                  setCfop("");
                  setCest("");
                }}
                disabled={!permiteEditar}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Serviço</span>
            </label>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-6">
            {["identificação", "estoque", "fiscal", "preços", ...(isService ? ["serviço"] : [])].map((t) => (
              <button
                key={t}
                onClick={() => handleTabClick(t)}
                className={`px-4 py-2 text-sm font-medium transition ${tab === t
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
                  }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {tab === "identificação" && (
              <div className="grid grid-cols-2 gap-4">
                {/* Grupo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grupo</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenGrupo(!openGrupo)}
                      className="w-full border border-gray-300 rounded-md p-2 mt-1 text-left focus:ring-2 focus:ring-blue-500"
                    >
                      {grupoNome || "Selecione um grupo"}
                    </button>
                    {openGrupo && (
                      <div className="absolute z-10 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                        {grupos.map((g) => (
                          <div
                            key={g.id}
                            onClick={() => {
                              setGrupoNome(g.nome);
                              setGrupoId(g.id);
                              setOpenGrupo(false);
                              setSubGrupoNome("");
                              setSubGrupoId("");
                              handleBuscaSubGrupo(g.id);
                            }}
                            className="p-2 text-sm hover:bg-blue-50 cursor-pointer"
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
                  <label className="block text-sm font-medium text-gray-700">Subgrupo</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenSubGrupo(!openSubGrupo)}
                      className="w-full border border-gray-300 rounded-md p-2 mt-1 text-left focus:ring-2 focus:ring-blue-500"
                    >
                      {subGrupoNome || "Selecione um subgrupo"}
                    </button>
                    {openSubGrupo && (
                      <div className="absolute z-10 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                        {subGrupos.map((g) => (
                          <div
                            key={g.id}
                            onClick={() => {
                              setSubGrupoNome(g.nome);
                              setSubGrupoId(g.id);
                              setOpenSubGrupo(false);
                            }}
                            className="p-2 text-sm hover:bg-blue-50 cursor-pointer"
                          >
                            {g.nome}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={xProd}
                    onChange={(e) => setxProd(e.target.value.toUpperCase())}
                    required
                    disabled={!permiteEditar}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Código Interno */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Código Interno</label>
                  <input
                    type="text"
                    value={cod_interno}
                    onChange={(e) => setCodInterno(e.target.value)}
                    disabled={!permiteEditar}
                    maxLength={6}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Código Interno Fracionado */}
                {fracionado && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Código Interno Fracionado</label>
                    <input
                      type="text"
                      value={cod_interno_fracionado}
                      onChange={(e) => setCodInternoFracionado(e.target.value)}
                      disabled={!permiteEditar}
                      maxLength={6}
                      className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>)}

                {/* Código de Barras */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Código de Barras</label>
                  <input
                    type="text"
                    value={cEAN}
                    onChange={(e) => setcEAN(e.target.value)}
                    disabled={!permiteEditar}
                    maxLength={13}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Unidade Medida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unidade Medida</label>
                  <select
                    id="uCom"
                    value={uCom}
                    onChange={(e) => setuCom(e.target.value)}
                    required={!isService}
                    disabled={!permiteEditar}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
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
                {/*Fracionado*/}
                <div className="mb-4 flex items-center gap-3">
                  <label className="text-sm font-medium">Fracionado:</label>
                  <button
                    type="button"
                    onClick={() => setFracionado(!fracionado)} // alterna true/false
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${fracionado ? "bg-blue-500" : "bg-gray-300"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${fracionado ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">{fracionado ? "Ativo" : "Inativo"}</span>
                </div>
                {/*Atacado*/}
                <div className="mb-4 flex items-center gap-3">
                  <label className="text-sm font-medium">Atacado:</label>
                  <button
                    type="button"
                    onClick={() => setAtacado(!atacado)} // alterna true/false
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${atacado ? "bg-blue-500" : "bg-gray-300"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${atacado ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">{atacado ? "Ativo" : "Inativo"}</span>
                </div>
              </div>
            )}

            {/* Fiscal */}
            {tab === "fiscal" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">NCM</label>
                  <input
                    type="text"
                    value={ncm}
                    onChange={(e) => setNcm(e.target.value)}
                    disabled={!permiteEditar}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CFOP</label>
                  <input
                    type="text"
                    value={cfop}
                    onChange={(e) => setCfop(e.target.value)}
                    disabled={!permiteEditar}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CEST</label>
                  <input
                    type="text"
                    value={cest}
                    onChange={(e) => setCest(e.target.value)}
                    disabled={!permiteEditar}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Estoque */}
            {tab === "estoque" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantidade Mínima</label>
                  <input
                    type="number"
                    id="qtdMinima"
                    name="qtdMinima"
                    value={qtdMinima}
                    onChange={(e) => setqtdMinima(e.target.value)}
                    required={!isService}
                    disabled={!permiteEditar}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                  <input
                    type="text"
                    id="qCom"
                    name="qCom"
                    value={qCom}
                    onChange={(e) => setqCom(e.target.value)}
                    required={!isService}
                    disabled={!permiteEditar}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Preços */}
            {tab === "preços" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor de Custo</label>
                  <input
                    type="text"
                    value={formatarMoedaBRL(vUnCom)}
                    onChange={handlevUnComChange}
                    required
                    disabled={!permiteEditar}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor de Venda</label>
                  <input
                    type="text"
                    id="vlrVenda"
                    name="vlrVenda"
                    value={formatarMoedaBRL(vlrVenda)}
                    onChange={handlevlrVendaChange}
                    required
                    disabled={!permiteEditar}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {fracionado && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor de Fracionado</label>
                    <input
                      type="text"
                      id="valorFracionado"
                      name="valorFracionado"
                      value={formatarMoedaBRL(valorFracionado)}
                      onChange={handlevlrVendaFracionado}
                      disabled={!permiteEditar}
                      className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">% Venda / Custo</label>
                  <input
                    type="text"
                    id="margemSobreVlrCusto"
                    name="margemSobreVlrCusto"
                    value={margemSobreVlrCusto}
                    onChange={(e) => setmargemSobreVlrCusto(e.target.value)}
                    disabled
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 bg-gray-100 text-gray-600"
                  />
                </div>
                {atacado && (<>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor de Venda Atacado</label>
                    <input
                      type="text"
                      id="vlrVendaAtacado"
                      name="vlrVendaAtacado"
                      value={formatarMoedaBRL(vlrVendaAtacado)}
                      onChange={handlevlrVendaAtacadoChange}
                      disabled={!permiteEditar}
                      className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">% Atacado / Custo</label>
                    <input
                      type="text"
                      id="margemSobreVlrCustoAtacado"
                      name="margemSobreVlrCustoAtacado"
                      value={margemSobreVlrCustoAtacado}
                      onChange={(e) => setmargemSobreVlrCustoAtacado(e.target.value)}
                      disabled
                      className="w-full border border-gray-300 rounded-md p-2 mt-1 bg-gray-100 text-gray-600"
                    />
                  </div>
                </>)}
              </div>
            )}

            {/* Serviço */}
            {tab === "serviço" && isService && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preço do Serviço</label>
                  <input
                    type="text"
                    id="vlrVenda"
                    name="vlrVenda"
                    value={formatarMoedaBRL(vlrVenda)}
                    onChange={handlevlrVendaChange}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Percentual sobre o preço</label>
                  <input
                    type="text"
                    id="percentual"
                    name="percentual"
                    value={percentual}
                    onChange={(e) => setPercentual(e.target.value.replace(",", "."))}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="submit"
                disabled={!permiteEditar}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? (edit ? 'Atualizando...' : 'Cadastrando...') : (edit ? 'Atualizar' : 'Cadastrar')}
              </button>
              {produto?.id && (
                <button
                  type="button"
                  onClick={() => handleInativar(produto.id)}
                  className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  disabled={isInativado}
                >
                  Inativar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Toast e modal de permissão */}
        {toast.message && <Toast type={toast.type} message={toast.message} />}
        <PermissionModalUI />
      </div>
    </div>

  );
};

export default ModalCadastraProduto;
