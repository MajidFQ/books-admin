// pages/api/books/[id].js
//
// This endpoint handles operations on a single book, identified by its MongoDB _id.
//   - GET:    fetch one book
//   - PUT:    update one book
//   - DELETE: delete one book
//
// All operations require authentication.

import clientPromise from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    // Check for a valid JWT before touching the database.
    // Putting this check at the top means we never waste a database
    // call on an unauthenticated request.
    const user = verifyToken(req);

    if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    // The dynamic segment [id] in the filename becomes req.query.id
    const { id } = req.query;

    const client = await clientPromise;
    const db = client.db('books_scraper');
    const collection = db.collection('books');

    if (req.method === 'GET') {
        try {
            // MongoDB stores IDs as ObjectId objects internally, not plain strings.
            // We must wrap the id from the URL in new ObjectId() so the query matches.
            const book = await collection.findOne({ _id: new ObjectId(id) });

            if (!book) {
                // A 404 is more accurate than a 500 when the record simply doesn't exist
                return res.status(404).json({ message: 'Book not found' });
            }

            return res.status(200).json(book);
        } catch (error) {
            // This can also throw if `id` isn't a valid ObjectId format
            console.error('Error fetching book:', error);
            return res.status(500).json({ message: 'Error fetching book' });
        }

    } else if (req.method === 'PUT') {
        try {
            // The client sends only the fields it wants to change.
            // Using $set means we only update those specific fields;
            // any fields not included in the request body are left untouched.
            const updates = req.body;

            const result = await collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updates }
            );

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error updating book:', error);
            return res.status(500).json({ message: 'Error updating book' });
        }

    } else if (req.method === 'DELETE') {
        try {
            const result = await collection.deleteOne({ _id: new ObjectId(id) });
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error deleting book:', error);
            return res.status(500).json({ message: 'Error deleting book' });
        }

    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}
