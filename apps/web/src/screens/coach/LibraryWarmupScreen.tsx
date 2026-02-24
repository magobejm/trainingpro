/* eslint-disable max-lines, max-lines-per-function, no-restricted-syntax, max-len */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import '../../i18n';

const COLORS = {
    bg: '#eef3fb',
    card: '#ffffff',
    border: '#dfe8f5',
    text: '#111418',
    textMuted: '#6a7381',
    tag: '#eefcf6',
    tagText: '#065f46',
    tagBorder: '#a7f3d0',
};

const EXERCISES = [
    { name: 'Trote suave', notes: 'Activación cardiovascular progresiva y aumento de temperatura muscular.' },
    { name: 'Skiping', notes: 'Elevación de rodillas con ritmo. Activa caderas, glúteos y gemelos.' },
    { name: 'Skiping una pierna', notes: 'Variante unilateral del skiping para mayor activación de estabilizadores.' },
    { name: 'Rotaciones de cadera', notes: 'Movilidad articular de cadera en los tres planos de movimiento.' },
    { name: 'Círculos de brazos', notes: 'Movilización del hombro y apertura torácica.' },
    { name: 'High knees', notes: 'Elevación de rodillas con sprint. Activa core y flexores de cadera.' },
    { name: 'Leg swings (Frontales)', notes: 'Péndulo frontal de pierna. Movilidad de isquios y flexores de cadera.' },
    { name: 'Leg swings (Laterales)', notes: 'Péndulo lateral. Movilidad de abductores y aductores.' },
    { name: 'World\'s greatest stretch', notes: 'Estiramiento dinámico que trabaja cadera, columna y pecho simultáneamente.' },
    { name: 'Inchworm', notes: 'Caminar con manos desde posición de pie. Activa core, isquios y hombros.' },
    { name: 'Sentadilla aérea (control)', notes: 'Activación del patrón de sentadilla a baja velocidad.' },
    { name: 'Glute bridge', notes: 'Activación de glúteo y estabilización lumbo-pélvica.' },
    { name: 'Clamshell', notes: 'Activación de glúteo medio con resistencia de abducción.' },
    { name: 'Foam roller (columna / cadera)', notes: 'Liberación miofascial previa al trabajo principal.' },
    { name: 'Jump rope (suave)', notes: 'Calentamiento global con impacto bajo para la fase final del warm-up.' },
];

export function LibraryWarmupScreen(): React.JSX.Element {
    const { t } = useTranslation();
    return (
        <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.hero}>
                <Text style={styles.title}>{t('coach.library.warmup.title', 'Biblioteca de calentamiento')}</Text>
                <Text style={styles.subtitle}>{t('coach.library.warmup.subtitle', 'Ejercicios de activación y movilidad para preparar el cuerpo antes del entrenamiento.')}</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.placeholderImageBox}>
                    <Text style={styles.placeholderIcon}>🤸</Text>
                    <Text style={styles.placeholderLabel}>Calentamiento Dinámico</Text>
                    <Text style={styles.placeholderHint}>Catálogo en construcción</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>🔥 Ejercicios del catálogo</Text>
                <View style={styles.list}>
                    {EXERCISES.map((ex, i) => (
                        <View key={i} style={styles.row}>
                            <View style={styles.rowContent}>
                                <Text style={styles.rowName}>{ex.name}</Text>
                                <Text style={styles.rowNotes}>{ex.notes}</Text>
                            </View>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>Calentamiento</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    page: {
        alignItems: 'center',
        backgroundColor: COLORS.bg,
        gap: 12,
        minHeight: '100%',
        padding: 24,
    },
    hero: {
        backgroundColor: COLORS.card,
        borderColor: COLORS.border,
        borderRadius: 16,
        borderWidth: 1,
        gap: 6,
        padding: 16,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
        width: '100%',
    },
    title: {
        color: COLORS.text,
        fontSize: 25,
        fontWeight: '800',
    },
    subtitle: {
        color: COLORS.textMuted,
        fontSize: 13,
    },
    card: {
        backgroundColor: COLORS.card,
        borderColor: COLORS.border,
        borderRadius: 14,
        borderWidth: 1,
        padding: 16,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 14,
        width: '100%',
    },
    placeholderImageBox: {
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        borderColor: '#a7f3d0',
        borderWidth: 1,
        borderStyle: 'dashed',
        gap: 6,
        padding: 40,
    },
    placeholderIcon: {
        fontSize: 64,
    },
    placeholderLabel: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '700',
        marginTop: 8,
    },
    placeholderHint: {
        color: COLORS.textMuted,
        fontSize: 13,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    list: {
        gap: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f0fdf4',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d1fae5',
        padding: 14,
        gap: 12,
    },
    rowContent: {
        flex: 1,
        gap: 2,
    },
    rowName: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '700',
    },
    rowNotes: {
        color: COLORS.textMuted,
        fontSize: 12,
        lineHeight: 18,
    },
    tag: {
        backgroundColor: COLORS.tag,
        borderColor: COLORS.tagBorder,
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    tagText: {
        color: COLORS.tagText,
        fontSize: 11,
        fontWeight: '700',
    },
});
