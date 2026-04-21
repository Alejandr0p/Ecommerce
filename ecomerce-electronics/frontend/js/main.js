// Archivo principal
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 TechStore inicializado');
    
    // Configurar botones
    setupButtons();
    
    // Verificar autenticación
    checkAuthOnLoad();
});

function setupButtons() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            document.getElementById('authModal').style.display = 'block';
            showLoginForm();
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            document.getElementById('authModal').style.display = 'block';
            showRegisterForm();
        });
    }
    
    // Cerrar modal al hacer clic fuera
    window.onclick = (event) => {
        const authModal = document.getElementById('authModal');
        const cartModal = document.getElementById('cartModal');
        
        if (event.target === authModal) {
            authModal.style.display = 'none';
        }
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
    };
}

function checkAuthOnLoad() {
    if (TokenManager.isAuthenticated()) {
        const user = TokenManager.getUser();
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.textContent = `👤 ${user.email.split('@')[0]}`;
    }
}