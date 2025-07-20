const BookingManager = () => {
    const state = {
      slots: [], // { time: "18:00", capacity: 5 }
      bookings: [] // from your database
    };
  
    const addSlot = (time, capacity) => {
      if (!time || capacity < 1) return false;
      state.slots.push({ time, capacity });
      return true;
    };
  
    const listSlots = () => state.slots;
  
    const getBookingsForDate = (date) => {
      return state.bookings.filter(b => b.date === date);
    };
  
    const addBooking = ({ name, date, time, seats }) => {
      const slot = state.slots.find(s => s.time === time);
      if (!slot || slot.capacity < seats) return false;
  
      // Add booking
      state.bookings.push({ name, date, time, seats });
      slot.capacity -= seats;
      return true;
    };
  
    return {
      addSlot,
      listSlots,
      getBookingsForDate,
      addBooking
    };
  };
  
  export default BookingManager;
  