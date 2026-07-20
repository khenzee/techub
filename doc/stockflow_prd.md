# StockFlow – Inventory Management API

## Project Overview

StockFlow is an Inventory Management backend that allows businesses to manage products and categories while keeping track of inventory.

Students will apply the same backend concepts learned from TechHub in a completely different business domain.

---

# Objectives

Students should build a production-ready inventory backend using the same architecture and best practices learned in class.

---

# User Roles

## Admin

* Manage users
* Manage products
* Manage categories
* View all inventory

## Staff

* View products
* Create products
* Update products
* Record stock movement

---

# Models

## User

* Full Name
* Email
* Password
* Avatar
* Role

---

## Category

* Name
* Description

---

## Product

* Name
* SKU
* Description
* Price
* Quantity
* Image
* Category (Reference)
* Created By (Reference)
* Deleted At

---

## Stock Movement

* Product (Reference)
* Quantity
* Type (Stock In / Stock Out)
* Note
* Recorded By (Reference)
* Created At

---

# Relationships

* One Category → Many Products
* One User → Many Products
* One Product → Many Stock Movements
* One User → Many Stock Movements

---

# Features

## Authentication

* Register
* Login
* Logout
* Change Password

---

## Categories

* Create
* View
* Update
* Delete

---

## Products

* Create
* Read
* Update
* Delete
* Restore
* Upload Product Image

---

## Stock

* Record Stock In
* Record Stock Out
* View Stock History

---

## Search & Filtering

* Search product name
* Filter by category
* Sort by price
* Sort by quantity
* Pagination

---

## Security

* JWT Authentication
* Authorization
* Password Hashing
* Helmet
* CORS
* Rate Limiting
* Validation
* Error Handling

---

# Learning Outcomes

Students should demonstrate they can:

* Build REST APIs
* Design business models
* Manage inventory data
* Implement authentication
* Protect routes
* Build reusable backend architecture
