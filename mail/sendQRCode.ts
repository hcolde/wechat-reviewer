import nodemailer from "nodemailer";
import config from "../config/config.json"

export async function sendQRCode(url: string) {
    if (config.mail.host == "" || config.mail.port == null || config.mail.auth.user == "") return;
    let transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port != 25,
      auth: {
        user: config.mail.auth.user,
        pass: config.mail.auth.pass,
      },
    });

    await transporter.sendMail({
      from: `<${config.mail.auth.user}>`,
      cc: config.mail.auth.user,
      to: config.mail.receiver,
      subject: "登录二维码",
      html: `<img src="${url}" />`
    });
}