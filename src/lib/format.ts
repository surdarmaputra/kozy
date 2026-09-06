const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatRupiah(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return 'Tanya kami'
  return rupiah.format(value).replace(/\s/g, ' ')
}
