const Views = {
  // Navigation / Header update helpers
  updateHeader: (user, cartCount) => {
    const navActions = document.getElementById('nav-actions');
    const badge = document.querySelector('.cart-badge');
    if (badge) badge.innerText = cartCount;

    if (user) {
      const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U';
      navActions.innerHTML = `
        <button class="cart-icon-btn" onclick="app.toggleCartDrawer()">
          🛒<span class="cart-badge">${cartCount}</span>
        </button>
        ${user.role === 'admin' ? '<span class="nav-link" onclick="app.navigate(\'/admin\')">Dashboard</span>' : ''}
        <span class="nav-link" onclick="app.navigate(\'/profile\')">My Orders</span>
        <div class="user-menu">
          <div class="avatar" title="${user.name} (${user.role})">${firstLetter}</div>
          <button class="btn btn-outline btn-sm" onclick="app.logout()">Logout</button>
        </div>
      `;
    } else {
      navActions.innerHTML = `
        <button class="cart-icon-btn" onclick="app.toggleCartDrawer()">
          🛒<span class="cart-badge">${cartCount}</span>
        </button>
        <button class="btn btn-outline btn-sm" onclick="app.navigate(\'/login\')">Login</button>
        <button class="btn btn-primary btn-sm" onclick="app.navigate(\'/register\')">Register</button>
      `;
    }
  },

  // 1. Product Catalog View
  catalog: (products, activeCategory = 'All') => {
    // Unique categories
    const categories = ['All', ...new Set(products.map(p => p.category))];
    const filteredProducts = activeCategory === 'All' 
      ? products 
      : products.filter(p => p.category === activeCategory);

    const categoryTabsHtml = categories.map(cat => `
      <div class="category-tab ${cat === activeCategory ? 'active' : ''}" 
           onclick="app.filterCategory('${cat}')">${cat}</div>
    `).join('');

    const productCardsHtml = filteredProducts.map(p => {
      const isOutOfStock = p.stock <= 0;
      return `
        <div class="glass-card product-card">
          <div class="product-img-wrapper" onclick="app.navigate('/product/${p.id}')" style="cursor: pointer;">
            <img class="product-img" src="${p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}" alt="${p.name}">
            <span class="product-badge">${p.category}</span>
          </div>
          <div class="product-info">
            <h3 class="product-title" onclick="app.navigate('/product/${p.id}')" style="cursor: pointer;">${p.name}</h3>
            <p class="product-desc">${p.description}</p>
            <div class="product-meta">
              <span class="product-price">$${parseFloat(p.price).toFixed(2)}</span>
              ${isOutOfStock 
                ? '<button class="btn btn-outline btn-sm" disabled>Out of Stock</button>' 
                : `<button class="btn btn-primary btn-sm" onclick="app.addToCart('${p.id}')">Add to Cart</button>`
              }
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="view-fade">
        <section class="hero">
          <h1>Discover Your <span>Future Tech</span> Today</h1>
          <p>Explore our highly curated collection of next-gen gadgets, premium audio gear, and sleek office accessories engineered for performance.</p>
        </section>
        
        <section class="catalog-section">
          <div class="catalog-header">
            <div class="categories">
              ${categoryTabsHtml}
            </div>
          </div>
          
          <div class="product-grid">
            ${productCardsHtml.length > 0 ? productCardsHtml : '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No products found in this category.</p>'}
          </div>
        </section>
      </div>
    `;
  },

  // 2. Product Detail View
  productDetail: (product, qty = 1) => {
    const isOutOfStock = product.stock <= 0;
    const isLowStock = product.stock > 0 && product.stock <= 5;
    let stockLabel = `<span class="stock-status stock-ok">In Stock (${product.stock} available)</span>`;
    if (isOutOfStock) {
      stockLabel = `<span class="stock-status stock-out">Out of Stock</span>`;
    } else if (isLowStock) {
      stockLabel = `<span class="stock-status stock-low">Only ${product.stock} Left!</span>`;
    }

    return `
      <div class="view-fade">
        <button class="btn btn-outline btn-sm" style="margin-bottom: 24px;" onclick="app.navigate('/')">← Back to Catalog</button>
        <div class="glass-card product-detail-wrapper">
          <div class="detail-img-wrapper">
            <img class="detail-img" src="${product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}" alt="${product.name}">
          </div>
          <div class="detail-info">
            <span class="detail-category">${product.category}</span>
            <h2 class="detail-title">${product.name}</h2>
            <div class="detail-price">$${parseFloat(product.price).toFixed(2)}</div>
            <p class="detail-desc">${product.description}</p>
            
            <div class="detail-actions">
              <div>
                <span style="font-weight:600; font-size:14px; color:var(--text-muted);">Availability:</span> ${stockLabel}
              </div>
              
              ${!isOutOfStock ? `
                <div class="detail-qty">
                  <span style="font-weight:600; font-size:14px; color:var(--text-muted); margin-right:12px;">Quantity:</span>
                  <button class="qty-btn" onclick="app.updateDetailQty(-1)" ${qty <= 1 ? 'disabled' : ''}>-</button>
                  <span class="qty-val" id="detail-qty-val">${qty}</span>
                  <button class="qty-btn" onclick="app.updateDetailQty(1)" ${qty >= product.stock ? 'disabled' : ''}>+</button>
                </div>
                <button class="btn btn-primary" style="margin-top: 16px;" onclick="app.addDetailToCart('${product.id}')">
                  🛒 Add to Cart
                </button>
              ` : `
                <button class="btn btn-outline" style="margin-top: 16px;" disabled>Sold Out</button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 3. Login View
  login: () => {
    return `
      <div class="view-fade">
        <div class="glass-card form-wrapper">
          <div class="form-header">
            <h2>Welcome Back</h2>
            <p style="color: var(--text-muted)">Sign in to access orders, track shipping, and place orders.</p>
          </div>
          <form id="login-form" onsubmit="app.handleLoginSubmit(event)">
            <div class="form-group">
              <label for="email">EMAIL ADDRESS</label>
              <input type="email" id="email" class="form-input" placeholder="user@shop.com" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="password">PASSWORD</label>
              <input type="password" id="password" class="form-input" placeholder="••••••••" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 12px;">Sign In</button>
          </form>
          <div class="form-footer">
            Don't have an account? <a href="#" onclick="event.preventDefault(); app.navigate('/register')">Create Account</a>
          </div>
          <div style="margin-top: 24px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); font-size:12px; text-align:center; color: var(--text-muted)">
            <strong>Quick Demo Accounts:</strong><br>
            User: <code>user@shop.com</code> / <code>user123</code><br>
            Admin: <code>admin@shop.com</code> / <code>admin123</code>
          </div>
        </div>
      </div>
    `;
  },

  // 4. Register View
  register: () => {
    return `
      <div class="view-fade">
        <div class="glass-card form-wrapper">
          <div class="form-header">
            <h2>Create Account</h2>
            <p style="color: var(--text-muted)">Join to explore exclusive deals and start ordering.</p>
          </div>
          <form id="register-form" onsubmit="app.handleRegisterSubmit(event)">
            <div class="form-group">
              <label for="reg-name">FULL NAME</label>
              <input type="text" id="reg-name" class="form-input" placeholder="John Doe" required autocomplete="name">
            </div>
            <div class="form-group">
              <label for="reg-email">EMAIL ADDRESS</label>
              <input type="email" id="reg-email" class="form-input" placeholder="john@example.com" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="reg-password">PASSWORD</label>
              <input type="password" id="reg-password" class="form-input" placeholder="••••••••" required autocomplete="new-password">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 12px;">Sign Up</button>
          </form>
          <div class="form-footer">
            Already have an account? <a href="#" onclick="event.preventDefault(); app.navigate('/login')">Log In</a>
          </div>
        </div>
      </div>
    `;
  },

  // 5. Checkout View
  checkout: (cartItems, products) => {
    let subtotal = 0;
    const checkoutItemsHtml = cartItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) return '';
      const totalItemPrice = parseFloat(prod.price) * item.quantity;
      subtotal += totalItemPrice;
      return `
        <div class="checkout-summary-item">
          <span>${prod.name} (x${item.quantity})</span>
          <span>$${totalItemPrice.toFixed(2)}</span>
        </div>
      `;
    }).join('');

    const shipping = subtotal > 150 ? 0 : 15;
    const finalTotal = subtotal + shipping;

    return `
      <div class="view-fade">
        <h2 style="font-size:32px; margin-bottom:32px;">Secure Checkout</h2>
        <div class="checkout-grid">
          <!-- Col 1: Details -->
          <div class="glass-card">
            <h3 style="font-size:20px; border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:20px;">Shipping Details</h3>
            <form id="checkout-form" onsubmit="app.handleCheckoutSubmit(event)">
              <div class="form-group">
                <label for="ship-address">SHIPPING ADDRESS</label>
                <input type="text" id="ship-address" class="form-input" placeholder="123 Cyberpunk Ave, City, Country" required>
              </div>
              <div class="form-group">
                <label for="ship-phone">CONTACT PHONE NUMBER</label>
                <input type="tel" id="ship-phone" class="form-input" placeholder="+1 (555) 019-2834" required>
              </div>
              <button type="submit" class="btn btn-accent" style="width: 100%; justify-content: center; margin-top: 24px;">Place Order ($${finalTotal.toFixed(2)})</button>
            </form>
          </div>
          
          <!-- Col 2: Summary -->
          <div class="glass-card" style="height: fit-content;">
            <h3 style="font-size:20px; border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:20px;">Order Summary</h3>
            <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
              ${checkoutItemsHtml}
            </div>
            <div style="border-top:1px solid var(--border-color); padding-top:16px; display:flex; flex-direction:column; gap:8px;">
              <div class="checkout-summary-item" style="color:var(--text-muted)">
                <span>Subtotal</span>
                <span>$${subtotal.toFixed(2)}</span>
              </div>
              <div class="checkout-summary-item" style="color:var(--text-muted)">
                <span>Shipping</span>
                <span>${shipping === 0 ? '<span style="color:var(--success)">FREE</span>' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div class="checkout-summary-item" style="font-size:18px; font-weight:700; border-top:1px solid var(--border-color); padding-top:12px; margin-top:8px;">
                <span>Total</span>
                <span>$${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 6. User Profile / Order History View
  profile: (orders, user) => {
    const ordersHtml = orders.map(order => {
      const orderDate = new Date(order.createdAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      
      const itemsHtml = order.items.map(item => `
        <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text-muted); margin-bottom:4px;">
          <span>${item.product ? item.product.name : 'Unknown Product'} (x${item.quantity})</span>
          <span>$${(parseFloat(item.priceAtPurchase) * item.quantity).toFixed(2)}</span>
        </div>
      `).join('');

      return `
        <div class="order-history-item">
          <div class="order-header-row">
            <div>
              <span style="font-weight:700; color:#fff;">Order ID:</span> 
              <span style="font-family:monospace; font-size:12px; color:var(--text-muted)">${order.id}</span>
              <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Placed on ${orderDate}</div>
            </div>
            <span class="status-pill status-${order.status}">${order.status}</span>
          </div>
          <div>
            <h4 style="font-size:14px; margin-bottom:8px;">Items Ordered</h4>
            <div style="border-bottom:1px solid var(--border-color); padding-bottom:8px; margin-bottom:8px;">
              ${itemsHtml}
            </div>
            <div class="order-details-grid">
              <div>
                <strong>Shipping Address:</strong><br>
                ${order.shippingAddress}
              </div>
              <div style="text-align: right;">
                <strong>Contact Phone:</strong><br>
                ${order.contactPhone}
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:700; margin-top:12px; border-top:1px dashed var(--border-color); padding-top:12px;">
              <span>Total Amount Paid</span>
              <span>$${parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="view-fade">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;">
          <div>
            <h2 style="font-size:32px;">Order History</h2>
            <p style="color:var(--text-muted)">Logged in as <strong>${user.name}</strong> (${user.email})</p>
          </div>
        </div>
        
        <div class="order-history-list">
          ${orders.length > 0 ? ordersHtml : '<p style="text-align:center; padding:48px; border:1px dashed var(--border-color); border-radius:var(--radius-sm); color:var(--text-muted)">You have not placed any orders yet.</p>'}
        </div>
      </div>
    `;
  },

  // 7. Admin Dashboard View
  admin: (products, orders, activeTab = 'products') => {
    const productsRowsHtml = products.map(p => `
      <tr>
        <td style="font-weight:600;">${p.name}</td>
        <td>${p.category}</td>
        <td>$${parseFloat(p.price).toFixed(2)}</td>
        <td>
          <span style="font-weight:600; color: ${p.stock <= 0 ? 'var(--danger)' : p.stock <= 5 ? 'var(--warning)' : 'var(--success)'}">
            ${p.stock}
          </span>
        </td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="app.openEditProductModal('${p.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="app.handleDeleteProduct('${p.id}')">Delete</button>
        </td>
      </tr>
    `).join('');

    const ordersRowsHtml = orders.map(o => {
      const date = new Date(o.createdAt).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      
      const itemsList = o.items.map(item => `${item.product ? item.product.name : 'Product'}(x${item.quantity})`).join(', ');

      return `
        <tr>
          <td><span style="font-family:monospace; font-size:11px;">${o.id.substring(0,8)}...</span></td>
          <td>
            <strong>${o.user ? o.user.name : 'Unknown'}</strong><br>
            <span style="font-size:12px; color:var(--text-muted)">${o.user ? o.user.email : ''}</span>
          </td>
          <td>${date}</td>
          <td>
            <div style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${itemsList}">
              ${itemsList}
            </div>
          </td>
          <td>$${parseFloat(o.totalAmount).toFixed(2)}</td>
          <td>
            <select class="form-input" style="padding: 4px 8px; font-size:12px; width:130px; background:var(--bg-secondary); border-color:var(--border-color);" 
                    onchange="app.handleUpdateOrderStatus('${o.id}', this.value)">
              <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="paid" ${o.status === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
              <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="view-fade admin-section">
        <div class="admin-header">
          <h2>Admin Dashboard</h2>
          <div class="admin-tabs">
            <button class="admin-tab ${activeTab === 'products' ? 'active' : ''}" onclick="app.setAdminTab('products')">Products</button>
            <button class="admin-tab ${activeTab === 'orders' ? 'active' : ''}" onclick="app.setAdminTab('orders')">Orders</button>
          </div>
          ${activeTab === 'products' ? '<button class="btn btn-primary btn-sm" onclick="app.openAddProductModal()">+ Add Product</button>' : '<div></div>'}
        </div>
        
        <div class="table-wrapper glass-card">
          ${activeTab === 'products' ? `
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${productsRowsHtml.length > 0 ? productsRowsHtml : '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No products found.</td></tr>'}
              </tbody>
            </table>
          ` : `
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${ordersRowsHtml.length > 0 ? ordersRowsHtml : '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No orders found.</td></tr>'}
              </tbody>
            </table>
          `}
        </div>
        
        <!-- Add/Edit Product Modal Mount point inside overlay -->
        <div class="modal-overlay" id="product-modal-overlay" onclick="if(event.target === this) app.closeProductModal()">
          <div class="modal-container">
            <div class="modal-header">
              <h3 id="modal-title">Add New Product</h3>
              <button class="modal-close" onclick="app.closeProductModal()">×</button>
            </div>
            <form id="product-form" onsubmit="app.handleProductFormSubmit(event)">
              <input type="hidden" id="prod-id">
              <div class="form-group">
                <label for="prod-name">PRODUCT NAME</label>
                <input type="text" id="prod-name" class="form-input" required>
              </div>
              <div class="form-group">
                <label for="prod-desc">DESCRIPTION</label>
                <textarea id="prod-desc" class="form-input" style="min-height: 80px; font-family:inherit; resize:vertical;" required></textarea>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div class="form-group">
                  <label for="prod-price">PRICE ($)</label>
                  <input type="number" step="0.01" min="0" id="prod-price" class="form-input" required>
                </div>
                <div class="form-group">
                  <label for="prod-stock">STOCK</label>
                  <input type="number" min="0" id="prod-stock" class="form-input" required>
                </div>
              </div>
              <div class="form-group">
                <label for="prod-category">CATEGORY</label>
                <input type="text" id="prod-category" class="form-input" placeholder="Electronics, Audio, Accessories..." required>
              </div>
              <div class="form-group">
                <label for="prod-img">IMAGE URL (UNSPLASH OR CDN)</label>
                <input type="url" id="prod-img" class="form-input" placeholder="https://images.unsplash.com/photo-...">
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-outline" onclick="app.closeProductModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" id="modal-submit-btn">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }
};
window.Views = Views;
