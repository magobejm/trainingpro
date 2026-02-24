/* eslint-disable max-lines, max-lines-per-function, no-restricted-syntax, max-len */
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

import { useAnalyzeTechniqueMutation } from '../../data/hooks/ai/useAnalyzeTechniqueMutation';

const COLORS = {
    action: '#1c74e9',
    bg: '#eef3fb',
    border: '#dfe8f5',
    card: '#ffffff',
    text: '#111418',
    textMuted: '#6a7381',
    white: '#ffffff',
    danger: '#ef4444',
    safe: '#10b981',
    warning: '#f59e0b',
};

export function TechniqueEvaluatorScreen(): React.JSX.Element {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const analyzeMutation = useAnalyzeTechniqueMutation();

    const onDrop = (acceptedFiles: File[]) => {
        const firstFile = acceptedFiles[0];
        if (firstFile) {
            setFile(firstFile);
            setFileUrl(URL.createObjectURL(firstFile));
            analyzeMutation.reset();
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg'],
            'video/*': ['.mp4', '.mov', '.webm']
        },
        maxFiles: 1
    });

    const handleAnalyze = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            await analyzeMutation.mutateAsync({ file });
        } catch (e) {
            console.error("Error analyzing", e);
        }
    };

    if (analyzeMutation.isSuccess && analyzeMutation.data && fileUrl) {
        const fileIsVideo = file ? file.type.startsWith('video/') : false;
        return <ResultsView
            result={analyzeMutation.data}
            onReset={() => {
                setFile(null);
                setFileUrl(null);
                setIsUploading(false);
                analyzeMutation.reset();
            }}
            fileUrl={fileUrl}
            isVideo={fileIsVideo}
            t={t}
        />;
    }

    if (analyzeMutation.isPending || isUploading) {
        return <EntertainingLoader />;
    }

    return (
        <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.container}>
                <View style={styles.hero}>
                    <Text style={styles.title}>{t('app.evaluator.title', 'Evaluador de Técnica Biomecánica')}</Text>
                    <Text style={styles.subtitle}>
                        {t('app.evaluator.subtitle', 'Sube un video corto (máx 30s) o imagen de un ejercicio para que nuestra IA especializada identifique errores posturales y brinde correcciones de seguridad inmediatas.')}
                    </Text>
                </View>

                <View style={styles.formCard}>
                    <div
                        {...getRootProps()}
                        style={Object.assign({}, stylesHtml.dropzone, isDragActive && stylesHtml.dropzoneActive)}
                    >
                        <input {...getInputProps()} />
                        {fileUrl && file ? (
                            file.type.startsWith('video/') ? (
                                <video src={fileUrl} style={stylesHtml.previewMedia} controls muted />
                            ) : (
                                <img src={fileUrl} style={stylesHtml.previewMedia} alt="Preview" />
                            )
                        ) : (
                            <View style={styles.dropZoneContent}>
                                <Text style={styles.dropZoneIcon}>{"\u2601\uFE0F"}</Text>
                                <Text style={styles.dropZoneTitle}>{t('app.evaluator.dropHere', 'Arrastra y suelta tu archivo aquí')}</Text>
                                <Text style={styles.dropZoneHint}>{t('app.evaluator.dropHint', 'o haz clic para seleccionar (MP4, MOV, JPG, PNG)')}</Text>
                            </View>
                        )}
                    </div>

                    <View style={styles.actionsBox}>
                        <Pressable
                            style={[styles.analyzeButton, !file && styles.analyzeButtonDisabled]}
                            onPress={() => void handleAnalyze()}
                            disabled={!file}
                        >
                            <Text style={styles.analyzeLabel}>{t('app.evaluator.analyzeAction', 'Analizar Técnica con Gemini IA \u2728')}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const MESSAGES = [
    "Analizando cinemática del movimiento...",
    "Evaluando alineación de articulaciones...",
    "Consultando modelos biomecánicos predictivos...",
    "Verificando curvatura espinal y estrés lumbar...",
    "Calculando Score de Seguridad...",
    "Preparando correcciones inmediatas..."
];

