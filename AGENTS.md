# Instructions Codex — Créateur de CV interactifs

## Produit
Construire l’API NestJS TypeScript d’un outil de création de CV web interactifs et responsives, avec un éditeur visuel DOM contraint dans l’esprit de Framer, une édition collaborative en temps réel et des pages publiques publiées séparément.

## Périmètre du dépôt
Backend : API REST NestJS, persistance Prisma/PostgreSQL, permissions des documents, sessions Yjs/Hocuspocus et snapshots publiés. Aucun composant UI frontend.

## Décisions d’architecture communes
- Deux dépôts : `interactive-cv-web` (Next.js) et `interactive-cv-api` (NestJS).
- TypeScript strict. Frontend : Next.js, React, Tailwind, shadcn/ui, Moveable, Selecto, Tiptap, Zustand, Yjs. Backend : NestJS, Prisma, PostgreSQL, Yjs/Hocuspocus.
- Les documents sont des arbres de nœuds sérialisables avec identifiants stables, propriétés typées, layouts imbriqués flex/grid et `schemaVersion`.
- Yjs fait autorité pour le contenu des brouillons collaboratifs ; Zustand gère seulement l'état local et éphémère de l'interface.
- Les pages publiques utilisent des snapshots publiés, validés et immuables, jamais le brouillon collaboratif en direct.
- Les droits propriétaire/éditeur/lecteur sont appliqués côté serveur pour REST et WebSocket.
- Le client REST est typé à partir d’OpenAPI ; le schéma documentaire partagé doit être versionné entre les dépôts.
- Préférer des composants de CV prédéfinis et sûrs ; ne jamais exécuter de JavaScript fourni par l’utilisateur.

## Architecture backend
- Utiliser un monolithe modulaire NestJS, organisé par contexte métier et non par couche technique globale.
- Chaque contexte sous `src/modules/<contexte>/` suit l’architecture hexagonale : `domain/` (métier TypeScript pur), `application/` (cas d’usage, commandes, requêtes et ports), `adapters/in/` (HTTP ou WebSocket) et `adapters/out/` (Prisma, stockage ou services externes). Le fichier `<contexte>.module.ts` ne sert qu’au câblage Nest.
- Le domaine ne dépend jamais de NestJS, Prisma, Express, Yjs ou Hocuspocus. L’application ne dépend pas des adaptateurs entrants ni sortants.
- CQRS : une commande modifie l’état ; une requête le lit. Les contrôleurs restent légers, délèguent au `CommandBus` ou au `QueryBus` et ne contiennent aucune règle métier.
- `AppModule` est la racine de composition. Ne pas créer de couche partagée ou de classes abstraites sans premier besoin concret.
- Les premiers contextes métier seront `documents-access`, `collaboration` et `publication`. Ne les créer qu’avec leur premier cas d’usage ; le socle inclut seulement la tranche de santé qui vérifie le câblage.
- PostgreSQL sera accédé via Prisma. Son installation, le schéma et les migrations restent différés jusqu’au premier cas d’usage persistant. Chaque accès devra d’abord définir son port côté application, puis son adaptateur sortant Prisma.
- Les commandes d’écriture utilisent normalement les repositories Prisma et leurs transactions. Les requêtes de lecture peuvent employer du SQL paramétré, dans `adapters/out/prisma/read-models/`, pour retourner une projection dédiée sans reconstruire inutilement le domaine. Toute requête SQL manuelle doit être testée et justifiée par son besoin de lecture ou de performance.
- L’API REST expose son contrat OpenAPI à `/api`. Toute entrée HTTP future est validée globalement ; documenter les DTO et signaler les changements de contrat au dépôt frontend.

## Vérification d’architecture
- Ranger tous les tests sous `tests/`, avec le même arbre que les sources ciblées sous `src/`. Couvrir les cas d’usage par des tests unitaires sans infrastructure, les adaptateurs HTTP par des tests e2e, et les règles de sécurité par des scénarios 401/403/404 pertinents.
- Préserver les frontières : aucun import de Prisma ou de transport dans `domain/` ; aucune logique métier dans les contrôleurs ; aucun brouillon collaboratif servi par une route publique.

## Règles de travail obligatoires
- Lire les fichiers concernés et la documentation avant toute modification.
- Produire le changement le plus petit, clair et maintenable ; ne pas refactoriser hors périmètre.
- Pour un changement structurant (schéma documentaire, authentification, permissions, protocole collaboratif, migration ou contrat API), proposer un plan concis et attendre la validation de l'utilisateur.
- Pour une tâche courante bien délimitée, implémenter directement puis présenter le résultat et les vérifications.
- Ne jamais faire de commit, push, merge, déploiement, modification de secrets ou opération destructrice sur les données sans instruction explicite.
- Indiquer exactement quels tests ont été exécutés et leurs résultats ; ne jamais annoncer comme réussis des tests non lancés.
- Justifier toute nouvelle dépendance et vérifier sa compatibilité.
- Respecter l'architecture et les conventions réellement présentes dans le dépôt.
- Ne jamais supposer l'accès à l'autre dépôt : documenter les changements de contrat et les actions à effectuer de l'autre côté.
- Ne jamais afficher ou journaliser de secrets, jetons, données privées des CV ou identifiants de collaborateurs.

## Vérifications souhaitées
- Consulter les scripts réellement présents dans `package.json` au lieu d’inventer des commandes.
- Exécuter les vérifications pertinentes disponibles : typage, lint, tests unitaires et tests d’intégration/e2e.
- Si le projet est vide, mettre en place les contrôles minimaux pendant l’initialisation.

## Utilisation des agents
- Ne déléguer qu’aux agents nécessaires ; ne pas tous les lancer systématiquement.
- Paralléliser les analyses indépendantes, mais éviter les éditions simultanées des mêmes fichiers.
- Utiliser les procédures `.agents/skills/` pour les tâches récurrentes.
- Si une demande concerne les deux dépôts, identifier précisément les changements de contrat et le travail restant.
- Répondre en français à l’utilisateur, sauf demande contraire.
