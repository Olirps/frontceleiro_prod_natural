// src/components/PermissionModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { requestAuthorization } from "../services/ApiPermissoes/ApiPermissoes";

const PermissionModal = ({
  actionRequest,
  pendingAction,
  onClose,
  onSucess
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  // reset + foco ao abrir
  useEffect(() => {
    setUsername("");
    setPassword("");
    setError("");
    usernameRef.current?.focus();
  }, []);

  // ESC fecha
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleAuthorize = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await requestAuthorization({
        username,
        password,
        page: actionRequest.page,
        action: actionRequest.action,
        requestedBy: localStorage.getItem("username"),
      });

      if (result?.authorized) {
        pendingAction?.();
        onSucess ? onSucess() : onClose();
      } else {
        setError("Você não tem permissão para executar esta ação");
      }
    } catch (err) {
      setError(err?.message || "Falha na autorização");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDownUsername = (e) => {
    if (e.key === "Enter" && username.trim()) {
      passwordRef.current?.focus();
    }
  };

  const handleKeyDownPassword = (e) => {
    if (e.key === "Enter" && username.trim() && password.trim()) {
      handleAuthorize();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div
        className="bg-white p-6 rounded-2xl shadow-xl w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">Permissão necessária</h2>

        <p className="text-sm mb-3">
          Essa ação exige autorização. Informe usuário e senha:
        </p>

        <input
          ref={usernameRef}
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDownUsername}
          className="w-full border rounded p-2 mb-2"
        />

        <input
          ref={passwordRef}
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDownPassword}
          className="w-full border rounded p-2 mb-2"
        />

        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            onClick={handleAuthorize}
            disabled={loading || !username || !password}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Autorizando..." : "Autorizar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;
