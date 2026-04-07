import { describe, it, expect } from "vitest";
import {
  formatarMoeda,
  formatarPorcentagem,
  formatarPorcentagemSimples,
  formatarPeso,
  removerFormatacaoPeso,
  formatarValorMonetario,
  removerFormatacaoMonetaria,
  formatDate,
} from "@/lib/formatters";

// ====================================================
// TESTES UNITÁRIOS - FORMATADORES
// ====================================================

describe("formatarMoeda", () => {
  it("formata valores positivos", () => {
    expect(formatarMoeda(10350)).toContain("10.350");
  });

  it("formata zero", () => {
    expect(formatarMoeda(0)).toContain("0,00");
  });

  it("formata valores negativos", () => {
    const result = formatarMoeda(-500);
    expect(result).toContain("500");
  });

  // Boundary values
  it.each([
    [null, "R$ 0,00"],
    [undefined, "R$ 0,00"],
    [NaN, "R$ 0,00"],
  ])("retorna R$ 0,00 para %s", (val, expected) => {
    expect(formatarMoeda(val as any)).toBe(expected);
  });

  it("formata valores muito grandes", () => {
    const result = formatarMoeda(99999999.99);
    expect(result).toContain("99.999.999");
  });

  it("formata centavos corretamente", () => {
    expect(formatarMoeda(0.01)).toContain("0,01");
    expect(formatarMoeda(0.99)).toContain("0,99");
  });
});

describe("formatarPorcentagem", () => {
  it("formata decimal como porcentagem", () => {
    expect(formatarPorcentagem(0.18)).toContain("18");
    expect(formatarPorcentagem(0.18)).toContain("%");
  });

  it("formata valor já percentual", () => {
    expect(formatarPorcentagem(18)).toContain("18");
  });

  it("retorna 0,00% para null/undefined/NaN", () => {
    expect(formatarPorcentagem(null)).toBe("0,00%");
    expect(formatarPorcentagem(undefined)).toBe("0,00%");
    expect(formatarPorcentagem(NaN)).toBe("0,00%");
  });
});

describe("formatarPorcentagemSimples", () => {
  it("formata com uma casa decimal", () => {
    const result = formatarPorcentagemSimples(0.185);
    expect(result).toContain("%");
  });

  it("retorna 0,0% para null", () => {
    expect(formatarPorcentagemSimples(null)).toBe("0,0%");
  });
});

describe("formatarPeso", () => {
  it("formata peso com separador de milhares", () => {
    expect(formatarPeso("20000")).toBe("20.000");
  });

  it("retorna vazio para string vazia", () => {
    expect(formatarPeso("")).toBe("");
  });

  it("remove caracteres não numéricos", () => {
    expect(formatarPeso("abc123def")).toBe("123");
  });

  it("formata valores limítrofes", () => {
    expect(formatarPeso("1")).toBe("1");
    expect(formatarPeso("999999")).toBe("999.999");
  });
});

describe("removerFormatacaoPeso", () => {
  it("remove pontos de milhares", () => {
    expect(removerFormatacaoPeso("20.000")).toBe("20000");
  });

  it("lida com strings sem formatação", () => {
    expect(removerFormatacaoPeso("500")).toBe("500");
  });
});

describe("formatarValorMonetario", () => {
  it("formata centavos corretamente", () => {
    expect(formatarValorMonetario("10000")).toContain("100,00");
  });

  it("retorna vazio para vazio", () => {
    expect(formatarValorMonetario("")).toBe("");
  });

  it("ignora letras", () => {
    expect(formatarValorMonetario("abc")).toBe("");
  });

  it("formata valores grandes", () => {
    const result = formatarValorMonetario("1000000000");
    expect(result).toContain("10.000.000");
  });
});

describe("removerFormatacaoMonetaria", () => {
  it("converte formato BR para numérico", () => {
    expect(removerFormatacaoMonetaria("200.000,00")).toBe("200000.00");
  });

  it("lida com valores simples", () => {
    expect(removerFormatacaoMonetaria("100,50")).toBe("100.50");
  });
});

describe("formatDate", () => {
  it("formata data ISO", () => {
    const result = formatDate("2024-03-15T00:00:00Z");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("retorna '-' para data inválida", () => {
    expect(formatDate("invalid")).toBe("-");
  });

  it("retorna '-' para string vazia", () => {
    expect(formatDate("")).toBe("-");
  });

  it("aceita objeto Date", () => {
    const result = formatDate(new Date(2024, 2, 15));
    expect(result).toContain("15");
  });
});
