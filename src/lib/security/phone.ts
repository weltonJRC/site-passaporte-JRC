export function normalizeBrazilianMobile(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  if (!/^[1-9][0-9]9[0-9]{8}$/.test(digits)) {
    throw new Error("Informe um celular brasileiro válido com DDD.");
  }
  return `+55${digits}`;
}
