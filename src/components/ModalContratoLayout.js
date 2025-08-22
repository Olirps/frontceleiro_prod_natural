
import { useState, useRef } from 'react';
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

    const tituloRef = useRef(null);
    const textoRef = useRef(null);


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
                onClose();
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative overflow-y-auto max-h-[90vh]">
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-lg"
                    onClick={onClose}
                >
                    ×
                </button>

                <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                    {edit ? 'Editar Contrato Layout' : 'Cadastrar Contrato Layout'}
                </h2>

                <form onSubmit={handleSave} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} className="space-y-4">
                    <input type="hidden" value={id_tipo_contrato} />

                    {/* Tipo de Contrato */}
                    <div>
                        <label htmlFor="tipoContrato" className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Contrato:
                        </label>
                        <select
                            id="tipoContrato"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={id_tipo_contrato}
                            onChange={(e) => setIdTituloLayout(e.target.value)}
                            required
                        >
                            <option value="">Selecione...</option>
                            {Array.isArray(tipoContratosLayout) &&
                                tipoContratosLayout.map((tipo) => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.descricao}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Título do Contrato + Ativo */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="titulo_contrato" className="text-sm font-medium text-gray-700">
                                Título do Contrato:
                            </label>
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-500">Ativo?</span>
                                <input
                                    type="checkbox"
                                    checked={status}
                                    onChange={(e) => setStatus(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <input
                            type="text"
                            id="titulo_contrato"
                            ref={tituloRef}
                            value={titulo_contrato}
                            onChange={(e) => {
                                const { selectionStart } = e.target;
                                const upper = e.target.value.toUpperCase();
                                setTituloContrato(upper);
                                setTimeout(() => {
                                    if (tituloRef.current) {
                                        tituloRef.current.selectionStart = selectionStart;
                                        tituloRef.current.selectionEnd = selectionStart;
                                    }
                                }, 0);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Ordem */}
                    <div>
                        <label htmlFor="ordem" className="block text-sm font-medium text-gray-700 mb-1">
                            Ordem:
                        </label>
                        <input
                            type="number"
                            id="ordem"
                            value={ordem}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val)) setOrdem(val);
                            }}
                            step="1"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Texto da Cláusula */}
                    <div>
                        <label htmlFor="texto_clausula" className="block text-sm font-medium text-gray-700 mb-1">
                            Texto:
                        </label>
                        <textarea
                            id="texto_clausula"
                            ref={textoRef}
                            value={texto_clausula}
                            onChange={(e) => {
                                const { selectionStart } = e.target;
                                const upper = e.target.value.toUpperCase();
                                setTextoClausula(upper);
                                setTimeout(() => {
                                    if (textoRef.current) {
                                        textoRef.current.selectionStart = selectionStart;
                                        textoRef.current.selectionEnd = selectionStart;
                                    }
                                }, 0);
                            }}
                            rows={6}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                            required
                        />
                    </div>

                    {/* Botão de ação */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg text-white font-semibold transition duration-200 ${loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>

                {/* Toast */}
                {toast.message && <Toast type={toast.type} message={toast.message} />}
            </div>
        </div>
    );

}


export default ModalContratoLayout;