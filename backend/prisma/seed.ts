import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@codify.ru' },
    update: {},
    create: {
      email: 'admin@codify.ru',
      password: adminPassword,
      fullName: 'Администратор Системы',
      role: 'admin',
    },
  });
  console.log(`Admin created: ${admin.email}`);

  // Create care department user
  const carePassword = await bcrypt.hash('care123', 10);
  const careUser = await prisma.user.upsert({
    where: { email: 'care@codify.ru' },
    update: {},
    create: {
      email: 'care@codify.ru',
      password: carePassword,
      fullName: 'Сотрудник Отдела Заботы',
      role: 'care',
    },
  });
  console.log(`Care user created: ${careUser.email}`);

  // Deactivate old default group if it exists
  await prisma.group.updateMany({
    where: { id: 'group-1' },
    data: { isActive: false },
  });

  // Create groups
  const groups = [
    {
      id: 'group-web-2026',
      name: 'Веб-разработка 2026',
      course: 3,
    },
    {
      id: 'group-start-pt-05',
      name: 'START PT - 05 (13-16 лет) АЗАМАТ M',
      course: 1,
    },
    {
      id: 'group-bootcamp-jst',
      name: 'Bootcamp JST-05 (11-14): NURDAN',
      course: 2,
    },
    {
      id: 'group-start-pt-07',
      name: 'START PT - 07 (15-17 лет) БЕГИМАЙ',
      course: 1,
    },
    {
      id: 'group-python-pro',
      name: 'Python Pro (16-18) ЧЫНГЫЗ',
      course: 3,
    },
  ];

  // Create students per group
  const groupStudents: Record<string, Array<{ id: string; fullName: string; coinBalance: number }>> = {
    'group-web-2026': [
      { id: 'student-1', fullName: 'Иванов Иван Иванович', coinBalance: 1500 },
      { id: 'student-2', fullName: 'Петрова Анна Сергеевна', coinBalance: 2200 },
      { id: 'student-3', fullName: 'Сидоров Алексей Дмитриевич', coinBalance: 800 },
      { id: 'student-4', fullName: 'Козлова Мария Андреевна', coinBalance: 3100 },
      { id: 'student-5', fullName: 'Смирнов Денис Олегович', coinBalance: 450 },
    ],
    'group-start-pt-05': [
      { id: 'student-6', fullName: 'Аманкулов Эмир Бакытович', coinBalance: 1200 },
      { id: 'student-7', fullName: 'Ким Наталья Валерьевна', coinBalance: 2800 },
      { id: 'student-8', fullName: 'Усенов Данил Маратович', coinBalance: 900 },
    ],
    'group-bootcamp-jst': [
      { id: 'student-9', fullName: 'Джолдошева Айлин Руслановна', coinBalance: 3500 },
      { id: 'student-10', fullName: 'Токтосунов Алишер Эркинович', coinBalance: 1800 },
      { id: 'student-11', fullName: 'Ибраев Нурсултан Бекжанович', coinBalance: 2100 },
      { id: 'student-12', fullName: 'Асанова Адина Канатовна', coinBalance: 750 },
    ],
    'group-start-pt-07': [
      { id: 'student-13', fullName: 'Сагындыкова Мээрим Талгатовна', coinBalance: 1600 },
      { id: 'student-14', fullName: 'Чолпонкулов Байэл Болотбекович', coinBalance: 2400 },
    ],
    'group-python-pro': [
      { id: 'student-15', fullName: 'Курманбеков Атай Чынгызович', coinBalance: 4200 },
      { id: 'student-16', fullName: 'Шаршенова Айсулуу Эмиловна', coinBalance: 1100 },
      { id: 'student-17', fullName: 'Сулайманова Жазгул Бактыбековна', coinBalance: 2900 },
    ],
  };

  for (const g of groups) {
    const group = await prisma.group.upsert({
      where: { id: g.id },
      update: { name: g.name, course: g.course },
      create: g,
    });
    console.log(`Group created: ${group.name}`);

    const students = groupStudents[g.id] || [];
    for (const s of students) {
      await prisma.student.upsert({
        where: { id: s.id },
        update: { fullName: s.fullName, coinBalance: s.coinBalance, groupId: group.id },
        create: {
          id: s.id,
          fullName: s.fullName,
          groupId: group.id,
          coinBalance: s.coinBalance,
        },
      });
    }
    console.log(`  ${students.length} students created`);
  }

  // Seed merch items — cleanup duplicates, keep only first per name
  const merchItems = [
    { name: 'Худи', price: 1000, sortOrder: 1 },
    { name: 'Носки', price: 200, sortOrder: 2 },
    { name: 'Стикеры', price: 100, sortOrder: 3 },
    { name: 'Бомбер', price: 2500, sortOrder: 4 },
    { name: 'Кружка', price: 500, sortOrder: 5 },
  ];

  const allMerch = await prisma.merchItem.findMany({ orderBy: { createdAt: 'asc' } });
  const seen = new Set<string>();
  for (const item of allMerch) {
    if (seen.has(item.name)) {
      await prisma.merchItem.update({
        where: { id: item.id },
        data: { isActive: false },
      });
    } else {
      seen.add(item.name);
    }
  }

  const freshMerch = await prisma.merchItem.findMany({ where: { isActive: true } });
  for (const m of merchItems) {
    const existing = freshMerch.find((i) => i.name === m.name);
    if (!existing) {
      await prisma.merchItem.create({ data: m });
    } else {
      await prisma.merchItem.update({
        where: { id: existing.id },
        data: { price: m.price, sortOrder: m.sortOrder },
      });
    }
  }
  console.log('Merch items synced');

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
