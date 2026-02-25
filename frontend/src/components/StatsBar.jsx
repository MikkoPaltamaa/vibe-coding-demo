import { Package, DollarSign, AlertTriangle, TrendingDown } from 'lucide-react'

export default function StatsBar({ products }) {
  const totalProducts = products.length
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0)
  const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= 10).length
  const outOfStock = products.filter((p) => p.quantity === 0).length

  const stats = [
    {
      label: 'Total Products',
      value: totalProducts,
      icon: Package,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Total Stock Value',
      value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Low Stock Items',
      value: lowStock,
      icon: TrendingDown,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Out of Stock',
      value: outOfStock,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium uppercase tracking-wide">{stat.label}</p>
              <p className="mt-1.5 text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
            <div className={`${stat.bg} p-3 rounded-lg`}>
              <stat.icon className={stat.color} size={20} aria-hidden="true" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
