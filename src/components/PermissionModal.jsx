// src/components/PermissionModal.jsx
import React, { useState, useRef, useEffect } from "react";

import { requestAuthorization } from '../services/ApiPermissoes/ApiPermissoes';

const PermissionModal = ({ actionRequest, pendingAction, onClose, onSucess }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const usernameRef = useRef(null);
    const passwordRef = useRef(null);

    // Autofoco no campo de usuário ao abrir o modal
    useEffect(() => {
        usernameRef.current?.focus();
    }, []);

    const handleAuthorize = async () => {
        try {
            const result = await requestAuthorization({
                username,
                password,
                page: actionRequest.page,
                action: actionRequest.action,
                requestedBy: localStorage.getItem("username"),
            });

            // Verifica se o backend retornou autorizado
            if (result?.authorized) {
                // sucesso → executa ação original
                pendingAction?.();
                if (onSucess === undefined) {
                    onClose();
                } else {
                    onSucess();
                }

            } else {
                // não autorizado
                setError("Você não tem permissão para executar esta ação");
            }
        } catch (err) {
            setError(err.message || "Falha na autorização");
        }
    };

    const handleKeyDownUsername = (e) => {
        if (e.key === "Enter" && username.trim() !== "") {
            passwordRef.current?.focus();
        }
    };

    const handleKeyDownPassword = (e) => {
        if (e.key === "Enter" && username.trim() !== "" && password.trim() !== "") {
            handleAuthorize();
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-96">
                <h2 className="text-lg font-bold mb-4">Permissão necessária</h2>
                <p className="text-sm mb-3">
                    Essa ação exige autorização. Informe usuário e senha:
                </p>

                <input
                    type="text"
                    placeholder="Usuário"
                    value={username}
                    ref={usernameRef}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDownUsername}
                    className="w-full border rounded p-2 mb-2"
                />
                <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    ref={passwordRef}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDownPassword}
                    className="w-full border rounded p-2 mb-2"
                />

                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleAuthorize}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Autorizar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermissionModal;
