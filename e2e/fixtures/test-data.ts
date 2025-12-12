// Test data for E2E tests - valid and invalid scenarios

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
};

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
};

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
  invalidEmail: { ...validDriver, email: 'emailinvalido' },
  invalidPhone: { ...validDriver, phone: '123' },
  emptyCep: { ...validDriver, cep: '' },
};

export const validCarrier = {
  razaoSocial: 'Transportadora Teste LTDA',
  cnpj: '11.222.333/0001-81', // CNPJ válido para teste
  email: 'transportadora.teste@logimarket.com.br',
  telefone: '(11) 3333-4444',
  cep: '01310-100',
};

export const invalidCarriers = {
  invalidCnpj: { ...validCarrier, cnpj: '11.111.111/1111-11' },
  invalidEmail: { ...validCarrier, email: 'emailinvalido' },
};
