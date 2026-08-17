# Backend 401: Securing the Techub API

Backend security is the practice of deciding what an API should trust, what it should reject, and what every user is allowed to do. A secure backend does not assume that requests are honest just because they came from the application's frontend.

This guide uses the current Techub Express and MongoDB API as a classroom security review. Each topic contains a brief explanation, an example from Techub or a closely related API scenario, and the secure direction to implement during class.

The goal is not to install a few security packages. The goal is to build layers of protection throughout the request lifecycle:

```text
Request
  -> Request limits
  -> Validation and sanitization
  -> Authentication
  -> Authorization and ownership
  -> Controller
  -> Service
  -> Database
  -> Safe response or centralized error handler
  -> Security logging
```

## Overview

### What students should learn

By the end of Backend 401, students should be able to:

- Build consistent error handling without repeating `try/catch` in every controller.
- Validate all untrusted input before it reaches application logic.
- Distinguish authentication from authorization.
- Prevent users from accessing or changing resources they do not own.
- Recognize injection, XSS, CSRF, SSRF, path traversal, and command injection.
- Protect authentication endpoints from brute-force and denial-of-service attacks.
- Handle passwords, JWTs, uploads, environment variables, and API responses safely.
- Add security headers, CORS rules, logging, monitoring, dependency checks, and API contracts.
- Organize an Express API so security checks happen in a predictable order.

### The Techub security baseline

Techub already has some useful foundations:

- Passwords are hashed with bcrypt in `src/utils/hashPass.js`.
- Protected routes read the authenticated user from the database.
- Article creation gets the author from `req.user`, not from `req.body`.
- Comment deletion checks for an owner or administrator.
- `.env` is listed in `.gitignore`.

However, the current project also gives us realistic security problems to fix:

- Registration accepts `role` from the public request body.
- Role middleware sends `403` but still calls `next()`.
- Authors can update or delete articles without an ownership check.
- Login selects the password incorrectly and returns different account-related errors.
- Controllers return raw `error.message` values.
- Inputs, MongoDB IDs, upload sizes, and query sizes are not consistently validated.
- The API has no rate limiting, Helmet configuration, CORS allowlist, or global error handler.

### Core rule

Treat every value outside the trusted application boundary as untrusted:

```text
req.body
req.params
req.query
req.headers
uploaded files
JWTs and cookies
webhook data
URLs supplied by users
database records created from earlier user input
```

Validation asks, "Is this value allowed?" Authentication asks, "Who is this user?" Authorization asks, "May this user perform this action on this resource?"

---

## 1. Centralized Error Handling

Centralized error handling removes repeated `try/catch` response code from controllers and prevents internal error details from leaking to clients.

### Techub example

Several controllers currently return raw errors:

```js
return res.status(500).json({
  message: "internal server error",
  error: error.message
});
```

MongoDB, JWT, and Cloudinary messages may reveal implementation details. Controllers also use different error response shapes.

### Secure direction

Create a custom operational error:

```js
export class AppError extends Error {
  constructor(message, statusCode, code = "REQUEST_FAILED") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}
```

Wrap asynchronous controllers:

```js
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
```

Finish the middleware chain with one error handler:

```js
export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: statusCode === 500 ? "Internal server error" : error.message
    }
  });
};
```

Use correct status codes: `400` invalid input, `401` unauthenticated, `403` forbidden, `404` missing resource, `409` conflict, `422` valid JSON that fails business rules, and `500` unexpected server failure.

---

## 2. Input Validation

Never trust `req.body`, `req.params`, or `req.query`. Validate type, format, length, allowed values, and unexpected fields before running a controller.

### Techub example

Registration currently checks only whether a few values exist. It accepts `role`, has no strong password rule, and does not enforce email or username formats.

### Secure direction

Use a schema library such as Zod, Joi, or express-validator. With Zod:

```js
const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  lastname: z.string().trim().min(2).max(50),
  username: z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9_]+$/),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(12).max(128)
}).strict();
```

The strict schema rejects unexpected fields such as a public `role: "admin"`. Validate MongoDB IDs too:

```js
if (!mongoose.isValidObjectId(req.params.id)) {
  throw new AppError("Invalid article ID", 400, "INVALID_ID");
}
```

