# Moby Family: family screen and GET API integration

## Run on Windows PowerShell

From the project root:

```powershell
pnpm install
$env:PORT="5173"; $env:BASE_PATH="/"; $env:NODE_ENV="development"; pnpm --filter @workspace/moby-family dev
```

Open `http://localhost:5173/`.

## Backend URL

Create `artifacts/moby-family/.env.local` with the real backend origin, for example:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Use the actual backend URL/port from your Swagger environment. Restart Vite after changing the file. If the backend runs on another origin, configure CORS on the backend. Requests do not send authorization headers.

If `VITE_API_BASE_URL` is empty, requests go to the same origin as Vite. For a backend on another port, set the variable above.

## Files

- `artifacts/moby-family/src/config/userIds.ts`: hardcoded parent and child IDs for later replacement.
- `artifacts/moby-family/src/api/family.ts`: response types and six GET request functions. Each request catches network/HTTP/JSON errors and returns its mock fallback.
- `artifacts/moby-family/src/mocks/family.ts`: mock response data for all six GET endpoints.
- `artifacts/moby-family/src/App.tsx`: calls `GET /api/family/my` when parent opens Family; calls child, piggybank, tasks, transactions, and analytics GETs when parent opens a child profile.
- `artifacts/moby-family/src/index.css`: family tree uses normal grid flow, so child cards cannot overlap the confirmation button.
- `scripts/preinstall.cjs`: Windows-compatible root preinstall script.

## Implemented GET endpoints

1. `GET /api/family/my`
2. `GET /api/children/{child_id}`
3. `GET /api/children/{child_id}/piggybank`
4. `GET /api/children/{child_id}/tasks`
5. `GET /api/children/{child_id}/transactions?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`
6. `GET /api/child/analytics?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`

The transactions query parameter names `date_from` and `date_to`, and the analytics query parameter names `date_from` and `date_to`, are assumed because the provided description says the period boundaries are query parameters but does not specify exact names. Confirm these names in Swagger and adjust the URL strings in `src/api/family.ts` if the backend uses different names.

The analytics contract does not include `child_id` in its path. Therefore this implementation calls the provided `/api/child/analytics` path with only period query parameters, exactly as supplied; if backend expects child ID as a query parameter, that must be added after confirming the contract.

## Mock behavior

Each API function first tries the real request. If fetch fails, returns a non-2xx status, or response JSON parsing fails, that endpoint's mock object is returned. The console logs a warning. This is a temporary fallback; it can hide a backend error while the UI continues to show mock data, so check the browser console and Network tab while testing.

## User IDs

The provided family endpoint `GET /api/family/my` has no user ID path/query parameter in the supplied contract, and this project sends no auth headers. `PARENT_USER_ID` and `CHILD_USER_ID` are placeholders in `src/config/userIds.ts` and are not sent to these endpoints. Child IDs for parent-mode requests come from the `children[].id` returned by `GET /api/family/my`; the mock response uses placeholder IDs. Replace the mock IDs with valid UUIDs only if you want to test against data that the backend recognizes.

## Important field notes

- Family response uses `parents`, `children`, `family_id`, `balance_summary.amount` and `.currency`.
- Child profile response uses `child_info`, `balance_block`, `money_categories`, `most_recent_current_goal`, `pocket_money_settings`, `pending_tasks`, and `transactions_history`.
- Piggybank uses `total_saved_amount` and `goals`.
- Tasks use `tasks` and the task fields in the supplied contract.
- Transactions use `requested_period`, `summary`, `items`, and `related_entity`.
- Analytics uses `total_spent`, `period_start`, `period_end`, and `categories`.

The currently designed profile screen still contains some demo presentation cards. API calls are wired and their results are logged for verification, but not every returned field has yet been substituted into every visual card. The analytics contract also has a naming difference (`/api/child/analytics`, singular `child`) from the other endpoints; it is kept as supplied rather than silently changed.
