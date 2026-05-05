# Browser Compatibility Matrix

Date: 2026-05-05
Scope: preuve versionnee pour le module `Support for additional browsers`, alignee sur `srcs_subject/en.subject.pdf` et `srcs_subject/Intra Projects ft_transcendence Edit.pdf`.

Important :

- ce document decrit la preuve de compatibilite actuellement executee sur `dev`
- il ne remplace pas le sujet officiel
- la source de verite implementation reste le code et la suite Playwright dans `frontend/tests/browser-compat.spec.ts`

## Navigateurs couverts

Evidence automatisee executee avec `Playwright 1.59.1` :

| Famille | Mode de preuve |
|---|---|
| Chromium / Chrome-family | Playwright project `chromium` |
| Firefox | Playwright project `firefox` |
| WebKit / Safari-family | Playwright project `webkit` |

## Commandes de preuve

Pre-requis :

1. `make restart`
2. `make test-stack`
3. `cd frontend && npm run test:browsers:install` sur une machine qui n'a pas encore les moteurs Playwright

Commande principale :

```bash
make browser-test
```

Equivalent direct :

```bash
cd frontend
npm run test:browsers
```

## Parcours verifies

Suite automatisee `frontend/tests/browser-compat.spec.ts` :

1. chargement des routes publiques `/`, `/leaderboard`, `/login`
2. verification des headings et de la navigation de base
3. connexion invite depuis `/login`
4. navigation authentifiee vers `/friends` et `/profile`
5. ouverture de `/quiz-ready`
6. ouverture du configurateur de room depuis la selection officielle
7. changement de `Temps par question`
8. creation d'une room
9. verification du pre-match (`Pre-match`, `Demarrer la partie`, `10s`)
10. sortie de room et retour lobby

## Resultat courant

Statut : `OK`

- `chromium` : passe
- `firefox` : passe
- `webkit` : passe

La suite a ete stabilisee sur les 2 profils d'execution supportes :

- `HTTPS local`
- `HTTP/LAN`

Aucun ecart critique de layout ou de navigation n'a ete observe sur les ecrans testes.

## Limitations connues

- en anonyme, `/auth/session` repond maintenant `200` avec `authenticated: false` et `user: null`; ce comportement est attendu et n'est pas specifique a un navigateur
- la preuve automatisee cible le parcours principal desktop et non un audit mobile complet
- la preuve WebKit couvre la famille Safari via le moteur WebKit Playwright ; toute revendication finale doit rester formulee comme `Chrome-family + Firefox + Safari/WebKit-family`

## Fichiers de reference

- `frontend/playwright.config.ts`
- `frontend/tests/browser-compat.spec.ts`
- `docs/product/evaluation-conformity-matrix.md`
- `docs/README.md`