Validation is an API boundary control. Mongoose schema validation should remain as a second layer, and updates should use `runValidators: true`.

---

## 3. Authentication

Authentication proves who is making a request. It includes password verification, token creation, token verification, expiration, and session lifecycle decisions.

### Techub example

The login query currently uses `.select("-password")`, but the password is already excluded by the model and is required for `bcrypt.compare()`.

### Secure direction

Explicitly select the password only for login, use a generic failure message, and never return the hash:

```js
const user = await User.findOne({ username }).select("+password");

if (!user || !(await bcrypt.compare(password, user.password))) {
  throw new AppError("Invalid username or password", 401, "INVALID_CREDENTIALS");
}
```

Use short-lived access tokens, authenticate protected routes with middleware, and design refresh, logout, and invalidation behavior rather than treating token creation as the whole authentication system.

---

## 4. Authorization

Authentication answers "Who are you?" Authorization answers "What are you allowed to do?"

### Techub example

Techub uses role middleware, but `isRole()` currently continues to the controller after sending `403`:

```js
if (!role.includes(req.user.role)) {
  res.status(403).json({ message: "Forbidden: Unauthorized role" });
}
next();
```

### Secure direction

Stop the middleware when access is denied:

```js
export const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError("Forbidden", 403, "FORBIDDEN"));
  }

  next();
};
```

Use roles for broad capabilities, such as admin-only category management. Use ownership checks for individual resources, such as an author editing an article they created.

---

## 5. Broken Access Control and IDOR

Insecure Direct Object Reference occurs when a user changes a resource ID and gains access to another user's data.

### Techub example

The article update and delete controllers find an article by `req.params.id`, but they do not compare `article.author` with `req.user._id`. An author could change the ID and edit another author's article.

### Secure direction

Load the resource, then check ownership before changing it:

```js
const article = await Article.findById(req.params.id);

if (!article) {
  throw new AppError("Article not found", 404, "ARTICLE_NOT_FOUND");
}

const isOwner = article.author.equals(req.user._id);
const isAdmin = req.user.role === "admin";

if (!isOwner && !isAdmin) {
  throw new AppError("Forbidden", 403, "FORBIDDEN");
}
```

The important question for every resource endpoint is: "Does this authenticated user have permission to act on this exact object?" In some applications, returning `404` instead of `403` is useful when even revealing the resource's existence would expose information.

---

## 6. NoSQL Injection

NoSQL injection happens when attacker-controlled objects or operators alter a MongoDB query.

### Techub example

Code such as this becomes dangerous if `email` is allowed to be an object:

```js
User.findOne({ email: req.body.email });
```

An attacker may submit query operators such as `$ne`, `$gt`, or `$regex` instead of a string.

### Secure direction

Require primitive values, build query objects yourself, and allow only known filters:

```js
const email = registerSchema.shape.email.parse(req.body.email);
const user = await User.findOne({ email });
```

Do not pass `req.body` or `req.query` directly into Mongoose methods. Sanitization middleware can add another layer, but it does not replace schema validation and query allowlists.

---

## 7. SQL Injection

SQL injection occurs when untrusted input changes the structure of an SQL statement. Techub uses MongoDB, but students should recognize this risk in relational databases.

### Insecure example

```js
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;
```

### Secure direction

Use parameterized queries or prepared statements:

```js
const result = await db.query(
  "SELECT id, email FROM users WHERE email = $1",
  [req.body.email]
);
```

The database receives query structure and user data separately, so the input cannot become executable SQL syntax.

---

## 8. Cross-Site Scripting (XSS)

XSS occurs when attacker-controlled content is rendered as executable JavaScript in another user's browser. Stored XSS is especially relevant to blog articles, comments, usernames, and profiles.

### Techub example

Techub stores article `content` and comment `text` without defining whether those fields contain plain text, Markdown, or trusted HTML.

### Secure direction

Choose a content policy:

- Plain text: store text and rely on frontend output encoding.
- Markdown: store Markdown and render it with a safe parser and HTML sanitizer.
- HTML: sanitize with a strict allowlist before rendering.

