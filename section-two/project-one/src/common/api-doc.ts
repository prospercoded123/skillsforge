import { applyDecorators, type Type } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  type ApiParamOptions,
  type ApiQueryOptions,
  type ApiResponseOptions,
} from '@nestjs/swagger';

export interface Example<T = unknown> {
  summary?: string;
  value: T;
}

export interface ResponseDoc {
  description: string;
  example?: unknown;
  content?: ApiResponseOptions['content'];
}

export interface EndpointDoc {
  summary: string;
  description?: string;
  body?: { type: Type<unknown>; examples: Record<string, Example> };
  params?: ApiParamOptions[];
  queries?: ApiQueryOptions[];
  responses: Record<number, ResponseDoc>;
}

export const EXAMPLE_IDS = {
  category: '6c4a3b1e-0d2f-4e8a-9b7c-1f2e3d4c5b6a',
  otherCategory: '7a63170a-0ac4-4305-8da2-27b96f093f69',
  expense: '9776b927-f96f-4f2a-97ce-91af31b1ffce',
};

export const UNAUTHORIZED: ResponseDoc = {
  description: 'Missing, invalid or expired access token',
  example: { message: 'Unauthorized', statusCode: 401 },
};

export function ApiDoc(doc: EndpointDoc): MethodDecorator {
  const decorators: MethodDecorator[] = [
    ApiOperation({ summary: doc.summary, description: doc.description }),
  ];

  if (doc.body) {
    decorators.push(
      ApiBody({ type: doc.body.type, examples: doc.body.examples }),
    );
  }
  for (const param of doc.params ?? []) {
    decorators.push(ApiParam(param));
  }
  for (const query of doc.queries ?? []) {
    decorators.push(ApiQuery(query));
  }
  for (const [status, res] of Object.entries(doc.responses)) {
    decorators.push(
      ApiResponse({
        status: Number(status),
        description: res.description,
        content:
          res.content ??
          (res.example === undefined
            ? undefined
            : { 'application/json': { example: res.example } }),
      }),
    );
  }

  return applyDecorators(...decorators);
}
