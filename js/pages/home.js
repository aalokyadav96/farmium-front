// import { HomeX } from "../services/home/homeService.js";
// import { NewHome } from "../services/home/naverhome.js";
// import { Hemre } from "../services/home/home.js";
import { YoHome } from "../services/home/yohome.js";

function Home(isLoggedIn, container) {
    YoHome(isLoggedIn, container);
    // Hemre(isLoggedIn, container);
    // NewHome(isLoggedIn, container);
    // HomeX(isLoggedIn, container);
}

export { Home };
