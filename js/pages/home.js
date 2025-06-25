// import { HomeX } from "../services/home/homeService.js";
import { NewHome } from "../services/home/newhome.js";

function Home(isLoggedIn, container) {
    NewHome(isLoggedIn, container);
    // HomeX(isLoggedIn, container);
}

export { Home };
