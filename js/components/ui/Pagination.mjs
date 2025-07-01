import "../../../css/ui/Pagination.css";
// Function to create a pagination component
function Pagination(currentPage, totalPages, updatePage) {
  const paginationContainer = document.createElement("div");
  paginationContainer.classList.add("pagination-container");

  // Create "Previous" button
  if (currentPage > 1) {
      const prevButton = document.createElement("button");
      prevButton.textContent = "Previous";
      prevButton.onclick = () => updatePage(currentPage - 1);
      paginationContainer.appendChild(prevButton);
  }

  // Create "Next" button
  if (currentPage < totalPages) {
      const nextButton = document.createElement("button");
      nextButton.textContent = "Next";
      nextButton.onclick = () => updatePage(currentPage + 1);
      paginationContainer.appendChild(nextButton);
  }

  return paginationContainer;
}

  export default Pagination;
  
  /**************** */
