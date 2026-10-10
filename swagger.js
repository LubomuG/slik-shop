const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Slick Shop API',
        version: '1.0.0',
        description: 'Документація публічного API магазину Slick'
    },
    servers: [
        {
            url: 'http://localhost:4000',
            description: 'Development server',
        },
    ],
    components: {
        schemas: {
            Product: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    price: { type: 'string' },
                    description: { type: 'string' },
                    photo: { type: 'string' },
                    inStock: { type: 'boolean' }
                }
            },
            Partner: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    photo: { type: 'string' },
                    status: { type: 'string', enum: ['active', 'inactive'] },
                    expiryDate: { type: 'string', format: 'date-time', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            Order: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    customerName: { type: 'string' },
                    phone: { type: 'string' },
                    address: { type: 'string' },
                    items: { type: 'string' },
                    total: { type: 'string' },
                    status: { type: 'string' },
                    date: { type: 'string' }
                }
            },
            Email: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    date: { type: 'string' }
                }
            },
            Feedback: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    rating: { type: 'string' },
                    text: { type: 'string' },
                    date: { type: 'string' },
                    visible: { type: 'boolean' }
                }
            }
        }
    }
};

const options = {
    swaggerDefinition,
    apis: ['./appshop.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };