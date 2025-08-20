
import nodemailer from 'nodemailer';

export async function sendOTPEmail(to: string, otp: string) {
  // Check environment variables
  if (
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !process.env.SMTP_FROM
  ) {
    throw new Error(
      `Missing SMTP configuration: SMTP_USER=${!!process.env.SMTP_USER}, SMTP_PASS=${!!process.env.SMTP_PASS}, SMTP_FROM=${!!process.env.SMTP_FROM}`,
    );
  }

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  let info = await transporter.sendMail({
    from: process.env.SMTP_FROM, //sender
    to: to, //reciever
    subject: 'OTP Verification Code',
    text: `Hi there,
Your verification code for Allertify is:${otp}
This code is valid for 5 minutes. 
Please do not share this code with anyone to keep your account secure.
Thanks,
The Allertify Team`,
  });
  console.log('Code has been sent: %s', info.response);
}

export async function sendResetPasswordEmail(to: string, token: string) {
  if (
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !process.env.SMTP_FROM
  ) {
    throw new Error(
      `Missing SMTP configuration: SMTP_USER=${!!process.env.SMTP_USER}, SMTP_PASS=${!!process.env.SMTP_PASS}, SMTP_FROM=${!!process.env.SMTP_FROM}`,
    );
  }
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  let info = await transporter.sendMail({
    from: process.env.SMTP_FROM, //sender
    to: to, //reciever
    subject: 'Reset Password',
    text: `Hi there,
Your reset password code for Allertify is:${token}
This code is valid for 5 minutes. 
Please do not share this code with anyone to keep your account secure.
Thanks,
The Allertify Team`,
  });
  console.log('Code has been sent: %s', info.response);
}
