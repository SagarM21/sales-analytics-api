const Customer = require('../models/customer.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const resolvers = {
    Query: {
        getCustomerSpending: async (_, { customerId }) => {
            try {
                // First check if customer exists
                const customer = await Customer.findById(customerId);
                if (!customer) {
                    console.log('Customer not found:', customerId);
                    return { customerId, totalSpent: 0, averageOrderValue: 0, lastOrderDate: null };
                }

                // Get all orders for the customer
                const result = await Order.aggregate([
                    { 
                        $match: { 
                            customerId: new mongoose.Types.ObjectId(customerId)
                        } 
                    },
                    { 
                        $group: {
                            _id: "$customerId",
                            totalSpent: { $sum: "$totalAmount" },
                            averageOrderValue: { $avg: "$totalAmount" },
                            lastOrderDate: { $max: "$orderDate" },
                            orderCount: { $sum: 1 }
                        }
                    }
                ]);

                console.log('Aggregation result:', result);

                if (!result || result.length === 0) {
                    console.log('No orders found for customer:', customerId);
                    return { customerId, totalSpent: 0, averageOrderValue: 0, lastOrderDate: null };
                }

                return {
                    customerId,
                    totalSpent: result[0].totalSpent,
                    averageOrderValue: result[0].averageOrderValue,
                    lastOrderDate: result[0].lastOrderDate
                };
            } catch (error) {
                console.error('Error in getCustomerSpending:', error);
                return { customerId, totalSpent: 0, averageOrderValue: 0, lastOrderDate: null };
            }
        },
        getTopSellingProducts: async (_, { limit }) => {
            return await Order.aggregate([
                { $unwind: "$products" },
                { $group: {
                    _id: "$products.productId",
                    totalSold: { $sum: "$products.quantity" }
                }},
                { $sort: { totalSold: -1 } },
                { $limit: limit },
                { $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }},
                { $unwind: "$product" },
                { $project: { productId: "$_id", name: "$product.name", totalSold: 1 } }
            ]);
        },
        getSalesAnalytics: async (_, { startDate, endDate }) => {
            const result = await Order.aggregate([
                { 
                    $match: { 
                        orderDate: { 
                            $gte: new Date(startDate), 
                            $lte: new Date(endDate) 
                        }
                    } 
                },
                { $unwind: "$products" },
                { $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productInfo"
                }},
                { $unwind: "$productInfo" },
                { $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    completedOrders: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                    categories: { 
                        $push: {
                            category: "$productInfo.category",
                            revenue: { $multiply: ["$products.quantity", "$products.priceAtPurchase"] }
                        }
                    }
                }},
                { $unwind: "$categories" },
                { $group: {
                    _id: "$categories.category",
                    revenue: { $sum: "$categories.revenue" }
                }},
                { $project: { category: "$_id", revenue: 1 } }
            ]);

            const analytics = {
                totalRevenue: result.reduce((sum, cat) => sum + cat.revenue, 0),
                completedOrders: result.length,
                categoryBreakdown: result
            };

            return analytics;
        },
        getCustomerOrders: async (_, { customerId, page = 1, pageSize = 10 }) => {
            try {
                const skip = (page - 1) * pageSize;
                
               
                const totalCount = await Order.countDocuments({ customerId: new mongoose.Types.ObjectId(customerId) });
                
               
                const orders = await Order.find({ customerId: new mongoose.Types.ObjectId(customerId) })
                    .sort({ orderDate: -1 })
                    .skip(skip)
                    .limit(pageSize);

                return {
                    orders,
                    totalCount,
                    page,
                    pageSize,
                    totalPages: Math.ceil(totalCount / pageSize)
                };
            } catch (error) {
                console.error('Error in getCustomerOrders:', error);
                throw new Error('Failed to fetch customer orders');
            }
        },
        getProducts: async (_, { page = 1, pageSize = 10, filter = {}, sortBy = "name", sortOrder = "asc" }) => {
            try {
                const skip = (page - 1) * pageSize;
                let query = {};

                
                if (filter) {
                    if (filter.category) {
                        query.category = filter.category;
                    }
                    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
                        query.price = {};
                        if (filter.minPrice !== undefined) {
                            query.price.$gte = filter.minPrice;
                        }
                        if (filter.maxPrice !== undefined) {
                            query.price.$lte = filter.maxPrice;
                        }
                    }
                    if (filter.inStock !== undefined) {
                        query.stock = filter.inStock ? { $gt: 0 } : 0;
                    }
                    if (filter.search) {
                        query.$or = [
                            { name: { $regex: filter.search, $options: 'i' } },
                            { category: { $regex: filter.search, $options: 'i' } }
                        ];
                    }
                }

                
                const totalCount = await Product.countDocuments(query);

               
                const categories = await Product.distinct('category');

                
                const sort = {};
                sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
                
                const products = await Product.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(pageSize);

                return {
                    products,
                    totalCount,
                    page,
                    pageSize,
                    totalPages: Math.ceil(totalCount / pageSize),
                    categories
                };
            } catch (error) {
                console.error('Error in getProducts:', error);
                throw new Error('Failed to fetch products');
            }
        }
    },
    Mutation: {
        placeOrder: async (_, { input }) => {
            try {
                const { customerId, products } = input;

               
                const customer = await Customer.findById(customerId);
                if (!customer) {
                    return {
                        success: false,
                        message: 'Customer not found',
                        order: null
                    };
                }

                
                let totalAmount = 0;
                const orderProducts = [];

                for (const item of products) {
                    const product = await Product.findById(item.productId);
                    if (!product) {
                        return {
                            success: false,
                            message: `Product with ID ${item.productId} not found`,
                            order: null
                        };
                    }

                    if (product.stock < item.quantity) {
                        return {
                            success: false,
                            message: `Insufficient stock for product ${product.name}`,
                            order: null
                        };
                    }

                   
                    product.stock -= item.quantity;
                    await product.save();

                    const itemTotal = product.price * item.quantity;
                    totalAmount += itemTotal;

                    orderProducts.push({
                        productId: product._id,
                        quantity: item.quantity,
                        priceAtPurchase: product.price
                    });
                }

               
                const order = new Order({
                    customerId: new mongoose.Types.ObjectId(customerId),
                    products: orderProducts,
                    totalAmount,
                    orderDate: new Date(),
                    status: 'completed'
                });

                await order.save();

                return {
                    success: true,
                    message: 'Order placed successfully',
                    order
                };
            } catch (error) {
                console.error('Error in placeOrder:', error);
                return {
                    success: false,
                    message: 'Failed to place order',
                    order: null
                };
            }
        }
    }
};
module.exports = resolvers;