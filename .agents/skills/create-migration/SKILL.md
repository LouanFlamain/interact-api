---
name: create-migration
description: Préparer des migrations Prisma sûres pour PostgreSQL, avec contraintes d’intégrité et stratégie de retour arrière.
---

# Préparer une migration Prisma

1. Examiner le schéma Prisma existant, l’historique des migrations et les requêtes applicatives impactées.
2. Décrire le diff envisagé : nullabilité, valeurs par défaut, index et éventuelles reprises de données.
3. Évaluer les verrous, la compatibilité, les backfills et la possibilité de revenir en arrière.
4. Demander une validation avant une modification destructive ou une application sur une base non locale.
5. Générer les fichiers de migration avec les scripts du projet, sans déploiement automatique.
6. Valider sur une base de développement isolée si possible.
7. Présenter le SQL généré, les risques et les commandes réellement exécutées.
