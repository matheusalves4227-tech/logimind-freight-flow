# 📊 Relatório: Rate Limiting Implementado

## ✅ Implementação Concluída

Rate limiting foi implementado com sucesso nas edge functions críticas para prevenir abuso e garantir fair usage da plataforma LogiMarket.

---

## 🛡️ Funções Protegidas

### 1. **generate-quote** (Geração de Cotações)
- **Limite:** 10 requisições por minuto por usuário/IP
- **Janela:** 1 minuto (sliding window)
- **Justificativa:** Cotações são operações computacionalmente intensivas que consultam múltiplas transportadoras e aplicam lógica LogiMind complexa

### 2. **create-order** (Criação de Pedidos)
- **Limite:** 5 requisições por minuto por usuário/IP
- **Janela:** 1 minuto (sliding window)
- **Justificativa:** Pedidos são transações críticas que criam registros permanentes no banco e iniciam processos operacionais

---

## 🏗️ Arquitetura

### Componentes

1. **Tabela `rate_limits`**
   ```sql
   CREATE TABLE public.rate_limits (
     id UUID PRIMARY KEY,
     identifier TEXT NOT NULL,          -- user_id ou IP
     endpoint TEXT NOT NULL,             -- nome da função
     request_count INTEGER NOT NULL,     -- contador de requests
     window_start TIMESTAMPTZ NOT NULL,  -- início da janela
     created_at TIMESTAMPTZ,
     updated_at TIMESTAMPTZ,
     UNIQUE (identifier, endpoint)
   );
   ```

2. **Helper Reutilizável** (`_shared/rateLimit.ts`)
   - `checkRateLimit()`: Verifica e aplica rate limit
   - `getRateLimitHeaders()`: Gera headers HTTP padrão
   - `getClientIdentifier()`: Identifica cliente (user ID ou IP)

3. **Integração nas Edge Functions**
   - Autenticação → Rate Limit Check → Lógica de Negócio
   - Headers informativos em todas as respostas
   - Resposta 429 (Too Many Requests) quando limite excedido

---

## 📋 Algoritmo: Sliding Window

### Funcionamento

1. **Primeira Request:**
   - Cria registro com `request_count = 1`
   - Define `window_start = NOW()`
   - Permite request ✅

2. **Requests Subsequentes (Janela Ativa):**
   - Incrementa `request_count`
   - Se `request_count > limit`: Bloqueia ❌
   - Se `request_count <= limit`: Permite ✅

3. **Janela Expirada:**
   - Reseta contador: `request_count = 1`
   - Nova janela: `window_start = NOW()`
   - Permite request ✅

### Exemplo Visual

```
Janela de 1 minuto | Limite: 10 requests

T0 (00:00): Request 1  → request_count = 1 ✅
T1 (00:15): Request 2  → request_count = 2 ✅
...
T9 (00:45): Request 10 → request_count = 10 ✅ (último permitido)
T10 (00:50): Request 11 → request_count > 10 ❌ (bloqueado)

T11 (01:01): Request 12 → Nova janela, request_count = 1 ✅
```

---

## 📡 Headers HTTP de Rate Limit

Toda resposta (sucesso ou erro) inclui:

| Header | Descrição | Exemplo |
|--------|-----------|---------|
| `X-RateLimit-Limit` | Limite máximo de requests por janela | `10` |
| `X-RateLimit-Remaining` | Requests restantes na janela atual | `7` |
| `X-RateLimit-Reset` | Timestamp Unix quando janela reseta | `1705420800` |
| `Retry-After` | Segundos até poder tentar novamente (apenas 429) | `45` |

### Exemplo de Resposta 429

```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

**Headers:**
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705420845
Retry-After: 45
Content-Type: application/json
```

---

## 🔒 Segurança

### Identificação de Clientes

1. **Usuários Autenticados:** `user:{user_id}`
   - Identificador único e confiável via JWT
   - Rastreamento preciso por conta de usuário

2. **Usuários Anônimos/Não-Autenticados:** `ip:{ip_address}`
   - Fallback para endereço IP
   - Considera headers `X-Forwarded-For` e `X-Real-IP`

### RLS Policies

- Tabela `rate_limits` protegida por RLS
- Apenas **service_role** pode gerenciar registros
- Edge functions usam `SUPABASE_SERVICE_ROLE_KEY` para bypass controlado

### Fail-Open Strategy

Em caso de erro ao verificar rate limit (DB indisponível, timeout):
- ✅ **Permite request** (fail-open)
- 📝 **Registra erro em console**
- ⚠️ **Evita DoS acidental** da própria plataforma

---

## 🧪 Como Testar

### Teste Manual

#### 1. Teste de Limite Excedido (generate-quote)

```bash
# Fazer 11 requests em 60 segundos
for i in {1..11}; do
  curl -X POST "https://xrerhrqxfvvwiefzlkux.supabase.co/functions/v1/generate-quote" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "service_type": "ltl",
      "origin_cep": "01310100",
      "origin_number": "100",
      "origin_type": "commercial",
      "destination_cep": "20040020",
      "destination_number": "50",
      "destination_type": "residential",
      "weight_kg": 50
    }'
  echo "Request $i completed"
  sleep 5
done

# Expect: Primeiros 10 com status 200, request 11 com status 429
```

