import React, { useEffect, useState } from 'react';
import '../styles/ModalCadastraProduto.css'; // Certifique-se de criar este CSS também
import { addProdutos, updateNFe } from '../services/api';
import Toast from '../components/Toast';
import { formatarMoedaBRL, converterMoedaParaNumero, formatarValor, mascaraPercentual, formatarPercentual } from '../utils/functions';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função

const ModalCadastraProduto = ({ isOpen, onClose, onSubmit, produto, prod, edit, isInativar, onInativar, additionalFields = [] }) => {
  const [formData, setFormData] = React.useState({});
  const [cEAN, setcEAN] = useState('');
  const [cod_interno, setCodInterno] = useState('');
  const [qtdMinima, setqtdMinima] = useState('');
  const [uCom, setuCom] = useState('');
  const [qCom, setqCom] = useState('');
  const [vUnCom, setvUnCom] = useState('');
  const [ncm, setNcm] = useState('');
  const [vlrVenda, setVlrVenda] = useState('');
  const [percentual, setPercentual] = useState('');
  const [vlrVendaAtacado, setvlrVendaAtacado] = useState('');
  const [margemSobreVlrCusto, setmargemSobreVlrCusto] = useState('');
  const [margemSobreVlrCustoAtacado, setmargemSobreVlrCustoAtacado] = useState('');
  const [isInativado, setIsInativado] = useState(isInativar);
  const [permiteEditar, setPermiteEditar] = useState(true);
  const { permissions } = useAuth();
  const [isService, setIsService] = useState(false); // Para controlar se é produto ou serviço


  /*********** */
  const [produtos, setProdutos] = useState([]);
  const [xProd, setxProd] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });

  /*********** */

  const [isExpanded, setIsExpanded] = useState({
    identificacao: true,
    precos: false,
    custoVendaPercentual: false,
  });

  useEffect(() => {
    if (produto) {
      // Preencher os campos com os dados da pessoa selecionada para edição
      setxProd(produto.xProd || '');
      setCodInterno(produto.cod_interno || '');
      setIsService(produto.tipo === 'servico' ? true : false);
      setcEAN(produto.cEAN || '');
      setqtdMinima(produto.qtdMinima || '');
      setuCom(produto.uCom || '');
      setqCom(produto.qCom || '');
      setvUnCom(produto.vUnCom || '');
      setNcm(produto.NCM || '');
      setVlrVenda(produto.vlrVenda || '');
      setvlrVendaAtacado(produto.vlrVendaAtacado || '');
      setmargemSobreVlrCusto(produto.margemSobreVlrCusto || '');
      setmargemSobreVlrCustoAtacado(produto.margemSobreVlrCustoAtacado || '');
      setPercentual(produto.pct_servico || '');
    } else {
      // Limpar os campos quando não há pessoa selecionada
      setxProd('');
      setCodInterno('');
      setcEAN('');
      setqtdMinima('');
      setqCom('');
      setuCom('');
      setvUnCom('');
      setNcm('');
      setVlrVenda('');
      setvlrVendaAtacado('');
      setmargemSobreVlrCusto('');
      setmargemSobreVlrCustoAtacado('');
    }
  }, [produto]);


  useEffect(() => {
    setIsInativado(isInativar); // Atualiza o estado quando a prop muda
  }, [isInativar]);

  useEffect(() => {
    if (isOpen && edit) {
      const canEdit = hasPermission(permissions, 'produtos', edit ? 'edit' : 'insert');
      setPermiteEditar(canEdit)
    }
  }, [isOpen, edit, permissions]);


  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangeStatus = () => {
    if (!hasPermission(permissions, 'produtos', 'delete')) {
      setToast({ message: "Você não tem permissão para inativar produtos.", type: "error" });
      return; // Impede a abertura do modal
    }
    const novoStatus = !isInativado;
    setIsInativado(novoStatus);

    // Notifica o componente pai sobre a inativação
    if (onInativar) {
      onInativar(produto.id, novoStatus);
    }
  };

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

  const handleProductTypeChange = (e) => {
    setIsService(e.target.value === 'service');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita o comportamento padrão de recarregar a página

    if (prod?.nNF) {
      const nota_id = 0
      const formData = new FormData(e.target);
      const newProduto = {
        xProd: formData.get('xProd'),
        productType: 'produto',
        cod_interno: formData.get('cod_interno'),
        cEAN: formData.get('cEAN'),
        qtdMinima: formData.get('qtdMinima'),
        uCom: formData.get('uCom'),
        qCom: formData.get('qCom'),
        vUnCom: converterMoedaParaNumero(formData.get('vUnCom')),           //valor_unit: formData.get('valor_unit'),  ajustado para tratar produtos cadastrados manual na nf 24/09/2024
        vlrVenda: converterMoedaParaNumero(formData.get('vlrVenda')),           //valor de venda: formData.get('valor_unit'),  ajustado para tratar produtos cadastrados manual na nf 24/09/2024
        nota_id: prod?.id
      };

      // Adiciona os campos adicionais
      additionalFields.forEach((field) => {
        let value = '';

        if (field.name === "valor_unit") {
          value = formData.get(field.name); // Formata o valor ao digitar
          newProduto[field.name] = converterMoedaParaNumero(value);
        } else {
          newProduto[field.name] = formData.get(field.name);
        }
      });

      handleaddProdutos(newProduto); // Chama a função handleaddProdutos se prod.nNF não for nulo
    } else {
      onSubmit({
        xProd,
        isService,
        cod_interno,
        cEAN,
        qtdMinima,
        uCom,
        qCom,
        vUnCom,
        vlrVenda,
        margemSobreVlrCusto,
        ncm,
        vlrVendaAtacado,
        margemSobreVlrCustoAtacado,
        percentual
      });// Continua com o comportamento original se prod.nNF for nulo
    }
  };

  const handleaddProdutos = async (new_produto) => {
    try {
      const response = await addProdutos(new_produto);
      await updateNFe(prod.id, { status: 'andamento' });

      setProdutos(response.data);
      setToast({ message: "Produto cadastrado com sucesso!", type: "success" });
      onClose(); // Usando o onClose passado como prop para fechar o modal
      onSubmit();
    } catch (err) {

      const errorMessage = err.response.data.erro;
      setToast({ message: errorMessage, type: "error" });

      /*const errorMessage = err.response?.data?.error || "Erro ao cadastrar produto.";
      setToast({ message: errorMessage, type: "error" });*/
    }
  };

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
            ? `Editar Produto - ${prod?.nNF ? `Nota Fiscal Nº ${prod.nNF}` : xProd}`
            : `Cadastrar Produto : ${prod?.nNF ? `Nota Fiscal Nº ${prod.nNF}` : xProd}`}
        </h2>
        <form onSubmit={handleSubmit}>
          <div>
            {/* Seção de Tipo (Produto ou Serviço) */}
            <fieldset>
              <legend>Tipo de Cadastro</legend>
              <label>
                <input
                  type="radio"
                  name="productType"
                  value="product"
                  checked={!isService}
                  onChange={handleProductTypeChange}
                />
                Produto
              </label>
              <label>
                <input
                  type="radio"
                  name="productType"
                  value="service"
                  checked={isService}
                  onChange={handleProductTypeChange}
                />
                Serviço
              </label>
            </fieldset>
            {/* Seção de Identificação do Produto */}
            <fieldset>
              <legend>
                Identificação do Produto
                <button
                  type="button"
                  onClick={() => toggleSection('identificacao')}
                  className="expand-button"
                >
                  {isExpanded.identificacao ? '-' : '+'}
                </button>
              </legend>
              {isExpanded.identificacao && (
                <div>
                  <div className="form-line">
                    <div className="single-line">
                      <label htmlFor="xProd">Nome</label>
                      <input
                        className="input-geral"
                        type="text"
                        id="xProd"
                        name="xProd"
                        value={xProd}
                        onChange={(e) => { setxProd(e.target.value.toUpperCase()) }}
                        maxLength="150"
                        required
                        disabled={!permiteEditar}
                      />
                    </div>
                  </div>
                  {/* Campos compartilhados entre produto e serviço */}
                  <div className="form-line">
                    <div>
                      <label htmlFor="cod_interno">Código Interno</label>
                      <input
                        className="input-geral"
                        type="text"
                        id="cod_interno"
                        name="cod_interno"
                        value={cod_interno}
                        onChange={(e) => { setCodInterno(e.target.value) }} // Atualiza o estado do nome
                        required
                        disabled={!permiteEditar}
                      />
                    </div>
                    <div>
                      <label htmlFor="cEAN">Código de Barras</label>
                      <input
                        className="input-geral"
                        type="text"
                        id="cEAN"
                        name="cEAN"
                        value={cEAN}
                        onChange={(e) => { setcEAN(e.target.value) }} // Atualiza o estado do nome
                        disabled={!permiteEditar}
                      />
                    </div>
                    <div>
                      <label htmlFor="ncm">NCM</label>
                      <input
                        className="input-geral"
                        type="text"
                        id="ncm"
                        name="ncm"
                        value={ncm}
                        onChange={(e) => { setNcm(e.target.value) }} // Atualiza o estado do nome
                        maxLength="150"
                        disabled={!permiteEditar}
                      />
                    </div>
                  </div>
                </div>
              )}
            </fieldset>

            {/* Seção de Preços e Quantidades */}

            {isService ? (
              <fieldset>
                <legend>
                  Preço e Percentuais
                  <button
                    type="button"
                    onClick={() => toggleSection('precos')}
                    className="expand-button"
                  >
                    {isExpanded.precos ? '-' : '+'}
                  </button>
                </legend>
                {isExpanded.precos && (
                  <div>
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
              </fieldset>
            ) :
              (<fieldset>
                <legend>
                  Quantidades
                  <button
                    type="button"
                    onClick={() => toggleSection('precos')}
                    className="expand-button"
                  >
                    {isExpanded.precos ? '-' : '+'}
                  </button>
                </legend>
                {isExpanded.precos && (
                  <div className="form-line">
                    <div>
                      <label htmlFor="uCom">Unidade Medida</label>
                      <select
                        className="input-geral"
                        id="uCom"
                        name="uCom"
                        value={uCom}
                        onChange={(e) => { setuCom(e.target.value) }}
                        required
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
                        required
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
                        required
                        disabled={!permiteEditar}
                      />
                    </div>
                  </div>
                )}
              </fieldset>
              )}
            {/* Seção de Preço de Custo / Venda e Percentuais */}
            {isService ? null :
              (<fieldset>
                <legend>
                  Preço de Custo/Venda e Percentuais
                  <button
                    type="button"
                    onClick={() => toggleSection('custoVendaPercentual')}
                    className="expand-button"
                  >
                    {isExpanded.custoVendaPercentual ? '-' : '+'}
                  </button>
                </legend>
                {isExpanded.custoVendaPercentual && (
                  <div className="form-line">
                    <div>
                      <label htmlFor="vUnCom">Valor de Custo</label>
                      <input
                        className='input-geral'
                        type="text"
                        id="vUnCom"
                        name="vUnCom"
                        value={formatarMoedaBRL(vUnCom)}
                        onChange={handlevUnComChange}
                        maxLength="150"
                        required
                        disabled={!permiteEditar}
                      />
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
                        required
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
              </fieldset>)}

            {/* Campos Adicionais */}
            {additionalFields.map((field, index) => (
              <input
                className="input-geral"
                key={index}
                type={field.type}
                name={field.name}
                value={formData[field.name] || ""}
                placeholder={field.placeholder}
                onChange={(e) => {
                  let value = e.target.value;

                  if (field.name === "valor_unit") {
                    value = formatarMoedaBRL(value); // Formata o valor ao digitar
                  }

                  handleInputChange({
                    target: {
                      name: field.name,
                      value,
                    },
                  });
                }}
                disabled={!permiteEditar}
              />
            ))}
          </div>

          <div id="button-group">
            <button type="submit" id="btnsalvar" className="button" disabled={!permiteEditar}>Salvar</button>
            <button onClick={handleChangeStatus} className="cancel-button">Deletar</button>
          </div>
        </form>
        {toast.message && <Toast type={toast.type} message={toast.message} />}
      </div>
    </div>

  );
};

export default ModalCadastraProduto;
