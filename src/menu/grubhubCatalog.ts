export type PickType = 'fast' | 'drink' | 'healthy';
export type PickMealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'all-day';

export interface PickMenuItem {
  id: string;
  restaurantId: string;
  restaurant: string;
  name: string;
  price: number;
  type: PickType;
  mealPeriods: PickMealPeriod[];
  description?: string;
  calories?: number;
  portion?: string;
  vegetarian?: boolean;
  vegan?: boolean;
  solidFood: boolean;
  directionsQuery: string;
  source: 'grubhub-recording';
}

export interface PickRestaurant {
  id: string;
  name: string;
  menuStatus: 'ready' | 'pending';
  picksEnabled: boolean;
  directionsQuery: string;
}

export const PICK_RESTAURANTS: PickRestaurant[] = [
  { id: 'panda-express', name: 'Panda Express', menuStatus: 'ready', picksEnabled: true, directionsQuery: 'Panda Express Cal Poly San Luis Obispo' },
  { id: 'taco-bell', name: 'Taco Bell', menuStatus: 'ready', picksEnabled: true, directionsQuery: 'Taco Bell Cal Poly San Luis Obispo' },
  { id: 'kai-poke', name: 'Kai Poke', menuStatus: 'ready', picksEnabled: true, directionsQuery: 'Kai Poke Cal Poly San Luis Obispo' },
  { id: 'pom-honey', name: 'Pom & Honey', menuStatus: 'ready', picksEnabled: true, directionsQuery: 'Pom and Honey Cal Poly San Luis Obispo' },
  { id: 'poly-choice', name: 'Poly Choice', menuStatus: 'ready', picksEnabled: true, directionsQuery: 'Poly Choice Cal Poly San Luis Obispo' },
  { id: 'shake-smart', name: 'Shake Smart', menuStatus: 'ready', picksEnabled: true, directionsQuery: 'Shake Smart Cal Poly San Luis Obispo' },
  { id: 'chick-fil-a', name: 'Chick-fil-A', menuStatus: 'pending', picksEnabled: false, directionsQuery: 'Chick-fil-A Cal Poly San Luis Obispo' },
  { id: 'brunch', name: 'Brunch', menuStatus: 'pending', picksEnabled: false, directionsQuery: 'Brunch Cal Poly San Luis Obispo' },
];

