import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, getRateLimitHeaders, getClientIdentifier } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod Schema for Quote Request Validation
const QuoteRequestSchema = z.object({
  service_type: z.enum(['ltl', 'ftl']),
  vehicle_type: z.enum(['moto', 'carro', 'picape', 'caminhao_toco', 'caminhao_truck', 'carreta']).optional(),
  origin_cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP deve ter 8 dígitos'),
  origin_number: z.string().min(1).max(20),
  origin_type: z.enum(['commercial', 'residential']),
  destination_cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP deve ter 8 dígitos'),
  destination_number: z.string().min(1).max(20),
  destination_type: z.enum(['commercial', 'residential']),
  weight_kg: z.number().positive().max(200000, 'Peso máximo: 200.000 kg'),
  height_cm: z.number().positive().max(1000).optional(),
  width_cm: z.number().positive().max(1000).optional(),
  length_cm: z.number().positive().max(2000).optional(),
  cargo_value: z.number().nonnegative().max(100000000).optional(), // Max R$ 100 milhões
});

// LogiMind Constants
const COMISSAO_PADRAO = 0.10; // 10% - Comissão Padrão da Plataforma
const COMISSAO_MINIMA = 0.05; // 5% - Comissão mínima da plataforma (take-rate mínimo operacional)

// LogiMind 1.0 - Subsídio de Rotas de Retorno (Baixa Demanda)
const SUBSIDIO_MAXIMO_PERMITIDO = 0.50; // 50% - Máximo de subsídio sobre a comissão padrão

// LogiMind 2.0 - Regra de Competição (mantida)
const TOLERANCIA_PRECO = 1.03; // 3% acima do preço de mercado

// LogiMind 3.0 - Otimização de Rotas de Alta Demanda
// Em rotas de alta liquidez/competição, reduz comissão para garantir melhor preço final
const INTERVALO_AJUSTE_DEMANDA = COMISSAO_PADRAO - COMISSAO_MINIMA; // 0.05 (5%)

// ============================================================================
// LogiGuard Pro - Serviço de Segurança e Rastreamento Premium
// ============================================================================
// VALORES BASEADOS EM PESQUISA DE MERCADO BRASILEIRO (Jan 2025)
// Fontes: Seguradoras, Gerenciadoras de Risco, Empresas de Rastreamento
//
// 1. SEGURO DE CARGA: 0.15% a 1.5% do valor da mercadoria (varia por risco)
// 2. GRIS (Gerenciamento de Risco): 0.1% a 0.5% do valor da carga
// 3. RASTREAMENTO 24/7: R$ 80 a R$ 150 por frete (caminhões/frotas)
// ============================================================================

const LOGIGUARD_MARKUP = 0.25; // 25% de markup LogiMarket sobre custo do parceiro
const LOGIGUARD_VALOR_LIMITE = 50000.00; // R$ 50.000,00 - Limite para oferecer serviço
const LOGIGUARD_RISCO_LIMITE = 0.65; // 65% - Fator de risco mínimo para oferecer
const LOGIGUARD_RECOMENDACAO_VALOR = 100000.00; // R$ 100k para recomendação ativa
const LOGIGUARD_RECOMENDACAO_RISCO = 0.80; // 80% de risco para recomendação ativa

// ============================================================================
// TABELA ANTT - Pisos Mínimos de Frete (Atualização Julho 2025)
// ============================================================================
// Fórmula: (Distância × CCD) + CC = Piso Mínimo
// CCD = Coeficiente de Deslocamento (R$/km por eixo carregado)
// CC = Coeficiente de Carga/Descarga (valor fixo)
// Fonte: Resolução ANTT nº 5.867/2020, Atualização Jul/2025
// Diesel S10: R$ 6,02/litro (ANP Jul/2025)
// IPCA Acumulado: 3,28% (Dez/2024 - Mai/2025)
// ============================================================================

// CCD - Coeficiente de Deslocamento por Tipo de Carga (R$/km por eixo)
// Valores atualizados Jul/2025 para veículo sem retorno vazio
const ANTT_CCD: { [key: string]: { [eixos: number]: number } } = {
  'carga_geral': { 2: 0.68, 3: 0.79, 4: 0.89, 5: 0.97, 6: 1.05, 7: 1.16, 9: 1.35 },
  'granel_solido': { 2: 0.65, 3: 0.76, 4: 0.85, 5: 0.93, 6: 1.01, 7: 1.12, 9: 1.30 },
  'granel_liquido': { 2: 0.72, 3: 0.84, 4: 0.94, 5: 1.03, 6: 1.11, 7: 1.22, 9: 1.42 },
  'frigorificada': { 2: 0.82, 3: 0.96, 4: 1.08, 5: 1.18, 6: 1.27, 7: 1.40, 9: 1.63 },
  'conteinerizada': { 2: 0.70, 3: 0.82, 4: 0.92, 5: 1.00, 6: 1.08, 7: 1.20, 9: 1.39 },
  'perigosa': { 2: 0.88, 3: 1.03, 4: 1.16, 5: 1.27, 6: 1.37, 7: 1.51, 9: 1.76 },
  'neogranel': { 2: 0.67, 3: 0.78, 4: 0.88, 5: 0.96, 6: 1.04, 7: 1.15, 9: 1.33 },
};

// CC - Coeficiente de Carga/Descarga por Tipo de Carga (valor fixo por operação)
const ANTT_CC: { [key: string]: number } = {
  'carga_geral': 320.00,
  'granel_solido': 280.00,
  'granel_liquido': 360.00,
  'frigorificada': 420.00,
  'conteinerizada': 340.00,
  'perigosa': 480.00,
  'neogranel': 300.00,
};

