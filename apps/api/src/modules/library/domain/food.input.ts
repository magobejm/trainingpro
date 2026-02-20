export type FoodFilter = {
  foodCategory?: string;
  foodType?: string;
  query?: string;
  servingUnit?: string;
};

export type FoodWriteInput = {
  caloriesKcal?: null | number;
  carbsG?: null | number;
  fatG?: null | number;
  mediaType?: null | string;
  mediaUrl?: null | string;
  name: string;
  notes?: null | string;
  proteinG?: null | number;
  foodCategory?: null | string;
  foodType?: null | string;
  servingUnit: string;
};
