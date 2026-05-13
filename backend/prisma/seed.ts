import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

type SeedQuestion = {
  text: string;
  options: string[];
  correct: string;
  points?: number;
};

type SeedQuiz = {
  title: string;
  questions: SeedQuestion[];
};

function withBalancedCorrectAnswerPosition(
  question: SeedQuestion,
  questionIndex: number,
): SeedQuestion {
  const options = [...question.options];
  const currentCorrectIndex = options.indexOf(question.correct);

  if (currentCorrectIndex < 0) {
    throw new Error(
      `Seed question "${question.text}" does not contain its correct answer in options`,
    );
  }

  const targetCorrectIndex = questionIndex % options.length;
  const targetOption = options[targetCorrectIndex];
  options[targetCorrectIndex] = question.correct;
  options[currentCorrectIndex] = targetOption;

  return {
    ...question,
    options,
  };
}

const LAUNCH_QUIZZES: SeedQuiz[] = [
  {
    title: "C Fundamentals",
    questions: [
      {
        text: "Quel opérateur permet d'obtenir l'adresse d'une variable en C ?",
        options: ["*", "&", "%", "#"],
        correct: "&",
      },
      {
        text: "Que vaut 'sizeof(char)' en C standard ?",
        options: ["0", "1", "2", "4"],
        correct: "1",
      },
      {
        text: "Quelle fonction de la libc est classiquement utilisée pour allouer dynamiquement de la mémoire ?",
        options: ["alloc", "malloc", "reserve", "new"],
        correct: "malloc",
      },
      {
        text: "Quel mot-clé permet de définir une constante en préprocesseur ?",
        options: ["#const", "#define", "#macro", "const"],
        correct: "#define",
      },
      {
        text: "Laquelle de ces boucles n'existe pas en C ?",
        options: ["for", "while", "repeat", "do...while"],
        correct: "repeat",
      },
      {
        text: "Quel caractère termine une chaîne de caractères en C ?",
        options: ["\\0", "\\n", "\\t", "EOF"],
        correct: "\\0",
      },
      {
        text: "Que risque-t-on en oubliant un 'free' après un 'malloc' ?",
        options: ["Une boucle infinie", "Une fuite mémoire", "Une erreur de syntaxe", "Une erreur de linkage"],
        correct: "Une fuite mémoire",
      },
      {
        text: "Quel fichier d'en-tête déclare 'printf' ?",
        options: ["<string.h>", "<stdio.h>", "<stdlib.h>", "<unistd.h>"],
        correct: "<stdio.h>",
      },
      {
        text: "Quel type est souvent utilisé pour représenter la taille d'un bloc mémoire ou d'un tableau avec 'sizeof' ?",
        options: ["int", "size_t", "ptrdiff_t", "long double"],
        correct: "size_t",
      },
      {
        text: "Quelle fonction compare deux chaînes de caractères en C standard ?",
        options: ["strjoin", "strcmp", "strcpy", "strcut"],
        correct: "strcmp",
      },
      {
        text: "Que fait 'NULL' en C ?",
        options: ["Termine une chaîne", "Représente une adresse invalide ou pointeur nul", "Libère la mémoire", "Déclare une constante globale"],
        correct: "Représente une adresse invalide ou pointeur nul",
      },
      {
        text: "Quel appel système Unix crée un nouveau processus en dupliquant le processus courant ?",
        options: ["spawn", "execve", "fork", "clonefile"],
        correct: "fork",
      },
      {
        text: "Dans `int main(int argc, char **argv)`, à quoi correspond généralement `argc` ?",
        options: ["Au nombre d'arguments reçus", "À la taille du stack", "Au code de retour du programme", "À l'adresse de `main`"],
        correct: "Au nombre d'arguments reçus",
      },
      {
        text: "Quelle fonction permet de redimensionner un bloc déjà alloué dynamiquement ?",
        options: ["remalloc", "realloc", "resize", "calloc"],
        correct: "realloc",
      },
      {
        text: "Quel mot-clé permet de conserver la valeur d'une variable locale entre deux appels de fonction ?",
        options: ["volatile", "extern", "static", "register"],
        correct: "static",
      },
      {
        text: "Quel opérateur sert à déréférencer un pointeur en C ?",
        options: ["&", "*", "->", "::"],
        correct: "*",
      },
      {
        text: "Quelle technique est couramment utilisée pour éviter les inclusions multiples d'un même header C ?",
        options: ["Les include guards", "Le linker script", "Le cast explicite", "Le mot-clé module"],
        correct: "Les include guards",
      },
      {
        text: "Quelle fonction standard copie un bloc mémoire brut d'une zone vers une autre ?",
        options: ["memcpy", "strncpy", "memset", "memcmp"],
        correct: "memcpy",
      },
      {
        text: "Que vaut une variable locale automatique non initialisée en C ?",
        options: ["Toujours 0", "Toujours -1", "Une valeur indéterminée", "La taille du type"],
        correct: "Une valeur indéterminée",
      },
      {
        text: "Que signifie `const int *p` ?",
        options: ["Un pointeur constant vers un entier modifiable", "Un pointeur vers un entier constant", "Un entier constant stockant une adresse", "Un double pointeur constant"],
        correct: "Un pointeur vers un entier constant",
      },
      {
        text: "Quelle fonction de la libc ouvre un fichier en mode texte ou binaire via l'API stdio ?",
        options: ["open", "fopen", "fdopen", "fread"],
        correct: "fopen",
      },
      {
        text: "Quel spécificateur de format `printf` affiche classiquement un entier signé ?",
        options: ["%s", "%p", "%d", "%c"],
        correct: "%d",
      },
      {
        text: "Quel mot-clé sert à créer un alias de type en C ?",
        options: ["typedef", "define", "alias", "using"],
        correct: "typedef",
      },
      {
        text: "Quel nom de compilateur est le plus classiquement invoqué pour compiler un programme C simple sur Unix ?",
        options: ["cc", "javac", "rustc", "go build"],
        correct: "cc",
      },
      {
        text: "Quelle fonction initialise une zone mémoire avec le même octet répété ?",
        options: ["memmove", "memset", "memcmp", "strdup"],
        correct: "memset",
      },
    ],
  },
  {
    title: "C++ Essentials",
    questions: [
      {
        text: "Quelle notion C++ permet de définir plusieurs fonctions portant le même nom avec des signatures différentes ?",
        options: ["Templating", "Overloading", "Casting", "Linking"],
        correct: "Overloading",
      },
      {
        text: "Quelle structure de la STL représente un tableau dynamique ?",
        options: ["std::map", "std::vector", "std::stack", "std::set"],
        correct: "std::vector",
      },
      {
        text: "Que permet principalement une référence en C++ ?",
        options: ["Copier une variable automatiquement", "Créer un alias sur une variable existante", "Allouer sur le heap", "Masquer un type"],
        correct: "Créer un alias sur une variable existante",
      },
      {
        text: "Quel mot-clé sert à hériter d'une classe ?",
        options: ["inherits", "extends", ":", "super"],
        correct: ":",
      },
      {
        text: "Quel mot-clé permet d'appeler le constructeur de la classe de base depuis une classe dérivée ?",
        options: ["super", "base", "Aucun mot-clé, cela passe par la liste d'initialisation", "parent"],
        correct: "Aucun mot-clé, cela passe par la liste d'initialisation",
      },
      {
        text: "Quel opérateur est classiquement surchargé pour afficher un objet dans un flux ?",
        options: [">>", "<<", "==", "->"],
        correct: "<<",
      },
      {
        text: "Quel mot-clé marque une méthode virtuelle redéfinie de façon explicite ?",
        options: ["virtual", "override", "final", "friend"],
        correct: "override",
      },
      {
        text: "Quel est l'intérêt principal du RAII en C++ ?",
        options: ["Rendre tous les pointeurs globaux", "Lier la durée de vie des ressources à celle des objets", "Éviter les headers", "Supprimer la compilation"],
        correct: "Lier la durée de vie des ressources à celle des objets",
      },
      {
        text: "Quelle fonctionnalité permet d'écrire une fonction ou une classe générique en C++ ?",
        options: ["Namespaces", "Templates", "Macros", "Forward declarations"],
        correct: "Templates",
      },
      {
        text: "Quel smart pointer exprime une propriété exclusive d'une ressource ?",
        options: ["std::weak_ptr", "std::shared_ptr", "std::unique_ptr", "std::raw_ptr"],
        correct: "std::unique_ptr",
      },
      {
        text: "À quoi sert `const` après la signature d'une méthode membre ?",
        options: ["À la rendre statique", "À promettre qu'elle ne modifie pas l'état observable de l'objet", "À la rendre virtuelle", "À l'interdire en héritage"],
        correct: "À promettre qu'elle ne modifie pas l'état observable de l'objet",
      },
      {
        text: "Quel conteneur STL est le plus adapté à une recherche clé-valeur ordonnée ?",
        options: ["std::vector", "std::map", "std::stack", "std::queue"],
        correct: "std::map",
      },
      {
        text: "Quel type standard C++ est principalement utilisé pour manipuler du texte ?",
        options: ["std::text", "std::char_array", "std::string", "std::buffer"],
        correct: "std::string",
      },
      {
        text: "Comment reconnaît-on un destructeur en C++ ?",
        options: ["Il commence par `!`", "Il commence par `~`", "Il se termine par `_dtor`", "Il prend toujours `void*` en paramètre"],
        correct: "Il commence par `~`",
      },
      {
        text: "Pourquoi met-on souvent un destructeur virtuel dans une classe de base polymorphique ?",
        options: ["Pour interdire l'héritage", "Pour garantir une destruction correcte via un pointeur de base", "Pour rendre la classe abstraite", "Pour accélérer la compilation"],
        correct: "Pour garantir une destruction correcte via un pointeur de base",
      },
      {
        text: "À quoi sert principalement un `namespace` en C++ ?",
        options: ["À allouer sur le heap", "À éviter les collisions de noms", "À remplacer les classes", "À rendre une fonction inline"],
        correct: "À éviter les collisions de noms",
      },
      {
        text: "Quel mot-clé permet de déduire automatiquement le type d'une variable à partir de son initialisation ?",
        options: ["var", "decltype", "auto", "infer"],
        correct: "auto",
      },
      {
        text: "Quelle syntaxe correspond à une boucle moderne sur les éléments d'un conteneur ?",
        options: ["foreach (x in v)", "for (auto x : v)", "loop (x => v)", "range(v) as x"],
        correct: "for (auto x : v)",
      },
      {
        text: "Quel symbole ouvre la capture d'une lambda en C++ ?",
        options: ["()", "[]", "{}", "<>"],
        correct: "[]",
      },
      {
        text: "Quel mot-clé permet d'empêcher certaines conversions implicites via un constructeur à un paramètre ?",
        options: ["sealed", "private", "explicit", "constexpr"],
        correct: "explicit",
      },
      {
        text: "Quel smart pointer n'exprime pas de propriété mais observe un objet géré par `std::shared_ptr` ?",
        options: ["std::unique_ptr", "std::observer_ptr", "std::weak_ptr", "std::borrowed_ptr"],
        correct: "std::weak_ptr",
      },
      {
        text: "À quoi sert `std::move` en pratique ?",
        options: ["À copier plus vite", "À convertir en valeur rvalue pour permettre un déplacement", "À supprimer un objet", "À rendre une fonction virtuelle"],
        correct: "À convertir en valeur rvalue pour permettre un déplacement",
      },
      {
        text: "Que fait généralement `emplace_back` sur un `std::vector` ?",
        options: ["Trie le tableau", "Construit l'élément directement en fin de conteneur", "Supprime le dernier élément", "Réserve de la mémoire sans rien ajouter"],
        correct: "Construit l'élément directement en fin de conteneur",
      },
      {
        text: "Quel mot-clé est utilisé pour intercepter une exception ?",
        options: ["throw", "guard", "catch", "except"],
        correct: "catch",
      },
      {
        text: "Quel niveau d'accès empêche l'utilisation directe d'un membre depuis l'extérieur de la classe ?",
        options: ["public", "shared", "private", "open"],
        correct: "private",
      },
    ],
  },
  {
    title: "Culture 42",
    questions: [
      {
        text: "Comment s'appelle la période intensive d'entrée emblématique de 42 ?",
        options: ["Le Sprint", "La Piscine", "Le Rush", "Le Kickoff"],
        correct: "La Piscine",
      },
      {
        text: "Quelle approche pédagogique est au coeur de 42 ?",
        options: ["Cours magistraux quotidiens", "Apprentissage par projets et peer learning", "Examens uniquement théoriques", "Vidéos préenregistrées obligatoires"],
        correct: "Apprentissage par projets et peer learning",
      },
      {
        text: "Quel langage domine généralement le début du cursus 42 ?",
        options: ["Python", "Java", "C", "Rust"],
        correct: "C",
      },
      {
        text: "Comment s'appelle souvent la bibliothèque perso en C que beaucoup codent très tôt ?",
        options: ["mylib", "corelib", "libft", "std42"],
        correct: "libft",
      },
      {
        text: "Quel outil est associé à la vérification de la norme de code C à 42 ?",
        options: ["Clang-Tidy", "Norminette", "Prettier", "Black"],
        correct: "Norminette",
      },
      {
        text: "Quel terme est souvent utilisé pour le correcteur automatique des projets ?",
        options: ["Validator", "Robot", "Moulinette", "CheckerX"],
        correct: "Moulinette",
      },
      {
        text: "Comment s'appelle souvent l'espace de travail rempli de machines sur le campus ?",
        options: ["Le Hub", "Le Cluster", "Le Grid", "Le Lab"],
        correct: "Le Cluster",
      },
      {
        text: "Qui participe fréquemment à l'évaluation des projets à 42 ?",
        options: ["Seulement un prof référent", "D'autres étudiants", "Un jury externe uniquement", "Personne, seul Git compte"],
        correct: "D'autres étudiants",
      },
      {
        text: "Quel projet est célèbre pour apprendre à reproduire une version simplifiée de `printf` ?",
        options: ["mini_printf", "ft_printf", "my_printf", "printf42"],
        correct: "ft_printf",
      },
      {
        text: "Quel est l'objectif principal de `get_next_line` ?",
        options: ["Lire un fichier caractère par caractère sans buffer", "Lire une ligne à la fois depuis un descripteur de fichier", "Écrire dans plusieurs fichiers en parallèle", "Parser un JSON complet"],
        correct: "Lire une ligne à la fois depuis un descripteur de fichier",
      },
      {
        text: "Dans `push_swap`, que cherche-t-on principalement à faire ?",
        options: ["Trier des nombres avec un ensemble limité d'opérations", "Compiler un mini shell", "Gérer des processus Unix", "Créer une interface graphique"],
        correct: "Trier des nombres avec un ensemble limité d'opérations",
      },
      {
        text: "Quel espace central regroupe souvent projets, planning et suivi dans l'écosystème 42 ?",
        options: ["Le Dashboard", "L'Intra", "Le Portal", "Le Workspace"],
        correct: "L'Intra",
      },
      {
        text: "Quel projet est souvent l'occasion d'apprendre les signaux, les processus et `fork` ?",
        options: ["minitalk", "Born2fork", "cub3d", "Philo Shell"],
        correct: "minitalk",
      },
      {
        text: "Dans `so_long`, quel est l'objectif principal côté technique ?",
        options: ["Coder un mini jeu 2D avec rendu, événements et déplacements", "Créer une base de données SQL", "Déployer un site SSR", "Écrire un compilateur C complet"],
        correct: "Coder un mini jeu 2D avec rendu, événements et déplacements",
      },
      {
        text: "Quel projet 42 demande classiquement d'implémenter un mini shell Unix ?",
        options: ["minishell", "tinysh", "microbash", "pipex++"],
        correct: "minishell",
      },
      {
        text: "Dans `philosophers`, quel sujet est travaillé en priorité ?",
        options: ["Le rendu 3D", "La concurrence et la synchronisation", "Le parsing HTML", "Le machine learning"],
        correct: "La concurrence et la synchronisation",
      },
      {
        text: "Quel est l'objectif principal de `libft` dans le tronc commun 42 ?",
        options: ["Créer un moteur 3D", "Reconstituer une base de fonctions utilitaires en C", "Déployer un cluster Kubernetes", "Programmer un compilateur LLVM"],
        correct: "Reconstituer une base de fonctions utilitaires en C",
      },
      {
        text: "Quel projet 42 est centré sur les pipes, les redirections et `execve` ?",
        options: ["pipex", "netpractice", "born2beroot", "fract-ol"],
        correct: "pipex",
      },
      {
        text: "Quel sujet est principalement abordé dans `Born2beroot` ?",
        options: ["L'administration système et la virtualisation", "Le développement mobile natif", "Le machine learning", "Les microservices en Go"],
        correct: "L'administration système et la virtualisation",
      },
      {
        text: "À quoi sert surtout `netpractice` ?",
        options: ["À apprendre les bases du réseau et de l'adressage IP", "À écrire un mini compilateur", "À manipuler OpenGL", "À découvrir React"],
        correct: "À apprendre les bases du réseau et de l'adressage IP",
      },
      {
        text: "Quel moteur ou technique de rendu est classiquement reproduit dans `cub3d` ?",
        options: ["Le path tracing", "Le raycasting façon Wolfenstein 3D", "Le raster inversé de Quake III", "Le rendu voxel type Minecraft"],
        correct: "Le raycasting façon Wolfenstein 3D",
      },
      {
        text: "Quel ensemble de projets 42 introduit généralement l'orienté objet en C++ ?",
        options: ["Les CPP Modules", "Les ML Modules", "Les Unix Modules", "Les STL Exams"],
        correct: "Les CPP Modules",
      },
      {
        text: "Quel est le but de `MiniLibX` dans beaucoup de projets graphiques 42 ?",
        options: ["Servir de mini bibliothèque graphique pour fenêtres, images et événements", "Compiler automatiquement le C++", "Créer des API REST", "Mesurer les performances CPU"],
        correct: "Servir de mini bibliothèque graphique pour fenêtres, images et événements",
      },
      {
        text: "Quel est l'intérêt d'un `Exam Rank` dans le cursus 42 ?",
        options: ["Valider des exercices sous contrainte de temps et en autonomie", "Présenter son portfolio à un jury RH", "Mesurer la popularité des projets", "Gérer les stages obligatoires"],
        correct: "Valider des exercices sous contrainte de temps et en autonomie",
      },
      {
        text: "Quel projet 42 demande souvent de conteneuriser plusieurs services et de les faire cohabiter ?",
        options: ["Inception", "so_long", "fdf", "libft"],
        correct: "Inception",
      },
    ],
  },
  {
    title: "Gaming Classics",
    questions: [
      {
        text: "Quelle console a popularisé massivement le jeu portable avec des cartouches grises ?",
        options: ["PSP", "Game Boy", "Game Gear", "Nintendo DS"],
        correct: "Game Boy",
      },
      {
        text: "Quel personnage est la mascotte historique de Nintendo ?",
        options: ["Link", "Sonic", "Mario", "Kirby"],
        correct: "Mario",
      },
      {
        text: "Dans quelle licence retrouve-t-on le personnage de Master Chief ?",
        options: ["Mass Effect", "Halo", "Destiny", "Gears of War"],
        correct: "Halo",
      },
      {
        text: "Quel studio est derrière la série `The Legend of Zelda` ?",
        options: ["Capcom", "Square Enix", "Nintendo", "Sega"],
        correct: "Nintendo",
      },
      {
        text: "Quel jeu a popularisé le genre battle royale auprès du grand public avant d'être rejoint par Fortnite ?",
        options: ["PUBG", "Apex Legends", "Warzone", "H1Z1"],
        correct: "PUBG",
      },
      {
        text: "Quelle console de Sony a marqué le passage massif au jeu 3D pour beaucoup de joueurs ?",
        options: ["PlayStation", "PlayStation 2", "PlayStation 3", "PlayStation Vita"],
        correct: "PlayStation",
      },
      {
        text: "Dans quel jeu trouve-t-on la phrase `The cake is a lie` ?",
        options: ["Half-Life 2", "Portal", "BioShock", "Fallout 3"],
        correct: "Portal",
      },
      {
        text: "Quelle franchise met en scène Geralt de Riv ?",
        options: ["Dragon Age", "The Witcher", "Skyrim", "Fable"],
        correct: "The Witcher",
      },
      {
        text: "Dans quelle licence incarne-t-on souvent Link ?",
        options: ["Fire Emblem", "The Legend of Zelda", "Metroid", "Castlevania"],
        correct: "The Legend of Zelda",
      },
      {
        text: "Quel jeu de Mojang a popularisé un sandbox en voxels ultra créatif ?",
        options: ["Terraria", "Minecraft", "Roblox", "Valheim"],
        correct: "Minecraft",
      },
      {
        text: "Quelle licence de Valve repose sur deux équipes, terroristes et antiterroristes ?",
        options: ["Team Fortress", "Counter-Strike", "Left 4 Dead", "Dota"],
        correct: "Counter-Strike",
      },
      {
        text: "Quel jeu de Blizzard est centré sur des affrontements d'équipes avec héros aux capacités distinctes ?",
        options: ["StarCraft II", "Overwatch", "Diablo IV", "Hearthstone"],
        correct: "Overwatch",
      },
      {
        text: "Quel jeu est célèbre pour ses pièces qui tombent et s'emboîtent en lignes complètes ?",
        options: ["Puyo Puyo", "Columns", "Tetris", "Dr. Mario"],
        correct: "Tetris",
      },
      {
        text: "Quel titre a fortement contribué à populariser le FPS sur PC au début des années 90 ?",
        options: ["Doom", "Myst", "SimCity 2000", "Prince of Persia"],
        correct: "Doom",
      },
      {
        text: "Quelle mascotte bleue est historiquement associée à Sega ?",
        options: ["Mega Man", "Crash Bandicoot", "Sonic", "Bomberman"],
        correct: "Sonic",
      },
      {
        text: "Sur quelle console la première génération de `Pokemon` a-t-elle été lancée ?",
        options: ["Super Nintendo", "Game Boy", "Nintendo 64", "GameCube"],
        correct: "Game Boy",
      },
      {
        text: "Quel jeu de versus fighting a marqué les salles d'arcade avec Ryu et Chun-Li ?",
        options: ["Mortal Kombat", "Tekken", "Street Fighter II", "Virtua Fighter"],
        correct: "Street Fighter II",
      },
      {
        text: "Quelle héroïne porte l'armure dans la série `Metroid` ?",
        options: ["Lara Croft", "Samus Aran", "Jill Valentine", "Aloy"],
        correct: "Samus Aran",
      },
      {
        text: "La province de Bordeciel est le théâtre principal de quel jeu ?",
        options: ["Dragon's Dogma", "The Elder Scrolls V: Skyrim", "Dragon Age: Origins", "Fable II"],
        correct: "The Elder Scrolls V: Skyrim",
      },
      {
        text: "Quel studio développe `League of Legends` ?",
        options: ["Valve", "Riot Games", "Blizzard", "Hi-Rez"],
        correct: "Riot Games",
      },
      {
        text: "Dans quelle franchise incarne-t-on Kratos ?",
        options: ["Devil May Cry", "God of War", "Darksiders", "Bayonetta"],
        correct: "God of War",
      },
      {
        text: "Quel genre décrit le mieux la série `Diablo` ?",
        options: ["Visual novel", "Hack'n'slash action-RPG", "Simulation sportive", "FPS tactique"],
        correct: "Hack'n'slash action-RPG",
      },
      {
        text: "Quel jeu de stratégie au tour par tour est centré sur le développement d'une civilisation à travers les âges ?",
        options: ["Age of Empires II", "Civilization", "Command & Conquer", "Warcraft III"],
        correct: "Civilization",
      },
      {
        text: "Quelle série est emblématique du jeu d'infiltration avec Solid Snake ?",
        options: ["Splinter Cell", "Metal Gear Solid", "Hitman", "Syphon Filter"],
        correct: "Metal Gear Solid",
      },
      {
        text: "Quel jeu de course arcade de Nintendo met en scène des karts et des objets sur circuit ?",
        options: ["F-Zero", "Diddy Kong Racing", "Mario Kart", "Wave Race"],
        correct: "Mario Kart",
      },
    ],
  },
  {
    title: "Studios & Franchises",
    questions: [
      {
        text: "Quel studio est à l'origine de la série `Dark Souls` ?",
        options: ["PlatinumGames", "FromSoftware", "Remedy", "Naughty Dog"],
        correct: "FromSoftware",
      },
      {
        text: "Quel studio développe la franchise `Grand Theft Auto` ?",
        options: ["Rockstar Games", "Ubisoft", "EA", "Valve"],
        correct: "Rockstar Games",
      },
      {
        text: "Quelle franchise appartient à Blizzard Entertainment ?",
        options: ["Halo", "Diablo", "Assassin's Creed", "Tekken"],
        correct: "Diablo",
      },
      {
        text: "Quel studio est fortement associé à `Half-Life` et `Counter-Strike` ?",
        options: ["Valve", "Epic Games", "Bungie", "CD Projekt"],
        correct: "Valve",
      },
      {
        text: "Quel éditeur possède la franchise `Final Fantasy` ?",
        options: ["Capcom", "Konami", "Square Enix", "Bandai Namco"],
        correct: "Square Enix",
      },
      {
        text: "Quel studio est derrière `The Last of Us` ?",
        options: ["Santa Monica Studio", "Naughty Dog", "Insomniac Games", "Sucker Punch"],
        correct: "Naughty Dog",
      },
      {
        text: "Quel studio est connu pour `Elden Ring` et `Bloodborne` ?",
        options: ["FromSoftware", "Atlus", "Arc System Works", "Larian Studios"],
        correct: "FromSoftware",
      },
      {
        text: "Quelle franchise est historiquement liée à Capcom ?",
        options: ["God of War", "Resident Evil", "Uncharted", "Ratchet & Clank"],
        correct: "Resident Evil",
      },
      {
        text: "Quel studio est derrière la franchise `God of War` ?",
        options: ["Santa Monica Studio", "Insomniac Games", "Bungie", "Respawn"],
        correct: "Santa Monica Studio",
      },
      {
        text: "Quel studio a créé `The Witcher` puis `Cyberpunk 2077` ?",
        options: ["Larian Studios", "CD Projekt Red", "IO Interactive", "Obsidian"],
        correct: "CD Projekt Red",
      },
      {
        text: "Quel studio est connu pour `Baldur's Gate 3` ?",
        options: ["Larian Studios", "BioWare", "Arkane", "Monolith"],
        correct: "Larian Studios",
      },
      {
        text: "Quelle franchise majeure est associée à Bungie avant `Destiny` ?",
        options: ["Halo", "Mass Effect", "Warcraft", "Borderlands"],
        correct: "Halo",
      },
      {
        text: "Quel éditeur est fortement associé à la franchise `Assassin's Creed` ?",
        options: ["Ubisoft", "Sega", "THQ Nordic", "505 Games"],
        correct: "Ubisoft",
      },
      {
        text: "Quel studio est derrière `Apex Legends` et `Titanfall` ?",
        options: ["Respawn Entertainment", "id Software", "MachineGames", "People Can Fly"],
        correct: "Respawn Entertainment",
      },
      {
        text: "Quel studio PlayStation est connu pour `Ratchet & Clank` et les récents `Spider-Man` ?",
        options: ["Bluepoint Games", "Insomniac Games", "Media Molecule", "Housemarque"],
        correct: "Insomniac Games",
      },
      {
        text: "Quel studio est à l'origine de `Alan Wake` et `Control` ?",
        options: ["Remedy Entertainment", "Quantic Dream", "Telltale Games", "Avalanche Studios"],
        correct: "Remedy Entertainment",
      },
      {
        text: "Quel studio historique est lié à la franchise `DOOM` ?",
        options: ["id Software", "Crytek", "Rebellion", "PlatinumGames"],
        correct: "id Software",
      },
      {
        text: "Quel studio développe la série `Horizon` avec Aloy ?",
        options: ["Guerrilla Games", "Bend Studio", "Moon Studios", "Deck Nine"],
        correct: "Guerrilla Games",
      },
      {
        text: "Quel studio japonais est principalement associé à la série `Persona` ?",
        options: ["Atlus", "Level-5", "Spike Chunsoft", "Mistwalker"],
        correct: "Atlus",
      },
      {
        text: "Quel studio a créé la franchise `Mass Effect` ?",
        options: ["BioWare", "Obsidian", "Piranha Bytes", "Stoic"],
        correct: "BioWare",
      },
      {
        text: "Quel studio est connu pour `Dishonored` et `Deathloop` ?",
        options: ["Arkane Studios", "Ninja Theory", "Tripwire", "Massive Entertainment"],
        correct: "Arkane Studios",
      },
      {
        text: "Quel studio indépendant est derrière `Hades` ?",
        options: ["Supergiant Games", "Team Cherry", "Motion Twin", "ConcernedApe"],
        correct: "Supergiant Games",
      },
      {
        text: "Quel studio développe la série `Hitman` à l'ère moderne ?",
        options: ["IO Interactive", "Playdead", "Asobo Studio", "MercurySteam"],
        correct: "IO Interactive",
      },
      {
        text: "Quel studio a fondé l'univers de `Death Stranding` ?",
        options: ["Kojima Productions", "PlatinumGames", "Grasshopper Manufacture", "Ryu Ga Gotoku Studio"],
        correct: "Kojima Productions",
      },
      {
        text: "Quel studio est connu pour `Fallout: New Vegas` et `Pillars of Eternity` ?",
        options: ["Obsidian Entertainment", "Black Forest Games", "Blue Twelve", "Dontnod"],
        correct: "Obsidian Entertainment",
      },
    ],
  },
  {
    title: "Startup Basics",
    questions: [
      {
        text: "Que signifie généralement MVP dans une logique produit ?",
        options: ["Most Valuable Plan", "Minimum Viable Product", "Main Value Proposition", "Minimal Venture Process"],
        correct: "Minimum Viable Product",
      },
      {
        text: "Qu'appelle-t-on la traction dans une startup ?",
        options: ["Le style visuel du produit", "Les signaux d'adoption et de croissance", "Le budget marketing annuel", "Le nombre de bugs corrigés"],
        correct: "Les signaux d'adoption et de croissance",
      },
      {
        text: "Quel est le but principal d'un MVP ?",
        options: ["Construire la version finale", "Tester une hypothèse rapidement", "Impressionner les investisseurs avec beaucoup de features", "Éviter tout contact utilisateur"],
        correct: "Tester une hypothèse rapidement",
      },
      {
        text: "Dans `problem / solution fit`, qu'essaie-t-on surtout de valider ?",
        options: ["Le pricing exact", "L'existence d'un problème réel et d'une réponse crédible", "Le design du logo", "Le nom de domaine"],
        correct: "L'existence d'un problème réel et d'une réponse crédible",
      },
      {
        text: "Quel est le risque d'ajouter trop de fonctionnalités trop tôt ?",
        options: ["Mieux convaincre plus vite", "Diluer le produit et ralentir l'apprentissage", "Réduire les coûts d'infra", "Automatiser la rétention"],
        correct: "Diluer le produit et ralentir l'apprentissage",
      },
      {
        text: "Que cherche une startup early-stage avant tout ?",
        options: ["Un organigramme complet", "Un problème bien douloureux et des utilisateurs engagés", "Un siège social plus grand", "Un service RH"],
        correct: "Un problème bien douloureux et des utilisateurs engagés",
      },
      {
        text: "Que mesure principalement la rétention ?",
        options: ["Le revenu cumulé des fondateurs", "Le retour des utilisateurs dans le temps", "Le nombre d'emails envoyés", "Le délai de recrutement"],
        correct: "Le retour des utilisateurs dans le temps",
      },
      {
        text: "Quel est le bon réflexe quand une hypothèse produit n'est pas validée ?",
        options: ["Ignorer le signal", "Lancer encore plus de features", "Réapprendre et itérer", "Changer le logo"],
        correct: "Réapprendre et itérer",
      },
      {
        text: "Pourquoi parler à des utilisateurs tôt est-il précieux ?",
        options: ["Pour ralentir la roadmap", "Pour confronter ses hypothèses à la réalité du terrain", "Pour éviter toute métrique", "Pour remplacer le produit par des slides"],
        correct: "Pour confronter ses hypothèses à la réalité du terrain",
      },
      {
        text: "Quel est le but d'un ICP, `ideal customer profile` ?",
        options: ["Définir le client le plus pertinent à servir", "Nommer le logo final", "Mesurer la dette technique", "Calculer le burn GPU"],
        correct: "Définir le client le plus pertinent à servir",
      },
      {
        text: "Qu'est-ce qu'un pivot dans une startup ?",
        options: ["Une levée de fonds express", "Un changement significatif d'approche à partir de l'apprentissage accumulé", "Un bug critique", "Une campagne d'emailing"],
        correct: "Un changement significatif d'approche à partir de l'apprentissage accumulé",
      },
      {
        text: "Quel signal montre souvent qu'un problème est vraiment douloureux ?",
        options: ["Les utilisateurs trouvent l'idée sympa", "Les utilisateurs bricolent déjà des solutions imparfaites", "Le site a une belle landing page", "L'équipe aime beaucoup la techno"],
        correct: "Les utilisateurs bricolent déjà des solutions imparfaites",
      },
      {
        text: "Que mesure le burn rate d'une startup ?",
        options: ["La vitesse de croissance des utilisateurs", "Le rythme auquel elle dépense sa trésorerie", "Le nombre de bugs ouverts", "Le coût d'un clic publicitaire"],
        correct: "Le rythme auquel elle dépense sa trésorerie",
      },
      {
        text: "Que représente la runway ?",
        options: ["Le nombre de clients enterprise signés", "Le temps avant de manquer de cash au rythme actuel", "Le budget marketing trimestriel", "La durée d'un sprint produit"],
        correct: "Le temps avant de manquer de cash au rythme actuel",
      },
      {
        text: "Que signifie CAC dans un contexte startup ?",
        options: ["Customer Acquisition Cost", "Core Activation Curve", "Cash Allocation Cap", "Customer Annual Contract"],
        correct: "Customer Acquisition Cost",
      },
      {
        text: "Que cherche à estimer le LTV ?",
        options: ["La durée d'un ticket support", "La valeur générée par un client sur sa relation avec le produit", "Le nombre de lignes de code par feature", "Le taux de clic d'une campagne"],
        correct: "La valeur générée par un client sur sa relation avec le produit",
      },
      {
        text: "Qu'appelle-t-on souvent un wedge en go-to-market ?",
        options: ["Une entrée étroite mais crédible pour pénétrer un marché", "Un bug de pricing", "Un deck pour investisseurs", "Un recrutement en alternance"],
        correct: "Une entrée étroite mais crédible pour pénétrer un marché",
      },
      {
        text: "Que décrit le plus souvent un `go-to-market` ?",
        options: ["Le langage de programmation du backend", "La manière d'atteindre et convertir ses premiers clients", "Le schéma de base de données", "Le planning des congés"],
        correct: "La manière d'atteindre et convertir ses premiers clients",
      },
      {
        text: "Pourquoi le `founder-market fit` est-il souvent surveillé ?",
        options: ["Parce qu'il remplace la traction", "Parce qu'il reflète l'adéquation entre l'équipe fondatrice et le problème adressé", "Parce qu'il fixe le taux d'imposition", "Parce qu'il détermine le nom de la marque"],
        correct: "Parce qu'il reflète l'adéquation entre l'équipe fondatrice et le problème adressé",
      },
      {
        text: "Dans un contexte B2B, quel trait du cycle de vente est fréquent ?",
        options: ["Il est souvent plus long", "Il disparaît après l'onboarding", "Il est toujours self-serve", "Il ne dépend jamais des décideurs"],
        correct: "Il est souvent plus long",
      },
      {
        text: "Pourquoi tester le pricing tôt peut-il être utile ?",
        options: ["Pour éviter de parler aux clients", "Pour apprendre la disposition à payer réelle", "Pour figer le produit définitivement", "Pour réduire les coûts de serveur"],
        correct: "Pour apprendre la disposition à payer réelle",
      },
      {
        text: "Que signifie TAM dans une présentation startup ?",
        options: ["Total Addressable Market", "Team Alignment Model", "Technical Acquisition Mode", "Target Activation Metric"],
        correct: "Total Addressable Market",
      },
      {
        text: "Que mesure le churn ?",
        options: ["Les pertes de clients ou d'utilisateurs dans le temps", "La marge brute", "La qualité du design system", "Le nombre de commits quotidiens"],
        correct: "Les pertes de clients ou d'utilisateurs dans le temps",
      },
      {
        text: "Pourquoi la distribution est-elle un sujet majeur pour une startup ?",
        options: ["Parce que le produit se vend toujours seul", "Parce qu'un bon produit sans canal d'accès reste difficile à faire adopter", "Parce qu'elle remplace le support", "Parce qu'elle supprime le besoin de roadmap"],
        correct: "Parce qu'un bon produit sans canal d'accès reste difficile à faire adopter",
      },
      {
        text: "Quel intérêt ont des revenus récurrents pour une jeune startup ?",
        options: ["Ils rendent souvent les prévisions plus lisibles", "Ils empêchent toute concurrence", "Ils suppriment le besoin de produit", "Ils remplacent l'onboarding"],
        correct: "Ils rendent souvent les prévisions plus lisibles",
      },
    ],
  },
  {
    title: "Produit & Growth",
    questions: [
      {
        text: "Lequel de ces indicateurs est souvent utilisé pour suivre l'activation ?",
        options: ["Le nombre de lignes de code", "Le moment où l'utilisateur atteint une première valeur", "Le coût des bureaux", "Le nombre de repos Git locaux"],
        correct: "Le moment où l'utilisateur atteint une première valeur",
      },
      {
        text: "En produit, que signifie souvent `time to value` ?",
        options: ["Le temps de build en CI", "Le délai avant que l'utilisateur perçoive un bénéfice réel", "Le temps avant la première levée", "Le délai de réponse du support"],
        correct: "Le délai avant que l'utilisateur perçoive un bénéfice réel",
      },
      {
        text: "Que cherche généralement un bon onboarding ?",
        options: ["Montrer toutes les features d'un coup", "Amener l'utilisateur à une première réussite rapide", "Masquer les actions principales", "Augmenter le nombre de modales"],
        correct: "Amener l'utilisateur à une première réussite rapide",
      },
      {
        text: "Quel est le risque d'optimiser la croissance avant l'activation ?",
        options: ["Aucun, c'est toujours optimal", "Faire venir plus de monde dans un produit qui convertit mal", "Réduire les coûts serveurs", "Mieux comprendre son ICP"],
        correct: "Faire venir plus de monde dans un produit qui convertit mal",
      },
      {
        text: "Que cherche à mesurer un funnel produit ?",
        options: ["La vitesse du GPU", "Les étapes de conversion et leurs pertes", "Le backlog design", "La hiérarchie de l'équipe"],
        correct: "Les étapes de conversion et leurs pertes",
      },
      {
        text: "Quel est l'intérêt d'un test A/B ?",
        options: ["Comparer deux variantes sur un même objectif", "Changer tout le produit d'un coup", "Remplacer la recherche utilisateur", "Supprimer le besoin de métriques"],
        correct: "Comparer deux variantes sur un même objectif",
      },
      {
        text: "Quand on parle de `north star metric`, on vise surtout :",
        options: ["Une métrique secondaire de support", "La mesure qui résume la valeur créée pour l'utilisateur", "Le budget annuel de l'entreprise", "Le nombre de branches Git"],
        correct: "La mesure qui résume la valeur créée pour l'utilisateur",
      },
      {
        text: "Quel est souvent le meilleur premier levier growth pour un petit produit ?",
        options: ["La publicité massive", "Un bouche-à-oreille servi par une vraie valeur produit", "Des partenariats TV", "Un changement de logo mensuel"],
        correct: "Un bouche-à-oreille servi par une vraie valeur produit",
      },
      {
        text: "Que cherche souvent à réduire une équipe produit sur un formulaire d'inscription ?",
        options: ["La lisibilité du CTA", "La friction à l'entrée", "Le temps de rétention", "Le nombre de segments utilisateur"],
        correct: "La friction à l'entrée",
      },
      {
        text: "Pourquoi segmenter ses analyses par type d'utilisateur ?",
        options: ["Pour compliquer les dashboards", "Pour voir des comportements différents masqués par la moyenne globale", "Pour supprimer les funnels", "Pour éviter les interviews"],
        correct: "Pour voir des comportements différents masqués par la moyenne globale",
      },
      {
        text: "Quel est l'intérêt d'un événement analytique bien nommé ?",
        options: ["Faciliter une lecture fiable du comportement produit", "Améliorer le CSS", "Réduire la latence réseau", "Remplacer le support client"],
        correct: "Faciliter une lecture fiable du comportement produit",
      },
      {
        text: "Quand une fonctionnalité a beaucoup d'usage mais peu d'impact business, que faut-il souvent faire ?",
        options: ["L'ignorer définitivement", "Mieux comprendre sa contribution réelle avant d'investir davantage", "Supprimer toutes les métriques", "Augmenter automatiquement les ads"],
        correct: "Mieux comprendre sa contribution réelle avant d'investir davantage",
      },
      {
        text: "Que cherche à indiquer le ratio `DAU / MAU` ?",
        options: ["La marge du produit", "Le niveau de stickiness ou d'habitude d'usage", "Le coût de l'infrastructure", "Le salaire moyen de l'équipe"],
        correct: "Le niveau de stickiness ou d'habitude d'usage",
      },
      {
        text: "À quoi sert une analyse par cohortes ?",
        options: ["À mélanger tous les utilisateurs dans une seule moyenne", "À comparer des groupes d'utilisateurs selon leur période ou contexte d'entrée", "À remplacer les événements produit", "À calculer le temps de build"],
        correct: "À comparer des groupes d'utilisateurs selon leur période ou contexte d'entrée",
      },
      {
        text: "Que mesure un taux de conversion ?",
        options: ["La part d'utilisateurs qui accomplissent une action cible", "Le poids du bundle frontend", "Le taux de compression des images", "Le nombre moyen de réunions par semaine"],
        correct: "La part d'utilisateurs qui accomplissent une action cible",
      },
      {
        text: "Qu'appelle-t-on souvent une vanity metric ?",
        options: ["Une métrique flatteuse mais peu actionnable", "Une métrique impossible à collecter", "Une métrique réservée à la finance", "Une métrique uniquement backend"],
        correct: "Une métrique flatteuse mais peu actionnable",
      },
      {
        text: "Que désigne souvent un `aha moment` en produit ?",
        options: ["Le premier bug critique détecté", "Un moment d'usage corrélé à la compréhension de la valeur du produit", "Le moment où le CEO change d'avis", "Une campagne de pub virale"],
        correct: "Un moment d'usage corrélé à la compréhension de la valeur du produit",
      },
      {
        text: "Quel lien existe le plus souvent entre churn et rétention ?",
        options: ["Ils sont indépendants", "Le churn est l'une des faces opposées de la rétention", "Le churn mesure seulement les revenus", "La rétention ne concerne que le support"],
        correct: "Le churn est l'une des faces opposées de la rétention",
      },
      {
        text: "Qu'est-ce qu'une boucle de referral ?",
        options: ["Une erreur d'analytics", "Un mécanisme par lequel des utilisateurs existants amènent de nouveaux utilisateurs", "Une campagne RH", "Une réécriture du frontend"],
        correct: "Un mécanisme par lequel des utilisateurs existants amènent de nouveaux utilisateurs",
      },
      {
        text: "Quel risque prend-on avec un paywall placé trop tôt ?",
        options: ["Réduire le temps de build", "Empêcher l'utilisateur de percevoir la valeur avant de devoir payer", "Augmenter naturellement la rétention", "Supprimer le besoin d'onboarding"],
        correct: "Empêcher l'utilisateur de percevoir la valeur avant de devoir payer",
      },
      {
        text: "Que mesure l'adoption d'une fonctionnalité ?",
        options: ["Le nombre de lignes CSS associées", "La part des utilisateurs ciblés qui l'utilisent réellement", "Le coût de l'équipe produit", "La taille de la base SQL"],
        correct: "La part des utilisateurs ciblés qui l'utilisent réellement",
      },
      {
        text: "Pourquoi compléter les dashboards par du qualitatif comme des replays ou interviews ?",
        options: ["Pour remplacer toutes les métriques", "Pour comprendre le pourquoi derrière les comportements observés", "Pour ralentir le produit", "Pour supprimer le funnel"],
        correct: "Pour comprendre le pourquoi derrière les comportements observés",
      },
      {
        text: "Pourquoi préparer un plan d'instrumentation avant une feature importante ?",
        options: ["Pour savoir quelles données suivre dès le lancement", "Pour éviter toute hypothèse", "Pour écrire moins de tests", "Pour réduire le nombre de profils utilisateurs"],
        correct: "Pour savoir quelles données suivre dès le lancement",
      },
      {
        text: "Quel problème rend un test A/B difficile à interpréter ?",
        options: ["Un échantillon trop faible", "Une bonne définition du succès", "Un objectif unique clair", "Une population bien randomisée"],
        correct: "Un échantillon trop faible",
      },
      {
        text: "Qu'indique souvent une courbe de rétention qui se stabilise après la baisse initiale ?",
        options: ["Un signal de valeur récurrente chez une partie des utilisateurs", "Un bug d'affichage certain", "Une baisse du budget marketing", "Une absence totale de product-market fit"],
        correct: "Un signal de valeur récurrente chez une partie des utilisateurs",
      },
    ],
  },
  {
    title: "Décrocher son stage tech",
    questions: [
      {
        text: "Quel est le meilleur réflexe avant d'envoyer beaucoup de candidatures ?",
        options: ["Ne rien relire", "Clarifier son positionnement et ses preuves de niveau", "Changer d'email tous les jours", "Écrire le même texte partout sans adaptation"],
        correct: "Clarifier son positionnement et ses preuves de niveau",
      },
      {
        text: "Sur un GitHub junior, qu'est-ce qui aide le plus ?",
        options: ["Des repos vides mais nombreux", "Quelques projets compréhensibles et propres", "Uniquement des forks", "Des noms de repos obscurs"],
        correct: "Quelques projets compréhensibles et propres",
      },
      {
        text: "Quel est l'objectif principal d'un CV junior en tech ?",
        options: ["Montrer une expérience de 10 ans", "Rendre le profil lisible et crédible en quelques secondes", "Faire une mise en page complexe", "Énumérer tous les mots-clés possibles"],
        correct: "Rendre le profil lisible et crédible en quelques secondes",
      },
      {
        text: "En entretien, que vaut généralement mieux quand on ne sait pas ?",
        options: ["Inventer une réponse", "Dire clairement ce qu'on sait et comment on raisonnerait", "Changer de sujet", "Rester silencieux sans expliquer"],
        correct: "Dire clairement ce qu'on sait et comment on raisonnerait",
      },
      {
        text: "Quel est un bon signal dans une candidature stage ?",
        options: ["Aucun lien vers ses projets", "Une lettre ultra générique", "Des exemples concrets de projets ou d'impact", "Un CV en image floue"],
        correct: "Des exemples concrets de projets ou d'impact",
      },
      {
        text: "Pourquoi adapter légèrement sa candidature à l'entreprise ?",
        options: ["Pour rallonger le PDF", "Pour montrer qu'on comprend le contexte et le besoin", "Parce que c'est toujours obligatoire légalement", "Pour éviter d'avoir un portfolio"],
        correct: "Pour montrer qu'on comprend le contexte et le besoin",
      },
      {
        text: "Quel est un mauvais réflexe pendant une recherche de stage ?",
        options: ["Suivre ses candidatures", "Demander du feedback", "Attendre en silence sans relancer ni apprendre", "Améliorer son portfolio"],
        correct: "Attendre en silence sans relancer ni apprendre",
      },
      {
        text: "Quelle posture aide souvent un profil junior à convaincre ?",
        options: ["Être défensif", "Montrer curiosité, progression et fiabilité", "Surjouer l'expertise", "Éviter toute question"],
        correct: "Montrer curiosité, progression et fiabilité",
      },
      {
        text: "Quel type de projet personnel aide souvent le plus en entretien ?",
        options: ["Un projet copié sans explication", "Un projet que l'on peut expliquer clairement de bout en bout", "Un repo vide avec un gros README", "Une idée non codée"],
        correct: "Un projet que l'on peut expliquer clairement de bout en bout",
      },
      {
        text: "Pourquoi préparer quelques questions à poser en entretien ?",
        options: ["Pour meubler la fin", "Pour montrer de l'intérêt et évaluer le cadre de stage", "Parce que c'est noté sur 42", "Pour éviter de parler de ses projets"],
        correct: "Pour montrer de l'intérêt et évaluer le cadre de stage",
      },
      {
        text: "Quel est un bon usage de LinkedIn pendant une recherche de stage ?",
        options: ["Spammer sans contexte", "Repérer des équipes et contextualiser ses prises de contact", "Masquer tous ses projets", "Éviter toute interaction"],
        correct: "Repérer des équipes et contextualiser ses prises de contact",
      },
      {
        text: "Que faut-il faire après un entretien stage quand c'est pertinent ?",
        options: ["Disparaître jusqu'à la réponse", "Envoyer un message court de remerciement et de suivi", "Refaire tout son CV", "Supprimer son GitHub"],
        correct: "Envoyer un message court de remerciement et de suivi",
      },
      {
        text: "À quoi sert un bon README sur un projet perso lors d'une candidature ?",
        options: ["À décorer le repo uniquement", "À aider un recruteur ou un dev à comprendre vite le projet", "À remplacer tout le code", "À masquer les limites du projet"],
        correct: "À aider un recruteur ou un dev à comprendre vite le projet",
      },
      {
        text: "Quel portfolio convainc souvent davantage pour un profil junior ?",
        options: ["Dix projets à moitié terminés", "Deux ou trois projets solides et explicables", "Uniquement des captures d'écran sans code", "Une liste de tutos suivis"],
        correct: "Deux ou trois projets solides et explicables",
      },
      {
        text: "Lors d'un exercice technique, quel est un bon réflexe au début ?",
        options: ["Coder immédiatement sans vérifier l'énoncé", "Clarifier les contraintes et reformuler le problème", "Attendre une solution du recruteur", "Changer de sujet"],
        correct: "Clarifier les contraintes et reformuler le problème",
      },
      {
        text: "Dans un message de candidature, qu'est-ce qui aide souvent à capter l'attention ?",
        options: ["Une ouverture très générique", "Un lien concret entre ton profil et le besoin de l'équipe", "Une phrase copiée-collée identique partout", "Un bloc de buzzwords sans preuve"],
        correct: "Un lien concret entre ton profil et le besoin de l'équipe",
      },
      {
        text: "Quelle méthode aide à structurer une réponse comportementale en entretien ?",
        options: ["SCRUM", "STAR", "CRUD", "SMART"],
        correct: "STAR",
      },
      {
        text: "Quel élément peut montrer que tu sais collaborer en équipe ?",
        options: ["Des discussions de PR ou revues de code bien menées", "Un repo sans historique", "Un CV sans lien", "Des captures d'écran sans contexte"],
        correct: "Des discussions de PR ou revues de code bien menées",
      },
      {
        text: "Pourquoi reprendre la stack mentionnée dans l'offre quand c'est vrai et prouvé ?",
        options: ["Pour optimiser la lisibilité entre le besoin et ton expérience", "Pour rallonger artificiellement le CV", "Pour éviter de montrer des projets", "Parce que les recruteurs ne lisent que ça"],
        correct: "Pour optimiser la lisibilité entre le besoin et ton expérience",
      },
      {
        text: "Que faire si un take-home semble flou ou trop vaste ?",
        options: ["L'abandonner sans réponse", "Demander le périmètre attendu et le temps visé", "Inventer des règles", "Copier une solution en ligne"],
        correct: "Demander le périmètre attendu et le temps visé",
      },
      {
        text: "Avant un entretien visio, quel détail pratique évite des points de friction inutiles ?",
        options: ["Tester son micro, sa caméra et son environnement", "Changer d'ordinateur au dernier moment", "Oublier le lien de réunion", "Couper toute connexion réseau"],
        correct: "Tester son micro, sa caméra et son environnement",
      },
      {
        text: "Quel type d'information rend un projet plus crédible sur un CV ?",
        options: ["Des formulations vagues", "Des faits concrets: stack, rôle, résultat, périmètre", "Seulement le nom du repo", "Le nombre de cafés bus"],
        correct: "Des faits concrets: stack, rôle, résultat, périmètre",
      },
      {
        text: "Que permet souvent une sélection propre de repos épinglés sur GitHub ?",
        options: ["Guider rapidement vers les meilleurs exemples de travail", "Masquer l'historique Git", "Remplacer le CV", "Supprimer le besoin de README"],
        correct: "Guider rapidement vers les meilleurs exemples de travail",
      },
      {
        text: "Pourquoi indiquer clairement ses dates de disponibilité pour un stage ?",
        options: ["Pour aider l'entreprise à évaluer tout de suite la compatibilité logistique", "Pour faire joli dans le CV", "Pour éviter toute discussion technique", "Parce que GitHub l'exige"],
        correct: "Pour aider l'entreprise à évaluer tout de suite la compatibilité logistique",
      },
      {
        text: "Quel signal donne un portfolio où chaque projet explique problème, choix et limites ?",
        options: ["Une posture plus réfléchie et mature", "Un manque de code", "Une obsession du design uniquement", "Une incapacité à travailler en équipe"],
        correct: "Une posture plus réfléchie et mature",
      },
    ],
  },
];

