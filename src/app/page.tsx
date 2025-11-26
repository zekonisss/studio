import LoginPage from "./(public)/login/page";

export default function HomePage() {
  // The main page defaults to showing the login form.
  // The guard logic in (authenticated) layout will redirect the user if they are already logged in.
  return <LoginPage />;
}
