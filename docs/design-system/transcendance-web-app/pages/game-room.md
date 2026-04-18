# Game Room Page Overrides

Project: Quiz Arena Web App
Page: Game Room
Updated: 2026-04-18

Ce fichier surcharge le master pour la page game room.

---

## Page-Specific Rules

### Layout Overrides

- Le parcours room est segmente en 3 ecrans distincts:
  - `PreMatchPanel` (etat waiting),
  - `GamePanel` (etat playing),
  - `ResultsPanel` (etat finished).
- Desktop live (`GamePanel`):
  - zone principale a gauche (question/reponses),
  - colonne utilitaire a droite (classement en haut, chat en bas).
- Mobile live: navigation par onglets (`Question`, `Classement`, `Chat`) pour limiter le scroll concurrent.
- Ecran `RulesPanel` affiche en vue dediee quand active.

### State Signaling

- Waiting:
  - room chargee, participants visibles,
  - bouton "Demarrer la partie" si autorise,
  - actions "Voir les regles" et "Quitter la room".
- Playing:
  - question courante au centre,
  - feedback reponse immediate (correct/incorrect),
  - classement + chat toujours accessibles (desktop simultane, mobile via onglet).
- Finished:
  - ecran resultats dedie,
  - vainqueur mis en avant,
  - classement final conserve,
  - action retour lobby.

### Interaction Rules

- Une seule reponse selectable par question cote UI.
- Boutons reponse desactives apres selection utilisateur.
- Envoi reponse via event WS `game:answer`.
- Action quitter envoie `room:leave` puis retour lobby.
- Chat secondaire visuellement, jamais prioritaire sur la zone question.

### Entry/Exit Rules

- Si `roomId` invalide ou room introuvable: redirection vers `/`.
- Pendant chargement room: ecran de chargement dedie.
- Fermeture room cote realtime: retour automatique `/`.

### Motion Overrides

- Autorise: transitions sur etat des reponses, update leaderboard, reveal de question.
- Interdit: animations de formulaire, patterns webinar, call-to-action marketing.

---

## UX Focus

- Priorite absolue: lisibilite instantanee de la question et de son statut.
- Le joueur doit percevoir sans effort: ou cliquer, si sa reponse est bonne, et quand la partie est finie.
