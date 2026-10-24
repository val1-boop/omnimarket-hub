import { redirect } from "next/navigation";

// La raíz manda al dashboard; el middleware envía a /login a quien no tenga sesión.
export default function Home() {
  redirect("/dashboard");
}