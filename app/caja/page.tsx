'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut, Banknote, Clock } from 'lucide-react'

interface PedidoItem {
  id: string
  cantidad: number
  precio_unitario: number
  productos: { nombre: string }
  pedido_item_adicionales: {
    cantidad: number
    precio_unitario: number
    adicionales: { nombre: string }
  }[]
}

interface Pedido {
  id: string
  mesa: string
  total: number
  estado: string
  created_at: string
  pedido_items: PedidoItem[]
}

export default function PantallaCaja() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
    }
    checkAuth()

    const cargarCaja = async () => {
      const { data } = await supabase
        .from('pedidos')
        .select(`
          *,
          pedido_items(
            id, cantidad, precio_unitario,
            productos(nombre),
            pedido_item_adicionales(
              cantidad, precio_unitario,
              adicionales(nombre)
            )
          )
        `)
        .eq('estado', 'pendiente_pago')
        .order('created_at', { ascending: true })

      if (data) setPedidos(data as unknown as Pedido[])
    }

    cargarCaja()

    const canal = supabase
      .channel('cambios-caja')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        cargarCaja()
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [router])

  const confirmarPago = async (id: string) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'pagado' })
      .eq('id', id)
    if (error) alert('Error al procesar el pago')
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-emerald-950 text-white p-6">
      <header className="flex justify-between items-center mb-8 border-b border-emerald-800 pb-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-4xl font-black flex items-center gap-3">
            <Banknote className="text-emerald-400" size={40} />
            CAJA
          </h1>
          <p className="text-emerald-400/60 text-sm font-bold uppercase tracking-widest">Control de Cobros</p>
        </div>
        <button
          onClick={cerrarSesion}
          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-5 py-3 rounded-2xl transition-all border border-red-500/20 font-bold"
        >
          <LogOut size={20} /> Salir
        </button>
      </header>

      <div className="grid gap-6 max-w-2xl mx-auto">
        {pedidos.map(p => (
          <div key={p.id} className="bg-white text-slate-900 p-6 rounded-3xl shadow-2xl border-b-8 border-emerald-600">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 text-slate-400 font-mono text-xs mb-1">
                  <Clock size={12} />
                  {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <h2 className="font-black text-2xl uppercase text-slate-800">{p.mesa}</h2>
              </div>
              <p className="text-3xl font-black text-emerald-600">
                ₡{p.total.toLocaleString()}
              </p>
            </div>

            {/* DETALLE DE ITEMS */}
            <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2">
              {p.pedido_items?.map(item => (
                <div key={item.id} className="text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">
                      x{item.cantidad} {item.productos?.nombre}
                    </span>
                    <span className="text-slate-500">₡{item.precio_unitario.toLocaleString()}</span>
                  </div>
                  {item.pedido_item_adicionales?.map((a, i) => (
                    <div key={i} className="flex justify-between pl-4 text-slate-400">
                      <span>+ {a.adicionales?.nombre}</span>
                      <span>₡{a.precio_unitario.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={() => confirmarPago(p.id)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95"
            >
              COBRAR ✅
            </button>
          </div>
        ))}

        {pedidos.length === 0 && (
          <div className="text-center py-20 bg-emerald-900/30 rounded-3xl border-2 border-dashed border-emerald-800">
            <p className="text-6xl mb-4">💳</p>
            <p className="text-xl font-bold opacity-40">No hay cobros pendientes</p>
            <p className="text-sm opacity-30 italic">Los nuevos pedidos aparecerán aquí automáticamente</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => router.push('/cocina')}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-full text-xs font-bold border border-slate-700 shadow-xl"
        >
          Ver Cocina 👨‍🍳
        </button>
      </div>
    </div>
  )
}