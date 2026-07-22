// pages/api/books/index.js
//
// This endpoint handles:
//   - GET: retrieve all books from the database
//   - POST: create a new book
//
// Both operations require authentication, so we check for a valid JWT first.

import clientPromise from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
    // Check if the request has a valid token before touching the database.
    // This prevents unauthenticated users from reading or writing data.
    const user = verifyToken(req);

    if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    // Connect to MongoDB and get the books collection
    const client = await clientPromise;
    const db = client.db('books_scraper');
    const collection = db.collection('books');

    if (req.method === 'GET') {
        try {
            // find({}) with no filter returns every document in the collection
            const books = await collection.find({}).toArray();
            return res.status(200).json(books);
        } catch (error) {
            // Log the error on the server for debugging, but send a generic message to the client
            console.error('Error fetching books:', error);
            return res.status(500).json({ message: 'Error fetching books' });
        }

    } else if (req.method === 'POST') {
        try {
            // The client sends the new book data in the request body
            const newBook = req.body;

            // insertOne adds the document to the collection and returns metadata
            // about the operation, including the generated _id
            const result = await collection.insertOne(newBook);
            return res.status(201).json(result);
        } catch (error) {
            console.error('Error creating book:', error);
            return res.status(500).json({ message: 'Error creating book' });
        }

    } else {
        // Reject any HTTP method we don't explicitly handle (e.g. PUT, DELETE, PATCH)
        return res.status(405).json({ message: 'Method not allowed' });
    }
}
