const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
require("dotenv").config();

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected to sales-analytics database");
};

const importData = async () => {
    try {
        await connectDB();

        // Read and parse JSON files
        const customers = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/customers.json")));
        const products = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/products.json")));
        const orders = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/orders.json")));

        // Insert customers and products first to get their ObjectIds
        const insertedCustomers = await Customer.insertMany(
            customers.map(({ _id, ...rest }) => ({
                ...rest,
                age: parseInt(rest.age)
            }))
        );
        
        const insertedProducts = await Product.insertMany(
            products.map(({ _id, ...rest }) => ({
                ...rest,
                price: parseFloat(rest.price)
            }))
        );

        // Create maps for UUID to ObjectId conversion
        const customerIdMap = new Map(customers.map((c, i) => [c._id, insertedCustomers[i]._id]));
        const productIdMap = new Map(products.map((p, i) => [p._id, insertedProducts[i]._id]));

        // Process orders
        const processedOrders = orders.map(order => {
            // Parse products string into array
            const productsArray = JSON.parse(order.products.replace(/'/g, '"'));
            
            return {
                customerId: customerIdMap.get(order.customerId),
                products: productsArray.map(p => ({
                    productId: productIdMap.get(p.productId),
                    quantity: parseInt(p.quantity),
                    priceAtPurchase: parseFloat(p.priceAtPurchase)
                })),
                totalAmount: parseFloat(order.totalAmount),
                orderDate: new Date(order.orderDate),
                status: order.status
            };
        });

        // Insert orders
        await Order.insertMany(processedOrders);

        console.log("Data imported successfully");
        process.exit();
    } catch (error) {
        console.error("Error importing data:", error);
        process.exit(1);
    }
};

importData();