# Sales Analytics API

A GraphQL API for analyzing sales, customer spending, and product performance for an e-commerce platform. Built with Node.js, Express, Apollo Server, and MongoDB.

## Features

- Customer spending analytics
- Top selling products tracking
- Sales analytics with category breakdown
- Paginated customer orders
- Product catalog with filtering and sorting
- Order placement functionality

## Prerequisites

### Local Development
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Docker Deployment
- Docker
- Docker Compose

## Installation

### Environment Setup (Important!)
1. Create a `.env` file in the root directory:
```bash
cp .env.example.js .env
```

2. Fill in the required environment variables in `.env`:
```env
MONGO_URI=your_mongodb_connection_string
APP_PORT=4000
```
Note: Replace `your_mongodb_connection_string` with your actual MongoDB connection string.

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/SagarM21/sales-analytics-api.git
cd sales-analytics-api
```

2. Install dependencies:
```bash
npm install
```

3. Import the seed data:
```bash
npm run seed
```

### Docker Deployment

1. Clone the repository:
```bash
git clone https://github.com/SagarM21/sales-analytics-api.git
cd sales-analytics-api
```

2. Build and start the containers:
```bash
docker compose up --build
```

The application will be available at `http://localhost:<PORT>/api`

## Running the Application

### Local Development
Start the development server:
```bash
npm start
```

### Docker
Start the containers:
```bash
docker compose up
```

Stop the containers:
```bash
docker compose down
```

The GraphQL playground will be available at `http://localhost:<PORT>/api`

## API Documentation

### Queries

#### 1. Get Customer Spending
```graphql
query GetCustomerSpending($customerId: ID!) {
  getCustomerSpending(customerId: $customerId) {
    customerId
    totalSpent
    averageOrderValue
    lastOrderDate
  }
}
```

#### 2. Get Top Selling Products
```graphql
query GetTopSellingProducts($limit: Int!) {
  getTopSellingProducts(limit: $limit) {
    productId
    name
    totalSold
  }
}
```

#### 3. Get Sales Analytics
```graphql
query GetSalesAnalytics($startDate: String!, $endDate: String!) {
  getSalesAnalytics(startDate: $startDate, endDate: $endDate) {
    totalRevenue
    completedOrders
    categoryBreakdown {
      category
      revenue
    }
  }
}
```

#### 4. Get Customer Orders (Paginated)
```graphql
query GetCustomerOrders($customerId: ID!, $page: Int, $pageSize: Int) {
  getCustomerOrders(customerId: $customerId, page: $page, pageSize: $pageSize) {
    orders {
      id
      customerId
      totalAmount
      orderDate
      status
      products {
        productId
        quantity
        priceAtPurchase
      }
    }
    totalCount
    page
    pageSize
    totalPages
  }
}
```

#### 5. Get Products (Paginated with Filtering)
```graphql
query GetProducts(
  $page: Int
  $pageSize: Int
  $filter: ProductFilter
  $sortBy: String
  $sortOrder: String
) {
  getProducts(
    page: $page
    pageSize: $pageSize
    filter: $filter
    sortBy: $sortBy
    sortOrder: $sortOrder
  ) {
    products {
      id
      name
      category
      price
      stock
    }
    totalCount
    page
    pageSize
    totalPages
    categories
  }
}
```

### Mutations

#### Place Order
```graphql
mutation PlaceOrder($input: OrderInput!) {
  placeOrder(input: $input) {
    success
    message
    order {
      id
      customerId
      totalAmount
      orderDate
      status
      products {
        productId
        quantity
        priceAtPurchase
      }
    }
  }
}
```

## Data Models

### Customer
```typescript
interface Customer {
  id: ID!
  name: String!
  email: String!
  age: Int!
  location: String!
  gender: String!
}
```

### Product
```typescript
interface Product {
  id: ID!
  name: String!
  category: String!
  price: Float!
  stock: Int!
}
```

### Order
```typescript
interface Order {
  id: ID!
  customerId: ID!
  products: [OrderProduct!]!
  totalAmount: Float!
  orderDate: String!
  status: String!
}
```

## Project Structure

```
sales-analytics-api/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── graphql/
│   │   ├── resolvers.js
│   │   ├── schema.js
│   │   └── queries.graphql
│   ├── models/
│   │   ├── customer.model.js
│   │   ├── order.model.js
│   │   └── product.model.js
│   └── seed/
│       └── seed.js
├── .env
├── .env.example.js
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## Testing

Sample queries and mutations are available in `src/graphql/queries.graphql`. You can use these in the GraphQL playground to test the API.