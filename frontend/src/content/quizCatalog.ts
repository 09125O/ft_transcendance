import type { Quiz } from "../services/quizzes";

export type QuizCategory = {
  id: string;
  title: string;
  description: string;
};

export type QuizCatalogEntry = {
  title: string;
  categoryId: string;
  summary: string;
  level: "Débutant" | "Intermédiaire" | "Mixte";
  isLaunchQuiz: boolean;
  sortOrder: number;
};

export const QUIZ_CATEGORIES: QuizCategory[] = [
  {
    id: "code-algo",
    title: "Code & Algo",
    description: "C, C++, logique, debugging et réflexes de dev.",
  },
  {
    id: "gaming",
    title: "Gaming",
    description: "Licences cultes, consoles, studios et culture jeu vidéo.",
  },
  {
    id: "startup-tech",
    title: "Startup & Tech",
    description: "Produit, entrepreneuriat, growth et culture builder.",
  },
  {
    id: "career",
    title: "Stages & Carrière",
    description: "Entretiens, CV, GitHub et premiers pas dans la tech.",
  },
];

const COMMUNITY_CATEGORY: QuizCategory = {
  id: "community",
  title: "Communauté",
  description: "Quiz créés par les joueurs.",
};

const QUIZ_CATALOG: QuizCatalogEntry[] = [
  {
    title: "C Fundamentals",
    categoryId: "code-algo",
    summary: "Teste tes bases en C : mémoire, pointeurs, types et erreurs classiques.",
    level: "Débutant",
    isLaunchQuiz: true,
    sortOrder: 0,
  },
  {
    title: "C++ Essentials",
    categoryId: "code-algo",
    summary: "Références, objets, STL, surcharge et pièges fréquents en C++.",
    level: "Intermédiaire",
    isLaunchQuiz: true,
    sortOrder: 1,
  },
  {
    title: "Culture 42",
    categoryId: "code-algo",
    summary: "Piscine, projets, cluster et références bien connues de l’écosystème 42.",
    level: "Mixte",
    isLaunchQuiz: true,
    sortOrder: 2,
  },
  {
    title: "Gaming Classics",
    categoryId: "gaming",
    summary: "Consoles, licences et jeux cultes que tout joueur reconnaît.",
    level: "Débutant",
    isLaunchQuiz: true,
    sortOrder: 3,
  },
  {
    title: "Studios & Franchises",
    categoryId: "gaming",
    summary: "Les grands studios, leurs licences majeures et leur histoire.",
    level: "Intermédiaire",
    isLaunchQuiz: true,
    sortOrder: 4,
  },
  {
    title: "Startup Basics",
    categoryId: "startup-tech",
    summary: "MVP, traction, marché, exécution : les bases du vocabulaire startup.",
    level: "Débutant",
    isLaunchQuiz: true,
    sortOrder: 5,
  },
  {
    title: "Produit & Growth",
    categoryId: "startup-tech",
    summary: "Acquisition, rétention, feedback et logique produit en contexte réel.",
    level: "Intermédiaire",
    isLaunchQuiz: true,
    sortOrder: 6,
  },
  {
    title: "Décrocher son stage tech",
    categoryId: "career",
    summary: "Recherche, candidature, posture et préparation pour trouver un stage.",
    level: "Débutant",
    isLaunchQuiz: true,
    sortOrder: 7,
  },
];

const QUIZ_CATALOG_BY_TITLE = new Map(
  QUIZ_CATALOG.map((entry) => [entry.title, entry]),
);

export type QuizWithCatalog = Quiz & {
  category: QuizCategory;
  summary: string;
  level: QuizCatalogEntry["level"];
  isLaunchQuiz: boolean;
  sortOrder: number;
};

export function decorateQuiz(quiz: Quiz): QuizWithCatalog {
  const catalog = QUIZ_CATALOG_BY_TITLE.get(quiz.title);
  const category =
    QUIZ_CATEGORIES.find((entry) => entry.id === catalog?.categoryId) ??
    COMMUNITY_CATEGORY;

  return {
    ...quiz,
    category,
    summary:
      catalog?.summary ??
      "Quiz créé par la communauté, prêt à être lancé en room.",
    level: catalog?.level ?? "Mixte",
    isLaunchQuiz: catalog?.isLaunchQuiz ?? false,
    sortOrder: catalog?.sortOrder ?? 999,
  };
}

export function getLaunchQuizzes(quizzes: Quiz[]): QuizWithCatalog[] {
  return quizzes
    .map(decorateQuiz)
    .filter((quiz) => quiz.isLaunchQuiz)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getCommunityQuizzes(quizzes: Quiz[]): QuizWithCatalog[] {
  return quizzes
    .map(decorateQuiz)
    .filter((quiz) => !quiz.isLaunchQuiz)
    .sort((left, right) => {
      if (right.createdAt !== left.createdAt) {
        return right.createdAt.localeCompare(left.createdAt);
      }
      if (right.playCount !== left.playCount) {
        return right.playCount - left.playCount;
      }
      return right.id - left.id;
    });
}

export function getTopPlayedQuizzes(quizzes: Quiz[]): QuizWithCatalog[] {
  return quizzes
    .map(decorateQuiz)
    .sort((left, right) => {
      if (right.playCount !== left.playCount) {
        return right.playCount - left.playCount;
      }
      if (right.activeRoomCount !== left.activeRoomCount) {
        return right.activeRoomCount - left.activeRoomCount;
      }
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }
      return right.createdAt.localeCompare(left.createdAt);
    })
    .slice(0, 4);
}
