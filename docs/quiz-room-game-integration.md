# Quiz Room Game Integration

Date: 2026-04-17

## Resume

Les rooms peuvent maintenant etre rattachees a un quiz via `Room.quizId`.
Quand une room est creee depuis l'interface quiz, le front envoie `quizId` dans le payload de creation de room. Le backend stocke ce lien, puis le runtime de jeu utilise les `QuizQuestion` de ce quiz pour derouler la partie.

## Flux fonctionnel

1. Le front charge les quiz via `/quizzes`.
2. L'utilisateur choisit un quiz et cree une room.
3. Le front appelle `/rooms` avec:

```json
{
  "name": "Room quiz",
  "rounds": 5,
  "isPrivate": false,
  "quizId": 1
}
```

4. Le backend verifie que le quiz existe et contient au moins une question.
5. Le backend stocke `quizId` sur la room.
6. Au lancement de la room, le runtime lit les questions du quiz dans l'ordre `QuizQuestion.position`.
7. Les events `game:question:started` exposent seulement `{ id, text, options }`.
8. Les reponses sont validees contre `QuizQuestion.correctAnswer`.
9. Les points viennent de `QuizQuestion.points`.

## Contrats impactes

- `Room` expose maintenant `quizId?: number`.
- `CreateRoomDto` accepte `quizId?: number`.
- `POST /rooms` peut recevoir `quizId`.
- `room:create` peut recevoir `quizId`.
- `game:question:started` continue a masquer la bonne reponse.

## Regles backend

- `quizId` est optionnel pour garder la compatibilite avec les rooms sans quiz.
- Si `quizId` est absent, le jeu utilise la banque de questions de fallback.
- Si `quizId` est fourni et invalide, la creation de room echoue.
- Si le quiz ne contient aucune question, la creation de room echoue.
- `rounds` est limite au nombre de questions disponibles dans le quiz.

## Migration

Migration ajoutee:

```text
backend/prisma/migrations/20260417130000_add_room_quiz_link/migration.sql
```

Elle ajoute:

- `Room.quizId`
- une foreign key vers `Quiz.id`
- un index sur `Room.quizId`

## Verification

Scenario manuel minimal:

1. Creer un quiz avec au moins deux questions.
2. Creer une room depuis ce quiz.
3. Lancer la room.
4. Verifier que les questions affichees correspondent au quiz.
5. Repondre juste/faux et verifier le score.
6. Attendre la fin de partie et verifier le leaderboard.

Note environnement:

- Le backend Docker utilise Node 22.
- La generation Prisma locale peut echouer avec Node 18; utiliser Node 20+ ou le conteneur backend pour `prisma generate` et `prisma migrate deploy`.
