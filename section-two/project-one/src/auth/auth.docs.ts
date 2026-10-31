import { EndpointDoc } from '../common/api-doc.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';

const TOKENS = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NTFk...',
  refreshToken: 'b3f1c9e0a7d24e6f8c1b5a9d2e7f4a60c8d3e1b2f5a6c7d8',
};

const BAD_REFRESH_TOKEN = {
  message: 'Invalid refresh token',
  error: 'Unauthorized',
  statusCode: 401,
};

export const authDocs = {
  register: {
    summary: 'Create an account and receive tokens',
    body: {
      type: RegisterDto,
      examples: {
        default: {
          summary: 'New user',
          value: {
            email: 'ada@example.com',
            password: 'correct-horse-battery',
          },
        },
      },
    },
    responses: {
      201: { description: 'Account created', example: TOKENS },
      400: {
        description: 'Invalid email, or password shorter than 8 characters',
        example: {
          message: ['email must be an email'],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      409: {
        description: 'Email is already registered',
        example: {
          message: 'Email is already registered',
          error: 'Conflict',
          statusCode: 409,
        },
      },
    },
  } satisfies EndpointDoc,

  login: {
    summary: 'Sign in with email and password',
    body: {
      type: LoginDto,
      examples: {
        default: {
          summary: 'Existing user',
          value: {
            email: 'ada@example.com',
            password: 'correct-horse-battery',
          },
        },
      },
    },
    responses: {
      200: { description: 'Signed in', example: TOKENS },
      401: {
        description: 'Wrong email or password',
        example: {
          message: 'Invalid email or password',
          error: 'Unauthorized',
          statusCode: 401,
        },
      },
    },
  } satisfies EndpointDoc,

  refresh: {
    summary: 'Exchange a refresh token for new tokens',
    description:
      'Refresh tokens rotate on every use. Reusing an old one revokes all sessions for that user.',
    body: {
      type: RefreshTokenDto,
      examples: {
        default: {
          summary: 'Refresh token from login',
          value: { refreshToken: TOKENS.refreshToken },
        },
      },
    },
    responses: {
      200: {
        description: 'New token pair. The old refresh token is now invalid',
        example: TOKENS,
      },
      401: {
        description: 'Token is unknown, already used, or revoked',
        example: BAD_REFRESH_TOKEN,
      },
    },
  } satisfies EndpointDoc,

  logout: {
    summary: 'Revoke a refresh token',
    body: {
      type: RefreshTokenDto,
      examples: {
        default: {
          summary: 'Refresh token to revoke',
          value: { refreshToken: TOKENS.refreshToken },
        },
      },
    },
    responses: {
      204: { description: 'Session ended. No body is returned' },
      401: {
        description: 'Token is unknown or already used',
        example: BAD_REFRESH_TOKEN,
      },
    },
  } satisfies EndpointDoc,
};
