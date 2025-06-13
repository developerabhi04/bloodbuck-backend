import nodeMailer from "nodemailer"


const sendEmail = async (options) => {

    const transporter = nodeMailer.createTransport({
        host: process.env.SMPT_HOST,
        port: process.env.SMPT_PORT,
        service: process.env.SMPT_SERVICE,
        auth: {
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_PASSWORD,
        },
    });


    const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: options.email,
        subject: options.subject,
        text: options.message,   // Plain text version
        html: options.html,      // HTML version of the email
    };

    await transporter.sendMail(mailOptions)
};



export default sendEmail;