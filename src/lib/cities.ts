export type City = {
  slug: string;
  name: string;
  state: string;
  hueShift: number;
};

export const CITIES: City[] = [
  { slug: "gurugram", name: "Gurugram", state: "Haryana", hueShift: 0 },
  { slug: "delhi", name: "Delhi", state: "Delhi NCR", hueShift: 20 },
  { slug: "mumbai", name: "Mumbai", state: "Maharashtra", hueShift: 40 },
  { slug: "bengaluru", name: "Bengaluru", state: "Karnataka", hueShift: 80 },
  { slug: "hyderabad", name: "Hyderabad", state: "Telangana", hueShift: 120 },
  { slug: "chennai", name: "Chennai", state: "Tamil Nadu", hueShift: 160 },
  { slug: "kolkata", name: "Kolkata", state: "West Bengal", hueShift: 200 },
  { slug: "pune", name: "Pune", state: "Maharashtra", hueShift: 240 },
  { slug: "jaipur", name: "Jaipur", state: "Rajasthan", hueShift: 280 },
  { slug: "ahmedabad", name: "Ahmedabad", state: "Gujarat", hueShift: 320 },
];

export const DEFAULT_CITY = CITIES[0];

export function getCity(slug?: string): City {
  return CITIES.find((c) => c.slug === slug) ?? DEFAULT_CITY;
}

// Deterministic content per city
export function contentForCity(city: City) {
  const shift = (h: number) => (h + city.hueShift) % 360;

  const movies = [
    {
      title: "Neon Alpha",
      tag: "UA16+ | Hindi",
      image: "/posters/neon_alpha.png",
      rating: "4.8",
      votes: "18.2K",
      genre: "Sci-Fi / Action",
      duration: "2h 24m",
      description: "In a neon-drenched metropolis of the future, a rogue cyber-operative uncovers a conspiracy that threatens the fabric of human consciousness.",
      showtimes: ["10:30 AM", "01:45 PM", "05:00 PM", "08:15 PM"],
      prices: [
        { name: "Classic", price: "₹180" },
        { name: "Prime", price: "₹260" },
        { name: "Recliner", price: "₹450" }
      ]
    },
    {
      title: "Into the Jungle",
      tag: "UA16+ | Hindi",
      image: "/posters/into_the_jungle.png",
      rating: "4.5",
      votes: "12.4K",
      genre: "Adventure / Thriller",
      duration: "2h 05m",
      description: "A group of explorers embarks on a dangerous expedition into an uncharted jungle, discovering ancient ruins and deadly creatures.",
      showtimes: ["11:00 AM", "02:15 PM", "06:00 PM", "09:30 PM"],
      prices: [
        { name: "Classic", price: "₹150" },
        { name: "Prime", price: "₹220" },
        { name: "Recliner", price: "₹400" }
      ]
    },
    {
      title: "Homecoming",
      tag: "UA16+ | Hindi",
      image: "/posters/skyline.png",
      rating: "4.7",
      votes: "9.8K",
      genre: "Drama / Family",
      duration: "1h 58m",
      description: "After years of living abroad, a young woman returns to her quiet hometown, forcing her to confront her past and rebuild fractured relationships.",
      showtimes: ["09:45 AM", "01:00 PM", "04:30 PM", "07:45 PM"],
      prices: [
        { name: "Classic", price: "₹160" },
        { name: "Prime", price: "₹240" },
        { name: "Recliner", price: "₹420" }
      ]
    },
    {
      title: "Midnight Mix",
      tag: "A | Hindi",
      image: "/posters/neon_alpha.png",
      rating: "4.3",
      votes: "6.5K",
      genre: "Music / Romance / Drama",
      duration: "2h 10m",
      description: "An aspiring DJ in Mumbai battles personal conflicts and industry politics while striving to make it big in the electronic music scene.",
      showtimes: ["12:00 PM", "03:30 PM", "07:00 PM", "10:15 PM"],
      prices: [
        { name: "Classic", price: "₹180" },
        { name: "Prime", price: "₹280" },
        { name: "Recliner", price: "₹480" }
      ]
    },
    {
      title: "Skyline",
      tag: "UA | English",
      image: "/posters/skyline.png",
      rating: "4.6",
      votes: "22.1K",
      genre: "Action / Sci-Fi / Thriller",
      duration: "2h 15m",
      description: "When extraterrestrial forces launch a sudden invasion on Earth, a team of survivalists must defend the city skyscrapers from above.",
      showtimes: ["10:00 AM", "01:15 PM", "04:45 PM", "08:30 PM"],
      prices: [
        { name: "Classic", price: "₹200" },
        { name: "Prime", price: "₹300" },
        { name: "Recliner", price: "₹500" }
      ]
    },
    {
      title: "Paper Kites",
      tag: "U | Hindi",
      image: "/posters/into_the_jungle.png",
      rating: "4.9",
      votes: "15.7K",
      genre: "Animation / Kids / Family",
      duration: "1h 42m",
      description: "A heartwarming story of two children who build a magical paper kite that takes them on incredible journeys through their dreams.",
      showtimes: ["09:00 AM", "11:30 AM", "02:30 PM", "05:30 PM"],
      prices: [
        { name: "Classic", price: "₹120" },
        { name: "Prime", price: "₹180" },
        { name: "Recliner", price: "₹350" }
      ]
    }
  ].map((m, i) => ({ ...m, hue: shift(285 + i * 30) }));

  const venuePrefix = city.name;
  const parks = [
    { title: `${venuePrefix} Water Wonderland`, price: "₹799", when: "Daily, 10:00 AM onwards", offer: null as string | null },
    { title: `Atlantic World — ${venuePrefix}`, price: "₹539", when: "Daily, 10:00 AM onwards", offer: "Flat 30% off on select tickets" },
    { title: `Fun N Food — ${venuePrefix}`, price: "₹1000", when: "Daily, 11:00 AM onwards", offer: "Flat 30% off on select tickets" },
    { title: `KidZone ${venuePrefix}`, price: "₹708", when: "Sat, 4 Jul onwards", offer: null },
    { title: `SkyJumper Trampoline — ${venuePrefix}`, price: "₹500", when: "Daily, 11:00 AM onwards", offer: null },
    { title: `Snow Masti ${venuePrefix}`, price: "₹500", when: "Daily, 12:00 PM onwards", offer: "Flat 10% OFF" },
  ].map((p, i) => ({ ...p, venue: `${p.title.split("—")[0].trim()}, ${venuePrefix}`, hue: shift(200 + i * 25) }));

  const events = [
    { title: `Sunburn Arena — ${venuePrefix}`, when: "Sat, 12 Jul, 6:00 PM", price: "₹1499" },
    { title: `Standup Nights ${venuePrefix}`, when: "Fri, 11 Jul, 8:30 PM", price: "₹499" },
    { title: `Indie Fest 2026 · ${venuePrefix}`, when: "Sun, 20 Jul, 4:00 PM", price: "₹999" },
    { title: `Jazz by the Lake — ${venuePrefix}`, when: "Sat, 26 Jul, 7:00 PM", price: "₹799" },
    { title: `Poetry & Chai — ${venuePrefix}`, when: "Thu, 17 Jul, 7:30 PM", price: "₹299" },
    { title: `Techno Underground — ${venuePrefix}`, when: "Sat, 19 Jul, 10:00 PM", price: "₹1200" },
  ].map((e, i) => ({ ...e, venue: `Popular venue, ${venuePrefix}`, hue: shift(300 + i * 30) }));

  return { movies, parks, events };
}
