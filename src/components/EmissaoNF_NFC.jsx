import React from 'react';
import nfeImage from '../img/nfe_logo.png';
import nfceImage from '../img/nfce_logo.png';

const EmissaoNF_NFC = ({ isOpen, onClose, onEmitirNFe, onEmitirNFCe }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl mx-4 animate-fadeIn">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">
                        Escolha o tipo de emissão
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <p className="text-gray-600 mb-8 text-center">
                    Selecione abaixo o tipo de nota fiscal que deseja emitir.
                </p>

                {/* Opções — agora lado a lado em telas grandes */}
                <div className="flex flex-col sm:flex-row sm:justify-center gap-6">
                    <button
                        onClick={onEmitirNFe}
                        className="group border border-blue-200 hover:border-blue-400 rounded-xl bg-gradient-to-r from-blue-50 to-white hover:shadow-lg transition-all duration-300 flex flex-col items-center p-5 sm:w-1/2"
                    >
                        <img
                            src={nfeImage}
                            alt="NF-e"
                            className="w-20 h-20 object-contain bg-white rounded-md p-2 mb-3 group-hover:scale-105 transition-transform"
                        />
                        <span className="text-blue-700 font-semibold text-lg">
                            Emitir NF-e
                        </span>
                        <span className="text-sm text-gray-500">Nota Fiscal Eletrônica</span>
                    </button>

                    <button
                        onClick={onEmitirNFCe}
                        className="group border border-green-200 hover:border-green-400 rounded-xl bg-gradient-to-r from-green-50 to-white hover:shadow-lg transition-all duration-300 flex flex-col items-center p-5 sm:w-1/2"
                    >
                        <img
                            src={nfceImage}
                            alt="NFC-e"
                            className="w-20 h-20 object-contain bg-white rounded-md p-2 mb-3 group-hover:scale-105 transition-transform"
                        />
                        <span className="text-green-700 font-semibold text-lg">
                            Emitir NFC-e
                        </span>
                        <span className="text-sm text-gray-500">
                            Nota Fiscal do Consumidor
                        </span>
                    </button>
                </div>

                {/* Rodapé */}
                <div className="flex justify-center mt-8">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors duration-200"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>

    );
};

export default EmissaoNF_NFC;
