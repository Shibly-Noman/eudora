import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable
} from "@nestjs/common";

import {
  createMeta,
  ensureRequestId,
  errorCodeForStatus,
  type HttpRequestLike,
  type HttpResponseLike,
  isRawResponsePath,
  isRecord,
  normalizeErrorDetails
} from "./api-envelope.helpers.js";
import { type ApiErrorEnvelope } from "./api-envelope.types.js";

type JsonResponseLike = HttpResponseLike & {
  json: (body: unknown) => void;
  status: (statusCode: number) => JsonResponseLike;
};

@Catch()
@Injectable()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const request = httpContext.getRequest<HttpRequestLike>();
    const response = httpContext.getResponse<JsonResponseLike>();
    const statusCode = getStatusCode(exception);

    if (isRawResponsePath(request)) {
      response.status(statusCode).json(getRawErrorBody(exception, statusCode));
      return;
    }

    const requestId = ensureRequestId(request, response);
    const fallbackCode = errorCodeForStatus(statusCode);
    const normalized = normalizeException(exception, fallbackCode);
    const body: ApiErrorEnvelope = {
      success: false,
      code: normalized.code,
      message: normalized.message,
      ...(normalized.errors ? { errors: normalized.errors } : {}),
      meta: createMeta(request, requestId)
    };

    response.status(statusCode).json(body);
  }
}

function getStatusCode(exception: unknown): number {
  if (exception instanceof HttpException) {
    return exception.getStatus();
  }

  return HttpStatus.INTERNAL_SERVER_ERROR;
}

function getRawErrorBody(exception: unknown, statusCode: number): unknown {
  if (exception instanceof HttpException) {
    return exception.getResponse();
  }

  return {
    statusCode,
    message: "Internal server error"
  };
}

function normalizeException(
  exception: unknown,
  fallbackCode: string
): {
  code: string;
  message: string;
  errors?: ApiErrorEnvelope["errors"];
} {
  if (!(exception instanceof HttpException)) {
    return {
      code: fallbackCode,
      message: "Internal server error"
    };
  }

  const response = exception.getResponse();

  if (typeof response === "string") {
    return {
      code: fallbackCode,
      message: response
    };
  }

  if (!isRecord(response)) {
    return {
      code: fallbackCode,
      message: exception.message || "Request failed"
    };
  }

  const code = typeof response.code === "string" ? response.code : fallbackCode;
  const rawMessage = response.message;
  const errors =
    normalizeErrorDetails(response.errors, code) ??
    (Array.isArray(rawMessage)
      ? rawMessage.map((message) => ({
          code,
          message: String(message)
        }))
      : undefined);
  const message = Array.isArray(rawMessage)
    ? typeof response.error === "string"
      ? response.error
      : "Validation failed"
    : typeof rawMessage === "string"
      ? rawMessage
      : exception.message || "Request failed";

  return errors ? { code, message, errors } : { code, message };
}
