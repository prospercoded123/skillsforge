import { EndpointDoc, EXAMPLE_IDS, UNAUTHORIZED } from '../common/api-doc.js';

const CSV_EXAMPLE = [
  'id,title,amount,category,date,payment_method',
  `${EXAMPLE_IDS.expense},Groceries,45.5,Food,2026-10-12,card`,
  `3c1f2a4b-5d6e-4f70-8a91-b2c3d4e5f607,Bus pass,30,Transport,2026-10-03,cash`,
].join('\n');

const JSON_EXAMPLE = {
  generatedAt: '2026-10-31T19:18:07.127Z',
  summary: {
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
      budgetAlerts: [],
      categoryTrends: [],
      suggestions: [],
    },
  },
  expenses: [
    {
      id: EXAMPLE_IDS.expense,
      title: 'Groceries',
      amount: 45.5,
      category: 'Food',
      date: '2026-10-12',
      paymentMethod: 'card',
    },
    {
      id: '3c1f2a4b-5d6e-4f70-8a91-b2c3d4e5f607',
      title: 'Bus pass',
      amount: 30,
      category: 'Transport',
      date: '2026-10-03',
      paymentMethod: 'cash',
    },
  ],
};

export const reportsDocs = {
  exportExpenses: {
    summary: 'Export expenses as JSON, CSV or PDF',
    description:
      'Uses the same filters as `GET /expenses`. `format` defaults to `json`. CSV and PDF are returned as file downloads.',
    queries: [
      {
        name: 'month',
        required: false,
        description: 'Whole calendar month',
        example: '2026-10',
      },
      { name: 'categoryId', required: false, example: EXAMPLE_IDS.category },
      { name: 'format', required: false, example: 'csv' },
    ],
    responses: {
      200: {
        description:
          'Report in the requested format. JSON is inline. CSV and PDF are attachments',
        content: {
          'application/json': { example: JSON_EXAMPLE },
          'text/csv': { example: CSV_EXAMPLE },
          'application/pdf': { schema: { type: 'string', format: 'binary' } },
        },
      },
      400: {
        description: 'Invalid filter or unknown format',
        example: {
          message: [
            'format must be one of the following values: csv, json, pdf',
          ],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
      401: UNAUTHORIZED,
    },
  } satisfies EndpointDoc,
};
