import ErrorBoundary from "@/components/ErrorBoundary";
import FamilyFund from "@/components/FamilyFund";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <>
      <ErrorBoundary>
        <FamilyFund />
      </ErrorBoundary>
      <Footer />
    </>
  );
}
