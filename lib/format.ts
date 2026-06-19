export function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const CATEGORIES = [
  'Food',
  'Transport',
  'Books & Stationery',
  'Accommodation',
  'Data & Airtime',
  'Health',
  'Entertainment',
  'Clothing',
  'Others',
]

export const CATEGORY_COLORS: Record<string, string> = {
  Food: 'bg-orange-400',
  Transport: 'bg-blue-400',
  'Books & Stationery': 'bg-purple-400',
  Accommodation: 'bg-yellow-400',
  'Data & Airtime': 'bg-cyan-400',
  Health: 'bg-red-400',
  Entertainment: 'bg-pink-400',
  Clothing: 'bg-indigo-400',
  Others: 'bg-gray-400',
}
