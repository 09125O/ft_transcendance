# Design System Master File

> LOGIC: les fichiers `docs/design/lobby-page.md` et `docs/design/game-room-page.md` surchargent ce master pour leur page cible.

---

Project: Quiz Arena Web App
Direction: Competitive Realtime Quiz Arena
Updated: 2026-04-18

---

## Scope Reel (Implementation)

- Route `/`: lobby operationnel (hero + categories cliquables + rooms actives).
- Route `/quiz-ready`: catalogue jouable (selection officielle + quiz des Studs).
- Route `/quiz-create`: creation de quiz.
- Route `/room/:roomId`: experience room (pre-match, live, resultats) via `HomePage`.

---

## Global Rules

### Visual Identity

- Positionnement: arene tactique realtime, lisible et intense.
- Ton: competitif, propre, sans bruit marketing.
- Metaphore: scene centrale (question) + panneaux utilitaires (classement, chat).

### Color Tokens (Sync avec `frontend/src/styles.css`)

| Role | Hex | Token |
|------|-----|-------|
| Base background | `#050914` | `--color-background` |
| Surface | `#111A2D` | `--color-surface` |
| Surface contrast | `#17243C` | `--color-surface-alt` |
| Primary action | `#0070CC` | `--color-primary` |
| Primary hover | `#1EAEDB` | `--color-primary-hover` |
| Accent/highlight | `#1883FD` | `--color-accent` |
| Link hover | `#1883FD` | `--color-link-hover` |
| Urgency | `#D53B00` | `--color-urgency` |
| Danger | `#EF4444` | `--color-danger` |
| Success | `#22C55E` | `--color-success` |
| Text main | `#E6EDF8` | `--color-text` |
| Text secondary | `#9FB0CD` | `--color-text-muted` |

### Typography

- Headings: Sora (ou fallback sans-serif net).
- Body: Space Grotesk.
- Data labels / kickers: Space Mono (uppercase tracking).

### Motion

- Priorite: comprehension d'etat (waiting -> playing -> finished).
- Duree cible interactions: 180-200ms (boutons, cards, chips).
- Animation ambiente de fond active par defaut, desactivee sous `prefers-reduced-motion`.
- Hover buttons: scale moderee + border/ring visible.

### Layout Principles

- Lobby desktop: grille 2 zones (gauche contenu principal, droite rooms actives).
- Quiz-ready desktop: hero + sections catalogues (officiel puis communaute).
- Game room desktop: zone centrale de jeu + colonne utilitaire (classement/chat superposes).
- Mobile game room: navigation par onglets (Question / Classement / Chat).

---

## Component Specs

### Buttons

- Primaire: `bg-primary`, hover `primary-hover`, border blanc, ring primary.
- Secondaire (`ui-btn-secondary`): fond sombre, bord primary translucide, hover cyan + ring.
- Danger (`ui-btn-danger`): fond/contour danger, hover renforce sans layout shift.

### Panels

- Fond semi-opaque, blur discret, bordure primary/20.
- Radius global eleve (`~26px`) pour une lecture console moderne.

### Cards

- Cartes categories lobby: titre + accroche courte, surface entierement cliquable.
- Cartes quiz jouables: badges categorie/niveau + metriques quiz + etat room.
- Cartes participants/classement: densite compacte, priorite a la lisibilite des scores.

### Inputs

- Fond sombre contraste, texte clair, placeholder attenue.
- Focus visible (ring) sur inputs et controles interactifs.

---

## Page Pattern

Pattern name: Realtime Product Surface

- Lobby: hero operationnel -> categories cliquables -> rooms actives -> CTA creation.
- Quiz-ready: hero d'entree -> selection officielle -> quiz crees par les Studs.
- Room: ecran pre-match -> ecran live (question + classement/chat) -> ecran resultats.

---

## Anti-Patterns (Do NOT Use)

- Sections marketing generiques (testimonials, speaker bio, webinar form).
- Emojis comme icones produit primaires.
- Contraste insuffisant (< 4.5:1) sur texte critique.
- Etats implicites sans signal visuel (loading/error/waiting/finished).
- Animations permanentes agressives sur actions de jeu.

---

## Delivery Checklist (Etat Code)

- Etats couverts: Fait (loading/empty/error/ready sur lobby, quiz-ready, room).
- Focus visible: Partiel (buttons et inputs principaux ok; audit clavier complet a faire).
- Mobile 375px sans scroll horizontal: A verifier en QA visuelle.
- `prefers-reduced-motion`: Fait (animation d'ambiance + hover buttons traites).
- Sections marketing hors scope produit: Fait (aucune section landing generique detectee).
