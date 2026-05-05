# Lobby Page Overrides

Project: Quiz Arena Web App
Page: Lobby
Updated: 2026-04-18

Ce fichier surcharge le master pour la page lobby.

---

## Page-Specific Rules

### Layout Overrides

- Max width: 1320px.
- Sections implementees: hero operationnel, categories cliquables, carte communaute, rooms actives, bloc creer quiz.
- Interdiction: sections marketing (testimonials, logos clients, speaker blocks).

### Hero Overrides

- Hero doit afficher:
  - valeur produit en une phrase,
  - CTA primaire "Jouer maintenant" (vers `/quiz-ready`),
  - CTA secondaire "Creer un quiz" (vers `/quiz-create`).
- Les compteurs quiz/categories/rooms ne sont pas affiches dans l'etat actuel.

### Card Overrides

- Cartes categories: badge categorie + description + accroche courte; toute la carte est cliquable vers `/quiz-ready`.
- Carte communaute: centree dans la grille categories; redirige egalement vers `/quiz-ready`.
- Cartes room: nom, joueurs, manches + action rejoindre.
- Nom room affiche sans suffixe horaire genere automatiquement (` - HH:MM`).

### Data States

- Rooms loading: message "Chargement des parties...".
- Rooms error: message erreur dans un panneau dedie.
- Rooms empty: etat vide explicite avec indication de creation de room.

### Motion Overrides

- Autorise: reveal progressif des sections et halo dynamique discret.
- Interdit: carrousel automatique, ticker de conversion, animations de type pub.

### Interaction Rules

- Rejoindre room:
  - utilisateur non connecte -> redirection login,
  - room publique -> navigation directe `/room/:id`,
  - room privee -> modal mot de passe puis confirmation.
- CTA "Creer un quiz" disponible en hero et dans le panneau rooms.

---

## UX Focus

- L'utilisateur doit comprendre en moins de 5 secondes comment rejoindre une partie.
- Le flux principal homepage est: choisir une categorie -> aller sur quiz-ready -> creer/rejoindre une room -> jouer.
