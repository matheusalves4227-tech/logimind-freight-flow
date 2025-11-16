/**
 * Formata valores monetários no padrão brasileiro (pt-BR)
 * @param valor - Valor numérico a ser formatado
 * @returns String formatada como moeda brasileira (ex: R$ 10.350,00)
 */
export function formatarMoeda(valor: number | undefined | null): string {
  if (valor === null || valor === undefined || typeof valor !== 'number' || isNaN(valor)) {
    return 'R$ 0,00';
  }
  
  return valor.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formata porcentagens no padrão brasileiro (pt-BR)
 * @param valor - Valor decimal (ex: 0.18 para 18%) ou já em percentual (18.00)
 * @returns String formatada como porcentagem (ex: 18,00%)
 */
export function formatarPorcentagem(valor: number | undefined | null): string {
  if (valor === null || valor === undefined || typeof valor !== 'number' || isNaN(valor)) {
    return '0,00%';
  }
  
  // Se o valor for menor que 1, assumimos que está em formato decimal (0.18)
  // Se for maior ou igual a 1, assumimos que já está em formato percentual (18.00)
  const valorPercentual = (valor >= 1) ? valor : valor * 100;
  
  return valorPercentual.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) + '%';
}

/**
 * Formata porcentagem com uma casa decimal
 * @param valor - Valor decimal (ex: 0.18 para 18%)
 * @returns String formatada (ex: 18,0%)
 */
export function formatarPorcentagemSimples(valor: number | undefined | null): string {
  if (valor === null || valor === undefined || typeof valor !== 'number' || isNaN(valor)) {
    return '0,0%';
  }
  
  const valorPercentual = (valor >= 1) ? valor : valor * 100;
  
  return valorPercentual.toLocaleString('pt-BR', { 
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1 
  }) + '%';
}

/**
 * Formata peso em kg com separador de milhares
 * @param valor - String com o valor do peso
 * @returns String formatada (ex: 20.000)
 */
export function formatarPeso(valor: string): string {
  // Remove tudo exceto números
  const apenasNumeros = valor.replace(/\D/g, '');
  
  if (!apenasNumeros) return '';
  
  // Converte para número e formata com separador de milhares
  const numero = parseInt(apenasNumeros);
  return numero.toLocaleString('pt-BR');
}

/**
 * Remove formatação do peso para obter o valor numérico
 * @param valorFormatado - String formatada (ex: "20.000")
 * @returns String numérica (ex: "20000")
 */
export function removerFormatacaoPeso(valorFormatado: string): string {
  return valorFormatado.replace(/\./g, '');
}

/**
 * Formata valor monetário enquanto o usuário digita
 * @param valor - String com o valor
 * @returns String formatada como moeda (ex: 200.000,00)
 */
export function formatarValorMonetario(valor: string): string {
  // Remove tudo exceto números
  const apenasNumeros = valor.replace(/\D/g, '');
  
  if (!apenasNumeros) return '';
  
  // Converte para número considerando os últimos 2 dígitos como centavos
  const numero = parseInt(apenasNumeros) / 100;
  
  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Remove formatação monetária para obter o valor numérico
 * @param valorFormatado - String formatada (ex: "200.000,00")
 * @returns String numérica (ex: "200000.00")
 */
export function removerFormatacaoMonetaria(valorFormatado: string): string {
  // Remove pontos de milhares e substitui vírgula por ponto
  return valorFormatado.replace(/\./g, '').replace(',', '.');
}

/**
 * Formata data no padrão brasileiro (dd/mm/yyyy)
 * @param date - String ISO de data ou objeto Date
 * @returns String formatada (ex: 15/03/2024)
 */
export function formatDate(date: string | Date): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '-';
  
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
