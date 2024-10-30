import React, { useState, useEffect } from 'react';
import '../styles/ModalCadastroCarro.css';
import { getMarcas } from '../services/api';

const ModalCadastroCarro = ({ isOpen, onClose, onSubmit, carro }) => {
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState( '');
  const [quilometragem, setQuilometragem] = useState('');
  const [marcaId, setMarcaId] = useState('');
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    if (carro) {
      setModelo(carro.modelo || '');
      setPlaca(carro.placa || '');
      setQuilometragem(carro.quilometragem || '');
      setMarcaId(carro.marcaId || '');
    }else{
      // Limpar os campos quando não há pessoa selecionada
      setModelo('');
      setPlaca('');
      setQuilometragem('');
      setMarcaId('');
    }
  }, [carro]);

  useEffect(() => {
    const fetchMarcas = async () => {
      try {
        const response = await getMarcas();
        setMarcas(response.data);
      } catch (err) {
        console.error('Erro ao buscar marcas', err);
      }
    };

    fetchMarcas();
  }, []);

  if (!isOpen) return null;

  const handleModeloChange = (e) => {
    setModelo(e.target.value);
  };

  const handlePlacaChange = (e) => {
    setPlaca(e.target.value);
  };

  const handleQuilometragemChange = (e) => {
    setQuilometragem(e.target.value);
  };

  const handleMarcaChange = (e) => {
    setMarcaId(e.target.value);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>X</button>
        <h2>{carro ? 'Editar Veículo' : 'Cadastrar Veículo'}</h2>
        <form onSubmit={onSubmit}>
          <div className="input-group">
            <label htmlFor="modelo">Modelo</label>
            <input
              type="text"
              id="modelo"
              name="modelo"
              value={modelo}
              onChange={handleModeloChange}
              maxLength="150"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="placa">Placa</label>
            <input
              type="text"
              id="placa"
              name="placa"
              value={placa}
              onChange={handlePlacaChange}
              maxLength="8"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="quilometragem">Quilometragem</label>
            <input
              type="number"
              id="quilometragem"
              name="quilometragem"
              value={quilometragem}
              onChange={handleQuilometragemChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="marca">Marca</label>
            <select
              id="marca"
              name="marcaId"
              value={marcaId}
              onChange={handleMarcaChange}
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
          <div className="button-group">
            <button type="submit" id="btnsalvar" className="button">Salvar</button>
            <button type="button" className="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCadastroCarro;
