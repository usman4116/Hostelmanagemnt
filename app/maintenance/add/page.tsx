import { redirect } from "next/navigation";

export default function AddMaintenanceRedirect() {
  redirect("/maintenance");
}
