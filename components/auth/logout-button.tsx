import { secondaryButtonClass } from "@/components/auth/button-styles";
import { logout } from "@/lib/auth/logout";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" className={secondaryButtonClass}>
        登出
      </button>
    </form>
  );
}
