import LoginPage from "./(public)/login/page";

export default function HomePage() {
  // Pagrindinis puslapis pagal nutylėjimą rodo prisijungimo formą.
  // Apsaugos logika (guard) yra (authenticated) layout'e ir nukreips vartotoją, jei jis jau prisijungęs.
  return <LoginPage />;
}
