// src/data/products.js
// Images for Student Government goodies (import for Vite bundling)
import bottle from "../assets/GoodiesMedias/Goodies/bottle.png";
import capBlue from "../assets/GoodiesMedias/Goodies/cap-blue.png";
import hoodieOnceAlwaysWhite from "../assets/GoodiesMedias/Goodies/hoodie-oncealways-white.png";
import hoodieProudGrey from "../assets/GoodiesMedias/Goodies/hoodie-proud-grey.png";
import hoodieProudWhite from "../assets/GoodiesMedias/Goodies/hoodie-proud-white.png";
import hoodiesOnceAlways from "../assets/GoodiesMedias/Goodies/hoodies-oncealways.png";
import mug from "../assets/GoodiesMedias/Goodies/mug.png";
import tshirtCbiBlue from "../assets/GoodiesMedias/Goodies/tshirt-cbi-blue.png";
import tshirtElecGrey from "../assets/GoodiesMedias/Goodies/tshirt-elec-grey.png";
import tshirtsCbi from "../assets/GoodiesMedias/Goodies/tshirts-cbi.png";
import tshirtsElec from "../assets/GoodiesMedias/Goodies/tshirts-elec.png";
import tshirtsInnov from "../assets/GoodiesMedias/Goodies/tshirts-innov.png";
import tshirtsMec from "../assets/GoodiesMedias/Goodies/tshirts-mec.png";
import tshirtsOnceAlways from "../assets/GoodiesMedias/Goodies/tshirts-oncealways.png";
import tshirtsProud from "../assets/GoodiesMedias/Goodies/tshirts-proud.png";
import tshirtsWhereIdeas from "../assets/GoodiesMedias/Goodies/tshirts-whereIdeas.png";

// Logo variant images
import clothing1 from "../assets/clothing_variants/WhatsApp Image 2026-03-01 at 4.15.40 PM.jpeg";
import clothing2 from "../assets/clothing_variants/WhatsApp Image 2026-03-01 at 4.16.07 PM.jpeg";
import clothing3 from "../assets/clothing_variants/WhatsApp Image 2026-03-01 at 4.16.55 PM.jpeg";
import clothing4 from "../assets/clothing_variants/WhatsApp Image 2026-03-01 at 4.31.49 PM.jpeg";
import clothing5 from "../assets/clothing_variants/WhatsApp Image 2026-03-01 at 4.34.08 PM (2).jpeg";
import clothing6 from "../assets/clothing_variants/WhatsApp Image 2026-03-01 at 4.34.08 PM.jpeg";
import clothing7 from "../assets/clothing_variants/WhatsApp Image 2026-03-01 at 4.34.09 PM (1).jpeg";
import clothing8 from "../assets/clothing_variants/WhatsApp Image 2026-03-01 at 4.34.09 PM.jpeg";
import clothing9 from "../assets/clothing_variants/WhatsApp Image 2026-03-01 at 4.40.06 PM (1).jpeg";
import clothing10 from "../assets/clothing_variants/WhatsApp Image 2026-03-01 at 4.40.06 PM.jpeg";
import clothing11 from "../assets/clothing_variants/WhatsApp Image 2026-03-01 at 4.40.07 PM (1).jpeg";
import clothing12 from "../assets/clothing_variants/WhatsApp Image 2026-03-01 at 4.40.07 PM.jpeg";

// Logo variants for clothing customization
export const LOGO_VARIANTS = [
  { id: "daustian", name: "Daustian", description: "Classic Daustian logo" },
  { id: "uniwear", name: "Uniwear x Daustian", description: "Collaboration logo" },
  { id: "none", name: "No Logo", description: "Plain without logo" },
];

export const CATEGORIES = [
  "All Categories",
  "T-Shirts",
  "Hoodies",
  "Quarter Zip",
  "Caps",
  "Shorts",
  "Joggers",
  "Drinkware",
  "Accessories",
];

