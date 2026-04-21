const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

// Obtener carrito del usuario
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*, p.name, p.price, p.image_url, p.stock
             FROM cart_items c
             JOIN products p ON c.product_id = p.id
             WHERE c.user_id = $1`,
            [req.user.id]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo carrito:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Agregar item al carrito
router.post('/add', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        
        // Verificar stock
        const productResult = await pool.query(
            'SELECT stock FROM products WHERE id = $1',
            [productId]
        );
        
        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const product = productResult.rows[0];
        
        if (product.stock < quantity) {
            return res.status(400).json({ error: 'Stock insuficiente' });
        }
        
        // Verificar si ya existe en el carrito
        const existingItem = await pool.query(
            'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [req.user.id, productId]
        );
        
        if (existingItem.rows.length > 0) {
            // Actualizar cantidad
            await pool.query(
                'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
                [quantity, req.user.id, productId]
            );
        } else {
            // Insertar nuevo item
            await pool.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
                [req.user.id, productId, quantity]
            );
        }
        
        res.json({ message: 'Producto agregado al carrito' });
        
    } catch (error) {
        console.error('Error agregando al carrito:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Eliminar item del carrito
router.delete('/remove/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        
        res.json({ message: 'Producto eliminado del carrito' });
    } catch (error) {
        console.error('Error eliminando del carrito:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;