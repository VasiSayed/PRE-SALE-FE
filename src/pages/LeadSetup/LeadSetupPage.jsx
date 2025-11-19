import { useSearchParams } from "react-router-dom";
import LeadProjectsList from "./LeadProjectsList";
import LeadSetup from "./LeadSetup";

export default function LeadSetupPage() {
  const [searchParams] = useSearchParams();
  const openForm = searchParams.get("open"); // e.g., ?open=source

  // If there's an "open" query param, show forms
  // Otherwise, show the table/list view
  return openForm ? <LeadSetup /> : <LeadProjectsList />;
}