// Fator de ajuste para retorno vazio (+94% sobre CCD padrão)
const ANTT_FATOR_RETORNO_VAZIO = 0.94;

interface ANTTPisoMinimo {
  valor: number;
  ccd_aplicado: number;
  cc_aplicado: number;
  tipo_carga: string;
  eixos: number;
  distancia_km: number;
  retorno_vazio: boolean;
}

interface QuoteRequest {
  service_type: string;
  vehicle_type?: string; // Para FTL: "moto", "carro", "picape", "caminhao_toco", "caminhao_truck"
  origin_cep: string;
  origin_number: string;
  origin_type: string;
  destination_cep: string;
  destination_number: string;
  destination_type: string;
  weight_kg: number;
  height_cm?: number;
  width_cm?: number;
  length_cm?: number;
  cargo_value?: number; // Valor declarado da carga para LogiGuard Pro
}

interface CarrierQuote {
  carrier_id: string;
  carrier_name: string;
  carrier_size?: string;
  specialties?: string[];
  base_price: number;
  delivery_days: number;
  quality_index: number;
}

interface ProcessedQuote {
  carrier_id: string;
  carrier_name: string;
  carrier_size?: string;
  specialties?: string[];
  base_price: number;
  commission_applied: number;
  final_price: number;
  delivery_days: number;
  quality_index: number;
  route_adjustment_factor: number;
  adjustment_reason?: string;
  logiguard_pro?: {
    available: boolean;
    recommended: boolean;
    base_cost: number;
    markup_value: number;
    total_price: number;
    risk_factor: number;
  };
  antt_piso_minimo?: ANTTPisoMinimo;
}

/**
 * Calcula o Piso Mínimo de Frete ANTT
 * Fórmula oficial: (Distância × CCD) + CC = Piso Mínimo
 * 
 * @param distanciaKm - Distância estimada em km
 * @param tipoCarga - Tipo de carga (carga_geral, granel_solido, etc.)
 * @param eixos - Número de eixos do veículo (2, 3, 4, 5, 6, 7, 9)
 * @param retornoVazio - Se o veículo volta vazio (adiciona 94% ao CCD)
 * @returns Dados do piso mínimo ANTT
 */
function calcularPisoMinimoANTT(
  distanciaKm: number,
  tipoCarga: string = 'carga_geral',
  eixos: number = 5,
  retornoVazio: boolean = false
): ANTTPisoMinimo {
  // Validar tipo de carga
  const tipoNormalizado = tipoCarga.toLowerCase().replace(/\s+/g, '_');
  const ccdTabela = ANTT_CCD[tipoNormalizado] || ANTT_CCD['carga_geral'];
  
  // Validar número de eixos (usar mais próximo se não existir)
  const eixosValidos = Object.keys(ccdTabela).map(Number);
  const eixosAplicados = eixosValidos.reduce((prev, curr) => 
    Math.abs(curr - eixos) < Math.abs(prev - eixos) ? curr : prev
  );
  
  // Buscar CCD para os eixos
  let ccd = ccdTabela[eixosAplicados];
  
  // Aplicar fator de retorno vazio se necessário
  if (retornoVazio) {
    ccd = ccd * (1 + ANTT_FATOR_RETORNO_VAZIO);
  }
  
  // Buscar CC para o tipo de carga
  const cc = ANTT_CC[tipoNormalizado] || ANTT_CC['carga_geral'];
  
  // Calcular piso mínimo: (Distância × CCD) + CC
  const pisoMinimo = (distanciaKm * ccd) + cc;
  
  console.log(
    `[ANTT Piso Mínimo] Tipo: ${tipoNormalizado} | Eixos: ${eixosAplicados} | ` +
    `Distância: ${distanciaKm}km | CCD: R$ ${ccd.toFixed(2)}/km | CC: R$ ${cc.toFixed(2)} | ` +
    `Retorno Vazio: ${retornoVazio ? 'Sim' : 'Não'} | ` +
    `Piso Mínimo: R$ ${pisoMinimo.toFixed(2)}`
  );
  
  return {
    valor: parseFloat(pisoMinimo.toFixed(2)),
    ccd_aplicado: parseFloat(ccd.toFixed(2)),
    cc_aplicado: cc,
    tipo_carga: tipoNormalizado,
    eixos: eixosAplicados,
    distancia_km: distanciaKm,
    retorno_vazio: retornoVazio,
  };
}

/**
 * Estima a distância entre dois CEPs (simplificado)
 * Em produção, usar API de distância (Google Maps, HERE, etc.)
 * 
 * @param originCep - CEP de origem
 * @param destinationCep - CEP de destino
 * @returns Distância estimada em km
 */
