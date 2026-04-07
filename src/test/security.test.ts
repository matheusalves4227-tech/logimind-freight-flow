import { describe, it, expect } from "vitest";
import { validateCPF, validateCNPJ } from "@/lib/validators";

// ====================================================
// TESTES DE SEGURANÇA - XSS, SQL INJECTION, PAYLOAD
// ====================================================

const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  'javascript:alert(1)',
  '"><script>alert(1)</script>',
  "'-alert(1)-'",
  '<iframe src="javascript:alert(1)">',
  '<body onload=alert(1)>',
];

const sqlInjectionPayloads = [
  "'; DROP TABLE users; --",
  "' OR '1'='1",
  "'; TRUNCATE TABLE orders; --",
  "1; SELECT * FROM users",
  "UNION SELECT * FROM users--",
  "' OR 1=1 --",
];

const pathTraversalPayloads = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  '/etc/passwd',
  'file:///etc/passwd',
];

const commandInjectionPayloads = [
  '; ls -la',
  '| cat /etc/passwd',
  '`whoami`',
  '$(cat /etc/passwd)',
];

describe("Security - CPF Validator vs Malicious Input", () => {
  it.each(xssPayloads)("rejeita XSS payload: %s", (payload) => {
    expect(validateCPF(payload)).toBe(false);
  });

  it.each(sqlInjectionPayloads)("rejeita SQL injection: %s", (payload) => {
    expect(validateCPF(payload)).toBe(false);
  });

  it.each(pathTraversalPayloads)("rejeita path traversal: %s", (payload) => {
    expect(validateCPF(payload)).toBe(false);
  });

  it.each(commandInjectionPayloads)("rejeita command injection: %s", (payload) => {
    expect(validateCPF(payload)).toBe(false);
  });
});

describe("Security - CNPJ Validator vs Malicious Input", () => {
  it.each(xssPayloads)("rejeita XSS payload: %s", (payload) => {
    expect(validateCNPJ(payload)).toBe(false);
  });

  it.each(sqlInjectionPayloads)("rejeita SQL injection: %s", (payload) => {
    expect(validateCNPJ(payload)).toBe(false);
  });
});

describe("Security - Phone Formatter Sanitization", () => {
  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, "");
    return numbers.slice(0, 11);
  };

  it.each(xssPayloads)("sanitiza XSS de telefone: %s", (payload) => {
    const result = formatPhone(payload);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    expect(result).not.toContain("script");
    expect(result).toMatch(/^\d*$/);
  });

  it.each(sqlInjectionPayloads)("sanitiza SQL injection de telefone: %s", (payload) => {
    const result = formatPhone(payload);
    expect(result).toMatch(/^\d*$/);
  });
});

describe("Security - Money Formatter Sanitization", () => {
  const sanitizeMoney = (money: string) => money.replace(/\D/g, "");

  it.each(xssPayloads)("sanitiza XSS de valor: %s", (payload) => {
    const result = sanitizeMoney(payload);
    expect(result).toMatch(/^\d*$/);
  });

  it.each(sqlInjectionPayloads)("sanitiza SQL injection de valor: %s", (payload) => {
    const result = sanitizeMoney(payload);
    expect(result).toMatch(/^\d*$/);
  });
});

describe("Security - Boundary & Overflow", () => {
  it("rejeita string gigante no CPF", () => {
    const huge = "1".repeat(100000);
    expect(validateCPF(huge)).toBe(false);
  });

  it("rejeita string gigante no CNPJ", () => {
    const huge = "1".repeat(100000);
    expect(validateCNPJ(huge)).toBe(false);
  });

  it("lida com null bytes", () => {
    expect(validateCPF("529\x00982\x00247\x0025")).toBe(false);
  });

  it("lida com Unicode injection", () => {
    expect(validateCPF("𝟓𝟐𝟗𝟗𝟖𝟐𝟐𝟒𝟕𝟐𝟓")).toBe(false);
  });

  it("rejeita newlines embedded", () => {
    expect(validateCPF("529\n982\n247\n25")).toBe(false);
  });
});
