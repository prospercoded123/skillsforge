import { EndpointDoc, EXAMPLE_IDS, UNAUTHORIZED } from '../common/api-doc.js';
import { SetBudgetDto } from './dto/set-budget.dto.js';

const MONTH_PARAM = {
  name: 'month',
  description: 'Calendar month in YYYY-MM format',
  example: '2026-10',
};

const CATEGORY_PARAM = {
  name: 'categoryId',
  description: 'Category ID',
  example: EXAMPLE_IDS.category,
};

const LIMIT_BODY = {
  type: SetBudgetDto,
  examples: {
    default: { summary: 'Monthly limit', value: { limit: 1000 } },
  },
};

const BAD_MONTH = {
  description: 'Month is not in YYYY-MM format',
  example: {
    message: 'Month must be in YYYY-MM format',
    error: 'Bad Request',
    statusCode: 400,
  },
};

export const budgetsDocs = {
  findForMonth: {
    summary: 'Get the budget plan for a month',
    description:
      'Returns the overall limit and any per-category limits for the month.',
    params: [MONTH_PARAM],
    responses: {
      200: {
        description:
          'Budget plan for the month. Overall is null when none is set',
        example: {
          month: '2026-10',
          overall: 1000,
          categories: [
            {
              categoryId: EXAMPLE_IDS.category,
              categoryName: 'Food',
              limit: 300,
            },
          ],
        },
      },
      400: BAD_MONTH,
      401: UNAUTHORIZED,
    },
  } satisfies EndpointDoc,

  setOverall: {
    summary: 'Set the overall budget for a month',
    description:
      'Creates the budget, or replaces the limit if one already exists.',
    params: [MONTH_PARAM],
    body: LIMIT_BODY,
    responses: {
      200: { description: 'Budget saved. No body is returned' },
      400: {
        description:
          'Month is invalid, or limit is not a positive number with at most 2 decimals',
        example: {
          message: ['limit must be a positive number'],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      401: UNAUTHORIZED,
    },
  } satisfies EndpointDoc,

  removeOverall: {
    summary: 'Remove the overall budget for a month',
    params: [MONTH_PARAM],
    responses: {
      204: { description: 'Budget removed. No body is returned' },
      400: BAD_MONTH,
      401: UNAUTHORIZED,
      404: {
        description: 'No overall budget is set for this month',
        example: {
          message: 'No budget set for this month',
          error: 'Not Found',
          statusCode: 404,
        },
      },
    },
  } satisfies EndpointDoc,

  setForCategory: {
    summary: 'Set a category budget for a month',
    description:
      'Creates the budget, or replaces the limit if one already exists.',
    params: [MONTH_PARAM, CATEGORY_PARAM],
    body: {
      type: SetBudgetDto,
      examples: { default: { summary: 'Food limit', value: { limit: 300 } } },
    },
    responses: {
      200: { description: 'Category budget saved. No body is returned' },
      400: {
        description: 'Month, category ID or limit is invalid',
        example: {
          message: ['limit must be a positive number'],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      401: UNAUTHORIZED,
      404: {
        description: 'Category does not exist or belongs to another user',
        example: {
          message: 'Category not found',
          error: 'Not Found',
          statusCode: 404,
        },
      },
    },
  } satisfies EndpointDoc,

  removeForCategory: {
    summary: 'Remove a category budget for a month',
    params: [MONTH_PARAM, CATEGORY_PARAM],
    responses: {
      204: { description: 'Category budget removed. No body is returned' },
      400: BAD_MONTH,
      401: UNAUTHORIZED,
      404: {
        description: 'No budget is set for this category and month',
        example: {
          message: 'No budget set for this category and month',
          error: 'Not Found',
          statusCode: 404,
        },
      },
    },
  } satisfies EndpointDoc,
};
