import { HttpException, HttpStatus } from "@nestjs/common";
import { type ApiErrorPayload } from "./api-response";

export function getExceptionStatus(exception: unknown): number {
  if (exception instanceof HttpException) {
    return exception.getStatus();
  }

  return HttpStatus.INTERNAL_SERVER_ERROR;
}

export function getErrorCode(status: number): string {
  const maybeCode = HttpStatus[status];
  return typeof maybeCode === "string"
    ? maybeCode
    : "INTERNAL_SERVER_ERROR";
}

function translateValidationMessage(message: string): string {
  const exactTranslations: Record<string, string> = {
    "Internal server error": "Erreur interne du serveur",
  };

  if (exactTranslations[message]) {
    return exactTranslations[message];
  }

  const propertyShouldNotExist = message.match(/^property (.+) should not exist$/);
  if (propertyShouldNotExist) {
    return `Le champ ${propertyShouldNotExist[1]} n'est pas autorisé`;
  }

  const mustBeEmail = message.match(/^(.+) must be an email$/);
  if (mustBeEmail) {
    return `Le champ ${mustBeEmail[1]} doit être un email valide`;
  }

  const mustBeString = message.match(/^(.+) must be a string$/);
  if (mustBeString) {
    return `Le champ ${mustBeString[1]} doit être une chaîne de caractères`;
  }

  const mustBeNumber = message.match(/^(.+) must be a number conforming to the specified constraints$/);
  if (mustBeNumber) {
    return `Le champ ${mustBeNumber[1]} doit être un nombre valide`;
  }

  const mustBeInteger = message.match(/^(.+) must be an integer number$/);
  if (mustBeInteger) {
    return `Le champ ${mustBeInteger[1]} doit être un nombre entier`;
  }

  const mustBeBoolean = message.match(/^(.+) must be a boolean value$/);
  if (mustBeBoolean) {
    return `Le champ ${mustBeBoolean[1]} doit être un booléen`;
  }

  const mustBeArray = message.match(/^(.+) must be an array$/);
  if (mustBeArray) {
    return `Le champ ${mustBeArray[1]} doit être une liste`;
  }

  const mustBeEnum = message.match(/^(.+) must be one of the following values: (.+)$/);
  if (mustBeEnum) {
    return `Le champ ${mustBeEnum[1]} doit être l'une des valeurs suivantes : ${mustBeEnum[2]}`;
  }

  const mustBeUrl = message.match(/^(.+) must be a URL address$/);
  if (mustBeUrl) {
    return `Le champ ${mustBeUrl[1]} doit être une URL valide`;
  }

  const mustNotBeEmpty = message.match(/^(.+) should not be empty$/);
  if (mustNotBeEmpty) {
    return `Le champ ${mustNotBeEmpty[1]} ne doit pas être vide`;
  }

  const minLength = message.match(/^(.+) must be longer than or equal to (\d+) characters$/);
  if (minLength) {
    return `Le champ ${minLength[1]} doit contenir au moins ${minLength[2]} caractères`;
  }

  const maxLength = message.match(/^(.+) must be shorter than or equal to (\d+) characters$/);
  if (maxLength) {
    return `Le champ ${maxLength[1]} doit contenir au maximum ${maxLength[2]} caractères`;
  }

  const minValue = message.match(/^(.+) must not be less than (.+)$/);
  if (minValue) {
    return `Le champ ${minValue[1]} doit être supérieur ou égal à ${minValue[2]}`;
  }

  const maxValue = message.match(/^(.+) must not be greater than (.+)$/);
  if (maxValue) {
    return `Le champ ${maxValue[1]} doit être inférieur ou égal à ${maxValue[2]}`;
  }

  const arrayMinSize = message.match(/^(.+) must contain at least (\d+) elements$/);
  if (arrayMinSize) {
    return `Le champ ${arrayMinSize[1]} doit contenir au moins ${arrayMinSize[2]} éléments`;
  }

  const arrayMaxSize = message.match(/^(.+) must contain no more than (\d+) elements$/);
  if (arrayMaxSize) {
    return `Le champ ${arrayMaxSize[1]} doit contenir au maximum ${arrayMaxSize[2]} éléments`;
  }

  const eachString = message.match(/^each value in (.+) must be a string$/);
  if (eachString) {
    return `Chaque valeur du champ ${eachString[1]} doit être une chaîne de caractères`;
  }

  const nested = message.match(/^each value in nested property (.+) must be either object or array$/);
  if (nested) {
    return `Chaque valeur du champ ${nested[1]} doit être un objet ou une liste`;
  }

  return message;
}

export function getExceptionMessage(exception: unknown): string {
  if (!(exception instanceof HttpException)) {
    return "Erreur interne du serveur";
  }

  const response = exception.getResponse();
  if (typeof response === "string") {
    return translateValidationMessage(response);
  }

  if (typeof response === "object" && response !== null) {
    const value = (response as { message?: unknown }).message;
    if (Array.isArray(value)) {
      return value
        .map((message) =>
          typeof message === "string"
            ? translateValidationMessage(message)
            : String(message),
        )
        .join(", ");
    }

    if (typeof value === "string" && value.length > 0) {
      return translateValidationMessage(value);
    }
  }

  return translateValidationMessage(exception.message);
}

export function buildErrorPayload(exception: unknown): ApiErrorPayload {
  const status = getExceptionStatus(exception);

  return {
    code: getErrorCode(status),
    message: getExceptionMessage(exception),
  };
}
