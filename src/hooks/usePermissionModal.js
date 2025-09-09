// src/hooks/usePermissionModal.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PermissionModal from "../components/PermissionModal";
import { hasPermission } from "../utils/hasPermission";

export const usePermissionModal = (permissions) => {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [actionRequest, setActionRequest] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingDeniedAction, setPendingDeniedAction] = useState(null);
  const navigate = useNavigate();

  const checkPermission = (page, action, onAuthorized, onDenied) => {
    if (hasPermission(permissions, page, action)) {
      onAuthorized?.(); // já tem permissão
      return true;
    } else {
      // guarda ação e abre modal de autorização
      setActionRequest({ page, action });
      setPendingAction(() => onAuthorized);
      setPendingDeniedAction(() => onDenied);
      setShowPermissionModal(true);
      return false;
    }
  };

  const handleSuccess = () => {
    if (pendingAction) {
      pendingAction(); // executa a ação guardada
      setPendingAction(null);
    }
    setPendingDeniedAction(null);
    setShowPermissionModal(false);
  };

  const handleDenied = () => {
    const denied = pendingDeniedAction;
    setPendingAction(null);
    setPendingDeniedAction(null);
    setShowPermissionModal(false);
    if (denied) {
      denied(); // fallback customizado
    } else {
      navigate("/home"); // fallback padrão
    }
  };

  const PermissionModalUI = () =>
    showPermissionModal && (
      <PermissionModal
        actionRequest={actionRequest}
        onClose={handleDenied}
        onSucess={handleSuccess}
      />
    );

  return { checkPermission, PermissionModalUI };
};
