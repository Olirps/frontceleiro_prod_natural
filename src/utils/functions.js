
function converterData(dataString) {
  const partes = dataString.split(/[\/ :]/); // Divide a string em dia, mês, ano, hora, minuto e segundo
  const dia = partes[0];
  const mes = partes[1];
  const ano = partes[2];
  const hora = partes[3];
  const minuto = partes[4];
  const segundo = partes[5];

  return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`; // Usa template literals para formatar
}

function formatarDataResumida(dataString) {
  const data = new Date(dataString);
  const dia = String(data.getUTCDate()).padStart(2, '0');
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0'); // Janeiro é 0
  const ano = data.getUTCFullYear();

  return `${dia}/${mes}/${ano}`;
}

function formatPlaca(placa) {
  // Remove todos os caracteres não numéricos ou letras
  const placaLimpa = placa.replace(/[^A-Za-z0-9]/g, '');
  // Adiciona a máscara de placa '000-0000' (com 7 caracteres no total)
  if (placaLimpa.length <= 3) {
    return placaLimpa.toUpperCase();
  } else if (placaLimpa.length <= 6) {
    return placaLimpa.substring(0, 3) + '-' + placaLimpa.substring(3, 6).toUpperCase();
  } else {
    return placaLimpa.substring(0, 3) + '-' + placaLimpa.substring(3, 7).toUpperCase();
  }
};

function decodeJWT(token) {
  // Se o token não for válido ou não tiver 3 partes, retorna null
  if (!token || token.split('.').length !== 3) {
    return null;
  }

  const base64Url = token.split('.')[1]; // Obtém a parte "payload" do token
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Ajusta a codificação para base64 padrão

  // Decodifica a string base64 para JSON
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  // Retorna o payload como um objeto JavaScript
  return JSON.parse(jsonPayload);
};


function formatarCelular(value) {
  if (!value) {
    return null
  } else {
    value = value.replace(/\D/g, '') || 0;
  }
  if (value.length > 10) {
    value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  } else {
    value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  }
  return value;
}

const formatarNumero = (valor) => {
  if (!valor) return "";
  return Number(valor.replace(/\D/g, "")).toLocaleString("pt-BR");
};

const converterMoedaParaNumero = (valor) => {
  if (!valor) return 0;

  // Remove "R$", espaços e pontos, substitui vírgula por ponto
  let numeroLimpo = valor.replace(/R\$\s?|\./g, "").replace(",", ".");

  // Converte para número decimal
  return parseFloat(numeroLimpo);
};

const formatarMoedaBRL = (valor) => {
  if (!valor) return "";
  let numeroConvertido = Number(valor);
  let numeroLimpo = 0;
  let valorNovo = valor;
  if (Number.isInteger(valor)) {
    numeroConvertido = numeroConvertido.toFixed(2);
    numeroLimpo = String(numeroConvertido).replace(/\D/g, "");
  } else {
    const vlrNovo = String(valor)
    const casasDecimais = vlrNovo.split(".")[1]?.length || 0;
    if (casasDecimais === 1) {
      valorNovo = valor.toFixed(2)
    }
    numeroLimpo = String(valorNovo).replace(/\D/g, "");
  }


  // Converte para número e formata no padrão brasileiro
  let numeroFormatado = (Number(numeroLimpo) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return numeroFormatado;
};


const formatarData = (data) => {
  const dataCorrigida = new Date(data);
  dataCorrigida.setMinutes(dataCorrigida.getMinutes() + dataCorrigida.getTimezoneOffset()); // Ajuste de fuso horário
  return dataCorrigida.toLocaleDateString('pt-BR');
};

const normalizarNumero = (valor)=> {
  if (typeof valor !== "string") return NaN; // Garante que o valor é uma string
  
  // Remove qualquer caractere que não seja número, vírgula ou ponto
  valor = valor.replace(/[^\d,.-]/g, '');
  
  // Se tiver mais de uma vírgula ou ponto, pode ser um caso inválido
  const temMultiplasVirgulas = (valor.match(/,/g) || []).length > 1;
  const temMultiplosPontos = (valor.match(/\./g) || []).length > 1;
  if (temMultiplasVirgulas || temMultiplosPontos) return NaN;

  // Substitui vírgula decimal por ponto para padronizar como número float
  valor = valor.replace(',', '.');

  // Converte para float
  const numero = parseFloat(valor);

  return isNaN(numero) ? NaN : numero;
}

module.exports = { converterData, formatarDataResumida, formatarData, formatPlaca, decodeJWT, formatarCelular, converterMoedaParaNumero, formatarNumero, formatarMoedaBRL ,normalizarNumero};