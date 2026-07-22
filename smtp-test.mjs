import nodemailer from "nodemailer";
import "dotenv/config";

const requiredVariables = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Variável ausente no .env: ${variable}`);
  }
}


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",

  authMethod: "LOGIN",

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },

  tls: {
    servername: "skymail.net.br",
  },
}); 

try {
  await transporter.verify();

  console.log("Conexão SMTP realizada com sucesso.");

  const result = await transporter.sendMail({
    from: process.env.OUTLOOK_SENDER_EMAIL,
    to: process.env.SMTP_USER,
    subject: "Teste SMTP - Gestão Estratégica",
    text: "Este é um teste de envio SMTP realizado pela aplicação.",
    html: `
      <h2>Teste SMTP concluído</h2>
      <p>Este e-mail foi enviado pela aplicação de Gestão Estratégica.</p>
    `,
  });

  console.log("E-mail enviado com sucesso.");
  console.log("ID da mensagem:", result.messageId);
} catch (error) {
  console.error("Falha no teste SMTP:", error);
  process.exitCode = 1;
} finally {
  transporter.close();
}   