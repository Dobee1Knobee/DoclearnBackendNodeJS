import nodemailer from "nodemailer";
import * as process from "node:process";

export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'yandex',
            auth: {
                user: process.env.SENDER_EMAIL,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendMail(to: string, subject: string, text: string) {
        const mailOptions = {
            from: `"Doclearn" <${process.env.SENDER_EMAIL}>`,
            to,
            subject,
            text
        };

        return this.transporter.sendMail(mailOptions);
    }
}
