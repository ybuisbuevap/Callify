// import nodemailer from "nodemailer";

// const createTransporter = () => nodemailer.createTransport({
//     host: "74.125.130.108",
//     port: 465,
//     secure: true,
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
//     family: 4, // use IPv4
// });

// export const sendVerificationEmail = async (to, token) => {
//     const transporter = createTransporter();
//     const link = `${process.env.CLIENT_URL}/verify/${token}`;
//     const info = await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to,
//         subject: "Verify your email — Callify",
//         text: `Verify your email here: ${link}`,
//     });
//     console.log("VERIFICATION MAIL SENT:", info.response);
// };

// export const sendResetPasswordEmail = async (to, token) => {
//     const transporter = createTransporter();
//     const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
//     const info = await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to,
//         subject: "Reset your password — Callify",
//         html: `
//             <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
//                 <h2 style="color: #f0f0f4;">Reset your password</h2>
//                 <p style="color: #9090a0;">Click the button below to reset your Callify password. This link expires in <strong>1 hour</strong>.</p>
//                 <a href="${link}" style="display: inline-block; padding: 0.72rem 1.5rem; background: #ff8c00; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 1rem 0;">
//                     Reset Password
//                 </a>
//                 <p style="color: #55555f; font-size: 0.82rem;">If you didn't request this, you can safely ignore this email.</p>
//             </div>
//         `,
//     });
//     console.log("RESET MAIL SENT:", info.response);
// };

// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

// export const sendVerificationEmail = async (to, token) => {
//     const link = `${process.env.CLIENT_URL}/verify/${token}`;
//     try {
//         const result = await resend.emails.send({
//             from: 'Callify <onboarding@resend.dev>',
//             to,
//             subject: 'Verify your email — Callify',
//             text: `Verify your email here: ${link}`,
//         });
//         console.log("VERIFICATION MAIL SENT:", result);
//     } catch (err) {
//         console.log("VERIFICATION MAIL ERROR:", err);
//     }
// };

// export const sendResetPasswordEmail = async (to, token) => {
//     const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
//     try {
//         const result = await resend.emails.send({
//             from: 'Callify <onboarding@resend.dev>',
//         to,
//         subject: 'Reset your password — Callify',
//         html: `
//             <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
//                 <h2>Reset your password</h2>
//                 <p>Click the button below to reset your Callify password. This link expires in 1 hour.</p>
//                 <a href="${link}" style="display: inline-block; padding: 0.72rem 1.5rem; background: #ff8c00; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 1rem 0;">
//                     Reset Password
//                 </a>
//                 <p style="font-size: 0.82rem;">If you didn't request this, you can safely ignore this email.</p>
//             </div>
//         `,
//     });
//     console.log("RESET MAIL SENT:", result);
// } catch (err) {
//     console.log("RESET MAIL ERROR:", err);
// }
// };

// import nodemailer from "nodemailer";

// const createTransporter = () => nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
// });

// export const sendVerificationEmail = async (to, token) => {
//     const transporter = createTransporter();
//     const link = `${process.env.CLIENT_URL}/verify/${token}`;
//     const info = await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to,
//         subject: 'Verify your email — Callify',
//         text: `Verify your email here: ${link}`,
//     });
//     console.log("VERIFICATION MAIL SENT:", info.response);
// };

// export const sendResetPasswordEmail = async (to, token) => {
//     const transporter = createTransporter();
//     const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
//     const info = await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to,
//         subject: 'Reset your password — Callify',
//         html: `
//             <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
//                 <h2>Reset your password</h2>
//                 <p>Click below to reset your Callify password. Expires in 1 hour.</p>
//                 <a href="${link}" style="display: inline-block; padding: 0.72rem 1.5rem; background: #ff8c00; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 1rem 0;">
//                     Reset Password
//                 </a>
//                 <p style="font-size: 0.82rem;">If you didn't request this, ignore this email.</p>
//             </div>
//         `,
//     });
//     console.log("RESET MAIL SENT:", info.response);
// };

import nodemailer from "nodemailer";

const createTransporter = () => nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
    },
});

export const sendVerificationEmail = async (to, token) => {
    const transporter = createTransporter();
    const link = `${process.env.CLIENT_URL}/verify/${token}`;
    const info = await transporter.sendMail({
        from: '"Callify" <devangsingh3007@gmail.com>',
        to,
        subject: 'Verify your email — Callify',
        text: `Verify your email here: ${link}`,
    });
    console.log("VERIFICATION MAIL SENT:", info.response);
};

export const sendResetPasswordEmail = async (to, token) => {
    const transporter = createTransporter();
    const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
    const info = await transporter.sendMail({
        from: '"Callify" <devangsingh3007@gmail.com>',
        to,
        subject: 'Reset your password — Callify',
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>Reset your password</h2>
                <p>Click below to reset your Callify password. Expires in 1 hour.</p>
                <a href="${link}" style="display: inline-block; padding: 0.72rem 1.5rem; background: #ff8c00; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 1rem 0;">
                    Reset Password
                </a>
                <p style="font-size: 0.82rem;">If you didn't request this, ignore this email.</p>
            </div>
        `,
    });
    console.log("RESET MAIL SENT:", info.response);
};