function estimarDistanciaCeps(originCep: string, destinationCep: string): number {
  const cleanOrigin = originCep.replace(/\D/g, '');
  const cleanDest = destinationCep.replace(/\D/g, '');
  
  // Extrair região (primeiro dígito) para estimativa
  const regiaoOrigem = parseInt(cleanOrigin[0]);
  const regiaoDestino = parseInt(cleanDest[0]);
  
  // Mapa de regiões brasileiras (CEPs):
  // 0-1: São Paulo | 2: Rio | 3: Minas | 4: Bahia | 5: Nordeste | 6-7: Centro-Oeste/Norte | 8-9: Sul
  
  // Matriz simplificada de distâncias médias entre regiões (km)
  const distanciasRegionais: { [key: string]: number } = {
    '0-0': 50, '0-1': 100, '0-2': 450, '0-3': 600, '0-4': 1500, '0-5': 2000, '0-6': 1200, '0-7': 2000, '0-8': 700, '0-9': 500,
    '1-0': 100, '1-1': 50, '1-2': 400, '1-3': 550, '1-4': 1450, '1-5': 1950, '1-6': 1150, '1-7': 1950, '1-8': 650, '1-9': 450,
    '2-0': 450, '2-1': 400, '2-2': 50, '2-3': 450, '2-4': 1200, '2-5': 1700, '2-6': 1100, '2-7': 2200, '2-8': 1100, '2-9': 900,
    '3-0': 600, '3-1': 550, '3-2': 450, '3-3': 50, '3-4': 1000, '3-5': 1500, '3-6': 800, '3-7': 1800, '3-8': 1200, '3-9': 1000,
    '4-0': 1500, '4-1': 1450, '4-2': 1200, '4-3': 1000, '4-4': 50, '4-5': 500, '4-6': 1200, '4-7': 2000, '4-8': 2100, '4-9': 1900,
    '5-0': 2000, '5-1': 1950, '5-2': 1700, '5-3': 1500, '5-4': 500, '5-5': 50, '5-6': 1500, '5-7': 2200, '5-8': 2600, '5-9': 2400,
    '6-0': 1200, '6-1': 1150, '6-2': 1100, '6-3': 800, '6-4': 1200, '6-5': 1500, '6-6': 50, '6-7': 800, '6-8': 1500, '6-9': 1300,
    '7-0': 2000, '7-1': 1950, '7-2': 2200, '7-3': 1800, '7-4': 2000, '7-5': 2200, '7-6': 800, '7-7': 50, '7-8': 2500, '7-9': 2300,
    '8-0': 700, '8-1': 650, '8-2': 1100, '8-3': 1200, '8-4': 2100, '8-5': 2600, '8-6': 1500, '8-7': 2500, '8-8': 50, '8-9': 200,
    '9-0': 500, '9-1': 450, '9-2': 900, '9-3': 1000, '9-4': 1900, '9-5': 2400, '9-6': 1300, '9-7': 2300, '9-8': 200, '9-9': 50,
  };
  
  const chave = `${regiaoOrigem}-${regiaoDestino}`;
  const distanciaBase = distanciasRegionais[chave] || 500;
  
  // Adicionar variação baseada nos primeiros 5 dígitos para mais precisão
  const subRegiaoOrigem = parseInt(cleanOrigin.substring(0, 5));
  const subRegiaoDestino = parseInt(cleanDest.substring(0, 5));
  const variacao = Math.abs(subRegiaoOrigem - subRegiaoDestino) * 0.001;
  
  const distanciaEstimada = Math.max(50, distanciaBase + (distanciaBase * variacao * 0.1));
  
  console.log(`[Distância Estimada] ${originCep} → ${destinationCep}: ${distanciaEstimada.toFixed(0)} km`);
  
  return parseFloat(distanciaEstimada.toFixed(0));
}

/**
 * Determina número de eixos baseado no peso da carga
 * @param weightKg - Peso da carga em kg
 * @param vehicleType - Tipo de veículo (para FTL)
 * @returns Número de eixos estimado
 */
function estimarEixos(weightKg: number, vehicleType?: string): number {
  // Se tem tipo de veículo específico (FTL)
  if (vehicleType) {
    switch (vehicleType) {
      case 'moto': return 2;
      case 'carro': return 2;
      case 'picape': return 2;
      case 'van': return 2;
      case 'caminhao_toco': return 4;
      case 'caminhao_truck': return 6;
      case 'carreta': return 7;
      case 'carreta_ls': return 9;
      case 'carreta_bi_truck': return 9;
      default: return 5;
    }
  }
  
  // Baseado no peso (para LTL)
  if (weightKg <= 500) return 2;      // Utilitário
  if (weightKg <= 3000) return 3;     // Caminhão 3/4
  if (weightKg <= 6000) return 4;     // Caminhão Toco
  if (weightKg <= 14000) return 6;    // Caminhão Truck
  if (weightKg <= 28000) return 7;    // Carreta simples
  return 9;                            // Carreta bi-truck
}

/**
 * Calcula o serviço LogiGuard Pro com PREÇOS REAIS DE MERCADO
 * Baseado em pesquisa de mercado brasileiro (Jan 2025)
 * 
 * @param cargoValue - Valor declarado da carga
 * @param riskFactor - Fator de risco da rota (0.0 a 1.0)
 * @returns Dados do LogiGuard Pro ou undefined se não aplicável
 */
