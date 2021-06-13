const path, { resolve } = require("path");
const { createLogger, format, transports } = require('winston');

const logFormat = format.printf((info) => `${info.timestamp} - ${info.level}: ${info.message}`);
const logger = createLogger({
    level: 'info',
    format: format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                logFormat
            )
        }),

        // new DiscordTransport({
        //     webhook: `URL`,
        //     defaultMeta: { Service: 'Berlin' },
        //     level: 'warn'
        // }),

        // Logging info and up to file
        new transports.File({
            filename: path.join(resolve(__dirname, '../logs'), 'full.log'),
            level: 'info',
            format: logFormat,
            options: { flags: 'w' }
        }),

        // Logging only errors to file
        new transports.File({
            filename: path.join(resolve(__dirname, '../logs'), 'error.log'),
            level: 'error',
            format: logFormat,
            options: { flags: 'w' }
        })
    ],
});

module.exports = {
    logger,
};