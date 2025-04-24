import React, { useState, useEffect } from 'react';
import '../styles/ModalCadastroCarro.css';
import { getMarcas, getTipoVeiculo } from '../services/api';
import { formatPlaca, formatarNumeroMilhares } from '../utils/functions';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função
import Toast from '../components/Toast';

const ModalCadastroCarro = ({ isOpen, onClose, isEdit, onSubmit, carro }) => {
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [quilometragem, setQuilometragem] = useState('');
  const [marcaId, setMarcaId] = useState('');
  const [tipoVeiculoId, setTipoVeiculoId] = useState('');
  const [marcas, setMarcas] = useState([]);
  const [tiposVeiculo, setTiposVeiculo] = useState([]);
  const [permiteEditar, setPermiteEditar] = useState(true);
  const { permissions } = useAuth();
  const [toast, setToast] = useState({ message: '', type: '' });


  useEffect(() => {
    if (isOpen && isEdit) {
      const canEdit = hasPermission(permissions, 'veiculos', isEdit ? 'edit' : 'insert');
      setPermiteEditar(canEdit)
    }
  }, [isOpen, isEdit, permissions]);


  useEffect(() => {
    if (carro) {
      setModelo(carro.modelo || '');
      setPlaca(carro.placa || '');
      setQuilometragem(carro.quilometragem || '');
      setMarcaId(carro.marcaId || '');
      setTipoVeiculoId(carro.tipoveiculoId || '');
    } else {
      // Limpar os campos quando não há veículo selecionado
      setModelo('');
      setPlaca('');
      setQuilometragem('');
      setMarcaId('');
      setTipoVeiculoId('');
    }
  }, [carro]);

  useEffect(() => {
    const fetchMarcas = async () => {
      try {
        const response = await getMarcas();
        setMarcas(response.data);
      } catch (err) {
        console.error('Erro ao buscar marcas', err);
        setToast({ message: 'Erro ao buscar Marcas', type: "error" });
      }
    };

    const fetchTiposVeiculo = async () => {
      try {
        const response = await getTipoVeiculo();
        setTiposVeiculo(response.data);
      } catch (err) {
        console.error('Erro ao buscar tipos de veículo', err);
      }
    };

    fetchMarcas();
    fetchTiposVeiculo();
  }, []);

  if (!isOpen) return null;

  const handleModeloChange = (e) => setModelo(e.target.value);
  const handlePlacaChange = (newPlaca) => {
    const placaFormatada = formatPlaca(newPlaca);
    setPlaca(placaFormatada); // Atualiza o estado com a placa formatada
  };
  const handleQuilometragemChange = (e) => setQuilometragem(e.target.value);
  const handleMarcaChange = (e) => setMarcaId(e.target.value);
  const handleTipoVeiculoChange = (e) => setTipoVeiculoId(e.target.value);


  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>X</button>
        <h2>{isEdit ? 'Editar Veículo' : 'Cadastrar Veículo'}</h2>
        <form onSubmit={onSubmit}>
          <div id='cadastro-padrão'>
            <div>
              <label htmlFor="modelo">Modelo</label>
              <input
                className='input-geral'
                type="text"
                id="modelo"
                name="modelo"
                value={modelo}
                onChange={handleModeloChange}
                maxLength="150"
                disabled={!permiteEditar}
                required
              />
            </div>
            <div>
              <label htmlFor="placa">Placa</label>
              <input
                className='input-geral'
                type="text"
                id="placa"
                name="placa"
                value={placa}
                onChange={(e) => handlePlacaChange(e.target.value.toUpperCase())} // Transforma para maiúsculas ao digitar
                maxLength="8"
                disabled={!permiteEditar}
                required={tipoVeiculoId !== 3 && tipoVeiculoId !== 4} // Condicional para placa ser obrigatória apenas se não for maquinário ou equipamento
              />
            </div>

            <div>
              <label htmlFor="quilometragem">Quilometragem</label>
              <input
                className='input-geral'
                type="text"
                id="quilometragem"
                name="quilometragem"
                value={formatarNumeroMilhares(quilometragem)}
                onChange={handleQuilometragemChange}
                disabled={!permiteEditar}
                required
              />
            </div>
            <div>
              <label htmlFor="marca">Marca</label>
              <select
                className='input-geral'
                id="marca"
                name="marcaId"
                value={marcaId}
                onChange={handleMarcaChange}
                disabled={!permiteEditar}
                required
              >
                <option value="">Selecione a Marca</option>
                {marcas.map((marca) => (
                  <option key={marca.id} value={marca.id}>
                    {marca.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tipoVeiculo">Tipo de Veículo</label>
              <select
                className='input-geral'
                id="tipoVeiculo"
                name="tipoVeiculoId"
                value={tipoVeiculoId}
                onChange={handleTipoVeiculoChange}
                disabled={!permiteEditar}
                required
              >
                <option value="">Selecione o Tipo de Veículo</option>
                {tiposVeiculo.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
            </div>
            <div id='button-group'>
              {permiteEditar ? (
                <button
                  type="submit"
                  id="btnsalvar"
                  className="button"
                >
                  Salvar
                </button>
              ) : ''}
            </div>
          </div>
        </form>
        {toast.message && <Toast type={toast.type} message={toast.message} />}
      </div>
    </div>
  );
};

export default ModalCadastroCarro;
