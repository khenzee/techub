# EduCore – School Management API

## Project Overview

EduCore is a School Management backend that allows administrators to manage departments, courses and student enrollments.

Students will apply the same backend architecture from the Blog CMS while working in the education domain.

---

# Objectives

Students should build a scalable backend that manages academic resources using REST APIs and MongoDB.

---

# User Roles

## Admin

* Manage users
* Manage departments
* Manage courses
* View enrollments

## Lecturer

* View assigned courses
* Update course information

## Student

* View courses
* Enroll in courses
* View own enrollments

---

# Models

## User

* Full Name
* Email
* Password
* Avatar
* Role

---

## Department

* Name
* Description

---

## Course

* Title
* Code
* Description
* Banner Image
* Department (Reference)
* Lecturer (Reference)
* Deleted At

---

## Enrollment

* Student (Reference)
* Course (Reference)
* Enrollment Date
* Status

-------------------------------

# Relationships

* One Department → Many Courses
* One Lecturer → Many Courses
* One Student → Many Enrollments
* One Course → Many Enrollments

---

# Features

## Authentication

* Register
* Login
* Logout
* Change Password

---

## Departments

* Create
* Read
* Update
* Delete

---

## Courses

* Create
* Read
* Update
* Delete
* Restore
* Upload Banner

---

## Enrollment

* Enroll Student
* View Enrollments
* Cancel Enrollment

------------------------------------------------

## Search & Filtering

* Search course title
* Filter by department
* Sort alphabetically
* Sort by newest
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

Students should be able to:

* Build structured REST APIs
* Work with one-to-many and many-to-many relationships
* Implement authentication and authorization
* Build reusable backend architecture
* Apply CRUD operations in a real-world domain
