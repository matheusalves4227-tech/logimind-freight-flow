// ============================================
// TEST DATA FIXTURES
// Valid and invalid scenarios for E2E testing
// ============================================

// ============================================
// USER DATA
// ============================================

export const validUser = {
  email: 'teste.e2e@logimarket.com.br',
  password: 'TestE2E@2024',
  name: 'Teste E2E LogiMarket',
};

export const invalidUsers = {
  emptyEmail: { email: '', password: 'Test@123456' },
  invalidEmail: { email: 'emailinvalido', password: 'Test@123456' },
  shortPassword: { email: 'teste@email.com', password: '123' },
  weakPassword: { email: 'teste@email.com', password: 'password' },
  noUppercase: { email: 'teste@email.com', password: 'teste@12345' },
  noLowercase: { email: 'teste@email.com', password: 'TESTE@12345' },
  noNumber: { email: 'teste@email.com', password: 'TesteSenha@' },
  noSpecialChar: { email: 'teste@email.com', password: 'TesteSenha1' },
  tooLong: { email: 'teste@email.com', password: 'A'.repeat(200) },
  sqlInjection: { email: "admin'--@test.com", password: "' OR '1'='1" },
  xssAttempt: { email: '<script>alert(1)</script>@test.com', password: '<img onerror=alert(1)>' },
};

// ============================================
// QUOTE DATA
// ============================================

export const validQuote = {
  originCep: '01310-100', // Av. Paulista, SP
  destinationCep: '20040-020', // Centro, RJ
  weight: '150',
  length: '100',
  width: '80',
  height: '60',
};

export const invalidQuotes = {
  invalidOriginCep: { ...validQuote, originCep: '00000-000' },
  invalidDestinationCep: { ...validQuote, destinationCep: '99999-999' },
  emptyWeight: { ...validQuote, weight: '' },
  negativeWeight: { ...validQuote, weight: '-10' },
  zeroWeight: { ...validQuote, weight: '0' },
  excessiveWeight: { ...validQuote, weight: '999999' },
  negativeDimensions: { ...validQuote, length: '-50', width: '-30', height: '-20' },
  zeroDimensions: { ...validQuote, length: '0', width: '0', height: '0' },
  excessiveDimensions: { ...validQuote, length: '99999', width: '99999', height: '99999' },
  partialCep: { ...validQuote, originCep: '01310' },
  lettersCep: { ...validQuote, originCep: 'ABCDE-FGH' },
  sameCep: { ...validQuote, originCep: '01310-100', destinationCep: '01310-100' },
};

// ============================================
// DRIVER DATA
// ============================================

export const validDriver = {
  fullName: 'João Motorista Teste',
  cpf: '529.982.247-25', // CPF válido para teste
  email: 'motorista.teste@logimarket.com.br',
  phone: '(11) 99999-8888',
  whatsapp: '(11) 99999-8888',
  cep: '01310-100',
  street: 'Av. Paulista',
  number: '1000',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
};

export const invalidDrivers = {
  invalidCpf: { ...validDriver, cpf: '111.111.111-11' },
  malformedCpf: { ...validDriver, cpf: '123.456.789-00' },
  emptyCpf: { ...validDriver, cpf: '' },
  lettersCpf: { ...validDriver, cpf: 'ABC.DEF.GHI-JK' },
  invalidEmail: { ...validDriver, email: 'emailinvalido' },
  emptyEmail: { ...validDriver, email: '' },
  invalidPhone: { ...validDriver, phone: '123' },
  emptyPhone: { ...validDriver, phone: '' },
  lettersPhone: { ...validDriver, phone: 'ABCDEFGHIJK' },
  emptyCep: { ...validDriver, cep: '' },
  invalidCep: { ...validDriver, cep: '00000-000' },
  emptyName: { ...validDriver, fullName: '' },
  shortName: { ...validDriver, fullName: 'Jo' },
  numbersOnlyName: { ...validDriver, fullName: '12345678' },
  specialCharsName: { ...validDriver, fullName: '!@#$%^&*()' },
};

// ============================================
// CARRIER DATA
// ============================================

export const validCarrier = {
  razaoSocial: 'Transportadora Teste LTDA',
  nomeFantasia: 'Transportadora Teste',
  cnpj: '11.222.333/0001-81', // CNPJ válido para teste
  email: 'transportadora.teste@logimarket.com.br',
  telefone: '(11) 3333-4444',
  cep: '01310-100',
  street: 'Av. Paulista',
  number: '500',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
};

