import { ContactForm } from "./ContactForm";
export const metadata = { title: "Contact Us", description: "Get in touch with the Simmerly team." };
export default function Contact() {
  return (
    <div className="container-site pt-10">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1fr_1.3fr]">
        <div><h1 className="text-[40px] font-extrabold md:text-[48px]">Contact Us</h1>
          <p className="mt-3 text-[18px]">Questions about a recipe, your account or partnering with us? Send us a note and our team will get back to you within two business days.</p>
          <dl className="mt-8 space-y-4 text-[16px]"><div><dt className="font-bold text-ink">Recipe help</dt><dd className="text-muted">Leave a review on the recipe page — our community is quick to help!</dd></div><div><dt className="font-bold text-ink">Account support</dt><dd className="text-muted">Use “Forgot password” on the login page to reset access.</dd></div></dl></div>
        <ContactForm />
      </div>
    </div>
  );
}
