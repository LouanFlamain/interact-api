# Plan d’intégration

Ce document est la feuille de route vivante de l’API. Une étape n’est terminée que lorsque son contrat, ses tests et les éventuels changements attendus dans `interactive-cv-web` sont documentés.

## Statuts

- `fait` : implémenté et vérifié.
- `en cours` : le périmètre est défini, mais les décisions ou travaux restants ne permettent pas encore de le clôturer.
- `à valider` : une décision produit ou technique est nécessaire avant le développement.
- `à faire` : prêt à être planifié.
- `bloqué` : dépend d’un choix, d’un accès ou d’un autre dépôt.

## Feuille de route

| Étape | Statut | Dépendances | Livrable et critère de fin |
|---|---|---|---|
| 0. Socle technique | fait | — | NestJS, TypeScript strict, CQRS, validation HTTP, OpenAPI, `GET /health`, lint et tests passent. |
| 1. Conventions API | en cours | 0 | Stratégie d’authentification validée ; format d’erreur, pagination, versionnement, convention des identifiants et politique de suppression restants. |
| 2. Identité et persistance | en cours | 1 | PostgreSQL local disponible ; Prisma, comptes locaux/OAuth, sessions et première migration réversible restent à réaliser. |
| 3. Documents et droits | à faire | 2 | Création, lecture, modification et suppression de CV ; rôles propriétaire/éditeur/lecteur appliqués et scénarios 401/403/404/IDOR couverts. |
| 4. Contrat documentaire | à faire | 3 | Arbre de nœuds versionné avec `schemaVersion`, validation côté API et contrat communiqué au dépôt frontend. |
| 5. Collaboration | à faire | 3, 4 | Yjs/Hocuspocus autorisé par document ; persistance des mises à jour ; convergence, reconnexion, lecture seule et redémarrage testés. |
| 6. Publication | à faire | 3, 4 | Validation du brouillon et création d’un snapshot immuable, distinct du document collaboratif. |
| 7. Lecture publique | à faire | 6 | Endpoints publics lisant exclusivement les snapshots publiés ; aucune donnée privée ou brouillon exposé. |
| 8. Médias | à faire | 3 | Upload, autorisation, stockage, références dans le document et stratégie de nettoyage définis. |
| 9. Exploitation | à faire | 2 à 8 selon le périmètre | Logs sûrs, métriques, limites, CI, sauvegardes et procédure de restauration documentées et vérifiées. |

## Détail des étapes

### 0. Socle technique

Statut : `fait`.

- API NestJS avec modules métier, CQRS et frontières hexagonales.
- OpenAPI sur `/api` et document JSON sur `/api-json`.
- `GET /health` vérifié en unitaire et en e2e.
- Tests sous `tests/`, avec une arborescence miroir de `src/`.

### 1. Conventions API

Statut : `en cours`.

Décisions d’authentification validées :

- Un seul type de compte applicatif `User`, avec rôle système `USER` ou `ADMIN` ; les droits de document restent indépendants (`OWNER`, `EDITOR`, `VIEWER`). Un administrateur n’accède pas par défaut au contenu d’un CV privé.
- Inscription locale par e-mail et mot de passe, ainsi que connexion fédérée avec Google ou GitHub.
- Sessions opaques, révocables et stockées côté serveur ; l’API émet un cookie `HttpOnly`, `Secure`, `SameSite=Lax` et host-only pour `api.exemple.com` (sans attribut `Domain`).
- Le frontend appelle l’API avec les identifiants de session ; CORS n’autorise que l’origine exacte `https://app.exemple.com` avec les credentials.
- Pas de MFA obligatoire pour les administrateurs à la première version ; cette décision sera revue avant l’ouverture des fonctions d’administration sensibles.

Décisions restantes :

- forme commune des erreurs HTTP ;
- pagination, tri et filtrage ;
- format des identifiants publics et internes ;
- stratégie de suppression, archivage et rétention.

Critère de fin : ces conventions sont documentées, configurées dans l’API et accompagnées de tests représentatifs.

### 2. Identité et persistance

Statut : `en cours`.

