# Awards evaluation quiz

A Typeform-style quiz for scoring projects on **Creativity**, **Usefulness**, and **Demo**. An organizer invites the judges, pastes the project list, and shares one link. Each invited email can vote once. A public board ranks the projects by average score.

Created by [@aferrari](https://x.com/aferrari) and [@christianmock](https://x.com/christianmock). Free to use, change, and repurpose under the [MIT License](LICENSE).

[![MIT License](https://img.shields.io/badge/license-MIT-black)](LICENSE)

| Quiz | Results |
| :---: | :---: |
| <img src="docs/quiz.jpg" alt="Quiz screen scoring Large Language Wars. Creativity and Demo are 10, Usefulness is 9, each score picked from a row of Grok bot stickers." width="420"> | <img src="docs/results.jpg" alt="Dark awards results board. Rolo Bot leads at 8.7, followed by Founder Haus Automations, Large Language Wars, Memo Health, and Tripwise. Each row shows Creativity, Usefulness, and Demo." width="420"> |
| One screen per project. Pick 0–10 on each criterion, then press Enter. | Anyone can open the live board. It shows averages. A single judge's ballot stays private. |

Example of this app, run by the authors: [quiz](https://grokbot-awards-form.vercel.app) · [results](https://grokbot-awards-form.vercel.app/results). That deployment is an example. Your own copy keeps its votes, invited emails, and admin secret in your database.

## How it works

Three pages, one database.

1. **Setup** (`/setup`) is for the organizer. They enter `ADMIN_SECRET`, paste invited email addresses, and paste the projects. The app stores both in Postgres and creates the tables on first use.
2. **Quiz** (`/`) is for a judge. They enter the invited email. The app checks that the address is on the list and has not voted yet, then walks through the projects one at a time.
3. **Results** (`/results`) is public. It ranks every project by the average of Creativity, Usefulness, and Demo, and shows each criterion's average beside it.

A ballot is the whole quiz: every project, all three scores, saved together. Scores are integers from 0 to 10. A project's overall score is the average of its three criteria. The board sorts by that overall score.

Individual ballots stay in the database. The public board and `GET /api/results` return averages and vote counts. They do not return judge names, email addresses, or per-judge scores. The invited list is returned only to a request that presents the admin secret.

Limits: 40 projects, 500 invited emails, project names up to 120 characters, descriptions up to 400.

Saving the voter list on its own leaves existing votes in place. Replacing the project list deletes every saved vote, because the ballot has to match the current quiz.

## How to use it

### Organizer

1. Deploy the app, or run it locally, with `DATABASE_URL` and `ADMIN_SECRET` set. Generate the secret with `openssl rand -base64 32`.
2. Open `/setup` and enter that secret. Leave the field to load the current voter list.
3. Paste invited emails, one per line, and save the list if you want to update voters without touching projects.
4. Paste projects, one per line. An optional description goes after a pipe:

```
Inbox Triage | Sorts support mail into a daily brief
Standup Bot
Research Desk | Pulls sources before a meeting
```

5. Create the quiz. The page asks you to confirm, because this replaces the project list and deletes saved votes.
6. Share `/` with the judges. Point everyone else at `/results`.

The same secret authorizes `POST /api/quiz` and `POST /api/voters` if you would rather script the setup. See [API](#api).

### Judge

1. Open `/`.
2. Enter the email address you were invited with.
3. On each project, score Creativity, Usefulness, and Demo from 0 to 10. The sticker row is the scale: 0 is the number button, 1–10 are the bots. Press **OK** or **Enter** to continue. **Back** returns to the previous project.
4. Submit on the last project. That email cannot vote again.

### Anyone watching

Open `/results`. The board lists projects from highest overall score to lowest, with the three criterion averages and how many judges have submitted. No login.

## Run it locally

You need Node.js 20.9 or newer and a [Neon](https://neon.tech) Postgres database. The app talks to Postgres through the Neon serverless driver, so `DATABASE_URL` has to be a Neon connection string.

```bash
npm install
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Your Neon connection string. The quiz, results, and setup all need it. |
| `ADMIN_SECRET` | Secret the organizer types on `/setup`. If it is unset, setup cannot load or change the quiz. |

```bash
npm run dev
```

Then open http://localhost:3000/setup, create the quiz, vote at http://localhost:3000, and watch http://localhost:3000/results.

If the quiz says the database is not configured, `DATABASE_URL` is missing or the server started before `.env.local` existed. Set it and restart `npm run dev`. If setup says `ADMIN_SECRET` is not set, do the same for that variable. A secret that does not match is rejected and does not change any votes.

Do not commit `.env.local`. [`.env.example`](.env.example) has placeholders only.

## Deploy your own copy

Nothing in this repository points at the authors' Vercel project or database. You create both. A new database starts empty.

### Vercel

1. Push this repo to a Git account you control.
2. Create a Neon project and copy its pooled connection string.
3. Import the repo as a new project in your Vercel account.
4. Set `DATABASE_URL` and `ADMIN_SECRET` for Production.
5. Deploy.
6. Open `https://<your-domain>/setup`, enter the admin secret, and add voters and projects.
7. Share `https://<your-domain>/` with judges. Rankings are at `https://<your-domain>/results`.

### Your own server

```bash
npm install
npm run build
npm run start
```

The server listens on port 3000. Put a reverse proxy in front of it when you want a public hostname, then open `/setup` on that hostname.

## API

| Method | Path | Access | Behavior |
| --- | --- | --- | --- |
| `GET` | `/api/quiz` | Public | Project list. No voter emails. |
| `GET` | `/api/quiz` | Admin | Project list and invited emails. |
| `POST` | `/api/quiz` | Admin | Replace the quiz. Deletes saved votes. |
| `POST` | `/api/voters` | Admin | Replace the invited voter list. Votes stay. |
| `POST` | `/api/eligibility` | Public | Check that an email may vote. |
| `POST` | `/api/submissions` | Invited voter | Store one ballot. |
| `GET` | `/api/results` | Public | Average scores and rankings. No per-judge rows. |

Admin requests send `Authorization: Bearer <ADMIN_SECRET>`.

`POST /api/quiz` accepts plain text, a JSON array of names, or:

```json
{
  "projects": [{ "name": "Standup Bot", "description": "Optional" }],
  "allowedEmails": ["judge@example.com"]
}
```

`POST /api/voters` replaces the invited list without changing projects:

```json
{ "allowedEmails": ["judge@example.com"] }
```

## Credits

**Application.** [@aferrari](https://x.com/aferrari) and [@christianmock](https://x.com/christianmock), 2026.

**Score icons.** The faces on the 1–10 scale, and the marks on the results board, are the black-and-white [Grok bot](https://x.ai) sticker set, stored in `public/bots`. Those drawings belong to xAI. Keep them only if you have the right to use them, and replace the files in `public/bots` when you repurpose the app under another name or brand.

**Stack.** [Next.js](https://nextjs.org) and React, [Neon](https://neon.tech) Postgres via `@neondatabase/serverless`, and Tailwind CSS.

Security reports go to the repository owners. See [SECURITY.md](SECURITY.md). Do not open a public issue for a vulnerability.

## License

[MIT](LICENSE). Copyright (c) 2026 aferrari and christianmock.

You can use this app, copy it, change it, and ship your own version, including for a paid event or inside another product. The only requirement is to keep the copyright notice and the license text with the code, so credit stays attached when someone redistributes it.

MIT is the fit for that: a short, well-known license that permits reuse and repurposing, including commercial use, and asks only that the copyright line travel with the software. A changed copy can stay private.

The license covers the application code and this documentation. The Grok bot stickers are separate. See [Credits](#credits).
