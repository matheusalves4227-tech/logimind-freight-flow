import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OCRResult {
  documentType: 'cnh' | 'crlv' | 'unknown';
  isValid: boolean;
  confidence: number;
  extractedData: Record<string, string>;
  validationErrors: string[];
  validationWarnings: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { documentId, filePath, documentType } = await req.json();

    if (!documentId || !filePath || !documentType) {
      return new Response(JSON.stringify({ error: 'documentId, filePath, and documentType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[OCR] Processing document: ${documentId}, type: ${documentType}`);

    // 1. Get signed URL for the document image
    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from('driver-documents')
      .createSignedUrl(filePath, 300);

    if (urlError || !signedUrlData) {
      throw new Error(`Failed to get document URL: ${urlError?.message}`);
    }

    // 2. Download the image and convert to base64
    const imageResponse = await fetch(signedUrlData.signedUrl);
    if (!imageResponse.ok) throw new Error('Failed to download document image');

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    console.log(`[OCR] Image downloaded, size: ${imageBuffer.byteLength} bytes`);

    // 3. Build prompt based on document type
    const systemPrompt = buildSystemPrompt(documentType);

    // 4. Call Lovable AI with vision
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analise este documento e extraia todos os dados visíveis. Valide se é um documento autêntico.' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'document_ocr_result',
              description: 'Retorna os dados extraídos e validação do documento',
              parameters: {
                type: 'object',
                properties: {
                  documentType: {
                    type: 'string',
                    enum: ['cnh', 'crlv', 'unknown'],
                    description: 'Tipo de documento identificado',
                  },
                  isValid: {
                    type: 'boolean',
                    description: 'Se o documento parece válido e autêntico',
                  },
                  confidence: {
                    type: 'number',
                    description: 'Confiança da extração de 0 a 100',
                  },
                  extractedData: {
                    type: 'object',
                    properties: {
                      nome_completo: { type: 'string', description: 'Nome completo do titular' },
                      cpf: { type: 'string', description: 'CPF do titular' },
                      data_nascimento: { type: 'string', description: 'Data de nascimento' },
                      numero_registro: { type: 'string', description: 'Número do registro (CNH ou CRLV)' },
                      categoria: { type: 'string', description: 'Categoria da CNH (A, B, C, D, E, AB, etc.)' },
                      validade: { type: 'string', description: 'Data de validade do documento' },
                      data_emissao: { type: 'string', description: 'Data de emissão/primeira habilitação' },
                      orgao_emissor: { type: 'string', description: 'Órgão emissor' },
                      placa: { type: 'string', description: 'Placa do veículo (CRLV)' },
                      renavam: { type: 'string', description: 'Número RENAVAM (CRLV)' },
                      marca_modelo: { type: 'string', description: 'Marca/modelo do veículo (CRLV)' },
                      ano_fabricacao: { type: 'string', description: 'Ano de fabricação (CRLV)' },
                      cor: { type: 'string', description: 'Cor do veículo (CRLV)' },
                      chassi: { type: 'string', description: 'Número do chassi (CRLV)' },
                    },
                    additionalProperties: true,
                  },
                  validationErrors: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Erros graves encontrados (documento inválido, expirado, ilegível)',
                  },
                  validationWarnings: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Avisos (baixa qualidade, dados parciais, foto cortada)',
                  },
                },
                required: ['documentType', 'isValid', 'confidence', 'extractedData', 'validationErrors', 'validationWarnings'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'document_ocr_result' } },
      }),
    });

    if (!aiResponse.ok) {
      const errorStatus = aiResponse.status;
      if (errorStatus === 429) {
        return new Response(JSON.stringify({ error: 'Serviço temporariamente sobrecarregado. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (errorStatus === 402) {
        return new Response(JSON.stringify({ error: 'Créditos de IA esgotados.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const errText = await aiResponse.text();
      throw new Error(`AI gateway error [${errorStatus}]: ${errText}`);
    }

    const aiData = await aiResponse.json();
    console.log('[OCR] AI response received');

    // Parse tool call result
    let ocrResult: OCRResult;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error('No tool call in response');
      ocrResult = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error('[OCR] Failed to parse AI response:', e);
      throw new Error('Failed to parse OCR result');
    }

    console.log(`[OCR] Result: type=${ocrResult.documentType}, valid=${ocrResult.isValid}, confidence=${ocrResult.confidence}%`);

    // 5. Update document record with OCR results
    await supabaseAdmin.from('driver_documents').update({
      is_verified: ocrResult.isValid && ocrResult.confidence >= 70,
      verification_notes: JSON.stringify({
        ocr_confidence: ocrResult.confidence,
        ocr_document_type: ocrResult.documentType,
        extracted_data: ocrResult.extractedData,
        errors: ocrResult.validationErrors,
        warnings: ocrResult.validationWarnings,
        validated_at: new Date().toISOString(),
        validated_by: 'ocr_auto',
      }),
    }).eq('id', documentId);

    // 6. If CNH, try to auto-fill driver_cnh_data
    if (ocrResult.documentType === 'cnh' && ocrResult.isValid && ocrResult.confidence >= 70) {
      const { data: doc } = await supabaseAdmin.from('driver_documents')
        .select('driver_profile_id').eq('id', documentId).single();

      if (doc) {
        const ed = ocrResult.extractedData;
        // Check if cnh_data already exists
        const { data: existing } = await supabaseAdmin.from('driver_cnh_data')
          .select('id').eq('driver_profile_id', doc.driver_profile_id).maybeSingle();

        const cnhData: Record<string, any> = {
          driver_profile_id: doc.driver_profile_id,
        };
        if (ed.numero_registro) cnhData.cnh_number = ed.numero_registro;
        if (ed.categoria) cnhData.cnh_category = ed.categoria.toLowerCase() as any;
        if (ed.validade) cnhData.expiry_date = parseDate(ed.validade);
        if (ed.data_emissao) cnhData.issue_date = parseDate(ed.data_emissao);
        if (ed.orgao_emissor) cnhData.issuing_authority = ed.orgao_emissor;

        if (existing) {
          await supabaseAdmin.from('driver_cnh_data')
            .update(cnhData).eq('id', existing.id);
        } else if (cnhData.cnh_number && cnhData.expiry_date && cnhData.issue_date && cnhData.cnh_category) {
          await supabaseAdmin.from('driver_cnh_data').insert(cnhData);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      result: ocrResult,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[OCR] Error:', error);
    return new Response(JSON.stringify({
      error: 'Erro ao processar documento',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildSystemPrompt(documentType: string): string {
  const base = `Você é um especialista em análise e validação de documentos brasileiros.
Analise a imagem do documento enviado e extraia TODOS os dados visíveis com precisão.

REGRAS DE VALIDAÇÃO:
- Verifique se o documento parece autêntico (não é foto de tela, não está adulterado)
- Verifique se está legível (não está borrado, cortado ou com reflexo excessivo)
- Verifique a validade (se a data de vencimento é posterior à data atual)
- Extraia todos os campos possíveis, mesmo que parcialmente legíveis
- Se algum campo estiver ilegível, indique no campo de warnings
- Confidence deve refletir a qualidade geral da extração`;

  if (documentType.includes('cnh')) {
    return `${base}

DOCUMENTO ESPERADO: CNH (Carteira Nacional de Habilitação)
CAMPOS PRIORITÁRIOS: nome completo, CPF, número de registro, categoria (A/B/C/D/E/AB/AC/AD/AE), validade, data de emissão/primeira habilitação, órgão emissor.
VALIDAÇÕES ESPECÍFICAS:
- A categoria deve ser válida (A, B, C, D, E ou combinações AB, AC, AD, AE)
- Para motoristas de carga, espera-se categoria C, D ou E
- CNH vencida deve gerar erro de validação`;
  }

  if (documentType.includes('crlv')) {
    return `${base}

DOCUMENTO ESPERADO: CRLV (Certificado de Registro e Licenciamento de Veículo)
CAMPOS PRIORITÁRIOS: placa, RENAVAM, marca/modelo, ano de fabricação, cor, chassi, nome do proprietário, CPF/CNPJ do proprietário.
VALIDAÇÕES ESPECÍFICAS:
- A placa deve seguir formato brasileiro (ABC-1234 ou ABC1D23)
- RENAVAM deve ter 11 dígitos
- Verifique se o licenciamento está vigente`;
  }

  return base;
}

function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  // Handle dd/mm/yyyy
  const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (parts) return `${parts[3]}-${parts[2]}-${parts[1]}`;
  // Handle yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return dateStr;
}
