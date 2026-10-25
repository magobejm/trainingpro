import { formatFoodAmount } from '@trainerpro/shared';
import React, { useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import {
  fetchFoodByBarcode,
  useNutritionApi,
  useNutritionFoodSearch,
  type AiMealEstimate,
  type EatenItem,
  type FoodSearchHit,
  type NutritionMealLog,
} from '../../data/hooks/useNutritionLogs';
import { useAuthStore } from '../../store/auth.store';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { MealPhotoButton, pickMealPhoto, uploadLabelPhoto } from './MealPhotoButton';
import { styles } from './nutrition-plan.styles';

const NUMBER_KEYBOARD = 'numeric' as const;

type Translate = (key: string, options?: Record<string, unknown>) => string;
type DraftItem = { amount: string; foodId: string; name: string; servingUnit?: string | null };
type EstimateDraft = { carbsG: string; confidence: number; dishes: string[]; fatG: string; kcal: string; proteinG: string };

export function NutritionChangedSheet(props: {
  initial: DraftItem[];
  initialComment: string;
  initialEstimate?: AiMealEstimate | null;
  initialPhoto: string | null;
  onSave: (
    items: Array<{ amount: number; foodId: string }>,
    comment: string,
    photoPath: string | null,
    aiEstimate: AiMealEstimate | null,
  ) => void;
  t: Translate;
}): React.JSX.Element {
  const [items, setItems] = useState<DraftItem[]>(props.initial);
  const [query, setQuery] = useState('');
  const [comment, setComment] = useState(props.initialComment);
  const [photoPath, setPhotoPath] = useState(props.initialPhoto);
  const [estimate, setEstimate] = useState<EstimateDraft | null>(toDraft(props.initialEstimate));
  const [scanning, setScanning] = useState(false);
  const foods = useNutritionFoodSearch(query);
  const add = (foodId: string, name: string, servingUnit: string | null) => {
    if (items.some((item) => item.foodId === foodId) || items.length >= 20) return;
    setItems((current) => [...current, { amount: servingUnit === 'porcion' ? '1' : '100', foodId, name, servingUnit }]);
    setQuery('');
  };
  return (
    <View style={styles.sheet}>
      <TextInput
        onChangeText={setQuery}
        placeholder={props.t('client.nutrition.searchFoods')}
        style={styles.comment}
        value={query}
      />
      {(foods.data ?? []).map((food) => (
        <Pressable key={food.foodId} onPress={() => add(food.foodId, food.name, food.servingUnit)}>
          <Text style={styles.item}>{food.name}</Text>
        </Pressable>
      ))}
      <Pressable accessibilityLabel={props.t('client.nutrition.scanBarcode')} onPress={() => setScanning(true)}>
        <Text style={styles.dayLabel}>{props.t('client.nutrition.scanBarcode')}</Text>
      </Pressable>
      <ScannerFlow
        onFood={(food) => add(food.foodId, food.name, food.servingUnit)}
        onClose={() => setScanning(false)}
        t={props.t}
        visible={scanning}
      />
      {items.map((item) => (
        <View key={item.foodId} style={styles.dayRow}>
          <Text style={styles.item}>{item.name}</Text>
          <TextInput
            keyboardType={NUMBER_KEYBOARD}
            onChangeText={(amount) => setItems((current) => updateAmount(current, item.foodId, amount))}
            style={styles.amount}
            value={item.amount}
          />
        </View>
      ))}
      <TextInput
        onChangeText={setComment}
        placeholder={props.t('client.nutrition.comment')}
        style={styles.comment}
        value={comment}
      />
      <MealPhotoButton
        onUploaded={(path, aiEstimate) => {
          setPhotoPath(path);
          if (aiEstimate) setEstimate(toDraft(aiEstimate));
        }}
        t={props.t}
      />
      {estimate ? <EstimateCard draft={estimate} onChange={setEstimate} t={props.t} /> : null}
      <Pressable
        onPress={() =>
          props.onSave(
            items.flatMap((item) => {
              const amount = Number(item.amount);
              return amount > 0 ? [{ amount, foodId: item.foodId }] : [];
            }),
            comment,
            photoPath,
            fromDraft(estimate),
          )
        }
      >
        <Text style={styles.dayLabel}>{props.t('client.nutrition.saveLog')}</Text>
      </Pressable>
    </View>
  );
}

function ScannerFlow(props: {
  onClose: () => void;
  onFood: (food: FoodSearchHit) => void;
  t: Translate;
  visible: boolean;
}): React.JSX.Element {
  const api = useNutritionApi();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [missingCode, setMissingCode] = useState<null | string>(null);
  const finish = (food: FoodSearchHit) => {
    setMessage('');
    setMissingCode(null);
    props.onFood(food);
    props.onClose();
  };
  const onCode = async (code: string) => {
    if (!api) return;
    setBusy(true);
    try {
      const food = await fetchFoodByBarcode(api, code);
      if (food) return finish(food);
      setMissingCode(code);
      setMessage(props.t('client.nutrition.scanNotFound'));
    } catch {
      setMessage(props.t('client.nutrition.scanError'));
    } finally {
      setBusy(false);
    }
  };
  const onLabel = async () => {
    if (!accessToken || !missingCode) return;
    setBusy(true);
    try {
      const asset = await pickMealPhoto('camera');
      if (!asset || asset === 'denied') return;
      const food = await uploadLabelPhoto(accessToken, asset, missingCode);
      if (food) return finish(food);
      setMessage(props.t('client.nutrition.labelUnreadable'));
    } catch {
      setMessage(props.t('client.nutrition.scanError'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <BarcodeScannerModal
      busy={busy}
      message={message || props.t('client.nutrition.scanHint')}
      onClose={() => {
        setMessage('');
        setMissingCode(null);
        props.onClose();
      }}
      onCode={(code) => void onCode(code)}
      onLabel={missingCode ? () => void onLabel() : undefined}
      t={props.t}
      visible={props.visible}
    />
  );
}

function EstimateCard(props: {
  draft: EstimateDraft;
  onChange: (value: EstimateDraft) => void;
  t: Translate;
}): React.JSX.Element {
  const fields = [
    ['kcal', 'client.nutrition.estimateKcal'],
    ['proteinG', 'client.nutrition.estimateProtein'],
    ['carbsG', 'client.nutrition.estimateCarbs'],
    ['fatG', 'client.nutrition.estimateFat'],
  ] as const;
  return (
    <View style={styles.sheet}>
      <Text style={styles.dayLabel}>{props.t('client.nutrition.estimateTitle')}</Text>
      {props.draft.dishes.length > 0 ? <Text style={styles.item}>{props.draft.dishes.join(', ')}</Text> : null}
      <Text style={styles.item}>{props.t('client.nutrition.estimateHint')}</Text>
      {fields.map(([key, label]) => (
        <View key={key} style={styles.dayRow}>
          <Text style={styles.item}>{props.t(label)}</Text>
          <TextInput
            accessibilityLabel={props.t(label)}
            keyboardType={NUMBER_KEYBOARD}
            onChangeText={(value) => props.onChange({ ...props.draft, [key]: value })}
            style={styles.amount}
            value={props.draft[key]}
          />
        </View>
      ))}
    </View>
  );
}

export function toDraft(value: AiMealEstimate | null | undefined): EstimateDraft | null {
  if (!value) return null;
  return {
    carbsG: String(value.carbsG),
    confidence: value.confidence,
    dishes: value.dishes,
    fatG: String(value.fatG),
    kcal: String(value.kcal),
    proteinG: String(value.proteinG),
  };
}

export function fromDraft(draft: EstimateDraft | null): AiMealEstimate | null {
  if (!draft) return null;
  const read = (value: string) => {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
  };
  return {
    carbsG: read(draft.carbsG),
    confidence: draft.confidence,
    dishes: draft.dishes,
    fatG: read(draft.fatG),
    kcal: read(draft.kcal),
    proteinG: read(draft.proteinG),
  };
}

export function SavedMealNote(props: { log: NutritionMealLog; t: Translate }): React.JSX.Element {
  const estimate = props.log.aiEstimate;
  return (
    <View style={styles.sheet}>
      {props.log.comment ? <Text style={styles.item}>{props.log.comment}</Text> : null}
      {props.log.eatenItems.map((item) => (
        <Text key={item.foodId} style={styles.item}>
          {eatenLine(item, props.t)}
        </Text>
      ))}
      {estimate ? (
        <Text style={styles.item}>
          {props.t('client.nutrition.estimateSaved', {
            carbs: estimate.carbsG,
            fat: estimate.fatG,
            kcal: estimate.kcal,
            protein: estimate.proteinG,
          })}
        </Text>
      ) : null}
      {props.log.photoUrl ? <Image source={{ uri: props.log.photoUrl }} style={styles.photo} /> : null}
    </View>
  );
}

function updateAmount(items: DraftItem[], foodId: string, amount: string): DraftItem[] {
  return items.map((row) => (row.foodId === foodId ? { ...row, amount } : row));
}

function eatenLine(item: EatenItem, t: Translate): string {
  return `${item.name} · ${formatFoodAmount(item.amount, item.servingUnit, t)} · ${Math.round(item.caloriesKcal)} kcal`;
}
