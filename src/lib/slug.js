export function gerarSlug(nome) {
  const base = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const sufixo = Math.random().toString(36).slice(2, 7)
  return `${base}-${sufixo}`
}
