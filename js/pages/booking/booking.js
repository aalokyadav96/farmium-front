import { displayBooking } from '../../services/booking/bookingtest.js';

async function Booking(isLoggedIn, contentContainer) {
    displayBooking(isLoggedIn, contentContainer)
}

export { Booking };
