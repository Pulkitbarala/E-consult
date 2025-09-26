import { NextApiRequest, NextApiResponse } from 'next';
import { generateAndSendOtp, verifyOtp } from '../../integrations/otp/otpService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    if (method === 'POST') {
      const { email, otp } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      if (otp) {
        // Verify OTP
        const isValid = verifyOtp(email, otp);
        return res.status(200).json({ success: isValid });
      } else {
        // Generate and send OTP
        await generateAndSendOtp(email);
        return res.status(200).json({ message: 'OTP sent successfully.' });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${method} not allowed.` });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}