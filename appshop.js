require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { swaggerUi, swaggerSpec } = require('./swagger');

const app = express();
const PORT = process.env.PORT || 4000;

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI не задано. Створи .env файл із тим самим MONGODB_URI, що й у admin-проєкті.');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB підключено (shop)'))
    .catch(err => {
        console.error('Помилка підключення до MongoDB:', err.message);
        process.exit(1);
    });

app.use(express.static(path.join(__dirname, 'public')));

const schemaOptions = {
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
        }
    }
};

const Product = mongoose.model('Product', new mongoose.Schema({
    name: { type: String, default: '' },
    price: { type: String, default: '' },
    description: { type: String, default: '' },
    photo: { type: String, default: '' },
    inStock: { type: Boolean, default: true }
}, schemaOptions));

const Partner = mongoose.model('Partner', new mongoose.Schema({
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    photo: { type: String, default: '' },
    status: { type: String, default: 'active' },
    expiryDate: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
}, schemaOptions));

const Order = mongoose.model('Order', new mongoose.Schema({
    customerName: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    items: { type: String, default: '' },
    total: { type: String, default: '' },
    status: { type: String, default: 'new' },
    date: { type: String, default: () => new Date().toISOString() }
}, schemaOptions));

const Email = mongoose.model('Email', new mongoose.Schema({
    email: { type: String, default: '' },
    date: { type: String, default: () => new Date().toISOString() }
}, schemaOptions));

const Feedback = mongoose.model('Feedback', new mongoose.Schema({
    name: { type: String, default: '' },
    rating: { type: String, default: '5' },
    text: { type: String, default: '' },
    date: { type: String, default: () => new Date().toISOString() },
    visible: { type: Boolean, default: true }
}, schemaOptions));

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Отримати список товарів для магазину
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Масив товарів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', async (req, res) => {
    try {
        const items = await Product.find().sort({ _id: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

/**
 * @swagger
 * /api/partners:
 *   get:
 *     summary: Отримати список активних партнерів
 *     tags: [Partners]
 *     responses:
 *       200:
 *         description: Масив партнерів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Partner'
 */
app.get('/api/partners', async (req, res) => {
    try {
        const items = await Partner.find().sort({ _id: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Оформити замовлення з кошика
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       200:
 *         description: Створене замовлення
 *       400:
 *         description: Некоректні дані
 */
app.post('/api/orders', async (req, res) => {
    try {
        const order = await Order.create(req.body);
        res.json(order);
    } catch (err) {
        res.status(400).json({ message: 'Некоректні дані' });
    }
});

/**
 * @swagger
 * /api/emails:
 *   post:
 *     summary: Підписатись на розсилку
 *     tags: [Emails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email збережено (або вже існує)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Email'
 *       400:
 *         description: Некоректний email
 */
app.post('/api/emails', async (req, res) => {
    try {
        const email = (req.body.email || '').trim();
        if (!email) return res.status(400).json({ message: 'Некоректний email' });

        const exists = await Email.findOne({ email });
        if (exists) return res.json(exists);

        const item = await Email.create({ email });
        res.json(item);
    } catch (err) {
        res.status(400).json({ message: 'Некоректні дані' });
    }
});

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     summary: Отримати список опублікованих відгуків
 *     tags: [Feedback]
 *     responses:
 *       200:
 *         description: Масив відгуків (тільки visible=true)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feedback'
 *   post:
 *     summary: Залишити відгук
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               rating:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Створений відгук
 *       400:
 *         description: Некоректні дані
 */
app.get('/api/feedback', async (req, res) => {
    try {
        const items = await Feedback.find({ visible: true }).sort({ _id: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

app.post('/api/feedback', async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const text = (req.body.text || '').trim();
        const rating = String(req.body.rating || '5');
        if (!text) return res.status(400).json({ message: 'Некоректні дані' });

        const item = await Feedback.create({ name, text, rating, visible: true });
        res.json(item);
    } catch (err) {
        res.status(400).json({ message: 'Некоректні дані' });
    }
});

app.listen(PORT, () => {
    console.log(`Shop server is running on http://localhost:${PORT}/`);
});