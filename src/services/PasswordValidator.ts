export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  if (password.length < 8 || password.length > 20) {
    errors.push("must be between 8 and 20 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("must include at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("must include at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("must include at least one number");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("must include at least one special character");
  }
  return errors;
};
