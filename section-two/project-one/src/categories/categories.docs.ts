import { EndpointDoc, EXAMPLE_IDS, UNAUTHORIZED } from '../common/api-doc.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

const CATEGORY = {
  id: EXAMPLE_IDS.category,
  userId: '951d9cc4-fc96-4234-a33a-1772a18e187d',
  name: 'Food',
  createdAt: '2026-10-01T09:00:00.000Z',
};

const CATEGORY_ID_PARAM = {
  name: 'id',
  description: 'Category ID',
  example: EXAMPLE_IDS.category,
};

const NOT_FOUND = {
  description: 'Category does not exist or belongs to another user',
  example: {
    message: 'Category not found',
    error: 'Not Found',
    statusCode: 404,
  },
};

export const categoriesDocs = {
  create: {
    summary: 'Create a category',
    description: 'Category names are unique per user.',
    body: {
      type: CreateCategoryDto,
      examples: {
        default: { summary: 'Simple category', value: { name: 'Food' } },
      },
    },
    responses: {
      201: { description: 'Category created', example: CATEGORY },
      400: {
        description: 'Name is empty or longer than 50 characters',
        example: {
          message: ['name should not be empty'],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      401: UNAUTHORIZED,
      409: {
        description: 'A category with this name already exists',
        example: {
          message: 'Category name already exists',
          error: 'Conflict',
          statusCode: 409,
        },
      },
    },
  } satisfies EndpointDoc,

  findAll: {
    summary: 'List your categories',
    responses: {
      200: {
        description: 'All categories for the logged-in user',
        example: [CATEGORY],
      },
      401: UNAUTHORIZED,
    },
  } satisfies EndpointDoc,

  findOne: {
    summary: 'Get one category',
    params: [CATEGORY_ID_PARAM],
    responses: {
      200: { description: 'The category', example: CATEGORY },
      400: {
        description: 'ID is not a valid UUID',
        example: {
          message: 'Validation failed (uuid is expected)',
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      401: UNAUTHORIZED,
      404: NOT_FOUND,
    },
  } satisfies EndpointDoc,

  update: {
    summary: 'Rename a category',
    params: [CATEGORY_ID_PARAM],
    body: {
      type: UpdateCategoryDto,
      examples: {
        default: { summary: 'Rename', value: { name: 'Groceries' } },
      },
    },
    responses: {
      200: {
        description: 'Updated category',
        example: { ...CATEGORY, name: 'Groceries' },
      },
      401: UNAUTHORIZED,
      404: NOT_FOUND,
      409: {
        description: 'Another category already has this name',
        example: {
          message: 'Category name already exists',
          error: 'Conflict',
          statusCode: 409,
        },
      },
    },
  } satisfies EndpointDoc,

  remove: {
    summary: 'Delete a category',
    description:
      'A category that still has expenses cannot be deleted. Move or delete those expenses first.',
    params: [CATEGORY_ID_PARAM],
    responses: {
      204: { description: 'Category deleted. No body is returned' },
      401: UNAUTHORIZED,
      404: NOT_FOUND,
      409: {
        description: 'Category still has expenses',
        example: {
          message: 'Category still has expenses',
          error: 'Conflict',
          statusCode: 409,
        },
      },
    },
  } satisfies EndpointDoc,
};
