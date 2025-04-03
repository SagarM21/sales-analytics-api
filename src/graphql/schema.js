const { gql } = require('apollo-server-express');
const typeDefs = gql`
    type CustomerSpending {
        customerId: ID!
        totalSpent: Float
        averageOrderValue: Float
        lastOrderDate: String
    }
    type TopProduct {
        productId: ID!
        name: String
        totalSold: Int
    }
    type SalesAnalytics {
        totalRevenue: Float
        completedOrders: Int
        categoryBreakdown: [CategoryRevenue]
    }
    type CategoryRevenue {
        category: String
        revenue: Float
    }
    type Query {
        getCustomerSpending(customerId: ID!): CustomerSpending
        getTopSellingProducts(limit: Int!): [TopProduct]
        getSalesAnalytics(startDate: String!, endDate: String!): SalesAnalytics
    }
`;
module.exports = typeDefs;