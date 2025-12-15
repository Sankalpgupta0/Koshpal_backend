import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendCredentialsEmail(
  email: string,
  fullName: string,
  password: string,
): Promise<void> {
  await transporter.sendMail({
    from: '"Koshpal HR" <no-reply@koshpal.com>',
    to: email,
    subject: 'Your Koshpal Login Credentials',
    html: `
      <p>Hello ${fullName},</p>
      <p>Your Koshpal employee account has been created.</p>
      <p><b>Login Email:</b> ${email}</p>
      <p><b>Password:</b> ${password}</p>
      <p>Please change your password after login.</p>
    `,
  });
}
