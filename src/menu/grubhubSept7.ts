import type { MealPeriod } from './dineoncampus';
import type { RecordedMenuItem } from './grubhub';

const ALL_DAY: MealPeriod[] = ['breakfast', 'lunch', 'dinner', 'other'];
const LUNCH_DINNER: MealPeriod[] = ['lunch', 'dinner'];
const DINNER: MealPeriod[] = ['dinner'];

// Picks-eligible items transcribed from the student Grubhub recordings supplied
// on 2026-09-07. The recordings show Chick-fil-A's afternoon/evening menu and
// Brunch's DINNER menu. As with the existing catalog, generic fountain/bottled
// drinks, sides, sauces, merchandise, and solid desserts are intentionally not
// added as Picks candidates.
export const RECORDED_MENU_SEPT7: RecordedMenuItem[] = [
  // Chick-fil-A — meals
  { id: 'cfa-chicken-waffles-meal', locationId: 'chick-fil-a', name: 'Chicken and Waffles Sandwich Meal', price: 15.39, type: 'fast', periods: LUNCH_DINNER, description: 'A maple-flavored waffle sandwich with a breakfast portion of boneless chicken breast.' },
  { id: 'cfa-chicken-sandwich-meal', locationId: 'chick-fil-a', name: 'Chick-fil-A Chicken Sandwich Meal', price: 11.55, type: 'fast', periods: LUNCH_DINNER, description: 'Boneless chicken breast seasoned to perfection, hand-breaded and pressure cooked.' },
  { id: 'cfa-deluxe-sandwich-meal', locationId: 'chick-fil-a', name: 'Chick-fil-A Deluxe Sandwich Meal', price: 12.45, type: 'fast', periods: LUNCH_DINNER, description: 'Chick-fil-A chicken sandwich served deluxe.' },
  { id: 'cfa-spicy-deluxe-meal', locationId: 'chick-fil-a', name: 'Spicy Chicken Deluxe Sandwich Meal', price: 12.99, type: 'fast', periods: LUNCH_DINNER, description: 'Boneless chicken breast seasoned with a spicy blend and served deluxe.' },
  { id: 'cfa-spicy-sandwich-meal', locationId: 'chick-fil-a', name: 'Spicy Chicken Sandwich Meal', price: 12.09, type: 'fast', periods: LUNCH_DINNER, description: 'Boneless chicken breast seasoned with a spicy blend, hand-breaded and pressure cooked.' },
  { id: 'cfa-grilled-club-meal', locationId: 'chick-fil-a', name: 'Grilled Chicken Club Sandwich Meal', price: 15.49, type: 'fast', periods: LUNCH_DINNER, description: 'Lemon-herb marinated boneless chicken breast grilled for a tender and juicy backyard-smoky taste.' },
  { id: 'cfa-grilled-sandwich-meal', locationId: 'chick-fil-a', name: 'Grilled Chicken Sandwich Meal', price: 13.09, type: 'fast', periods: LUNCH_DINNER, description: 'Lemon-herb marinated boneless chicken breast grilled for a tender and juicy backyard-smoky taste.' },
  { id: 'cfa-nuggets-meal', locationId: 'chick-fil-a', name: 'Chick-fil-A Nuggets Meal', price: 11.65, type: 'fast', periods: LUNCH_DINNER, description: 'Bite-sized pieces of tender all-breast chicken, seasoned to perfection and hand-breaded.' },
  { id: 'cfa-grilled-nuggets-meal', locationId: 'chick-fil-a', name: 'Grilled Nuggets Meal', price: 12.45, type: 'fast', periods: LUNCH_DINNER, description: 'Bite-sized pieces of freshly marinated boneless chicken breast, grilled for a tender and juicy taste.' },

  // Chick-fil-A — entrees
  { id: 'cfa-chicken-waffles', locationId: 'chick-fil-a', name: 'Chicken and Waffles Sandwich', price: 10.35, type: 'fast', periods: LUNCH_DINNER, description: 'A maple-flavored waffle sandwich with a breakfast portion of boneless chicken breast.' },
  { id: 'cfa-chicken-sandwich', locationId: 'chick-fil-a', name: 'Chick-fil-A Chicken Sandwich', price: 6.49, type: 'fast', periods: LUNCH_DINNER, calories: '420 cal', description: 'Boneless chicken breast seasoned to perfection, hand-breaded and pressure cooked.' },
  { id: 'cfa-deluxe-sandwich', locationId: 'chick-fil-a', name: 'Chick-fil-A Deluxe Sandwich', price: 7.39, type: 'fast', periods: LUNCH_DINNER, calories: '490 cal', description: 'Chick-fil-A chicken sandwich served deluxe.' },
  { id: 'cfa-spicy-sandwich', locationId: 'chick-fil-a', name: 'Spicy Chicken Sandwich', price: 6.99, type: 'fast', periods: LUNCH_DINNER, calories: '450 cal', description: 'Boneless chicken breast seasoned with a spicy blend, hand-breaded and pressure cooked.' },
  { id: 'cfa-spicy-deluxe', locationId: 'chick-fil-a', name: 'Spicy Deluxe Sandwich', price: 7.89, type: 'fast', periods: LUNCH_DINNER, calories: '540 cal', description: 'Spicy chicken sandwich served deluxe.' },
  { id: 'cfa-grilled-club', locationId: 'chick-fil-a', name: 'Grilled Chicken Club Sandwich', price: 10.39, type: 'fast', periods: LUNCH_DINNER, calories: '520 cal', description: 'Lemon-herb marinated boneless chicken breast grilled for a tender and juicy backyard-smoky taste.' },
  { id: 'cfa-grilled-sandwich', locationId: 'chick-fil-a', name: 'Grilled Chicken Sandwich', price: 7.99, type: 'fast', periods: LUNCH_DINNER, calories: '390 cal', description: 'Lemon-herb marinated boneless chicken breast grilled for a tender and juicy backyard-smoky taste.' },
  { id: 'cfa-nuggets', locationId: 'chick-fil-a', name: 'Chick-fil-A Nuggets', price: 6.59, type: 'fast', periods: LUNCH_DINNER, calories: '250–380 cal', description: 'Bite-sized pieces of tender all-breast chicken, seasoned to perfection and hand-breaded.' },
  { id: 'cfa-grilled-nuggets', locationId: 'chick-fil-a', name: 'Grilled Nuggets', price: 7.39, type: 'fast', periods: LUNCH_DINNER, calories: '130–200 cal', description: 'Bite-sized pieces of freshly marinated boneless chicken breast, grilled for a tender and juicy taste.' },

  // Chick-fil-A — specialty drinks visible in the recordings
  { id: 'cfa-pineapple-dragonfruit-lemonade', locationId: 'chick-fil-a', name: 'Pineapple Dragonfruit Lemonade', price: 4.19, type: 'drink', periods: ALL_DAY, description: 'Chick-fil-A Lemonade mixed with pineapple and dragonfruit flavors.' },
  { id: 'cfa-pineapple-dragonfruit-diet-lemonade', locationId: 'chick-fil-a', name: 'Pineapple Dragonfruit Diet Lemonade', price: 4.19, type: 'drink', periods: ALL_DAY, description: 'Chick-fil-A Diet Lemonade mixed with pineapple and dragonfruit flavors.' },
  { id: 'cfa-pineapple-dragonfruit-iced-tea', locationId: 'chick-fil-a', name: 'Pineapple Dragonfruit Iced Tea', price: 3.69, type: 'drink', periods: ALL_DAY, description: 'Freshly-brewed tea mixed with pineapple and dragonfruit flavors.' },
  { id: 'cfa-pineapple-dragonfruit-sunjoy', locationId: 'chick-fil-a', name: 'Pineapple Dragonfruit Sunjoy', price: 4.19, type: 'drink', periods: ALL_DAY, description: 'Chick-fil-A Lemonade and freshly-brewed Sweetened Iced Tea mixed with pineapple and dragonfruit flavors.' },
  { id: 'cfa-lemonade', locationId: 'chick-fil-a', name: 'Chick-fil-A Lemonade', price: 3.39, type: 'drink', periods: ALL_DAY, calories: '220–300 cal', description: 'Classic lemonade made with real lemon juice, cane sugar and water.' },
  { id: 'cfa-diet-lemonade', locationId: 'chick-fil-a', name: 'Chick-fil-A Diet Lemonade', price: 3.39, type: 'drink', periods: ALL_DAY, calories: '50–80 cal', description: 'Classic diet lemonade made with real lemon juice.' },
  { id: 'cfa-sweet-tea', locationId: 'chick-fil-a', name: 'Freshly-Brewed Sweet Iced Tea', price: 2.89, type: 'drink', periods: ALL_DAY, calories: '120–170 cal', description: 'Freshly-brewed tea sweetened with real cane sugar.' },
  { id: 'cfa-unsweet-tea', locationId: 'chick-fil-a', name: 'Freshly-Brewed Unsweetened Iced Tea', price: 2.89, type: 'drink', periods: ALL_DAY, calories: '0 cal', description: 'Freshly-brewed blend of tea leaves.' },
  { id: 'cfa-half-sweet-half-unsweet', locationId: 'chick-fil-a', name: '1/2 Sweet Tea and 1/2 Unsweetened Tea', price: 2.89, type: 'drink', periods: ALL_DAY, description: 'A blend of Sweet Tea and Unsweetened Tea over ice.' },
  { id: 'cfa-iced-coffee', locationId: 'chick-fil-a', name: 'Iced Coffee', price: 4.69, type: 'drink', periods: ALL_DAY, calories: '110–260 cal', description: 'Cold-brewed coffee with a splash of 2% milk and optional flavors.' },
  { id: 'cfa-cream-cold-brew', locationId: 'chick-fil-a', name: 'Cream Cold Brew', price: 5.29, type: 'drink', periods: ALL_DAY, calories: '370–520 cal', description: 'Chick-fil-A iced coffee with a splash of sweetened cream.' },
  { id: 'cfa-sunjoy', locationId: 'chick-fil-a', name: 'Sunjoy', price: 3.39, type: 'drink', periods: ALL_DAY, calories: '20–260 cal', description: 'Half fresh-brewed iced tea and half Chick-fil-A Lemonade.' },
  { id: 'cfa-toasted-marshmallow-iced-coffee', locationId: 'chick-fil-a', name: 'Toasted Marshmallow Iced Coffee', price: 5.09, type: 'drink', periods: ALL_DAY, calories: '270 cal', description: 'Cold-brewed coffee with 2% milk, sweetened with toasted marshmallow flavor.' },
  { id: 'cfa-toasted-marshmallow-cream-cold-brew', locationId: 'chick-fil-a', name: 'Toasted Marshmallow Cream Cold Brew', price: 5.69, type: 'drink', periods: ALL_DAY, description: 'Cold-brewed coffee mixed with sweet cream blend and toasted marshmallow flavor.' },
  { id: 'cfa-frosted-coffee', locationId: 'chick-fil-a', name: 'Frosted Coffee', price: 5.55, type: 'drink', periods: ALL_DAY, calories: '260–370 cal', description: 'Cold-brewed coffee combined with Chick-fil-A Icedream dessert.' },

  // Brunch — the supplied recording is explicitly the DINNER menu.
  { id: 'brunch-chicken-strips-fries', locationId: 'brunch', name: 'Chicken Strips & Fries', price: 12.45, type: 'fast', periods: DINNER, description: 'Crispy chicken tenders and seasoned fries.' },
  { id: 'brunch-plant-based-chicken-fries', locationId: 'brunch', name: 'Plant Based Chicken & Fries', price: 12.45, type: 'fast', periods: DINNER, description: 'Crispy plant based chicken tenders with seasoned fries.' },
  { id: 'brunch-pm-combo-meal', locationId: 'brunch', name: 'PM Combo Meal', price: 14.25, type: 'fast', periods: DINNER, description: 'Chicken strips, fries and a fountain drink.' },
  { id: 'brunch-pm-vegan-combo-meal', locationId: 'brunch', name: 'PM Vegan Combo Meal', price: 14.25, type: 'fast', periods: DINNER, vegan: true, vegetarian: true, description: 'Plant based chicken strips, fries and a fountain drink.' },
];
