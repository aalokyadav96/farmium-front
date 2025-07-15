import "../../../css/ui/SortFilterSidebar.css";

const SortSection = ({ onSortChange }) => {
    const sortSection = document.createElement('div');
    sortSection.className = 'sort-section';

    const sortTitle = document.createElement('h4');
    sortTitle.textContent = 'Sort By';

    const select = document.createElement('select');
    select.className = 'sort-dropdown';

    const options = [
        { label: 'Select', value: '' },
        { label: 'Ascending', value: 'asc' },
        { label: 'Descending', value: 'desc' }
    ];

    options.forEach(({ label, value }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        onSortChange(select.value);
    });

    sortSection.appendChild(sortTitle);
    sortSection.appendChild(select);

    return sortSection;
};

const FilterSection = ({ onFilterChange }) => {
    const filterSection = document.createElement('div');
    filterSection.className = 'filter-section';

    const filterTitle = document.createElement('h4');
    filterTitle.textContent = 'Filter By Category';

    const select = document.createElement('select');
    select.className = 'filter-dropdown';
    select.multiple = true; // Multi-select

    const options = [
        { label: 'Category 1', value: 'category1' },
        { label: 'Category 2', value: 'category2' },
        { label: 'Category 3', value: 'category3' }
    ];

    options.forEach(({ label, value }) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        const selected = Array.from(select.selectedOptions).map(o => o.value);
        onFilterChange(selected);
    });

    filterSection.appendChild(filterTitle);
    filterSection.appendChild(select);

    return filterSection;
};

const SortFilterHorizontal = () => {
    const container = document.createElement('div');
    container.className = 'sort-filter-horizontal';

    const state = {
        sort: null,
        filters: new Set()
    };

    const dispatchUpdate = () => {
        const event = new CustomEvent('filterUpdate', {
            detail: {
                sort: state.sort,
                filters: Array.from(state.filters)
            }
        });
        container.dispatchEvent(event);
    };

    const handleSortChange = (newSort) => {
        state.sort = newSort;
        dispatchUpdate();
    };

    const handleFilterChange = (selectedValues) => {
        state.filters = new Set(selectedValues);
        dispatchUpdate();
    };

    const sortSection = SortSection({ onSortChange: handleSortChange });
    const filterSection = FilterSection({ onFilterChange: handleFilterChange });

    container.appendChild(sortSection);
    container.appendChild(filterSection);

    return container;
};

export default SortFilterHorizontal;
export { SortFilterHorizontal };

// import "../../../css/ui/SortFilterSidebar.css";

// const SortSection = ({ onSortChange }) => {
//   const sortSection = document.createElement('div');
//   sortSection.className = 'sort-section';

//   const sortTitle = document.createElement('h4');
//   sortTitle.textContent = 'Sort By';

//   const sortOptions = [
//     { label: 'Ascending', value: 'asc' },
//     { label: 'Descending', value: 'desc' }
//   ];

//   const sortForm = document.createElement('form');
//   sortForm.className = 'sort-form';

//   sortOptions.forEach(({ label, value }) => {
//     const labelEl = document.createElement('label');
//     labelEl.className = 'sort-option';

//     const input = document.createElement('input');
//     input.type = 'radio';
//     input.name = 'sort';
//     input.value = value;
//     input.id = value;
//     input.addEventListener('change', () => onSortChange(value));

//     const span = document.createElement('span');
//     span.textContent = label;

//     labelEl.appendChild(input);
//     labelEl.appendChild(span);
//     sortForm.appendChild(labelEl);
//   });

//   sortSection.appendChild(sortTitle);
//   sortSection.appendChild(sortForm);

//   return sortSection;
// };

// const FilterSection = ({ onFilterChange }) => {
//   const filterSection = document.createElement('div');
//   filterSection.className = 'filter-section';

//   const filterTitle = document.createElement('h4');
//   filterTitle.textContent = 'Filter By Category';

//   const filterOptions = [
//     { label: 'Category 1', value: 'category1' },
//     { label: 'Category 2', value: 'category2' },
//     { label: 'Category 3', value: 'category3' }
//   ];

//   const filterForm = document.createElement('form');
//   filterForm.className = 'filter-form';

//   filterOptions.forEach(({ label, value }) => {
//     const labelEl = document.createElement('label');
//     labelEl.className = 'filter-option';

//     const input = document.createElement('input');
//     input.type = 'checkbox';
//     input.name = 'category';
//     input.value = value;
//     input.id = value;
//     input.addEventListener('change', () => onFilterChange(input));

//     const span = document.createElement('span');
//     span.textContent = label;

//     labelEl.appendChild(input);
//     labelEl.appendChild(span);
//     filterForm.appendChild(labelEl);
//   });

//   filterSection.appendChild(filterTitle);
//   filterSection.appendChild(filterForm);

//   return filterSection;
// };

// const SortFilterHorizontal = () => {
//   const container = document.createElement('div');
//   container.className = 'sort-filter-horizontal';

//   const state = {
//     sort: null,
//     filters: new Set()
//   };

//   const dispatchUpdate = () => {
//     const event = new CustomEvent('filterUpdate', {
//       detail: {
//         sort: state.sort,
//         filters: Array.from(state.filters)
//       }
//     });
//     container.dispatchEvent(event);
//   };

//   const handleSortChange = (newSort) => {
//     state.sort = newSort;
//     dispatchUpdate();
//   };

//   const handleFilterChange = (input) => {
//     if (input.checked) {
//       state.filters.add(input.value);
//     } else {
//       state.filters.delete(input.value);
//     }
//     dispatchUpdate();
//   };

//   const sortSection = SortSection({ onSortChange: handleSortChange });
//   const filterSection = FilterSection({ onFilterChange: handleFilterChange });

//   container.appendChild(sortSection);
//   container.appendChild(filterSection);

//   return container;
// };

// export default SortFilterHorizontal;
// export { SortFilterHorizontal };
