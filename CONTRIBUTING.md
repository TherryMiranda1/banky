# Contributing to Banky

Thank you for your interest in contributing to **Banky**! We welcome contributions of all kinds: bug fixes, new features, documentation enhancements, UI/UX polish, and ideas.

---

## 🧭 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all contributors with respect and kindness.

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js** v20.0.0 or higher
- **npm** or **pnpm**
- **OpenSSL** (for generating RSA and AES keys)
- An active account on [Enable Banking](https://enablebanking.com)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/banky.git
cd banky
```

### 2. Backend Setup (`server/`)

```bash
cd server
npm install

# Copy environment template
cp .env.example .env

# Generate encryption key (AES-256-GCM)
openssl rand -hex 32

# Generate RSA 4096-bit key pair for Enable Banking
openssl genrsa -out private.key 4096
openssl rsa -in private.key -pubout -out public.key

# Format and inject private key into .env
node ../format-key.mjs --env

# Start development server
npm run dev
```

### 3. Frontend Setup (`client/`)

```bash
cd ../client
npm install

# Copy environment template
cp .env.example .env

# Start Vite dev server
npm run dev
```

---

## 📐 Architecture & Coding Standards

Before writing code, please review our core architectural principles:

### Backend
1. **Ports First**: Define interface contracts in `server/src/core/ports/` before writing infrastructure adapters.
2. **Type Safety**: TypeScript strict mode is enabled. Avoid `any`.
3. **Error Handling**: Use the typed `AppError` hierarchy (`BadRequestError`, `UnauthorizedError`, `NotFoundError`, etc.).
4. **Validation**: All incoming HTTP payloads must be validated using Zod schemas.
5. **Multi-Tenant Scoping**: All database queries must be scoped to the authenticated `userId`.

### Frontend
1. **State Machine per Page**: Each page delegates state and effects to a dedicated custom hook.
2. **API Isolation**: All HTTP requests go through `client/src/lib/api/` services.
3. **Tailwind CSS v4**: Tokens and themes are declared in `client/src/index.css`.
4. **Domain-Driven Components**: Keep components organized by feature under `client/src/components/<domain>/`.

---

## 🌿 Git & Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(scope)`: A new user-facing feature
- `fix(scope)`: A bug fix
- `docs(scope)`: Documentation updates
- `refactor(scope)`: Code refactoring without changing functionality
- `test(scope)`: Adding or updating tests / verification scripts
- `chore(scope)`: Maintenance, dependencies, or configuration

### Examples
- `feat(auth): add passkey support for multi-factor login`
- `fix(sync): handle rate limiting on bank account balance fetch`
- `docs(readme): add Cloudflare D1 migration guide`

---

## 🚀 Pull Request Checklist

Before submitting a PR:

1. [ ] Ensure typechecks pass without errors:
   ```bash
   cd server && npm run typecheck
   cd client && npm run typecheck
   ```
2. [ ] Ensure no personal secrets or keys are committed (`.env`, `private.key`, etc.).
3. [ ] Verify that your changes work end-to-end locally.
4. [ ] Write clear commit messages and PR descriptions explaining *what* was changed and *why*.