function calcularLogiGuardPro(cargoValue: number | undefined, riskFactor: number): 
  { available: boolean; recommended: boolean; base_cost: number; markup_value: number; total_price: number; risk_factor: number; } | undefined {
  
  // Se não há valor declarado, não oferece o serviço
  if (!cargoValue || cargoValue <= 0) {
    return undefined;
  }
  
  // Verifica se deve exibir a opção LogiGuard Pro
  const shouldOffer = cargoValue > LOGIGUARD_VALOR_LIMITE || riskFactor >= LOGIGUARD_RISCO_LIMITE;
  
  if (!shouldOffer) {
    return undefined;
  }
  
  // ===================================================================
  // CÁLCULO BASEADO EM PREÇOS REAIS DE MERCADO BRASILEIRO
  // ===================================================================
  
  // 1. SEGURO DE CARGA (Ad Valorem - % do valor da mercadoria)
  // Baixo risco (0.0-0.4): 0.15% do valor
  // Risco médio (0.4-0.7): 0.50% do valor
  // Alto risco (0.7-1.0): 1.00% do valor
  let taxaSeguro = 0.0015; // 0.15% padrão
  if (riskFactor >= 0.7) {
    taxaSeguro = 0.01; // 1.00%
  } else if (riskFactor >= 0.4) {
    taxaSeguro = 0.005; // 0.50%
  }
  const custoSeguro = cargoValue * taxaSeguro;
  
  // 2. GRIS (Gerenciamento de Risco e Segurança - % do valor)
  // Baixo risco: 0.10% | Médio: 0.25% | Alto: 0.50%
  let taxaGRIS = 0.001; // 0.10% padrão
  if (riskFactor >= 0.7) {
    taxaGRIS = 0.005; // 0.50%
  } else if (riskFactor >= 0.4) {
    taxaGRIS = 0.0025; // 0.25%
  }
  const custoGRIS = cargoValue * taxaGRIS;
  
  // 3. RASTREAMENTO 24/7 + CENTRAL DE MONITORAMENTO (valor fixo por frete)
  // Valor fixo por frete: R$ 100 a R$ 150 (caminhões/frotas)
  let custoRastreamento = 100;
  if (riskFactor >= 0.7) {
    custoRastreamento = 150; // Monitoramento intensivo para alto risco
  } else if (riskFactor >= 0.4) {
    custoRastreamento = 125; // Monitoramento padrão
  }
  
  // CUSTO TOTAL DO PARCEIRO (antes do markup LogiMarket)
  const baseCost = parseFloat((custoSeguro + custoGRIS + custoRastreamento).toFixed(2));
  
  // PREÇO FINAL com markup de 25% LogiMarket
  const markupValue = parseFloat((baseCost * LOGIGUARD_MARKUP).toFixed(2));
  const totalPrice = parseFloat((baseCost + markupValue).toFixed(2));
  
  // Determina se deve recomendar ativamente (selo RECOMENDADO)
  const recommended = cargoValue > LOGIGUARD_RECOMENDACAO_VALOR && riskFactor > LOGIGUARD_RECOMENDACAO_RISCO;
  
  console.log(
    `[LogiGuard Pro - Market Pricing] Cargo Value: R$ ${cargoValue.toFixed(2)} | ` +
    `Risk: ${(riskFactor * 100).toFixed(0)}% | ` +
    `Seguro: R$ ${custoSeguro.toFixed(2)} (${(taxaSeguro * 100).toFixed(2)}%) | ` +
    `GRIS: R$ ${custoGRIS.toFixed(2)} (${(taxaGRIS * 100).toFixed(2)}%) | ` +
    `Rastreamento: R$ ${custoRastreamento.toFixed(2)} | ` +
    `Base Cost: R$ ${baseCost} | ` +
    `Markup (+25%): R$ ${markupValue} | ` +
    `Total: R$ ${totalPrice} | ` +
    `Recommended: ${recommended ? 'YES' : 'NO'}`
  );
  
  return {
    available: true,
    recommended,
    base_cost: baseCost,
    markup_value: markupValue,
    total_price: totalPrice,
    risk_factor: riskFactor,
  };
}

/**
 * Busca o preço de mercado de referência para a rota
 * Mock: retorna 90% do menor preço base das transportadoras
 */
function buscarPrecoMercadoReferencia(cotacoesBrutas: CarrierQuote[]): number {
  const menorPrecoBase = Math.min(...cotacoesBrutas.map(c => c.base_price));
  // Simula um preço de mercado competitivo (90% do menor preço)
  const precoMercado = menorPrecoBase * 0.90;
  console.log(`Market reference price: ${precoMercado} (based on lowest base: ${menorPrecoBase})`);
  return precoMercado;
}

/**
 * LogiMind 3.0 - Otimização para Rotas de Alta Demanda
 * Reduz a comissão da plataforma em rotas de alta liquidez/competição
 * para garantir o melhor preço final ao embarcador e dominar volume de mercado.
 * 
 * @param cotacoesBrutas - Cotações base das transportadoras
 * @param fatorAjusteDemanda - Fator D (0.0 a 1.0) onde 1.0 é altíssima demanda
 * @returns Cotações com comissão reduzida para competitividade
 */
function aplicarRegraAltaDemanda(
  cotacoesBrutas: CarrierQuote[],
  fatorAjusteDemanda: number
): ProcessedQuote[] {
  console.log(`[LogiMind 3.0 - Alta Demanda] Fator de Ajuste: ${fatorAjusteDemanda.toFixed(2)}`);
  
  return cotacoesBrutas.map(cota => {
    const precoBaseFrete = cota.base_price;
    
    // 1. Calcular o Desconto Proporcional
    // Quanto maior o Fator D, maior a redução da comissão
    const descontoComissao = fatorAjusteDemanda * INTERVALO_AJUSTE_DEMANDA;
    
    // 2. Calcular a Nova Comissão Proposta
    const comissaoProposta = COMISSAO_PADRAO - descontoComissao;
    
    // 3. Aplicar o Piso (Limite Mínimo de 5%)
    const comissaoAplicada = Math.max(comissaoProposta, COMISSAO_MINIMA);
    
    // 4. Calcular o Valor da Comissão em Reais
    const valorComissao = precoBaseFrete * comissaoAplicada;
    
    // 5. Calcular o Preço Final do Frete para o Embarcador
    const precoFinalFrete = parseFloat((precoBaseFrete + valorComissao).toFixed(2));
    
    console.log(
      `[LogiMind 3.0] ${cota.carrier_name}: ` +
      `Base=R$ ${precoBaseFrete.toFixed(2)} | ` +
      `Desconto=${(descontoComissao * 100).toFixed(1)}% | ` +
      `Comissão Aplicada=${(comissaoAplicada * 100).toFixed(1)}% (R$ ${valorComissao.toFixed(2)}) | ` +
      `Preço Final=R$ ${precoFinalFrete}`
    );
    
    return {
      carrier_id: cota.carrier_id,
      carrier_name: cota.carrier_name,
      carrier_size: cota.carrier_size,
      specialties: cota.specialties,
      base_price: precoBaseFrete,
      commission_applied: parseFloat(comissaoAplicada.toFixed(4)),
      final_price: precoFinalFrete,
      delivery_days: cota.delivery_days,
      quality_index: cota.quality_index,
      route_adjustment_factor: fatorAjusteDemanda,
      adjustment_reason: 'HIGH_DEMAND_ROUTE',
    };
  });
}

