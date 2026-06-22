# API Documentation

This project uses **Postman** for API documentation and manual testing.

## Files

| File | Description |
| --- | --- |
| `postman/project-task-api.postman_collection.json` | The Postman collection (v2.1) with all API requests. Requests are added incrementally as features are implemented. |
| `postman/environment.example.json` | A Postman environment template containing variables used by the collection (`baseUrl`, `token`). |

## How to Use

1. **Import the collection**
   - Open Postman → Import → Upload `postman/project-task-api.postman_collection.json`.

2. **Import the environment**
   - Postman → Environments → Import → Upload `postman/environment.example.json`.
   - Save it as e.g. "Project Task API - Local".

3. **Set the `baseUrl` variable**
   - Local run: `http://localhost:3000/api/v1`
   - Docker run: `http://localhost:3000/api/v1`

4. **Auth flow**
   - Call `Auth / Register` or `Auth / Login`.
   - The collection's "Scripts" automatically extracts the `access_token` from the response and sets the `token` environment variable.
   - All authenticated requests use `Bearer {{token}}` in the `Authorization` header automatically.

## Conventions

- All request examples use the `{{baseUrl}}` and `{{token}}` environment variables.
- Each request includes example responses and expected status codes.
- Requests are grouped into folders: `Auth`, `Projects`, `Tasks`.
