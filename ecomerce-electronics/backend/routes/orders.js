const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

// Crear orden
router.post('/create', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Obtener items del carrito
        const cartResult = await client.query(
            `SELECT c.*, p.price, p.name, p.stock
             FROM cart_items c
             JOIN products p ON c.product_id = p.id
             WHERE c.user_id = $1`,
            [req.user.id]
        );
        
        const cartItems = cartResult.rows;
        
        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }
        
        // Verificar stock
        for (const item of cartItems) {
            if (item.stock < item.quantity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    error: `Stock insuficiente para: ${item.name}` 
                });
            }
        }
        
        // Calcular total
        const total = cartItems.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);
        
        // Crear orden
        const orderNumber = `ORD-${Date.now()}-${req.user.id}`;
        const orderResult = await client.query(
            `INSERT INTO orders (user_id, order_number, total_amount, status)
             VALUES ($1, $2, $3, 'pending')
             RETURNING id`,
            [req.user.id, orderNumber, total]
        );
        
        const orderId = orderResult.rows[0].id;
        
        // Insertar items de la orden
        for (const item of cartItems) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [orderId, item.product_id, item.name, item.quantity, item.price, item.price * item.quantity]
            );
            
            // Actualizar stock
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }
        
        // Limpiar carrito
        await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
        
        await client.query('COMMIT');
        
        res.json({
            message: 'Orden creada exitosamente',
            order: {
                id: orderId,
                order_number: orderNumber,
                total: total,
                items: cartItems.length
            }
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creando orden:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
});

// Obtener órdenes del usuario
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.*, 
                    (SELECT json_agg(json_build_object(
                        'name', oi.product_name,
                        'quantity', oi.quantity,
                        'price', oi.unit_price,
                        'subtotal', oi.subtotal
                    )) FROM order_items oi WHERE oi.order_id = o.id) as items
             FROM orders o
             WHERE o.user_id = $1
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo órdenes:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;