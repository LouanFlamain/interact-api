# interactive-cv-api

API NestJS de l’éditeur de CV interactifs. Le socle utilise TypeScript strict, CQRS et une organisation DDD/hexagonale par contexte métier.

## Prérequis

- Node.js 26 ou supérieur
- npm 11 ou supérieur

## Démarrage

```bash
docker compose up -d postgres mailpit
npm install
npm run prisma:generate
npm run start:dev
```

L’API écoute par défaut sur `http://localhost:3000`. Toutes les routes REST sont préfixées par `/api` : l’interface OpenAPI est disponible sur `http://localhost:3000/api`, son document JSON sur `http://localhost:3000/api-json` et la santé sur `GET /api/health`.

## Base de données locale

PostgreSQL est fourni par Docker Compose. Le fichier `.env` local est déjà créé et ne doit jamais être versionné. Pour un nouveau clone, copier `.env.example` vers `.env`, puis remplacer toutes les valeurs de démonstration par des secrets aléatoires.

```bash
docker compose up -d postgres mailpit
docker compose ps
```

La base écoute sur `localhost:5432` par défaut et ses données sont conservées dans le volume Docker `postgres_data`. Mailpit reçoit les e-mails locaux sur SMTP `localhost:1025` et les affiche sur `http://localhost:8025`. Prisma est connecté à l’application et la migration initiale crée le socle d’identité.

## Scripts

```bash
npm run build
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run prisma:validate
```

## Organisation

Chaque contexte métier suit cette structure :

```text
src/modules/<context>/
├── domain/           # Entités et règles TypeScript pures
├── application/      # Commandes, requêtes, handlers et ports
├── adapters/
│   ├── in/           # HTTP ou WebSocket
│   └── out/          # Base de données ou services externes
└── <context>.module.ts
```

Les contextes `documents-access`, `collaboration` et `publication` seront introduits au moment de leurs premiers cas d’usage. La persistance PostgreSQL via Prisma est déjà installée ; la collaboration Yjs/Hocuspocus sera ajoutée à son premier besoin. Les écritures passent normalement par les repositories Prisma ; les lectures peuvent employer des projections SQL paramétrées et testées lorsque cela est utile.

## Authentification locale

Les routes publiques sous `/api/auth` couvrent l’inscription, la vérification d’e-mail, la connexion, le renvoi de vérification et la réinitialisation du mot de passe. Une connexion réussie crée une session opaque, révocable et stockée côté serveur ; son cookie est `HttpOnly`, `SameSite=Lax` et host-only. `GET /api/auth/me` et `POST /api/auth/logout` nécessitent cette session.

En développement, les e-mails sont capturés par Mailpit. Les liens contiennent le jeton dans leur fragment (`#token=…`), qui n’est donc pas transmis à l’API dans les logs HTTP. Le dépôt web devra lire ce fragment puis appeler l’endpoint concerné. Google et GitHub restent à configurer : leurs identifiants OAuth et leurs URL de retour ne sont volontairement pas présents dans ce dépôt.

Les tests sont rangés sous `tests/` en reproduisant l’arborescence de leurs sources sous `src/`. Les fichiers d’un cas d’usage sont regroupés dans un dossier nommé d’après ce cas, par exemple `application/queries/get-health/`.

## Feuille de route

Le suivi des étapes backend, de leurs dépendances et de leurs critères de validation est dans le [plan d’intégration](docs/integration-plan.md).

Les règles détaillées d’architecture, de sécurité et de tests sont dans [AGENTS.md](AGENTS.md).

# interact-api
