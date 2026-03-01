'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase' 
import { ShoppingCart, Utensils } from 'lucide-react'

// 1. Definimos qué es un Producto para que TypeScript no llore
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  emoji: string;
}

const PRODUCTOS: Producto[] = [
  { id: 1, nombre: "Hamb. Clásica", precio: 8.50, emoji: "🍔" },
  { id: 2, nombre: "Papas Grandes", precio: 3.00, emoji: "🍟" },
  { id: 3, nombre: "Soda Gde", precio: 2.00, emoji: "🥤" },
];

export default function ClienteMenu() {
  // 2. Le decimos al estado que guardará una lista de Productos
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
          estado: 'pendiente_pago' 
        }
      ]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("¡Pedido enviado con éxito! 🚀");
      setCarrito([]);
    }
    setEnviando(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 text-black">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Utensils className="text-orange-500" /> BurgerHub
        </h1>
      </header>

      <div className="grid gap-4">
        {PRODUCTOS.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border">
            <div>
              <span className="text-2xl">{p.emoji}</span>
              <h3 className="font-semibold">{p.nombre}</h3>
              <p className="text-gray-500">${p.precio.toFixed(2)}</p>
            </div>
            <button 
              onClick={() => agregarAlCarrito(p)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Items: {carrito.length}</p>
          <p className="text-xl font-bold">Total: ${carrito.reduce((acc, p) => acc + p.precio, 0).toFixed(2)}</p>
        </div>
        <button 
          onClick={enviarPedido}
          disabled={enviando}
          className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex gap-2 items-center disabled:bg-gray-400"
        >
          <ShoppingCart size={20} />
          {enviando ? "Enviando..." : "PEDIR YA"}
        </button>
      </div>
    </div>
  )
}