Never fix XSS by removing only `<script>` tags. Event handlers, dangerous URLs, SVG, and malformed markup can also execute code. Add Content Security Policy as defense in depth, not as a replacement for encoding and sanitization.

---

## 9. Cross-Site Request Forgery (CSRF)

CSRF tricks a browser into sending an unwanted authenticated request. It matters when credentials are attached automatically, especially cookies.

### Techub example

Techub currently expects a bearer token in the `Authorization` header, so classic cookie-based CSRF is less direct. If refresh tokens move to cookies, CSRF protection becomes necessary.

### Secure direction

For authentication cookies:

- Use `HttpOnly`, `Secure`, and an appropriate `SameSite` setting.
- Require a CSRF token for state-changing requests when needed.
- Validate `Origin` or `Referer` as an additional check.
- Do not use `GET` for state changes.

CSRF defenses and CORS solve different problems. CORS alone is not a complete CSRF defense.

---

## 10. CORS Misconfiguration

CORS tells browsers which frontend origins may read responses from the API. It is not authentication and does not stop direct requests from scripts, servers, Postman, or curl.

### Techub example

Techub has no explicit CORS policy. A common unsafe classroom shortcut is `origin: "*"` without considering credentials or deployment environments.

### Secure direction

Allow known frontend origins:

```js
const allowedOrigins = new Set(process.env.CORS_ORIGINS.split(","));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    callback(new AppError("Origin not allowed", 403, "CORS_DENIED"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"]
}));
```

Use separate origin lists for development, staging, and production.

---

## 11. Rate Limiting

Rate limiting restricts how frequently a client can call an endpoint. Different routes need different limits.

### Techub example

`/register`, `/login`, comments, likes, and upload routes currently have no request limits.

### Secure direction

Apply a general API limit and stricter authentication limits:

```js
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Try again later" } }
});

router.post("/login", loginLimiter, validate(loginSchema), Login);
```

For multiple server instances, use a shared store such as Redis. IP limits are useful, but account-based controls are also needed because attackers can rotate IP addresses.

---

## 12. Brute-Force Attacks

Brute-force and credential-stuffing attacks repeatedly test passwords against accounts.

### Techub example

Login currently reveals "user not found" and "incorrect password" separately, which helps attackers enumerate usernames.

### Secure direction

- Return the same public message for invalid usernames and passwords.
- Rate-limit by IP and normalized account identifier.
- Add progressive delays or temporary throttling where appropriate.
- Require strong passwords and monitor repeated failures.
- Avoid permanent account lockout that attackers can abuse to deny service to users.

Log suspicious attempts without logging submitted passwords or full tokens.

---

## 13. Security Headers

Security headers tell browsers how to handle content, transport, framing, referrers, and MIME types.

### Techub example

`src/app.js` currently installs `express.json()` and routes but no security headers.

### Secure direction

Start with Helmet:

```js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"]
    }
  }
}));
```

Explain the headers rather than treating Helmet as magic. Important examples include Content Security Policy, HSTS, `X-Content-Type-Options`, frame protection, and Referrer Policy. Test Swagger UI and the frontend because CSP must match the resources the application actually uses.

---

## 14. Sensitive Data Exposure

API responses should contain only the data the client needs. Internal fields must be excluded deliberately.

### Techub example

Registration returns the newly created `user` document. `select: false` protects normal queries, but a newly created in-memory document may still contain the password hash.

### Secure direction

Create explicit response objects:

```js
const publicUser = {
  id: user._id,
  name: user.name,
  lastname: user.lastname,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  role: user.role
};
```

Never return passwords, password hashes, refresh tokens, reset tokens, internal stack traces, secrets, or unnecessary personal data. Response DTOs make the safe contract visible.

---

## 15. Environment Variables and Secrets

Secrets belong outside source code, but using `.env` is only the beginning. Required configuration must be validated and loaded before dependent modules run.

### Techub example

Cloudinary reads environment variables when `upload.middleware.js` is imported. The current startup file loads dotenv after importing the application, so those values may be unavailable during module initialization.

### Secure direction

Load and validate configuration first:

```js
import "dotenv/config";

const required = ["MONGODB_URI", "JWT_SECRET", "CLOUDINARY_CLOUD_NAME"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
}
```

