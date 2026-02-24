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
    accent: '#1c74e9',
};

const SPORTS = [
    { name: 'Fútbol', icon: '⚽', description: 'Deporte de equipo con alto componente aeróbico, velocidad y habilidad técnica.' },
    { name: 'Baloncesto', icon: '🏀', description: 'Deporte de salto explosivo, cambios de dirección y resistencia láctica.' },
    { name: 'Tenis', icon: '🎾', description: 'Alta demanda en potencia de brazo, velocidad de reacción y resistencia aeróbica-anaeróbica.' },
    { name: 'Natación', icon: '🏊', description: 'Deporte cíclico de muy baja carga articular y alta demanda respiratoria.' },
    { name: 'Ciclismo', icon: '🚴', description: 'Deporte de resistencia cíclica con énfasis en potencia de pierna y VO₂ max.' },
    { name: 'Running', icon: '🏃', description: 'Carrera continua o de intervalos para mejorar capacidad aeróbica y eficiencia géstica.' },
    { name: 'Padel', icon: '🏓', description: 'Deporte de raqueta con cambios de dirección cortos, potencia y reflejos.' },
    { name: 'Voleibol', icon: '🏐', description: 'Deporte de salto explosivo, potencia de brazo y coordinación de equipo.' },
    { name: 'Boxeo', icon: '🥊', description: 'Deporte de combate con alta demanda en potencia, velocidad y resistencia láctica.' },
    { name: 'Gimnasia', icon: '🤸', description: 'Deporte de fuerza relativa, flexibilidad, coordinación y control corporal.' },
    { name: 'Rugby', icon: '🏉', description: 'Deporte de contacto con alta demanda de potencia, velocidad y resistencia.' },
    { name: 'Triatlón', icon: '🏅', description: 'Combinación de natación, ciclismo y carrera. Alta demanda de resistencia global.' },
];

export function LibrarySportsScreen(): React.JSX.Element {
    const { t } = useTranslation();
    return (
        <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.hero}>
                <Text style={styles.title}>{t('coach.library.sports.title', 'Biblioteca de deportes')}</Text>
                <Text style={styles.subtitle}>{t('coach.library.sports.subtitle', 'Catálogo de deportes y disciplinas para estructurar el entrenamiento específico.')}</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.placeholderImageBox}>
                    <Text style={styles.placeholderIcon}>🏆</Text>
                    <Text style={styles.placeholderLabel}>Deportes y Disciplinas</Text>
                    <Text style={styles.placeholderHint}>Catálogo en construcción</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>🏅 Deportes del catálogo</Text>
                <View style={styles.grid}>
                    {SPORTS.map((sport, i) => (
                        <View key={i} style={styles.sportCard}>
                            <Text style={styles.sportIcon}>{sport.icon}</Text>
                            <View style={styles.sportInfo}>
                                <Text style={styles.sportName}>{sport.name}</Text>
                                <Text style={styles.sportDesc}>{sport.description}</Text>
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
    grid: {
        gap: 10,
    },
    sportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        gap: 16,
    },
    sportIcon: {
        fontSize: 36,
    },
    sportInfo: {
        flex: 1,
        gap: 4,
    },
    sportName: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '800',
    },
    sportDesc: {
        color: COLORS.textMuted,
        fontSize: 13,
        lineHeight: 18,
    },
});
