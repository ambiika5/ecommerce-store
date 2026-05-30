const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

// @route   GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({ order: [['createdAt', 'DESC']] });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// @route   GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// @route   POST /api/products (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, imageUrl, stock, category } = req.body;

    if (!name || !description || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Please provide name, description, price, and stock' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      imageUrl,
      stock,
      category: category || 'General',
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// @route   PUT /api/products/:id (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, imageUrl, stock, category } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update({
      name: name !== undefined ? name : product.name,
      description: description !== undefined ? description : product.description,
      price: price !== undefined ? price : product.price,
      imageUrl: imageUrl !== undefined ? imageUrl : product.imageUrl,
      stock: stock !== undefined ? stock : product.stock,
      category: category !== undefined ? category : product.category,
    });

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// @route   DELETE /api/products/:id (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.destroy();
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

module.exports = router;
