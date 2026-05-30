const API_BASE = '/api';

const API = {
  // Token/User Management
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  clearToken: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),

  // Helper for requests
  request: async (endpoint, options = {}) => {
    const token = API.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error.message);
      throw error;
    }
  },

  // Auth APIs
  login: async (email, password) => {
    const data = await API.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    API.setToken(data.token);
    API.setUser(data.user);
    return data.user;
  },

  register: async (name, email, password) => {
    const data = await API.request('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    API.setToken(data.token);
    API.setUser(data.user);
    return data.user;
  },

  getMe: async () => {
    try {
      const user = await API.request('/auth/me');
      API.setUser(user);
      return user;
    } catch (error) {
      API.clearToken();
      throw error;
    }
  },

  // Product APIs
  getProducts: () => API.request('/products'),
  getProduct: (id) => API.request(`/products/${id}`),
  createProduct: (data) => API.request('/products', { method: 'POST', body: data }),
  updateProduct: (id, data) => API.request(`/products/${id}`, { method: 'PUT', body: data }),
  deleteProduct: (id) => API.request(`/products/${id}`, { method: 'DELETE' }),

  // Order APIs
  createOrder: (data) => API.request('/orders', { method: 'POST', body: data }),
  getOrders: () => API.request('/orders'),
  getOrder: (id) => API.request(`/orders/${id}`),
  updateOrderStatus: (id, status) => API.request(`/orders/${id}/status`, { method: 'PUT', body: { status } }),
};
