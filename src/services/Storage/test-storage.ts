// simple-test.ts
import storageService from './StorageService';

async function simpleTest() {
    try {
        console.log('🧪 Простой тест соединения...');

        // Используем встроенный метод testConnection
        const result = await storageService.testConnection();
        console.log('Результат теста соединения:', result);

        if (result.success) {
            console.log('🎉 Соединение работает! Можно переходить к полному тесту.');
        }

    } catch (error) {
        console.error('❌ Ошибка в тесте:', error);
    }
}

simpleTest();