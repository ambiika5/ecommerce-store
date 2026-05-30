const bcrypt = require('bcryptjs');
const sequelize = require('./db');
const { User, Product } = require('./models');

const seedDatabase = async () => {
  try {
    console.log('Synchronizing database...');
    await sequelize.sync({ force: true });
    console.log('Database synced. Seeding tables...');

    // Seed Users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);

    await User.bulkCreate([
      {
        name: 'Shop Admin',
        email: 'admin@shop.com',
        password: adminPassword,
        role: 'admin',
      },
      {
        name: 'John Doe',
        email: 'user@shop.com',
        password: userPassword,
        role: 'user',
      },
    ]);
    console.log('Seeded Users:');
    console.log('  - Admin: admin@shop.com / admin123');
    console.log('  - User: user@shop.com / user123');

    // Seed Products
    await Product.bulkCreate([
      {
        name: 'Quantum X1 Laptop',
        description: 'Next-generation laptop with 32GB RAM, 1TB NVMe SSD, and high-performance dedicated graphics. Perfect for creators, developers, and gamers alike.',
        price: 1299.99,
        imageUrl: 'https://images.unsplash.com/photo-1496181130204-7552cc1454e4?w=500&auto=format&fit=crop&q=60',
        stock: 15,
        category: 'Electronics',
      },
      {
        name: 'AeroPhone Ultra',
        description: 'Vibrant 6.7-inch OLED screen, 120Hz refresh rate, 5G enabled, with a revolutionary triple-lens 108MP camera system.',
        price: 899.99,
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60',
        stock: 25,
        category: 'Electronics',
      },
      {
        name: 'StudioPro ANC Headphones',
        description: 'Industry-leading Active Noise Cancelling over-ear headphones with high-fidelity acoustics and 40-hour battery life.',
        price: 299.99,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
        stock: 40,
        category: 'Audio',
      },
      {
        name: 'Chronos Smart Watch S5',
        description: 'Stay connected and track your health. Featuring continuous heart rate monitoring, sleep tracking, GPS, and cellular compatibility.',
        price: 249.99,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
        stock: 30,
        category: 'Accessories',
      },
      {
        name: 'KeyCraft Mechanical Keyboard',
        description: 'Hot-swappable mechanical switches, premium aluminum construction, programmable RGB backlighting, and dual-mode wireless connectivity.',
        price: 149.99,
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60',
        stock: 50,
        category: 'Accessories',
      },
      {
        name: 'GlidePro Ergonomic Mouse',
        description: 'Precision tracking sensor, ergonomic vertical layout to reduce strain, and customizable gesture buttons with seamless device switching.',
        price: 79.99,
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60',
        stock: 60,
        category: 'Accessories',
      },
    ]);
    console.log('Seeded sample products successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
