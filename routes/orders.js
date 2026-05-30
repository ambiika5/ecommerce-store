const express = require('express');
const router = express.Router();
const sequelize = require('../db');
const { Order, OrderItem, Product, User } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

// @route   POST /api/orders
// @desc    Create a new order (checkout)
router.post('/', authenticate, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { items, shippingAddress, contactPhone } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cart items are required to place an order' });
    }
    if (!shippingAddress || !contactPhone) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Shipping address and contact phone are required' });
    }

    let totalAmount = 0;
    const orderItemsData = [];

    // Verify stock and calculate prices
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }

      // Decrement stock
      await product.update({ stock: product.stock - item.quantity }, { transaction });

      // Add to total
      const price = parseFloat(product.price);
      totalAmount += price * item.quantity;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtPurchase: price,
      });
    }

    // Create Order
    const order = await Order.create({
      userId: req.user.id,
      totalAmount,
      shippingAddress,
      contactPhone,
      status: 'pending',
    }, { transaction });

    // Create Order Items
    for (const itemData of orderItemsData) {
      await OrderItem.create({
        orderId: order.id,
        ...itemData,
      }, { transaction });
    }

    await transaction.commit();

    // Fetch the complete order with items & products
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
      ],
    });

    return res.status(201).json(completeOrder);
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
});

// @route   GET /api/orders
// @desc    Get order history (Users get their own orders, Admin gets all)
router.get('/', authenticate, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await Order.findAll({
        include: [
          { model: User, as: 'user', attributes: ['name', 'email'] },
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product', attributes: ['name', 'imageUrl'] }],
          },
        ],
        order: [['createdAt', 'DESC']],
      });
    } else {
      orders = await Order.findAll({
        where: { userId: req.user.id },
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product', attributes: ['name', 'imageUrl'] }],
          },
        ],
        order: [['createdAt', 'DESC']],
      });
    }
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving orders', error: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order detail by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['name', 'email'] },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization check
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving order detail', error: error.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.update({ status });
    return res.json({ message: `Order status updated to ${status}`, order });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

module.exports = router;
