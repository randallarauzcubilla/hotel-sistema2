'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase' 
import { ShoppingCart, Utensils, Plus } from 'lucide-react'

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  emoji: string; // Aquí guardamos la URL de la foto
}

const PRODUCTOS: Producto[] = [
  { 
    id: 1, 
    nombre: "Hamb. Clásica", 
    precio: 8.50, 
    emoji: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80" 
  },
  { 
    id: 2, 
    nombre: "Papas Grandes", 
    precio: 3.00, 
    emoji: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=500&q=80" 
  },
  { 
    id: 3, 
    nombre: "Soda Gde", 
    precio: 2.00, 
    emoji: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80" 
  },
];

export default function ClienteMenu() {
  const [carrito, setCarrito] = useState<Producto[]>([]);
  const [enviando, setEnviando] = useState(false);

  const agregarAlCarrito = (p: Producto) => {
    setCarrito([...carrito, p]);
  };

  const enviarPedido = async () => {
    if (carrito.length === 0) return alert("Carrito vacío");
    setEnviando(true);

    const total = carrito.reduce((acc, p) => acc + p.precio, 0);

    const { error } = await supabase
      .from('pedidos')
      .insert([
        { 
          cliente: "Mesa 1", 
          items: carrito, 
          total: total,
          estado: 'pendiente_pago' // EL FLUJO EMPIEZA AQUÍ
        }
      ]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("¡Pedido enviado! Por favor, acércate a caja para pagar. 🚀");
      setCarrito([]);
    }
    setEnviando(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-32 text-black">
      <header className="flex justify-between items-center mb-8 pt-4">
        <h1 className="text-3xl font-black flex items-center gap-2 text-slate-800">
          <Utensils className="text-orange-500" size={32} /> BurgerHub
        </h1>
        <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
          Mesa 01
        </div>
      </header>

      <div className="grid gap-6">
        {PRODUCTOS.map((p) => (
          <div key={p.id} className="bg-white p-3 rounded-2xl shadow-md flex justify-between items-center border border-gray-100 group transition-all">
            <div className="flex items-center gap-4">
              {/* FOTO REAL EN LUGAR DE EMOJI */}
              <img 
                src={p.emoji} 
                alt={p.nombre} 
                className="w-20 h-20 object-cover rounded-xl shadow-inner"
              />
              <div>
                <h3 className="font-bold text-lg text-slate-800">{p.nombre}</h3>
                <p className="text-orange-500 font-black text-xl">${p.precio.toFixed(2)}</p>
              </div>
            </div>
            <button 
              onClick={() => agregarAlCarrito(p)}
              className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-orange-200 active:scale-90 transition-all"
            >
              <Plus size={24} />
            </button>
          </div>
        ))}
      </div>

      {/* FOOTER DEL CARRITO */}
      <div className="fixed bottom-6 left-4 right-4 p-5 bg-white rounded-3xl border shadow-2xl flex justify-between items-center z-50">
        <div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tu Orden ({carrito.length})</p>
          <p className="text-2xl font-black text-slate-900">
            Total: ${carrito.reduce((acc, p) => acc + p.precio, 0).toFixed(2)}
          </p>
        </div>
        <button 
          onClick={enviarPedido}
          disabled={enviando || carrito.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-black flex gap-3 items-center disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-xl shadow-green-100"
        >
          <ShoppingCart size={24} />
          {enviando ? "..." : "PEDIR"}
        </button>
      </div>
    </div>
  )
}