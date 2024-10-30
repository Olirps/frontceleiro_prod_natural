import React, { useState, useEffect } from 'react';
import { getCarros, addCarro, updateCarro, getCarroById, getMarcas } from '../services/api';
import '../styles/Carros.css';
import Modal from '../components/ModalCadastroCarro';
import Toast from '../components/Toast';

function Carros() {
  const [carros, setCarros] = useState([]);
  const [filteredCarros, setFilteredCarros] = useState([]);
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedCarro, setSelectedCarro] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [marcas, setMarcas] = useState([]);
  const [marcaId, setMarcaId] = useState('');

  useEffect(() => {
    const fetchCarros = async () => {
      try {
        const response = await getCarros();
        setCarros(response.data);
        setFilteredCarros(response.data);
      } catch (err) {
        console.error('Erro ao buscar veículos', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchMarcas = async () => {
      try {
        const response = await getMarcas();
        setMarcas(response.data);
      } catch (err) {
        console.error('Erro ao buscar marcas', err);
      }
    };

    fetchCarros();
    fetchMarcas();
  }, []);

  const handleSearch = () => {
    const lowerModelo = modelo.toLowerCase();
    const lowerPlaca = placa.toLowerCase();
    const results = carros.filter(carro =>
      (lowerModelo ? carro.modelo.toLowerCase().includes(lowerModelo) : true) &&
      (lowerPlaca ? carro.placa.toLowerCase().includes(lowerPlaca) : true) &&
      (marcaId ? carro.marcaId == marcaId : true)
    );

    setFilteredCarros(results);
    setCurrentPage(1); // Resetar para a primeira página após a busca
  };

  const handleClear = () => {
    setModelo('');
    setPlaca('');
    setMarcaId(''); // Resetar o dropdown de marca
    setFilteredCarros(carros);
    setCurrentPage(1);
  };

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Resetar para a primeira página ao alterar o número de linhas
  };

  const handleAddCarro = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newCarro = {
      modelo: formData.get('modelo'),
      placa: formData.get('placa'),
      quilometragem: formData.get('quilometragem'),
      marcaId: formData.get('marcaId'),
    };

    try {
      await addCarro(newCarro);
      setToast({ message: "Veículo cadastrado com sucesso!", type: "success" });
      setIsModalOpen(false);
      const response = await getCarros();
      setCarros(response.data);
      setFilteredCarros(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao cadastrar veículo.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  const handleEditClick = async (carro) => {
    try {
      const response = await getCarroById(carro.id);
      setSelectedCarro(response.data);
      setIsEdit(true);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Erro ao buscar detalhes do veículo', err);
      setToast({ message: "Erro ao buscar detalhes do veículo.", type: "error" });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedCarro = {
      modelo: formData.get('modelo'),
      placa: formData.get('placa'),
      quilometragem: formData.get('quilometragem'),
      marcaId: formData.get('marcaId'),
    };

    try {
      await updateCarro(selectedCarro.id, updatedCarro);
      setToast({ message: "Veículo atualizado com sucesso!", type: "success" });
      setIsModalOpen(false);
      setSelectedCarro(null);
      setIsEdit(false);
      const response = await getCarros();
      setCarros(response.data);
      setFilteredCarros(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erro ao atualizar veículo.";
      setToast({ message: errorMessage, type: "error" });
    }
  };

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const totalPages = Math.ceil(filteredCarros.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentCarros = filteredCarros.slice(startIndex, startIndex + rowsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div id="carro-container">
      <h1 id="carro-title">Consulta de Veículos</h1>
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>) : (
        <>
          <div id="search-container">
            <div id="search-fields">
              <div>
                <label htmlFor="modelo">Modelo</label>
                <input
                className='input-geral'
                  type="text"
                  id="modelo"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  maxLength="150"
                />
              </div>
              <div className="input-group">
                <label htmlFor="placa">Placa</label>
                <input
                className='input-geral'
                  type="text"
                  id="placa"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  maxLength="7"
                />
              </div>
              <div>
                <label htmlFor="marcaId">Marca</label>
                <select
                  className="select-geral"
                  id="marcaId"
                  value={marcaId}
                  onChange={(e) => setMarcaId(e.target.value)}
                >
                  <option value="">Todas as Marcas</option>
                  {marcas.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <div id="button-group">
                <button onClick={handleSearch} className="button">Pesquisar</button>
                <button onClick={handleClear} className="button">Limpar</button>
                <button onClick={() => {
                  setIsModalOpen(true);
                  setIsEdit(false);
                  setSelectedCarro(null);
                }} className="button">Cadastrar</button>
              </div>
            </div>
          </div>

          <div id="separator-bar"></div>

          <div id="results-container">
            <div id="carro-grid-container">
              <table id="carro-grid">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Modelo</th>
                    <th>Placa</th>
                    <th>Quilometragem</th>
                    <th>Marca</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCarros.map((carro) => {
                    const marca = marcas.find(marca => marca.id == carro.marcaId);
                    return (
                      <tr key={carro.id}>
                        <td>{carro.id}</td>
                        <td>{carro.modelo}</td>
                        <td>{carro.placa}</td>
                        <td>{carro.quilometragem}</td>
                        <td>{marca?.nome || 'Desconhecida'}</td>
                        <td>
                          <button
                            onClick={() => handleEditClick(carro)}
                            className="edit-button"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div id="pagination-container">
              <button onClick={handlePreviousPage} disabled={currentPage === 1} className="pagination-button">
                Anterior
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button onClick={handleNextPage} disabled={currentPage === totalPages} className="pagination-button">
                Próximo
              </button>
              <div id="show-more-container">
                <label htmlFor="rows-select">Mostrar</label>
                <select id="rows-select" onChange={handleRowsChange} value={rowsPerPage}>
                  <option value="10">10 linhas</option>
                  <option value="20">20 linhas</option>
                  <option value="30">30 linhas</option>
                </select>
              </div>
            </div>
          </div>

          {isModalOpen && (
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSubmit={isEdit ? handleEditSubmit : handleAddCarro}
              defaultValues={selectedCarro}
              marcas={marcas}
              isEdit={isEdit}
            />
          )}
        </>
      )}
      {toast.message && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default Carros;