/**
 * LogiMind 1.0 - Subsídio de Rotas de Retorno
 * Reduz a comissão da plataforma para aumentar o valor repassado ao transportador
 * em rotas de baixa ocupação, incentivando aceitação e fidelização.
 */
function aplicarSubsidioRotaRetorno(
  cotacoesBrutas: CarrierQuote[], 
  routeAdjustmentFactor: number
): ProcessedQuote[] {
  console.log(`[LogiMind 1.0 - Subsídio] Fator de Atratividade da Rota: ${routeAdjustmentFactor}`);
  
  return cotacoesBrutas.map(cota => {
    const precoBrutoEmbarcador = cota.base_price;
    
    // 1. Valor Monetário da Comissão Padrão (10%)
    const valorComissaoPadrao = precoBrutoEmbarcador * COMISSAO_PADRAO;
    
    // 2. Cálculo do Percentual de Subsídio Efetivo
    // O subsídio é proporcional ao Fator de Atratividade (routeAdjustmentFactor)
    // e limitado ao máximo permitido (50% da comissão padrão)
    const percentualSubsidioEfetivo = routeAdjustmentFactor * SUBSIDIO_MAXIMO_PERMITIDO;
    
    // 3. Valor Monetário do Subsídio LogiMind
    // Este é o valor que a LogiMind renuncia da sua comissão
    const valorSubsidioLogiMind = valorComissaoPadrao * percentualSubsidioEfetivo;
    
    // 4. Nova Comissão para a LogiMind (após subsídio)
    let novaComissaoLogiMind = valorComissaoPadrao - valorSubsidioLogiMind;
    
    // Garantir que não fique abaixo da comissão mínima (5%)
    const comissaoMinimaValor = precoBrutoEmbarcador * COMISSAO_MINIMA;
    novaComissaoLogiMind = Math.max(novaComissaoLogiMind, comissaoMinimaValor);
    
    // 5. Calcular o percentual de comissão final aplicado
    const comissaoFinalPercentual = parseFloat((novaComissaoLogiMind / precoBrutoEmbarcador).toFixed(4));
    
    // 6. Preço Final para o Embarcador (Base + Comissão Final)
    const precoFinalEmbarcador = parseFloat((precoBrutoEmbarcador + novaComissaoLogiMind).toFixed(2));
    
    // 7. Valor que o Transportador receberá (Preço Final - Comissão)
    const valorTransportador = parseFloat((precoFinalEmbarcador - novaComissaoLogiMind).toFixed(2));
    
    console.log(
      `[LogiMind Subsídio] ${cota.carrier_name}: ` +
      `Base=${precoBrutoEmbarcador.toFixed(2)} | ` +
      `Comissão Padrão=${(COMISSAO_PADRAO * 100).toFixed(0)}% (R$ ${valorComissaoPadrao.toFixed(2)}) | ` +
      `Subsídio=${(percentualSubsidioEfetivo * 100).toFixed(1)}% (R$ ${valorSubsidioLogiMind.toFixed(2)}) | ` +
      `Nova Comissão=${(comissaoFinalPercentual * 100).toFixed(1)}% (R$ ${novaComissaoLogiMind.toFixed(2)}) | ` +
      `Preço Final Embarcador=${precoFinalEmbarcador} | ` +
      `Transportador Recebe=${valorTransportador}`
    );
    
    // 8. Retornar a Cotação com Subsídio Aplicado
    return {
      carrier_id: cota.carrier_id,
      carrier_name: cota.carrier_name,
      carrier_size: cota.carrier_size,
      specialties: cota.specialties,
      base_price: precoBrutoEmbarcador,
      commission_applied: comissaoFinalPercentual,
      final_price: precoFinalEmbarcador,
      delivery_days: cota.delivery_days,
      quality_index: cota.quality_index,
      route_adjustment_factor: routeAdjustmentFactor,
      adjustment_reason: routeAdjustmentFactor > 0 ? 'SUBSIDIZED_ROUTE' : 'STANDARD',
    };
  });
}

/**
 * LogiMind 2.0 - Aplica regra de competição
 * Reduz comissão se o preço estiver acima do mercado
 */
