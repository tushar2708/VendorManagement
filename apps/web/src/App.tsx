import { RouterProvider } from "react-router-dom";
import { router } from "./router.js";
import { AuthProvider } from "./components/auth-provider.js";
import { ToastProvider } from "./components/atoms/Toast.js";

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}
