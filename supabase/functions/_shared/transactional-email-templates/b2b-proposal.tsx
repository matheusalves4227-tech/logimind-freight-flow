import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "LogiMarket"

interface B2BProposalProps {
  razaoSocial?: string
  contatoResponsavel?: string
  volumeMensal?: number
  pesoMedioKg?: number
  tipoCarga?: string
  slaDesejado?: string
  rotasOrigem?: string
  rotasDestino?: string
  frequenciaEnvios?: string
  propostaValorMensal?: number
  propostaDescontoPercentual?: number
  propostaObservacoes?: string
}

const B2BProposalEmail = (props: B2BProposalProps) => {
  const {
    razaoSocial = 'Empresa',
    contatoResponsavel = 'Prezado(a)',
    volumeMensal,
    pesoMedioKg,
    tipoCarga,
    slaDesejado,
    rotasOrigem,
    rotasDestino,
    frequenciaEnvios,
    propostaValorMensal,
    propostaDescontoPercentual,
    propostaObservacoes,
  } = props

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Proposta comercial LogiMarket para {razaoSocial}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={logoText}>LogiMarket</Heading>
            <Text style={tagline}>Marketplace de Fretes Inteligente</Text>
          </Section>

          <Hr style={divider} />

          <Heading style={h1}>Proposta Comercial B2B</Heading>

          <Text style={text}>
            Olá, {contatoResponsavel}!
          </Text>

          <Text style={text}>
            Obrigado pelo interesse em uma parceria com a <strong>{SITE_NAME}</strong>.
            Analisamos suas necessidades logísticas e temos o prazer de apresentar
            nossa proposta personalizada para a <strong>{razaoSocial}</strong>.
          </Text>

          <Section style={detailsBox}>
            <Heading style={h2}>📦 Resumo da Demanda</Heading>
            {volumeMensal && (
              <Text style={detailItem}>
                <strong>Volume mensal:</strong> {volumeMensal} envios
              </Text>
            )}
            {pesoMedioKg && (
              <Text style={detailItem}>
                <strong>Peso médio:</strong> {pesoMedioKg} kg
              </Text>
            )}
            {tipoCarga && (
              <Text style={detailItem}>
                <strong>Tipo de carga:</strong> {tipoCarga}
              </Text>
            )}
            {slaDesejado && (
              <Text style={detailItem}>
                <strong>SLA desejado:</strong> {slaDesejado}
              </Text>
            )}
            {frequenciaEnvios && (
              <Text style={detailItem}>
                <strong>Frequência:</strong> {frequenciaEnvios}
              </Text>
            )}
            {rotasOrigem && rotasDestino && (
              <Text style={detailItem}>
                <strong>Rotas:</strong> {rotasOrigem} → {rotasDestino}
              </Text>
            )}
          </Section>

          {propostaValorMensal && (
            <Section style={proposalBox}>
              <Heading style={h2}>💰 Proposta de Valores</Heading>
              <Text style={priceText}>
                Valor mensal estimado: <strong style={{ color: '#2563eb', fontSize: '20px' }}>
                  R$ {propostaValorMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </Text>
              {propostaDescontoPercentual && propostaDescontoPercentual > 0 && (
                <Text style={discountText}>
                  🎯 Desconto aplicado: <strong>{propostaDescontoPercentual}%</strong> sobre tabela padrão
                </Text>
              )}
              {propostaObservacoes && (
                <Text style={detailItem}>
                  <strong>Observações:</strong> {propostaObservacoes}
                </Text>
              )}
            </Section>
          )}

          <Section style={benefitsBox}>
            <Heading style={h2}>✅ Benefícios da Parceria</Heading>
            <Text style={detailItem}>• Rastreamento em tempo real de todas as entregas</Text>
            <Text style={detailItem}>• Dashboard exclusivo com KPIs logísticos</Text>
            <Text style={detailItem}>• Matching inteligente de motoristas qualificados</Text>
            <Text style={detailItem}>• Seguro LogiGuard Pro para cargas de alto valor</Text>
            <Text style={detailItem}>• Suporte dedicado com SLA prioritário</Text>
          </Section>

          <Section style={{ textAlign: 'center' as const, margin: '30px 0' }}>
            <Button style={button} href="https://logimind-freight-flow.lovable.app/cotacao-b2b">
              Aceitar Proposta
            </Button>
          </Section>

          <Text style={text}>
            Esta proposta é válida por <strong>15 dias</strong>. Caso tenha dúvidas ou
            queira ajustar os termos, responda diretamente a este e-mail ou entre em contato
            pelo WhatsApp.
          </Text>

          <Hr style={divider} />

          <Text style={footer}>
            Atenciosamente,<br />
            <strong>Matheus Alves</strong><br />
            Equipe Comercial — {SITE_NAME}<br />
            matheus.alves@logimarket.com.br
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: B2BProposalEmail,
  subject: (data: Record<string, any>) =>
    `Proposta Comercial LogiMarket — ${data.razaoSocial || 'Sua Empresa'}`,
  displayName: 'Proposta B2B',
  previewData: {
    razaoSocial: 'ABC Distribuidora Ltda',
    contatoResponsavel: 'Carlos Silva',
    volumeMensal: 200,
    pesoMedioKg: 15,
    tipoCarga: 'Geral',
    slaDesejado: 'Express (24h)',
    rotasOrigem: 'São Paulo - SP',
    rotasDestino: 'Rio de Janeiro - RJ',
    frequenciaEnvios: 'Diária',
    propostaValorMensal: 45000,
    propostaDescontoPercentual: 12,
    propostaObservacoes: 'Desconto por volume e fidelidade contratual de 12 meses.',
  },
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '600px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, marginBottom: '10px' }
const logoText = { fontSize: '28px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0' }
const tagline = { fontSize: '13px', color: '#666666', margin: '4px 0 0' }
const divider = { borderColor: '#eeeeee', margin: '20px 0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 20px' }
const h2 = { fontSize: '16px', fontWeight: 'bold' as const, color: '#333333', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const detailItem = { fontSize: '14px', color: '#555555', lineHeight: '1.5', margin: '0 0 6px' }
const detailsBox = {
  backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px',
  margin: '20px 0', border: '1px solid #e2e8f0',
}
const proposalBox = {
  backgroundColor: '#eff6ff', borderRadius: '8px', padding: '20px',
  margin: '20px 0', border: '1px solid #bfdbfe',
}
const benefitsBox = {
  backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '20px',
  margin: '20px 0', border: '1px solid #bbf7d0',
}
const priceText = { fontSize: '16px', color: '#333333', margin: '0 0 8px' }
const discountText = { fontSize: '14px', color: '#10b981', margin: '0 0 8px' }
const button = {
  backgroundColor: '#2563eb', color: '#ffffff', padding: '14px 32px',
  borderRadius: '8px', fontSize: '16px', fontWeight: 'bold' as const,
  textDecoration: 'none',
}
const footer = { fontSize: '13px', color: '#666666', lineHeight: '1.6', margin: '0' }
