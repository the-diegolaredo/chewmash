import type { MealPeriod } from './dineoncampus';

export type PickType = 'fast' | 'drink' | 'healthy';
export type MenuStatus = 'ready' | 'pending';

export interface PickLocation {
  id: string;
  name: string;
  hoursAliases: string[];
  mapQuery: string;
  menuStatus: MenuStatus;
}

export interface RecordedMenuItem {
  id: string;
  locationId: string;
  name: string;
  price: number;
  type: PickType;
  periods: MealPeriod[];
  description?: string;
  calories?: string;
  portion?: string;
  vegan?: boolean;
  vegetarian?: boolean;
  glutenFree?: boolean;
}

export const PICK_LOCATIONS: PickLocation[] = [
  { id: 'panda-express', name: 'Panda Express', hoursAliases: ['Panda Express'], mapQuery: 'Panda Express, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'subway-dexter', name: 'Subway - Dexter Building', hoursAliases: ['Subway - Dexter Building', 'Subway at PCV', 'Subway'], mapQuery: 'Subway, Dexter Building, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'taco-bell', name: 'Taco Bell', hoursAliases: ['Taco Bell'], mapQuery: 'Taco Bell, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'hearth', name: 'Hearth', hoursAliases: ['Hearth'], mapQuery: 'Hearth, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'noodles', name: 'Noodles', hoursAliases: ['Noodles'], mapQuery: 'Noodles, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'starbucks-uu', name: 'Starbucks - UU', hoursAliases: ['Starbucks', 'Starbucks - UU'], mapQuery: 'Starbucks, University Union, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'jamba', name: 'Jamba', hoursAliases: ['Jamba'], mapQuery: 'Jamba, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'sequel-tea', name: 'Sequel Tea', hoursAliases: ['Sequel', 'Sequel Tea'], mapQuery: 'Sequel Tea, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'shake-smart', name: 'Shake Smart', hoursAliases: ['Shake Smart'], mapQuery: 'Shake Smart, Cal Poly Recreation Center, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'red-radish', name: 'Red Radish', hoursAliases: ['Red Radish'], mapQuery: 'Red Radish, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'kai-poke', name: 'Kai Poke', hoursAliases: ['Kai Poke'], mapQuery: 'Kai Poke, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'pom-honey', name: 'Pom & Honey', hoursAliases: ['Pom & Honey'], mapQuery: 'Pom & Honey, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'streats', name: 'Streats', hoursAliases: ['Streats'], mapQuery: 'Streats, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'balance-cafe', name: 'Balance Cafe - Avoiding Allergens', hoursAliases: ['Balance Café', 'Balance Cafe'], mapQuery: 'Balance Cafe, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'einstein', name: 'Einstein Bros. Bagels', hoursAliases: ['Einstein Bros. Bagels', 'Einstein'], mapQuery: 'Einstein Bros. Bagels, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'plant-ivy', name: 'Plant Ivy', hoursAliases: ['Plant Ivy - Lunch', 'Plant Ivy - Dinner', 'Plant Ivy'], mapQuery: 'Plant Ivy, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'grand-avenue-deli', name: 'Grand Avenue Deli', hoursAliases: ['The Deli at Market Grand Ave', 'Grand Avenue Deli'], mapQuery: 'Grand Avenue Deli, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'poly-choice', name: 'Poly Choice', hoursAliases: ['Poly Choice'], mapQuery: 'Poly Choice, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'mingle', name: 'Mingle', hoursAliases: ['Mingle + Nosh', 'Mingle'], mapQuery: 'Mingle, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'julians', name: "Julian's Café", hoursAliases: ["Julian's", "Julian's Library"], mapQuery: "Julian's Cafe, Cal Poly, San Luis Obispo, CA", menuStatus: 'ready' },
  { id: 'scout-coffee', name: 'Scout Coffee', hoursAliases: ['Scout Coffee Co.', 'Scout Coffee'], mapQuery: 'Scout Coffee, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'g-brothers', name: 'G Brothers Taqueria', hoursAliases: ['G. Brothers Taqueria - Lunch', 'G Brothers Taqueria'], mapQuery: 'G Brothers Taqueria, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'jewel-india', name: 'Jewel of India', hoursAliases: ['Jewel of India - Lunch', 'Jewel of India - Dinner', 'Jewel of India'], mapQuery: 'Jewel of India, Cal Poly, San Luis Obispo, CA', menuStatus: 'ready' },
  { id: 'kosher', name: "What's Cookin' Kosher", hoursAliases: ["What's Cookin' Kosher - Lunch", "What's Cookin' Kosher - Dinner", "What's Cookin' Kosher"], mapQuery: "What's Cookin' Kosher, Cal Poly, San Luis Obispo, CA", menuStatus: 'ready' },
  { id: 'chick-fil-a', name: 'Chick-fil-A', hoursAliases: ['Chick-fil-A'], mapQuery: 'Chick-fil-A, Cal Poly, San Luis Obispo, CA', menuStatus: 'pending' },
  { id: 'brunch', name: 'Brunch', hoursAliases: ['Brunch'], mapQuery: 'Brunch, Cal Poly, San Luis Obispo, CA', menuStatus: 'pending' },
];

const ALL_DAY: MealPeriod[] = ['breakfast', 'lunch', 'dinner', 'other'];
const DAYTIME: MealPeriod[] = ['breakfast', 'lunch', 'dinner'];
const LUNCH_DINNER: MealPeriod[] = ['lunch', 'dinner'];

// Prices, labels, calorie ranges, and descriptions below are transcribed from
// the student Grubhub recordings supplied on 2026-09-06. Only details visible
// in those recordings are encoded here. Generic bottled/fountain beverages are
// intentionally omitted from the Picks candidate catalog.
export const RECORDED_MENU_ITEMS: RecordedMenuItem[] = [
  // Fast food — Panda Express
  { id: 'panda-orange-broccoli-plate', locationId: 'panda-express', name: 'Orange Chicken + Broccoli Beef Plate', price: 11.30, type: 'fast', periods: LUNCH_DINNER, description: 'Fried rice, chow mein, Orange Chicken, and Broccoli Beef.' },
  { id: 'panda-orange-kungpao-plate', locationId: 'panda-express', name: 'Orange Chicken + Kung Pao Chicken Plate', price: 11.30, type: 'fast', periods: LUNCH_DINNER, description: 'Fried rice, chow mein, Orange Chicken, and Kung Pao Chicken.' },
  { id: 'panda-orange-teriyaki-plate', locationId: 'panda-express', name: 'Orange Chicken + Teriyaki Chicken Plate', price: 11.30, type: 'fast', periods: LUNCH_DINNER, description: 'Fried rice, chow mein, Orange Chicken, and Teriyaki Chicken.' },
  { id: 'panda-orange-shrimp-plate', locationId: 'panda-express', name: 'Orange Chicken + Honey Walnut Shrimp Plate', price: 12.80, type: 'fast', periods: LUNCH_DINNER, description: 'Fried rice, chow mein, Orange Chicken, and Honey Walnut Shrimp.' },
  { id: 'panda-double-teriyaki-plate', locationId: 'panda-express', name: 'Double Teriyaki Chicken + Super Greens Plate', price: 11.30, type: 'fast', periods: LUNCH_DINNER, description: 'White steamed rice, Super Greens, and Double Teriyaki Chicken.' },

  // Fast food — Subway
  { id: 'subway-sweet-onion-teriyaki-6', locationId: 'subway-dexter', name: '6 in. Sweet Onion Chicken Teriyaki', price: 8.79, type: 'fast', periods: DAYTIME, calories: '430 cal', description: 'Sweet Onion Chicken Teriyaki sandwich.' },
  { id: 'subway-grilled-chicken-6', locationId: 'subway-dexter', name: '6 in. Grilled Chicken', price: 8.59, type: 'fast', periods: DAYTIME, calories: '570 cal', description: 'Grilled chicken sandwich with your favorite toppings.' },
  { id: 'subway-steak-philly-6', locationId: 'subway-dexter', name: '6 in. Steak Philly', price: 8.79, type: 'fast', periods: DAYTIME, calories: '530 cal', description: 'Philly-style steak sandwich.' },
  { id: 'subway-veggie-delite-6', locationId: 'subway-dexter', name: '6 in. Veggie Delite', price: 7.49, type: 'fast', periods: DAYTIME, calories: '320 cal', vegetarian: true, description: 'Crispy, crunchy vegetables on freshly baked bread.' },

  // Fast food — Taco Bell
  { id: 'tb-crunchwrap-supreme', locationId: 'taco-bell', name: 'Crunchwrap Supreme', price: 6.89, type: 'fast', periods: LUNCH_DINNER, description: 'Seasoned beef, warm nacho cheese sauce, crispy tostada shell, lettuce and more in a flour tortilla.' },
  { id: 'tb-black-bean-crunchwrap', locationId: 'taco-bell', name: 'Black Bean Crunchwrap Supreme', price: 6.39, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Slow-simmered black beans, warm nacho cheese sauce and a crispy tostada shell.' },
  { id: 'tb-chicken-quesadilla-combo', locationId: 'taco-bell', name: 'Chicken Quesadilla Combo', price: 10.99, type: 'fast', periods: LUNCH_DINNER },
  { id: 'tb-three-crunchy-supreme', locationId: 'taco-bell', name: '3 Crunchy Taco Supreme Combo', price: 11.49, type: 'fast', periods: LUNCH_DINNER },
  { id: 'tb-black-bean-chalupa', locationId: 'taco-bell', name: 'Black Bean Chalupa Supreme', price: 5.99, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Black beans in a warm-and-flaky flatbread shell with lettuce, diced tomatoes and cheese.' },
  { id: 'tb-veggie-mexican-pizza', locationId: 'taco-bell', name: 'Veggie Mexican Pizza', price: 6.29, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Refried beans layered between two crispy flour tortilla shells.' },

  // Fast food — Hearth
  { id: 'hearth-pepperoni-pizza', locationId: 'hearth', name: 'Artisan Pepperoni Pizza', price: 11.25, type: 'fast', periods: LUNCH_DINNER, description: 'Red sauce, mozzarella, pepperoni and parmesan.' },
  { id: 'hearth-cheese-pizza', locationId: 'hearth', name: 'Artisan Cheese Pizza', price: 10.45, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Red sauce, mozzarella and seasoned parmesan.' },
  { id: 'hearth-vegan-cheese-pizza', locationId: 'hearth', name: 'Vegan Cheese Pizza', price: 10.45, type: 'fast', periods: LUNCH_DINNER, vegan: true, vegetarian: true, description: 'Red sauce, vegan cheese and Italian seasoning.' },
  { id: 'hearth-margherita-pizza', locationId: 'hearth', name: 'Margherita Pizza', price: 10.45, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Red sauce, fresh mozzarella, seasoned parmesan and fresh basil.' },

  // Fast food — Noodles
  { id: 'noodles-parmesan-butter', locationId: 'noodles', name: 'Parmesan Butter Noodles', price: 7.95, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Plain pasta with melted butter and parmesan cheese, served with seasonal vegetables.' },
  { id: 'noodles-pomodoro', locationId: 'noodles', name: 'Pomodoro Pasta', price: 9.95, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Pomodoro sauce over pasta with seasonal vegetables.' },
  { id: 'noodles-chicken-parmesan', locationId: 'noodles', name: 'Chicken Parmesan', price: 12.75, type: 'fast', periods: LUNCH_DINNER, description: 'Breaded chicken topped with mozzarella over pasta with pomodoro sauce.' },
  { id: 'noodles-chicken-alfredo', locationId: 'noodles', name: 'Chicken Alfredo', price: 12.65, type: 'fast', periods: LUNCH_DINNER, description: 'Creamy alfredo sauce over noodles with roasted chicken and shredded parmesan.' },

  // Drinks — Starbucks
  { id: 'starbucks-iced-latte', locationId: 'starbucks-uu', name: 'Iced Caffè Latte', price: 5.65, type: 'drink', periods: ALL_DAY, calories: '100–180 cal', description: 'Espresso combined with milk and served over ice.' },
  { id: 'starbucks-caramel-macchiato', locationId: 'starbucks-uu', name: 'Iced Caramel Macchiato', price: 6.75, type: 'drink', periods: ALL_DAY, calories: '180–350 cal', description: 'Espresso, vanilla-flavored syrup, milk, ice and caramel.' },
  { id: 'starbucks-white-mocha', locationId: 'starbucks-uu', name: 'Iced White Chocolate Mocha', price: 6.65, type: 'drink', periods: ALL_DAY, calories: '330–600 cal', description: 'Espresso, white chocolate sauce, milk and ice with whipped topping.' },
  { id: 'starbucks-cinnamon-dolce', locationId: 'starbucks-uu', name: 'Iced Cinnamon Dolce Latte', price: 6.65, type: 'drink', periods: ALL_DAY, calories: '240–410 cal', description: 'Espresso, milk, cinnamon dolce syrup and ice.' },

  // Drinks — Jamba
  { id: 'jamba-aloha-pineapple', locationId: 'jamba', name: 'Aloha Pineapple', price: 8.49, type: 'drink', periods: ALL_DAY, vegetarian: true, description: 'Pineapple juice, pineapple sherbet, strawberries, bananas and nonfat Greek yogurt.' },
  { id: 'jamba-razzmatazz', locationId: 'jamba', name: 'Razzmatazz', price: 8.49, type: 'drink', periods: ALL_DAY, vegetarian: true, description: 'Mixed berry juice blend, orange sherbet, strawberries and bananas.' },
  { id: 'jamba-apple-greens', locationId: 'jamba', name: "Apple 'n Greens", price: 8.49, type: 'drink', periods: ALL_DAY, vegan: true, vegetarian: true, description: 'Apple-strawberry juice, kale, mangos, bananas and peaches.' },
  { id: 'jamba-strawberry-whirl', locationId: 'jamba', name: 'Strawberry Whirl', price: 8.49, type: 'drink', periods: ALL_DAY, vegan: true, vegetarian: true, description: 'Apple-strawberry juice blend, strawberries and bananas.' },
  { id: 'jamba-orange-c-booster', locationId: 'jamba', name: 'Orange C-Booster', price: 8.49, type: 'drink', periods: ALL_DAY, calories: '240–410 cal', vegetarian: true, description: 'Orange juice, orange sherbet, peaches, bananas, ice, Daily Vitamin and zinc boost.' },
  { id: 'jamba-electric-berry', locationId: 'jamba', name: 'Electric Berry Lemonade', price: 8.49, type: 'drink', periods: ALL_DAY, vegetarian: true, description: 'Lemonade, mixed berry juice blend and blue spirulina.' },

  // Drinks — Sequel Tea
  { id: 'sequel-house-milk-tea', locationId: 'sequel-tea', name: 'House Milk Tea', price: 6.69, type: 'drink', periods: ALL_DAY, description: 'House blend of Assam, Ceylon and hand-rolled Yunnan loose-leaf teas.' },
  { id: 'sequel-jasmine-milk-tea', locationId: 'sequel-tea', name: 'Jasmine King Milk Tea', price: 6.69, type: 'drink', periods: ALL_DAY, description: 'Cold-steeped premium jasmine green tea.' },
  { id: 'sequel-roasted-oolong', locationId: 'sequel-tea', name: 'Roasted Oolong Milk Tea', price: 6.69, type: 'drink', periods: ALL_DAY, description: 'Premium loose-leaf dark roasted oolong.' },
  { id: 'sequel-uji-matcha', locationId: 'sequel-tea', name: 'Uji Matcha Latte', price: 7.59, type: 'drink', periods: ALL_DAY, description: 'Ceremonial grade Uji matcha latte.' },
  { id: 'sequel-strawberry-uji', locationId: 'sequel-tea', name: 'Strawberry Uji Matcha', price: 8.49, type: 'drink', periods: ALL_DAY, description: 'Uji matcha paired with house-made strawberry puree.' },
  { id: 'sequel-mango-black-tea', locationId: 'sequel-tea', name: 'Mango Black Tea', price: 7.59, type: 'drink', periods: ALL_DAY, description: 'Mango nectar layered with house-blend black tea.' },

  // Drinks — Shake Smart
  { id: 'shake-chocolate-frosty', locationId: 'shake-smart', name: 'Chocolate Frosty', price: 7.75, type: 'drink', periods: ALL_DAY },
  { id: 'shake-vanilla-thrilla', locationId: 'shake-smart', name: 'Vanilla Thrilla', price: 7.75, type: 'drink', periods: ALL_DAY },
  { id: 'shake-matcha-mentality', locationId: 'shake-smart', name: 'Matcha Mentality', price: 8.75, type: 'drink', periods: ALL_DAY, description: 'Green tea matcha with vanilla protein.' },
  { id: 'shake-greens-to-go', locationId: 'shake-smart', name: 'Greens to Go', price: 9.25, type: 'drink', periods: ALL_DAY, description: 'Spinach, banana, pineapple, orange juice and protein.' },
  { id: 'shake-cold-brew', locationId: 'shake-smart', name: 'Cold Brew Coffee', price: 4.95, type: 'drink', periods: ALL_DAY, description: 'Cold brew coffee.' },
  { id: 'shake-pistachio-cold-brew', locationId: 'shake-smart', name: 'Salted Pistachio Cold Brew', price: 6.95, type: 'drink', periods: ALL_DAY, description: 'Cold brew coffee, vanilla whey protein and pistachio crumbles.' },
  { id: 'shake-green-tea-matcha', locationId: 'shake-smart', name: 'Green Tea Matcha', price: 5.75, type: 'drink', periods: ALL_DAY, description: '100% premium matcha with a natural caffeine boost.' },

  // Healthy — Red Radish
  { id: 'red-poly-fiesta-salad', locationId: 'red-radish', name: 'Poly Fiesta Salad', price: 10.95, type: 'healthy', periods: LUNCH_DINNER, description: 'Romaine, red cabbage, black beans, red onion, sweet corn, cheddar cheese, tortilla strips and chipotle ranch.' },
  { id: 'red-bbq-chicken-salad', locationId: 'red-radish', name: 'BBQ Chicken Chopped Salad', price: 11.95, type: 'healthy', periods: LUNCH_DINNER, calories: '538 cal', description: 'Romaine, carrots, cabbage, cilantro, red onion, tomato, corn and crispy chicken with BBQ sauce.' },
  { id: 'red-italian-grain-salad', locationId: 'red-radish', name: 'Italian Grain Salad', price: 12.95, type: 'healthy', periods: LUNCH_DINNER, calories: '308 cal', description: 'Spring mix, quinoa, sweet corn, cucumber, grape tomatoes, scallions, pepperoncini and artichoke hearts.' },
  { id: 'red-greek-salad', locationId: 'red-radish', name: 'Greek Salad', price: 10.95, type: 'healthy', periods: LUNCH_DINNER, calories: '253 cal', description: 'Spring mix, spinach, cucumbers, feta, red peppers, cherry tomatoes, red onion and Kalamata olives.' },
  { id: 'red-greek-wrap', locationId: 'red-radish', name: 'Greek Wrap', price: 10.45, type: 'healthy', periods: LUNCH_DINNER, calories: '253 cal', description: 'Greek salad ingredients served as a wrap.' },

  // Healthy — Kai Poke
  { id: 'kai-ahi-sushi-bowl', locationId: 'kai-poke', name: 'Sushi Rice & Ahi Bowl', price: 13.95, type: 'healthy', periods: LUNCH_DINNER, description: 'Seasoned sushi rice, soy-marinated ahi, diced cucumber, shredded carrot, edamame and sriracha mayo.' },
  { id: 'kai-tofu-brown-rice', locationId: 'kai-poke', name: 'Brown Rice & Chili Tofu Bowl', price: 12.95, type: 'healthy', periods: LUNCH_DINNER, vegan: true, vegetarian: true, description: 'Steamed brown rice, chili tofu, edamame, sweet corn, pickled ginger and sesame dressing.' },
  { id: 'kai-katsu-cabbage', locationId: 'kai-poke', name: 'Cabbage & Chicken Katsu Bowl', price: 13.95, type: 'healthy', periods: LUNCH_DINNER, description: 'Shredded napa cabbage, chicken katsu, diced mango, green onions, sweet cucumber and tamarind-lime drizzle.' },
  { id: 'kai-tofu-cabbage', locationId: 'kai-poke', name: 'Cabbage & Chili Tofu Bowl', price: 12.95, type: 'healthy', periods: LUNCH_DINNER, vegan: true, vegetarian: true, description: 'Shredded napa cabbage, chili tofu, green onions, edamame, diced cucumber and citrus ponzu.' },
  { id: 'kai-pork-brown-rice', locationId: 'kai-poke', name: 'Brown Rice & Pork Bowl', price: 13.95, type: 'healthy', periods: LUNCH_DINNER, description: 'Brown rice, teriyaki pork, green onions, shredded carrot, diced cucumber and Thai chili sauce.' },
  { id: 'kai-spicy-ahi-sushi', locationId: 'kai-poke', name: 'Sushi Rice & Spicy Ahi Bowl', price: 13.95, type: 'healthy', periods: LUNCH_DINNER, description: 'Seasoned sushi rice, spicy ahi, shaved jalapeño, daikon radish slaw, diced mango and sambal.' },

  // Healthy — Pom & Honey
  { id: 'pom-byo-bowl', locationId: 'pom-honey', name: 'Build Your Own Bowl', price: 13.50, type: 'healthy', periods: LUNCH_DINNER, description: 'Choose 1 base, 1 protein, 3 toppings and 1 sauce.' },
  { id: 'pom-byo-wrap', locationId: 'pom-honey', name: 'Build Your Own Wrap', price: 13.50, type: 'healthy', periods: LUNCH_DINNER, glutenFree: true, description: 'Gluten-free tortilla, 1 base, 1 protein, 3 toppings and 1 sauce.' },
  { id: 'pom-half-bowl', locationId: 'pom-honey', name: 'Half Bowl', price: 9.95, type: 'healthy', periods: LUNCH_DINNER, description: 'Choose your base, half portion of protein, 2 toppings and 1 sauce.' },
  { id: 'pom-basic-wrap', locationId: 'pom-honey', name: 'Basic Wrap', price: 9.95, type: 'healthy', periods: LUNCH_DINNER, glutenFree: true, description: 'Gluten-free wrap with your choice of protein, 2 toppings and 1 sauce.' },

  // Healthy — Streats
  { id: 'streats-protein-bowl', locationId: 'streats', name: 'Streats Protein Bowl', price: 9.25, type: 'healthy', periods: LUNCH_DINNER, description: 'Fajita-spiced chicken, Spanish rice, corn-black bean salsa, shredded lettuce, fajita veggies and guacamole.' },
  { id: 'streats-vegan-southwest', locationId: 'streats', name: 'Vegan Southwest Salad', price: 8.95, type: 'healthy', periods: LUNCH_DINNER, vegan: true, vegetarian: true, description: 'Chopped romaine with soyrizo chickpea tinga, roasted red peppers, corn and black beans.' },
  { id: 'streats-southwest-chicken', locationId: 'streats', name: 'Southwest Chicken Salad', price: 11.25, type: 'healthy', periods: LUNCH_DINNER, description: 'Chopped romaine with fajita chicken, roasted red peppers, corn and black beans.' },
  { id: 'streats-veggie-burrito', locationId: 'streats', name: 'Veggie Burrito', price: 9.25, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Soyrizo chickpea tinga, cilantro brown rice, pinto beans, onions, cilantro, pico de gallo and guacamole.' },

  // Healthy — Balance Cafe
  { id: 'balance-mushroom-egg-roll-bowl', locationId: 'balance-cafe', name: 'Mushroom Egg Roll Bowl', price: 12.65, type: 'healthy', periods: LUNCH_DINNER, description: 'Shiitake mushrooms, carrots and cabbage with braised baby bok choy, basmati rice, spicy aioli and ginger scallion oil.' },
  { id: 'balance-chicken-tortilla-soup', locationId: 'balance-cafe', name: 'Chicken Tortilla Soup', price: 7.75, type: 'healthy', periods: LUNCH_DINNER, description: 'Chicken tortilla soup with chilies, lime, vegetables and black beans.' },
  { id: 'balance-grilled-chicken', locationId: 'balance-cafe', name: 'Grilled Chicken Breast', price: 5.25, type: 'healthy', periods: LUNCH_DINNER },
  { id: 'balance-roasted-cauliflower', locationId: 'balance-cafe', name: 'Roasted Cauliflower', price: 4.15, type: 'healthy', periods: LUNCH_DINNER, vegan: true, vegetarian: true },

  // Healthy — Einstein Bros. Bagels
  { id: 'einstein-avocado-veg-out', locationId: 'einstein', name: 'Avocado Veg Out Sandwich', price: 8.59, type: 'healthy', periods: DAYTIME, vegetarian: true, description: 'Avocado, spinach, cucumbers, lettuce, tomato, onion and garden veggie shmear.' },
  { id: 'einstein-garden-avocado-egg', locationId: 'einstein', name: 'Garden Avocado Egg Sandwich', price: 9.39, type: 'healthy', periods: ['breakfast', 'lunch'], vegetarian: true, description: 'Cage-free eggs with smashed avocado, tomato, spinach and roasted tomato spread.' },
  { id: 'einstein-avocado-toast', locationId: 'einstein', name: 'Avocado Toast', price: 5.49, type: 'healthy', periods: ['breakfast', 'lunch'], vegan: true, vegetarian: true, description: 'Bagel with avocado, salt and pepper.' },
  { id: 'einstein-turkey-bacon-avocado', locationId: 'einstein', name: 'Turkey, Bacon & Avocado Sandwich', price: 9.79, type: 'healthy', periods: ['lunch'], description: 'Turkey, bacon, avocado, lettuce, tomato and roasted tomato spread on a bagel.' },

  // Healthy — Plant Ivy
  { id: 'plant-buddha-bowl', locationId: 'plant-ivy', name: 'Buddha Bowl', price: 11.99, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Brown rice, black bean medley, marinated kale, tomatoes and mixed vegetables.' },
  { id: 'plant-seasonal-chili', locationId: 'plant-ivy', name: 'Seasonal Chili', price: 7.99, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'House-made slow-simmered seasonal chili.' },
  { id: 'plant-caesar-wrap', locationId: 'plant-ivy', name: "Caesar Impossible Chk'n Wrap", price: 13.99, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Caesar chicken-style wrap made with Impossible chicken.' },
  { id: 'plant-summer-rolls', locationId: 'plant-ivy', name: 'Fresh Summer Rolls', price: 13.99, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Rice paper wraps filled with marinated tofu and crisp vegetables.' },
  { id: 'plant-breakfast-burrito', locationId: 'plant-ivy', name: 'Breakfast Burrito', price: 13.99, type: 'healthy', periods: ['breakfast'], vegetarian: true, description: 'Impossible sausage, roasted potatoes, egg, grilled vegetables, onion and avocado.' },

  // Healthy — Grand Avenue Deli / Poly Choice / Mingle
  { id: 'deli-vegetarian-breakfast-burrito', locationId: 'grand-avenue-deli', name: 'Vegetarian Breakfast Burrito', price: 7.75, type: 'healthy', periods: ['breakfast'], vegetarian: true, description: 'Cage-free scrambled eggs, potatoes, onions, peppers and mozzarella in a flour tortilla.' },
  { id: 'deli-half-margherita', locationId: 'grand-avenue-deli', name: '1/2 Margherita Fresca', price: 7.95, type: 'healthy', periods: ['lunch'], vegetarian: true, description: 'Provolone and cheddar, tomatoes, pesto mayo, arugula, red onions, olive oil and balsamic glaze on ciabatta.' },
  { id: 'poly-garden-salad', locationId: 'poly-choice', name: 'Garden Salad', price: 4.95, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Romaine, spinach, cucumber, carrot and tomato with balsamic vinaigrette.' },
  { id: 'poly-garden-mac', locationId: 'poly-choice', name: 'Garden Mac', price: 10.95, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Macaroni, no-cheese sauce, roasted mushrooms, fresh herbs, diced tomatoes and roasted broccoli.' },
  { id: 'mingle-vegan-grilled-cheese', locationId: 'mingle', name: 'Vegan Grilled Cheese', price: 8.45, type: 'healthy', periods: LUNCH_DINNER, vegan: true, vegetarian: true, description: 'Grilled sourdough with plant-based smoked gouda and American cheeses.' },
];

export const LOCATION_BY_ID = new Map(PICK_LOCATIONS.map(location => [location.id, location]));

export function locationForItem(item: RecordedMenuItem): PickLocation {
  const location = LOCATION_BY_ID.get(item.locationId);
  if (!location) throw new Error(`Unknown Picks location: ${item.locationId}`);
  return location;
}
