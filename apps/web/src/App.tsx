import { RouterProvider } from "react-router-dom";
import { router } from "./router.js";
import { AuthProvider } from "./components/auth-provider.js";

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
