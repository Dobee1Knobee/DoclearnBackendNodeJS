// services/UserSearchService.ts

import { UserModel } from '@/models/User/User';

export class UserSearchService {

    /**
     * Основной метод поиска пользователей
     */
    async searchUsers(searchText: string, limit: number = 20) {
        // Проверяем входные данные
        if (!searchText || searchText.trim() === '') {
            return {
                users: [],
                total: 0,
                query: searchText,
                message: 'Пустой запрос'
            };
        }

        try {
            const words = searchText.trim().split(/\s+/);

            // Создаем строку поиска где КАЖДОЕ слово обязательно
            // "хирург" "Москва" - найдет только документы с ОБОИМИ словами
            const searchStringAND = words
                .map(word => `"${word}"`)  // Оборачиваем каждое слово в кавычки
                .join(' ');

            // Создаем поисковый запрос
            // $text использует наш текстовый индекс text_search_idx
            const searchQuery = {
                $text: {
                    $search: searchStringAND  // MongoDB автоматически разбивает на слова
                },
                'isVerified.user': true  // Только верифицированные пользователи
            };

            // Выполняем поиск с score релевантности
            const users = await UserModel
                .find(
                    searchQuery,
                    {
                        score: { $meta: 'textScore' }  // Добавляем поле score
                    }
                )
                .sort({
                    score: { $meta: 'textScore' }  // Сортируем по релевантности
                })
                .limit(limit)
                .select('firstName lastName middleName email role specializations location placeWork rating score')
                .lean();

            // Считаем общее количество найденных
            const total = await UserModel.countDocuments(searchQuery);

            console.log(`✅ Поиск "${searchText}": найдено ${total} результатов`);

            return {
                users,
                total,
                query: searchText,
                message: 'Успешный поиск'
            };

        } catch (error) {
            console.error('❌ Ошибка поиска:', error);
            throw error;
        }
    }

    /**
     * Поиск по точному email
     */
    async searchByEmail(email: string) {
        const user = await UserModel
            .findOne({
                email: email.toLowerCase().trim()
            })
            .select('-password -__v')
            .lean();

        return user;
    }

    /**
     * Автодополнение для поиска (префиксный поиск)
     */
    async autocomplete(prefix: string, limit: number = 5) {
        if (!prefix || prefix.length < 2) {
            return [];
        }

        // Создаем regex для поиска по началу слова
        const regex = new RegExp(`^${prefix}`, 'i');

        const users = await UserModel
            .find({
                $or: [
                    { firstName: regex },
                    { lastName: regex }
                ],
                'isVerified.user': true
            })
            .sort({ rating: -1 })  // Сортируем по рейтингу
            .limit(limit)
            .select('firstName lastName middleName role specializations.name rating')
            .lean();

        // Форматируем для автодополнения
        return users.map(user => ({
            id: user._id,
            fullName: `${user.firstName} ${user.middleName || ''} ${user.lastName}`.trim(),
            role: user.role,
            specialization: user.specializations?.[0]?.name || null,
            rating: user.rating
        }));
    }
}