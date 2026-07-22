# books-admin

A Next.js admin panel for managing scraped book data stored in MongoDB. It provides a secure JWT-based login system and a full CRUD API for the `books` collection. This project is the admin interface companion to the [books-scraper](https://github.com/MajidFQ/books-scraper) project, which populates the same database.

---

## Tech Stack

- **[Next.js](https://nextjs.org/)** — React framework with built-in API routes (used here as a backend)
- **[MongoDB](https://www.mongodb.com/atlas)** — NoSQL database hosted on MongoDB Atlas
- **[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)** — JWT creation and verification
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** — Password hashing and comparison

---

## Prerequisites

- **Node.js** v18 or later
- A **MongoDB Atlas** account with a cluster and a database named `books_scraper`
- The `books` collection should already exist (populated by the books-scraper project, or manually)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/MajidFQ/books-admin.git
cd books-admin
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` and set:

| Variable              | Description                                      |
|-----------------------|--------------------------------------------------|
| `MONGO_URI`           | Your MongoDB Atlas connection string             |
| `JWT_SECRET`          | A long random string used to sign JWT tokens     |
| `ADMIN_USERNAME`      | The admin login username (e.g. `admin`)          |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of your chosen admin password        |

### 4. Generate a JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Paste the output as `JWT_SECRET` in `.env.local`.

### 5. Generate the admin password hash

```bash
node -e "const b = require('bcryptjs'); console.log(b.hashSync('your_password_here', 10))"
```

Paste the output as `ADMIN_PASSWORD_HASH` in `.env.local`.

### 6. Run the development server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## API Routes

All routes return JSON. Protected routes require a valid JWT stored in the `token` cookie, which is set automatically after a successful login.

---

### `POST /api/login`

Authenticate as the admin and receive a session cookie.

**Auth required:** No

**Request body:**
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Success response** `200 OK`:
```json
{ "message": "Login successful" }
```
Sets an `HttpOnly` cookie named `token` containing a JWT valid for 2 hours.

**Error responses:**
- `400` — missing username or password
- `401` — invalid credentials
- `405` — method not allowed

---

### `GET /api/books`

Retrieve all books from the database.

**Auth required:** Yes

**Success response** `200 OK`:
```json
[
  {
    "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "title": "A Light in the Attic",
    "price": "£51.77",
    "rating": "Three",
    "availability": "In stock"
  },
  ...
]
```

---

### `POST /api/books`

Create a new book entry.

**Auth required:** Yes

**Request body:** Any object with the fields you want to store, for example:
```json
{
  "title": "New Book",
  "price": "£12.99",
  "rating": "Four",
  "availability": "In stock"
}
```

**Success response** `201 Created`:
```json
{
  "acknowledged": true,
  "insertedId": "64a1b2c3d4e5f6a7b8c9d0e1"
}
```

---

### `GET /api/books/[id]`

Retrieve a single book by its MongoDB `_id`.

**Auth required:** Yes

**Success response** `200 OK` — the book object.

**Error responses:**
- `404` — book not found
- `500` — invalid id format or database error

---

### `PUT /api/books/[id]`

Update specific fields on a book. Only the fields you include in the request body will be changed — other fields are left as-is.

**Auth required:** Yes

**Request body:**
```json
{
  "price": "£9.99",
  "availability": "Out of stock"
}
```

**Success response** `200 OK`:
```json
{
  "acknowledged": true,
  "matchedCount": 1,
  "modifiedCount": 1
}
```

---

### `DELETE /api/books/[id]`

Delete a book by its MongoDB `_id`.

**Auth required:** Yes

**Success response** `200 OK`:
```json
{
  "acknowledged": true,
  "deletedCount": 1
}
```

---

## Related Projects

- **[books-scraper](https://github.com/MajidFQ/books-scraper)** — Python scraper that populates the `books_scraper` MongoDB database that this admin panel manages.

---

## Notes

- The JWT expires after 2 hours. After that, you'll need to log in again.
- The admin password is never stored in plain text — only its bcrypt hash is stored in the environment variable.
- This app is intended as a backend API. There is no frontend UI yet — all interaction is via API calls (e.g. Postman, curl, or a future frontend).
