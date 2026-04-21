// Funciones del carrito
function showCart() {
    const modal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    const cart = CartManager.getCart();
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">🛒 Tu carrito está vacío</div>';
        cartTotal.innerHTML = '';
    } else {
        cartItems.innerHTML = cart.map(item => createCartItemHTML(item)).join('');
        cartTotal.innerHTML = `
            <h3>Total: $${CartManager.getTotal().toFixed(2)}</h3>
        `;
    }
    
    modal.style.display = 'block';
}

function createCartItemHTML(item) {
    return `
        <div class="cart-item">
            <img src="${item.image_url || 'https://via.placeholder.com/80'}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-price">$${item.price}</p>
            </div>
            <div class="cart-item-controls">
                <button onclick="updateCartItemQuantity(${item.id}, ${item.quantity - 1})">-</button>
                <span class="cart-item-quantity">${item.quantity}</span>
                <button onclick="updateCartItemQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Eliminar</button>
        </div>
    `;
}

function updateCartItemQuantity(productId, newQuantity) {
    CartManager.updateQuantity(productId, newQuantity);
    showCart(); // Recargar el carrito
}

function removeFromCart(productId) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        CartManager.removeItem(productId);
        showCart();
    }
}

function checkout() {
    if (!TokenManager.isAuthenticated()) {
        alert('Debes iniciar sesión para realizar la compra');
        document.getElementById('authModal').style.display = 'block';
        return;
    }
    
    const cart = CartManager.getCart();
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    // Proceder al pago
    alert('🛍️ Procesando pago... (Funcionalidad en desarrollo)');
    // Aquí iría la lógica de checkout
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', showCart);
    }
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
    
    // Actualizar contador del carrito
    CartManager.updateCartCount();
});