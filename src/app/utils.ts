export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, ''); // удаляет всё, кроме цифр
  return digits;
}
