import React, { useState } from 'react';
import { Modal, SafeAreaView, Text, View } from 'react-native';
import type {
  CoachNutritionMeal as NutritionMeal,
  CoachStructuredWeek as StructuredWeek,
  CoachStructuredDay as StructuredDay,
  CoachFreePlanItem as FreePlanItem,
} from '@trainerpro/shared';
import { CoachButton, CoachField, CoachSelect, ui } from './CoachUi';
import { CoachLibraryScreen } from './CoachLibraryScreen';
import { useNutritionCopy, type NutritionCopyKey } from './coach-nutrition-copy';
import { nutritionId, readStructuredContent, readFreeContent } from './coach-nutrition-model';
export function moveNutritionItem<T>(items: T[], index: number, offset: number): T[] {
  const next = [...items];
  const target = index + offset;
  if (target < 0 || target >= items.length) return next;
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}
export function StructuredNutritionContent({
  value,
  onChange,
  meals,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  meals: NutritionMeal[];
}) {
  const c = useNutritionCopy();
  const content = readStructuredContent(value);
  const [selected, setSelected] = useState(0);
  const week = content.weeks[selected];
  const update = (next: StructuredWeek) =>
    onChange({ ...content, weeks: content.weeks.map((w, i) => (i === selected ? next : w)) });
  const add = () => {
    const index = content.weeks.length + 1;
    const next = {
      id: nutritionId('week'),
      label: c('week') + ' ' + index,
      days: Array.from({ length: 7 }, (_, i) => ({ id: nutritionId('day'), label: c('day') + ' ' + (i + 1), meals: [] })),
    };
    onChange({ ...content, weeks: [...content.weeks, next] });
    setSelected(index - 1);
  };
  return (
    <View style={ui.field}>
      <CoachSelect
        label={c('weeks')}
        value={String(selected)}
        onChange={(v) => setSelected(Number(v))}
        options={content.weeks.map((w, i) => ({ value: String(i), label: w.label }))}
      />
      <CoachButton label={c('addWeek')} onPress={add} />
      {week ? (
        <>
          <CoachField label={c('week')} value={week.label} onChange={(label) => update({ ...week, label })} />
          <View style={ui.row}>
            <CoachButton
              label={c('up')}
              disabled={selected === 0}
              onPress={() => {
                onChange({ ...content, weeks: moveNutritionItem(content.weeks, selected, -1) });
                setSelected(selected - 1);
              }}
            />
            <CoachButton
              label={c('down')}
              disabled={selected === content.weeks.length - 1}
              onPress={() => {
                onChange({ ...content, weeks: moveNutritionItem(content.weeks, selected, 1) });
                setSelected(selected + 1);
              }}
            />
            <CoachButton
              danger
              label={c('remove')}
              onPress={() => {
                onChange({ ...content, weeks: content.weeks.filter((_, i) => i !== selected) });
                setSelected(0);
              }}
            />
          </View>
          <NutritionWeekEditor key={week.id} week={week} onChange={update} meals={meals} />
        </>
      ) : null}
    </View>
  );
}
function NutritionWeekEditor({
  week,
  onChange,
  meals,
}: {
  week: StructuredWeek;
  onChange: (w: StructuredWeek) => void;
  meals: NutritionMeal[];
}) {
  const c = useNutritionCopy();
  const [selected, setSelected] = useState(0);
  const day = week.days[selected];
  const update = (next: StructuredDay) => onChange({ ...week, days: week.days.map((d, i) => (i === selected ? next : d)) });
  return (
    <View style={ui.card}>
      <CoachSelect
        label={c('day')}
        value={String(selected)}
        onChange={(v) => setSelected(Number(v))}
        options={week.days.map((d, i) => ({ value: String(i), label: d.label }))}
      />
      <CoachButton
        label={c('addDay')}
        onPress={() => {
          onChange({
            ...week,
            days: [...week.days, { id: nutritionId('day'), label: c('day') + ' ' + (week.days.length + 1), meals: [] }],
          });
          setSelected(week.days.length);
        }}
      />
      {day ? (
        <>
          <CoachField label={c('day')} value={day.label} onChange={(label) => update({ ...day, label })} />
          <View style={ui.row}>
            <CoachButton
              label={c('up')}
              disabled={selected === 0}
              onPress={() => {
                onChange({ ...week, days: moveNutritionItem(week.days, selected, -1) });
                setSelected(selected - 1);
              }}
            />
            <CoachButton
              label={c('down')}
              disabled={selected === week.days.length - 1}
              onPress={() => {
                onChange({ ...week, days: moveNutritionItem(week.days, selected, 1) });
                setSelected(selected + 1);
              }}
            />
            <CoachButton
              danger
              label={c('remove')}
              onPress={() => {
                onChange({ ...week, days: week.days.filter((_, i) => i !== selected) });
                setSelected(0);
              }}
            />
          </View>
          <NutritionDayEditor key={day.id} day={day} onChange={update} meals={meals} />
        </>
      ) : null}
    </View>
  );
}
function NutritionDayEditor({
  day,
  onChange,
  meals,
}: {
  day: StructuredDay;
  onChange: (d: StructuredDay) => void;
  meals: NutritionMeal[];
}) {
  const c = useNutritionCopy();
  const [chosen, setChosen] = useState('');
  const update = (index: number, next: Partial<StructuredDay['meals'][number]>) =>
    onChange({ ...day, meals: day.meals.map((meal, i) => (i === index ? { ...meal, ...next } : meal)) });
  return (
    <View style={ui.field}>
      {day.meals.map((meal, index) => (
        <View key={meal.id} style={ui.card}>
          <CoachField label={c('name')} value={meal.name} onChange={(name) => update(index, { name })} />
          <CoachField label={c('time')} value={meal.time ?? ''} onChange={(time) => update(index, { time })} />
          <View style={ui.row}>
            <CoachButton
              label={c('up')}
              disabled={index === 0}
              onPress={() => onChange({ ...day, meals: moveNutritionItem(day.meals, index, -1) })}
            />
            <CoachButton
              label={c('down')}
              disabled={index === day.meals.length - 1}
              onPress={() => onChange({ ...day, meals: moveNutritionItem(day.meals, index, 1) })}
            />
            <CoachButton
              danger
              label={c('remove')}
              onPress={() => onChange({ ...day, meals: day.meals.filter((_, i) => i !== index) })}
            />
          </View>
        </View>
      ))}
      <CoachSelect
        label={c('chooseMeal')}
        value={chosen}
        onChange={setChosen}
        options={[{ value: '', label: c('none') }, ...meals.map((meal) => ({ value: meal.id, label: meal.name }))]}
      />
      <CoachButton
        label={c('addMeal')}
        disabled={!chosen}
        onPress={() => {
          const meal = meals.find((m) => m.id === chosen);
          if (meal)
            onChange({ ...day, meals: [...day.meals, { id: nutritionId('meal'), mealId: meal.id, name: meal.name }] });
        }}
      />
    </View>
  );
}
export function FreeNutritionContent({
  value,
  onChange,
  meals,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  meals: NutritionMeal[];
}) {
  const c = useNutritionCopy();
  const content = readFreeContent(value);
  const [column, setColumn] = useState(Object.keys(content.columns)[0] ?? 'breakfast');
  const [chosen, setChosen] = useState('');
  const [picking, setPicking] = useState(false);
  const items = content.columns[column] ?? [];
  const update = (next: FreePlanItem[]) => onChange({ ...content, columns: { ...content.columns, [column]: next } });

  return (
    <View style={ui.field}>
      <Modal visible={picking} onRequestClose={() => setPicking(false)}>
        <SafeAreaView style={ui.page}>
          <CoachButton label={c('back')} onPress={() => setPicking(false)} />
          <CoachLibraryScreen
            initialCategory={'foods'}
            onPick={(food) => {
              update([
                ...items,
                { id: nutritionId('food'), type: 'food', foodId: food.id, foodName: food.name, amountGrams: 100 },
              ]);
              setPicking(false);
            }}
          />
        </SafeAreaView>
      </Modal>
      <CoachSelect
        label={c('category')}
        value={column}
        onChange={setColumn}
        options={Object.keys(content.columns).map((key) => ({
          value: key,
          label: ['breakfast', 'lunch', 'dinner', 'snack', 'other'].includes(key) ? c(key as NutritionCopyKey) : key,
        }))}
      />
      {items.map((item, index) => (
        <View key={item.id} style={ui.card}>
          <Text style={ui.label}>{item.foodName ?? item.mealName}</Text>
          {item.type === 'food' ? (
            <CoachField
              numeric
              label={c('quantity')}
              value={String(item.amountGrams ?? 100)}
              onChange={(v) => update(items.map((old, i) => (i === index ? { ...old, amountGrams: Number(v) } : old)))}
            />
          ) : null}
          <View style={ui.row}>
            <CoachButton
              label={c('up')}
              disabled={index === 0}
              onPress={() => update(moveNutritionItem(items, index, -1))}
            />
            <CoachButton
              label={c('down')}
              disabled={index === items.length - 1}
              onPress={() => update(moveNutritionItem(items, index, 1))}
            />
            <CoachButton danger label={c('remove')} onPress={() => update(items.filter((_, i) => i !== index))} />
          </View>
        </View>
      ))}
      <CoachButton label={c('addFood')} onPress={() => setPicking(true)} />
      <CoachSelect
        label={c('chooseMeal')}
        value={chosen}
        onChange={setChosen}
        options={[{ value: '', label: c('none') }, ...meals.map((meal) => ({ value: meal.id, label: meal.name }))]}
      />
      <CoachButton
        label={c('addMeal')}
        disabled={!chosen}
        onPress={() => {
          const meal = meals.find((m) => m.id === chosen);
          if (meal) update([...items, { id: nutritionId('meal'), type: 'meal', mealId: meal.id, mealName: meal.name }]);
        }}
      />
    </View>
  );
}
