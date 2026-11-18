# interactive-cv-api

API NestJS de l’éditeur de CV interactifs. Le socle utilise TypeScript strict, CQRS et une organisation DDD/hexagonale par contexte métier.

## Prérequis

- Node.js 26 ou supérieur
- npm 11 ou supérieur

## Démarrage

```bash
docker compose up -d postgres
npm install
npm run prisma:generate
npm run start:dev
```

L’API écoute par défaut sur `http://localhost:3000`. Le contrat OpenAPI est disponible sur `http://localhost:3000/api` et l’endpoint de santé sur `GET /health`.

## Base de données locale

PostgreSQL est fourni par Docker Compose. Le fichier `.env` local est déjà créé et ne doit jamais être versionné. Pour un nouveau clone, copier `.env.example` vers `.env`, puis remplacer toutes les valeurs de démonstration par des secrets aléatoires.

```bash
docker compose up -d postgres
docker compose ps
```

La base écoute sur `localhost:5432` par défaut et ses données sont conservées dans le volume Docker `postgres_data`. Prisma est connecté à l’application, mais aucune table ni migration métier n’existe encore.

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

Les contextes `documents-access`, `collaboration` et `publication` seront introduits au moment de leurs premiers cas d’usage. La persistance PostgreSQL via Prisma et la collaboration Yjs/Hocuspocus ne sont volontairement pas installées avant ce besoin. Les écritures passeront normalement par les repositories Prisma ; les lectures pourront employer des projections SQL paramétrées et testées lorsque cela est utile.

Les tests sont rangés sous `tests/` en reproduisant l’arborescence de leurs sources sous `src/`. Les fichiers d’un cas d’usage sont regroupés dans un dossier nommé d’après ce cas, par exemple `application/queries/get-health/`.

## Feuille de route

Le suivi des étapes backend, de leurs dépendances et de leurs critères de validation est dans le [plan d’intégration](docs/integration-plan.md).

Les règles détaillées d’architecture, de sécurité et de tests sont dans [AGENTS.md](AGENTS.md).
# interact-api
