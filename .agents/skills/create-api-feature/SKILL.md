---
name: create-api-feature
description: Créer une fonctionnalité REST NestJS avec validation DTO, autorisations, documentation OpenAPI et tests.
---

# Créer une fonctionnalité API

1. Examiner les modules existants, les conventions de réponse d’erreur, de validation et d’authentification.
2. Définir les endpoints, méthodes, DTO d’entrée/sortie, rôles autorisés et critères d’acceptation.
3. Implémenter des contrôleurs légers et des services métier ciblés.
4. Vérifier propriété et appartenance côté serveur pour prévenir les accès directs non autorisés (IDOR).
5. Documenter les DTO OpenAPI et vérifier le contrat généré s’il est configuré.
6. Ajouter des tests de fonctionnement nominal, d’entrées invalides et d’accès non autorisé.
7. Lancer les vérifications disponibles et signaler les changements de contrat nécessaires côté frontend.
