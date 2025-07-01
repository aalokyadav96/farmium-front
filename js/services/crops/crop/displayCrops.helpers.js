import { createElement } from "../../../components/createElement";
import { navigate } from "../../../routes";

// const categoryMap = new Map([
//   // Fruits
//   ["mango", "fruits"],
//   ["banana", "fruits"],
//   ["apple", "fruits"],
//   ["guava", "fruits"],
//   ["papaya", "fruits"],
//   ["orange", "fruits"],
//   ["grapes", "fruits"],
//   ["pineapple", "fruits"],
//   ["litchi", "fruits"],
//   ["watermelon", "fruits"],
//   ["muskmelon", "fruits"],
//   ["lemon", "fruits"],
//   ["strawberry", "fruits"],

//   // Vegetables
//   ["tomato", "vegetables"],
//   ["onion", "vegetables"],
//   ["potato", "vegetables"],
//   ["spinach", "vegetables"],
//   ["carrot", "vegetables"],
//   ["cabbage", "vegetables"],
//   ["cauliflower", "vegetables"],
//   ["garlic", "vegetables"],
//   ["radish", "vegetables"],
//   ["cucumber", "vegetables"],
//   ["pumpkin", "vegetables"],
//   ["okra", "vegetables"],
//   ["beetroot", "vegetables"],
//   ["zucchini", "vegetables"],

//   // Legumes
//   ["chickpea", "legumes"],
//   ["lentil", "legumes"],
//   ["pea", "legumes"],
//   ["soybean", "legumes"],
//   ["pigeon pea", "legumes"],
//   ["kidney bean", "legumes"],
//   ["black gram", "legumes"],
//   ["green gram", "legumes"],
//   ["cowpea", "legumes"],
//   ["horse gram", "legumes"],

//   // Grains
//   ["wheat", "grains"],
//   ["rice", "grains"],
//   ["corn", "grains"],
//   ["barley", "grains"],
//   ["oats", "grains"],
//   ["sorghum", "grains"],
//   ["millet", "grains"],
//   ["quinoa", "grains"],
//   ["rye", "grains"],
//   ["bajra", "grains"],
//   ["amaranth", "grains"],

//   // Herbs
//   ["mint", "herbs"],
//   ["coriander", "herbs"],
//   ["basil", "herbs"],
//   ["parsley", "herbs"],
//   ["rosemary", "herbs"],
//   ["thyme", "herbs"],
//   ["oregano", "herbs"],
//   ["dill", "herbs"],
//   ["lemongrass", "herbs"],

//   // Flowers
//   ["rose", "flowers"],
//   ["lily", "flowers"],
//   ["marigold", "flowers"],
//   ["jasmine", "flowers"],
//   ["sunflower", "flowers"],
//   ["hibiscus", "flowers"],
//   ["lavender", "flowers"],
//   ["chrysanthemum", "flowers"],
//   ["tulip", "flowers"],
//   ["lotus", "flowers"],
//   ["gerbera", "flowers"],

//   // Spices
//   ["turmeric", "spices"],
//   ["chili", "spices"],
//   ["ginger", "spices"],
//   ["cardamom", "spices"],
//   ["cumin", "spices"],
//   ["coriander seed", "spices"],
//   ["fennel", "spices"],
//   ["mustard seed", "spices"],
//   ["fenugreek", "spices"],

//   // Oilseeds
//   ["sunflower seed", "oilseeds"],
//   ["sesame", "oilseeds"],
//   ["groundnut", "oilseeds"],
//   ["soybean", "oilseeds"],
//   ["linseed", "oilseeds"],
//   ["mustard", "oilseeds"],
//   ["castor", "oilseeds"]
// ]);

// export function guessCategoryFromName(name) {
//   const lower = name.toLowerCase();
//   for (const [keyword, category] of categoryMap) {
//     if (lower.includes(keyword)) {
//       return category;
//     }
//   }
//   return "others";
// }


// // export function guessCategoryFromName(name) {
// //   const lower = name.toLowerCase();