#### 2. Teste de Reset de Janela

```bash
# Request 1
curl -i "https://xrerhrqxfvvwiefzlkux.supabase.co/functions/v1/generate-quote" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service_type": "ltl", "weight_kg": 50, ...}'

# Verificar header X-RateLimit-Reset
# Aguardar tempo do reset
sleep 65

# Request 2 (deve funcionar após reset)
curl -i "https://xrerhrqxfvvwiefzlkux.supabase.co/functions/v1/generate-quote" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service_type": "ltl", "weight_kg": 50, ...}'

# Expect: Status 200 (janela resetou)
```

#### 3. Verificar Headers

```bash
curl -i "https://xrerhrqxfvvwiefzlkux.supabase.co/functions/v1/generate-quote" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}' | grep -i "x-ratelimit"

# Expected output:
# X-RateLimit-Limit: 10
# X-RateLimit-Remaining: 9
# X-RateLimit-Reset: 1705420800
```

### Teste Automatizado (Deno)

```typescript
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.test("Rate limit blocks after exceeding limit", async () => {
  const endpoint = "https://xrerhrqxfvvwiefzlkux.supabase.co/functions/v1/generate-quote";
  const token = "YOUR_JWT_TOKEN";
  
  // Fazer 10 requests (dentro do limite)
  for (let i = 0; i < 10; i++) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        service_type: "ltl",
        weight_kg: 50,
        // ... outros campos
      })
    });
    
    assertEquals(response.status, 200);
  }
  
  // Request 11 deve ser bloqueada
  const blockedResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      service_type: "ltl",
      weight_kg: 50,
      // ... outros campos
    })
  });
  
  assertEquals(blockedResponse.status, 429);
  
  const headers = blockedResponse.headers;
  assertEquals(headers.get("X-RateLimit-Remaining"), "0");
  assert(headers.has("Retry-After"));
});
```

---

## 📊 Monitoramento

### Queries Úteis

#### 1. Top Usuários por Volume de Requests

```sql
SELECT 
  identifier,
  endpoint,
  request_count,
  window_start,
  created_at
FROM public.rate_limits
ORDER BY request_count DESC
LIMIT 20;
```

#### 2. Usuários Bloqueados Recentemente

```sql
SELECT 
  identifier,
  endpoint,
  request_count,
  window_start,
  NOW() - window_start as time_in_window
FROM public.rate_limits
WHERE request_count >= 10  -- Limite de generate-quote
  AND window_start > NOW() - INTERVAL '5 minutes'
ORDER BY window_start DESC;
```

#### 3. Cleanup de Registros Antigos

```sql
-- Deletar registros com janelas expiradas há mais de 1 hora
DELETE FROM public.rate_limits
WHERE window_start < NOW() - INTERVAL '1 hour';
```

#### 4. Estatísticas por Endpoint

```sql
SELECT 
  endpoint,
  COUNT(DISTINCT identifier) as unique_users,
  AVG(request_count) as avg_requests,
  MAX(request_count) as max_requests,
  COUNT(*) as total_windows
FROM public.rate_limits
WHERE window_start > NOW() - INTERVAL '24 hours'
GROUP BY endpoint
ORDER BY unique_users DESC;
```

---

## 🚀 Melhorias Futuras

### 1. Rate Limits Diferenciados por Plano

```typescript
// Exemplo: Planos Premium com limites maiores
const limit = user.subscription === 'premium' ? 50 : 10;
```

### 2. Rate Limiting Adaptativo

- Aumentar limite em horários de baixa demanda
- Reduzir limite em picos de uso
- Baseado em métricas de CPU/memória do servidor

### 3. Whitelist/Blacklist

```sql
CREATE TABLE rate_limit_exceptions (
  identifier TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'whitelist' ou 'blacklist'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Whitelist: Clientes VIP sem rate limit
-- Blacklist: IPs maliciosos permanentemente bloqueados
```

### 4. Dashboard de Monitoring

- Gráficos em tempo real de requests/minuto
- Alertas quando thresholds são atingidos
- Histórico de bloqueios por usuário/IP

### 5. Distributed Rate Limiting

- Usar Redis para rate limiting cross-region
- Necessário quando escalar edge functions em múltiplas regiões

---

## 📚 Referências

- [RFC 6585 - Additional HTTP Status Codes](https://tools.ietf.org/html/rfc6585)
- [IETF Draft - Rate Limit Header Fields](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)

---

## ✅ Checklist de Implementação

- [x] Criar tabela `rate_limits` no banco de dados
- [x] Implementar helper `rateLimit.ts` reutilizável
- [x] Integrar rate limiting em `generate-quote`
- [x] Integrar rate limiting em `create-order`
- [x] Adicionar headers informativos (X-RateLimit-*)
- [x] Implementar resposta 429 com Retry-After
- [x] Documentar algoritmo sliding window
- [x] Criar guia de testes manuais
- [x] Definir queries de monitoramento
- [ ] Implementar cleanup automático de registros antigos (CRON)
- [ ] Criar dashboard de monitoring (Grafana/Metabase)
- [ ] Implementar testes E2E automatizados

---

**Status:** ✅ Implementação completa e funcional

**Última Atualização:** 2025-01-17

**Autor:** LogiMarket Development Team
