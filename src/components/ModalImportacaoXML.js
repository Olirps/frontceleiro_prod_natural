import React, { useState } from 'react';
import '../styles/ModalImportacaoXML.css'; // Certifique-se de criar este CSS também

const ModalImportacaoXML = ({ isOpen, onClose, onSubmit }) => {
  const [file, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files); // Converte FileList para array

    const xmlFiles = selectedFiles.filter(file => {
      const isXMLType = file.type === 'application/xml' || file.type === 'text/xml'; // Verifica o tipo MIME
      const isXMLExtension = file.name.toLowerCase().endsWith('.xml'); // Verifica a extensão do arquivo
      return isXMLType || isXMLExtension; // Retorna true se um dos critérios for atendido
    });

    if (xmlFiles.length > 0) {
      setFiles(xmlFiles); // Define o estado com a lista de arquivos
      setError('');
    } else {
      setFiles([]);
      setError('Por favor, selecione arquivos XML.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Garantir que o e seja um evento de formulário
    setLoading(true); // Ativa o estado de carregamento

    try {
      await onSubmit(file); // Passar o evento para a função onSubmit
    } catch (error) {
      setError('Erro ao importar o arquivo. Tente novamente.');
    } finally {
      setLoading(false); // Desativa o estado de carregamento
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>X</button>
        <h2>Importar Arquivo XML</h2>
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <>
            {/* Conteúdo da página quando o carregamento estiver completo */}

            <form onSubmit={handleSubmit}>
              <div id='cadastro-padrao'>
                <label htmlFor="file">Selecione o arquivo XML</label>
                <input
                  className='input-geral'
                  type="file"
                  id="file"
                  name="file"
                  accept=".xml"
                  multiple // Permite a seleção de múltiplos arquivos
                  onChange={handleFileChange}
                  required
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="button-geral">Importar</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ModalImportacaoXML;