Keep `.env` in `.gitignore`, provide a secret-free `.env.example`, use long random secrets, rotate compromised values, and use a managed secret store in production.

---

## 16. Password Security

Passwords should be hashed with a slow password hashing algorithm. Hashing is one-way; encryption is reversible.

### Techub example

Techub correctly uses bcrypt with a work factor of 12. The missing layers are input policy, secure reset behavior, and session invalidation after password changes.

### Secure direction

- Use bcrypt or Argon2, never plaintext or reversible encryption.
- Prefer length over complicated composition rules; allow long passphrases.
- Set a reasonable maximum length to prevent resource abuse.
- Check new passwords before hashing.
- Generate reset tokens with `crypto.randomBytes()`.
- Store only a hash of the reset token and give it a short expiration.
- Invalidate existing sessions after a successful reset when appropriate.

Never log passwords, even when debugging failed authentication.

---

## 17. JWT Security

JWTs are signed containers, not encrypted storage and not a complete session-management system.

### Techub example

Techub creates a seven-day access token and verifies it with only `JWT_SECRET`. There is no refresh-token rotation, logout invalidation, issuer, audience, or session identifier.

### Secure direction

```js
const token = jwt.sign(
  { sub: user._id.toString(), type: "access" },
  process.env.JWT_SECRET,
  {
    algorithm: "HS256",
    expiresIn: "15m",
    issuer: "techub-api",
    audience: "techub-web"
  }
);
```

Verify the expected algorithm, issuer, audience, token type, and expiration. Keep sensitive data out of the payload because anyone holding the token can decode it. Use rotated refresh tokens or server-side sessions for longer login lifetimes, and design revocation for logout, password changes, and compromised devices.

---

## 18. File Upload Vulnerabilities

Uploaded files can consume storage, hide malicious content, overwrite files, or exploit later processing.

### Techub example

Techub restricts Cloudinary formats but has no `fileSize`, file-count, or field-count limits. The same upload configuration allows PDFs even for avatars, and registration uploads a file before validating user fields.

### Secure direction

```js
const uploadAvatar = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
    fields: 10
  },
  fileFilter(req, file, callback) {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    callback(null, allowed.has(file.mimetype));
  }
});
```

Validate request fields before expensive upload work where the middleware design permits it. Verify actual file content, generate server-controlled names, store outside executable directories, restrict public access when required, and delete abandoned uploads when later processing fails.

---

## 19. Path Traversal

Path traversal occurs when user-controlled paths escape an allowed directory using values such as `../`.

### Techub example

Techub currently uses Cloudinary, but this becomes relevant if local uploads, exports, templates, or download endpoints are added.

### Secure direction

Do not accept complete filesystem paths from users. Use server-generated file identifiers and verify the resolved path:

```js
const uploadRoot = path.resolve("uploads");
const filePath = path.resolve(uploadRoot, safeServerFilename);

if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) {
  throw new AppError("Invalid file path", 400, "INVALID_PATH");
}
```

Checking only for the literal string `..` is not sufficient because paths can be encoded or normalized in different ways.

---

## 20. Command Injection

Command injection occurs when untrusted input becomes part of an operating-system shell command.

### Insecure example

```js
exec(`convert ${req.body.filename} output.png`);
```

### Secure direction

Avoid shell commands when a library API can perform the operation. If a process is necessary, use a non-shell API with fixed executable and separate arguments, validate every allowed value, and apply timeouts and resource limits.

```js
spawn("convert", [trustedInputPath, trustedOutputPath], { shell: false });
```

Do not try to make arbitrary shell input safe by removing a few special characters.

---

## 21. Server-Side Request Forgery (SSRF)

SSRF tricks a backend into requesting an unintended URL, including private services that are not exposed to the public internet.

### Techub example

Techub does not currently fetch user-provided URLs. The risk appears if it adds remote image import, article previews, webhooks, or URL metadata.

### Secure direction

- Prefer an allowlist of approved hosts and protocols.
- Allow only `https` where possible.
- Resolve DNS and block loopback, private, link-local, and cloud metadata addresses.
- Recheck redirects instead of trusting the first URL only.
- Set connection, response, and total timeouts.
- Limit response size and content type.

