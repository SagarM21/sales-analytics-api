const Customer = require('../models/customer.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const resolvers = {
    Query: {
        getCustomerSpending: async (_, { customerId }) => {
            const result = await Order.aggregate([
                { $match: { customerId: new mongoose.Types.ObjectId(customerId), status: 'completed' } },
                { $group: {
                    _id: "$customerId",
                    totalSpent: { $sum: "$totalAmount" },
                    averageOrderValue: { $avg: "$totalAmount" },
                    lastOrderDate: { $max: "$orderDate" }
                }}
            ]);
            return result[0] || { customerId, totalSpent: 0, averageOrderValue: 0, lastOrderDate: null };
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
            return await Order.aggregate([
                { $match: { orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) }, status: 'completed' } },
                { $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    completedOrders: { $sum: 1 }
                }},
                { $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productInfo"
                }},
                { $unwind: "$productInfo" },
                { $group: {
                    _id: "$productInfo.category",
                    revenue: { $sum: "$totalAmount" }
                }},
                { $project: { category: "$_id", revenue: 1 } }
            ]);
        }
    }
};
module.exports = resolvers;