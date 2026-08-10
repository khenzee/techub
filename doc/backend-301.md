# Advanced Backend Features: File Uploads & Email Services

As we build more complex applications, we often need to handle binary data (like images or documents) and communicate with users outside the app (via email). This guide covers file uploads using `multer` and email integration using `nodemailer`.

## 1. File Uploads

File uploads handle `multipart/form-data` requests. In Express, the standard tool for this is the `multer` middleware. 

### Option A: Local Storage (Development)
When uploading locally, the file is saved directly to your server's file system. This is fine for development but not recommended for production (as servers can be ephemeral).

**1. Install `multer`:**
```bash
npm install multer
```

**2. Setup `multer` configuration (`middleware/upload.middleware.js`):**
```javascript
import multer from 'multer';
import path from 'path';

// Setup storage destination and filename
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Make sure this folder exists in your root directory!
    },
    filename: function (req, file, cb) {
        // Create a unique filename to prevent overwriting
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
})

export const uploadLocal = multer({ storage: storage });
```

### Option B: Cloudinary (Production Recommended)
For production, we store files in a dedicated cloud storage service like Cloudinary. It handles hosting, optimization, and delivers files quickly via CDN.

**1. Install required packages:**
```bash
npm install cloudinary multer multer-storage-cloudinary
```

**2. Setup Cloudinary config (`middleware/upload.middleware.js`):**
```javascript
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import {config} from "dotenv"

config({path: "../.env"})

// Configure Cloudinary with your credentials (store these in .env)


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Setup Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'techub-uploads', // Folder name in your Cloudinary dashboard
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'], // Restrict file types
  },
});

export const uploadCloudinary = multer({ storage: storage });
```

### Complete Implementation Example: Profile Picture Upload

Let's see how to combine the middleware and a controller to handle an avatar upload.

**Route (`routes/user.routes.js`):**
```javascript
import express from 'express';
import { uploadProfilePicture } from '../controllers/user.controller.js';
import { uploadCloudinary } from '../middleware/upload.middleware.js';

const router = express.Router();

// 'avatar' must match the key name in the form-data from the frontend (e.g., Postman)
router.post('/upload-avatar', uploadCloudinary.single('avatar'), uploadProfilePicture);

export default router;
```

**Controller (`controllers/user.controller.js`):**
```javascript
export const uploadProfilePicture = async (req, res) => {
    try {
        // req.file is populated by the multer middleware
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // When using Cloudinary, the secure URL is provided in req.file.path
        // If local, it will be the local file path (e.g., 'uploads/avatar-123.jpg')
        const fileUrl = req.file.path; 

        // Example: Update the user's document in the database
        // await User.findByIdAndUpdate(req.user.id, { avatarUrl: fileUrl });

        return res.status(200).json({
            message: "File uploaded successfully",
            url: fileUrl
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error uploading file",
            error: error.message
        });
    }
};
```

---

## 2. Sending Emails (SMTP with Gmail)

Sending emails is critical for user authentication workflows: welcome emails, password resets, and sending One-Time Passwords (OTPs). We use `nodemailer` for this.

### Setup Nodemailer

**1. Install package:**
```bash
npm install nodemailer
```

**2. Create a transporter utility (`utils/email.js`):**
*Note: For Gmail, you cannot use your regular password. You MUST enable 2-Factor Authentication on your Google Account and generate an "App Password".*

```javascript
import nodemailer from 'nodemailer';


const transporter = () =>{
   nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // e.g., your.email@gmail.com
        pass: process.env.EMAIL_APP_PASSWORD // 16-character App Password
    }
}); 
} 

// A reusable function to send emails
export const sendEmail = async (to, subject, text, html) => {
    try {
        await transporter()
        const mailOptions = {
            from: `"TechHub" <${process.env.EMAIL_USER}>`, // Sender display name
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
```

### Implementing in the Auth Process (Forgot Password & OTP)

Here is a practical example of integrating email into a "Forgot Password" flow. When a user forgets their password, they submit their email, and we generate a 6-digit OTP and email it to them so they can reset it.

**Controller (`controllers/auth.controller.js`):**
```javascript
import User from '../models/user.model.js';
import { sendEmail } from '../utils/email.js';

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            // It's often good practice to return a generic message to prevent email enumeration
            return res.status(404).json({ message: "If this email is registered, an OTP will be sent." });
        }
        
        // 2. Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Save OTP and expiration time to the user's document
        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now
        await user.save();

        // 4. Send the OTP via Email
        const subject = 'TechHub - Password Reset Request';
        
        // Fallback text version for email clients that don't support HTML
        const text = `Hi ${user.name}, your password reset OTP is ${otp}. It expires in 10 minutes.`; 
        
        // Beautiful HTML version
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Password Reset Request 🔐</h2>
                <p>Hi ${user.name}, we received a request to reset your password. Please use the following One-Time Password (OTP):</p>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px;">
                    <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">${otp}</h1>
                </div>
                <p style="color: #555; font-size: 12px; margin-top: 20px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
        `;

        // Send the email
        await sendEmail(email, subject, text, html);

        return res.status(200).json({
            message: "An OTP has been sent to your email address."
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to process password reset",
            error: error.message
        });
    }
};
};

// Step 2: User submits the OTP and their new password
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // 1. Find user by email and verify OTP matches AND hasn't expired
        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordExpires: { $gt: Date.now() } // $gt means "greater than" (must be in the future)
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // 2. Hash the new password (assuming you use bcrypt)
        // const salt = await bcrypt.genSalt(10);
        // user.password = await bcrypt.hash(newPassword, salt);
        user.password = newPassword; // Replace with hashed password in real app

        // 3. Clear the OTP fields so they can't be used again
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return res.status(200).json({
            message: "Password has been successfully reset"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to reset password",
            error: error.message
        });
    }
};
```

This complete flow provides a professional approach to handling file assets and secure transactional emails in a Node.js backend.
