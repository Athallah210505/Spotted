import type { FoodPlace } from "@/features/catalog/food-types";

export const cravingQuestions = [
  { question: "Lagi ingin makan berat?", label: "Makanan utama" },
  { question: "Mau masakan Indonesia?", label: "Masakan Indonesia" },
  { question: "Tertarik masakan Asia Timur?", label: "Masakan Asia Timur" },
  { question: "Mau ngopi atau ke kafe?", label: "Kopi dan kafe" },
  { question: "Ingin sesuatu yang manis?", label: "Dessert dan bakery" },
] as const;

export function cravingTraits(
  place: Pick<FoodPlace, "name" | "category" | "cuisine">,
): (boolean | null)[] {
  const text = `${place.category} ${place.cuisine}`
    .toLowerCase()
    .replaceAll("_", " ");
  const cafe = /\b(cafe|café|coffee|kopi|kafe|tea house|teahouse)\b/.test(text);
  const sweet =
    /bakery|cake|dessert|ice.?cream|pastry|donut|donat|kue|patisserie|confection|chocol/.test(
      text,
    );
  const local =
    /indonesian|indonesia|padang|sunda|betawi|manado|javanese|balinese/.test(
      text,
    );
  const asian = /japan|jepang|korea|chinese|china|sichuan|cantonese/.test(text);
  const other =
    /italian|western|french|indian|thai|mexican|turkish|middle eastern|lebanese/.test(
      text,
    );
  const meal =
    local ||
    asian ||
    other ||
    /restaurant|fast food|food court|seafood/.test(text);
  return [
    meal ? true : cafe || sweet ? false : null,
    local ? true : asian || other ? false : null,
    asian ? true : local || other ? false : null,
    cafe ? true : meal || sweet ? false : null,
    sweet ? true : meal ? false : null,
  ];
}

export function cravingMatch(
  place: Pick<FoodPlace, "name" | "category" | "cuisine">,
  answers: boolean[],
) {
  const traits = cravingTraits(place);
  let score = 0;
  const reasons: string[] = [];
  traits.forEach((trait, index) => {
    if (trait === null) return;
    if (trait === answers[index]) {
      score += 1;
      reasons.push(
        `${answers[index] ? "Pilihan" : "Tanpa fokus"} ${cravingQuestions[index]!.label.toLowerCase()}`,
      );
    } else score -= 1;
  });
  return { score, reasons };
}
