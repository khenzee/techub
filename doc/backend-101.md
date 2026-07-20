# Backend 101: How It All Connects

This guide isn't a glossary. Each section builds on the one before it, so by the end you should be able to trace a single request from "user clicks a button" all the way to "data comes back from a database." Read it in order the first time.

---

## 1. What Is Backend Development?

When you use an app — say, a food delivery app — you see buttons, menus, and food photos. That's the **frontend**. But when you tap "Order Now," something has to:

- Check if you're logged in
- Save your order somewhere
- Calculate the price
- Tell the restaurant
- Send you a confirmation

None of that happens on your screen. It happens on a server, somewhere else, that the frontend talks to. That "somewhere else" — the logic, the data storage, the rules — is the **backend**.

**A backend developer's job** is to build that hidden half: the server that receives requests, decides what to do with them, talks to a database, and sends a response back. If the frontend is the restaurant's dining room, the backend is the kitchen — invisible to the customer, but it's where the actual work happens.

The frontend and backend never touch directly. They talk through a middleman: the **API**.

---

## 2. API (Application Programming Interface)

An API is simply a set of agreed-upon rules for how two programs talk to each other. The frontend doesn't know (or care) how your backend saves an order — it just needs to know: "if I send a request to *this* address, in *this* format, I'll get *this* kind of response back."

Think of it like a restaurant menu. You don't need to know how the kitchen works. You just need to know that ordering "Item #4" gets you jollof rice. The menu is the interface between you and the kitchen — the API is the interface between the frontend and the backend.

As a backend developer, **building the backend mostly means building an API**: defining what requests are accepted, and what happens when they arrive.

There are different styles of API. The most common one you'll build as a beginner is **REST**.

---

## 3. REST API

REST (Representational State Transfer) is just a *convention* — a commonly agreed way of designing APIs so they're predictable. A REST API organizes everything around **resources** (things like users, orders, products) and uses standard HTTP methods to act on them:

| HTTP Method | Meaning              | Example                     |
|-------------|----------------------|------------------------------|
| GET         | Read/fetch data      | Get all products             |
| POST        | Create new data      | Create a new order           |
| PUT/PATCH   | Update existing data | Edit a user's profile        |
| DELETE      | Remove data          | Delete a product             |

Each resource usually gets a URL pattern, like `/products` or `/orders/5`. So "GET `/products`" means "fetch all products," and "DELETE `/orders/5`" means "delete order number 5."

Notice something: these four actions — Create, Read, Update, Delete — have a name of their own.

---

## 4. CRUD

**CRUD** stands for **C**reate, **R**ead, **U**pdate, **D**elete — the four basic operations you can do to any piece of data. Almost everything a backend does is some combination of CRUD:

- Signing up → **Create** a user
- Viewing your profile → **Read** a user
- Editing your bio → **Update** a user
- Deactivating your account → **Delete** a user

REST maps directly onto CRUD:

```
POST   → Create
GET    → Read
PUT    → Update
DELETE → Delete
```

So when someone says "build a REST API for products," they usually mean: "build CRUD endpoints for products" — a way to create, view, update, and delete products over HTTP.

Now — how do you actually *build* something that can receive these HTTP requests and respond? You need a tool that can run JavaScript on a server and listen for incoming requests. That's where **Node.js** and **Express** come in.

---

## 5. Node.js and Express

JavaScript was originally built to run only in browsers. **Node.js** is a runtime that lets JavaScript run outside the browser — on a server, on your machine, anywhere. This is what makes it possible to write backends in JavaScript at all.

But raw Node.js is low-level — handling raw HTTP requests by hand is tedious. **Express** is a *framework* built on top of Node.js that makes it much easier to:

- Define URLs (routes) your API responds to
- Handle incoming request data
- Send back responses
- Plug in reusable logic (middleware)

So the relationship is: **Node.js is the engine, Express is the toolkit** that makes building an API on that engine practical.

This is the point where "concepts" become "an actual project folder." Let's set one up.

---

## 6. Project Setup

A typical Express project setup involves:

1. `npm init` — creates a `package.json` file, which tracks your project's dependencies and scripts.
2. `npm install express` — downloads Express into a `node_modules` folder.
3. An entry file (commonly `server.js` or `index.js`) — this is where you create your Express app and tell it to start listening for requests:

```js
const express = require('express');
const app = express();

app.listen(3000, () => console.log('Server running on port 3000'));
```

Once this runs, your computer (or server) is now "listening" on port 3000 — waiting for HTTP requests to arrive. But right now, it doesn't know what to *do* with any request. That's defined by **routes**.

---

## 7. Route

A **route** is a mapping between a URL + HTTP method, and the function that should run when that combination is hit. It's literally you telling Express: "when a GET request comes in for `/products`, run this code."

```js
app.get('/products', (req, res) => {
  res.send('Here are the products');
});
```

Here, `/products` is the route, `GET` is the method, and the function is what actually executes.

