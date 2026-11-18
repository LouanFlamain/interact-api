---
name: review-api-security
description: Auditer les autorisations REST/WebSocket, la validation des entrées et l’exposition des données de CV publics.
---

# Auditer la sécurité de l’API

1. Examiner le diff courant ainsi que les endpoints et salles WebSocket impactés.
2. Suivre les vérifications d’identité et de rôle pour chaque méthode REST, connexion et mise à jour WebSocket.
3. Contrôler validation des entrées, IDOR, isolation des documents, séparation brouillon/public et gestion du texte enrichi.
4. Vérifier si pertinent secrets, logs, CORS, limitation de débit et fuites d’informations dans les erreurs.
5. Ne signaler que des problèmes exploitables et précis, avec gravité, fichier/ligne et reproduction.
6. Recommander des tests, sans prétendre qu’ils ont réussi s’ils n’ont pas été lancés.
