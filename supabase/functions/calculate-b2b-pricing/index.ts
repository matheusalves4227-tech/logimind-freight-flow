import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constantes de Precificação Base
const PRECO_BASE_POR_KG = 0.50; // R$ 0.50 por kg
const PRECO_BASE_POR_KM = 0.80; // R$ 0.80 por km (estimado)
const KM_MEDIO_ROTA = 500; // Estimativa média de distância

// Fatores de Desconto por Volume (quanto maior o volume, maior o desconto)
const DESCONTO_POR_VOLUME = [
  { min: 0, max: 20, desconto: 0 },           // Até 20 entregas/mês: sem desconto
  { min: 21, max: 50, desconto: 0.05 },       // 21-50: 5% desconto
  { min: 51, max: 100, desconto: 0.10 },      // 51-100: 10% desconto
  { min: 101, max: 200, desconto: 0.15 },     // 101-200: 15% desconto
  { min: 201, max: 500, desconto: 0.20 },     // 201-500: 20% desconto
  { min: 501, max: Infinity, desconto: 0.25 } // 500+: 25% desconto
];

// Fatores de Multiplicação por Tipo de Carga
const FATOR_TIPO_CARGA = {
  'geral': 1.0,           // Carga geral: sem acréscimo
  'refrigerada': 1.3,     // Refrigerada: +30%
  'perigosa': 1.5,        // Perigosa: +50%
  'fragil': 1.2,          // Frágil: +20%
  'alto_valor': 1.4       // Alto valor: +40%
};

// Fatores de Multiplicação por SLA
const FATOR_SLA = {
  'same_day': 2.0,    // Same Day: 2x o preço
  'express': 1.5,     // Express (24-48h): +50%
  'standard': 1.0,    // Standard (3-5 dias): preço normal
  'economico': 0.8,   // Econômico (7-10 dias): -20%
  'flexivel': 0.7     // Flexível: -30%
};

// Desconto por Rota de Retorno Otimizada
const DESCONTO_ROTA_RETORNO = 0.35; // 35% de desconto

// Custos Adicionais Fixos
const CUSTO_SEGURO_ADICIONAL = 50; // R$ 50 por entrega
const CUSTO_LOGISTICA_REVERSA = 80; // R$ 80 por entrega com reversa

interface B2BQuoteData {
  volume_mensal_estimado: number;
  peso_medio_kg: number;
  tipo_carga: string;
  sla_desejado: string;
  aceita_rota_retorno: boolean;
  necessita_seguro: boolean;
  logistica_reversa: boolean;
  pedagios_cliente: boolean;
  armazenagem_cliente: boolean;
}

interface PricingResult {
  preco_base_unitario: number;
  preco_com_volume_desconto: number;
  preco_com_tipo_carga: number;
  preco_com_sla: number;
  preco_com_rota_retorno: number;
  custos_adicionais: number;
  preco_final_unitario: number;
  valor_mensal_total: number;
  desconto_volume_percentual: number;
  desconto_total_percentual: number;
  economia_mensal: number;
  detalhamento: {
    base: string;
    volume: string;
    tipo_carga: string;
    sla: string;
    rota_retorno: string;
    custos_extras: string[];
  };
}

const calcularPrecoBase = (pesoMedio: number): number => {
  // Preço base = (peso * preço por kg) + (distância estimada * preço por km)
  const custoPeso = pesoMedio * PRECO_BASE_POR_KG;
  const custoDistancia = KM_MEDIO_ROTA * PRECO_BASE_POR_KM;
  return custoPeso + custoDistancia;
};

const obterDescontoVolume = (volumeMensal: number): number => {
  const faixa = DESCONTO_POR_VOLUME.find(
    f => volumeMensal >= f.min && volumeMensal <= f.max
  );
  return faixa?.desconto || 0;
};

