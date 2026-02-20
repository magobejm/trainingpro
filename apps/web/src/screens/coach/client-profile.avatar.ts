export async function pickImageFile(): Promise<File | null> {
  if (typeof document === 'undefined') {
    return null;
  }
  const input = document.createElement('input');
  input.accept = 'image/png,image/jpeg,image/webp';
  input.type = 'file';
  return new Promise((resolve) => {
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}
