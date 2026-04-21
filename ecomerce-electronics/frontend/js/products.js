// Cargar productos desde el backend
async function loadProducts() {
    const productsContainer = document.getElementById('products');
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/products`);
        const products = await response.json();
        
        if (products.length === 0) {
            productsContainer.innerHTML = '<div class="loading">No hay productos disponibles</div>';
            return;
        }
        
        displayProducts(products);
    } catch (error) {
        console.error('Error cargando productos:', error);
        productsContainer.innerHTML = '<div class="loading">Error al cargar productos</div>';
    }
}

function displayProducts(products) {
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsContainer.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <img src="${product.image_url || 'https://via.placeholder.com/300'}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p class="description">${product.description || 'Sin descripción'}</p>
        <p class="price">$${product.price}</p>
        <p class="stock">Stock: ${product.stock} unidades</p>
        <button onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
            ${product.stock === 0 ? 'Agotado' : '🛒 Agregar al carrito'}
        </button>
    `;
    
    return card;
}

function addToCart(productId) {
    // Obtener información del producto
    fetch(`${CONFIG.API_URL}/products/${productId}`)
        .then(res => res.json())
        .then(product => {
            CartManager.addItem(product);
            alert(`✅ ${product.name} agregado al carrito`);
            CartManager.updateCartCount();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al agregar al carrito');
        });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});