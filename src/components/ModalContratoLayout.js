
import { useState } from 'react';
import { addContratosLayout, alterarContratosLayout, getTipoContratosLayout } from '../services/api';
import Toast from '../components/Toast';
import { useEffect } from 'react';


const ModalContratoLayout = ({ isOpen, onClose, onLayoutAdicionado, Layout, edit }) => {

    const [tipoContratosLayout, setTipoContratosLayout] = useState([]);
    const [id_tipo_contrato, setIdTituloLayout] = useState('');
    const [titulo_contrato, setTituloContrato] = useState('');
    const [texto_clausula, setTextoClausula] = useState('');
    const [ordem, setOrdem] = useState('');
    const [status, setStatus] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const fetchData = async () => {
            const data = await getTipoContratosLayout(
                { status: 1 },
                1,
                50
            );
            setTipoContratosLayout(data.data || []);
        }
        if (edit) {
            setTituloContrato(Layout.titulo_contrato || '');
            setTextoClausula(Layout.texto_clausula || '');
            setOrdem(Layout.ordem || '');
            setIdTituloLayout(Layout.id_tipo_contrato || '');
            setStatus(Layout.status || '');
        } else {
            setTituloContrato('');
            setTituloContrato('');
            setTextoClausula('');
            setOrdem('');
        }
        fetchData();
    }, [isOpen, edit]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const Contrato = { titulo_contrato, texto_clausula, id_tipo_contrato, ordem, status };
            if (!edit) {
                const tipo = await addContratosLayout(Contrato);
                if (tipo) {
                    setTituloContrato('');
                    setTextoClausula('');
                    setOrdem('');
                    onLayoutAdicionado(tipo);
                    setToast({ message: 'Contrato Layout Adionado com sucesso', type: "success" })
                    onClose();
                }
            } else {
                const tipo = await alterarContratosLayout(Layout.id, { id_tipo_contrato, titulo_contrato, texto_clausula, ordem, status })
                setToast({ message: 'Contrato Layout Alterado com sucesso', type: "success" })
            }

        } catch (err) {
            setLoading(false);
            const errorMessage = err.response?.data?.error || "Erro ao cadastrar Contrato Layout.";
            setToast({ message: errorMessage, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2> {edit ? 'Editar Contrato Layout' : 'Cadastrar Contrato Layout'}</h2>
                <form onSubmit={handleSave} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
                    <div id='cadastro-padrão'>
                        <div>
                            <input type='hidden' value={id_tipo_contrato} />
                            <label htmlFor="tipoContrato">Tipo de Contrato:</label>
                            {/* Corrigir o select para: */}
                            <select
                                id="tipoContrato"
                                className="input-geral"
                                value={id_tipo_contrato}  // Usar o estado do ID selecionado
                                onChange={(e) => setIdTituloLayout(e.target.value)}  // Atualizar apenas o ID
                                required
                            >
                                <option value="">Selecione...</option>
                                {Array.isArray(tipoContratosLayout) && tipoContratosLayout.map((tipo) => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.descricao}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="titulo_contrato">Titulo Contrato:  Ativo?
                                <input
                                    type="checkbox"
                                    checked={status}
                                    onChange={(e) => setStatus(e.target.checked)}
                                    required
                                /></label>
                            <input
                                type="text"
                                className='input-geral'
                                value={titulo_contrato}
                                onChange={(e) => setTituloContrato(e.target.value.toUpperCase())}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="ordem">Ordem:</label>
                            <input
                                type="number"
                                className='input-geral'
                                value={ordem}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) setOrdem(val); // Aceita apenas inteiros positivos
                                }}
                                required
                                step="1"
                            />
                        </div>
                        <div>
                            <label htmlFor="texto_clausula">Texto:</label>
                            <textarea
                                type="text"
                                className='input-geral'
                                value={texto_clausula}
                                onChange={(e) => setTextoClausula(e.target.value.toUpperCase())}
                                required
                            />
                        </div>

                    </div>

                    <div id='button-group'>
                        <button className='button' type="submit" disabled={loading}>{loading ? 'Salvando' : 'Salvar'}</button>
                    </div>
                </form>
                {toast.message && <Toast type={toast.type} message={toast.message} />}
            </div>
        </div>
    );
}


export default ModalContratoLayout;