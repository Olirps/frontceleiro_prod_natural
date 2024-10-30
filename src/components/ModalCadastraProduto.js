import React, { useEffect, useState } from 'react';
import '../styles/ModalCadastraProduto.css'; // Certifique-se de criar este CSS também
import { addProdutos, updateNFe } from '../services/api';
import Toast from '../components/Toast';



const ModalCadastraProduto = ({ isOpen, onClose, onSubmit, produto, prod, additionalFields = [] }) => {
  const [formData, setFormData] = React.useState({});
  const [cEAN, setcEAN] = useState('');
  const [qtdMinima, setqtdMinima] = useState('');
  const [qCom, setqCom] = useState('');
  const [valor_unit, setUnit] = useState('');
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
      setcEAN(produto.cEAN || '');
      setqtdMinima(produto.qtdMinima || '');
      setqCom(produto.qCom || '');
      setUnit(produto.valor_unit || '');
    } else {
      // Limpar os campos quando não há pessoa selecionada
      setxProd('');
      setcEAN('');
      setqtdMinima('');
      setqCom('');
      setUnit('');

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
  const handlecEANChange = (e) => {
    setcEAN(e.target.value); // Atualiza o estado do nome
  };
  const handleQtdMinChange = (e) => {
    setqtdMinima(e.target.value); // Atualiza o estado do nome
  };
  const handleqComChange = (e) => {
    setqCom(e.target.value); // Atualiza o estado do nome
  };

  const handlevalorUnitChange = (e) => {
    setqCom(e.target.value); // Atualiza o estado do nome
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
        cEAN: formData.get('cEAN'),
        qtdMinima: formData.get('qtdMinima'),
        qCom: formData.get('qCom'),
        vUnCom: formData.get('valor_unit'),           //valor_unit: formData.get('valor_unit'),  ajustado para tratar produtos cadastrados manual na nf 24/09/2024
        nota_id: prod?.id
      };

      // Adiciona os campos adicionais
      additionalFields.forEach((field) => {
        newProduto[field.name] = formData.get(field.name);
      });

      handleaddProdutos(newProduto); // Chama a função handleaddProdutos se prod.nNF não for nulo
    } else {
      onSubmit({
        xProd,
        cEAN,
        qtdMinima,
        qCom,
        valor_unit
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
              <label htmlFor="cEAN">Código de Barras</label>
              <input
                className='input-geral'
                type="text"
                id="cEAN"
                name="cEAN"
                value={cEAN} // Controlado pelo estado
                onChange={handlecEANChange}
                required
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
            {/* Campos adicionais */}
            {additionalFields.map((field, index) => (
              <input
                className='input-geral'
                key={index}
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                onChange={handleInputChange}
              />
            ))}
            <div id='botao-salva'>
              <button type="submit" id="btnsalvar" className="button">Salvar</button>
            </div>
          </div>
        </form>
      </div>
      {toast.message && <Toast type={toast.type} message={toast.message} />}

    </div>
  );
};

export default ModalCadastraProduto;