Network-level egress rules should back up application validation.

---

## 22. Denial of Service

Denial of service occurs when requests consume enough CPU, memory, database capacity, bandwidth, or storage to make the API unavailable.

### Techub example

Article, category, and comment list endpoints return unbounded results. JSON body size and uploads also lack explicit limits.

### Secure direction

```js
app.use(express.json({ limit: "100kb" }));
```

Add rate limits, pagination, maximum page sizes, database indexes, query timeouts, upload limits, and request timeouts. Avoid expensive synchronous operations and unbounded arrays or database queries. Return only required fields with `.select()`.

---

## 23. Regular Expression Denial of Service (ReDoS)

Some regular expressions can consume extreme CPU time on carefully constructed input. Database regex queries can also trigger expensive scans.

### Techub example

Backend 201 demonstrates building a MongoDB `$regex` search directly from `req.query.search`. Long or special input can produce expensive queries.

### Secure direction

- Limit search input length.
- Escape user input when the intention is literal search.
- Avoid complex nested regex patterns.
- Prefer indexed search or a dedicated search engine for large datasets.
- Limit query duration and result count.

```js
const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
query.title = { $regex: escaped, $options: "i" };
```

Test important regex patterns with hostile long inputs, not only normal examples.

---

## 24. Prototype Pollution

Prototype pollution occurs when unsafe object merging allows keys such as `__proto__`, `constructor`, or `prototype` to modify inherited JavaScript behavior.

### Techub example

Techub should avoid future update code such as `Object.assign(target, req.body)` or deep-merging arbitrary request objects into configuration.

### Secure direction

Use validation schemas and explicit allowlists:

```js
const updates = {
  name: validated.name,
  lastname: validated.lastname,
  avatar: validated.avatar
};
```

Keep Express and utility dependencies updated, avoid unsafe recursive merge helpers, and use null-prototype objects for untrusted key maps when appropriate.

---

## 25. Dependency Vulnerabilities

An application inherits risk from both direct dependencies and transitive dependencies installed by those packages.

### Techub example

Techub depends on Express, Mongoose, Multer, Cloudinary packages, JWT, bcrypt, Swagger UI, and their dependency trees.

### Secure direction

Use routine checks:

```bash
npm audit
npm outdated
```

Review the severity, exploitability, affected runtime path, and recommended upgrade instead of applying updates blindly. Commit the lockfile, remove unused packages, keep development tools in `devDependencies`, and use automated dependency update and secret-scanning tools in CI.

---

## 26. Security Misconfiguration

Security misconfiguration is an unsafe setting or missing production control rather than one isolated coding bug.

### Techub example

Current examples include raw stack-related error messages, public Swagger documentation, no CORS allowlist, no security headers, missing environment validation, and starting the server even if MongoDB connection fails.

### Secure direction

- Fail startup when required configuration or database connectivity is missing.
- Disable detailed production errors and debug settings.
- Restrict or disable API documentation in production when appropriate.
- Remove default credentials and unnecessary endpoints.
- Use TLS and configure trusted proxies correctly.
- Give the application and database the minimum required permissions.
- Maintain separate reviewed configuration for development, test, staging, and production.

Security is the result of many correct settings working together.

---

## 27. Logging and Monitoring

Security logging creates an audit trail and helps detect attacks. Logs must be useful without becoming a source of sensitive data exposure.

### Techub example

Techub currently has console messages for startup and database errors but no structured request, authentication, or administrative audit logging.

### Secure direction

Log events such as:

- Login failures and rate-limit events.
- Invalid or expired authentication attempts.
- Authorization failures.
- Server errors with an internal request ID.
- Article deletion and important admin actions.
- Suspicious upload, query, or validation failures.

Include timestamp, event type, request ID, route, status, and a safe user identifier. Never log passwords, full JWTs, cookies, reset tokens, database credentials, or unnecessarily detailed personal data. Monitoring must alert someone when thresholds are exceeded.

---

## 28. API Documentation and Contracts

An OpenAPI contract defines what the API accepts and returns. A complete contract supports validation, testing, client development, and security review.

### Techub example

Techub serves Swagger UI, but `swagger.json` documents only a small part of the API and does not define bearer authentication or consistent error responses.