export const invalidCarriers = {
  invalidCnpj: { ...validCarrier, cnpj: '11.111.111/1111-11' },
  malformedCnpj: { ...validCarrier, cnpj: '12.345.678/9012-34' },
  emptyCnpj: { ...validCarrier, cnpj: '' },
  lettersCnpj: { ...validCarrier, cnpj: 'AB.CDE.FGH/IJKL-MN' },
  invalidEmail: { ...validCarrier, email: 'emailinvalido' },
  emptyEmail: { ...validCarrier, email: '' },
  invalidPhone: { ...validCarrier, telefone: '123' },
  emptyPhone: { ...validCarrier, telefone: '' },
  emptyCep: { ...validCarrier, cep: '' },
  invalidCep: { ...validCarrier, cep: '00000-000' },
  emptyRazaoSocial: { ...validCarrier, razaoSocial: '' },
};

// ============================================
// TRACKING DATA
// ============================================

export const validTrackingCodes = [
  'LM-2024-01-0001',
  'LM-2024-12-9999',
  'LM-2025-06-1234',
];

export const invalidTrackingCodes = [
  '',
  'INVALID',
  '12345',
  'LM-0000-00-0000',
  '<script>alert(1)</script>',
  "'; DROP TABLE orders; --",
  '\x00\x00\x00',
  'A'.repeat(500),
];

// ============================================
// ADDRESS DATA
// ============================================

export const validAddresses = {
  saoPaulo: {
    cep: '01310-100',
    street: 'Avenida Paulista',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
  rioDeJaneiro: {
    cep: '20040-020',
    street: 'Rua do Ouvidor',
    neighborhood: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
  },
  beloHorizonte: {
    cep: '30130-000',
    street: 'Avenida Afonso Pena',
    neighborhood: 'Centro',
    city: 'Belo Horizonte',
    state: 'MG',
  },
};

export const invalidCeps = [
  '00000-000',
  '99999-999',
  '12345',
  'ABCDE-FGH',
  '',
  '123456789',
];

// ============================================
// PAYMENT DATA
// ============================================

export const validPaymentData = {
  cardNumber: '4111111111111111',
  expiryDate: '12/28',
  cvv: '123',
  holderName: 'TESTE LOGIMARKET',
};

export const invalidPaymentData = {
  expiredCard: { ...validPaymentData, expiryDate: '01/20' },
  invalidCardNumber: { ...validPaymentData, cardNumber: '1234567890123456' },
  shortCvv: { ...validPaymentData, cvv: '12' },
  lettersCvv: { ...validPaymentData, cvv: 'ABC' },
  emptyHolderName: { ...validPaymentData, holderName: '' },
};

// ============================================
// VEHICLE DATA
// ============================================

export const validVehicle = {
  type: 'van',
  brand: 'Fiat',
  model: 'Ducato',
  year: '2022',
  plate: 'ABC1D23',
  maxWeight: '1500',
};

export const invalidVehicles = {
  emptyType: { ...validVehicle, type: '' },
  emptyPlate: { ...validVehicle, plate: '' },
  invalidPlate: { ...validVehicle, plate: '12345' },
  negativeWeight: { ...validVehicle, maxWeight: '-100' },
  zeroWeight: { ...validVehicle, maxWeight: '0' },
  futureYear: { ...validVehicle, year: '2030' },
  pastYear: { ...validVehicle, year: '1950' },
};

// ============================================
// SECURITY TEST PAYLOADS
// ============================================

export const securityPayloads = {
  xss: [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    'javascript:alert(1)',
    '<body onload=alert(1)>',
    '"><script>alert(1)</script>',
    "'-alert(1)-'",
    '<iframe src="javascript:alert(1)">',
  ],
  sqlInjection: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "'; TRUNCATE TABLE orders; --",
    "1; SELECT * FROM users",
    "UNION SELECT * FROM users--",
    "' OR 1=1 --",
  ],
  pathTraversal: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '/etc/passwd',
    'file:///etc/passwd',
  ],
  commandInjection: [
    '; ls -la',
    '| cat /etc/passwd',
    '`whoami`',
    '$(cat /etc/passwd)',
  ],
};

// ============================================
// BOUNDARY VALUES
// ============================================

export const boundaryValues = {
  emptyString: '',
  singleChar: 'A',
  maxLengthName: 'A'.repeat(255),
  veryLongString: 'A'.repeat(10000),
  unicodeString: '日本語テスト',
  emojiString: '😀😃😄😁😆',
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  whitespaceOnly: '   ',
  newlines: 'line1\nline2\nline3',
  tabs: 'col1\tcol2\tcol3',
  nullChar: 'test\x00null',
};
