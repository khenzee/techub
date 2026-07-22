# MongoDB + Mongoose Cheat Sheet

This picks up exactly where **Backend 101 → Section 10 (Model)** left off. MongoDB is the database. Mongoose is the tool that lets your Node.js app talk to that database using the "Model" concept — properly, this time.

Quick reference, not a tutorial — skim, then come back when you need a snippet.

---

## 1. MongoDB vs Mongoose — the one distinction that matters

| | What it is |
|---|---|
| **MongoDB** | The actual database. Stores data as JSON-like documents inside collections. Runs on its own (locally, or hosted via Atlas). |
| **Mongoose** | An **ODM** (Object Data Modeling) library for Node.js. It sits between your Express app and MongoDB, giving you schemas, validation, and easier queries instead of writing raw database calls. |

You could talk to MongoDB directly with the official `mongodb` driver — Mongoose just makes it far less painful, which is why it's the default for beginners.

**Vocabulary mapping** (SQL people, this is for you):

| MongoDB term | Roughly equivalent to |
|---|---|
| Database | Database |
| Collection | Table |
| Document | Row |
| Field | Column |

---

## 2. Connect to the database

Goes in your **config** file (Backend 101 → Section 11), using the connection string from your **environment variables** (Section 9).

```js
// config/db.js
const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
```

```js
// server.js
const connectDB = require('./config/db');
connectDB();
```

`.env`:
```
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/mydb
```

---

## 3. Schema — the shape of your data

A **schema** defines what fields a document has, their types, and rules. This is Mongoose's version of the "Model" concept from Backend 101 — but stricter.

```js
// models/Product.js
import mongoose from "mongoose;

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  inStock: { type: Boolean, default: true },
  category: { type: String, enum: ['food', 'drink', 'other'] },
}, { timestamps: true }); // adds createdAt / updatedAt automatically

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
```

**Common field options:**

| Option | Does what |
|---|---|
| `required` | Field must be present |
| `default` | Value used if none provided |
| `unique` | No two documents can share this value |
| `min` / `max` | Number bounds |
| `minlength` / `maxlength` | String length bounds |
| `enum` | Restrict to a fixed list of values |
| `trim` | Strips whitespace from strings |

**Common types:** `String`, `Number`, `Boolean`, `Date`, `Array`, `mongoose.Schema.Types.ObjectId` (used for references — see §7).

---

## 4. Designing a Schema — how to actually think about it

This is the part that's rarely taught explicitly: syntax is easy, *deciding what the schema should look like* is the actual skill. Before writing a single `mongoose.Schema`, answer these in order:

**1. What are the "things" in your app?**
List the nouns first, ignoring fields. A food ordering app: User, Product, Order, Review. Each noun is a likely candidate for its own schema/collection.

**2. For each thing, what does it need to *know about itself*?**
Only its own properties — not other things yet. A Product knows its name, price, category. It doesn't need to know who bought it; that's an Order's job. A common beginner mistake is stuffing unrelated data into one schema because "it's related" — e.g. putting `orderHistory` directly on User. Keep a schema to what that *one* entity owns.

**3. How do the things relate to each other?**
This is where relationships (§7) come in — but the relationship *type* has to be decided before you write any `ref`:

| Relationship | Example | 
|---|---|
| One-to-one | A User has one Profile |
| One-to-many | A User has many Orders |
| Many-to-many | An Order has many Products, and a Product appears in many Orders |

**4. Should related data be embedded or referenced?**
This is the single biggest schema decision in MongoDB, and it's covered properly in §7 — but the short version: embed data that's small, doesn't change often, and is always fetched together with its parent (like an address inside a User). Reference data that's large, changes independently, or is shared across many documents (like Products inside an Order).

**5. What will you query by most often?**
If you'll constantly fetch "all orders for this user," that shapes whether `user` lives on the Order (one-to-many, referenced) rather than an array of `orders` living on the User. Design around your most common queries, not just "what feels logically nested."

A rough process for any new feature: **list the nouns → define each noun's own fields → decide relationship type between nouns → decide embed vs reference → write the schema.** Skipping straight to step 5 (writing code) without steps 1–4 is usually where beginners get stuck and end up redesigning the schema halfway through a project.

---

## 5. CRUD with Mongoose

