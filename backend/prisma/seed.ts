import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const DEFAULT_QUIZ_TITLE = "Culture générale";

type SeedQuestion = {
  text: string;
  options: string[];
  correct: string;
  points?: number;
};

const QUESTIONS: SeedQuestion[] = [
  {
    text: "Quelle est la capitale de l'Australie ?",
    options: ["Sydney", "Canberra", "Melbourne", "Perth"],
    correct: "Canberra",
  },
  {
    text: "Combien de côtés possède un hexagone ?",
    options: ["5", "6", "7", "8"],
    correct: "6",
  },
  {
    text: "Qui a peint la Joconde ?",
    options: ["Michel-Ange", "Raphaël", "Léonard de Vinci", "Botticelli"],
    correct: "Léonard de Vinci",
  },
  {
    text: "Quelle planète est la plus proche du Soleil ?",
    options: ["Vénus", "Terre", "Mars", "Mercure"],
    correct: "Mercure",
  },
  {
    text: "Quel est le plus long fleuve du monde ?",
    options: ["Amazone", "Nil", "Yangzi Jiang", "Mississippi"],
    correct: "Nil",
  },
  {
    text: "En quelle année le mur de Berlin est-il tombé ?",
    options: ["1987", "1989", "1991", "1993"],
    correct: "1989",
  },
  {
    text: "Quel gaz les plantes absorbent-elles pour la photosynthèse ?",
    options: ["Oxygène", "Azote", "Dioxyde de carbone", "Hydrogène"],
    correct: "Dioxyde de carbone",
  },
  {
    text: "Combien de joueurs compte une équipe de football sur le terrain ?",
    options: ["9", "10", "11", "12"],
    correct: "11",
  },
  {
    text: "Qui a écrit « Les Misérables » ?",
    options: ["Émile Zola", "Victor Hugo", "Gustave Flaubert", "Alexandre Dumas"],
    correct: "Victor Hugo",
  },
  {
    text: "Quel est le symbole chimique de l'or ?",
    options: ["Or", "Au", "Ag", "Gd"],
    correct: "Au",
  },
  {
    text: "Dans quel pays se trouve le Machu Picchu ?",
    options: ["Mexique", "Brésil", "Pérou", "Chili"],
    correct: "Pérou",
  },
  {
    text: "Quelle est la langue la plus parlée au monde (locuteurs natifs) ?",
    options: ["Anglais", "Espagnol", "Mandarin", "Hindi"],
    correct: "Mandarin",
  },
  {
    text: "Quel artiste a composé « La Flûte enchantée » ?",
    options: ["Beethoven", "Mozart", "Bach", "Haydn"],
    correct: "Mozart",
  },
  {
    text: "Quel océan borde la côte est du Japon ?",
    options: ["Indien", "Arctique", "Atlantique", "Pacifique"],
    correct: "Pacifique",
  },
  {
    text: "Quel est le plus grand désert du monde ?",
    options: ["Sahara", "Gobi", "Antarctique", "Kalahari"],
    correct: "Antarctique",
  },
  {
    text: "Qui a formulé la théorie de la relativité ?",
    options: ["Isaac Newton", "Niels Bohr", "Albert Einstein", "Marie Curie"],
    correct: "Albert Einstein",
  },
  {
    text: "Combien de continents compte la Terre ?",
    options: ["5", "6", "7", "8"],
    correct: "7",
  },
  {
    text: "Quel animal est le symbole de la sagesse en Occident ?",
    options: ["Renard", "Chouette", "Corbeau", "Éléphant"],
    correct: "Chouette",
  },
  {
    text: "Quel est l'ingrédient principal du guacamole ?",
    options: ["Tomate", "Avocat", "Courgette", "Poivron"],
    correct: "Avocat",
  },
  {
    text: "Quelle équipe a remporté la Coupe du monde de football 2018 ?",
    options: ["Brésil", "Allemagne", "Croatie", "France"],
    correct: "France",
  },
  {
    text: "Quel organe du corps humain filtre le sang ?",
    options: ["Foie", "Rein", "Poumon", "Cœur"],
    correct: "Rein",
  },
  {
    text: "Quelle monnaie est utilisée au Japon ?",
    options: ["Won", "Yuan", "Yen", "Ringgit"],
    correct: "Yen",
  },
  {
    text: "Qui a peint « La Nuit étoilée » ?",
    options: ["Van Gogh", "Monet", "Cézanne", "Degas"],
    correct: "Van Gogh",
  },
  {
    text: "Quel est le plus haut sommet du monde ?",
    options: ["K2", "Kangchenjunga", "Everest", "Makalu"],
    correct: "Everest",
  },
  {
    text: "Quel est le langage du web côté navigateur ?",
    options: ["Python", "JavaScript", "Java", "Ruby"],
    correct: "JavaScript",
  },
  {
    text: "Qui a fondé Microsoft avec Paul Allen ?",
    options: ["Steve Jobs", "Mark Zuckerberg", "Bill Gates", "Larry Page"],
    correct: "Bill Gates",
  },
  {
    text: "Quel est le plus petit État du monde ?",
    options: ["Monaco", "Vatican", "Saint-Marin", "Liechtenstein"],
    correct: "Vatican",
  },
  {
    text: "Combien de minutes dans une journée ?",
    options: ["960", "1200", "1440", "1800"],
    correct: "1440",
  },
  {
    text: "Quel est le symbole chimique de l'eau ?",
    options: ["O2", "CO2", "H2O", "NaCl"],
    correct: "H2O",
  },
  {
    text: "Quelle ville abrite la tour Eiffel ?",
    options: ["Lyon", "Paris", "Marseille", "Bordeaux"],
    correct: "Paris",
  },
  {
    text: "Qui a écrit « Roméo et Juliette » ?",
    options: ["Molière", "Shakespeare", "Racine", "Corneille"],
    correct: "Shakespeare",
  },
  {
    text: "Quelle est la vitesse approximative de la lumière dans le vide ?",
    options: ["150 000 km/s", "300 000 km/s", "500 000 km/s", "1 000 000 km/s"],
    correct: "300 000 km/s",
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const existing = await prisma.quiz.findFirst({ where: { title: DEFAULT_QUIZ_TITLE } });
    const quiz = existing
      ? existing
      : await prisma.quiz.create({ data: { title: DEFAULT_QUIZ_TITLE } });
    const existingQuestions = await prisma.quizQuestion.findMany({
      where: { quizId: quiz.id },
      select: { position: true },
    });
    const existingPositions = new Set(existingQuestions.map((question) => question.position));
    const missingQuestions = QUESTIONS.map((question, index) => ({
      quizId: quiz.id,
      questionText: question.text,
      answers: question.options,
      correctAnswer: question.correct,
      position: index + 1,
      points: question.points ?? 100,
    })).filter((question) => !existingPositions.has(question.position));

    if (missingQuestions.length > 0) {
      await prisma.quizQuestion.createMany({
        data: missingQuestions,
      });
    }

    console.log(
      `[seed] Quiz "${DEFAULT_QUIZ_TITLE}": +${missingQuestions.length} question(s) ajoutee(s), ${existingQuestions.length + missingQuestions.length} total.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[seed] failed", error);
  process.exit(1);
});
