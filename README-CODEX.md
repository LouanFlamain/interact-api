# Configuration Codex — interactive-cv-api

Ce dépôt contient une API NestJS et sa configuration Codex : les instructions du dépôt (`AGENTS.md`), quatre agents spécialisés déclarés dans `.codex/config.toml` et quatre procédures réutilisables (Skills) dans `.agents/skills/`.

## Installation dans un autre dépôt
Copier **le contenu de configuration** de ce dossier, y compris les dossiers cachés `.codex` et `.agents`, à la racine de l’API cible. Vérifier les conflits avant de remplacer des fichiers existants, puis versionner la configuration avec Git.

## Démarrage
1. Installer ou mettre à jour Codex CLI.
2. Ouvrir un terminal à la racine du dépôt et lancer `codex` dans un projet déclaré fiable. La configuration locale `.codex/config.toml` n’est chargée que dans les projets approuvés.
3. Demander : « Lis `AGENTS.md`, présente les agents et les Skills disponibles, puis analyse le dépôt sans le modifier. »
4. Pour déléguer : « Utilise l’agent `api_engineer` pour cette tâche. »
5. Pour lancer un Skill, écrire `$nom-du-skill` dans une demande ou décrire une tâche correspondant à sa description.

## Précautions
- Les noms techniques, identifiants d’agents, chemins et paramètres TOML restent en anglais pour leur stabilité ; les consignes sont en français.
- Les agents doivent découvrir les commandes de test dans `package.json`.
- Les rôles `.codex/agents/*.toml` sont référencés par `.codex/config.toml` ; leur présence seule dans le dossier ne suffit pas.
- Les interdictions décrites dans les instructions ne remplacent pas les permissions effectives de Codex : régler également les autorisations dans la CLI.
- Une évolution du schéma documentaire ou des contrats REST doit être coordonnée entre les deux dépôts.
- L’architecture applicative NestJS, ses commandes et ses vérifications sont documentées dans `AGENTS.md` et `README.md`.
