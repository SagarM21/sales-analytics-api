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
    type Customer {
        _id: ID!
        name: String
        email: String
        age: Int
    }
    type Product {
        _id: ID!
        name: String
        category: String
        price: Float
        stock: Int
    }
    type OrderItem {
        productId: ID!
        quantity: Int
        priceAtPurchase: Float
    }
    type Order {
        _id: ID!
        customerId: ID!
        products: [OrderItem]
        totalAmount: Float
        orderDate: String
        status: String
    }
    type OrderResponse {
        success: Boolean!
        message: String
        order: Order
    }
    type PaginatedOrders {
        orders: [Order]
        totalCount: Int
        page: Int
        pageSize: Int
        totalPages: Int
    }
    type PaginatedProducts {
        products: [Product]
        totalCount: Int
        page: Int
        pageSize: Int
        totalPages: Int
        categories: [String]
    }
    input OrderItemInput {
        productId: ID!
        quantity: Int!
    }
    input PlaceOrderInput {
        customerId: ID!
        products: [OrderItemInput!]!
    }
    input ProductFilter {
        category: String
        minPrice: Float
        maxPrice: Float
        inStock: Boolean
        search: String
    }
    type Query {
        getCustomerSpending(customerId: ID!): CustomerSpending
        getTopSellingProducts(limit: Int!): [TopProduct]
        getSalesAnalytics(startDate: String!, endDate: String!): SalesAnalytics
        getCustomers(limit: Int!): [Customer]
        getCustomerOrders(customerId: ID!, page: Int = 1, pageSize: Int = 10): PaginatedOrders
        getProducts(
            page: Int = 1
            pageSize: Int = 10
            filter: ProductFilter
            sortBy: String = "name"
            sortOrder: String = "asc"
        ): PaginatedProducts
    }
    type Mutation {
        placeOrder(input: PlaceOrderInput!): OrderResponse
    }
`;
module.exports = typeDefs;