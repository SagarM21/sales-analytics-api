const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const connectDB = require('./src/config/db');
const typeDefs = require('./src/graphql/schema');
const resolvers = require('./src/graphql/resolvers');
require('dotenv').config();

const app = express();
connectDB();
const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    introspection: true
});
server.start().then(() => {
    server.applyMiddleware({ app, path: '/api' });
    app.listen(process.env.APP_PORT, () => console.log(`Server running on http://localhost:${process.env.APP_PORT}/api`));
});