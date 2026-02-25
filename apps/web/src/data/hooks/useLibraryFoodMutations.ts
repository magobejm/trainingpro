import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteItem, updateItem, useAuth, writeItem } from './library-mutations.helpers';

export type FoodWriteInput = {
  caloriesKcal?: null | number;
  carbsG?: null | number;
  fatG?: null | number;
  foodCategory?: null | string;
  foodType?: null | string;
  mediaType?: null | string;
  mediaUrl?: null | string;
  name: string;
  notes?: null | string;
  proteinG?: null | number;
  servingUnit: string;
};

export function useCreateFoodMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FoodWriteInput) => writeItem(auth, 'foods', 'POST', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useDeleteFoodMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteItem(auth, 'foods', itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useUpdateFoodMutation() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; payload: FoodWriteInput }) =>
      updateItem(auth, 'foods', input.itemId, input.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}
