# Building Search, Filter, Sort, and Pagination for the Article API

As our application grows, a simple `Article.find()` is no longer enough. We need to allow users to search for specific articles, filter by status or author, sort the results, and paginate to avoid loading too much data at once.

This guide explains how to implement these features using MongoDB query operators within our Express controllers.

## 1. Filtering

Filtering allows us to narrow down results based on specific criteria.

Our `Article` model has fields like `status` (draft/published) and `author`.

**Single Value Filter:**
If a user wants to see only published articles, the query looks like this:
`GET /api/articles?status=published`

```javascript
const filter = {};

if (req.query.status) {
  filter.status = req.query.status;
}

// MongoDB receives: { status: "published" }
```

**Multiple Value Filter (Using `$in`):**
What if we want to filter by multiple statuses at once? We use the `$in` operator.
`GET /api/articles?status=draft,published`

```javascript
if (req.query.status) {
    filter.status = {
        $in: req.query.status.split(",")
    };
}

// MongoDB receives: { status: { $in: ["draft", "published"] } }
```
*Rule of thumb:* Use `$in` when you are checking one field against many possible values.

## 2. Searching (Using `$regex` and `$or`)

Search is a broader filter. Instead of exact matches, we usually want to find if a string *contains* the search term.

Suppose a user searches for "react":
`GET /api/articles?search=react`

We want to check if the word "react" appears in the article's `title` OR `content`.

```javascript
if (req.query.search) {
    filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { content: { $regex: req.query.search, $options: "i" } }
    ];
}
```
- `$or`: Tells MongoDB to return documents that match *any* of the conditions inside the array.
- `$regex`: Performs a pattern match (like checking if a string contains a substring).
- `$options: "i"`: Makes the search case-insensitive.

## 3. Sorting

Sorting dictates the order of the returned documents.

`GET /api/articles?sortBy=oldest`

```javascript
let sortQuery = { createdAt: -1 }; // Default: newest first

if (req.query.sortBy) {
    if (req.query.sortBy === "oldest") {
        sortQuery = { createdAt: 1 };
    } else if (req.query.sortBy === "title") {
        sortQuery = { title: 1 }; // Alphabetical (A-Z)
    } else if (req.query.sortBy === "title_desc") {
        sortQuery = { title: -1 }; // Reverse Alphabetical (Z-A)
    }
}
```

## 4. Pagination

Loading all articles at once will slow down the app. We need to paginate the results using `limit` and `skip`.

- **Limit**: How many articles to send per page.
- **Skip**: How many articles to skip over before starting to send.

Formula for skip: `(page - 1) * limit`

`GET /api/articles?page=2&limit=10`

```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

// For page 2 with limit 10:
// (2 - 1) * 10 = skip 10 items.
```

## 5. Population (Joining Data)

In MongoDB, we often store relationships as references (ObjectIDs). For example, our `Article` model only stores the `author`'s ID (e.g., `64a7b9c9f...`).

When the frontend fetches an article, it usually wants to show the author's name and email, not just a random string ID. This is where **Population** comes in.

Mongoose's `.populate()` acts like a SQL JOIN. It tells MongoDB to look up the actual user document matching that ID and replace the ID with the user's data.

**Without Population:**
```javascript
const article = await Article.find();
// Result: { title: "Hello", author: "64a7b9c9f..." }
```

**With Population:**
```javascript
// We want to fetch the author, but ONLY their name and email
const article = await Article.find().populate("author", "name email");
// Result: { title: "Hello", author: { _id: "64a7b9c9f...", name: "John", email: "john@test.com" } }
```

**When to use it:**
Use `.populate()` whenever the frontend needs related data to render the UI, and you want to save them from making a second, separate API request to fetch that user's data.

## 6. Putting It All Together

Here is the complete implementation of the `getArticles` controller, combining Search, Filter, Sort, and Pagination:

```javascript
import Article from "../models/article.model.js";

export const getArticles = async (req, res) => {
    try {
        const filter = {};

        // 1. SEARCH
        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: "i" } },
                { content: { $regex: req.query.search, $options: "i" } }
            ];
        }

        // 2. FILTER
        if (req.query.status) {
            // Allows single (status=published) or multiple (status=draft,published)
            filter.status = req.query.status.includes(',') 
                ? { $in: req.query.status.split(",") } 
                : req.query.status;
        }

        if (req.query.author) {
            filter.author = req.query.author;
        }

        // 3. SORT
        let sortQuery = { createdAt: -1 }; // Default: latest first
        if (req.query.sortBy === "oldest") {
            sortQuery = { createdAt: 1 };
        } else if (req.query.sortBy === "title") {
            sortQuery = { title: 1 };
        } else if (req.query.sortBy === "title_desc") {
            sortQuery = { title: -1 };
        }

        // 4. PAGINATION
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // EXECUTE QUERY
        const articles = await Article.find(filter)
            .sort(sortQuery)
            .skip(skip)
            .limit(limit)
            .populate("author", "name email"); // Populate author details if needed

        // Get total count for the frontend to calculate total pages
        const totalArticles = await Article.countDocuments(filter);

        return res.status(200).json({
            message: "Articles fetched successfully",
            currentPage: page,
            totalPages: Math.ceil(totalArticles / limit),
            totalArticles,
            articles
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
```

### Why do we need `countDocuments`?
The frontend needs to know how many total pages exist so it can render the pagination UI correctly (e.g., `< 1 2 3 4 >`). By counting all the documents that match our current `filter` (ignoring skip and limit), we provide `totalArticles` and `totalPages` alongside the actual paginated data array.