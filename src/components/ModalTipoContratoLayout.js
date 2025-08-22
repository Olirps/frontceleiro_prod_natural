import { useState } from 'react';
import { addTipoContratosLayout, alterarTipoContratosLayout } from '../services/api';
import Toast from '../components/Toast';
import { useEffect } from 'react';

const ModalTipoContratoLayout = ({ isOpen, onClose, onTipoLayoutAdicionado, tipoLayout, edit }) => {
    const [descricao, setDescricao] = useState('');
    const [status, setStatus] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (edit) {
            setDescricao(tipoLayout.descricao || '');
            setStatus(tipoLayout.status || '');
        } else {
            setDescricao('');
            setStatus('');

        }
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
            const tipoContrato = { descricao, status };
            if (!edit) {
                const tipo = await addTipoContratosLayout(tipoContrato);
                if (tipo) {
                    setDescricao('')
                    onTipoLayoutAdicionado(tipo);
                    setToast({ message: 'Tipo Contrato Layout Adionado com sucesso', type: "success" })
                    onClose();
                }
            } else {
                const tipo = await alterarTipoContratosLayout(tipoLayout.id, { descricao, status })
                setToast({ message: 'Tipo Contrato Layout Alterado com sucesso', type: "success" })
                onClose();
            }

        } catch (err) {
            setLoading(false);
            const errorMessage = err.response?.data?.error || "Erro ao cadastrar Tipo Layout Contrato.";
            setToast({ message: errorMessage, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-lg"
                    onClick={onClose}
                >
                    ×
                </button>
                <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                    {edit ? 'Editar Tipo Contrato' : 'Cadastrar Tipo Contrato'}
                </h2>
                <form
                    onSubmit={handleSave}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                    className="space-y-4"
                >
                    <div>
                        <label className="flex items-center justify-between text-sm font-medium text-gray-700">
                            <span>Tipo Contrato:</span>
                            <span className="flex items-center space-x-2">
                                <span className="text-gray-500">Ativo?</span>
                                <input
                                    type="checkbox"
                                    checked={status}
                                    onChange={(e) => setStatus(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                            </span>
                        </label>
                        <input
                            type="text"
                            className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value.toUpperCase())}
                            required
                        />
                    </div>

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
                {toast.message && <Toast type={toast.type} message={toast.message} />}
            </div>
        </div>
    );

};

export default ModalTipoContratoLayout;
