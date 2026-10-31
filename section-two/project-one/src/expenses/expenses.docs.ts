import { EndpointDoc, EXAMPLE_IDS, UNAUTHORIZED } from '../common/api-doc.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';

const USER_ID = '951d9cc4-fc96-4234-a33a-1772a18e187d';

const EXPENSE = {
  id: EXAMPLE_IDS.expense,
  userId: USER_ID,
  categoryId: EXAMPLE_IDS.category,
  title: 'Groceries',
  amount: 45.5,
  date: '2026-10-12',
  paymentMethod: 'card',
  createdAt: '2026-10-12T18:30:00.000Z',
};

const BUS_PASS = {
  id: '3c1f2a4b-5d6e-4f70-8a91-b2c3d4e5f607',
  userId: USER_ID,
  categoryId: EXAMPLE_IDS.otherCategory,
  title: 'Bus pass',
  amount: 30,
  date: '2026-10-03',
  paymentMethod: 'cash',
  createdAt: '2026-10-03T07:45:00.000Z',
};

const SUMMARY = {
  total: 75.5,
  byCategory: [
    { categoryId: EXAMPLE_IDS.category, categoryName: 'Food', total: 45.5 },
    {
      categoryId: EXAMPLE_IDS.otherCategory,
      categoryName: 'Transport',
      total: 30,
    },
  ],
  analysis: {
    budgetAlerts: [
      {
        scope: 'category',
        categoryId: EXAMPLE_IDS.category,
        name: 'Food',
        limit: 300,
        spent: 45.5,
        previousSpent: 0,
        increase: 45.5,
        percentUsed: 15.17,
        projectedTotal: 45.5,
        safeDailySpend: 0,
        status: 'on_track',
        largestExpenses: [
          {
            expenseId: EXAMPLE_IDS.expense,
            title: 'Groceries',
            date: '2026-10-12',
            amount: 45.5,
          },
        ],
      },
    ],
    categoryTrends: [
      {
        categoryId: EXAMPLE_IDS.category,
        categoryName: 'Food',
        total: 45.5,
        weeklyAverage: 10.27,
        direction: 'falling',
      },
    ],
    suggestions: ['Spending is within every budget for this month.'],
  },
};

const ID_PARAM = {
  name: 'id',
  description: 'Expense ID',
  example: EXAMPLE_IDS.expense,
};

const NOT_FOUND = {
  description: 'Expense does not exist or belongs to another user',
  example: {
    message: 'Expense not found',
    error: 'Not Found',
    statusCode: 404,
  },
};

const MONTH_QUERY = {
  name: 'month',
  required: false,
  description: 'Whole calendar month. Overrides from and to.',
  example: '2026-10',
};

export const expensesDocs = {
  create: {
    summary: 'Record an expense',
    body: {
      type: CreateExpenseDto,
      examples: {
        card: {
          summary: 'Card payment',
          value: {
            title: 'Groceries',
            amount: 45.5,
            categoryId: EXAMPLE_IDS.category,
            date: '2026-10-12',
            paymentMethod: 'card',
          },
        },
        cash: {
          summary: 'Cash payment',
          value: {
            title: 'Bus pass',
            amount: 30,
            categoryId: EXAMPLE_IDS.otherCategory,
            date: '2026-10-03',
            paymentMethod: 'cash',
          },
        },
      },
    },
    responses: {
      201: { description: 'Expense created', example: EXPENSE },
      400: {
        description:
          'Missing or invalid field, such as a non-positive amount or unknown payment method',
        example: {
          message: [
            'amount must be a positive number',
            'paymentMethod must be one of the following values: cash, card, bank_transfer, mobile_wallet',
          ],
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

  findAll: {
    summary: 'List expenses with filters, sorting and pagination',
    description:
      'Every filter is optional. `month` takes precedence over `from` and `to`.',
    queries: [
      MONTH_QUERY,
      { name: 'categoryId', required: false, example: EXAMPLE_IDS.category },
      { name: 'paymentMethod', required: false, example: 'card' },
      { name: 'sortBy', required: false, example: 'amount' },
      { name: 'order', required: false, example: 'asc' },
      { name: 'page', required: false, example: 1 },
      { name: 'limit', required: false, example: 20 },
    ],
    responses: {
      200: {
        description: 'One page of expenses',
        example: {
          data: [BUS_PASS, EXPENSE],
          total: 2,
          page: 1,
          limit: 20,
        },
      },
      400: {
        description: 'Invalid filter, such as a bad month or limit above 100',
        example: {
          message: ['limit must not be greater than 100'],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      401: UNAUTHORIZED,
    },
  } satisfies EndpointDoc,

  summary: {
    summary: 'Spending totals and budget analysis',
    description:
      'Totals per category plus budget flags, trends and suggestions. Analysis always uses every expense in the period, ignoring category and payment filters.',
    queries: [
      MONTH_QUERY,
      { name: 'categoryId', required: false, example: EXAMPLE_IDS.category },
      { name: 'from', required: false, example: '2026-10-01' },
      { name: 'to', required: false, example: '2026-10-31' },
    ],
    responses: {
      200: {
        description: 'Totals and analysis for the period',
        example: SUMMARY,
      },
      400: {
        description: 'Invalid month or date',
        example: {
          message: 'month must be in YYYY-MM format',
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      401: UNAUTHORIZED,
    },
  } satisfies EndpointDoc,

  findOne: {
    summary: 'Get one expense',
    params: [ID_PARAM],
    responses: {
      200: { description: 'The expense', example: EXPENSE },
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
    summary: 'Update an expense',
    description: 'Send only the fields you want to change.',
    params: [ID_PARAM],
    body: {
      type: UpdateExpenseDto,
      examples: {
        amount: {
          summary: 'Fix the amount',
          value: { amount: 48.9 },
        },
        move: {
          summary: 'Move to another category',
          value: {
            categoryId: EXAMPLE_IDS.otherCategory,
            paymentMethod: 'bank_transfer',
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated expense',
        example: { ...EXPENSE, amount: 48.9 },
      },
      400: {
        description: 'Invalid field value',
        example: {
          message: ['amount must be a positive number'],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      401: UNAUTHORIZED,
      404: NOT_FOUND,
    },
  } satisfies EndpointDoc,

  remove: {
    summary: 'Delete an expense',
    params: [ID_PARAM],
    responses: {
      204: { description: 'Expense deleted. No body is returned' },
      401: UNAUTHORIZED,
      404: NOT_FOUND,
    },
  } satisfies EndpointDoc,
};
