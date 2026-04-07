import { describe, it, expect } from "vitest";

// ====================================================
// TESTES DE CAMPOS NUMÉRICOS E LIMITES
// Phone, Money, Weight, Dimension formatters
// ====================================================

// --- Phone Input Formatter ---
const formatPhone = (phone: string) => {
  const numbers = phone.replace(/\D/g, "");
  const limited = numbers.slice(0, 11);
  if (limited.length <= 2) return limited;
  if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  if (limited.length <= 10) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7, 11)}`;
};

describe("Phone Input - Formatação", () => {
  it("formata telefone celular completo", () => {
    expect(formatPhone("11988887777")).toBe("(11) 98888-7777");
  });

  it("formata telefone fixo completo", () => {
    expect(formatPhone("1138887777")).toBe("(11) 3888-7777");
  });

  it("formata DDD parcial", () => {
    expect(formatPhone("11")).toBe("11");
  });

  it("formata DDD + início", () => {
    expect(formatPhone("119")).toBe("(11) 9");
  });

  it("ignora caracteres não numéricos", () => {
    expect(formatPhone("abc11def98888ghi7777")).toBe("(11) 98888-7777");
  });

  it("trunca após 11 dígitos", () => {
    expect(formatPhone("119888877779999")).toBe("(11) 98888-7777");
  });

  it("retorna vazio para vazio", () => {
    expect(formatPhone("")).toBe("");
  });

  it("lida com caracteres especiais", () => {
    expect(formatPhone("!@#$%")).toBe("");
  });

  it("lida com espaços", () => {
    expect(formatPhone("  11 9 8888 7777  ")).toBe("(11) 98888-7777");
  });
});

// --- Money Input Formatter ---
const formatMoney = (money: string, maxValue = 100000000) => {
  const numbers = money.replace(/\D/g, "");
  if (!numbers) return "";
  let amount = parseInt(numbers) / 100;
  if (maxValue && amount > maxValue) amount = maxValue;
  return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

describe("Money Input - Formatação", () => {
  it("formata centavos", () => {
    expect(formatMoney("1")).toBe("0,01");
  });

  it("formata reais", () => {
    expect(formatMoney("10000")).toBe("100,00");
  });

  it("formata milhares", () => {
    expect(formatMoney("100000000")).toBe("1.000.000,00");
  });

  it("retorna vazio para vazio", () => {
    expect(formatMoney("")).toBe("");
  });

  it("respeita limite máximo", () => {
    const result = formatMoney("99999999999999", 100000000);
    expect(result).toBe("100.000.000,00");
  });

  it("ignora letras", () => {
    expect(formatMoney("abc100def")).toBe("1,00");
  });

  it("formata R$ 0,00 para apenas zeros", () => {
    expect(formatMoney("0")).toBe("0,00");
  });

  it("lida com valor muito pequeno", () => {
    expect(formatMoney("1")).toBe("0,01");
    expect(formatMoney("9")).toBe("0,09");
    expect(formatMoney("10")).toBe("0,10");
    expect(formatMoney("99")).toBe("0,99");
  });
});

// --- Weight Input Formatter ---
const formatWeight = (weight: string) => {
  const cleaned = weight.replace(/[^\d,.-]/g, "");
  const parts = cleaned.split(/[,.]/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimal = parts[1].slice(0, 2);
  return `${integer},${decimal}`;
};

describe("Weight Input - Formatação", () => {
  it("formata inteiro com separador de milhares", () => {
    expect(formatWeight("20000")).toBe("20.000");
  });

  it("formata com decimais", () => {
    expect(formatWeight("150,5")).toBe("150,5");
  });

  it("trunca decimais a 2 casas", () => {
    expect(formatWeight("150,555")).toBe("150,55");
  });

  it("retorna vazio para vazio", () => {
    expect(formatWeight("")).toBe("");
  });

  it("remove caracteres especiais", () => {
    expect(formatWeight("abc")).toBe("");
  });

  it("formata peso de 1 dígito", () => {
    expect(formatWeight("5")).toBe("5");
  });

  it("formata peso grande", () => {
    expect(formatWeight("999999")).toBe("999.999");
  });
});

// --- Dimension Input Formatter ---
const formatDimension = (input: string, maxValue = 9999) => {
  let cleaned = input.replace(/[^\d,]/g, "");
  const parts = cleaned.split(",");
  if (parts.length > 2) cleaned = parts[0] + "," + parts.slice(1).join("");
  if (parts.length === 2 && parts[1].length > 2) cleaned = parts[0] + "," + parts[1].slice(0, 2);
  if (parts[0].length > 4) cleaned = parts[0].slice(0, 4) + (parts.length > 1 ? "," + parts[1] : "");
  const numericValue = parseFloat(cleaned.replace(",", "."));
  if (!isNaN(numericValue) && numericValue > maxValue) return null; // blocked
  return cleaned;
};

describe("Dimension Input - Formatação", () => {
  it("aceita valor válido", () => {
    expect(formatDimension("100")).toBe("100");
  });

  it("aceita decimais", () => {
    expect(formatDimension("100,50")).toBe("100,50");
  });

  it("trunca decimais a 2 casas", () => {
    expect(formatDimension("100,555")).toBe("100,55");
  });

  it("trunca inteiro a 4 dígitos", () => {
    expect(formatDimension("12345")).toBe("1234");
  });

  it("bloqueia valores acima do máximo", () => {
    expect(formatDimension("10000", 9999)).toBeNull();
  });

  it("aceita valor no limite", () => {
    expect(formatDimension("9999", 9999)).toBe("9999");
  });

  it("remove letras", () => {
    expect(formatDimension("abc100")).toBe("100");
  });

  it("retorna vazio para vazio", () => {
    expect(formatDimension("")).toBe("");
  });
});

// ====================================================
// TESTES DE BOUNDARY / EDGE CASES
// ====================================================

describe("Boundary Values - Stress Tests", () => {
  it("telefone com string muito longa", () => {
    const result = formatPhone("1".repeat(100));
    expect(result).toBe("(11) 11111-1111");
  });

  it("dinheiro com string muito longa", () => {
    const result = formatMoney("9".repeat(50));
    // Should cap at max value
    expect(result).toBe("100.000.000,00");
  });

  it("peso com apenas separadores", () => {
    expect(formatWeight(",,,")).toBe("");
  });

  it("dimensão com múltiplas vírgulas", () => {
    const result = formatDimension("100,50,30");
    expect(result).toBe("100,50");
  });

  it("telefone com Unicode", () => {
    expect(formatPhone("📞11988887777")).toBe("(11) 98888-7777");
  });

  it("dinheiro com null bytes", () => {
    expect(formatMoney("\x00\x00100")).toBe("1,00");
  });
});
