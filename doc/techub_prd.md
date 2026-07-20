# TechHub – Blog CMS API

## Project Overview

TechHub is a multi-user Blog Content Management System (CMS) that allows authors to create and manage articles while readers can browse and comment on published content. The system includes authentication, authorization, image uploads, searching, filtering, sorting, and pagination.

This project serves as the primary teaching project for learning professional backend development with Node.js, Express, MongoDB, and Mongoose.

---

# Objectives

Students should learn how to:

* Build a REST API
* Structure a professional backend project
* Design MongoDB relationships
* Implement authentication & authorization
* Perform CRUD operations
* Handle file uploads
* Implement search, filtering, sorting and pagination
* Write reusable services and middleware
* Build production-ready APIs

---

# User Roles

## Admin

* Manage all users
* Manage all categories
* Manage all articles
* Delete any comment

## Author

* Create articles
* Update own articles
* Delete own articles
* Upload article thumbnails
* View own dashboard

## Reader

* Register/Login
* Read published articles
* Comment on articles
* Update own profile

---

# Models

## User

* Full Name
* Email
* Password
* Avatar
* Role
* Email Verified
* Created At
* Updated At

---

## Category

* Name
* Slug
* Description

---

## Article

* Title
* Slug
* Content
* Thumbnail
* Status (Draft / Published)
* Category (Reference)
* Author (Reference)
* Created At
* Updated At
* Deleted At (Soft Delete)

---

## Comment

* Comment
* User (Reference)
* Article (Reference)
* Created At

---

# Relationships

* One User → Many Articles
* One Category → Many Articles
* One Article → Many Comments
* One User → Many Comments

---

# Features

## Authentication

* Register
* Login
* Logout
* Change Password
* Forgot Password
* Reset Password
* Email Verification

---

## User

* View Profile
* Update Profile
* Upload Avatar

---

## Categories

* Create Category
* View Categories
* Update Category
* Delete Category

---

## Articles

* Create Article
* Get All Articles
* Get Single Article
* Update Article
* Delete Article
* Restore Deleted Article
* Upload Thumbnail

---

## Comments

* Add Comment
* View Comments
* Delete Comment

---

## Search & Filtering

* Search by title
* Filter by category
* Filter by author
* Sort newest/oldest
* Pagination

---

## Security

* JWT Authentication
* Role Authorization
* Password Hashing
* Helmet
* CORS
* Rate Limiting
* Validation
* Error Handling

---

# Learning Outcomes

By completing this project students should understand:

* REST APIs
* CRUD Operations
* Authentication
* Authorization
* MongoDB Relationships
* Mongoose
* Middleware
* Controllers
* Services
* Validation
* Security
* Professional Backend Architecture
