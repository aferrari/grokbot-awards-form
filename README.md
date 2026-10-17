# Awards evaluation quiz

Typeform-style quiz for rating projects on **Creativity**, **Usefulness**, and **Demo** (0–10). A quiz can include up to 40 projects. Only invited email addresses can vote, and each address can vote once.

Created by [@aferrari](https://x.com/aferrari) and [@christianmock](https://x.com/christianmock). Licensed under the [MIT License](LICENSE).

## How to use it

There are two roles.

**Organizer.** Configure the database and admin secret, open `/setup`, invite voters, and paste the project list.

**Voter.** Open `/`, enter the invited email, and rate every project from 0 to 10 on Creativity, Usefulness, and Demo. Each email can vote once.

Anyone can open `/results` to see average scores. Individual ballots stay private.

## Example deployment

The authors run one copy at https://grokbot-awards-form.vercel.app. That site is only an example. Deploy your own copy on your Vercel account or your own server. Your votes, invited emails, and admin secret stay in your database.

## Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string. The quiz, results, and setup all need it. |
| `ADMIN_SECRET` | Secret the organizer types on `/setup`. If it is unset, setup cannot load or change the quiz. |

```bash
npm run dev
```

Then:

1. Open http://localhost:3000/setup and enter `ADMIN_SECRET`.
2. Paste invited emails, one per line, and the project list. Create the quiz.
3. Open http://localhost:3000 and vote with one of those emails.
4. Open http://localhost:3000/results for the rankings.

Tables are created on first use.

If the quiz says the database is not configured, `DATABASE_URL` is missing or the server was started before `.env.local` existed. Set it and restart `npm run dev`. If setup says `ADMIN_SECRET` is not set, do the same for that variable. A secret that does not match is rejected and does not change any votes.

## Create a quiz

Open `/setup`, enter the admin secret, then paste invited voter emails (one per line) and the project list.

```
Inbox Triage | Sorts support mail into a daily brief
Standup Bot
Research Desk | Pulls sources before a meeting
```

Saving the voter list alone does not delete votes. Replacing the quiz deletes every saved vote.

The same project list can be sent to `POST /api/quiz` with `Authorization: Bearer <ADMIN_SECRET>`. The body can be plain text, a JSON array of names, or:

```json
{ "projects": [{ "name": "Standup Bot", "description": "Optional" }], "allowedEmails": ["judge@example.com"] }
```

`POST /api/voters` with the same header replaces the invited list without changing projects:

```json
{ "allowedEmails": ["judge@example.com"] }
```

## API

| Method | Path | Access | Behavior |
| --- | --- | --- | --- |
| `GET` | `/api/quiz` | Public | Project list. No voter emails. |
| `GET` | `/api/quiz` | Admin | Project list and invited emails. |
| `POST` | `/api/quiz` | Admin | Replace the quiz. Deletes saved votes. |
| `POST` | `/api/voters` | Admin | Replace the invited voter list. |
| `POST` | `/api/eligibility` | Public | Check that an email may vote. |
| `POST` | `/api/submissions` | Invited voter | Store one ballot. |
| `GET` | `/api/results` | Public | Average scores and rankings. No per-judge rows. |

Admin requests send `Authorization: Bearer <ADMIN_SECRET>`.

## Deploy your own copy

Nothing in the repository points at the authors' Vercel project or database. You create both.

You need:

- Node.js 20.9 or newer
- A Neon Postgres database of your own. The app talks to Postgres through the Neon serverless driver, so `DATABASE_URL` must be a Neon connection string.
- A place to run the app: a new Vercel project in your account, or any server that can run Node

Generate the admin secret with `openssl rand -base64 32`. Put that value only in the host environment. Until it is set, `/setup` cannot load or change the quiz.

### Vercel, on your account

1. Push this repo to a Git account you control.
2. Create a project at [Neon](https://neon.tech) and copy its pooled connection string.
3. In your Vercel account, import that repo as a new project.
4. Set `DATABASE_URL` and `ADMIN_SECRET` for Production.
5. Deploy.
6. Open `https://<your-domain>/setup`, enter the admin secret, and add voters and projects.
7. Share `https://<your-domain>/` with voters. Rankings are at `https://<your-domain>/results`.

### Your own server

1. Clone the repo and copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to your Neon connection string and set a new `ADMIN_SECRET`.
3. Install, build, and start:

```bash
npm install
npm run build
npm run start
```

The server listens on port 3000. Put your reverse proxy in front of it when you want a public hostname. Then open `/setup` on that hostname and create the quiz.

Tables are created on the first request. A new database starts empty, so it does not contain the example quiz or its votes.

## Stack

- Next.js and React
- Neon Postgres (`@neondatabase/serverless`)
- Tailwind CSS
