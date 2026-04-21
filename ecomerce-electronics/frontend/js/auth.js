// Sistema de Autenticación
class Auth {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }
    
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // Logout (si existe el botón)
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }
    
    checkAuthState() {
        if (TokenManager.isAuthenticated()) {
            this.updateUIForAuth();
        }
    }
    
    updateUIForAuth() {
        const user = TokenManager.getUser();
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        if (user) {
            // Usuario autenticado
            if (loginBtn) {
                loginBtn.style.display = 'none';
            }
            if (registerBtn) {
                registerBtn.textContent = `👤 ${user.email.split('@')[0]}`;
                registerBtn.onclick = () => this.showUserMenu();
            }
        } else {
            // Usuario no autenticado
            if (loginBtn) {
                loginBtn.style.display = 'block';
            }
            if (registerBtn) {
                registerBtn.textContent = 'Registrarse';
                registerBtn.onclick = () => {
                    document.getElementById('authModal').style.display = 'block';
                    showRegisterForm();
                };
            }
        }
    }
    
    showUserMenu() {
        const options = [
            { text: 'Mi Perfil', action: () => alert('Perfil de usuario') },
            { text: 'Mis Pedidos', action: () => alert('Historial de pedidos') },
            { text: 'Cerrar Sesión', action: () => this.logout() }
        ];
        
        const menu = document.createElement('div');
        menu.className = 'user-menu';
        menu.style.cssText = `
            position: absolute;
            background: white;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 10px 0;
            min-width: 150px;
            z-index: 1001;
        `;
        
        options.forEach(option => {
            const item = document.createElement('div');
            item.textContent = option.text;
            item.style.cssText = `
                padding: 10px 20px;
                cursor: pointer;
                transition: background-color 0.3s;
            `;
            item.onmouseover = () => item.style.backgroundColor = '#f5f5f5';
            item.onmouseout = () => item.style.backgroundColor = 'white';
            item.onclick = () => {
                option.action();
                menu.remove();
            };
            menu.appendChild(item);
        });
        
        // Posicionar el menú
        const registerBtn = document.getElementById('registerBtn');
        const rect = registerBtn.getBoundingClientRect();
        menu.style.top = rect.bottom + 'px';
        menu.style.left = rect.left + 'px';
        
        document.body.appendChild(menu);
        
        // Cerrar al hacer clic fuera
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        // Validación básica
        if (!email || !password) {
            errorDiv.textContent = 'Por favor, completa todos los campos';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Deshabilitar botón durante la petición
        submitBtn.disabled = true;
        submitBtn.textContent = 'Iniciando sesión...';
        
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Guardar token y datos del usuario
                TokenManager.setToken(data.token);
                TokenManager.setUser(data.user);
                
                // Cerrar modal
                this.closeModal();
                
                // Actualizar UI
                this.updateUIForAuth();
                
                // Mostrar mensaje de éxito
                this.showNotification('✅ ¡Bienvenido! Has iniciado sesión correctamente.', 'success');
                
                // Recargar productos si es necesario
                if (typeof loadProducts === 'function') {
                    loadProducts();
                }
            } else {
                // Mostrar error
                errorDiv.textContent = data.error || 'Error al iniciar sesión. Verifica tus credenciales.';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Error:', error);
            errorDiv.textContent = 'Error de conexión. Intenta nuevamente más tarde.';
            errorDiv.style.display = 'block';
        } finally {
            // Re-habilitar botón
            submitBtn.disabled = false;
            submitBtn.textContent = 'Iniciar Sesión';
        }
    }
    
    async handleRegister(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorDiv = document.getElementById('registerError');
        const successDiv = document.getElementById('registerSuccess');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        // Validaciones
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';
        
        if (!fullName || !email || !password || !confirmPassword) {
            errorDiv.textContent = 'Por favor, completa todos los campos';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (password !== confirmPassword) {
            errorDiv.textContent = 'Las contraseñas no coinciden';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (password.length < 6) {
            errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
            errorDiv.style.display = 'block';
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorDiv.textContent = 'Por favor, ingresa un email válido';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Deshabilitar botón durante la petición
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrando...';
        
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email, 
                    password,
                    full_name: fullName 
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Mostrar mensaje de éxito
                successDiv.innerHTML = `
                    <strong>✅ ¡Registro exitoso!</strong><br>
                    Hemos enviado un correo de verificación a <strong>${email}</strong>.<br>
                    Por favor, revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.
                `;
                successDiv.style.display = 'block';
                
                // Limpiar formulario
                e.target.reset();
                
                // Cerrar modal después de 5 segundos
                setTimeout(() => {
                    this.closeModal();
                    // Cambiar a formulario de login
                    setTimeout(() => showLoginForm(), 300);
                }, 5000);
            } else {
                errorDiv.textContent = data.error || 'Error en el registro. Intenta con otro email.';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Error:', error);
            errorDiv.textContent = 'Error de conexión. Intenta nuevamente más tarde.';
            errorDiv.style.display = 'block';
        } finally {
            // Re-habilitar botón
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrarse';
        }
    }
    
    logout() {
        if (confirm('¿Estás seguro de cerrar sesión?')) {
            TokenManager.removeToken();
            TokenManager.removeUser();
            CartManager.clearCart();
            
            this.showNotification('Has cerrado sesión correctamente', 'info');
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }
    
    closeModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s;
        `;
        
        document.body.appendChild(notification);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicializar autenticación cuando el DOM esté listo
let authInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!authInstance) {
        authInstance = new Auth();
        window.auth = authInstance;
    }
});

// Funciones globales para los botones del modal
window.showLoginForm = function() {
    document.getElementById('loginFormContainer').style.display = 'block';
    document.getElementById('registerFormContainer').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
};

window.showRegisterForm = function() {
    document.getElementById('loginFormContainer').style.display = 'none';
    document.getElementById('registerFormContainer').style.display = 'block';
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerSuccess').style.display = 'none';
};

window.closeAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.closeCartModal = function() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = 'none';
    }
};