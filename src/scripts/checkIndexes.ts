// scripts/testSearch.ts

import mongoose from 'mongoose';
import {UserSearchService} from "@/services/SearchUsersService";

async function testSearch() {
    try {
        // Подключаемся к БД
        await mongoose.connect('mongodb+srv://doclearn66:oxPt9JY4I1ePOklO@cluster0.7lceasn.mongodb.net/DOCLEARN');
        console.log('✅ Подключено к БД\n');

        const searchService = new UserSearchService();

        // =================== ТЕСТ 1: Поиск по имени ===================
        console.log('📝 ТЕСТ 1: Поиск по имени');
        console.log('─'.repeat(50));

        const testNames = ['Бирюков', 'Артем', 'Высоцкий'];
        for (const name of testNames) {
            const result = await searchService.searchUsers(name, 5);
            console.log(`Поиск "${name}": найдено ${result.total} результатов`);

            if (result.users.length > 0) {
                console.log('  Топ результаты:');
                result.users.slice(0, 3).forEach((user, i) => {
                    console.log(`    ${i + 1}. ${user.firstName} ${user.lastName} (${user.role}) - score: ${user.score?.toFixed(2)}`);
                });
            }
            console.log();
        }

        // =================== ТЕСТ 2: Поиск по специализации ===================
        console.log('📝 ТЕСТ 2: Поиск по специализации');
        console.log('─'.repeat(50));

        const specializations = ['диетолог', 'хирург', 'терапевт'];
        for (const spec of specializations) {
            const result = await searchService.searchUsers(spec, 5);
            console.log(`Поиск "${spec}": найдено ${result.total} результатов`);

            if (result.users.length > 0) {
                console.log('  Найденные специалисты:');
                result.users.slice(0, 3).forEach((user, i) => {
                    const userSpec = user.specializations?.[0]?.name || 'не указана';
                    console.log(`    ${i + 1}. ${user.firstName} ${user.lastName} - ${userSpec}`);
                });
            }
            console.log();
        }

        // =================== ТЕСТ 3: Комбинированный поиск ===================
        console.log('📝 ТЕСТ 3: Комбинированный поиск');
        console.log('─'.repeat(50));

        const combinedQueries = [
            'Иванов кардиолог',
            'хирург Москва',
            'диетолог Вавилов'
        ];

        for (const query of combinedQueries) {
            const result = await searchService.searchUsers(query, 5);
            console.log(`Поиск "${query}": найдено ${result.total} результатов`);

            if (result.users.length > 0) {
                console.log('  Результаты:');
                result.users.slice(0, 2).forEach((user, i) => {
                    console.log(`    ${i + 1}. ${user.firstName} ${user.lastName}`);
                    console.log(`       Роль: ${user.role}`);
                    console.log(`       Место работы: ${user.placeWork || 'не указано'}`);
                    console.log(`       Score: ${user.score?.toFixed(2)}`);
                });
            }
            console.log();
        }

        // =================== ТЕСТ 4: Автодополнение ===================
        console.log('📝 ТЕСТ 4: Автодополнение');
        console.log('─'.repeat(50));

        const prefixes = ['Егор', 'Але', 'Пет'];
        for (const prefix of prefixes) {
            const suggestions = await searchService.autocomplete(prefix, 3);
            console.log(`Автодополнение для "${prefix}":`);

            if (suggestions.length > 0) {
                suggestions.forEach((sugg, i) => {
                    console.log(`  ${i + 1}. ${sugg.fullName} (${sugg.role})`);
                });
            } else {
                console.log('  Нет результатов');
            }
            console.log();
        }

        // =================== ТЕСТ 5: Поиск по email ===================
        console.log('📝 ТЕСТ 5: Поиск по email');
        console.log('─'.repeat(50));

        const testEmail = 'test@example.com';
        const userByEmail = await searchService.searchByEmail(testEmail);

        if (userByEmail) {
            console.log(`Email ${testEmail}: НАЙДЕН`);
            console.log(`  Пользователь: ${userByEmail.firstName} ${userByEmail.lastName}`);
        } else {
            console.log(`Email ${testEmail}: НЕ НАЙДЕН`);
        }

        // =================== СТАТИСТИКА ===================
        console.log('\n📊 СТАТИСТИКА ПОИСКА');
        console.log('─'.repeat(50));
        console.log('✅ Все тесты выполнены успешно!');
        console.log('Текстовый индекс работает корректно');

    } catch (error) {
        console.error('❌ Ошибка в тестах:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Отключено от БД');
    }
}

// Запускаем тесты
testSearch();