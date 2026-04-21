const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendVerificationEmail = async (email, token, name = 'Usuario') => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email.html?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: '🔐 Verifica tu cuenta - TechStore',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px; }
                    .button { 
                        display: inline-block; 
                        padding: 12px 24px; 
                        background-color: #4CAF50; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        margin: 20px 0;
                    }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🛒 TechStore</h1>
                        <p>Tu tienda de electrónicos de confianza</p>
                    </div>
                    <div class="content">
                        <h2>¡Hola ${name}!</h2>
                        <p>Gracias por registrarte en TechStore. Para completar tu registro y comenzar a comprar, por favor verifica tu dirección de correo electrónico.</p>
                        
                        <center>
                            <a href="${verificationUrl}" class="button">Verificar mi cuenta</a>
                        </center>
                        
                        <p>O copia y pega este enlace en tu navegador:</p>
                        <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                        
                        <p><strong>Importante:</strong> Este enlace expirará en 24 horas.</p>
                        
                        <p>Si no creaste una cuenta en TechStore, puedes ignorar este correo.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 TechStore. Todos los derechos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email de verificación enviado a ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        return false;
    }
};

module.exports = { sendVerificationEmail };