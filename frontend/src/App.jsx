import { useState, useEffect, useCallback, useRef } from 'react'
import { Package, Plus, Search, Filter, BarChart3, AlertTriangle, Sparkles } from 'lucide-react'
import ProductTable from './components/ProductTable'
import AddProductModal from './components/AddProductModal'
import StatsBar from './components/StatsBar'

const API = '/api'

export default function App() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [notification, setNotification] = useState(null)

  const showNotif = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchProducts = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (selectedCategory) params.set('category', selectedCategory)
    const res = await fetch(`${API}/products?${params}`)
    const data = await res.json()
    setProducts(data)
    setLoading(false)
  }, [search, selectedCategory])

  const fetchCategories = async () => {
    const res = await fetch(`${API}/categories`)
    const data = await res.json()
    setCategories(data)
  }

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAddProduct = async (product) => {
    const res = await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error)
    }
    await fetchProducts()
    await fetchCategories()
    setShowAddModal(false)
    showNotif(`"${product.name}" added successfully`)
  }

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const res = await fetch(`${API}/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
      showNotif(`"${name}" deleted`, 'info')
    }
  }

  const handleQuantityChange = async (id, quantity) => {
    const res = await fetch(`${API}/products/${id}/quantity`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })
    if (res.ok) {
      const updated = await res.json()
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    }
  }

  const confettiRef = useRef(null)

  const launchConfetti = () => {
    const canvas = confettiRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')
    const pieces = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 10 + 5,
      d: Math.random() * 150 + 50,
      color: `hsl(${Math.random() * 360},90%,60%)`,
      tilt: Math.random() * 10 - 5,
      tiltSpeed: (Math.random() * 0.1) + 0.05,
      angle: 0,
    }))
    let frame
    let startTime = null
    const duration = 3000
    const draw = (ts) => {
      if (!startTime) startTime = ts
      const elapsed = ts - startTime
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach((p) => {
        p.angle += p.tiltSpeed
        p.y += Math.cos(p.angle + p.d) + 2
        p.x += Math.sin(p.angle) * 1.5
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.r / 2, p.r, (p.tilt * Math.PI) / 180, 0, 2 * Math.PI)
        ctx.fillStyle = p.color
        ctx.fill()
        if (p.y > canvas.height) {
          p.y = -10
          p.x = Math.random() * canvas.width
        }
      })
      if (elapsed < duration) {
        frame = requestAnimationFrame(draw)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(draw)
  }

  const lowStockCount = products.filter((p) => p.quantity > 0 && p.quantity <= 10).length
  const outOfStockCount = products.filter((p) => p.quantity === 0).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confetti Canvas */}
      <canvas ref={confettiRef} className="fixed inset-0 pointer-events-none z-50" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Package className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Inventory Manager</h1>
                <p className="text-xs text-gray-500">T-Shirt Store</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={launchConfetti}
                title="Celebrate!"
                className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                <Sparkles size={18} />
                Celebrate!
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                <Plus size={18} />
                Add Product
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <StatsBar products={products} />

        {/* Alerts */}
        {(lowStockCount > 0 || outOfStockCount > 0) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {outOfStockCount > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                <AlertTriangle size={16} />
                {outOfStockCount} product{outOfStockCount > 1 ? 's' : ''} out of stock
              </div>
            )}
            {lowStockCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm">
                <AlertTriangle size={16} />
                {lowStockCount} product{lowStockCount > 1 ? 's' : ''} low on stock
              </div>
            )}
          </div>
        )}

        {/* Search & Filter */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products by name, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Table */}
        <div className="mt-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading products...</div>
          ) : (
            <ProductTable
              products={products}
              onDelete={handleDeleteProduct}
              onQuantityChange={handleQuantityChange}
            />
          )}
        </div>
      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddProduct}
          categories={categories}
        />
      )}

      {/* Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'info' ? 'bg-indigo-500' : 'bg-red-500'
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  )
}
