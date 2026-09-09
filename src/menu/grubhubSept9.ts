import type { MealPeriod } from './dineoncampus';
import type { RecordedMenuItem } from './grubhub';

// Brunch serves this Breakfast Menu through late morning / early afternoon,
// including after ChewMash's global 10am breakfast->lunch cutoff. Marking the
// items for both periods keeps them eligible for the full recorded Brunch
// morning service window while the location itself is open.
const BREAKFAST_LUNCH: MealPeriod[] = ['breakfast', 'lunch'];

// Picks-eligible items transcribed from the student Brunch Grubhub recording
// supplied on 2026-09-09. Standalone potato/hash sides, the mixed fruit side,
// and bottled Minute Maid Lemonade are intentionally omitted from Picks, in
// line with the existing catalog's no-generic-drinks / no-sides policy.
export const RECORDED_MENU_SEPT9: RecordedMenuItem[] = [
  { id: 'brunch-am-vegan-combo', locationId: 'brunch', name: 'AM Vegan Combo Meal', price: 10.75, type: 'healthy', periods: BREAKFAST_LUNCH, vegan: true, vegetarian: true, description: 'Roasted vegetable and tofu scramble with breakfast potatoes and fresh fruit.' },
  { id: 'brunch-am-combo', locationId: 'brunch', name: 'AM Combo Meal', price: 10.75, type: 'healthy', periods: BREAKFAST_LUNCH, description: 'Roasted vegetable and egg scramble with breakfast potatoes and fresh fruit.' },
  { id: 'brunch-avocado-egg-bacon-toast', locationId: 'brunch', name: 'Avocado Egg & Bacon Toast', price: 9.95, type: 'healthy', periods: BREAKFAST_LUNCH, description: 'Seven grain toast, smashed avocado, sliced bacon, hard fried egg, everything bagel seasoning and fresh herbs.' },
  { id: 'brunch-overnight-oats', locationId: 'brunch', name: 'Overnight Oats', price: 8.45, type: 'healthy', periods: BREAKFAST_LUNCH, description: 'Chilled oats with oat milk, cinnamon, agave, vanilla and fresh blueberries.' },
  { id: 'brunch-cinnamon-french-toast', locationId: 'brunch', name: 'Cinnamon French Toast', price: 10.95, type: 'fast', periods: BREAKFAST_LUNCH, description: 'Thick-sliced Texas toast, battered and grilled golden brown, then dusted with powdered sugar.' },
  { id: 'brunch-tofu-power-bowl', locationId: 'brunch', name: 'Tofu Power Bowl', price: 10.75, type: 'healthy', periods: BREAKFAST_LUNCH, description: 'Scrambled tofu, sweet potato-jicama hash, sauteed greens, avocado and fire roasted salsa.' },
  { id: 'brunch-power-burrito', locationId: 'brunch', name: 'Power Burrito', price: 11.25, type: 'fast', periods: BREAKFAST_LUNCH, description: 'Flour tortilla, scrambled eggs, sweet potato-jicama hash, sauteed greens, avocado and fire roasted salsa.' },
  { id: 'brunch-jr-breakfast-burrito', locationId: 'brunch', name: 'Jr Breakfast Burrito', price: 10.95, type: 'fast', periods: BREAKFAST_LUNCH, description: 'Flour tortilla with scrambled eggs, potatoes mixed with fajita veggies, and a choice of crumbled bacon or maple sausage.' },
  { id: 'brunch-bacon-breakfast-burrito', locationId: 'brunch', name: 'Bacon Breakfast Burrito', price: 12.25, type: 'fast', periods: BREAKFAST_LUNCH, description: "Flour tortilla, scrambled eggs, O'Brien potatoes mixed with fajita veggies, crumbled bacon and shredded cheese." },
  { id: 'brunch-maple-sausage-breakfast-burrito', locationId: 'brunch', name: 'Smoked Maple Sausage Breakfast Burrito', price: 12.25, type: 'fast', periods: BREAKFAST_LUNCH, description: "Flour tortilla, scrambled eggs, O'Brien potatoes mixed with fajita veggies, smoked maple sausage and shredded cheese." },
  { id: 'brunch-scrambled-eggs', locationId: 'brunch', name: 'Scrambled Eggs', price: 5.35, type: 'healthy', periods: BREAKFAST_LUNCH, vegetarian: true },
  { id: 'brunch-scrambled-tofu', locationId: 'brunch', name: 'Scrambled Tofu', price: 5.35, type: 'healthy', periods: BREAKFAST_LUNCH, vegan: true, vegetarian: true },
];