async function seedQuiz(prisma: PrismaClient, quiz: SeedQuiz): Promise<void> {
  const existing = await prisma.quiz.findFirst({
    where: { title: quiz.title },
  });

  const persistedQuiz = existing
    ? existing
    : await prisma.quiz.create({
        data: { title: quiz.title },
      });

  const existingQuestionCount = await prisma.quizQuestion.count({
    where: { quizId: persistedQuiz.id },
  });

  const questions = quiz.questions.map((question, index) => {
    const balancedQuestion = withBalancedCorrectAnswerPosition(question, index);

    return {
      quizId: persistedQuiz.id,
      questionText: balancedQuestion.text,
      answers: balancedQuestion.options,
      correctAnswer: balancedQuestion.correct,
      position: index + 1,
      points: balancedQuestion.points ?? 100,
    };
  });

  for (const question of questions) {
    await prisma.quizQuestion.upsert({
      where: {
        quizId_position: {
          quizId: question.quizId,
          position: question.position,
        },
      },
      update: {
        questionText: question.questionText,
        answers: question.answers,
        correctAnswer: question.correctAnswer,
        points: question.points,
      },
      create: question,
    });
  }

  const addedQuestionCount = Math.max(0, questions.length - existingQuestionCount);

  console.log(
    `[seed] Quiz "${quiz.title}": +${addedQuestionCount} question(s), ${questions.length} total, answers balanced.`,
  );
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    for (const quiz of LAUNCH_QUIZZES) {
      await seedQuiz(prisma, quiz);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[seed] failed", error);
  process.exit(1);
});