### Secure direction

Document:

- Every endpoint and HTTP method.
- Path, query, and body schemas.
- Required authentication and allowed roles.
- Success and error responses.
- Pagination limits and allowed filters.
- Upload type and size constraints.

Keep documentation synchronized with runtime validation. The contract should describe accepted behavior, not expose secrets or internal implementation details.

---

## 29. Pagination, Limits, and Query Protection

Pagination protects memory, bandwidth, and database capacity. Query parameters need the same validation as request bodies.

### Techub example

The current article, category, and comment list endpoints can return every matching document. An endpoint must not accept `limit=999999999` or arbitrary sort fields.

### Secure direction

```js
const page = Math.max(Number(req.query.page) || 1, 1);
const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

const allowedSorts = new Set(["createdAt", "title"]);
const sortBy = allowedSorts.has(req.query.sortBy)
  ? req.query.sortBy
  : "createdAt";
```

Allowlist filter and sort fields, set default and maximum limits, use stable sorting, add supporting indexes, and consider cursor pagination for large or frequently changing datasets.

---

## 30. Secure API Architecture

Secure architecture makes the correct order of checks obvious and reusable. Controllers should coordinate a request, not contain every concern.

### Target request flow

```text
Route
  -> Request limit
  -> Validation
  -> Authentication
  -> Role and ownership authorization
  -> Controller
  -> Service
  -> Model/database
  -> Response DTO
  -> Central error handler
```

### Target Techub structure

```text
src/
  config/
  controllers/
  errors/
  middleware/
  models/
  routes/
  services/
  utils/
  validators/
```

Example article route:

```js
router.patch(
  "/:id",
  articleWriteLimiter,
  validate(articleIdSchema, "params"),
  validate(updateArticleSchema, "body"),
  protect,
  allowRoles("author", "admin"),
  requireArticleOwnerOrAdmin,
  asyncHandler(updateArticle)
);
```

Each layer has one clear responsibility. Security checks are easier to test and harder to forget.

---

## Core Security Module

If class time is limited, teach and implement these topics first:

1. Centralized error handling and safe responses.
2. Input validation and strict field allowlists.
3. Authentication, password handling, and JWT expiration.
4. Authorization, role checks, resource ownership, and IDOR prevention.
5. NoSQL injection and protected query construction.
6. XSS content policy and output safety.
7. CSRF and CORS boundaries.
8. Brute-force defense, rate limiting, and denial-of-service limits.
9. Sensitive data and secrets management.
10. Secure file uploads and path handling.
11. Command injection and SSRF awareness.
12. Dependency review and production security configuration.

## Suggested Class Implementation Order

Use the existing Techub problems as practical exercises:

1. Add `AppError`, `asyncHandler`, a not-found middleware, and a global error handler.
2. Add validation schemas for registration, login, article IDs, article writes, and list queries.
3. Remove public role assignment and return a safe user response object.
4. Correct login password selection and use one invalid-credentials response.
5. Correct `isRole()` so denied requests cannot reach controllers.
6. Add article owner-or-admin checks for update and delete.
7. Harden access-token verification and design refresh and logout behavior.
8. Add login, registration, upload, and general API rate limits.
9. Configure Helmet, a CORS allowlist, JSON limits, and trusted proxy settings.
10. Restrict avatar uploads by type, content, count, and size.
11. Add pagination and allowlisted sorting/filtering to list endpoints.
12. Add structured security logs, complete OpenAPI documentation, tests, and dependency checks.

## Final Security Review Questions

Before calling an endpoint secure, ask:

- Is every external value validated before use?
- Can the user assign fields they should not control?
- Does the endpoint require authentication?
- Does it verify role and ownership for this exact resource?
- Could input change a database query, HTML page, file path, command, or outbound URL?
- Are request size, query size, upload size, and request frequency bounded?
- Could the response or logs expose secrets or personal data?
- Is the failure response consistent and safe?
- Is the security event logged without sensitive values?
- Is the behavior documented and tested?

Backend security is not one middleware or one lesson. It is a chain of deliberate checks, safe defaults, limited privileges, and observable behavior from the first request byte to the final response.
