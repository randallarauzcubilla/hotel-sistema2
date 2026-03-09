'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface PedidoItem {
  id: string
  cantidad: number
  productos: { nombre: string }
  pedido_item_adicionales: {
    cantidad: number
    adicionales: { nombre: string }
  }[]
}

interface Pedido {
  id: string
  mesa: string
  created_at: string
  estado: string
  pedido_items: PedidoItem[]
}

export default function PantallaCocina() {
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

    const cargarPedidos = async () => {
      const { data } = await supabase
        .from('pedidos')
        .select(`
          *,
          pedido_items(
            id, cantidad,
            productos(nombre),
            pedido_item_adicionales(
              cantidad,
              adicionales(nombre)
            )
          )
        `)
        .eq('estado', 'pagado')
        .order('created_at', { ascending: true })

      if (data) setPedidos(data as unknown as Pedido[])
    }

    cargarPedidos()

    const canal = supabase
      .channel('cambios-cocina')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => cargarPedidos()
      )
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [router])

  const terminarPedido = async (id: string) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'listo' })
      .eq('id', id)
    if (error) console.error('Error:', error.message)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-3xl font-black flex gap-3 items-center">
            👨‍🍳 COCINA
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ordenes por preparar</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-orange-500/10 px-4 py-2 rounded-full text-xs font-bold text-orange-500 border border-orange-500/20 animate-pulse">
            MODO RECEPTOR ACTIVO
          </span>
          <button
            onClick={cerrarSesion}
            className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold border border-red-500/20 transition-all"
          >
            Salir 🚪
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pedidos.map((p) => (
          <div key={p.id} className="bg-slate-800 border-t-8 border-orange-600 p-6 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] text-slate-500 font-mono leading-none mb-1 uppercase tracking-tighter">
                  Ticket: {p.id.slice(0, 8)}
                </p>
                <h2 className="text-2xl font-black text-white uppercase">{p.mesa}</h2>
              </div>
              <span className="text-[10px] bg-slate-700 px-2 py-1 rounded font-bold text-slate-300">
                {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-4 mb-6 border border-slate-700">
              <ul className="space-y-3">
                {p.pedido_items?.map((item) => (
                  <li key={item.id}>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-white">{item.productos?.nombre}</span>
                      <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-md font-black">
                        X{item.cantidad}
                      </span>
                    </div>
                    {item.pedido_item_adicionales?.map((a, i) => (
                      <p key={i} className="text-xs text-slate-400 pl-2 mt-1">
                        + {a.adicionales?.nombre}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => terminarPedido(p.id)}
              className="w-full bg-orange-600 hover:bg-orange-500 active:scale-95 text-white py-4 rounded-xl font-black text-lg transition-all"
            >
              ORDEN LISTA ✅
            </button>
          </div>
        ))}
      </div>

      {pedidos.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-40 opacity-20">
          <div className="text-8xl mb-4 text-slate-500">🍽️</div>
          <p className="text-2xl font-black">SIN PEDIDOS PENDIENTES</p>
          <p className="text-sm italic">Los pedidos pagados en Caja aparecerán aquí.</p>
        </div>
      )}
    </div>
  )
}