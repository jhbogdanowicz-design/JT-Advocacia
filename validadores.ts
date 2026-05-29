/**
 * JT - JANAINA TARABAUCA ADVOCACIA - VALIDATÓRIOS E FORMATADORES DE DOCUMENTOS
 * Este arquivo contém funções puras escritas em TypeScript para formatação e 
 * validação matemática real de CPF e CNPJ através de cálculo de dígitos verificadores.
 */

/**
 * Valida matematicamente um CPF usando o algoritmo de módulo 11.
 * @param cpf String contendo o CPF a ser validado
 * @returns boolean indicando se o CPF é matematicamente válido
 */
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");

  // Deve ter exatamente 11 dígitos
  if (cleanCPF.length !== 11) return false;

  // CPF não pode conter todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(9))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

/**
 * Valida matematicamente um CNPJ usando o algoritmo de módulo 11.
 * @param cnpj String contendo o CNPJ a ser validado
 * @returns boolean indicando se o CNPJ é matematicamente válido
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, "");

  // Deve ter exatamente 14 dígitos
  if (cleanCNPJ.length !== 14) return false;

  // CNPJ não pode conter todos os dígitos iguais (ex: 000.000.000/0000-00)
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  // Validação do primeiro dígito verificador
  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Validação do segundo dígito verificador
  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Aplica máscara visual ao CPF (000.000.000-00)
 * @param cpf Valor numérico bruto ou com pontuação parcial
 * @returns String formatada
 */
export function formatCPF(cpf: string): string {
  let v = cpf.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return v;
}

/**
 * Aplica máscara visual ao CNPJ (00.000.000/0000-00)
 * @param cnpj Valor numérico bruto ou com pontuação parcial
 * @returns String formatada
 */
export function formatCNPJ(cnpj: string): string {
  let v = cnpj.replace(/\D/g, "");
  if (v.length > 14) v = v.substring(0, 14);
  v = v.replace(/^(\d{2})(\d)/, "$1.$2");
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
  v = v.replace(/(\d{4})(\d)/, "$1-$2");
  return v;
}

/**
 * Formata dinamicamente um CPF ou CNPJ baseado no tipo de pessoa
 * @param value Valor bruto
 * @param isPf Flag de Pessoa Física (true) ou Pessoa Jurídica (false)
 * @returns String formatada
 */
export function formatCPFOrCNPJ(value: string, isPf: boolean): string {
  return isPf ? formatCPF(value) : formatCNPJ(value);
}
