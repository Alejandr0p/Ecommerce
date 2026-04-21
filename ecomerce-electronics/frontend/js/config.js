// Configuración global
const CONFIG = {
    API_URL: 'http://localhost:3000/api',
    FRONTEND_URL: 'http://localhost:5500'
};

// Manejo de tokens
const TokenManager = {
    setToken(token) {
        localStorage.setItem('authToken', token);
    },
    
    getToken() {
        return localStorage.getItem('authToken');
    },
    
    removeToken() {
        localStorage.removeItem('authToken');
    },
    
    isAuthenticated() {
        return !!this.getToken();
    },
    
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },
    
    removeUser() {
        localStorage.removeItem('user');
    }
};

// Manejo del carrito
const CartManager = {
    getCart() {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    },
    
    setCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartCount();
    },
    
    addItem(product, quantity = 1) {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                quantity: quantity
            });
        }
        
        this.setCart(cart);
        return cart;
    },
    
    removeItem(productId) {
        const cart = this.getCart().filter(item => item.id !== productId);
        this.setCart(cart);
        return cart;
    },
    
    updateQuantity(productId, quantity) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            item.quantity = quantity;
            if (item.quantity <= 0) {
                return this.removeItem(productId);
            }
        }
        
        this.setCart(cart);
        return cart;
    },
    
    getTotal() {
        return this.getCart().reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    },
    
    getCount() {
        return this.getCart().reduce((count, item) => {
            return count + item.quantity;
        }, 0);
    },
    
    updateCartCount() {
        const count = this.getCount();
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.textContent = `🛒 Carrito (${count})`;
        }
    },
    
    clearCart() {
        this.setCart([]);
    }
};