import type { MealPeriod } from './dineoncampus';
import type { RecordedMenuItem } from './grubhub';

const ALL_DAY: MealPeriod[] = ['breakfast', 'lunch', 'dinner', 'other'];
const DAYTIME: MealPeriod[] = ['breakfast', 'lunch', 'dinner'];
const BREAKFAST_LUNCH: MealPeriod[] = ['breakfast', 'lunch'];
const LUNCH_DINNER: MealPeriod[] = ['lunch', 'dinner'];

// Second catalog pass from the remaining student Grubhub recordings supplied
// on 2026-09-06. Prices/details are included only when they were legible in the
// recordings. Generic bottled drinks, water bottles, fountain drinks, energy
// drinks, sides, sauces, and desserts are intentionally excluded from Picks.
export const RECORDED_MENU_SUPPLEMENT: RecordedMenuItem[] = [
  // Grand Avenue Deli
  { id: 'deli-ham-egg-cheese-croissant', locationId: 'grand-avenue-deli', name: 'Ham, Egg & Cheese Croissant', price: 7.95, type: 'fast', periods: ['breakfast'], description: 'Croissant sandwich with ham, cage-free egg and cheddar cheese.' },
  { id: 'deli-bacon-egg-cheese-biscuit', locationId: 'grand-avenue-deli', name: 'Bacon, Egg & Cheese Biscuit', price: 7.95, type: 'fast', periods: ['breakfast'], description: 'Bacon, cage-free egg and cheddar cheese on a buttermilk biscuit.' },
  { id: 'deli-sausage-egg-cheese-muffin', locationId: 'grand-avenue-deli', name: 'Sausage, Egg & Cheese English Muffin', price: 7.95, type: 'fast', periods: ['breakfast'], description: 'Sausage, cage-free egg and cheddar cheese on an English muffin.' },
  { id: 'deli-sausage-breakfast-burrito', locationId: 'grand-avenue-deli', name: 'Sausage Breakfast Burrito', price: 7.95, type: 'fast', periods: ['breakfast'], description: 'Cage-free scrambled eggs, sausage, potatoes, onions, peppers and mozzarella in a flour tortilla.' },
  { id: 'deli-brat', locationId: 'grand-avenue-deli', name: 'The BRAT', price: 14.55, type: 'fast', periods: ['lunch'], calories: '571 cal', description: 'Bacon, ranch, avocado, tomato, arugula and lemon pepper mayo on toasted sourdough.' },
  { id: 'deli-half-brat', locationId: 'grand-avenue-deli', name: '1/2 The BRAT', price: 8.95, type: 'fast', periods: ['lunch'], calories: '571 cal', description: 'Half portion of The BRAT on toasted sourdough.' },
  { id: 'deli-cal-poly-club', locationId: 'grand-avenue-deli', name: 'Cal Poly Club', price: 14.75, type: 'fast', periods: ['lunch'], calories: '776 cal', description: 'Smoked turkey, hickory smoked ham, cheddar, avocado, lettuce, tomatoes and lemon pepper mayo on sourdough.' },
  { id: 'deli-half-cal-poly-club', locationId: 'grand-avenue-deli', name: '1/2 Cal Poly Club', price: 8.95, type: 'fast', periods: ['lunch'], description: 'Half Cal Poly Club on thick-sliced sourdough.' },
  { id: 'deli-southwestern-turkey', locationId: 'grand-avenue-deli', name: 'Southwestern Turkey', price: 14.95, type: 'fast', periods: ['lunch'], calories: '650 cal', description: 'Smoked turkey, pepperjack, roasted red peppers, lettuce, red onion and garlic chipotle ranch on ciabatta.' },
  { id: 'deli-half-southwestern-turkey', locationId: 'grand-avenue-deli', name: '1/2 Southwestern Turkey', price: 8.95, type: 'fast', periods: ['lunch'], description: 'Half Southwestern Turkey sandwich on ciabatta.' },
  { id: 'deli-margherita-fresca', locationId: 'grand-avenue-deli', name: 'Margherita Fresca', price: 12.65, type: 'healthy', periods: ['lunch'], vegetarian: true, calories: '851 cal', description: 'Provolone and cheddar, tomatoes, pesto mayo, arugula, red onions, olive oil and balsamic glaze on ciabatta.' },

  // Red Radish
  { id: 'red-poly-fiesta-wrap', locationId: 'red-radish', name: 'Poly Fiesta Wrap', price: 10.95, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Romaine, red cabbage, black beans, red onion, sweet corn, cheddar, tortilla strips and chipotle ranch in a flour tortilla.' },
  { id: 'red-bbq-chicken-wrap', locationId: 'red-radish', name: 'BBQ Chicken Chopped Wrap', price: 11.95, type: 'healthy', periods: LUNCH_DINNER, calories: '538 cal', description: 'Romaine, carrots, cabbage, cilantro, red onion, tomato, corn and crispy chicken with tangy BBQ sauce.' },
  { id: 'red-kale-sweet-potato-wrap', locationId: 'red-radish', name: 'Kale & Sweet Potato Wrap', price: 10.95, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, calories: '742 cal', description: 'Roasted sweet potatoes, kale, garbanzo beans, feta, quinoa, parsley, sesame seeds and tahini.' },
  { id: 'red-italian-grain-wrap', locationId: 'red-radish', name: 'Italian Grain Wrap', price: 12.10, type: 'healthy', periods: LUNCH_DINNER, calories: '308 cal', description: 'Spring mix, quinoa, sweet corn, cucumber, grape tomatoes, scallions, pepperoncini and artichoke hearts.' },
  { id: 'red-cobb-wrap', locationId: 'red-radish', name: 'Poly Chopped Cobb Wrap', price: 12.95, type: 'healthy', periods: LUNCH_DINNER, calories: '346 cal', description: 'Romaine, avocado, tomato, eggs, blue cheese, onions, bacon and crispy chicken with buttermilk ranch.' },
  { id: 'red-greek-wrap-full', locationId: 'red-radish', name: 'Greek Wrap', price: 10.45, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, calories: '253 cal', description: 'Spring mix, spinach, cucumbers, feta, red peppers, cherry tomatoes, red onion and Kalamata olives.' },

  // Kai Poke
  { id: 'kai-wonton-ahi', locationId: 'kai-poke', name: 'Wonton Nachos & Ahi Bowl', price: 14.95, type: 'healthy', periods: LUNCH_DINNER, description: 'Wonton chips, soy-marinated ahi, shaved jalapeño, spicy cabbage slaw, diced cucumber and sriracha mayo.' },
  { id: 'kai-wonton-tofu', locationId: 'kai-poke', name: 'Wonton Nachos & Chili Tofu Bowl', price: 14.95, type: 'healthy', periods: LUNCH_DINNER, vegan: true, vegetarian: true, description: 'Wonton chips, chili tofu, sweet corn, green onions, tropical fruit and sesame dressing.' },

  // Poly Choice
  { id: 'poly-byo-full-mac', locationId: 'poly-choice', name: 'Build Your Own Mac — Full Bowl', price: 13.95, type: 'fast', periods: LUNCH_DINNER, portion: '32 oz full bowl', description: 'Build-your-own macaroni and cheese bowl.' },
  { id: 'poly-byo-half-mac', locationId: 'poly-choice', name: 'Build Your Own Mac — Half Bowl', price: 9.95, type: 'fast', periods: LUNCH_DINNER, portion: '24 oz half bowl', description: 'Smaller build-your-own macaroni and cheese bowl.' },
  { id: 'poly-1901-mac', locationId: 'poly-choice', name: '1901 Mac', price: 10.95, type: 'fast', periods: LUNCH_DINNER, description: 'Macaroni with cheddar cheese sauce, halal chicken, crushed hot Cheetos, green onions and shredded cheddar.' },
  { id: 'poly-nacho-mac', locationId: 'poly-choice', name: 'Nacho Mac', price: 12.95, type: 'fast', periods: LUNCH_DINNER, description: 'Rigatoni, spicy nacho sauce, carne asada, crushed hot Cheetos, green onions and sour cream.' },
  { id: 'poly-buffalo-mac', locationId: 'poly-choice', name: 'Buffalo Mac', price: 10.95, type: 'fast', periods: LUNCH_DINNER, description: 'Rigatoni, cheddar cheese sauce, halal chicken, blue cheese crumbles, crispy onions and buffalo sauce.' },
  { id: 'poly-bbq-mac', locationId: 'poly-choice', name: 'BBQ Mac', price: 11.95, type: 'fast', periods: LUNCH_DINNER, description: 'Macaroni, cheddar cheese sauce, BBQ pulled pork, crispy onions, shredded cheddar and apricot BBQ sauce.' },
  { id: 'poly-italian-mac', locationId: 'poly-choice', name: 'Italian Mac', price: 12.95, type: 'fast', periods: LUNCH_DINNER, description: 'Rigatoni, pesto parmesan sauce, halal chicken, roasted broccoli, fresh herbs and roasted bell peppers.' },

  // Streats
  { id: 'streats-burrito', locationId: 'streats', name: 'Streats Burrito', price: 10.25, type: 'fast', periods: LUNCH_DINNER, description: 'Fajita chicken, Spanish rice, pinto beans, onions, cilantro, salsa, guacamole and shredded cheese.' },
  { id: 'streats-cali-burrito', locationId: 'streats', name: 'Cali Burrito', price: 10.95, type: 'fast', periods: LUNCH_DINNER, description: 'Carne asada, french fries, salsa roja, sour cream, guacamole and shredded cheese.' },
  { id: 'streats-brc-burrito', locationId: 'streats', name: 'BRC Burrito', price: 7.95, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Beans, rice and cheese in a flour tortilla.' },

  // Hearth
  { id: 'hearth-spicy-hawaiian', locationId: 'hearth', name: 'Spicy Hawaiian Pizza', price: 11.25, type: 'fast', periods: LUNCH_DINNER, description: 'Red sauce, ham, pineapple, jalapeños and mozzarella.' },
  { id: 'hearth-chicken-alfredo', locationId: 'hearth', name: 'Chicken Alfredo Pizza', price: 11.25, type: 'fast', periods: LUNCH_DINNER, description: 'Grilled halal chicken, garlic cream sauce, mozzarella and spinach.' },
  { id: 'hearth-chicken-bacon-ranch', locationId: 'hearth', name: 'Chicken Bacon Ranch Pizza', price: 11.25, type: 'fast', periods: LUNCH_DINNER, description: 'Ranch sauce, diced halal chicken, mozzarella, bacon bits and cheddar.' },
  { id: 'hearth-cheesy-flatbread', locationId: 'hearth', name: 'Cheesy Flat Bread', price: 9.45, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Oven-baked flatbread with roasted garlic oil, mozzarella and parmesan.' },
  { id: 'hearth-slice-salad-combo', locationId: 'hearth', name: 'Pizza Slice & Caesar Salad Combo', price: 8.95, type: 'healthy', periods: LUNCH_DINNER, description: 'One pan pizza slice and a small Caesar salad.' },
  { id: 'hearth-panzanella', locationId: 'hearth', name: 'Panzanella Salad', price: 6.35, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Classic Italian bread salad with tomatoes, basil and olive vinaigrette.' },
  { id: 'hearth-caesar-salad', locationId: 'hearth', name: 'Caesar Salad', price: 7.95, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Entree-size romaine salad with garlic croutons, parmesan and Caesar dressing.' },

  // Noodles
  { id: 'noodles-whole-wheat-pesto', locationId: 'noodles', name: 'Whole Wheat Pesto Pasta', price: 10.95, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Whole wheat penne with pesto, parmesan, spinach and tomato.' },
  { id: 'noodles-half-pomodoro', locationId: 'noodles', name: 'Half Order Pomodoro Pasta', price: 8.95, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Pomodoro sauce over pasta with seasonal vegetables.' },
  { id: 'noodles-italian-sausage', locationId: 'noodles', name: 'Italian Sausage & Peppers', price: 12.50, type: 'fast', periods: LUNCH_DINNER, description: 'Italian sausage and peppers in pomodoro sauce over pasta with seasonal vegetables.' },
  { id: 'noodles-small-sausage', locationId: 'noodles', name: 'Small Italian Sausage & Peppers', price: 9.95, type: 'fast', periods: LUNCH_DINNER, description: 'Smaller Italian sausage and peppers pasta.' },
  { id: 'noodles-small-alfredo', locationId: 'noodles', name: 'Small Chicken Alfredo', price: 8.95, type: 'fast', periods: LUNCH_DINNER, description: 'Creamy alfredo noodles with roasted halal chicken and shredded parmesan.' },
  { id: 'noodles-shrimp-fra-diavolo', locationId: 'noodles', name: 'Shrimp Fra Diavolo', price: 13.25, type: 'fast', periods: LUNCH_DINNER, description: 'Noodles with spicy pomodoro sauce and sauteed shrimp, topped with herbs and parmesan.' },
  { id: 'noodles-small-shrimp-fra-diavolo', locationId: 'noodles', name: 'Small Shrimp Fra Diavolo', price: 10.95, type: 'fast', periods: LUNCH_DINNER, description: 'Smaller order of Shrimp Fra Diavolo.' },
  { id: 'noodles-combo-parmesan', locationId: 'noodles', name: 'Parmesan Butter Noodles Combo', price: 11.75, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Parmesan Butter Noodles with seasonal vegetables, garlic bread and a drink.' },

  // Balance Cafe — Avoiding Allergens
  { id: 'balance-pork-egg-roll-bowl', locationId: 'balance-cafe', name: 'Pork Egg Roll Bowl', price: 12.65, type: 'healthy', periods: LUNCH_DINNER, description: 'Ground pork with carrots and cabbage, braised baby bok choy, basmati rice, spicy aioli and ginger scallion oil.' },
  { id: 'balance-blta', locationId: 'balance-cafe', name: 'BLTA', price: 12.95, type: 'healthy', periods: LUNCH_DINNER, description: 'Bacon, lettuce, tomato and avocado with roasted garlic aioli on allergen-free toasted millet and chia seed bread.' },

  // Mingle
  { id: 'mingle-ham-cheese-melt', locationId: 'mingle', name: 'Ham & Cheese Melt', price: 11.95, type: 'fast', periods: LUNCH_DINNER, description: 'Sliced ham, cheddar cheese and Dijon aioli on ciabatta with chips.' },
  { id: 'mingle-classic-grilled-cheese', locationId: 'mingle', name: 'Classic Grilled Cheese', price: 8.50, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Grilled sourdough with cheddar cheese.' },
  { id: 'mingle-buffalo-chicken-melt', locationId: 'mingle', name: 'Buffalo Chicken Melt', price: 11.95, type: 'fast', periods: LUNCH_DINNER, description: 'Mozzarella, scallions, buffalo ranch sauce and grilled chicken on ciabatta.' },

  // Jamba
  { id: 'jamba-orange-dream-machine', locationId: 'jamba', name: 'Orange Dream Machine', price: 8.49, type: 'drink', periods: ALL_DAY, vegetarian: true, description: 'Orange juice, orange sherbet, soymilk and fat-free vanilla frozen yogurt.' },
  { id: 'jamba-strawberry-surf-rider', locationId: 'jamba', name: 'Strawberry Surf Rider', price: 8.49, type: 'drink', periods: ALL_DAY, vegetarian: true, description: 'Lemonade, lime sherbet, strawberries and peaches.' },
  { id: 'jamba-caribbean-passion', locationId: 'jamba', name: 'Caribbean Passion', price: 8.49, type: 'drink', periods: ALL_DAY, vegetarian: true, description: 'Passion fruit-mango juice blend, orange sherbet, strawberries and peaches.' },
  { id: 'jamba-peanut-butter-mood', locationId: 'jamba', name: "Peanut Butter Moo'd", price: 8.49, type: 'drink', periods: ALL_DAY, vegetarian: true, description: 'Chocolate moo’d dairy base, soymilk, bananas and peanut butter.' },
  { id: 'jamba-acai-antioxidant', locationId: 'jamba', name: 'Acai Super-Antioxidant', price: 8.49, type: 'drink', periods: ALL_DAY, vegetarian: true, description: 'Soymilk, acai blend, strawberries, blueberries, raspberry sherbet and vitamin/zinc boost.' },
  { id: 'jamba-protein-berry-workout', locationId: 'jamba', name: 'Protein Berry Workout', price: 8.49, type: 'drink', periods: ALL_DAY, vegetarian: true, description: 'Soymilk, strawberries, bananas and protein.' },
  { id: 'jamba-mega-mango', locationId: 'jamba', name: 'Mega Mango', price: 8.49, type: 'drink', periods: ALL_DAY, vegan: true, vegetarian: true, description: 'Orange juice, pineapple juice blend, mangos and strawberries.' },
  { id: 'jamba-buzzin-mocha-mood', locationId: 'jamba', name: "Buzzin' Mocha Moo'd", price: 8.49, type: 'drink', periods: ALL_DAY, description: 'Rich chocolate and coffee blend.' },
  { id: 'jamba-coffee-dream-machine', locationId: 'jamba', name: 'Coffee Dream Machine', price: 8.49, type: 'drink', periods: ALL_DAY, description: 'Creamy coffee blend with vanilla flavor.' },
  { id: 'jamba-mango-sunshine-bowl', locationId: 'jamba', name: 'Mango Sunshine Smoothie Bowl', price: 11.49, type: 'healthy', periods: DAYTIME, vegetarian: true, description: 'Mango blend topped with banana, strawberry, granola, blueberry and honey.' },
  { id: 'jamba-strawberry-blueberry-waffle', locationId: 'jamba', name: 'Strawberry Blueberry Greek Yogurt Waffle Bowl', price: 11.49, type: 'healthy', periods: DAYTIME, vegetarian: true, description: 'Waffle bowl with Greek yogurt, strawberry, blueberry and granola.' },

  // Einstein Bros. Bagels
  { id: 'einstein-bacon-cheddar-egg', locationId: 'einstein', name: 'Bacon & Cheddar Egg Sandwich', price: 6.99, type: 'fast', periods: ['breakfast'], calories: '510–600 cal', description: 'Cage-free eggs with bacon and cheddar on a fresh-baked bagel.' },
  { id: 'einstein-ham-swiss-egg', locationId: 'einstein', name: 'Ham & Swiss Egg Sandwich', price: 6.99, type: 'fast', periods: ['breakfast'], calories: '460–550 cal', description: 'Cage-free eggs with ham and Swiss cheese on a fresh-baked bagel.' },
  { id: 'einstein-cheddar-egg', locationId: 'einstein', name: 'Cheddar Cheese Egg Sandwich', price: 6.39, type: 'fast', periods: ['breakfast'], calories: '430–520 cal', vegetarian: true, description: 'Toasted bagel with egg and cheddar cheese.' },
  { id: 'einstein-ham-swiss-lunch', locationId: 'einstein', name: 'Ham & Swiss Sandwich', price: 9.49, type: 'fast', periods: ['lunch'], description: 'Ham, Swiss cheese, lettuce, tomatoes, red onions and mayo on a fresh-baked plain bagel.' },
  { id: 'einstein-tasty-turkey', locationId: 'einstein', name: 'Tasty Turkey Sandwich', price: 9.99, type: 'healthy', periods: ['lunch'], calories: '500 cal', description: 'Turkey, onion & chive shmear, spinach, cucumbers, lettuce and tomato on a bagel.' },
  { id: 'einstein-turkey-cheddar', locationId: 'einstein', name: 'Turkey & Cheddar Sandwich', price: 9.49, type: 'healthy', periods: ['lunch'], description: 'Turkey and cheddar with lettuce, tomatoes and red onions on a bagel.' },
  { id: 'einstein-pizza-bagel', locationId: 'einstein', name: 'Pizza Bagel', price: 7.99, type: 'fast', periods: DAYTIME, vegetarian: true, description: 'Pizza bagel with cheese or pepperoni.' },

  // Julian's Café — 1901 Marketplace
  { id: 'julians-breakfast-bowl', locationId: 'julians', name: 'Build Your Own Breakfast Bowl', price: 8.75, type: 'healthy', periods: ['breakfast'], description: 'Customizable breakfast bowl.' },
  { id: 'julians-summer-garden-bagel', locationId: 'julians', name: 'Summer Garden Bagel', price: 10.95, type: 'healthy', periods: BREAKFAST_LUNCH, vegetarian: true, description: 'Garden vegetable spread with tomato and cucumber-herb mix on a bagel.' },
  { id: 'julians-matcha-lemonade', locationId: 'julians', name: 'Matcha Lemonade', price: 6.75, type: 'drink', periods: ALL_DAY, description: 'Matcha lemonade.' },
  { id: 'julians-iced-americano', locationId: 'julians', name: 'Iced Americano', price: 4.75, type: 'drink', periods: ALL_DAY, description: 'Espresso and cold water over ice.' },
  { id: 'julians-iced-white-mocha', locationId: 'julians', name: 'Iced White Mocha', price: 6.75, type: 'drink', periods: ALL_DAY },
  { id: 'julians-cold-brew', locationId: 'julians', name: 'Cold Brew Iced Coffee', price: 5.15, type: 'drink', periods: ALL_DAY, description: '16 oz cold brew concentrated coffee and water.' },
  { id: 'julians-iced-matcha-latte', locationId: 'julians', name: 'Iced Matcha Green Tea Latte', price: 6.15, type: 'drink', periods: ALL_DAY, description: 'Pure matcha powder steamed with whole milk and vanilla syrup.' },
  { id: 'julians-fruit-smoothie', locationId: 'julians', name: '100% Fruit Smoothie', price: 6.85, type: 'drink', periods: ALL_DAY, description: '16 oz fruit puree and water smoothie.' },

  // Sequel Tea
  { id: 'sequel-thai-cream-top', locationId: 'sequel-tea', name: 'Thai Tea Cream Top', price: 7.69, type: 'drink', periods: ALL_DAY, description: 'Thai tea cream-top drink.' },
  { id: 'sequel-jasmine-guava', locationId: 'sequel-tea', name: 'Jasmine Guava', price: 7.59, type: 'drink', periods: ALL_DAY, description: 'Premium jasmine green tea with guava.' },
  { id: 'sequel-strawberry-white-peach', locationId: 'sequel-tea', name: 'Strawberry White Peach', price: 7.59, type: 'drink', periods: ALL_DAY, description: 'White peach tea with strawberry.' },
  { id: 'sequel-mango-white-peach', locationId: 'sequel-tea', name: 'Mango White Peach', price: 7.59, type: 'drink', periods: ALL_DAY, description: 'White peach tea with mango.' },
  { id: 'sequel-strawberry-jasmine', locationId: 'sequel-tea', name: 'Strawberry Jasmine', price: 7.59, type: 'drink', periods: ALL_DAY, description: 'Cold-steeped jasmine tea with strawberry.' },
  { id: 'sequel-banana-toffee-matcha', locationId: 'sequel-tea', name: 'Banana Toffee Matcha Cream Top', price: 8.59, type: 'drink', periods: ALL_DAY, description: 'Uji matcha with banana puree and cream top.' },
  { id: 'sequel-korean-banana-milk', locationId: 'sequel-tea', name: 'Korean Banana Milk', price: 7.59, type: 'drink', periods: ALL_DAY, description: 'Fresh banana milk inspired by Korean boxed banana milk.' },
  { id: 'sequel-strawberries-cream', locationId: 'sequel-tea', name: 'Strawberries & Cream', price: 8.39, type: 'drink', periods: ALL_DAY, description: 'Strawberry milk with house-made strawberry puree and cream top.' },

  // Taco Bell
  { id: 'tb-bean-cheese-burrito', locationId: 'taco-bell', name: 'Bean & Cheese Burrito', price: 2.69, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Refried beans, red sauce, diced onions and shredded cheddar cheese.' },
  { id: 'tb-cheesy-bean-rice-burrito', locationId: 'taco-bell', name: 'Cheesy Bean & Rice Burrito', price: 1.79, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Refried beans, seasoned rice, nacho cheese sauce and creamy jalapeño sauce.' },
  { id: 'tb-beef-burrito-supreme', locationId: 'taco-bell', name: 'Beef Burrito Supreme', price: 6.19, type: 'fast', periods: LUNCH_DINNER, description: 'Seasoned beef, refried beans, tomatoes, onions, lettuce and red sauce.' },
  { id: 'tb-crunchy-taco-supreme', locationId: 'taco-bell', name: 'Crunchy Taco Supreme', price: 3.19, type: 'fast', periods: LUNCH_DINNER, description: 'Crunchy taco shell with seasoned beef, sour cream, lettuce, diced tomatoes and cheese.' },
  { id: 'tb-soft-taco', locationId: 'taco-bell', name: 'Soft Taco', price: 2.19, type: 'fast', periods: LUNCH_DINNER, description: 'Warm flour tortilla with seasoned beef, lettuce and shredded cheddar.' },
  { id: 'tb-soft-taco-supreme', locationId: 'taco-bell', name: 'Soft Taco Supreme', price: 3.19, type: 'fast', periods: LUNCH_DINNER, description: 'Soft taco with seasoned beef, sour cream, lettuce, diced tomatoes and cheese.' },
  { id: 'tb-doritos-locos', locationId: 'taco-bell', name: 'Doritos Locos Taco', price: 3.19, type: 'fast', periods: LUNCH_DINNER, description: 'Nacho Cheese Doritos taco shell with seasoned beef, lettuce and cheese.' },
  { id: 'tb-doritos-locos-supreme', locationId: 'taco-bell', name: 'Doritos Locos Taco Supreme', price: 4.19, type: 'fast', periods: LUNCH_DINNER, description: 'Doritos Locos Taco with sour cream and diced tomatoes.' },
  { id: 'tb-chalupa-supreme', locationId: 'taco-bell', name: 'Chalupa Supreme', price: 5.99, type: 'fast', periods: LUNCH_DINNER, description: 'Seasoned beef, lettuce, diced tomatoes and cheese in a flaky flatbread shell.' },
  { id: 'tb-mexican-pizza', locationId: 'taco-bell', name: 'Mexican Pizza', price: 6.69, type: 'fast', periods: LUNCH_DINNER, description: 'Seasoned beef and refried beans layered between two crispy flour tortilla shells.' },

  // Scout Coffee
  { id: 'scout-coffee', locationId: 'scout-coffee', name: 'Coffee', price: 3.95, type: 'drink', periods: ALL_DAY },
  { id: 'scout-cold-brew', locationId: 'scout-coffee', name: 'Cold Brew', price: 5.95, type: 'drink', periods: ALL_DAY },
  { id: 'scout-california-cold-brew', locationId: 'scout-coffee', name: 'California Cold Brew', price: 6.35, type: 'drink', periods: ALL_DAY },
  { id: 'scout-hibiscus-lemonade', locationId: 'scout-coffee', name: 'Sparkling Hibiscus Lemonade', price: 6.45, type: 'drink', periods: ALL_DAY, portion: '16 oz' },
  { id: 'scout-iced-tea', locationId: 'scout-coffee', name: 'Iced Tea', price: 4.55, type: 'drink', periods: ALL_DAY, portion: '16 oz' },
  { id: 'scout-matcha-lemonade', locationId: 'scout-coffee', name: 'Matcha Lemonade', price: 6.85, type: 'drink', periods: ALL_DAY, portion: '16 oz' },
  { id: 'scout-lemonade', locationId: 'scout-coffee', name: 'Lemonade', price: 5.65, type: 'drink', periods: ALL_DAY, portion: '16 oz' },

  // G Brothers Taqueria
  { id: 'gb-bean-cheese-burrito', locationId: 'g-brothers', name: 'Bean & Cheese Burrito', price: 10.25, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Bean and cheese burrito with rice and salsa.' },
  { id: 'gb-chicken-burrito', locationId: 'g-brothers', name: 'Chicken Burrito', price: 14.25, type: 'fast', periods: LUNCH_DINNER, description: 'Chicken and cheese burrito with rice, beans, pico de gallo and salsa.' },
  { id: 'gb-al-pastor-burrito', locationId: 'g-brothers', name: 'Al Pastor Burrito', price: 14.25, type: 'fast', periods: LUNCH_DINNER, description: 'Al pastor and cheese burrito with rice, beans, pico de gallo and salsa.' },
  { id: 'gb-asada-burrito', locationId: 'g-brothers', name: 'Asada Burrito', price: 14.25, type: 'fast', periods: LUNCH_DINNER, description: 'Asada and cheese burrito with rice, beans, pico de gallo and salsa.' },
  { id: 'gb-veggie-burrito', locationId: 'g-brothers', name: 'Veggie Burrito', price: 10.25, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Beans, rice, cheese, spinach and pico de gallo with salsa.' },
  { id: 'gb-asada-taco', locationId: 'g-brothers', name: 'Asada Taco', price: 4.25, type: 'fast', periods: LUNCH_DINNER, description: 'Corn tortillas, carne asada, cilantro, onion, lemon and salsa.' },
  { id: 'gb-chicken-taco', locationId: 'g-brothers', name: 'Chicken Taco', price: 4.25, type: 'fast', periods: LUNCH_DINNER, description: 'Corn tortillas, chicken, cilantro, onion, lemon and salsa.' },
  { id: 'gb-al-pastor-taco', locationId: 'g-brothers', name: 'Al Pastor Taco', price: 4.25, type: 'fast', periods: LUNCH_DINNER, description: 'Corn tortillas, al pastor, cilantro, onion, lemon and salsa.' },
  { id: 'gb-nacho', locationId: 'g-brothers', name: 'Nachos', price: 9.25, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Tortilla chips with nacho cheese.' },
  { id: 'gb-nacho-supreme', locationId: 'g-brothers', name: 'Nacho Supreme', price: 14.25, type: 'fast', periods: LUNCH_DINNER, description: 'Nacho cheese, pico de gallo, guacamole and choice of meat over tortilla chips.' },
  { id: 'gb-cheese-quesadilla', locationId: 'g-brothers', name: 'Cheese Quesadilla', price: 10.25, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Cheese quesadilla with sour cream and salsa roja.' },
  { id: 'gb-veggie-quesadilla', locationId: 'g-brothers', name: 'Veggie Quesadilla', price: 12.25, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Spinach, cheese and tomato in a spinach tortilla with salsa and sour cream.' },

  // Jewel of India
  { id: 'jewel-vegetarian-meal', locationId: 'jewel-india', name: 'Vegetarian Meal', price: 16.00, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Two vegetable portions served with rice and naan.' },
  { id: 'jewel-paneer-meal', locationId: 'jewel-india', name: 'Paneer Tikka Masala Meal', price: 16.00, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true },
  { id: 'jewel-mango-chicken-meal', locationId: 'jewel-india', name: 'Mango Chicken Meal', price: 16.00, type: 'fast', periods: LUNCH_DINNER, description: 'Boneless cubed chicken with bell peppers and onions in mango sauce.' },
  { id: 'jewel-tikka-meal', locationId: 'jewel-india', name: 'Chicken Tikka Masala Meal', price: 16.00, type: 'fast', periods: LUNCH_DINNER, description: 'Tandoor-cooked boneless chicken breast in curry sauce, served with rice and naan.' },
  { id: 'jewel-curry-meal', locationId: 'jewel-india', name: 'Chicken Curry Meal', price: 16.00, type: 'fast', periods: LUNCH_DINNER, description: 'Mildly spiced chicken curry served with rice and naan.' },
  { id: 'jewel-vindaloo-meal', locationId: 'jewel-india', name: 'Chicken Vindaloo Meal', price: 16.00, type: 'fast', periods: LUNCH_DINNER, description: 'Chicken cooked with spices and potato, served with rice and naan.' },
  { id: 'jewel-vegetarian-plate', locationId: 'jewel-india', name: 'Vegetarian Plate', price: 12.50, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Vegetarian plate served with rice and naan.' },
  { id: 'jewel-paneer-plate', locationId: 'jewel-india', name: 'Paneer Tikka Masala Plate', price: 12.50, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Paneer tikka masala with rice and naan.' },
  { id: 'jewel-red-chicken-plate', locationId: 'jewel-india', name: 'Red Chicken Curry Plate', price: 12.50, type: 'fast', periods: LUNCH_DINNER, description: 'Chicken simmered in a rich, spicy red curry sauce.' },
  { id: 'jewel-chicken-curry-plate', locationId: 'jewel-india', name: 'Chicken Curry Plate', price: 12.50, type: 'fast', periods: LUNCH_DINNER, description: 'Mildly spiced chicken gravy served with rice and naan.' },
  { id: 'jewel-mango-chicken-plate', locationId: 'jewel-india', name: 'Mango Chicken Plate', price: 12.50, type: 'fast', periods: LUNCH_DINNER, description: 'Boneless cubed chicken with bell peppers and onions in mango sauce.' },
  { id: 'jewel-tikka-plate', locationId: 'jewel-india', name: 'Chicken Tikka Masala Plate', price: 12.50, type: 'fast', periods: LUNCH_DINNER, description: 'Chicken tikka masala with rice and naan.' },

  // What's Cookin' Kosher
  { id: 'kosher-falafel-plate', locationId: 'kosher', name: 'Falafel Plate', price: 13.00, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Herbed chickpea fritters with rice, hummus, tahini and coleslaw, served with pita.' },
  { id: 'kosher-schnitzel-plate', locationId: 'kosher', name: 'Schnitzel Plate', price: 17.00, type: 'fast', periods: LUNCH_DINNER, description: 'Breaded chicken breast with rice, hummus, tahini and coleslaw, served with pita.' },
  { id: 'kosher-shawarma-plate', locationId: 'kosher', name: 'Chicken Shawarma Plate', price: 15.00, type: 'healthy', periods: LUNCH_DINNER, description: 'Mediterranean spiced chicken with rice, hummus, tahini and coleslaw, served with pita.' },
  { id: 'kosher-pastrami', locationId: 'kosher', name: 'Kosher Style Pastrami Sandwich', price: 14.00, type: 'fast', periods: LUNCH_DINNER, description: 'Kosher smoked hot pastrami and mustard on rye with seasoned fries and a pickle spear.' },
  { id: 'kosher-sausage', locationId: 'kosher', name: 'Sausage', price: 9.00, type: 'fast', periods: LUNCH_DINNER, description: 'Grilled beef sausage on a toasted bun.' },
  { id: 'kosher-sausage-fries', locationId: 'kosher', name: 'Sausage with Fries', price: 11.00, type: 'fast', periods: LUNCH_DINNER, description: 'Grilled beef sausage on a toasted bun with fries.' },

  // Plant Ivy
  { id: 'plant-classic-burger', locationId: 'plant-ivy', name: 'Classic Impossible Burger', price: 15.99, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Pretzel bun, Impossible patty, cheddar, pickles, tomato, lettuce, onion and house burger sauce.' },
  { id: 'plant-avocado-burger', locationId: 'plant-ivy', name: 'Avocado Impossible Burger', price: 15.99, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Pretzel bun, Impossible patty, avocado, cheddar, tomato, lettuce and onion.' },
  { id: 'plant-apple-burger', locationId: 'plant-ivy', name: 'Apple Impossible Burger', price: 15.99, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Pretzel bun, Impossible patty, apple, cheddar, lettuce, onion and house burger sauce.' },
  { id: 'plant-jalapeno-burger', locationId: 'plant-ivy', name: 'Jalapeño Impossible Burger', price: 15.99, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Pretzel bun, Impossible patty, cheddar, jalapeños, tomato, lettuce and onion.' },
  { id: 'plant-southwest-bacon-burger', locationId: 'plant-ivy', name: 'Southwest Bacon Impossible Burger', price: 15.99, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Pretzel bun, Impossible patty, mushroom bacon, cheddar, tomato, lettuce and BBQ sauce.' },
  { id: 'plant-bbq-chicken-sandwich', locationId: 'plant-ivy', name: "BBQ Impossible Chk'n Sandwich", price: 13.99, type: 'fast', periods: LUNCH_DINNER, vegetarian: true, description: 'Pretzel bun, Impossible chicken patty, cheddar, pickles, onion, lettuce and BBQ sauce.' },
  { id: 'plant-messy-monday-everyday', locationId: 'plant-ivy', name: 'Messy Monday Everyday', price: 13.99, type: 'healthy', periods: LUNCH_DINNER, vegetarian: true, description: 'Savory roasted potatoes, grilled vegetables, Impossible ground meat, pico de gallo and avocado.' },

  // Shake Smart
  { id: 'shake-cookies-cream', locationId: 'shake-smart', name: "Cookies n' Cream", price: 7.75, type: 'drink', periods: ALL_DAY },
  { id: 'shake-grammys-goods', locationId: 'shake-smart', name: "Grammy's Goods", price: 8.75, type: 'drink', periods: ALL_DAY, description: "Cookies n' cream protein with all-natural peanut butter." },
  { id: 'shake-carrot-cake', locationId: 'shake-smart', name: 'Carrot Cake', price: 9.25, type: 'drink', periods: ALL_DAY, description: 'Cinnamon, banana, carrot juice and vanilla protein.' },
  { id: 'shake-organic-supershake', locationId: 'shake-smart', name: 'Organic Supershake', price: 9.25, type: 'drink', periods: ALL_DAY, description: 'Organic superfood, banana, vanilla protein and all-natural peanut butter.' },
  { id: 'shake-chocolate-strawberry', locationId: 'shake-smart', name: 'Chocolate Covered Strawberry', price: 9.25, type: 'drink', periods: ALL_DAY, description: 'Strawberry, acai and chocolate protein.' },
  { id: 'shake-breakfast-to-go', locationId: 'shake-smart', name: 'Breakfast to Go', price: 9.25, type: 'drink', periods: BREAKFAST_LUNCH, description: 'Strawberry, pineapple, acai, orange juice and vanilla protein.' },
  { id: 'shake-fruitopia', locationId: 'shake-smart', name: 'Fruitopia', price: 9.25, type: 'drink', periods: ALL_DAY, description: 'Strawberry, banana, acai, apple juice and protein.' },
  { id: 'shake-pink-cadillac', locationId: 'shake-smart', name: 'Pink Cadillac', price: 9.25, type: 'drink', periods: ALL_DAY, description: 'Pitaya, pineapple, orange juice and vanilla protein.' },
  { id: 'shake-rawcai-bowl', locationId: 'shake-smart', name: 'Rawcai Acai Bowl', price: 10.25, type: 'healthy', periods: DAYTIME, vegetarian: true, description: 'Organic acai, strawberry, granola, banana slices, chia and coconut.' },
  { id: 'shake-raw-pb-bowl', locationId: 'shake-smart', name: 'Raw-PB Acai Bowl', price: 10.25, type: 'healthy', periods: DAYTIME, vegetarian: true, description: 'Organic acai with granola, banana slices, dark chocolate and all-natural peanut butter.' },
  { id: 'shake-buzz-bowl', locationId: 'shake-smart', name: 'The Buzz Bowl', price: 10.35, type: 'healthy', periods: DAYTIME, vegetarian: true, description: 'Organic acai, pitaya, pineapple, granola, coconut flakes and bee pollen.' },
];
