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
    tag: '#eef4ff',
    tagText: '#214c9f',
    tagBorder: '#d6e4ff',
    accent: '#1c74e9',
};

const EXERCISES = [
    { name: 'Saltos en el sitio', notes: 'Mejora la activación neuromuscular y la potencia de tobillo.' },
    { name: 'Saltos a la comba', notes: 'Coordinación, ritmo y salto reactivo.' },
    { name: 'Caída desde cajón', notes: 'Trabaja la absorción de impacto y la rigidez del tendón.' },
    { name: 'Caída desde cajón + salto horizontal', notes: 'Acoplamiento excéntrico-concéntrico máximo.' },
    { name: 'Saltos a una pierna', notes: 'Potencia unilateral y estabilidad.' },
    { name: 'Saltos a una pierna + desplazamiento', notes: 'Aplicación horizontal de la potencia.' },
    { name: 'Saltos alternos al cajón', notes: 'Coordinación alternada y cadencia de salto.' },
    { name: 'Saltos horizontales cortos', notes: 'Stiffness reactivo y aceleración horizontal.' },
    { name: 'Saltos verticales cortos', notes: 'Altura de salto y frecuencia de rebote.' },
    { name: 'Salto horizontal máximo', notes: 'Potencia explosiva y aplicación de fuerza horizontal.' },
    { name: 'Salto vertical Max', notes: 'Máxima expresión de potencia vertical.' },
    { name: 'Salto vertical con ayuda de banda elástica', notes: 'Overload asistido para mejorar la fase concéntrica.' },
    { name: 'Desplazamientos laterales', notes: 'Potencia en el plano frontal y cambio de dirección.' },
    { name: 'Salto al cajón', notes: 'Explosividad y confianza.' },
    { name: 'Drop jump', notes: 'Máximo estímulo de stiffness tendinoso.' },
    { name: 'Drop jump al cajón', notes: 'Variante de drop jump con objetivo elevado.' },
];

export function LibraryPlioScreen(): React.JSX.Element {
    const { t } = useTranslation();
    return (
        <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.hero}>
                <Text style={styles.title}>{t('coach.library.plyometrics.title', 'Biblioteca de ejercicios pliométricos')}</Text>
                <Text style={styles.subtitle}>{t('coach.library.plyometrics.subtitle', 'Catálogo de ejercicios explosivos y de salto para desarrollar potencia muscular.')}</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.placeholderImageBox}>
                    <Text style={styles.placeholderIcon}>🪂</Text>
                    <Text style={styles.placeholderLabel}>Ejercicios Pliométricos</Text>
                    <Text style={styles.placeholderHint}>Catálogo en construcción</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>⚡ Ejercicios del catálogo</Text>
                <View style={styles.list}>
                    {EXERCISES.map((ex, i) => (
                        <View key={i} style={styles.row}>
                            <View style={styles.rowContent}>
                                <Text style={styles.rowName}>{ex.name}</Text>
                                <Text style={styles.rowNotes}>{ex.notes}</Text>
                            </View>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>Pliométrico</Text>
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
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderColor: COLORS.border,
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
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
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
