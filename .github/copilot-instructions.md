# Repository Copilot Instructions

But: garder `.github/` concentre sur la contribution et l'automatisation GitHub, pas sur la documentation projet.

## Source de verite

Avant de modifier le code, lire les docs suivantes selon le scope touche :

- `docs/README.md`
- `docs/contracts/http-api-contract.md`
- `docs/contracts/websocket-event-contract.md`
- `docs/integration/frontend-realtime-integration.md`
- `docs/product/evaluation-conformity-matrix.md`

Si le changement touche l'UI :

- `docs/design/system-guidelines.md`
- `docs/design/lobby-page.md`
- `docs/design/game-room-page.md`

## Regles non negociables

1. Ne jamais casser les flux critiques :
- `auth/session`
- `room join/start`
- `game answer loop`
- `websocket auth`

2. Si un payload HTTP ou WebSocket change :
- mettre a jour le contrat correspondant dans la meme PR
- mentionner l'impact dans le resume PR

3. Si un changement modifie un claim sujet :
- mettre a jour `docs/product/evaluation-conformity-matrix.md`
- garder une preuve concrete : endpoint, event, test ou ecran

4. Toute tache n'est terminee que si :
- le code compile
- les checks pertinents passent
- la documentation impactee est alignee
- les etats UI minimum restent couverts : `loading`, `empty`, `error`, `ready`
