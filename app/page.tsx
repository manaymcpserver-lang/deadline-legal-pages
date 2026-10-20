import Home from "./HomePage";
import { homepageMetadata } from "./homepage-locale";

export const metadata = homepageMetadata("en");
export default function Page() { return <Home />; }
