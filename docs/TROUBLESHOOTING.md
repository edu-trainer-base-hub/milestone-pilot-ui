# Troubleshooting

## CORS Error When Frontend Starts on a Different Port

If the browser console shows an error like this:

```text
Access to XMLHttpRequest at 'http://localhost:8080/auth/login' from origin 'http://localhost:5174' has been blocked by CORS policy.
```

it usually means the frontend is running on a port that the backend does not allow.

Example:

```text
Frontend: http://localhost:5174
Backend:  http://localhost:8080
```

Even though both use `localhost`, different ports are treated as different origins by the browser.

This can happen when another frontend development server is already running on port `5173`, so Vite starts a second instance on port `5174`.

## Fix

Check if another frontend server is already running.

Stop the duplicate server, then start the app again:

```bash
npm run dev
```

Make sure the app runs on:

```text
http://localhost:5173
```

If the frontend must run on another port, add that origin to the backend CORS configuration.

Example:

```text
http://localhost:5174
```

## How to Check the Actual Frontend URL

After running:

```bash
npm run dev
```

Vite prints the actual local URL:

```text
Local: http://localhost:5173/
```

Use that exact URL in the browser.

## Login Request Fails with `Network Error`

If Axios shows:

```text
API Error: No response received
Network Error
POST http://localhost:8080/auth/login net::ERR_FAILED
```

and the browser console also shows a CORS error, the backend may still be running correctly.

The request is being blocked by the browser because the frontend origin is not allowed by the backend CORS configuration.

To fix it:

1. Confirm the frontend is running on `http://localhost:5173`.
2. Stop duplicate frontend dev servers.
3. Restart the frontend.
4. If using another frontend port intentionally, update backend CORS allowed origins.
