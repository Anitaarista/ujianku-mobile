/**
 * Convert an array of objects to CSV and trigger a download
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) {
    console.warn('Tidak ada data untuk diekspor')
    return
  }

  const headers = Object.keys(data[0])
  const csvRows: string[] = []

  // Header row
  csvRows.push(headers.map(h => `"${h}"`).join(','))

  // Data rows
  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h]
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    })
    csvRows.push(values.join(','))
  }

  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
