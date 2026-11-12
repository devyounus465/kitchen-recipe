import type { Ingredient } from "@/db/schema";
import { parseQty, formatQty } from "./utils";
const UNITS = ["cups","cup","tablespoons","tablespoon","tbsp","teaspoons","teaspoon","tsp","pounds","pound","lb","lbs","ounces","ounce","oz","grams","gram","g","kg","ml","liters","liter","l","pinch","dash","cloves","clove","slices","slice","cans","can","packages","package","sprigs","sprig","stalks","stalk","heads","head","leaves","pint","pints","quart","quarts","large","medium","small"];
const UNI: Record<string, string> = { "½": " 1/2", "¼": " 1/4", "¾": " 3/4", "⅓": " 1/3", "⅔": " 2/3", "⅛": " 1/8" };
/** "1 1/2 cups flour, sifted" → {qty:1.5, unit:"cups", item:"flour", note:"sifted"} */
export function parseIngredientLine(line: string): Ingredient | null {
  let s = line.trim().replace(/[½¼¾⅓⅔⅛]/g, (m) => UNI[m]).trim(); if (!s) return null;
  let qty: number | null = null;
  const m = s.match(/^((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?)\s*/);
  if (m) { qty = parseQty(m[1]); s = s.slice(m[0].length); }
  let unit = "";
  const paren = s.match(/^\(([^)]+)\)\s*/); if (paren) { unit = `(${paren[1]})`; s = s.slice(paren[0].length); }
  const w = s.split(/\s+/)[0]?.toLowerCase().replace(/\.$/, "");
  if (w && UNITS.includes(w) && s.split(/\s+/).length > 1) { unit = unit ? `${unit} ${s.split(/\s+/)[0]}` : s.split(/\s+/)[0]; s = s.slice(s.split(/\s+/)[0].length).trim(); }
  const [item, ...note] = s.split(",");
  return { qty, unit, item: item.trim(), note: note.join(",").trim() || undefined };
}
export function ingredientToLine(i: Ingredient) {
  return [i.qty != null ? formatQty(i.qty).replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, (m) => ({ "½": "1/2", "¼": "1/4", "¾": "3/4", "⅓": "1/3", "⅔": "2/3", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8" } as Record<string, string>)[m]).replace(/(\d) (\d)/, "$1 $2") : "", i.unit, i.item].filter(Boolean).join(" ") + (i.note ? `, ${i.note}` : "");
}
