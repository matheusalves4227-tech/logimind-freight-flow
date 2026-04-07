import { describe, it, expect } from "vitest";
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ } from "@/lib/validators";
import {
  formatarMoeda,
  formatarPorcentagem,
  formatarPeso,
  removerFormatacaoPeso,
  formatarValorMonetario,
  removerFormatacaoMonetaria,
  formatDate,
} from "@/lib/formatters";

// ====================================================
// TESTES DE REGRESSÃO
// Garante que funcionalidades existentes não quebrem
// ====================================================

describe("Regressão - CPF/CNPJ Pipeline", () => {
  it("CPF: entrada formatada → validação → reformatação = consistente", () => {
    const input = "529.982.247-25";
    const isValid = validateCPF(input);
    const reformatted = formatCPF(input.replace(/\D/g, ""));
    expect(isValid).toBe(true);
    expect(reformatted).toBe(input);
  });

  it("CNPJ: entrada formatada → validação → reformatação = consistente", () => {
    const input = "11.222.333/0001-81";
    const isValid = validateCNPJ(input);
    const reformatted = formatCNPJ(input.replace(/\D/g, ""));
    expect(isValid).toBe(true);
    expect(reformatted).toBe(input);
  });

  it("CPF inválido continua inválido após formatação", () => {
    const invalid = "12345678900";
    expect(validateCPF(invalid)).toBe(false);
    const formatted = formatCPF(invalid);
    expect(validateCPF(formatted)).toBe(false);
  });
});

describe("Regressão - Formatadores Monetários", () => {
  it("formatação e remoção são inversas", () => {
    const original = "25000"; // 250,00
    const formatted = formatarValorMonetario(original);
    const unformatted = removerFormatacaoMonetaria(formatted);
    expect(parseFloat(unformatted)).toBe(250.00);
  });

  it("formatação de peso ida e volta", () => {
    const original = "20000";
    const formatted = formatarPeso(original);
    expect(formatted).toBe("20.000");
    const unformatted = removerFormatacaoPeso(formatted);
    expect(unformatted).toBe("20000");
  });

  it("formatarMoeda retorna valor consistente", () => {
    const value = 1500.50;
    const result1 = formatarMoeda(value);
    const result2 = formatarMoeda(value);
    expect(result1).toBe(result2);
  });
});

describe("Regressão - Formatação de Datas", () => {
  it("data ISO padrão", () => {
    const result = formatDate("2024-01-15T10:30:00Z");
    expect(result).toContain("15");
    expect(result).toContain("01");
    expect(result).toContain("2024");
  });

  it("data no fim do ano", () => {
    const result = formatDate("2024-12-31T23:59:59Z");
    expect(result).toContain("31");
    expect(result).toContain("12");
  });

  it("data no início do ano", () => {
    const result = formatDate("2024-01-01T00:00:00Z");
    expect(result).toContain("01");
  });
});

describe("Regressão - CEP Validation Logic", () => {
  const validateCep = (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return false;
    if (clean === "00000000") return false;
    return true;
  };

  it.each([
    ["01310-100", true],
    ["20040-020", true],
    ["01310100", true],
    ["00000-000", false],
    ["00000000", false],
    ["12345", false],
    ["ABCDE-FGH", false],
    ["", false],
    ["123456789", false],
  ])("CEP '%s' deve ser %s", (cep, expected) => {
    expect(validateCep(cep)).toBe(expected);
  });
});

describe("Regressão - Quote Form Validation Logic", () => {
  const validateWeight = (weight: string): string | null => {
    const parsed = parseFloat(weight.replace(",", "."));
    if (!weight || isNaN(parsed)) return "Preencha o peso";
    if (parsed <= 0) return "Peso deve ser maior que zero";
    if (parsed > 30000) return "Peso excede o limite máximo de 30.000 kg";
    return null;
  };

  it.each([
    ["150", null],
    ["0.5", null],
    ["30000", null],
    ["", "Preencha o peso"],
    ["abc", "Preencha o peso"],
    ["0", "Peso deve ser maior que zero"],
    ["-10", "Peso deve ser maior que zero"],
    ["30001", "Peso excede o limite máximo de 30.000 kg"],
    ["999999", "Peso excede o limite máximo de 30.000 kg"],
  ])("peso '%s' → %s", (weight, expected) => {
    expect(validateWeight(weight)).toBe(expected);
  });

  const validateDimension = (dim: string, maxVal: number): string | null => {
    if (!dim) return null; // optional
    const parsed = parseFloat(dim);
    if (isNaN(parsed) || parsed <= 0) return "Deve ser um número válido maior que zero";
    if (parsed > maxVal) return "Excede limite";
    return null;
  };

  it.each([
    ["100", 500, null],
    ["500", 500, null],
    ["", 500, null],
    ["0", 500, "Deve ser um número válido maior que zero"],
    ["-50", 500, "Deve ser um número válido maior que zero"],
    ["501", 500, "Excede limite"],
    ["abc", 500, "Deve ser um número válido maior que zero"],
  ])("dimensão '%s' (max %s) → %s", (dim, max, expected) => {
    expect(validateDimension(dim, max)).toBe(expected);
  });
});

describe("Regressão - Order Creation Schema", () => {
  const validateOrderFields = (data: Record<string, any>) => {
    const errors: string[] = [];
    if (!data.carrier_name || data.carrier_name.length === 0) errors.push("carrier_name required");
    if (!["ltl", "ftl"].includes(data.service_type)) errors.push("service_type invalid");
    if (!data.origin_cep || !/^\d{5}-?\d{3}$/.test(data.origin_cep)) errors.push("origin_cep invalid");
    if (!data.destination_cep || !/^\d{5}-?\d{3}$/.test(data.destination_cep)) errors.push("destination_cep invalid");
    if (typeof data.base_price !== "number" || data.base_price < 0) errors.push("base_price invalid");
    if (typeof data.final_price !== "number" || data.final_price <= 0) errors.push("final_price invalid");
    if (typeof data.commission_applied !== "number" || data.commission_applied < 0 || data.commission_applied > 1) errors.push("commission invalid");
    return errors;
  };

  it("aceita pedido válido", () => {
    expect(validateOrderFields({
      carrier_name: "Transportadora X",
      service_type: "ltl",
      origin_cep: "01310-100",
      destination_cep: "20040-020",
      base_price: 100,
      final_price: 118,
      commission_applied: 0.18,
    })).toEqual([]);
  });

  it("rejeita pedido sem carrier_name", () => {
    const errors = validateOrderFields({
      carrier_name: "",
      service_type: "ltl",
      origin_cep: "01310-100",
      destination_cep: "20040-020",
      base_price: 100,
      final_price: 118,
      commission_applied: 0.18,
    });
    expect(errors).toContain("carrier_name required");
  });

  it("rejeita service_type inválido", () => {
    const errors = validateOrderFields({
      carrier_name: "X",
      service_type: "invalid",
      origin_cep: "01310-100",
      destination_cep: "20040-020",
      base_price: 100,
      final_price: 118,
      commission_applied: 0.18,
    });
    expect(errors).toContain("service_type invalid");
  });

  it("rejeita comissão > 1", () => {
    const errors = validateOrderFields({
      carrier_name: "X",
      service_type: "ltl",
      origin_cep: "01310-100",
      destination_cep: "20040-020",
      base_price: 100,
      final_price: 118,
      commission_applied: 1.5,
    });
    expect(errors).toContain("commission invalid");
  });
});
