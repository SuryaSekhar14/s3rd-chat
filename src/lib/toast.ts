import toast from "react-hot-toast";
import { toastConfig } from "@/lib/config";

const isBrowser = () => typeof window !== "undefined";

export const showToast = {
  success: (message: string) => {
    if (!isBrowser()) return;
    return toast.success(message, { duration: toastConfig.duration });
  },

  error: (message: string) => {
    if (!isBrowser()) return;
    return toast.error(message, { duration: toastConfig.duration });
  },

  loading: (message: string) => {
    if (!isBrowser()) return;
    return toast.loading(message, { duration: toastConfig.duration });
  },

  custom: (message: string, icon?: string) => {
    if (!isBrowser()) return;
    return toast(message, {
      icon: icon ?? toastConfig.defaultIcon,
      duration: toastConfig.duration,
    });
  },

  dismiss: (toastId?: string) => {
    if (!isBrowser()) return;

    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
};

export default showToast;