function aplicarRegraCompeticao(
  cotasAjustadas: ProcessedQuote[],
  precoMercadoReferencia: number
): ProcessedQuote[] {
  console.log(`[LogiMind 2.0] Applying competition rule with market reference: ${precoMercadoReferencia}`);
  
  return cotasAjustadas.map(cota => {
    const precoFinalAtual = cota.final_price;
    const precoBase = cota.base_price;
    const comissaoAnterior = cota.commission_applied;
    
    // 1. Calcular o Preço Máximo Competitivo
    const precoCompetitivoMax = Math.round(precoMercadoReferencia * TOLERANCIA_PRECO * 100) / 100;
    
    // 2. Verificar se está acima do limite competitivo
    if (precoFinalAtual > precoCompetitivoMax) {
      // A. Calcular a comissão necessária para atingir o preço competitivo
      const comissaoNecessaria = (precoCompetitivoMax / precoBase) - 1;
      
      // B. Aplicar o piso mínimo de 5%
      const novaComissao = Math.max(comissaoNecessaria, COMISSAO_MINIMA);
      const novaComissaoFormatada = parseFloat(novaComissao.toFixed(4));
      
      // C. Recalcular o preço final (Garantindo 2 casas decimais)
      const novoPrecoFinal = parseFloat((precoBase * (1 + novaComissaoFormatada)).toFixed(2));
      
      console.log(
        `[LogiMind 2.0] ${cota.carrier_name}: ` +
        `Price ${precoFinalAtual} > ${precoCompetitivoMax} (competitive max). ` +
        `Reducing commission ${(comissaoAnterior * 100).toFixed(1)}% → ${(novaComissaoFormatada * 100).toFixed(1)}%, ` +
        `New price: ${novoPrecoFinal}`
      );
      
      return {
        ...cota,
        commission_applied: novaComissaoFormatada,
        final_price: novoPrecoFinal,
        adjustment_reason: 'COMPETITION',
      };
    }
    
    // Já está competitivo, mantém os valores da regra de rotas
    console.log(`[LogiMind 2.0] ${cota.carrier_name}: Price ${precoFinalAtual} is competitive (max: ${precoCompetitivoMax})`);
    return cota;
  });
}

/**
 * Verifica se um CEP está em área de difícil acesso ou com restrição
 */
function verificarAreaRestrita(cep: string): boolean {
  const cleanCep = cep.replace(/\D/g, "");
  
  // Mock de áreas restritas (primeiros 5 dígitos)
  const areasRestritas = [
    "01000", // Centro SP - restrição de caminhões
    "20000", // Centro RJ - restrição de horário
    "30100", // Centro BH - área de difícil acesso
    "40000", // Centro Salvador - restrição de circulação
  ];
  
  const prefix = cleanCep.substring(0, 5);
  return areasRestritas.includes(prefix);
}

/**
 * Busca cotações reais da tabela carrier_price_table
 * Mapeia CEPs para regiões e busca preços cadastrados
 */
async function buscarCotacoesReais(
  supabaseClient: any,
  carriers: any[], 
  originCep: string,
  destinationCep: string,
  weight_kg: number
): Promise<CarrierQuote[]> {
  // Mapear CEP para região (primeiros 5 dígitos)
  const originRegion = originCep.replace(/\D/g, "").substring(0, 5);
  const destinationRegion = destinationCep.replace(/\D/g, "").substring(0, 5);
  
  console.log(`[Pricing] Searching prices: Origin=${originRegion}, Dest=${destinationRegion}, Weight=${weight_kg}kg`);
  
  // Buscar preços cadastrados para essa rota
  const { data: priceData, error: priceError } = await supabaseClient
    .from('carrier_price_table')
    .select('*')
    .eq('origin_region', originRegion)
    .eq('destination_region', destinationRegion)
    .lte('min_weight_kg', weight_kg)
    .gte('max_weight_kg', weight_kg)
    .eq('is_active', true);
  
  if (priceError) {
    console.error('[Pricing Error]', priceError);
    // Fallback para preço mockado se houver erro
    return gerarCotacoesMockadas(carriers, weight_kg);
  }
  
  if (!priceData || priceData.length === 0) {
    console.log('[Pricing] No prices found for this route/weight. Using fallback calculation.');
    // Fallback: usa cálculo simples se não houver preços cadastrados
    return gerarCotacoesMockadas(carriers, weight_kg);
  }
  
  console.log(`[Pricing] Found ${priceData.length} price entries for this route`);
  
  // Construir cotações baseadas nos preços reais cadastrados
  const quotes: CarrierQuote[] = [];
  
  for (const price of priceData) {
    // Encontrar dados da transportadora correspondente
    const carrier = carriers.find(c => c.id === price.carrier_id);
    if (!carrier) continue;
    
    // Calcular preço: base_price + (peso × price_per_kg)
    const basePrice = parseFloat(price.base_price);
    const pricePerKg = parseFloat(price.price_per_kg);
    const totalPrice = basePrice + (weight_kg * pricePerKg);
    
    quotes.push({
      carrier_id: carrier.id,
      carrier_name: carrier.name,
      carrier_size: carrier.carrier_size,
      specialties: carrier.specialties,
      base_price: parseFloat(totalPrice.toFixed(2)),
      delivery_days: price.delivery_days,
      quality_index: carrier.avg_quality_rating,
    });
    
    console.log(
      `[Price] ${carrier.name}: ` +
      `Base=${basePrice} + (${weight_kg}kg × ${pricePerKg}) = R$ ${totalPrice.toFixed(2)} | ` +
      `Delivery: ${price.delivery_days} days`
    );
  }
  
  return quotes;
}

/**
 * Gera cotações baseadas em PESQUISA DE MERCADO (FALLBACK)
 * Usado quando não há preços cadastrados na carrier_price_table
 * Valores baseados em média de mercado brasileiro para frete fracionado LTL
 */
