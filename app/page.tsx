'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, Utensils, Plus, X } from 'lucide-react'

interface Adicional {
  id: string
  nombre: string
  precio: number
}

interface Producto {
  id: string
  nombre: string
  precio: number
  categoria_id: string
}

interface Categoria {
  id: string
  nombre: string
  orden: number
  tiene_adicionales: boolean
  productos: Producto[]
  adicionales: Adicional[]
}

interface ItemCarrito {
  producto: Producto
  cantidad: number
  adicionales: Adicional[]
}

export default function MenuPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mesa] = useState('Mesa 1')
  const [productoSeleccionado, setProductoSeleccionado] = useState<{producto: Producto, adicionales: Adicional[]} | null>(null)
  const [adicionalesSeleccionados, setAdicionalesSeleccionados] = useState<Adicional[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarMenu()
  }, [])

  const cargarMenu = async () => {
    const { data: cats } = await supabase
      .from('categorias')
      .select('*')
      .order('orden')

    if (!cats) return

    const { data: prods } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)

    const { data: catAdic } = await supabase
      .from('categoria_adicionales')
      .select('categoria_id, adicionales(id, nombre, precio)')

    const menu: Categoria[] = cats.map(cat => {
      const adicsCat = (catAdic || [])
        .filter(ca => ca.categoria_id === cat.id)
        .map(ca => ca.adicionales as unknown as Adicional)
        .filter(Boolean)

      return {
        ...cat,
        productos: (prods || []).filter(p => p.categoria_id === cat.id),
        adicionales: adicsCat
      }
    }).filter(cat => cat.productos.length > 0)

    setCategorias(menu)
    setLoading(false)
  }

  const abrirProducto = (producto: Producto, adicionales: Adicional[]) => {
    if (adicionales.length > 0) {
      setProductoSeleccionado({ producto, adicionales })
      setAdicionalesSeleccionados([])
    } else {
      agregarAlCarrito(producto, [])
    }
  }

  const agregarAlCarrito = (producto: Producto, adicionales: Adicional[]) => {
    setCarrito(prev => [...prev, { producto, cantidad: 1, adicionales }])
    setProductoSeleccionado(null)
    setAdicionalesSeleccionados([])
  }

  const toggleAdicional = (adicional: Adicional) => {
    setAdicionalesSeleccionados(prev =>
      prev.find(a => a.id === adicional.id)
        ? prev.filter(a => a.id !== adicional.id)
        : [...prev, adicional]
    )
  }

  const quitarDelCarrito = (index: number) => {
    setCarrito(prev => prev.filter((_, i) => i !== index))
  }

  const totalCarrito = carrito.reduce((acc, item) => {
    const precioAdic = item.adicionales.reduce((a, ad) => a + ad.precio, 0)
    return acc + item.producto.precio + precioAdic
  }, 0)

  const enviarPedido = async () => {
    if (carrito.length === 0) return
    setEnviando(true)

    const { data: pedido, error: errorPedido } = await supabase
      .from('pedidos')
      .insert([{ mesa, estado: 'pendiente_pago', total: totalCarrito }])
      .select()
      .single()

    if (errorPedido || !pedido) {
      alert('Error al enviar pedido')
      setEnviando(false)
      return
    }

    for (const item of carrito) {
      const { data: pedidoItem } = await supabase
        .from('pedido_items')
        .insert([{
          pedido_id: pedido.id,
          producto_id: item.producto.id,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio
        }])
        .select()
        .single()

      if (pedidoItem && item.adicionales.length > 0) {
        await supabase.from('pedido_item_adicionales').insert(
          item.adicionales.map(a => ({
            pedido_item_id: pedidoItem.id,
            adicional_id: a.id,
            cantidad: 1,
            precio_unitario: a.precio
          }))
        )
      }
    }

    alert('¡Pedido enviado! Acércate a caja para pagar. 🚀')
    setCarrito([])
    setCarritoAbierto(false)
    setEnviando(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-lg animate-pulse">Cargando menú...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-32 text-black">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-black flex items-center gap-2 text-slate-800">
          <Utensils className="text-orange-500" size={26} />
          Restaurante
        </h1>
        <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
          {mesa}
        </div>
      </header>

      {/* MENÚ POR CATEGORÍAS */}
      <div className="px-4 py-6 space-y-8">
        {categorias.map(cat => (
          <div key={cat.id}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px bg-orange-200 flex-1" />
              <h2 className="text-sm font-black uppercase tracking-widest text-orange-500">
                {cat.nombre}
              </h2>
              <div className="h-px bg-orange-200 flex-1" />
            </div>

            <div className="space-y-2">
              {cat.productos.map(p => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl px-4 py-3 flex justify-between items-center shadow-sm border border-gray-100"
                >
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{p.nombre}</p>
                    <p className="text-orange-500 font-black">
                      ₡{p.precio.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => abrirProducto(p, cat.adicionales)}
                    className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-xl active:scale-90 transition-all shadow-md"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL ADICIONALES */}
      {productoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-lg text-slate-800">{productoSeleccionado.producto.nombre}</h3>
                <p className="text-orange-500 font-bold">₡{productoSeleccionado.producto.precio.toLocaleString()}</p>
              </div>
              <button onClick={() => setProductoSeleccionado(null)}>
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Adicionales (opcional)</p>

            <div className="space-y-2 mb-6">
              {productoSeleccionado.adicionales.map(a => (
                <div
                  key={a.id}
                  onClick={() => toggleAdicional(a)}
                  className={`flex justify-between items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    adicionalesSeleccionados.find(s => s.id === a.id)
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <span className="text-sm font-medium text-slate-700">{a.nombre}</span>
                  <span className="text-orange-500 font-bold text-sm">+₡{a.precio.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => agregarAlCarrito(productoSeleccionado.producto, adicionalesSeleccionados)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-lg transition-all"
            >
              Agregar al pedido ✅
            </button>
          </div>
        </div>
      )}

      {/* MODAL CARRITO */}
      {carritoAbierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-slate-800">Tu Pedido</h3>
              <button onClick={() => setCarritoAbierto(false)}>
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {carrito.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-800">{item.producto.nombre}</p>
                      {item.adicionales.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1">
                          + {item.adicionales.map(a => a.nombre).join(', ')}
                        </p>
                      )}
                      <p className="text-orange-500 font-bold text-sm mt-1">
                        ₡{(item.producto.precio + item.adicionales.reduce((a, ad) => a + ad.precio, 0)).toLocaleString()}
                      </p>
                    </div>
                    <button onClick={() => quitarDelCarrito(i)} className="text-red-400 hover:text-red-600 ml-2">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-800">Total</span>
                <span className="font-black text-2xl text-orange-500">₡{totalCarrito.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={enviarPedido}
              disabled={enviando}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-lg transition-all disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'ENVIAR PEDIDO 🚀'}
            </button>
          </div>
        </div>
      )}

      {/* FOOTER CARRITO */}
      <div className="fixed bottom-4 left-4 right-4 z-40">
        <button
          onClick={() => setCarritoAbierto(true)}
          disabled={carrito.length === 0}
          className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex justify-between items-center shadow-2xl disabled:opacity-40 transition-all"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart size={22} />
            <span>{carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}</span>
          </div>
          <span className="text-orange-400 text-lg">₡{totalCarrito.toLocaleString()}</span>
        </button>
      </div>
    </div>
  )
}