This is the model layer that a **controller** (Backend 101 → Section 12) calls into.

### Create
```js
const product = await Product.create({ name: 'Jollof Rice', price: 2500 });
// or:
const product = new Product({ name: 'Jollof Rice', price: 2500 });
await product.save();
```

### Read
```js
const all = await Product.find();                     // all documents
const one = await Product.findById(id);                // by _id
const filtered = await Product.find({ category: 'food' }); // by field
const single = await Product.findOne({ name: 'Jollof Rice' });
```

### Update
```js
await Product.findByIdAndUpdate(id, { price: 3000 }, { new: true });
// { new: true } returns the UPDATED document, not the old one
```

### Delete
```js
await Product.findByIdAndDelete(id);
```

A typical controller wiring these together:

```js
// controllers/productController.js
const Product = require('../models/Product');

exports.getAllProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
};
```

---

## 6. Query helpers you'll actually use

```js
Product.find().sort({ price: -1 });        // sort desc (1 = asc)
Product.find().limit(10);                  // limit results
Product.find().skip(10);                   // pagination offset
Product.find({ price: { $gt: 1000 } });     // greater than
Product.find({ price: { $lte: 5000 } });    // less than or equal
Product.find({ name: /rice/i });            // case-insensitive search
```

**Common comparison operators:** `$gt`, `$gte`, `$lt`, `$lte`, `$ne` (not equal), `$in` (matches any in array).

---

## 7. Relationships between documents

MongoDB isn't relational — there's no built-in "foreign key" enforcement like SQL. You have two ways to connect data, and picking the right one per case is the core skill here.

### Option A: Embedding (nest the data directly inside the parent)

```js
const userSchema = new mongoose.Schema({
  name: String,
  address: {
    street: String,
    city: String,
  },
});
```

`address` isn't its own collection — it lives inside every User document. One query gets you everything.

**Embed when:**
- The data is small
- It doesn't change independently of the parent
- It's always needed alongside the parent (you'd never fetch an address without its user)
- It won't be reused by other documents

### Option B: Referencing (store an ID, keep it a separate collection)

```js
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
});
```

`user` here only stores the User's `_id`. To pull in the actual User data, use `.populate()`:

```js
const order = await Order.findById(id).populate('user').populate('products');
// order.user is now the full User document, not just an ID
```

**Reference when:**
- The data is large or grows unbounded (an Order should never embed the entire Product catalog)
- It's shared across many parents (many Orders point to the same Product)
- It changes independently (a Product's price updates without touching every Order that ever referenced it)
- You need to query that data on its own too (e.g. "get all Products," independent of any Order)

### The three relationship shapes, and which option usually fits

| Shape | Example | Usual choice |
|---|---|---|
| **One-to-one** | User ↔ Profile | Embed — it's small and always fetched together |
| **One-to-many** | User → many Orders | Reference — put `user` on the Order (not `orders` array on User); Orders are unbounded and queried independently |
| **Many-to-many** | Orders ↔ Products | Reference both ways — an array of `ObjectId`s on whichever side you query from most |

### The test when you're unsure

Ask: **"If I delete/change the parent, should this data go/change with it? And will I ever need to fetch this data on its own, without its parent?"**
- Goes with the parent, never needed alone → embed
- Needed on its own, or shared by multiple parents → reference

This is the same decision from §4 step 4 — this section is just the "how," that section was the "why."

---

## 8. Validation & error handling

Mongoose validates against the schema automatically on `save()` / `create()`. Wrap calls in try/catch (or an async error-handling middleware) to catch bad data instead of crashing the server:

```js
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
```

---

## 9. Schema methods (custom logic on your model)

You can attach your own functions directly to a schema — useful for things like password hashing later, in the auth guide.

```js
productSchema.methods.applyDiscount = function (percent) {
  return this.price - (this.price * percent) / 100;
};

// usage:
product.applyDiscount(10);
```

---

## 10. Quick mental model

```
Express route → Controller → Mongoose Model → MongoDB
                    ↑                              ↓
                 req.body                    returns document(s)
```

The schema is the contract. The model is the interface. The controller decides *when* to use it. Nothing here replaces anything from Backend 101 — it's the detailed version of one box (Model) in that pipeline.

---

*Next up: authentication & authorization, file uploads, and other backend best practices.*