class App {
  constructor() {
    this.currentUser = null;
    this.cart = []; // Array of { productId, quantity }
    this.products = [];
    this.orders = [];
    this.activeCategory = 'All';
    this.adminActiveTab = 'products';
    this.detailQty = 1;
  }

  async init() {
    // Load Cart from LocalStorage
    const savedCart = localStorage.getItem('cart');
    this.cart = savedCart ? JSON.parse(savedCart) : [];

    // Check Authentication
    if (API.getToken()) {
      try {
        this.currentUser = await API.getMe();
      } catch (err) {
        console.warn('Session expired or token invalid');
        this.currentUser = null;
      }
    } else {
      this.currentUser = API.getUser();
    }

    // Load initial products list
    try {
      this.products = await API.getProducts();
    } catch (err) {
      this.showToast('Could not load products. Please check server.', 'danger');
    }

    // Set up Hash Router
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Process current route
    this.handleRoute();
    
    // Initial cart drawer render
    this.renderCartDrawer();
  }

  // Routing Handler
  handleRoute() {
    const hash = window.location.hash || '#/';
    const path = hash.substring(1); // strip '#'
    
    // Reset view specific states
    this.detailQty = 1;

    // Navigation Active Link highlight helper
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('onclick');
      if (href && href.includes(path)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Match Routes
    if (path === '/' || path === '') {
      this.renderCatalog();
    } else if (path.startsWith('/product/')) {
      const id = path.substring(9);
      this.renderProductDetail(id);
    } else if (path === '/login') {
      if (this.currentUser) return this.navigate('/');
      this.renderLogin();
    } else if (path === '/register') {
      if (this.currentUser) return this.navigate('/');
      this.renderRegister();
    } else if (path === '/checkout') {
      if (this.cart.length === 0) {
        this.showToast('Your cart is empty', 'warning');
        return this.navigate('/');
      }
      this.renderCheckout();
    } else if (path === '/profile') {
      if (!this.currentUser) {
        this.showToast('Please login to view orders', 'warning');
        return this.navigate('/login');
      }
      this.renderProfile();
    } else if (path === '/admin') {
      if (!this.currentUser || this.currentUser.role !== 'admin') {
        this.showToast('Access denied: Admin privileges required', 'danger');
        return this.navigate('/');
      }
      this.renderAdmin();
    } else {
      // Fallback
      this.navigate('/');
    }
  }

  navigate(path) {
    window.location.hash = '#' + path;
  }

  // Update navbar layout
  updateNav() {
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    Views.updateHeader(this.currentUser, totalItems);
  }

  // VIEW RENDERS
  async renderCatalog() {
    this.updateNav();
    const appEl = document.getElementById('app');
    
    // Refresh products
    try {
      this.products = await API.getProducts();
    } catch(e) {}

    appEl.innerHTML = Views.catalog(this.products, this.activeCategory);
  }

  async renderProductDetail(id) {
    this.updateNav();
    const appEl = document.getElementById('app');
    
    try {
      const product = await API.getProduct(id);
      appEl.innerHTML = Views.productDetail(product, this.detailQty);
    } catch (err) {
      this.showToast('Product not found', 'danger');
      this.navigate('/');
    }
  }

  renderLogin() {
    this.updateNav();
    document.getElementById('app').innerHTML = Views.login();
  }

  renderRegister() {
    this.updateNav();
    document.getElementById('app').innerHTML = Views.register();
  }

  renderCheckout() {
    this.updateNav();
    document.getElementById('app').innerHTML = Views.checkout(this.cart, this.products);
  }

  async renderProfile() {
    this.updateNav();
    const appEl = document.getElementById('app');
    appEl.innerHTML = `<div class="view-fade" style="text-align:center; padding:48px;">Loading orders...</div>`;
    
    try {
      const orders = await API.getOrders();
      appEl.innerHTML = Views.profile(orders, this.currentUser);
    } catch (err) {
      this.showToast('Failed to load orders', 'danger');
      appEl.innerHTML = `<div style="text-align:center; padding:48px; color:var(--text-muted)">Could not load order history.</div>`;
    }
  }

  async renderAdmin() {
    this.updateNav();
    const appEl = document.getElementById('app');
    
    try {
      // Reload both products & orders
      this.products = await API.getProducts();
      this.orders = await API.getOrders();
      appEl.innerHTML = Views.admin(this.products, this.orders, this.adminActiveTab);
    } catch (err) {
      this.showToast('Error loading administration metrics', 'danger');
    }
  }

  // INTERACTIVE ACTION HANDLERS
  
  // Category Filtering
  filterCategory(category) {
    this.activeCategory = category;
    this.renderCatalog();
  }

  // Toast Notifications
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let emoji = '✨';
    if (type === 'danger') emoji = '❌';
    if (type === 'warning') emoji = '⚠️';
    if (type === 'success') emoji = '✅';

    toast.innerHTML = `
      <span>${emoji}</span>
      <div>${message}</div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse forwards';
      setTimeout(() => {
        if (toast.parentNode) {
          container.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // Cart Drawer actions
  toggleCartDrawer() {
    const overlay = document.getElementById('cart-drawer-overlay');
    const drawer = document.getElementById('cart-drawer');
    overlay.classList.toggle('active');
    drawer.classList.toggle('active');
  }

  closeCartDrawer() {
    document.getElementById('cart-drawer-overlay').classList.remove('active');
    document.getElementById('cart-drawer').classList.remove('active');
  }

  renderCartDrawer() {
    const listEl = document.getElementById('cart-items-list');
    const subtotalEl = document.getElementById('cart-subtotal');
    
    let total = 0;
    
    if (this.cart.length === 0) {
      listEl.innerHTML = `<div class="cart-empty-message">🛒 Your cart is empty. Add products from the catalog!</div>`;
      subtotalEl.innerText = '$0.00';
      this.updateNav();
      return;
    }

    const itemsHtml = this.cart.map(item => {
      const p = this.products.find(prod => prod.id === item.productId);
      if (!p) return '';
      
      const price = parseFloat(p.price);
      total += price * item.quantity;
      
      return `
        <div class="cart-item">
          <img class="cart-item-img" src="${p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}" alt="${p.name}">
          <div class="cart-item-info">
            <div class="cart-item-title">${p.name}</div>
            <div class="cart-item-price">$${price.toFixed(2)}</div>
            <div class="cart-item-controls">
              <button class="qty-btn" style="width:24px; height:24px; font-size:12px;" onclick="app.updateCartQty('${p.id}', -1)">-</button>
              <span class="cart-item-qty">${item.quantity}</span>
              <button class="qty-btn" style="width:24px; height:24px; font-size:12px;" onclick="app.updateCartQty('${p.id}', 1)" ${item.quantity >= p.stock ? 'disabled' : ''}>+</button>
            </div>
          </div>
          <button class="cart-item-remove" onclick="app.removeFromCart('${p.id}')">Remove</button>
        </div>
      `;
    }).join('');

    listEl.innerHTML = itemsHtml;
    subtotalEl.innerText = `$${total.toFixed(2)}`;
    this.updateNav();
  }

  // Cart operations
  addToCart(productId, quantity = 1) {
    const prod = this.products.find(p => p.id === productId);
    if (!prod) return;

    if (prod.stock <= 0) {
      this.showToast('Product is currently out of stock', 'warning');
      return;
    }

    const existingIndex = this.cart.findIndex(item => item.productId === productId);
    
    if (existingIndex > -1) {
      const currentQty = this.cart[existingIndex].quantity;
      if (currentQty + quantity > prod.stock) {
        this.showToast(`Cannot add more. Limit available: ${prod.stock}`, 'warning');
        return;
      }
      this.cart[existingIndex].quantity += quantity;
    } else {
      this.cart.push({ productId, quantity });
    }

    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.renderCartDrawer();
    this.showToast(`${prod.name} added to cart!`, 'success');
  }

  // Detail view Qty controls
  updateDetailQty(val) {
    this.detailQty += val;
    const qtyValEl = document.getElementById('detail-qty-val');
    if (qtyValEl) qtyValEl.innerText = this.detailQty;
    
    // Re-render detail view controls
    const path = window.location.hash.substring(1);
    if (path.startsWith('/product/')) {
      const id = path.substring(9);
      const prod = this.products.find(p => p.id === id);
      if (prod) {
        const minusBtn = document.querySelectorAll('.qty-btn')[0];
        const plusBtn = document.querySelectorAll('.qty-btn')[1];
        if (minusBtn) minusBtn.disabled = this.detailQty <= 1;
        if (plusBtn) plusBtn.disabled = this.detailQty >= prod.stock;
      }
    }
  }

  addDetailToCart(productId) {
    this.addToCart(productId, this.detailQty);
    this.detailQty = 1;
    const qtyValEl = document.getElementById('detail-qty-val');
    if (qtyValEl) qtyValEl.innerText = 1;
  }

  updateCartQty(productId, amount) {
    const index = this.cart.findIndex(item => item.productId === productId);
    if (index === -1) return;

    const prod = this.products.find(p => p.id === productId);
    if (!prod) return;

    const nextQty = this.cart[index].quantity + amount;
    if (nextQty <= 0) {
      this.removeFromCart(productId);
    } else if (nextQty > prod.stock) {
      this.showToast('Exceeds available stock limit', 'warning');
    } else {
      this.cart[index].quantity = nextQty;
      localStorage.setItem('cart', JSON.stringify(this.cart));
      this.renderCartDrawer();
    }
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.productId !== productId);
    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.renderCartDrawer();
    this.showToast('Item removed from cart', 'info');
  }

  checkoutCart() {
    this.closeCartDrawer();
    if (!this.currentUser) {
      this.showToast('Please sign in or register to place your order', 'warning');
      this.navigate('/login');
    } else {
      this.navigate('/checkout');
    }
  }

  // AUTH HANDLERS
  async handleLoginSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      this.currentUser = await API.login(email, password);
      this.showToast(`Welcome back, ${this.currentUser.name}!`, 'success');
      this.navigate('/');
    } catch (err) {
      this.showToast(err.message || 'Login failed', 'danger');
    }
  }

  async handleRegisterSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
      this.currentUser = await API.register(name, email, password);
      this.showToast(`Account created. Welcome, ${this.currentUser.name}!`, 'success');
      this.navigate('/');
    } catch (err) {
      this.showToast(err.message || 'Registration failed', 'danger');
    }
  }

  logout() {
    API.clearToken();
    this.currentUser = null;
    this.showToast('Logged out successfully', 'info');
    this.navigate('/');
  }

  // CHECKOUT FLOW
  async handleCheckoutSubmit(event) {
    event.preventDefault();
    const shippingAddress = document.getElementById('ship-address').value.trim();
    const contactPhone = document.getElementById('ship-phone').value.trim();

    try {
      const order = await API.createOrder({
        items: this.cart,
        shippingAddress,
        contactPhone,
      });

      this.showToast('Order placed successfully! Thank you.', 'success');
      
      // Clear Cart
      this.cart = [];
      localStorage.removeItem('cart');
      this.renderCartDrawer();
      
      // Navigate to order details / profile
      this.navigate('/profile');
    } catch (err) {
      this.showToast(err.message || 'Checkout failed', 'danger');
    }
  }

  // ADMIN OPERATIONS
  setAdminTab(tab) {
    this.adminActiveTab = tab;
    this.renderAdmin();
  }

  // Product Modals open/close
  openAddProductModal() {
    const overlay = document.getElementById('product-modal-overlay');
    document.getElementById('modal-title').innerText = 'Add New Product';
    document.getElementById('modal-submit-btn').innerText = 'Add Product';
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
    overlay.classList.add('active');
  }

  openEditProductModal(productId) {
    const p = this.products.find(prod => prod.id === productId);
    if (!p) return;

    const overlay = document.getElementById('product-modal-overlay');
    document.getElementById('modal-title').innerText = 'Edit Product';
    document.getElementById('modal-submit-btn').innerText = 'Save Changes';
    
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-desc').value = p.description;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-stock').value = p.stock;
    document.getElementById('prod-category').value = p.category;
    document.getElementById('prod-img').value = p.imageUrl || '';

    overlay.classList.add('active');
  }

  closeProductModal() {
    document.getElementById('product-modal-overlay').classList.remove('active');
  }

  async handleProductFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('prod-id').value;
    const data = {
      name: document.getElementById('prod-name').value.trim(),
      description: document.getElementById('prod-desc').value.trim(),
      price: parseFloat(document.getElementById('prod-price').value),
      stock: parseInt(document.getElementById('prod-stock').value, 10),
      category: document.getElementById('prod-category').value.trim(),
      imageUrl: document.getElementById('prod-img').value.trim() || null,
    };

    try {
      if (id) {
        // Edit product
        await API.updateProduct(id, data);
        this.showToast('Product updated successfully', 'success');
      } else {
        // Create product
        await API.createProduct(data);
        this.showToast('Product created successfully', 'success');
      }
      this.closeProductModal();
      this.renderAdmin();
    } catch (err) {
      this.showToast(err.message || 'Product save failed', 'danger');
    }
  }

  async handleDeleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    try {
      await API.deleteProduct(id);
      this.showToast('Product deleted', 'info');
      this.renderAdmin();
    } catch (err) {
      this.showToast(err.message || 'Deletion failed', 'danger');
    }
  }

  async handleUpdateOrderStatus(orderId, nextStatus) {
    try {
      await API.updateOrderStatus(orderId, nextStatus);
      this.showToast(`Order status updated to ${nextStatus}`, 'success');
      this.renderAdmin();
    } catch (err) {
      this.showToast(err.message || 'Status update failed', 'danger');
    }
  }
}

// Global instance
window.app = new App();
window.addEventListener('DOMContentLoaded', () => window.app.init());