function EntertainingLoader() {
    const { t } = useTranslation();
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % MESSAGES.length);
        }, 2800);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.action} />
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.5 }}
                    style={stylesHtml.motionWrapper}
                >
                    <Text style={styles.loaderText}>{MESSAGES[index]}</Text>
                </motion.div>
            </AnimatePresence>
            <Text style={styles.loaderSubtext}>{t('app.evaluator.waitSubtext', 'Este proceso puede demorar hasta 30 segundos.')}</Text>
        </View>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ResultsView({ result, onReset, fileUrl, isVideo, t }:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { result: any, onReset: () => void, fileUrl: string, isVideo: boolean, t: any }
) {
    const isDanger = result.score_seguridad < 50;

    return (
        <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.container}>
                <View style={styles.hero}>
                    <View style={styles.resultHeaderRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>
                                {result.ejercicio}
                            </Text>
                            <Text style={styles.subtitle}>{result.fase_movimiento}</Text>
                        </View>
                        <Pressable onPress={onReset} style={styles.resetButton}>
                            <Text style={styles.resetLabel}>{t('app.evaluator.resetAction', 'Evaluar otro')}</Text>
                        </Pressable>
                    </View>
                    <View style={[
                        styles.scoreBadge,
                        isDanger ? styles.scoreBadgeDanger : styles.scoreBadgeSafe
                    ]}>
                        <Text style={[
                            styles.scoreBadgeText,
                            isDanger ? styles.scoreBadgeTextDanger : styles.scoreBadgeTextSafe
                        ]}>
                            {t('app.evaluator.scoreLabel', 'Score de Seguridad:')} {result.score_seguridad}/100
                        </Text>
                    </View>
                </View>

                <View style={[styles.resultCard, isDanger && styles.resultCardDanger]}>
                    <View style={styles.mediaRow}>
                        {isVideo ? (
                            <video src={fileUrl} style={stylesHtml.resultMedia} controls muted />
                        ) : (
                            <img src={fileUrl} style={stylesHtml.resultMedia} alt="Preview" />
                        )}
                        <View style={styles.correctionBanner}>
                            <Text style={styles.correctionTitle}>{t('app.evaluator.correctionTitle', '\uD83D\uDCA1 Corrección Inmediata')}</Text>
                            <Text style={styles.correctionText}>{result.correccion_inmediata}</Text>
                        </View>
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailList}>
                            <Text style={styles.detailTitle}>{t('app.evaluator.errorsTitle', '\u26A0\uFE0F Errores Detectados')}</Text>
                            {result.errores_detectados.map((e: string, i: number) => (
                                <Text key={i} style={styles.detailItem}>• {e}</Text>
                            ))}
                        </View>
                        <View style={styles.detailList}>
                            <Text style={styles.detailTitle}>{t('app.evaluator.pointsTitle', '\uD83D\uDD0D Puntos Clave')}</Text>
                            <View style={styles.pointRow}>
                                <Text style={styles.pointLabel}>{t('app.evaluator.backLabel', 'Espalda:')} </Text>
                                <Text style={styles.pointValue}>{result.analisis_puntos_clave.espalda}</Text>
                            </View>
                            <View style={styles.pointRow}>
                                <Text style={styles.pointLabel}>{t('app.evaluator.rangeLabel', 'Rango:')} </Text>
                                <Text style={styles.pointValue}>{result.analisis_puntos_clave.rango_movimiento}</Text>
                            </View>
                            <View style={styles.pointRow}>
                                <Text style={styles.pointLabel}>{t('app.evaluator.jointsLabel', 'Articulaciones:')} </Text>
                                <Text style={styles.pointValue}>{result.analisis_puntos_clave.alineacion_articulaciones}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const stylesHtml = {
    dropzone: {
        border: `2px dashed ${COLORS.border}`,
        borderRadius: '16px',
        backgroundColor: '#f8fafc',
        padding: '40px',
        textAlign: 'center' as const,
        cursor: 'pointer',
        transition: 'all .2s ease-in-out',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '260px'
    },
    dropzoneActive: {
        borderColor: COLORS.action,
        backgroundColor: '#f0f7ff'
    },
    previewMedia: {
        maxHeight: '240px',
        maxWidth: '100%',
        borderRadius: '8px',
        objectFit: 'contain' as const
    },
    resultMedia: {
        width: '300px',
        height: '240px',
        borderRadius: '12px',
        objectFit: 'cover' as const,
        backgroundColor: '#000'
    },
    motionWrapper: {
        marginTop: 20,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
};

const styles = StyleSheet.create({
    page: {
        alignItems: 'center',
        backgroundColor: COLORS.bg,
        flexGrow: 1,
        padding: 22,
    },
    container: {
        gap: 12,
        maxWidth: 980,
        width: '100%',
    },
    hero: {
        backgroundColor: COLORS.card,
        borderColor: COLORS.border,
        borderRadius: 16,
        borderWidth: 1,
        gap: 8,
        padding: 16,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
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
    formCard: {
        backgroundColor: COLORS.card,
        borderColor: COLORS.border,
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        width: '100%',
    },
    dropZoneContent: {
        alignItems: 'center',
        gap: 8
    },
    dropZoneIcon: {
        fontSize: 48,
        marginBottom: 8
    },
    dropZoneTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '600'
    },
    dropZoneHint: {
        color: COLORS.textMuted,
        fontSize: 14
    },
    actionsBox: {
        alignItems: 'center',
        marginTop: 20
    },
    analyzeButton: {
        backgroundColor: COLORS.action,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: COLORS.action,
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }
    },
    analyzeButtonDisabled: {
        backgroundColor: '#cbd5e1',
        shadowOpacity: 0
    },
    analyzeLabel: {
        color: COLORS.white,
        fontWeight: '800',
        fontSize: 16
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.bg
    },
    loaderText: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center'
    },
    loaderSubtext: {
        color: COLORS.textMuted,
        fontSize: 13,
        marginTop: 16
    },
    resultHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    scoreBadge: {
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignSelf: 'flex-start',
        marginTop: 4
    },
    scoreBadgeSafe: {
        backgroundColor: '#eefcf6',
        borderColor: '#a7f3d0'
    },
    scoreBadgeDanger: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca'
    },
    scoreBadgeText: {
        fontSize: 12,
        fontWeight: '700'
    },
    scoreBadgeTextSafe: {
        color: '#065f46'
    },
    scoreBadgeTextDanger: {
        color: '#991b1b'
    },
    resultCard: {
        backgroundColor: COLORS.card,
        borderRadius: 14,
        padding: 24,
        borderColor: COLORS.border,
        borderWidth: 1,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        gap: 20
    },
    resultCardDanger: {
        borderColor: '#fecaca',
        backgroundColor: '#fffdfd'
    },
    resetButton: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    resetLabel: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 13
    },
    mediaRow: {
        flexDirection: 'row',
        gap: 20,
        flexWrap: 'wrap'
    },
    correctionBanner: {
        flex: 1,
        minWidth: 300,
        backgroundColor: '#fffbeb',
        borderLeftWidth: 4,
        borderLeftColor: COLORS.warning,
        padding: 20,
        borderRadius: 12,
        justifyContent: 'center'
    },
    correctionTitle: {
        color: '#b45309',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 8
    },
    correctionText: {
        color: '#78350f',
        fontSize: 18,
        fontWeight: '500',
        lineHeight: 26
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
        marginTop: 10,
        backgroundColor: '#f8fafc',
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    detailList: {
        flex: 1,
        minWidth: 250,
        gap: 12
    },
    detailTitle: {
        color: COLORS.textMuted,
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    detailItem: {
        color: COLORS.text,
        fontSize: 14,
        lineHeight: 22
    },
    pointRow: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    pointLabel: {
        fontWeight: '700',
        color: COLORS.text,
        fontSize: 14
    },
    pointValue: {
        color: COLORS.text,
        fontSize: 14,
        flex: 1
    }
});
