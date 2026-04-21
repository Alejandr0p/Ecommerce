const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { sendVerificationEmail } = require('../config/email');

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name } = req.body;

        // Validaciones
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Verificar si el usuario ya existe
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = uuidv4();
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Crear usuario
        const result = await pool.query(
            `INSERT INTO users (email, password, full_name, verification_token, verification_token_expires)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, full_name, verified`,
            [email, hashedPassword, full_name || email.split('@')[0], verificationToken, tokenExpires]
        );

        const user = result.rows[0];

        // Enviar email de verificación
        await sendVerificationEmail(email, verificationToken, user.full_name);

        res.status(201).json({
            message: 'Usuario registrado exitosamente. Por favor verifica tu email.',
            user: { id: user.id, email: user.email }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Verificar email
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const result = await pool.query(
            `UPDATE users 
             SET verified = TRUE, verification_token = NULL, verification_token_expires = NULL
             WHERE verification_token = $1 AND verification_token_expires > NOW()
             RETURNING id, email, verified`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }

        res.json({ 
            message: 'Email verificado exitosamente',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error en verificación:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validaciones
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Buscar usuario
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar si el email está verificado
        if (!user.verified) {
            return res.status(401).json({ 
                error: 'Por favor verifica tu email antes de iniciar sesión' 
            });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // ✅ RESPUESTA CON EL CAMPO 'verified' INCLUIDO
        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                verified: user.verified   // ← ESTA LÍNEA ES LA CLAVE
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Obtener perfil del usuario (NUEVO ENDPOINT)
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const result = await pool.query(
            'SELECT id, email, full_name, verified, created_at FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Actualizar perfil
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { full_name } = req.body;

        const result = await pool.query(
            `UPDATE users SET full_name = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, email, full_name, verified`,
            [full_name, decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Cambiar contraseña
router.post('/change-password', async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { currentPassword, newPassword } = req.body;

        // Obtener usuario con contraseña
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [decoded.id]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar contraseña actual
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña
        await pool.query(
            'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
            [hashedPassword, decoded.id]
        );

        res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;