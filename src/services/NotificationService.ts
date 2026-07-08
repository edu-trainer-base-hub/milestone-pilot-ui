import { toast } from "sonner";

type Notifier = {
  message: (message: string) => void;
  info: (message: string) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
};

const notifier: Notifier = {
  message: (message: string) => {
    toast(message, {
      richColors: true,
    });
  },
  info: (message: string) => {
    toast.info(message, {
      richColors: true,
    });
  },
  success: (message: string) => {
    toast.success(message, {
      richColors: true,
    });
  },
  warning: (message: string) => {
    toast.warning(message, {
      richColors: true,
    });
  },
  error: (message: string) => {
    toast.error(message, {
      richColors: true,
    });
  },
};

export { notifier };
