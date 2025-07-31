import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize } = format;

// 🎨 Кастомное форматирование с эмодзи для каждого уровня
const logFormat = printf(({ level, message, timestamp }) => {
    let emoji = "";

    switch (level) {
        case "error":
            emoji = "❌";
            break;
        case "warn":
            emoji = "⚠️";
            break;
        case "info":
            emoji = "ℹ️";
            break;
        case "http":
            emoji = "🌐";
            break;
        case "debug":
            emoji = "🐛";
            break;
        default:
            emoji = "";
    }

    return `${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`;
});

// ⚙️ Создаём логгер
const logger = createLogger({
    level: "debug", // минимальный уровень логов (можно менять)
    format: combine(
        colorize(), // ✅ Красит уровень (error=красный, warn=жёлтый и т.д.)
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
    ),
    transports: [
        new transports.Console(), // вывод в консоль
        new transports.File({ filename: "logs/error.log", level: "error" }), // только ошибки
        new transports.File({ filename: "logs/combined.log" }) // все логи
    ]
});

export default logger;

