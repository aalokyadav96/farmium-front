import { displayMenu } from "../../services/menu/menuService.js";
import "../../../css/ui/renderMenu.css";

const renderMenu = (content, isCreator, placeId, isLoggedIn) => {
    displayMenu(content, placeId, isCreator, isLoggedIn)
};

export default renderMenu;

