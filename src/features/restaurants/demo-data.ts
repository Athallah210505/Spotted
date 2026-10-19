export const categories = [
  "All",
  "Coffee",
  "Matcha",
  "Japanese",
  "Korean",
  "Indonesian",
  "Western",
  "Dessert",
  "Brunch",
] as const;

export type Category = (typeof categories)[number];
export type DemoRestaurant = {
  id: string;
  name: string;
  category: Category;
  city: "jakarta" | "tangsel";
  area: string;
  rating: string;
  ratingCount: number;
  distanceM: number;
  distanceLabel: string;
  image: string;
  imageAlt: string;
};

// shortcut: Figma fixtures only; replace with attributed Places DTOs when discovery is connected.
export const demoRestaurants: DemoRestaurant[] = [
  {
    id: "kedai-ramen-sore",
    name: "Kedai Ramen Sore",
    category: "Japanese",
    city: "jakarta",
    area: "Blok M",
    rating: "4.8",
    ratingCount: 328,
    distanceM: 1200,
    distanceLabel: "1.2 km",
    image: "photo-ramen.jpg",
    imageAlt: "Illustrative ramen bowl with egg and vegetables",
  },
  {
    id: "kopi-halaman",
    name: "Kopi Halaman",
    category: "Coffee",
    city: "jakarta",
    area: "Blok M",
    rating: "4.7",
    ratingCount: 214,
    distanceM: 850,
    distanceLabel: "850 m",
    image: "photo-cafe.jpg",
    imageAlt: "Illustrative café interior",
  },
  {
    id: "ruang-matcha",
    name: "Ruang Matcha",
    category: "Matcha",
    city: "tangsel",
    area: "Bintaro",
    rating: "4.6",
    ratingCount: 180,
    distanceM: 7400,
    distanceLabel: "7.4 km",
    image: "photo-ramen1.jpg",
    imageAlt: "Illustrative café interior from the Figma design",
  },
];

export function findDemoRestaurant(id: string) {
  return demoRestaurants.find((place) => place.id === id);
}
