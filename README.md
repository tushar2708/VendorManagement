# VendorManagement

A web application for managing an organization's vendors — the companies and
individuals that supply goods and services. It centralizes vendor records,
contracts, and communications so procurement and finance teams have a single,
reliable source of truth.

## What it does

Vendor Management replaces scattered spreadsheets and email threads with one
place to onboard, track, and evaluate suppliers across their lifecycle.

### Core features

- **Vendor directory** — Maintain a searchable catalog of vendors with contact
  details, categories, tax/legal identifiers, and status (active, pending,
  suspended, archived).
- **Onboarding** — Capture the documents and approvals a new vendor needs
  (registration details, banking info, compliance documents) through a guided
  intake flow.
- **Contracts & renewals** — Store contract terms, start/end dates, and renewal
  reminders so agreements don't lapse unnoticed.
- **Documents & compliance** — Attach and version key files (agreements,
  insurance certificates, tax forms) and flag ones that are missing or expired.
- **Performance tracking** — Record ratings, notes, and issues over time to
  inform which vendors to keep, grow, or replace.
- **Roles & permissions** — Separate what buyers, approvers, and administrators
  can view and change.

## Tech stack

- **React** — frontend single-page application (UI)
- **Express** (Node.js) — backend REST API and server logic
- **Node.js** — runtime for the Express server

The project is organized as two parts:

- `client/` — the React frontend
- `server/` — the Express API

## Getting started

> Prerequisite: [Node.js](https://nodejs.org/) 18+ and npm.

Install dependencies and run the frontend and backend in separate terminals.

```bash
# Backend (Express API)
cd server
npm install
npm run dev        # starts the API, e.g. http://localhost:5000

# Frontend (React app) — in a second terminal
cd client
npm install
npm start          # starts the UI, e.g. http://localhost:3000
```

Then open [http://localhost:3000](http://localhost:3000) in your browser. The
React app talks to the Express API running on its own port.

### Environment variables

The Express server reads configuration from a `.env` file (database URL, auth
secrets, port, etc.). Copy the example file in `server/` and fill in your values:

```bash
cd server
cp .env.example .env
```

Local env files (`.env`, `.env*.local`) are git-ignored and should never be
committed.

## Project status

Early development — the repository is being scaffolded. Features listed above
describe the intended scope and will land incrementally.

## License

See [LICENSE](./LICENSE).
