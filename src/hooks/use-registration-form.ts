import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmailVerificationType, useAuth } from "@/contexts/AuthContext.tsx";
import { extractErrorCode } from "@/services/ApiService.ts";
import { validatePassword } from "@/services/PasswordValidator.ts";
import { useNavigate } from "react-router-dom";
import { notifier } from "@/services/NotificationService.ts";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UseRegistrationFormProps {
  mode: FormMode;
}

export const FormMode = {
  REGISTRATION: "REGISTRATION",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;

export type FormMode = (typeof FormMode)[keyof typeof FormMode];

interface UseVerificationFormReturn {
  email: string;
  emailError: string | null;
  codeSent: boolean;
  confirmationCode: string;
  codeError: string | null;
  password: string;
  confirmPassword: string;
  passwordErrors: string[];
  confirmError: string | null;
  sendCodeLoading: boolean;
  submitLoading: boolean;
  submitError: string | null;
  secondsLeft: number;
  handleEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleEmailBlur: () => void;
  handleSendCode: () => Promise<void>;
  handleCodeChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handlePasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleConfirmChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
}

export function useRegistrationForm({ mode }: UseRegistrationFormProps): UseVerificationFormReturn {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const [codeSent, setCodeSent] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [secondsLeft, setSecondsLeft] = useState(0);

  const navigate = useNavigate();
  const { sendConfirmationCode, doRegister, doResetPassword } = useAuth();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setCodeSent(false);
    setConfirmationCode("");
    setCodeError(null);
    setSecondsLeft(0);

    if (!value) {
      setEmailError(null);
    } else if (!emailRegex.test(value)) {
      setEmailError(t("pages.registrationPage.validation.invalidEmail"));
    } else {
      setEmailError(null);
    }
  };

  const handleEmailBlur = () => {
    const trimmed = email.trim();
    if (trimmed !== email) {
      setEmail(trimmed);
    }
  };

  const handleSendCode = async () => {
    if (emailError || !email || secondsLeft > 0) return;
    setSendCodeLoading(true);
    setCodeError(null);

    try {
      const type =
        FormMode.PASSWORD_RESET === mode
          ? EmailVerificationType.PASSWORD_RESET_EMAIL_VERIFICATION_CODE_WEB
          : EmailVerificationType.EMAIL_VERIFICATION_CODE_WEB;
      await sendConfirmationCode(email, type);
      setCodeSent(true);
      notifier.success(t("pages.registrationPage.notifications.codeSentSuccess"));
      setSecondsLeft(60);
    } catch (error: unknown) {
      const errorCode = extractErrorCode(error);
      const messageKey = errorCode ? `errors.codes.${errorCode}` : "pages.registrationPage.notifications.codeSentError";
      const message = t(messageKey, {
        defaultValue: t("errors.codes.UNKNOWN"),
      });

      setCodeError(message);
      notifier.error(message);
    } finally {
      setSendCodeLoading(false);
    }
  };

  const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmationCode(e.target.value);
    setCodeError(null);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordErrors(validatePassword(value));
    if (confirmPassword && value !== confirmPassword) {
      setConfirmError(t("pages.registrationPage.validation.passwordsMismatch"));
    } else {
      setConfirmError(null);
    }
  };

  const handleConfirmChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (password && password !== value) {
      setConfirmError(t("pages.registrationPage.validation.passwordsMismatch"));
    } else {
      setConfirmError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (emailError || !confirmationCode || codeError || passwordErrors.length > 0 || confirmError) return;
    setSubmitLoading(true);
    setSubmitError(null);

    const trimmedEmail = email.trim();
    if (trimmedEmail !== email) {
      setEmail(trimmedEmail);
    }

    try {
      if (FormMode.PASSWORD_RESET === mode) {
        await doResetPassword(trimmedEmail, password, confirmPassword, confirmationCode);
        notifier.success(t("pages.resetPasswordPage.notifications.submitSuccess"));
        navigate("/login", { replace: true });
      } else {
        await doRegister(trimmedEmail, password, confirmPassword, confirmationCode);
        notifier.success(t("pages.registrationPage.notifications.submitSuccess"));
        navigate("/", { replace: true });
      }
    } catch (error: unknown) {
      const defaultMessageKey =
        FormMode.PASSWORD_RESET === mode
          ? t("pages.resetPasswordPage.notifications.submitError")
          : t("pages.registrationPage.notifications.submitError");

      const errorCode = extractErrorCode(error);
      const messageKey = errorCode ? `errors.codes.${errorCode}` : defaultMessageKey;
      const message = t(messageKey, {
        defaultValue: t("errors.codes.UNKNOWN"),
      });

      setSubmitError(message);
      notifier.error(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return {
    email,
    emailError,
    codeSent,
    confirmationCode,
    codeError,
    password,
    confirmPassword,
    passwordErrors,
    confirmError,
    sendCodeLoading,
    submitLoading,
    submitError,
    secondsLeft,
    handleEmailChange,
    handleEmailBlur,
    handleSendCode,
    handleCodeChange,
    handlePasswordChange,
    handleConfirmChange,
    handleSubmit,
  };
}
