// lib/mongodb.js
//
// This file establishes and manages the connection to MongoDB.
// Instead of reconnecting on every API call, we reuse a single connection
// by storing it in a global variable. This is safe in serverless environments
// because Next.js keeps the Node.js process warm between requests.

import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;

if (!uri) {
    // Fail fast if the connection string is missing — this makes it clear
    // during development that the environment variable isn't configured.
    throw new Error('Please add MONGO_URI to .env.local');
}

// Use a global variable so the connection persists across hot reloads in dev mode
// and across invocations in production. Without this, each API call would create
// a new connection, which is slow and eventually hits MongoDB's connection limit.
if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
}

// Export the promise so other files can await it, then use the connected client
export default global._mongoClientPromise;
