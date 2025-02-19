import React, { useEffect, useState } from 'react';
import '../styles/ModalCadastraProduto.css'; // Certifique-se de criar este CSS também
import { addProdutos, updateNFe } from '../services/api';
import Toast from '../components/Toast';
import { formatarMoedaBRL, converterMoedaParaNumero, normalizarNumero } from '../utils/functions';



const ModalCadastraProduto = ({ isOpen, onClose, onSubmit, produto, prod, additionalFields = [] }) => {
  const [formData, setFormData] = React.useState({});
  const [cEAN, setcEAN] = useState('');
  const [cod_interno, setCodInterno] = useState('');
  const [qtdMinima, setqtdMinima] = useState('');
  const [qCom, setqCom] = useState('');
  const [vUnCom, setvUnCom] = useState('');
  const [ncm, setNcm] = useState('');
  const [vlrVenda, setVlrVenda] = useState('');
  const [vlrVendaAtacado, setvlrVendaAtacado] = useState('');
  const [margemSobreVlrCusto, setmargemSobreVlrCusto] = useState('');
  const [margemSobreVlrCustoAtacado, setmargemSobreVlrCustoAtacado] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  /*********** */
  const [produtos, setProdutos] = useState([]);
  const [xProd, setxProd] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isCadastraProdutoModalOpen, setIsCadastraProdutoModalOpen] = useState(false);
  const [importSuccess, setCadastroSuccess] = useState(false);

  /*********** */


  useEffect(() => {
    if (produto) {
      // Preencher os campos com os dados da pessoa selecionada para edição
      setxProd(produto.xProd || '');
      setCodInterno(produto.cod_interno || '');
      setcEAN(produto.cEAN || '');
      setqtdMinima(produto.qtdMinima || '');
      setqCom(produto.qCom || '');
      setvUnCom(produto.vUnCom || '');
      setNcm(produto.NCM || '');
      setVlrVenda(produto.vlrVenda || '');
      setvlrVendaAtacado(produto.vlrVendaAtacado || '');
      setmargemSobreVlrCusto(produto.margemSobreVlrCusto || '');
      setmargemSobreVlrCustoAtacado(produto.margemSobreVlrCustoAtacado || '');
    } else {
      // Limpar os campos quando não há pessoa selecionada
      setxProd('');
      setCodInterno('');
      setcEAN('');
      setqtdMinima('');
      setqCom('');
      setvUnCom('');
      setNcm('');
      setVlrVenda('');
      setvlrVendaAtacado('');
      setmargemSobreVlrCusto('');
      setmargemSobreVlrCustoAtacado('');
    }
  }, [produto]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlexProdChange = (e) => {
    setxProd(e.target.value); // Atualiza o estado do nome
  };
  const handleCodInternoChange = (e) => {
    setCodInterno(e.target.value); // Atualiza o estado do nome
  };
  const handlecEANChange = (e) => {
    setcEAN(e.target.value); // Atualiza o estado do nome
  };
  const handleQtdMinChange = (e) => {
    setqtdMinima(e.target.value); // Atualiza o estado do nome
  };
  const handleqComChange = (e) => {
    setqCom(e.target.value); // Atualiza o estado do nome
  };

  const handlevUnComChange = (e) => {
    const novoValor = formatarMoedaBRL(e.target.value)
    setvUnCom(novoValor); // Atualiza o estado do nome
    const valor = converterMoedaParaNumero(novoValor)
    setmargemSobreVlrCusto(((((vlrVenda / valor) * 100) / 2)).toFixed(4))
  };
  const handleNcmChange = (e) => {
    setNcm(e.target.value); // Atualiza o estado do nome
  };
  const handlevlrVendaChange = (e) => {
    const novoValor = formatarMoedaBRL(e.target.value)
    setVlrVenda(novoValor); // Atualiza o estado do nome
    const valor = converterMoedaParaNumero(novoValor);
    setmargemSobreVlrCusto(((((valor / converterMoedaParaNumero(vUnCom)) * 100) / 2)).toFixed(4))
  };
  const handlevlrVendaAtacadoChange = (e) => {
    const novoValor = formatarMoedaBRL(e.target.value)
    setvlrVendaAtacado(novoValor); // Atualiza o estado do nome
    const valor = converterMoedaParaNumero(novoValor)
    setmargemSobreVlrCustoAtacado(((((valor / converterMoedaParaNumero(vUnCom)) * 100) / 2) ).toFixed(4))
  };

  const handlemargemSobreVlrCustoChange = (e) => {
    setmargemSobreVlrCusto(e.target.value); // Atualiza o estado do nome
  };

  const handlemargemSobreVlrCustoAtacadoChange = (e) => {
    setmargemSobreVlrCustoAtacado(e.target.value); // Atualiza o estado do nome
  };

  const closeCadastraProdutoModal = () => {
    setIsCadastraProdutoModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita o comportamento padrão de recarregar a página
    /*formData.forEach((value, key) => {
      console.log('FormData: ' + `${key}: ${value}`);
    });*/

    if (prod?.nNF) {
      const nota_id = 0
      const formData = new FormData(e.target);
      const newProduto = {
        xProd: formData.get('xProd'),
        cod_interno: formData.get('cod_interno'),
        cEAN: formData.get('cEAN'),
        qtdMinima: formData.get('qtdMinima'),
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
        cod_interno,
        cEAN,
        qtdMinima,
        qCom,
        vUnCom,
        vlrVenda,
        margemSobreVlrCusto,
        ncm,
        vlrVendaAtacado,
        margemSobreVlrCustoAtacado
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
  return (
    <div className="modal-overlay">
      <div className="modal-content-cad-prod">
        <button className="modal-close" onClick={onClose}>X</button>
        <h2>Cadastro de Produtos {prod?.nNF ? ` - Nota Fiscal Nº ${prod.nNF}` : ''}</h2>
        <form onSubmit={handleSubmit}>
          <div id='cadastro-produto'>
            <div>
              <label htmlFor="xProd">Nome</label>
              <input
                className='input-geral'
                type="text"
                id="xProd"
                name="xProd"
                value={xProd}
                onChange={handlexProdChange} // Adiciona o onChange para atualizar o estado
                maxLength="150"
                required
              />
            </div>
            <div>
              <label htmlFor="cod_interno">Código Interno</label>
              <input
                className='input-geral'
                type="text"
                id="cod_interno"
                name="cod_interno"
                value={cod_interno} // Controlado pelo estado
                onChange={handleCodInternoChange}
                required
              />
            </div>
            <div>
              <label htmlFor="cEAN">Código de Barras</label>
              <input
                className='input-geral'
                type="text"
                id="cEAN"
                name="cEAN"
                value={cEAN} // Controlado pelo estado
                onChange={handlecEANChange}
              />
            </div>
            <div>
              <label htmlFor="qtdMinima">Quantidade Mínima</label>
              <input
                className='input-geral'
                type="number"
                id="qtdMinima"
                name="qtdMinima"
                value={qtdMinima}
                onChange={handleQtdMinChange} // Adiciona o onChange para atualizar o estado
                maxLength="50"
                required
              />
            </div>
            <div>
              <label htmlFor="qCom">Quantidade</label>
              <input
                className='input-geral'
                type="text"
                id="qCom"
                name="qCom"
                value={qCom}
                onChange={handleqComChange} // Adiciona o onChange para atualizar o estado
                maxLength="150"
                required
              />
            </div>
            <div>
              <label htmlFor="ncm">NCM</label>
              <input
                className='input-geral'
                type="text"
                id="ncm"
                name="ncm"
                value={ncm}
                onChange={handleNcmChange} // Adiciona o onChange para atualizar o estado
                maxLength="150"
              />
            </div>
            <div>
              <label htmlFor="vUnCom">Valor de Custo</label>
              <input
                className='input-geral'
                type="text"
                id="vUnCom"
                name="vUnCom"
                value={formatarMoedaBRL(vUnCom)}
                onChange={handlevUnComChange} // Adiciona o onChange para atualizar o estado
                maxLength="150"
                required
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
                onChange={handlevlrVendaChange} // Adiciona o onChange para atualizar o estado
                maxLength="150"
                required
              />
            </div>
            <div>
              <label htmlFor="margemSobreVlrCusto">Percentual do Vlr de Venda/Vlr Custo</label>
              <input
                className='input-geral'
                type="text"
                id="margemSobreVlrCusto"
                name="margemSobreVlrCusto"
                value={margemSobreVlrCusto}
                onChange={handlemargemSobreVlrCustoChange} // Adiciona o onChange para atualizar o estado
                maxLength="150"
                disabled
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
                onChange={handlevlrVendaAtacadoChange} // Adiciona o onChange para atualizar o estado
                maxLength="150"
                required
              />
            </div>
            <div>
              <label htmlFor="margemSobreVlrCustoAtacado">Percentual do Vlr de Venda Atacado/Vlr Custo</label>
              <input
                className='input-geral'
                type="text"
                id="margemSobreVlrCustoAtacado"
                name="margemSobreVlrCustoAtacado"
                value={margemSobreVlrCustoAtacado}
                onChange={handlemargemSobreVlrCustoAtacadoChange} // Adiciona o onChange para atualizar o estado
                maxLength="150"
                disabled
              />
            </div>
            {/* Campos adicionais */}
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
              />
            ))}

            <div id='botao-salva'>
              <button type="submit" id="btnsalvar" className="button">Salvar</button>
            </div>
          </div>
        </form>
        {toast.message && <Toast type={toast.type} message={toast.message} />}

      </div>
    </div>
  );
};

export default ModalCadastraProduto;
