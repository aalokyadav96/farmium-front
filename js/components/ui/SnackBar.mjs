import "../../../css/ui/SnackBar.css";
const SnackBar = (message, duration = 3000) => {
    const snackbar = document.createElement('div');
    snackbar.className = 'snackbar';
    snackbar.textContent = message;
    
    const time = Math.max(duration, message.length * 50); 

    document.getElementById('app').appendChild(snackbar);
  
    setTimeout(() => {
      snackbar.classList.add('hide');
      setTimeout(() => snackbar.remove(), 500);
    }, time);
  
    return snackbar;
  };
  
  export default SnackBar;
  