function gerarCotacoesMockadas(carriers: any[], weight_kg: number): CarrierQuote[] {
  console.log('[Market Research Pricing] Using market-based prices (no carrier price table data yet)');
  
  // PREÇOS BASEADOS EM PESQUISA DE MERCADO - Frete Fracionado Brasil
  // Fonte: Médias de transportadoras nacionais (2024)
  
  // Taxa base operacional: R$ 80 a R$ 150 (varia por transportadora)
  const baseOperationalFee = 100; // Média
  
  // Preço por kg: R$ 0.80 a R$ 1.50 (varia por qualidade e região)
  const pricePerKgMin = 0.80;
  const pricePerKgMax = 1.50;
  
  return carriers.map(carrier => {
    // Multiplicador de qualidade (transportadoras melhores cobram um pouco mais)
    // Qualidade 5.0 = preço máximo (R$ 1.50/kg)
    // Qualidade 3.0 = preço médio (R$ 1.15/kg)
    // Qualidade 1.0 = preço mínimo (R$ 0.80/kg)
    const qualityFactor = (carrier.avg_quality_rating / 5.0); // 0.2 a 1.0
    const pricePerKg = pricePerKgMin + ((pricePerKgMax - pricePerKgMin) * qualityFactor);
    
    // Cálculo final: Taxa base + (peso × preço/kg)
    const basePrice = baseOperationalFee + (weight_kg * pricePerKg);
    
    // Prazo de entrega baseado em qualidade (melhores são mais rápidos)
    // Qualidade 5.0 = 3 dias | Qualidade 3.0 = 5 dias | Qualidade 1.0 = 7 dias
    const deliveryDays = Math.ceil(8 - (carrier.avg_quality_rating * 1.0));
    
    console.log(
      `[Market Price] ${carrier.name}: ` +
      `Base Fee R$ ${baseOperationalFee} + (${weight_kg}kg × R$ ${pricePerKg.toFixed(2)}/kg) = R$ ${basePrice.toFixed(2)} | ` +
      `Delivery: ${deliveryDays} days | Quality: ${carrier.avg_quality_rating.toFixed(1)}/5.0`
    );
    
    return {
      carrier_id: carrier.id,
      carrier_name: carrier.name,
      carrier_size: carrier.carrier_size,
      specialties: carrier.specialties,
      base_price: parseFloat(basePrice.toFixed(2)),
      delivery_days: Math.max(3, Math.min(deliveryDays, 7)), // 3-7 dias (realista)
      quality_index: carrier.avg_quality_rating,
    };
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Service role client for rate limiting (bypasses RLS)
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit: 10 requests per minute for quote generation
    const identifier = getClientIdentifier(req, user.id);
    const rateLimitResult = await checkRateLimit(
      supabaseServiceClient,
      identifier,
      {
        endpoint: 'generate-quote',
        limit: 10,
        windowMinutes: 1
      }
    );

    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.allowed) {
      console.warn('[Generate Quote] Rate limit exceeded for:', identifier);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000)
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders, 
            ...rateLimitHeaders,
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString()
          } 
        }
      );
    }

    const requestBody = await req.json();
    console.log('Quote request received:', requestBody);

    // Validate input with Zod
    const validation = QuoteRequestSchema.safeParse(requestBody);
    if (!validation.success) {
      console.error('[Validation Error]', validation.error.flatten());
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.error.flatten().fieldErrors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const quoteRequest: QuoteRequest = validation.data;

    // Log do tipo de serviço e veículo (se FTL)
    console.log(`Service type: ${quoteRequest.service_type || 'ltl'} (LTL=Transportadoras, FTL=Autônomos)`);
    if (quoteRequest.service_type === 'ftl' && quoteRequest.vehicle_type) {
      console.log(`Vehicle type requested: ${quoteRequest.vehicle_type}`);
    }

    // Verificar áreas restritas
    const restrictedOrigin = verificarAreaRestrita(quoteRequest.origin_cep);
    const restrictedDestination = verificarAreaRestrita(quoteRequest.destination_cep);
    
    if (restrictedOrigin || restrictedDestination) {
      console.log(`Restricted areas detected - Origin: ${restrictedOrigin}, Destination: ${restrictedDestination}`);
    }

    // 1. Fetch all active carriers
    const { data: carriers, error: carriersError } = await supabaseClient
      .from('carriers')
      .select('*')
      .eq('is_active', true);

    if (carriersError || !carriers || carriers.length === 0) {
      console.error('Error fetching carriers:', carriersError);
      return new Response(
        JSON.stringify({ error: 'No carriers available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get route data (adjustment_factor for return routes, demand_level for high demand, risk_factor for LogiGuard)
    // NOTA: O campo risk_factor precisa ser adicionado à tabela routes via migration
    // Para simular, vamos usar um valor padrão baseado na rota
    const { data: route } = await supabaseClient
      .from('routes')
      .select('adjustment_factor, demand_level')
      .eq('origin_cep', quoteRequest.origin_cep)
      .eq('destination_cep', quoteRequest.destination_cep)
      .maybeSingle();

    const routeAdjustmentFactor = route?.adjustment_factor ?? 0;
    const demandLevel = route?.demand_level ?? 'medium';
    
    // Mock de risk_factor até adicionar à tabela routes
    // TODO: Adicionar campo risk_factor à tabela routes via migration
    const riskFactor = 0.70; // Simulação: 70% de risco para demonstração
    
    console.log(`Route data - Adjustment Factor: ${routeAdjustmentFactor}, Demand Level: ${demandLevel}, Risk Factor: ${riskFactor}`);

    // 3. Buscar cotações reais da tabela carrier_price_table (com fallback para cálculo)
    const cotacoesBrutas = await buscarCotacoesReais(
      supabaseClient,
      carriers, 
      quoteRequest.origin_cep,
      quoteRequest.destination_cep,
      quoteRequest.weight_kg
    );

    // 4. Apply LogiMind strategy based on route characteristics
    let cotacoesComRotas: ProcessedQuote[];
    
    // Determinar qual regra aplicar baseado nas características da rota
    if (demandLevel === 'high') {
      // LogiMind 3.0 - Rotas de Alta Demanda (competitividade via redução de margem)
      // Converte demand_level "high" em fator numérico (0.8 = alta competição)
      const fatorAjusteDemanda = 0.8;
      cotacoesComRotas = aplicarRegraAltaDemanda(cotacoesBrutas, fatorAjusteDemanda);
      console.log('[Route Strategy] HIGH DEMAND route - Applying commission reduction for market competitiveness');
    } else if (routeAdjustmentFactor > 0) {
      // LogiMind 1.0 - Rotas de Retorno (subsídio para aumentar aceitação)
      cotacoesComRotas = aplicarSubsidioRotaRetorno(cotacoesBrutas, routeAdjustmentFactor);
      console.log('[Route Strategy] RETURN route - Applying subsidy to increase driver acceptance');
    } else {
      // Rota padrão - aplica comissão normal (10%)
      cotacoesComRotas = aplicarSubsidioRotaRetorno(cotacoesBrutas, 0);
      console.log('[Route Strategy] STANDARD route - Applying default 10% commission');
    }

    // 5. Get market reference price
    const precoMercadoReferencia = buscarPrecoMercadoReferencia(cotacoesBrutas);

    // 6. Apply LogiMind 2.0 - Competition rule (safety net para qualquer rota)
    const cotacoesProcessadas = aplicarRegraCompeticao(cotacoesComRotas, precoMercadoReferencia);

    // 6.5. Calculate LogiGuard Pro para cada cotação
    const logiGuardPro = calcularLogiGuardPro(quoteRequest.cargo_value, riskFactor);
    
    // 6.6. Calculate ANTT Piso Mínimo (Referência Legal)
    const distanciaEstimada = estimarDistanciaCeps(quoteRequest.origin_cep, quoteRequest.destination_cep);
    const eixosEstimados = estimarEixos(quoteRequest.weight_kg, quoteRequest.vehicle_type);
    const isRetornoVazio = routeAdjustmentFactor > 0.5; // Rotas de retorno têm fator > 0.5
    const anttPisoMinimo = calcularPisoMinimoANTT(distanciaEstimada, 'carga_geral', eixosEstimados, isRetornoVazio);
    
    console.log(`[ANTT Reference] Piso Mínimo Legal: R$ ${anttPisoMinimo.valor.toFixed(2)}`);
    
    // Adiciona LogiGuard Pro e ANTT Piso Mínimo a todas as cotações processadas
    const cotacoesComLogiGuard = cotacoesProcessadas.map(cota => ({
      ...cota,
      logiguard_pro: logiGuardPro,
      antt_piso_minimo: anttPisoMinimo,
    }));

    // 7. Create quote record
    const { data: quote, error: quoteError } = await supabaseClient
      .from('quotes')
      .insert({
        user_id: user.id,
        origin_cep: quoteRequest.origin_cep,
        destination_cep: quoteRequest.destination_cep,
        weight_kg: quoteRequest.weight_kg,
        height_cm: quoteRequest.height_cm,
        width_cm: quoteRequest.width_cm,
        length_cm: quoteRequest.length_cm,
        status: 'pending',
      })
      .select()
      .single();

    if (quoteError || !quote) {
      console.error('Error creating quote:', quoteError);
      return new Response(
        JSON.stringify({ error: 'Failed to create quote' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Insert quote items
    const quoteItems = cotacoesComLogiGuard.map(item => ({
      quote_id: quote.id,
      carrier_id: item.carrier_id,
      base_price: item.base_price,
      commission_applied: item.commission_applied,
      final_price: item.final_price,
      delivery_days: item.delivery_days,
      quality_index: item.quality_index,
      route_adjustment_factor: item.route_adjustment_factor,
    }));

    const { error: itemsError } = await supabaseClient
      .from('quote_items')
      .insert(quoteItems);

    if (itemsError) {
      console.error('Error creating quote items:', itemsError);
      // Continue anyway, we have the processed quotes
    }

    // 9. Return processed quotes with quote ID and LogiGuard Pro data
    const routeType = demandLevel === 'high' ? 'high_demand' : 
                     routeAdjustmentFactor > 0.5 ? 'return' : 
                     routeAdjustmentFactor > 0 ? 'competitive' : 'standard';
    
    return new Response(
      JSON.stringify({
        quote_id: quote.id,
        quotes: cotacoesComLogiGuard,
        route_type: routeType,
        demand_level: demandLevel,
        restricted_origin: restrictedOrigin,
        restricted_destination: restrictedDestination,
        logiguard_available: logiGuardPro?.available ?? false,
        antt_reference: {
          piso_minimo: anttPisoMinimo.valor,
          distancia_km: anttPisoMinimo.distancia_km,
          eixos: anttPisoMinimo.eixos,
          tipo_carga: anttPisoMinimo.tipo_carga,
          ccd_aplicado: anttPisoMinimo.ccd_aplicado,
          cc_aplicado: anttPisoMinimo.cc_aplicado,
          retorno_vazio: anttPisoMinimo.retorno_vazio,
        },
      }),
      {
        headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in generate-quote function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