As your app grows, you'll have dozens of routes: `/users`, `/orders`, `/products/:id`, etc. — each one connected to the CRUD operations you learned about earlier. But often, before a route's main logic runs, you want to do something *first* — like check if the user is logged in, or log the request. That's what **middleware** is for.

---

## 8. Middleware

Middleware is a function that sits *between* the incoming request and the final route handler. It can inspect the request, modify it, block it, or just pass it along. Think of it as a checkpoint.

```js
function logger(req, res, next) {
  console.log(`${req.method} request to ${req.url}`);
  next(); // pass control to the next function in line
}

app.use(logger);
```

That `next()` call is key — it tells Express "I'm done, move on to whatever's next" (either another middleware, or the actual route). If middleware doesn't call `next()`, the request stops there.

Common uses of middleware:
- Checking authentication ("is this user logged in?")
- Parsing incoming JSON data (`express.json()`)
- Logging requests
- Handling errors

Middleware is what makes routes *composable* — you don't repeat the same "check if logged in" code in every route; you write it once as middleware and reuse it.

Now — how does your app know *sensitive* details like database passwords or API keys, without hardcoding them into your code? That's where **environment variables** come in.

---

## 9. Environment (Environment Variables)

You never want to hardcode things like database passwords, secret keys, or the port number directly into your code — especially if that code is going to be pushed to GitHub for anyone to see. Instead, these values live in **environment variables**: values stored outside your codebase, usually in a `.env` file.

```
PORT=3000
DATABASE_URL=your-database-connection-string
JWT_SECRET=some-secret-key
```

Your code then *reads* these values at runtime, rather than having them written in plainly:

```js
require('dotenv').config();
const port = process.env.PORT;
```

This also lets the same code run differently in different **environments** — development (your laptop), and production (the live server) — just by swapping the `.env` values, without changing a single line of code.

Environment variables often store one very important thing: how to connect to your **database**. Which brings us to how your app actually represents and stores data — the **model**.

---

## 10. Model

A **model** defines the *shape* of a piece of data, and provides the interface for reading/writing that data to the database. If a "product" in your app always needs a name, price, and description, the model is where you define that structure.

```js
// A simplified example (real syntax depends on your database library)
const Product = {
  name: String,
  price: Number,
  description: String
};
```

The model doesn't handle HTTP requests. It doesn't know about routes or middleware. Its only job is: "here's what a Product looks like, and here's how to save/fetch/update/delete one in the database." Route handlers *call* the model to actually touch the data.

You'll notice we now have several concerns mixed together: connecting to a database, defining routes, writing logic. To keep things from getting tangled, backend projects use **config** files and **controllers** to separate responsibilities.

---

## 11. Config

**Config** (short for configuration) refers to the setup code that prepares things your app needs before it can run properly — most commonly, connecting to a database.

```js
// config/db.js
const mongoose = require('mongoose');

function connectDB() {
  mongoose.connect(process.env.DATABASE_URL);
}

module.exports = connectDB;
```

This file's only job is: "know how to connect to the database, using the credentials from the environment variables." Your main server file just calls `connectDB()` once, rather than cluttering `server.js` with connection logic.

Config keeps *setup* logic separate from *business* logic. Speaking of business logic — that's the job of the **controller**.

---

## 12. Controller

If the route decides *which* URL triggers code, the **controller** is the actual code that runs — the logic itself. Separating routes from controllers keeps your route file clean and readable:

```js
// controllers/productController.js
function getAllProducts(req, res) {
  // logic to fetch products using the Model
  res.json(products);
}

module.exports = { getAllProducts };
```

```js
// routes/productRoutes.js
const { getAllProducts } = require('../controllers/productController');
router.get('/products', getAllProducts);
```

The route says "when this URL is hit, call this controller function." The controller says "here's what actually happens" — usually: talk to the **model** to get data, then send a response.

---

## 13. How It All Connects

Here's the full chain, following a single request from start to finish — say, a user requesting `GET /products`:

```
1. Client (frontend/app) sends an HTTP GET request to /products
                    ↓
2. Express app is listening (set up in project setup, server.js)
                    ↓
3. Request passes through MIDDLEWARE first
   (e.g. logging, checking auth, parsing data)
                    ↓
4. Middleware calls next() → request reaches the matching ROUTE
   (GET /products)
                    ↓
5. Route hands off to its CONTROLLER function
                    ↓
6. Controller uses the MODEL to talk to the database
   (database connection was set up via CONFIG, using
    credentials from ENVIRONMENT variables)
                    ↓
7. Model returns data from the database to the controller
                    ↓
8. Controller sends a RESPONSE back to the client (this whole
   request/response cycle follows REST + CRUD conventions —
   this was a "Read" operation)
                    ↓
9. Client receives the response and displays it
```

That entire pipeline — request → middleware → route → controller → model → database → response — **is the backend**. Every term in this guide is just a named stop along that pipeline. Once this chain clicks, everything else (auth, file uploads, validation) is just *more stops added to the same chain*, not new concepts from scratch.

---

*Next up: a dedicated guide on MongoDB + Mongoose (the model layer in depth), followed by a guide on auth/authorization, file uploads, and other backend best practices.*