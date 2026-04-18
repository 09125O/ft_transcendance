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
        text: "Que vaut `sizeof(char)` en C standard ?",
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
        text: "Que risque-t-on en oubliant un `free` après un `malloc` ?",
        options: ["Une boucle infinie", "Une fuite mémoire", "Une erreur de syntaxe", "Une erreur de linkage"],
        correct: "Une fuite mémoire",
      },
      {
        text: "Quel fichier d'en-tête déclare `printf` ?",
        options: ["<string.h>", "<stdio.h>", "<stdlib.h>", "<unistd.h>"],
        correct: "<stdio.h>",
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

  const existingQuestions = await prisma.quizQuestion.findMany({
    where: { quizId: persistedQuiz.id },
    select: { position: true },
  });
  const existingPositions = new Set(
    existingQuestions.map((question) => question.position),
  );

  const missingQuestions = quiz.questions
    .map((question, index) => ({
      quizId: persistedQuiz.id,
      questionText: question.text,
      answers: question.options,
      correctAnswer: question.correct,
      position: index + 1,
      points: question.points ?? 100,
    }))
    .filter((question) => !existingPositions.has(question.position));

  if (missingQuestions.length > 0) {
    await prisma.quizQuestion.createMany({
      data: missingQuestions,
    });
  }

  console.log(
    `[seed] Quiz "${quiz.title}": +${missingQuestions.length} question(s), ${existingQuestions.length + missingQuestions.length} total.`,
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