export const PRODUCTS = [
  // Drinkware
  {
    id: 1,
    name: "DAUST Water Bottle",
    category: "Drinkware",
    price: 5000,
    rating: 4.8,
    badge: "Popular",
    image: bottle,
    images: [bottle, mug],
    colors: [{ name: "Steel", hex: "#94a3b8" }, { name: "Navy", hex: "#0a2342" }],
    description: "Stay hydrated on campus with our premium DAUST Water Bottle. Designed for durability and style.",
  },
  {
    id: 2,
    name: "DAUST Mug",
    category: "Drinkware",
    price: 3500,
    rating: 4.7,
    image: mug,
    images: [mug, bottle],
    colors: [{ name: "White", hex: "#ffffff" }],
    description: "The perfect companion for your morning coffee or late-night study sessions.",
  },

  // Caps
  {
    id: 3,
    name: "DAUST Cap (Blue)",
    category: "Caps",
    price: 4000,
    rating: 4.6,
    image: capBlue,
    images: [capBlue],
    colors: [{ name: "Blue", hex: "#1e40af" }],
    sizes: ["Adjustable"],
    description: "A premium adjustable cap featuring the DAUST emblem. Perfect for campus days.",
  },

  // Hoodies
  {
    id: 4,
    name: "Hoodie 'Once/Always'",
    category: "Hoodies",
    price: 12000,
    rating: 4.9,
    badge: "Best Seller",
    image: hoodiesOnceAlways,
    images: [hoodiesOnceAlways, hoodieOnceAlwaysWhite],
    colors: [
      { name: "White", hex: "#ffffff" },
      { name: "Navy", hex: "#0a2342" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    logos: LOGO_VARIANTS,
    logoImages: {
      "daustian": { "White": [clothing1, clothing2], "Navy": [clothing3, clothing4] },
      "uniwear": { "White": [clothing5, clothing6], "Navy": [clothing7, clothing8] },
      "none": { "White": [clothing9, clothing10], "Navy": [clothing11, clothing12] },
    },
    description: "Our signature 'Once/Always' hoodie. Premium quality, ultimate comfort.",
  },
  {
    id: 5,
    name: "Hoodie 'Proud Parent'",
    category: "Hoodies",
    price: 12000,
    rating: 4.7,
    image: hoodieProudWhite,
    images: [hoodieProudWhite, hoodieProudGrey],
    colors: [
      { name: "White", hex: "#ffffff" },
      { name: "Grey", hex: "#6b7280" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    logos: LOGO_VARIANTS,
    logoImages: {
      "daustian": { "White": [clothing1, clothing2], "Grey": [clothing3, clothing4] },
      "uniwear": { "White": [clothing5, clothing6], "Grey": [clothing7, clothing8] },
      "none": { "White": [clothing9, clothing10], "Grey": [clothing11, clothing12] },
    },
    description: "Show your family pride with our premium parent hoodie.",
  },
  {
    id: 6,
    name: "Hoodie 'Once/Always' White",
    category: "Hoodies",
    price: 11500,
    rating: 4.8,
    image: hoodieOnceAlwaysWhite,
    images: [hoodieOnceAlwaysWhite],
    colors: [{ name: "White", hex: "#ffffff" }],
    sizes: ["S", "M", "L", "XL"],
    logos: LOGO_VARIANTS,
    logoImages: {
      "daustian": { "White": [clothing1, clothing2] },
      "uniwear": { "White": [clothing5, clothing6] },
      "none": { "White": [clothing9, clothing10] },
    },
    description: "Classic white hoodie with the Once/Always design.",
  },
  {
    id: 7,
    name: "Hoodie 'Proud' Grey",
    category: "Hoodies",
    price: 11500,
    rating: 4.6,
    image: hoodieProudGrey,
    images: [hoodieProudGrey],
    colors: [{ name: "Grey", hex: "#6b7280" }],
    sizes: ["S", "M", "L", "XL"],
    logos: LOGO_VARIANTS,
    logoImages: {
      "daustian": { "Grey": [clothing3, clothing4] },
      "uniwear": { "Grey": [clothing7, clothing8] },
      "none": { "Grey": [clothing11, clothing12] },
    },
    description: "Elegant grey hoodie for the proud parent.",
  },

  // Quarter Zip
  {
    id: 17,
    name: "Quarter Zip Daustian",
    category: "Quarter Zip",
    price: 15000,
    rating: 4.8,
    badge: "New",
    image: clothing1,
    images: [clothing1, clothing2],
    colors: [
      { name: "Navy", hex: "#0a2342" },
      { name: "Black", hex: "#000000" },
      { name: "Grey", hex: "#6b7280" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    logos: LOGO_VARIANTS,
    logoImages: {
      "daustian": { "Navy": [clothing1, clothing2], "Black": [clothing3, clothing4], "Grey": [clothing5, clothing6] },
      "uniwear": { "Navy": [clothing7, clothing8], "Black": [clothing9, clothing10], "Grey": [clothing11, clothing12] },
      "none": { "Navy": [clothing1], "Black": [clothing3], "Grey": [clothing5] },
    },
    description: "Premium quarter zip jacket. Perfect for campus weather.",
  },
  {
    id: 18,
    name: "Quarter Zip Uniwear",
    category: "Quarter Zip",
    price: 15500,
    rating: 4.9,
    badge: "Limited",
    image: clothing5,
    images: [clothing5, clothing6],
    colors: [
      { name: "Navy", hex: "#0a2342" },
      { name: "Black", hex: "#000000" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    logos: LOGO_VARIANTS,
    logoImages: {
      "daustian": { "Navy": [clothing1, clothing2], "Black": [clothing3, clothing4] },
      "uniwear": { "Navy": [clothing7, clothing8], "Black": [clothing9, clothing10] },
      "none": { "Navy": [clothing1], "Black": [clothing3] },
    },
    description: "Exclusive Uniwear x Daustian collaboration quarter zip.",
  },

  // Shorts
  {
    id: 19,
    name: "Daustian Short",
    category: "Shorts",
    price: 8000,
    rating: 4.5,
    image: clothing7,
    images: [clothing7, clothing8],
    colors: [
      { name: "Navy", hex: "#0a2342" },
      { name: "Black", hex: "#000000" },
      { name: "Grey", hex: "#6b7280" }
    ],
    sizes: ["S", "M", "L", "XL"],
    logos: LOGO_VARIANTS,
    logoImages: {
      "daustian": { "Navy": [clothing7, clothing8], "Black": [clothing9, clothing10], "Grey": [clothing11, clothing12] },
      "uniwear": { "Navy": [clothing1, clothing2], "Black": [clothing3, clothing4], "Grey": [clothing5, clothing6] },
      "none": { "Navy": [clothing7], "Black": [clothing9], "Grey": [clothing11] },
    },
    description: "Comfortable DAUST shorts for campus activities.",
  },

  // Joggers
  {
    id: 20,
    name: "Daustian Jogging",
    category: "Joggers",
    price: 9500,
    rating: 4.7,
    image: clothing9,
    images: [clothing9, clothing10],
    colors: [
      { name: "Navy", hex: "#0a2342" },
      { name: "Black", hex: "#000000" },
      { name: "Grey", hex: "#6b7280" }
    ],
    sizes: ["S", "M", "L", "XL"],
    logos: LOGO_VARIANTS,
    logoImages: {
      "daustian": { "Navy": [clothing9, clothing10], "Black": [clothing11, clothing12], "Grey": [clothing1, clothing2] },
      "uniwear": { "Navy": [clothing3, clothing4], "Black": [clothing5, clothing6], "Grey": [clothing7, clothing8] },
      "none": { "Navy": [clothing9], "Black": [clothing11], "Grey": [clothing1] },
    },
    description: "Premium joggers for the active DAUST student.",
  },

  // T-Shirts
  {
    id: 8,
    name: "T-Shirt 'Where Ideas Come to Life'",
    category: "T-Shirts",
    price: 7500,
    rating: 4.8,
    badge: "Popular",
    image: tshirtsWhereIdeas,
    images: [tshirtsWhereIdeas],
    colors: [
      { name: "White", hex: "#ffffff" },
      { name: "Navy", hex: "#0a2342" }
    ],
    sizes: ["S", "M", "L", "XL"],
    logos: LOGO_VARIANTS,
    logoImages: {
      "daustian": { "White": [clothing1, clothing2], "Navy": [clothing3, clothing4] },
      "uniwear": { "White": [clothing5, clothing6], "Navy": [clothing7, clothing8] },
      "none": { "White": [clothing9, clothing10], "Navy": [clothing11, clothing12] },
    },
    description: "The motto of DAUST on a premium cotton T-Shirt.",
  },
  {
    id: 9,
    name: "T-Shirt 'Once/Always' DAUST",
    category: "T-Shirts",
    price: 7500,
    rating: 4.7,
    image: tshirtsOnceAlways,
    images: [tshirtsOnceAlways],
    colors: [
      { name: "White", hex: "#ffffff" },
      { name: "Navy", hex: "#0a2342" },
      { name: "Black", hex: "#000000" }
    ],
    sizes: ["S", "M", "L", "XL"],
    logos: LOGO_VARIANTS,
    logoImages: {
      "daustian": { "White": [clothing1, clothing2], "Navy": [clothing3, clothing4], "Black": [clothing5, clothing6] },
      "uniwear": { "White": [clothing7, clothing8], "Navy": [clothing9, clothing10], "Black": [clothing11, clothing12] },
      "none": { "White": [clothing1], "Navy": [clothing3], "Black": [clothing5] },
    },
    description: "Our signature 'Once/Always' design in a comfortable T-Shirt format.",
  },
  {
    id: 10,
    name: "T-Shirts Code Build Impact ",
    category: "T-Shirts",
    price: 7500,
    rating: 4.4,
    image: tshirtsCbi,
    images: [tshirtsCbi, tshirtCbiBlue],
    colors: [{ name: "Navy", hex: "#0a2342" }],
    sizes: ["S", "M", "L", "XL"],
    description: "Multiple styles of the Code Build Impact T-Shirt collection.",
  },
  {
    id: 11,
    name: "T-Shirts ELEC Engineer ",
    category: "T-Shirts",
    price: 7500,
    rating: 4.4,
    image: tshirtsElec,
    images: [tshirtsElec, tshirtElecGrey],
    colors: [{ name: "Grey", hex: "#9ca3af" }],
    sizes: ["S", "M", "L", "XL"],
    description: "The complete ELEC Engineer T-Shirt collection.",
  },
  {
    id: 12,
    name: "T-Shirts DAUST Innovator ",
    category: "T-Shirts",
    price: 7500,
    rating: 4.4,
    image: tshirtsInnov,
    images: [tshirtsInnov],
    colors: [{ name: "White", hex: "#ffffff" }],
    sizes: ["S", "M", "L", "XL"],
    description: "Celebration of innovation at DAUST. A light and comfortable T-Shirt.",
  },
  {
    id: 13,
    name: "T-Shirts MECH Engineer ",
    category: "T-Shirts",
    price: 7500,
    rating: 4.4,
    image: tshirtsMec,
    images: [tshirtsMec],
    colors: [{ name: "Navy", hex: "#0a2342" }],
    sizes: ["S", "M", "L", "XL"],
    description: "Official Mechanical Engineering T-Shirt. Built for the future.",
  },
  {
    id: 14,
    name: 'T-Shirts "Once/Always a DAUST innovator" ',
    category: "T-Shirts",
    price: 7500,
    rating: 4.5,
    image: tshirtsOnceAlways,
    images: [tshirtsOnceAlways],
    colors: [{ name: "Various", hex: "#cccccc" }],
    sizes: ["S", "M", "L", "XL"],
    description: "Our signature 'Once/Always' design in a comfortable T-Shirt format.",
  },
  {
    id: 15,
    name: 'T-Shirts "Proud Parent" ',
    category: "T-Shirts",
    price: 7500,
    rating: 4.6,
    image: tshirtsProud,
    images: [tshirtsProud],
    colors: [{ name: "Various", hex: "#cccccc" }],
    sizes: ["S", "M", "L", "XL"],
    description: "Show your family pride with these comfortable T-Shirts for parents.",
  },
  {
    id: 16,
    name: 'T-Shirts "Where Ideas Come to Life" ',
    category: "T-Shirts",
    price: 18.0,
    rating: 4.5,
    image: tshirtsWhereIdeas,
    images: [tshirtsWhereIdeas],
    colors: [{ name: "White", hex: "#ffffff" }],
    sizes: ["S", "M", "L", "XL"],
    description: "The motto of DAUST on a premium cotton T-Shirt.",
  },
];
