---
name: test-collaboration
description: Tester Yjs/Hocuspocus : modifications simultanées, reconnexion, droits lecture seule et récupération persistante.
---

# Tester la collaboration en temps réel

1. Lire l’architecture d’authentification et de persistance actuelle de Yjs/Hocuspocus.
2. Définir des sessions de test déterministes : propriétaire, éditeur, lecteur et utilisateur non autorisé.
3. Tester modifications concurrentes sur des champs différents et identiques, convergence et reconnexion.
4. Vérifier qu’un lecteur ne peut jamais modifier l’état persistant, même en envoyant directement des messages WebSocket.
5. Vérifier la restauration de l’état après redémarrage et l’absence de fuite entre documents/salles.
6. Distinguer les données de présence éphémères (awareness) des données durables.
7. Exécuter les tests d’intégration disponibles et présenter les lacunes observées.
