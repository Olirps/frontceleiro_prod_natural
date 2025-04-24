// src/utils/hasPermission.js
export const hasPermission = (permissoes, pageName, action) => {
    const pagePermission = permissoes.find(p => p.pagename === pageName);

    if (pagePermission) {
        return pagePermission[action] === true;  // Verifica diretamente o valor booleano
    }
    return false;
};
