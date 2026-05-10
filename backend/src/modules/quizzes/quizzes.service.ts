import { PrismaService } from "@/prisma/prisma.service";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateQuizDto } from "./dto/create-quiz.dto";

export type QuizResponse = {
  id: number;
  title: string;
  createdAt: string;
  playCount: number;
  activeRoomCount: number;
  questionCount: number;
};

type QuizWithCounts = {
  id: number;
  title: string;
  createdAt: Date;
  _count: {
    games: number;
    questions: number;
  };
};

const HIDDEN_PLAYER_QUIZ_TITLE_PATTERNS = [
  /^__WS_SMOKE_/i,
  /^WS Smoke Quiz\b/i,
  /^__.*DO_NOT_USE__$/i,
  /^Rate Limit Quiz\b/i,
  /^Smoke quiz\b/i,
];

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuiz(dto: CreateQuizDto): Promise<QuizResponse> {
    this.assertValidQuestions(dto);

    const quiz = (await this.prisma.client.quiz.create({
      data: {
        title: dto.title.trim(),
        questions: {
          create: dto.questions.map((question, index) => {
            const answers = question.answers.map((answer) => answer.trim());

            return {
              questionText: question.questionText.trim(),
              answers,
              correctAnswer: answers[question.correctAnswerIndex],
              position: index + 1,
              points: question.points ?? 1,
            };
          }),
        },
      },
      include: {
        _count: {
          select: {
            games: true,
            questions: true,
          },
        },
      },
    })) as QuizWithCounts;

    return this.toQuizResponse(quiz);
  }

  async listQuizzes(): Promise<QuizResponse[]> {
    const quizzes = (await this.prisma.client.quiz.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            games: true,
            questions: true,
          },
        },
      },
    })) as QuizWithCounts[];

    return Promise.all(
      quizzes
        .filter((quiz) => this.isPlayerVisibleQuiz(quiz.title))
        .map((quiz) => this.toQuizResponse(quiz)),
    );
  }

  async getQuizById(quizId: number): Promise<QuizResponse> {
    const quiz = (await this.prisma.client.quiz.findUnique({
      where: { id: quizId },
      include: {
        _count: {
          select: {
            games: true,
            questions: true,
          },
        },
      },
    })) as QuizWithCounts | null;

    if (!quiz) {
      throw new NotFoundException(`Quiz ${quizId} introuvable`);
    }

    return this.toQuizResponse(quiz);
  }

  private assertValidQuestions(dto: CreateQuizDto): void {
    dto.questions.forEach((question, index) => {
      if (question.correctAnswerIndex >= question.answers.length) {
        throw new BadRequestException(
          `La question ${index + 1} a une bonne réponse invalide`,
        );
      }
    });
  }

  private async toQuizResponse(quiz: QuizWithCounts): Promise<QuizResponse> {
    return {
      id: quiz.id,
      title: quiz.title,
      createdAt: quiz.createdAt.toISOString(),
      playCount: quiz._count.games,
      activeRoomCount: await this.getActiveRoomCount(quiz.id),
      questionCount: quiz._count.questions,
    };
  }

  private async getActiveRoomCount(quizId: number): Promise<number> {
    return this.prisma.client.room.count({
      where: {
        quizId,
        status: {
          in: ["waiting", "playing"],
        },
        players: {
          some: {},
        },
      },
    });
  }

  private isPlayerVisibleQuiz(title: string): boolean {
    return !HIDDEN_PLAYER_QUIZ_TITLE_PATTERNS.some((pattern) =>
      pattern.test(title.trim()),
    );
  }
}
