# Security

## Reporting

Report security issues privately to the repository owners, [@aferrari](https://x.com/aferrari) and [@cristianmock](https://x.com/cristianmock). Do not open a public issue for a vulnerability.

## Secrets

This repository does not contain API keys, database URLs, or private keys. Runtime secrets belong in the environment:

- `DATABASE_URL` — Neon Postgres connection string
- `ADMIN_SECRET` — shared secret for setup and voter-list changes

`.env*` files are gitignored. [`.env.example`](.env.example) has placeholders only. If `ADMIN_SECRET` is missing, admin actions are rejected.

## Public routes

These do not require the admin secret:

- `/` — the quiz
- `/results` and `GET /api/results` — rankings only. Per-judge scores and email addresses are not included
- `GET /api/quiz` without an `Authorization` header — project names and descriptions only
- `POST /api/eligibility` — checks whether an email may vote
- `POST /api/submissions` — one vote per allowlisted email

## Admin routes

These require `Authorization: Bearer <ADMIN_SECRET>`:

- `GET /api/quiz` when the allowed email list is included
- `POST /api/quiz` — replaces the quiz and deletes saved votes
- `POST /api/voters` — replaces the allowed email list

`/setup` collects the secret in page memory and sends it as that header. The secret is not written into the repository.

## Data

Allowed emails, voter emails, and scores are stored in Neon Postgres. They are not committed to git. The allowed list is returned only to requests that present the admin secret.
