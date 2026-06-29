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

  // Create a student user account
  const studentPassword = await bcrypt.hash('student123', 10);
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@codify.ru' },
    update: {},
    create: {
      email: 'student@codify.ru',
      password: studentPassword,
      fullName: 'Иванов Иван Иванович',
      role: 'student',
    },
  });
  console.log(`Student user created: ${studentUser.email}`);

  // Link student-1 to the student user account
  await prisma.student.update({
    where: { id: 'student-1' },
    data: { userId: studentUser.id },
  });
  console.log('student-1 linked to student user');

  // Seed merch items — cleanup duplicates, keep only first per name
  const merchItems: Array<{
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    sortOrder: number;
    sizes?: { size: string; quantity: number }[];
  }> = [
    { name: 'Худи', description: 'Теплое брендированное худи оверсайз', price: 1000, category: 'Одежда', stock: 20, sortOrder: 1, sizes: [{ size: 'S', quantity: 5 }, { size: 'M', quantity: 8 }, { size: 'L', quantity: 5 }, { size: 'XL', quantity: 2 }] },
    { name: 'Носки', description: 'Фирменные носки «Код живи, век учись»', price: 200, category: 'Одежда', stock: 50, sortOrder: 2, sizes: [{ size: '35-37', quantity: 25 }, { size: '38-40', quantity: 25 }] },
    { name: 'Стикеры', description: 'Набор IT-стикеров для ноутбука', price: 100, category: 'Сувениры', stock: 100, sortOrder: 3 },
    { name: 'Бомбер', description: 'Стильный осенний бомбер LMS Codify', price: 2500, category: 'Одежда', stock: 10, sortOrder: 4, sizes: [{ size: 'S', quantity: 3 }, { size: 'M', quantity: 4 }, { size: 'L', quantity: 2 }, { size: 'XL', quantity: 1 }] },
    { name: 'Кружка', description: 'Керамическая кружка с принтом для кофе', price: 500, category: 'Сувениры', stock: 30, sortOrder: 5 },
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
      const created = await prisma.merchItem.create({
        data: {
          name: m.name,
          description: m.description,
          price: m.price,
          category: m.category,
          stock: m.stock,
          sortOrder: m.sortOrder,
          sizes: m.sizes ? { create: m.sizes } : undefined,
        },
      });
      console.log(`  Created: ${created.name}`);
    } else {
      await prisma.merchItem.update({
        where: { id: existing.id },
        data: {
          description: m.description,
          price: m.price,
          category: m.category,
          stock: m.stock,
          sortOrder: m.sortOrder,
        },
      });
      // Update sizes: delete old, create new
      await prisma.merchSize.deleteMany({ where: { merchItemId: existing.id } });
      if (m.sizes) {
        await prisma.merchSize.createMany({
          data: m.sizes.map((s) => ({ merchItemId: existing.id, size: s.size, quantity: s.quantity })),
        });
      }
      console.log(`  Updated: ${existing.name}`);
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
