import { useState } from "react";

export default function AlteraSenhaUsuario({ isOpen, onClose, onSave }) {
    const [showPassword, setShowPassword] = useState(false);
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmaSenha, setConfirmaSenha] = useState("");
    const [erro, setErro] = useState("");

    if (!isOpen) return null;

    const handleSave = () => {
        if (!senhaAtual || !novaSenha || !confirmaSenha) {
            setErro("Todos os campos são obrigatórios.");
            return;
        }
        if (novaSenha !== confirmaSenha) {
            setErro("A nova senha e a confirmação não coincidem.");
            return;
        }
        setErro("");
        onSave({ senhaAtual, novaSenha });
        // limpa campos
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmaSenha("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg w-96 p-6 relative shadow-lg">
                <h2 className="text-lg font-bold mb-4">Alterar Senha</h2>

                {erro && <p className="text-red-500 text-sm mb-2">{erro}</p>}

                <div className="mb-3">
                    <label className="block text-gray-800 text-sm mb-1">Senha Atual</label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="mb-3">
                    <label className="block text-gray-800 text-sm mb-1">Nova Senha</label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-800 text-sm mb-1">Confirma Nova Senha</label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmaSenha}
                        onChange={(e) => setConfirmaSenha(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center mb-4">
                    <input
                        id="show-password"
                        type="checkbox"
                        checked={showPassword}
                        onChange={() => setShowPassword(!showPassword)}
                        className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="show-password" className="text-sm text-gray-700 cursor-pointer">
                        Mostrar senhas
                    </label>
                </div>


                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}
