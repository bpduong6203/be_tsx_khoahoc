import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_ENCRYPTION === 'ssl',
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: (process.env.MAIL_PASSWORD || '').replace(/\s/g, ''),
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Mailer config error:', error);
  } else {
    console.log('Mailer ready:', success);
  }
});

export default transporter;