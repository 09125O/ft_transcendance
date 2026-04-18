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
    rooms: number;
    questions: number;
  };
};

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
            rooms: true,
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
            rooms: true,
            questions: true,
          },
        },
      },
    })) as QuizWithCounts[];

    return quizzes.map((quiz) => this.toQuizResponse(quiz));
  }

  async getQuizById(quizId: number): Promise<QuizResponse> {
    const quiz = (await this.prisma.client.quiz.findUnique({
      where: { id: quizId },
      include: {
        _count: {
          select: {
            games: true,
            rooms: true,
            questions: true,
          },
        },
      },
    })) as QuizWithCounts | null;

    if (!quiz) {
      throw new NotFoundException(`Quiz ${quizId} not found`);
    }

    return this.toQuizResponse(quiz);
  }

  private assertValidQuestions(dto: CreateQuizDto): void {
    dto.questions.forEach((question, index) => {
      if (question.correctAnswerIndex >= question.answers.length) {
        throw new BadRequestException(
          `Question ${index + 1} has an invalid correctAnswerIndex`,
        );
      }
    });
  }

  private toQuizResponse(quiz: QuizWithCounts): QuizResponse {
    return {
      id: quiz.id,
      title: quiz.title,
      createdAt: quiz.createdAt.toISOString(),
      playCount: quiz._count.games,
      activeRoomCount: quiz._count.rooms,
      questionCount: quiz._count.questions,
    };
  }
}
