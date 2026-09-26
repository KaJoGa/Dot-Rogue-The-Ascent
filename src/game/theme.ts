/**
 * DESIGN.md — Visual & Color System ("Forge Steel")
 * Core Palette, Semantic Accents, and Enemy Colors
 */

export const theme = {
  bg: {
    background: "#444B5A",
    surface: "#5C657A",
    border: "#7F899F",
    surfaceDark: "#373D4A",
    surfaceLight: "#6B758D",
  },
  text: {
    primary: "#F7F5F0",
    secondary: "#C7CAD1",
    locked: "rgba(199, 202, 209, 0.55)", // #C7CAD1 at ~55% opacity
  },
  accent: {
    primary: "#F3933F",   // Copper — single CTA, unlocked state, boss ring
    secondary: "#5FDDD0", // Teal — hover / comparison target / energy
    gold: "#FBCC56",      // currency only
    danger: "#F47B81",    // player HP, damage
    success: "#51CD8F",   // heal, positive deltas
  },
  enemies: {
    normal:   "#F7776E", // needs outline reinforcement
    elite:    "#64A6F7",
    special:  "#46D883",
    tank:     "#ADB6C2",
    swarm:    "#FAD542",
    caster:   "#A88EF6", // needs outline reinforcement
    ice:      "#4CD8F0",
    fire:     "#F79245",
    poison:   "#A6E147",
  },
} as const;

export type Theme = typeof theme;
