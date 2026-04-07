import { describe, it, expect } from "vitest";
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ } from "@/lib/validators";

// ====================================================
// TESTES UNITÁRIOS - VALIDADORES CPF/CNPJ
// ====================================================

describe("validateCPF", () => {
  // CPFs válidos conhecidos
  it.each([
    "52998224725",
    "11144477735",
  ])("deve aceitar CPF válido: %s", (cpf) => {
    expect(validateCPF(cpf)).toBe(true);
  });

  it("deve aceitar CPF com formatação", () => {
    expect(validateCPF("529.982.247-25")).toBe(true);
  });

  // CPFs inválidos
  it.each([
    ["", "vazio"],
    ["12345678900", "dígitos verificadores incorretos"],
    ["11111111111", "todos os dígitos iguais"],
    ["22222222222", "todos os dígitos iguais"],
    ["00000000000", "todos zeros"],
    ["1234567890", "10 dígitos"],
    ["123456789012", "12 dígitos"],
    ["abcdefghijk", "letras"],
  ])("deve rejeitar CPF inválido (%s): %s", (cpf) => {
    expect(validateCPF(cpf)).toBe(false);
  });

  // Boundary: todos os padrões de repetição
  it.each(Array.from({ length: 10 }, (_, i) => String(i).repeat(11)))(
    "deve rejeitar CPF com todos os dígitos iguais: %s",
    (cpf) => {
      expect(validateCPF(cpf)).toBe(false);
    }
  );
});

describe("validateCNPJ", () => {
  it.each([
    "11222333000181",
    "11444777000161",
  ])("deve aceitar CNPJ válido: %s", (cnpj) => {
    expect(validateCNPJ(cnpj)).toBe(true);
  });

  it("deve aceitar CNPJ com formatação", () => {
    expect(validateCNPJ("11.222.333/0001-81")).toBe(true);
  });

  it.each([
    ["", "vazio"],
    ["12345678901234", "dígitos verificadores incorretos"],
    ["11111111111111", "todos os dígitos iguais"],
    ["00000000000000", "todos zeros"],
    ["1234567890123", "13 dígitos"],
    ["123456789012345", "15 dígitos"],
  ])("deve rejeitar CNPJ inválido (%s): %s", (cnpj) => {
    expect(validateCNPJ(cnpj)).toBe(false);
  });
});

describe("formatCPF", () => {
  it("deve formatar CPF corretamente", () => {
    expect(formatCPF("52998224725")).toBe("529.982.247-25");
  });

  it("deve lidar com CPF já formatado (idempotência parcial)", () => {
    const result = formatCPF("529.982.247-25");
    expect(result).toBe("529.982.247-25");
  });
});

describe("formatCNPJ", () => {
  it("deve formatar CNPJ corretamente", () => {
    expect(formatCNPJ("11222333000181")).toBe("11.222.333/0001-81");
  });
});
