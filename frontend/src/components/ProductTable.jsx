import { useState } from 'react'
import { Trash2, Minus, Plus, ChevronUp, ChevronDown } from 'lucide-react'

const CATEGORY_COLORS = {
  "Men's": 'bg-blue-100 text-blue-700',
  "Women's": 'bg-pink-100 text-pink-700',
  "Kids'": 'bg-yellow-100 text-yellow-700',
  'Unisex': 'bg-violet-100 text-violet-700',
  'Accessories': 'bg-teal-100 text-teal-700',
}

function getStockBadge(quantity) {
  if (quantity === 0)
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700" aria-label="Out of stock">Out of stock</span>
  if (quantity <= 10)
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700" aria-label="Low stock">Low stock</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700" aria-label="In stock">In stock</span>
}

function QuantityEditor({ product, onChange }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(product.quantity))

  const commit = () => {
    const num = parseInt(value)
    if (!isNaN(num) && num >= 0 && num !== product.quantity) {
      onChange(product.id, num)
    } else {
      setValue(String(product.quantity))
    }
    setEditing(false)
  }

  const adjust = (delta) => {
    const next = Math.max(0, product.quantity + delta)
    setValue(String(next))
    onChange(product.id, next)
  }

  if (editing) {
    return (
      <input
        type="number"
        min="0"
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setValue(String(product.quantity)); setEditing(false) } }}
        className="w-20 border border-indigo-400 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    )
  }

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={`Quantity controls for ${product.name}`}>
      <button
        onClick={() => adjust(-1)}
        disabled={product.quantity === 0}
        aria-label={`Decrease quantity for ${product.name}`}
        className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 transition-colors"
      >
        <Minus size={14} aria-hidden="true" />
      </button>
      <button
        onClick={() => setEditing(true)}
        aria-label={`Edit quantity for ${product.name}, current value ${product.quantity}`}
        className="min-w-[2.5rem] text-center font-semibold text-gray-900 hover:bg-gray-100 rounded px-2 py-0.5 text-sm transition-colors"
      >
        {product.quantity}
      </button>
      <button
        onClick={() => adjust(1)}
        aria-label={`Increase quantity for ${product.name}`}
        className="p-1 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
      >
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  )
}

export default function ProductTable({ products, onDelete, onQuantityChange }) {
  const [sortField, setSortField] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  const sorted = [...products].sort((a, b) => {
    let va = a[sortField], vb = b[sortField]
    if (typeof va === 'string') va = va.toLowerCase(), vb = vb.toLowerCase()
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="text-gray-300" size={14} />
    return sortDir === 'asc'
      ? <ChevronUp className="text-indigo-500" size={14} />
      : <ChevronDown className="text-indigo-500" size={14} />
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
        <p className="text-gray-400 text-lg">No products found</p>
        <p className="text-gray-300 text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Inventory products and stock levels</caption>
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {[
                { label: 'Product', field: 'name' },
                { label: 'SKU', field: 'sku' },
                { label: 'Category', field: 'category' },
                { label: 'Price', field: 'price' },
                { label: 'Quantity', field: 'quantity' },
                { label: 'Status', field: null },
                { label: 'Actions', field: null },
              ].map(({ label, field }) => (
                <th
                  key={label}
                  onClick={field ? () => toggleSort(field) : undefined}
                  aria-sort={!field ? undefined : sortField === field ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${field ? 'cursor-pointer hover:text-gray-700 select-none' : ''}`}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    {field && <SortIcon field={field} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{product.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{product.sku}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[product.category] || 'bg-gray-100 text-gray-600'}`}>
                    {product.category}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  ${product.price.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <QuantityEditor product={product} onChange={onQuantityChange} />
                </td>
                <td className="px-4 py-3">{getStockBadge(product.quantity)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onDelete(product.id, product.name)}
                    aria-label={`Delete product ${product.name}`}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete product"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
        Showing {products.length} product{products.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
