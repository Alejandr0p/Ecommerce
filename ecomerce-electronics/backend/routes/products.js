const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM products WHERE is_active = true AND stock > 0`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener un producto por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM products WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;