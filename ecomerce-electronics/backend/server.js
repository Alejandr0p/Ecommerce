const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: '✅ API de TechStore funcionando',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            cart: '/api/cart',
            orders: '/api/orders'
        }
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('=================================');
    console.log(`🚀 Servidor corriendo en:`);
    console.log(`   http://localhost:${PORT}`);
    console.log('=================================');
    console.log('📋 Endpoints disponibles:');
    console.log(`   POST   /api/auth/register     - Registro de usuario`);
    console.log(`   POST   /api/auth/login        - Inicio de sesión`);
    console.log(`   GET    /api/auth/verify/:token - Verificar email`);
    console.log(`   GET    /api/products          - Listar productos`);
    console.log(`   GET    /api/products/:id      - Obtener producto`);
    console.log(`   GET    /api/cart              - Ver carrito`);
    console.log(`   POST   /api/cart/add          - Agregar al carrito`);
    console.log(`   DELETE /api/cart/remove/:id   - Eliminar del carrito`);
    console.log(`   POST   /api/orders/create     - Crear orden`);
    console.log('=================================');
});