// First normalized catalog pass from the Grubhub recordings supplied for Picks.
// Additional recorded restaurants/items can be appended without changing the UI
// or ranking engine. Generic bottled/fountain drinks are deliberately omitted.
export const GRUBHUB_PICK_ITEMS: PickMenuItem[] = [
  {
    id: 'panda-plate-orange-teriyaki', restaurantId: 'panda-express', restaurant: 'Panda Express',
    name: 'Orange Chicken + Teriyaki Chicken Plate', price: 11.30, type: 'fast', mealPeriods: ['lunch', 'dinner'],
    description: 'Fried rice, chow mein, Orange Chicken, and Teriyaki Chicken.', solidFood: true,
    directionsQuery: 'Panda Express Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'panda-plate-orange-kung-pao', restaurantId: 'panda-express', restaurant: 'Panda Express',
    name: 'Orange Chicken + Kung Pao Chicken Plate', price: 11.30, type: 'fast', mealPeriods: ['lunch', 'dinner'],
    description: 'Fried rice, chow mein, Orange Chicken, and Kung Pao Chicken.', solidFood: true,
    directionsQuery: 'Panda Express Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'panda-double-teriyaki', restaurantId: 'panda-express', restaurant: 'Panda Express',
    name: 'Double Teriyaki Chicken Plate', price: 11.30, type: 'fast', mealPeriods: ['lunch', 'dinner'],
    description: 'White steamed rice, Super Greens, and double Teriyaki Chicken.', solidFood: true,
    directionsQuery: 'Panda Express Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'taco-crunchwrap', restaurantId: 'taco-bell', restaurant: 'Taco Bell', name: 'Crunchwrap Supreme',
    price: 6.89, type: 'fast', mealPeriods: ['lunch', 'dinner'],
    description: 'Seasoned beef, nacho cheese sauce, crispy tostada shell, lettuce, and more in a warm flour tortilla.', solidFood: true,
    directionsQuery: 'Taco Bell Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'taco-black-bean-crunchwrap', restaurantId: 'taco-bell', restaurant: 'Taco Bell', name: 'Black Bean Crunchwrap Supreme',
    price: 6.39, type: 'healthy', mealPeriods: ['lunch', 'dinner'], vegetarian: true,
    description: 'Black beans, warm nacho cheese sauce, and a crispy tostada shell in a warm flour tortilla.', solidFood: true,
    directionsQuery: 'Taco Bell Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'taco-bean-cheese-burrito', restaurantId: 'taco-bell', restaurant: 'Taco Bell', name: 'Bean and Cheese Burrito',
    price: 2.69, type: 'fast', mealPeriods: ['lunch', 'dinner'], vegetarian: true,
    description: 'Refried beans, red sauce, diced onions, and shredded cheddar cheese.', solidFood: true,
    directionsQuery: 'Taco Bell Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'kai-ahi-bowl', restaurantId: 'kai-poke', restaurant: 'Kai Poke', name: 'Sushi Rice & Ahi Bowl',
    price: 13.95, type: 'healthy', mealPeriods: ['lunch', 'dinner'],
    description: 'Sushi rice, soy-marinated ahi, cucumber, carrot, edamame, and sriracha mayo.', solidFood: true,
    directionsQuery: 'Kai Poke Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'kai-tofu-rice-bowl', restaurantId: 'kai-poke', restaurant: 'Kai Poke', name: 'Brown Rice & Chili Tofu Bowl',
    price: 12.95, type: 'healthy', mealPeriods: ['lunch', 'dinner'], vegetarian: true,
    description: 'Brown rice, chili tofu, edamame, sweet corn, pickled ginger, and sesame dressing.', solidFood: true,
    directionsQuery: 'Kai Poke Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'kai-katsu-bowl', restaurantId: 'kai-poke', restaurant: 'Kai Poke', name: 'Cabbage & Chicken Katsu Bowl',
    price: 13.95, type: 'healthy', mealPeriods: ['lunch', 'dinner'],
    description: 'Napa cabbage, chicken katsu, mango, green onions, cucumber, and tamarind-lime drizzle.', solidFood: true,
    directionsQuery: 'Kai Poke Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'kai-tofu-cabbage-bowl', restaurantId: 'kai-poke', restaurant: 'Kai Poke', name: 'Cabbage & Chili Tofu Bowl',
    price: 12.95, type: 'healthy', mealPeriods: ['lunch', 'dinner'], vegetarian: true,
    description: 'Napa cabbage, chili tofu, green onions, edamame, cucumber, and citrus ponzu.', solidFood: true,
    directionsQuery: 'Kai Poke Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'pom-bowl', restaurantId: 'pom-honey', restaurant: 'Pom & Honey', name: 'Build Your Own Bowl',
    price: 13.50, type: 'healthy', mealPeriods: ['lunch', 'dinner'],
    description: 'Choose a base, one protein, three toppings, and one sauce.', portion: 'Full bowl', solidFood: true,
    directionsQuery: 'Pom and Honey Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'pom-wrap', restaurantId: 'pom-honey', restaurant: 'Pom & Honey', name: 'Build Your Own Wrap',
    price: 13.50, type: 'healthy', mealPeriods: ['lunch', 'dinner'],
    description: 'Gluten-free tortilla, one base, one protein, three toppings, and one sauce.', portion: 'Full wrap', solidFood: true,
    directionsQuery: 'Pom and Honey Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'pom-half-bowl', restaurantId: 'pom-honey', restaurant: 'Pom & Honey', name: 'Half Bowl',
    price: 9.95, type: 'healthy', mealPeriods: ['lunch', 'dinner'],
    description: 'Choose a base, half portion of protein, two toppings, and one sauce.', portion: 'Half bowl', solidFood: true,
    directionsQuery: 'Pom and Honey Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'poly-garden-mac', restaurantId: 'poly-choice', restaurant: 'Poly Choice', name: 'Garden Mac',
    price: 10.95, type: 'healthy', mealPeriods: ['lunch', 'dinner'], vegetarian: true,
    description: 'Macaroni, no-cheese sauce, roasted mushrooms, herbs, tomatoes, roasted broccoli, and sriracha.', solidFood: true,
    directionsQuery: 'Poly Choice Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'poly-garden-salad', restaurantId: 'poly-choice', restaurant: 'Poly Choice', name: 'Garden Salad',
    price: 4.95, type: 'healthy', mealPeriods: ['lunch', 'dinner'], vegetarian: true,
    description: 'Romaine, spinach, cucumber, carrot, tomato, and balsamic vinaigrette.', solidFood: true,
    directionsQuery: 'Poly Choice Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'shake-matcha-mentality', restaurantId: 'shake-smart', restaurant: 'Shake Smart', name: 'Matcha Mentality',
    price: 8.75, type: 'drink', mealPeriods: ['breakfast', 'lunch', 'dinner'],
    description: 'Green tea matcha with vanilla protein.', solidFood: false,
    directionsQuery: 'Shake Smart Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'shake-greens-to-go', restaurantId: 'shake-smart', restaurant: 'Shake Smart', name: 'Greens to Go',
    price: 9.25, type: 'drink', mealPeriods: ['breakfast', 'lunch'],
    description: 'Spinach, banana, pineapple, orange juice, and protein.', solidFood: false,
    directionsQuery: 'Shake Smart Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'shake-fruitopia', restaurantId: 'shake-smart', restaurant: 'Shake Smart', name: 'Fruitopia',
    price: 9.25, type: 'drink', mealPeriods: ['breakfast', 'lunch', 'dinner'],
    description: 'Strawberry, banana, acai, apple juice, and protein.', solidFood: false,
    directionsQuery: 'Shake Smart Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'shake-pink-cadillac', restaurantId: 'shake-smart', restaurant: 'Shake Smart', name: 'Pink Cadillac',
    price: 9.25, type: 'drink', mealPeriods: ['breakfast', 'lunch', 'dinner'],
    description: 'Pitaya, pineapple, orange juice, and vanilla protein.', solidFood: false,
    directionsQuery: 'Shake Smart Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'shake-green-tea-matcha', restaurantId: 'shake-smart', restaurant: 'Shake Smart', name: 'Green Tea Matcha',
    price: 5.75, type: 'drink', mealPeriods: ['breakfast', 'lunch', 'dinner'],
    description: 'Premium matcha with a natural caffeine boost.', solidFood: false,
    directionsQuery: 'Shake Smart Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'shake-salted-pistachio-cold-brew', restaurantId: 'shake-smart', restaurant: 'Shake Smart', name: 'Salted Pistachio Cold Brew',
    price: 6.95, type: 'drink', mealPeriods: ['breakfast', 'lunch'],
    description: 'Cold brew coffee with vanilla whey protein and pistachio crumbles.', solidFood: false,
    directionsQuery: 'Shake Smart Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'shake-rawcai-acai-bowl', restaurantId: 'shake-smart', restaurant: 'Shake Smart', name: 'Rawcai Acai Bowl',
    price: 10.25, type: 'healthy', mealPeriods: ['breakfast', 'lunch'], vegetarian: true,
    description: 'Organic acai, strawberry, granola, banana slices, chia, and coconut.', solidFood: true,
    directionsQuery: 'Shake Smart Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
  {
    id: 'shake-buzz-bowl', restaurantId: 'shake-smart', restaurant: 'Shake Smart', name: 'The Buzz Bowl',
    price: 10.35, type: 'healthy', mealPeriods: ['breakfast', 'lunch'], vegetarian: true,
    description: 'Organic acai, pitaya, pineapple, granola, coconut flakes, and bee pollen.', solidFood: true,
    directionsQuery: 'Shake Smart Cal Poly San Luis Obispo', source: 'grubhub-recording',
  },
];