const calcularPrecificacao = (dados: B2BQuoteData): PricingResult => {
  // 1. Preço Base
  const precoBase = calcularPrecoBase(dados.peso_medio_kg);
  
  // 2. Aplicar Desconto por Volume
  const descontoVolume = obterDescontoVolume(dados.volume_mensal_estimado);
  const precoComVolume = precoBase * (1 - descontoVolume);
  
  // 3. Aplicar Fator de Tipo de Carga
  const fatorCarga = FATOR_TIPO_CARGA[dados.tipo_carga as keyof typeof FATOR_TIPO_CARGA] || 1.0;
  const precoComTipoCarga = precoComVolume * fatorCarga;
  
  // 4. Aplicar Fator de SLA
  const fatorSLA = FATOR_SLA[dados.sla_desejado as keyof typeof FATOR_SLA] || 1.0;
  const precoComSLA = precoComTipoCarga * fatorSLA;
  
  // 5. Aplicar Desconto de Rota de Retorno (se aceitar)
  const precoComRotaRetorno = dados.aceita_rota_retorno 
    ? precoComSLA * (1 - DESCONTO_ROTA_RETORNO)
    : precoComSLA;
  
  // 6. Adicionar Custos Extras
  let custosAdicionais = 0;
  const custosExtras: string[] = [];
  
  if (dados.necessita_seguro) {
    custosAdicionais += CUSTO_SEGURO_ADICIONAL;
    custosExtras.push(`Seguro adicional: R$ ${CUSTO_SEGURO_ADICIONAL.toFixed(2)}`);
  }
  
  if (dados.logistica_reversa) {
    custosAdicionais += CUSTO_LOGISTICA_REVERSA;
    custosExtras.push(`Logística reversa: R$ ${CUSTO_LOGISTICA_REVERSA.toFixed(2)}`);
  }
  
  if (!dados.pedagios_cliente) {
    const estimativaPedagio = 30; // R$ 30 por entrega
    custosAdicionais += estimativaPedagio;
    custosExtras.push(`Pedágios (nossa responsabilidade): R$ ${estimativaPedagio.toFixed(2)}`);
  }
  
  if (!dados.armazenagem_cliente) {
    const estimativaArmazenagem = 25; // R$ 25 por entrega
    custosAdicionais += estimativaArmazenagem;
    custosExtras.push(`Armazenagem temporária: R$ ${estimativaArmazenagem.toFixed(2)}`);
  }
  
  // 7. Preço Final Unitário
  const precoFinalUnitario = precoComRotaRetorno + custosAdicionais;
  
  // 8. Valor Mensal Total
  const valorMensalTotal = precoFinalUnitario * dados.volume_mensal_estimado;
  
  // 9. Calcular Economia e Desconto Total
  const precoSemDesconto = precoBase * fatorCarga * fatorSLA + custosAdicionais;
  const descontoTotalPercentual = ((precoSemDesconto - precoFinalUnitario) / precoSemDesconto) * 100;
  const economiaMensal = (precoSemDesconto - precoFinalUnitario) * dados.volume_mensal_estimado;
  
  return {
    preco_base_unitario: precoBase,
    preco_com_volume_desconto: precoComVolume,
    preco_com_tipo_carga: precoComTipoCarga,
    preco_com_sla: precoComSLA,
    preco_com_rota_retorno: precoComRotaRetorno,
    custos_adicionais: custosAdicionais,
    preco_final_unitario: precoFinalUnitario,
    valor_mensal_total: valorMensalTotal,
    desconto_volume_percentual: descontoVolume * 100,
    desconto_total_percentual: descontoTotalPercentual,
    economia_mensal: economiaMensal,
    detalhamento: {
      base: `Preço base (${dados.peso_medio_kg}kg): R$ ${precoBase.toFixed(2)}`,
      volume: `Desconto por volume (${dados.volume_mensal_estimado} entregas/mês): -${(descontoVolume * 100).toFixed(0)}%`,
      tipo_carga: `Tipo de carga (${dados.tipo_carga}): ${fatorCarga > 1 ? '+' : ''}${((fatorCarga - 1) * 100).toFixed(0)}%`,
      sla: `SLA (${dados.sla_desejado}): ${fatorSLA > 1 ? '+' : ''}${((fatorSLA - 1) * 100).toFixed(0)}%`,
      rota_retorno: dados.aceita_rota_retorno 
        ? `Otimização rota de retorno: -${(DESCONTO_ROTA_RETORNO * 100).toFixed(0)}%`
        : 'Sem otimização de rota de retorno',
      custos_extras: custosExtras
    }
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verificar autenticação e permissão admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verificar se é admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      throw new Error('Admin access required');
    }

    const { quote_id, quote_data } = await req.json();

    let dadosCotacao: B2BQuoteData;

    if (quote_id) {
      // Buscar cotação existente
      const { data: quote, error: quoteError } = await supabaseClient
        .from('b2b_quotes')
        .select('*')
        .eq('id', quote_id)
        .single();

      if (quoteError || !quote) {
        throw new Error('Quote not found');
      }

      dadosCotacao = {
        volume_mensal_estimado: quote.volume_mensal_estimado,
        peso_medio_kg: quote.peso_medio_kg,
        tipo_carga: quote.tipo_carga,
        sla_desejado: quote.sla_desejado,
        aceita_rota_retorno: quote.aceita_rota_retorno,
        necessita_seguro: quote.necessita_seguro,
        logistica_reversa: quote.logistica_reversa,
        pedagios_cliente: quote.pedagios_cliente,
        armazenagem_cliente: quote.armazenagem_cliente
      };
    } else if (quote_data) {
      // Usar dados fornecidos diretamente
      dadosCotacao = quote_data;
    } else {
      throw new Error('Either quote_id or quote_data must be provided');
    }

    // Calcular precificação
    const resultado = calcularPrecificacao(dadosCotacao);

    return new Response(
      JSON.stringify(resultado),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in calculate-b2b-pricing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