- PostgreSQL local est fourni par `compose.yaml`, avec volume persistant, contrôle de santé et secrets temporaires dans `.env` ignoré par Git.
- Prisma 7 est connecté à PostgreSQL via un module technique Nest et son adaptateur `@prisma/adapter-pg`. Le schéma ne contient encore aucun modèle ni migration métier.
- Créer un compte `User` unique ; une identité externe est reliée par un couple unique `(provider, providerSubject)`. Un mot de passe n’existe que pour les comptes ayant choisi le parcours local.
- Démarrer Google et GitHub avec le flux d’autorisation OIDC/OAuth à code, `state`, `nonce` et PKCE. Ne jamais lier automatiquement deux comptes sur la seule égalité d’e-mail : demander une preuve de contrôle du compte existant.
- Hacher les mots de passe avec Argon2id. Stocker seulement un vérificateur haché des jetons de session, de vérification d’e-mail et de réinitialisation ; ne jamais journaliser ces secrets.
- Prévoir inscription, connexion, déconnexion, consultation de session, vérification d’e-mail, demande et confirmation de réinitialisation de mot de passe, ainsi que la révocation des sessions.
- Définir les ports de persistance dans l’application ; placer les adaptateurs Prisma dans `adapters/out/prisma/`.
- Utiliser Prisma pour les commandes d’écriture et les transactions.
- Placer les projections SQL de lecture, si nécessaires, dans `adapters/out/prisma/read-models/` ; elles sont paramétrées, testées et ne remontent pas de données inutiles.
- Préparer une migration revue, réversible lorsque possible, et une stratégie de retour arrière.

Critère de fin : une base neuve peut être migrée ; inscription locale et OAuth créent ou retrouvent le même compte de manière sûre ; une session révoquée est refusée ; `USER` reçoit 403 sur les routes `ADMIN` et les secrets restent hors du dépôt.

### 3. Documents et droits

Statut : `à faire`.

Périmètre : CV, propriétaire, collaborateurs et rôles `owner`, `editor`, `viewer`.

Critère de fin : chaque route et future connexion WebSocket vérifie l’accès au document côté serveur ; les tentatives d’accès direct à un autre document sont refusées.

### 4. Contrat documentaire

Statut : `à faire`.

- Définir le schéma sérialisable des nœuds, les propriétés typées, les layouts flex/grid et `schemaVersion`.
- Valider le schéma avant persistence ou publication.
- Versionner et transmettre le contrat au dépôt `interactive-cv-web`.

Critère de fin : un document valide, invalide et issu d’une version antérieure sont couverts par des tests.

### 5. Collaboration

Statut : `à faire`.

- Authentifier puis autoriser chaque salle/document au niveau WebSocket.
- Distinguer mises à jour Yjs persistées et awareness éphémère.
- Définir le stockage, la compaction, la reprise après redémarrage et le fonctionnement multi-instance.

Critère de fin : modifications concurrentes, reconnexion, session lecture seule, isolation de document et récupération persistante sont vérifiées.

### 6. Publication et lecture publique

Statut : `à faire`.

- Une commande de publication valide le brouillon puis produit un snapshot immuable.
- Les routes publiques ne consultent que ce snapshot.
- La lecture est optimisée par une projection dédiée si le besoin le justifie.

Critère de fin : modifier le brouillon après publication ne change jamais la page publique ; une publication invalide échoue sans modifier la dernière version publique.

### 7. Médias

Statut : `à faire`.

- Choisir le stockage, les limites de taille et types, l’autorisation et les URL d’accès.
- Prévoir le nettoyage des fichiers orphelins et les règles de conservation.

Critère de fin : un utilisateur non autorisé ne peut ni déposer ni lire un média privé.

### 8. Exploitation

Statut : `à faire`.

- CI : build, lint, tests unitaires, intégration et e2e.
- Observabilité sans secrets ni contenu de CV dans les logs.
- Limites de débit et de taille, sauvegardes et procédure de restauration.

Critère de fin : les contrôles sont automatisés et une procédure de reprise est testée avant un déploiement public.

## Fiche à compléter pour chaque nouvelle étape

```md
## <nom de l’étape>

- Statut : à faire
- Dépendances : …
- Backend : …
- Contrat à communiquer à `interactive-cv-web` : …
- Migration et retour arrière : sans objet / …
- Tests requis : …
- Critère d’acceptation : …
- Décisions ouvertes : …
```
