# Awards evaluation quiz

Typeform-style quiz for rating a list of projects on **Creativity**, **Usefulness**, and **Demo** (0–10 stars). The list can be any length up to 40.

## Links (production)

- **Quiz:** https://grokbot-awards-form.vercel.app
- **Results:** https://grokbot-awards-form.vercel.app/results
- **Create or refresh the quiz:** https://grokbot-awards-form.vercel.app/setup

## Create the quiz

Set `QUIZ_ADMIN_TOKEN` on the server (Vercel env). Then open `/setup`, paste one project per line, and submit. That replaces the current quiz and deletes every saved vote.

```
Inbox Triage | Sorts support mail into a daily brief
Standup Bot
Research Desk | Pulls sources before a meeting
```

The same list can be sent to `POST /api/quiz` with `Authorization: Bearer $QUIZ_ADMIN_TOKEN`. The body can be that plain text, a JSON array of names, or:

```json
{ "projects": [{ "name": "Standup Bot", "description": "Optional" }] }
```

## Stack

- Next.js on [alexandreferrari](https://vercel.com) Vercel account
- Neon Postgres (`DATABASE_URL` on Vercel)
- GitHub: [aferrari/grokbot-awards-form](https://github.com/aferrari/grokbot-awards-form)
