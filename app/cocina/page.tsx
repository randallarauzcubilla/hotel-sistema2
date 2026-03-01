'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// 1. Estructura de los datos
interface Pedido {
  id: string;
  created_at: string;
  cliente: string;
  items: { nombre: string; precio: number }[]; 
  total: number;
  estado: string;
}

export default function PantallaCocina() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])

  useEffect(() => {
    // 2. Función para cargar pedidos que ya fueron PAGADOS en caja
    const cargarPedidos = async () => {
      const { data } = await supabase
        .from('pedidos')
        .select('*')
        .eq('estado', 'pagado') // Filtro clave: Solo lo que caja ya cobró
        .order('created_at', { ascending: true }) 
      
      if (data) setPedidos(data as Pedido[])
    }

    cargarPedidos()

    // 3. Suscripción en Tiempo Real para recibir pedidos nuevos apenas se paguen
    const canal = supabase
      .channel('cambios-cocina')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'pedidos' }, 
          () => cargarPedidos()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [])

  // 4. Función para marcar como terminado y que salga de la pantalla
  const terminarPedido = async (id: string) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'listo' })
      .eq('id', id)
    
    if (error) console.error("Error:", error.message)
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
        <span className="bg-orange-500/10 px-4 py-2 rounded-full text-xs font-bold text-orange-500 border border-orange-500/20 animate-pulse">
          MODO RECEPTOR ACTIVO
        </span>
      </header>

      {/* Grid de Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pedidos.map((p) => (
          <div key={p.id} className="bg-slate-800 border-t-8 border-orange-600 p-6 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] text-slate-500 font-mono leading-none mb-1 uppercase tracking-tighter">Ticket: {p.id.slice(0, 8)}</p>
                <h2 className="text-2xl font-black text-white uppercase">{p.cliente}</h2>
              </div>
              <span className="text-[10px] bg-slate-700 px-2 py-1 rounded font-bold text-slate-300">
                {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <div className="bg-slate-900/80 rounded-xl p-4 mb-6 border border-slate-700">
              <ul className="space-y-4">
                {p.items?.map((item, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span className="text-xl font-medium">{item.nombre}</span>
                    <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-md font-black">X1</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => terminarPedido(p.id)}
              className="w-full bg-orange-600 hover:bg-orange-500 active:scale-95 text-white py-4 rounded-xl font-black text-lg transition-all shadow-lg shadow-orange-950/20"
            >
              ORDEN LISTA ✅
            </button>
          </div>
        ))}
      </div>
      
      {/* Estado vacío */}
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