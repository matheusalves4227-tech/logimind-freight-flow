/**
 * Formata valores monetários no padrão brasileiro (pt-BR)
 * @param valor - Valor numérico a ser formatado
 * @returns String formatada como moeda brasileira (ex: R$ 10.350,00)
 */
export function formatarMoeda(valor: number | undefined | null): string {
  if (typeof valor !== 'number' || isNaN(valor)) {
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
  if (typeof valor !== 'number' || isNaN(valor)) {
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
  if (typeof valor !== 'number' || isNaN(valor)) {
    return '0,0%';
  }
  
  const valorPercentual = (valor >= 1) ? valor : valor * 100;
  
  return valorPercentual.toLocaleString('pt-BR', { 
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1 
  }) + '%';
}
