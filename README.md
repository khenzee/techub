# Techub

Local setup:

1. Create a `.env` file at the project root (do NOT commit it). Example keys:

```
OPUSE_API_KEY=your-opuse-api-key
SOL_API_KEY=your-sol-api-key
```

2. Install dependencies (add Swagger packages):

```bash
npm install
npm install --save swagger-ui-express
```

3. Start the app:

```bash
npm start
```

4. API documentation is available at `http://localhost:5000/api-docs` once the server is running.

Notes:
- The project serves an OpenAPI spec at `/api-docs` using `swagger.json` at the project root.
- To extend documentation, edit `swagger.json` or add JSDoc comments in route files and switch to `swagger-jsdoc`.

Security reminder: If you accidentally shared a secret key, rotate/regenerate it immediately.
