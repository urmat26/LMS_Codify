[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=28&pause=1000&color=7C3AED&center=false&vCenter=true&width=750&lines=Codify+LMS;%D0%A1%D0%B8%D1%81%D1%82%D0%B5%D0%BC%D0%B0+%D1%83%D0%BF%D1%80%D0%B0%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F+%D0%BC%D0%B5%D1%80%D1%87%D0%B5%D0%BC;%D0%92%D1%8B%D0%B4%D0%B0%D1%87%D0%B0+%D0%BA%D0%BE%D0%B8%D0%BD%D0%BE%D0%B2+%D0%B8+%D0%BD%D0%B0%D0%B3%D1%80%D0%B0%D0%B4;%D0%9C%D0%B0%D0%B3%D0%B0%D0%B7%D0%B8%D0%BD+%D0%B4%D0%BB%D1%8F+%D1%81%D1%82%D1%83%D0%B4%D0%B5%D0%BD%D1%82%D0%BE%D0%B2;%D0%90%D0%B4%D0%BC%D0%B8%D0%BD+%D0%BF%D0%B0%D0%BD%D0%B5%D0%BB%D1%8C+%D0%B8+%D0%B0%D1%83%D0%B4%D0%B8%D1%82;Next.js+%2B+Express+%2B+Prisma;SQLite+%2B+REST+API;Role-based+access+control;Swagger+%2F+OpenAPI)](https://git.io/typing-svg)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

---

## О проекте

**Codify LMS** — внутренняя система управления мерчем и наградами для образовательного центра. Позволяет сотрудникам выдавать студентам бонусные коины за успехи, а студентам — тратить их в магазине наград.

Система заменила монолитное приложение на `localStorage` на полноценный REST API с базой данных, ролевой моделью и аудитом всех операций.

---

## Роли пользователей

| Роль | Доступ |
|------|--------|
| **admin** | Полный доступ: выдача/отмена/пополнение коинов, управление мерчем, аудит, назначение групп сотрудникам |
| **care** | Отдел заботы: выдача мерча студентам, просмотр групп, отметка «забрано», просмотр своих групп |
| **student** | Магазин наград, история покупок, саморегистрация |

---

## Функционал

### Для студентов
- **Магазин наград** — каталог товаров с категориями, поиском, корзиной, выбором размеров (S/M/L/XL)
- **История покупок** — статусы `pending` / `collected` / `cancelled`, кнопка «Забрать»
- **Регистрация** — самостоятельная регистрация с привязкой к группе, стартовый баланс 500 коинов

### Для сотрудников (admin / care)
- **Панель выдачи** — поиск студентов по группам, пакетная выдача через корзину, ручное списание
- **Пополнение баланса** — только admin, с обязательной причиной
- **Отмена транзакции** — в течение 24 часов
- **Экспорт CSV** — выгрузка студентов группы
- **Фильтрация по группам** — если у сотрудника есть привязки, он видит только свои группы

### Для администратора
- **Управление товарами** — CRUD с категориями, стоком, размерной сеткой, DnD-сортировкой
- **Журнал аудита** — все действия с фильтрацией по дате/действию/пользователю
- **Привязка сотрудников к группам** — ограничение видимости групп для отдела заботы
- **Swagger UI** — интерактивная документация API

### Инфраструктура
- API-версионирование (`/api/v1/`)
- Rate limiting (10 запросов/мин на запись)
- Graceful shutdown
- Audit log middleware (автоматическое логирование всех POST/PUT/DELETE)
- Автосанитизация паролей/токенов в логах

---

## Стек технологий

### Frontend
- **Next.js 14** (App Router, RSC)
- **React 18** + TypeScript
- **Tailwind CSS** — стилизация
- **@dnd-kit** — drag-and-drop сортировка мерча

### Backend
- **Express.js** — REST API
- **Prisma** — ORM + миграции
- **SQLite** — база данных (dev) / PostgreSQL (prod-ready)
- **JWT** — аутентификация
- **Zod** — валидация запросов
- **express-rate-limit** — защита от перебора
- **swagger-ui-express** — OpenAPI документация

---

## Установка и запуск

### Требования
- Node.js 18+
- npm 9+

### 1. Клонирование
```bash
git clone https://github.com/urmat26/LMS_Codify.git
cd LMS_Codify
```

### 2. Backend
```bash
cd backend
cp .env.example .env     # настроить JWT_SECRET, DATABASE_URL
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev              # http://localhost:3000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:3001
```

### Учетные записи (seed)

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@codify.ru | admin123 |
| Отдел заботы | care@codify.ru | care123 |
| Студент | student@codify.ru | student123 |

---

## API Документация

После запуска backend:
- **Swagger UI**: http://localhost:3000/api/docs
- **Swagger UI v1**: http://localhost:3000/api/v1/docs

### Основные эндпоинты

| Метод | Путь | Роли | Описание |
|-------|------|------|----------|
| POST | /api/auth/login | — | Вход |
| POST | /api/auth/register | — | Регистрация студента |
| GET | /api/auth/me | Любая | Профиль |
| GET | /api/groups | admin, care | Список групп |
| GET | /api/groups/:id/students | admin, care | Студенты группы |
| GET | /api/groups/:id/export-csv | admin, care | CSV студентов |
| POST | /api/students/:id/withdraw | admin, care | Списание коинов |
| POST | /api/students/:id/deposit | admin | Пополнение баланса |
| POST | /api/transactions/:id/cancel | Любая | Отмена (24ч) |
| GET | /api/merch/catalog | Любая | Каталог товаров |
| POST | /api/merch/purchase | student | Покупка |
| GET | /api/purchases | Любая | Мои покупки |
| PUT | /api/purchases/:id/collect | admin, care | Отметить «забрано» |
| GET | /api/merch/items | admin | Все товары |
| PUT | /api/merch/items/:id | admin | Обновить товар |
| POST | /api/merch/items | admin | Создать товар |
| PUT | /api/merch/reorder | admin | Сортировка |
| DELETE | /api/merch/items/:id | admin | Архивировать |
| GET | /api/admin/audit | admin | Журнал аудита |
| GET | /api/admin/staff-groups | admin | Привязки групп |
| POST | /api/admin/staff-groups | admin | Назначить группы |
| GET | /api/staff/my-groups | admin, care | Мои группы |
| GET | /api/stats/today | admin, care | Статистика дня |
| GET | /api/health | — | Health check |

---

## Структура проекта

```
backend/
  prisma/
    schema.prisma          # Модели БД
    seed.ts                # Начальные данные
    migrations/            # Миграции Prisma
  src/
    index.ts               # Точка входа + graceful shutdown
    openapi.ts             # OpenAPI спецификация
    controllers/           # Логика эндпоинтов
    routes/                # Роуты с middleware
    middleware/
      auth.ts              # JWT аутентификация + роли
      audit.ts             # Автоматический audit log
      errorHandler.ts      # Централизованная обработка ошибок
    types/                 # TypeScript типы
    utils/
      prisma.ts            # Prisma client singleton
      errors.ts            # Классы ошибок (AppError, ForbiddenError и т.д.)
      config.ts            # Чтение env-переменных

frontend/
  src/
    app/
      page.tsx             # Корневая (редирект по роли)
      layout.tsx           # Глобальный layout
      login/               # Страница входа
      register/            # Регистрация студента
      dashboard/           # Панель выдачи (admin/care)
      shop/                # Магазин наград (student)
      purchases/           # История покупок (student)
      merch/               # Управление товарами (admin)
      groups/[groupId]/    # Детальная страница группы
      admin/
        audit/             # Журнал аудита
        staff/             # Привязка сотрудников к группам
    components/
      Sidebar.tsx          # Боковая навигация
      WithdrawModal.tsx    # Модалка выдачи (пакетная + ручная)
      StudentTable.tsx     # Таблица студентов
      GroupWithdrawPage.tsx# Страница выдачи группы
      MerchCatalogManager.tsx # CRUD мерча с DnD-сортировкой
      TransactionHistory.tsx   # История транзакций студента
      Breadcrumbs.tsx      # Хлебные крошки
      Toast.tsx            # Уведомления
    lib/
      api.ts               # HTTP-клиент (все методы API)
    types/
      index.ts             # TypeScript типы
    hooks/
      useWithdraw.ts       # Хук выдачи
```

---

## Модели данных (Prisma)

```
User ─── StaffGroup ─── Group
  │                        │
  │                   Student
  │                     │   │
  │              Purchase  CoinTransaction
  │                        │
  └─── AuditLog       MerchItem
                         │
                     MerchSize
```

- **User** — сотрудники (admin/care) и студенты (student/student)
- **Student** — студенты групп с балансом коинов
- **Group** — учебные группы
- **MerchItem** — товары с категорией, стоком, размерной сеткой
- **Purchase** — покупки студентов (pending/collected/cancelled)
- **CoinTransaction** — списания/пополнения
- **StaffGroup** — привязка сотрудников к группам (многие-ко-многим)
- **AuditLog** — лог всех действий

---

## Особенности реализации

- **Два монтирования роутов** — каждый эндпоинт доступен на `/api` и `/api/v1` для обратной совместимости
- **Audit через middleware** — автоматически логирует POST/PUT/DELETE на `res.on('finish')`, санитизирует body (скрывает password/token/secret)
- **Пакетная выдача** — можно выбрать несколько товаров в корзину (включая размеры) и выдать одним действием
- **Фильтрация сотрудников** — если у сотрудника есть StaffGroup — видит только свои группы; если нет привязок — видит все (обратная совместимость)
- **Горячие клавиши** — Ctrl+Enter подтверждение, Esc отмена в модалках
- **Размерная сетка** — размеры S/M/L/XL для худи/бомберов, 35-37/38-40 для носков, общий сток для остального
- **Стоп-линия** — товары со stock=0 скрыты из витрины, можно архивировать
