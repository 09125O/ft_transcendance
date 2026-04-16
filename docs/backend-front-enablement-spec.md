# Backend Front Enablement Spec

Date: 2026-04-16
Objectif: definir le minimum backend manquant pour permettre au front d'executer la roadmap F1/F2 sans blocage.

## 1) Scope

Ce document couvre uniquement les briques backend non couvertes aujourd'hui:
- profil editable
- API amis
- notifications minimales
- mode spectateur (lecture seule)

Ce document n'inclut pas:
- 2FA (non bloquant pour handoff front)
- SSR
- optimisations avancees hors MVP

## 2) Contraintes globales

- Conserver l'enveloppe standard:
  - succes: { success: true, data, error: null }
  - erreur: { success: false, data: null, error: { code, message } }
- Endpoints proteges par session cookie sauf mention contraire.
- Codes d'erreur utilises: BAD_REQUEST, UNAUTHORIZED, NOT_FOUND, CONFLICT, INTERNAL_SERVER_ERROR.

## 3) Bloc A - Profil editable (P0)

## Endpoint A1: PATCH /users/me

But:
- permettre au front de modifier le profil courant (username/avatar/status).

Body:
```json
{
  "username": "new_name",
  "avatar_url": "https://...",
  "status": "online"
}
```

Regles:
- Tous les champs optionnels, au moins 1 champ requis.
- username: string min 2, max 32, unique si possible metier.
- avatar_url: url valide ou null.
- status: enum online|offline.

Reponses:
- 200: SafeUser mis a jour.
- 400: payload invalide.
- 401: non authentifie.
- 409: username deja pris.

Definition of Done:
- endpoint documente dans docs/api-front-contract.md
- tests unitaires controller/service
- test d'integration happy path + conflit username

## 4) Bloc B - API Amis (P0)

Note modele present dans Prisma (FriendRequests + FriendshipStatus), mais endpoints non exposes.

## Endpoint B1: GET /friends

Retour:
```json
[
  {
    "userId": 12,
    "username": "alice",
    "avatar_url": null,
    "status": "online",
    "since": "2026-04-16T10:00:00.000Z"
  }
]
```

## Endpoint B2: GET /friends/requests

Retour:
```json
{
  "received": [
    {
      "requestId": 44,
      "fromUserId": 7,
      "fromUsername": "bob",
      "createdAt": "2026-04-16T10:00:00.000Z"
    }
  ],
  "sent": [
    {
      "requestId": 45,
      "toUserId": 22,
      "toUsername": "charlie",
      "createdAt": "2026-04-16T10:00:00.000Z"
    }
  ]
}
```

## Endpoint B3: POST /friends/requests

Body:
```json
{
  "receiverUserId": 22
}
```

Regles:
- impossible de s'ajouter soi-meme.
- impossible si deja amis.
- idempotence recommandee: si pending existe deja, renvoyer la meme ressource ou 409 explicite.

## Endpoint B4: POST /friends/requests/:requestId/accept
## Endpoint B5: POST /friends/requests/:requestId/decline

Regles:
- seule la cible de la demande peut accepter/refuser.

## Endpoint B6: DELETE /friends/:userId

But:
- retirer un ami (relation acceptee).

Reponses bloc B:
- 200/201 succes selon action.
- 400 payload invalide.
- 401 non authentifie.
- 404 request/user inexistant.
- 409 conflit metier (deja ami, mauvaise etape, etc.).

Definition of Done:
- nouveau module backend friends (controller/service/dto)
- mappings Prisma FriendRequests utilises
- tests unitaires metier (send/accept/decline/remove)
- contrat API mis a jour

## 5) Bloc C - Notifications minimales (P1)

Option MVP simple recommandee:
- stocker notifications en DB (model Notification) ou fallback transitoire runtime si contraint de temps.

## Endpoint C1: GET /notifications?limit=20&cursor=...

Retour:
```json
{
  "items": [
    {
      "id": 100,
      "type": "FRIEND_REQUEST_RECEIVED",
      "title": "Nouvelle demande d'ami",
      "payload": { "requestId": 44, "fromUserId": 7 },
      "read": false,
      "createdAt": "2026-04-16T10:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

## Endpoint C2: PATCH /notifications/:id/read
## Endpoint C3: PATCH /notifications/read-all

WS optionnel utile front:
- event: notification:new
- payload: notification resumee

Definition of Done:
- endpoint list + read fonctionne
- trigger creation notifs pour actions amis (B3/B4)
- docs mises a jour

## 6) Bloc D - Spectateur (P1)

Objectif:
- permettre l'observation d'une partie sans pouvoir agir comme joueur.

Approche recommandee:
- role derive au runtime socket: player | spectator.

## WS Event D1: room:spectate

Payload:
```json
{
  "roomId": 12
}
```

Effets:
- rejoint la room socket en mode spectateur.
- emet room:state + game:state immediatement.

## WS Event D2: room:spectators:update

Payload:
```json
{
  "roomId": 12,
  "count": 3
}
```

Regles:
- un spectateur ne peut pas emettre room:start ni game:answer.
- tentative => event erreur avec code UNAUTHORIZED.

HTTP complement (optionnel):
- GET /rooms/:roomId/spectators

Definition of Done:
- parcours spectateur stable sans regression joueur
- tests WS pour blocage des actions joueur en mode spectateur
- contrat WS mis a jour dans docs/ws-event-contract.md

## 7) Priorisation implementation

P0 (avant handoff front complet):
1. PATCH /users/me
2. Module friends complet (B1 a B6)

P1 (dans la suite immediate):
1. Notifications minimales (C1/C2)
2. Spectateur WS (D1/D2)

P2:
1. read-all notifications
2. endpoints annexes (stats derivees, filtres)

## 8) Checklist de livraison backend

- [ ] endpoints exposes dans app.module.ts via nouveaux modules
- [ ] DTO + validation class-validator
- [ ] tests unitaires + integration minimum
- [ ] docs/api-front-contract.md mises a jour
- [ ] docs/ws-event-contract.md mises a jour (spectateur/notifications WS)
- [ ] smoke scenario ajoute si possible (friends happy path)

## 9) Decision record

Pour accelerer le front:
- 2FA reste en backlog non bloquant.
- Les contrats B et D sont le minimum indispensable pour fermer F2 sans mock permanent.
