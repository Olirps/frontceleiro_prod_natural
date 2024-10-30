// utils.js

// Função para aplicar a máscara de CPF ou CNPJ
export const cpfCnpjMask = (value) => {
  const numericValue = value.replace(/\D/g, ''); // Remove caracteres não numéricos

  if (numericValue.length <= 11) {
    // Aplica máscara de CPF
    return numericValue
      .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona ponto após o terceiro dígito
      .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona ponto após o sexto dígito
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Adiciona hífen após o nono dígito
      .replace(/(-\d{2})\d+?$/, '$1'); // Garante que apenas dois dígitos após o hífen
  } else {
    // Aplica máscara de CNPJ
    return numericValue
      .replace(/(\d{2})(\d)/, '$1.$2') // Adiciona ponto após o segundo dígito
      .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona ponto após o quinto dígito
      .replace(/(\d{3})(\d)/, '$1/$2') // Adiciona barra após o oitavo dígito
      .replace(/(\d{4})(\d{1,2})/, '$1-$2') // Adiciona hífen após o décimo segundo dígito
      .replace(/(-\d{2})\d+?$/, '$1'); // Garante que apenas dois dígitos após o hífen
  }
};
  
export const removeMaks = (cpf) => {
  return cpf.replace(/\D/g, '');
};
  
  // Outras funções de máscara podem ser adicionadas aqui