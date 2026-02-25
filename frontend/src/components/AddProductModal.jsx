import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const PREDEFINED_CATEGORIES = [
  "Men's", "Women's", "Kids'", 'Unisex', 'Accessories',
]

export default function AddProductModal({ onClose, onAdd, categories }) {
  const allCategories = [...new Set([...PREDEFINED_CATEGORIES, ...categories])].sort()
  const dialogRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '0',
    sku: '',
    description: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.category || !form.price || !form.sku.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    if (parseFloat(form.price) <= 0) {
      setError('Price must be greater than 0.')
      return
    }
    setLoading(true)
    try {
      await onAdd({
        name: form.name.trim(),
        category: form.category,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity) || 0,
        sku: form.sku.trim().toUpperCase(),
        description: form.description.trim(),
      })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-product-title"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 id="add-product-title" className="text-lg font-bold text-gray-900">Add New Product</h2>
          <button onClick={onClose} aria-label="Close add product dialog" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label htmlFor="product-name" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Product Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="product-name"
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Wireless Mouse"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="product-sku" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                SKU <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="product-sku"
                type="text"
                value={form.sku}
                onChange={set('sku')}
                placeholder="e.g. WM-0001"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
              />
            </div>

            <div>
              <label htmlFor="product-category" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Category <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <select
                id="product-category"
                value={form.category}
                onChange={set('category')}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">Select category</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="product-price" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Price ($) <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="product-price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={set('price')}
                placeholder="0.00"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="product-quantity" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Initial Quantity
              </label>
              <input
                id="product-quantity"
                type="number"
                min="0"
                value={form.quantity}
                onChange={set('quantity')}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="product-description" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Description
              </label>
              <textarea
                id="product-description"
                value={form.description}
                onChange={set('description')}
                placeholder="Brief product description..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
