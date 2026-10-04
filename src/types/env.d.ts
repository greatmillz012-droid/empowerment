declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ADMIN_EMAIL?: string;
      ADMIN_PASSWORD?: string;
      RESEND_API_KEY?: string;
      EMAIL_FROM?: string;
      PAYSTACK_SECRET_KEY?: string;
      PAYSTACK_WEBHOOK_SECRET?: string;
      PAYSTACK_PREFERRED_BANK?: string;
      SESSION_SECRET?: string;
      OTP_SECRET?: string;
      NEXT_PUBLIC_SITE_URL?: string;
      DATABASE_URL?: string;
      NEXT_PUBLIC_SUPPORT_EMAIL?: string;
    }
  }
}

export {};
