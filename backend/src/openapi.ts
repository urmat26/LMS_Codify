import { OpenAPIV3 } from 'openapi-types';

export const spec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Codify LMS — CodeCoin API',
    version: '1.0.0',
    description: 'API для управления начислением и списанием CodeCoin у студентов',
  },
  servers: [
    { url: '/api/v1', description: 'API v1' },
    { url: '/api', description: 'Legacy' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      Group: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          course: { type: 'integer' },
          studentCount: { type: 'integer' },
        },
      },
      Student: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          email: { type: 'string', nullable: true },
          coinBalance: { type: 'integer' },
          receivedMerchToday: { type: 'boolean' },
          todayTransactions: {
            type: 'array',
            items: { $ref: '#/components/schemas/CoinTransaction' },
          },
        },
      },
      CoinTransaction: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          studentId: { type: 'string', format: 'uuid' },
          staffId: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['merch', 'manual', 'deposit'] },
          amount: { type: 'integer' },
          comment: { type: 'string', nullable: true },
          isReversed: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      MerchItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          price: { type: 'integer' },
          category: { type: 'string', nullable: true },
          stock: { type: 'integer' },
          imageUrl: { type: 'string', nullable: true },
          sortOrder: { type: 'integer' },
          isActive: { type: 'boolean' },
          sizes: {
            type: 'array',
            items: { $ref: '#/components/schemas/MerchSize' },
          },
        },
      },
      MerchSize: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          size: { type: 'string' },
          quantity: { type: 'integer' },
        },
      },
      Purchase: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          studentId: { type: 'string', format: 'uuid' },
          merchItemId: { type: 'string', format: 'uuid' },
          size: { type: 'string', nullable: true },
          quantity: { type: 'integer' },
          totalAmount: { type: 'integer' },
          status: { type: 'string', enum: ['pending', 'collected', 'cancelled'] },
          createdAt: { type: 'string', format: 'date-time' },
          collectedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      LoginBody: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@codify.ru' },
          password: { type: 'string', example: 'admin123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  fullName: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'care', 'student'] },
                },
              },
            },
          },
        },
      },
      RegisterBody: {
        type: 'object',
        required: ['email', 'password', 'fullName', 'groupId'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 4 },
          fullName: { type: 'string' },
          groupId: { type: 'string', format: 'uuid' },
        },
      },
      WithdrawBody: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['merch', 'manual'] },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                merchItemId: { type: 'string', format: 'uuid' },
                quantity: { type: 'integer', minimum: 1 },
              },
            },
          },
          amount: { type: 'integer', minimum: 1 },
          comment: { type: 'string' },
        },
      },
      DepositBody: {
        type: 'object',
        required: ['amount', 'reason'],
        properties: {
          amount: { type: 'integer', minimum: 1 },
          reason: { type: 'string', minLength: 1 },
        },
      },
      PurchaseBody: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['merchItemId', 'quantity'],
              properties: {
                merchItemId: { type: 'string', format: 'uuid' },
                quantity: { type: 'integer', minimum: 1 },
                size: { type: 'string' },
              },
            },
          },
        },
      },
      AuditLogEntry: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          action: { type: 'string' },
          resourceType: { type: 'string' },
          resourceId: { type: 'string' },
          metadata: { type: 'string', nullable: true },
          ip: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fullName: { type: 'string' },
            },
            nullable: true,
          },
        },
      },
      TodayStats: {
        type: 'object',
        properties: {
          studentsServedToday: { type: 'integer' },
          coinsSpentToday: { type: 'integer' },
          totalTransactions: { type: 'integer' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Вход в систему',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
        },
        responses: {
          '200': { description: 'Успешный вход', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          '401': { description: 'Неверный email или пароль', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '429': { description: 'Слишком много попыток', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Регистрация студента',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
        },
        responses: {
          '201': { description: 'Студент зарегистрирован' },
          '400': { description: 'Ошибка валидации' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Профиль текущего пользователя',
        responses: {
          '200': { description: 'Данные пользователя' },
        },
      },
    },
    '/groups': {
      get: {
        tags: ['Groups'],
        summary: 'Список групп',
        responses: {
          '200': {
            description: 'Группы с количеством студентов',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Group' } } } },
          },
        },
      },
    },
    '/groups/{groupId}/students': {
      get: {
        tags: ['Groups'],
        summary: 'Студенты группы',
        parameters: [
          { name: 'groupId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Пагинированный список студентов' },
        },
      },
    },
    '/students/{studentId}/transactions': {
      get: {
        tags: ['Students'],
        summary: 'История транзакций студента',
        parameters: [
          { name: 'studentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Транзакции студента' },
        },
      },
    },
    '/students/{studentId}/withdraw': {
      post: {
        tags: ['Transactions'],
        summary: 'Списание коинов',
        parameters: [
          { name: 'studentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WithdrawBody' } } },
        },
        responses: {
          '200': { description: 'Списание выполнено' },
          '400': { description: 'Недостаточно коинов' },
        },
      },
    },
    '/students/{studentId}/deposit': {
      post: {
        tags: ['Transactions'],
        summary: 'Начисление коинов (admin)',
        parameters: [
          { name: 'studentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DepositBody' } } },
        },
        responses: {
          '200': { description: 'Коины начислены' },
        },
      },
    },
    '/transactions/{transactionId}/cancel': {
      post: {
        tags: ['Transactions'],
        summary: 'Отмена транзакции (в течение 24 ч)',
        parameters: [
          { name: 'transactionId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Транзакция отменена, коины возвращены' },
          '400': { description: 'Транзакция старше 24 часов' },
        },
      },
    },
    '/merch/catalog': {
      get: {
        tags: ['Merch'],
        summary: 'Каталог товаров (активные, в наличии)',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Список товаров',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/MerchItem' } } } },
          },
        },
      },
    },
    '/merch/items': {
      get: {
        tags: ['Merch'],
        summary: 'Все товары (admin)',
        responses: {
          '200': { description: 'Список всех товаров' },
        },
      },
      post: {
        tags: ['Merch'],
        summary: 'Создать товар (admin)',
        responses: {
          '201': { description: 'Товар создан' },
        },
      },
    },
    '/merch/items/{itemId}': {
      put: {
        tags: ['Merch'],
        summary: 'Обновить товар (admin)',
        parameters: [
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Товар обновлён' },
        },
      },
      delete: {
        tags: ['Merch'],
        summary: 'Архивировать товар (admin)',
        parameters: [
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Товар архивирован' },
        },
      },
    },
    '/merch/reorder': {
      put: {
        tags: ['Merch'],
        summary: 'Изменить порядок товаров (admin)',
        responses: {
          '200': { description: 'Порядок обновлён' },
        },
      },
    },
    '/merch/purchase': {
      post: {
        tags: ['Shop'],
        summary: 'Покупка товаров студентом',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PurchaseBody' } } },
        },
        responses: {
          '200': { description: 'Покупка совершена' },
          '400': { description: 'Недостаточно коинов или товара нет в наличии' },
        },
      },
    },
    '/purchases': {
      get: {
        tags: ['Shop'],
        summary: 'Мои покупки (студент)',
        responses: {
          '200': { description: 'История покупок студента' },
        },
      },
    },
    '/purchases/{purchaseId}/collect': {
      put: {
        tags: ['Shop'],
        summary: 'Отметить покупку как полученную',
        parameters: [
          { name: 'purchaseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Покупка получена' },
        },
      },
    },
    '/admin/purchases': {
      get: {
        tags: ['Shop'],
        summary: 'Все покупки (staff)',
        responses: {
          '200': { description: 'Список всех покупок' },
        },
      },
    },
    '/admin/audit': {
      get: {
        tags: ['Admin'],
        summary: 'Журнал аудита (admin)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'Записи аудита с пагинацией' },
        },
      },
    },
    '/stats/today': {
      get: {
        tags: ['Stats'],
        summary: 'Статистика за сегодня',
        responses: {
          '200': {
            description: 'Статистика',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/TodayStats' } } },
          },
        },
      },
    },
    '/admin/staff-groups': {
      get: {
        tags: ['Admin'],
        summary: 'Список привязок сотрудников к группам',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Список сотрудников с их группами' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Назначить группы сотруднику',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { userId: { type: 'string' }, groupIds: { type: 'array', items: { type: 'string' } } }, required: ['userId', 'groupIds'] } } },
        },
        responses: {
          '200': { description: 'Привязки обновлены' },
        },
      },
    },
    '/staff/my-groups': {
      get: {
        tags: ['Staff'],
        summary: 'Мои группы (для сотрудника)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Список групп, к которым привязан сотрудник' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Проверка работоспособности',
        responses: {
          '200': { description: 'Сервер работает' },
        },
      },
    },
  },
};
