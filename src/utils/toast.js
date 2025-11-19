import toast from "react-hot-toast";

export function showToast(message, type = "success") {
  if (type === "error") return toast.error(message);
  if (type === "loading") return toast.loading(message);
  return toast.success(message);
}