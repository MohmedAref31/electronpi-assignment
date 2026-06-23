# API Documentation

This project uses **Postman** for API documentation and manual testing.

## Published docs

A browser-friendly HTML version of the collection is published on Postman Documenter:

- <https://documenter.getpostman.com/view/38028079/2sBXwwn7jo>

Use the **Run in Postman** button on that page to import the collection into your Postman workspace in one click.

## Files

| File | Description |
| --- | --- |
| `postman/project-task-api.postman_collection.json` | The Postman collection (v2.1) with all API requests, grouped by feature. |
| `postman/environment.example.json` | A Postman environment template containing collection variables (`baseUrl`, `token`, `projectId`, `taskId`). |

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
   - The collection's scripts automatically extract `data.token` from the response and set the `token` environment variable.
   - All authenticated requests use `Bearer {{token}}` in the `Authorization` header automatically.
   - Project and task create/list requests also auto-store `projectId` and `taskId` when available.

5. **Sorting and filtering**
   - List requests include ready-to-use query params for pagination, filtering, and sorting.
   - You can edit `sortBy` and `sortOrder` directly in Postman for project/task list endpoints.

## Conventions

- All request examples use the `{{baseUrl}}` and `{{token}}` environment variables.
- Each request includes example responses and expected status codes.
- Requests are grouped into folders: `Health`, `Auth`, `Projects`, `Admin - Projects`, `Tasks`, `Admin - Tasks`.