// //   if (/mango|banana|apple|guava|papaya|orange|grapes|pineapple|litchi|watermelon|muskmelon|lemon|strawberry/.test(lower)) {
// //     return "fruits";
// //   }
// //   if (/tomato|onion|potato|spinach|carrot|cabbage|cauliflower|garlic|radish|cucumber|pumpkin|okra|beetroot|zucchini/.test(lower)) {
// //     return "vegetables";
// //   }
// //   if (/chickpea|lentil|pea|soybean|pigeon pea|kidney bean|black gram|green gram|cowpea|horse gram/.test(lower)) {
// //     return "legumes";
// //   }
// //   if (/wheat|rice|corn|barley|oats|sorghum|millet|quinoa|rye|bajra|amaranth/.test(lower)) {
// //     return "grains";
// //   }
// //   if (/mint|coriander|basil|parsley|rosemary|thyme|oregano|dill|lemongrass/.test(lower)) {
// //     return "herbs";
// //   }
// //   if (/rose|lily|marigold|jasmine|sunflower|hibiscus|lavender|chrysanthemum|tulip|lotus|gerbera/.test(lower)) {
// //     return "flowers";
// //   }
// //   if (/turmeric|chili|ginger|cardamom|cumin|coriander seed|fennel|mustard seed|fenugreek/.test(lower)) {
// //     return "spices";
// //   }
// //   if (/sunflower seed|sesame|groundnut|soybean|linseed|mustard|castor/.test(lower)) {
// //     return "oilseeds";
// //   }

// //   return "others";
// // }

const normalizedCategoryMap = new Map([
  // Fruits
  ["mango", "fruits"], ["banana", "fruits"], ["apple", "fruits"], ["guava", "fruits"], ["papaya", "fruits"], ["orange", "fruits"], ["grapes", "fruits"], ["pineapple", "fruits"], ["litchi", "fruits"], ["watermelon", "fruits"], ["muskmelon", "fruits"], ["lemon", "fruits"], ["strawberry", "fruits"],

  // Vegetables
  ["tomato", "vegetables"], ["onion", "vegetables"], ["potato", "vegetables"], ["spinach", "vegetables"], ["carrot", "vegetables"], ["cabbage", "vegetables"], ["cauliflower", "vegetables"], ["garlic", "vegetables"], ["radish", "vegetables"], ["cucumber", "vegetables"], ["pumpkin", "vegetables"], ["okra", "vegetables"], ["beetroot", "vegetables"], ["zucchini", "vegetables"],

  // Legumes
  ["chickpea", "legumes"], ["lentil", "legumes"], ["pea", "legumes"], ["soybean", "legumes"], ["pigeon_pea", "legumes"], ["kidney_bean", "legumes"], ["black_gram", "legumes"], ["green_gram", "legumes"], ["cowpea", "legumes"], ["horse_gram", "legumes"],

  // Grains
  ["wheat", "grains"], ["rice", "grains"], ["corn", "grains"], ["barley", "grains"], ["oats", "grains"], ["sorghum", "grains"], ["millet", "grains"], ["quinoa", "grains"], ["rye", "grains"], ["bajra", "grains"], ["amaranth", "grains"],

  // Herbs
  ["mint", "herbs"], ["coriander", "herbs"], ["basil", "herbs"], ["parsley", "herbs"], ["rosemary", "herbs"], ["thyme", "herbs"], ["oregano", "herbs"], ["dill", "herbs"], ["lemongrass", "herbs"],

  // Flowers
  ["rose", "flowers"], ["lily", "flowers"], ["marigold", "flowers"], ["jasmine", "flowers"], ["hibiscus", "flowers"], ["lavender", "flowers"], ["chrysanthemum", "flowers"], ["tulip", "flowers"], ["lotus", "flowers"], ["gerbera", "flowers"],

  // Spices
  ["turmeric", "spices"], ["chili", "spices"], ["ginger", "spices"], ["cardamom", "spices"], ["cumin", "spices"], ["coriander_seed", "spices"], ["fennel", "spices"], ["mustard_seed", "spices"], ["fenugreek", "spices"],

  // Oilseeds
  ["sunflower_seed", "oilseeds"], ["sesame", "oilseeds"], ["groundnut", "oilseeds"], ["soybean", "oilseeds"], ["linseed", "oilseeds"],  ["mustard", "oilseeds"], ["castor", "oilseeds"],

  // Medicinal
  ["ashwagandha", "medicinal"], ["giloy", "medicinal"],

  // Others
  ["hara_chara", "others"], ["tooda", "others"],
]);

function normalizeText(str) {
  return str.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

export function guessCategoryFromName(name) {
  const text = normalizeText(name);
  for (const [keyword, category] of normalizedCategoryMap.entries()) {
    if (text.includes(keyword)) {
      return category;
    }
  }
  return "others";
}

export function createPromoLink(text, cropName, data) {
  const link = createElement("a", { href: "#", class: "promo-link" }, [text]);
  link.onclick = e => {
    e.preventDefault();
    const found = Object.values(data).flat().find(c =>
      c.name.toLowerCase() === cropName.toLowerCase()
    );
    found ? navigate(`/crop/${cropName.toLowerCase()}`) : alert(`Sorry, ${cropName} not found.`);
  };
  return link;
}
