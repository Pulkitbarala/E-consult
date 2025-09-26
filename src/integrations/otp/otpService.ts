import axios from 'axios';

const FAST2SMS_API_KEY = 'your-fast2sms-api-key';
const OTP_EXPIRY_TIME = 5 * 60 * 1000;

// Temporary in-memory storage for OTPs
const otpStorage: Record<string, { otp: string; expiry: number }> = {};

/**
 * Generate a random 6-digit OTP
 */
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP to the provided email using Fast2SMS
 * @param email - The recipient's email address
 * @param otp - The OTP to send
 */
async function sendOtp(email: string, otp: string): Promise<void> {
  const message = `Your OTP is ${otp}. It is valid for 5 minutes.`;

  try {
    await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'q',
        message,
        language: 'english',
        flash: 0,
        numbers: email,
      },
      {
        headers: {
          authorization: FAST2SMS_API_KEY,
        },
      }
    );
  } catch (error) {
    console.error('Failed to send OTP:', error);
    throw new Error('Failed to send OTP. Please try again.');
  }
}

/**
 * Generate and send OTP to the provided email
 * @param email - The recipient's email address
 */
export async function generateAndSendOtp(email: string): Promise<void> {
  if (!email.endsWith('@gmail.com')) {
    throw new Error('Only Gmail addresses are allowed.');
  }

  const otp = generateOtp();
  const expiry = Date.now() + OTP_EXPIRY_TIME;

  otpStorage[email] = { otp, expiry };

  await sendOtp(email, otp);
}

/**
 * Verify the OTP entered by the user
 * @param email - The recipient's email address
 * @param otp - The OTP entered by the user
 */
export function verifyOtp(email: string, otp: string): boolean {
  const record = otpStorage[email];

  if (!record) {
    throw new Error('No OTP found for this email.');
  }

  if (record.expiry < Date.now()) {
    delete otpStorage[email];
    throw new Error('OTP has expired.');
  }

  if (record.otp !== otp) {
    throw new Error('Invalid OTP.');
  }

  delete otpStorage[email];
  return true;
}