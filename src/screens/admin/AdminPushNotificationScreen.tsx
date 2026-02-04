
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, HelperText, Switch, Card, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { apiService } from '../../services/api';

export const AdminPushNotificationScreen = ({ navigation }: any) => {
    const [target, setTarget] = useState<'all' | 'user' | 'provider'>('all');
    const [userId, setUserId] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isHighPriority, setIsHighPriority] = useState(true);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('Error', 'Title and Message are required');
            return;
        }

        if (target !== 'all' && !userId.trim()) {
            Alert.alert('Error', 'User/Provider ID is required for targeted notifications');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                title: title.trim(),
                message: message.trim(),
                target: target, // 'all', 'user', or 'provider'
                recipientId: target !== 'all' ? userId.trim() : undefined,
                priority: isHighPriority ? 'high' : 'normal',
                data: {
                    type: 'admin_broadcast',
                    sentAt: new Date().toISOString()
                }
            };

            // Call API Service
            await apiService.sendAdminNotification(payload);

            Alert.alert('Success', 'Notification Sent Successfully!');
            setTitle('');
            setMessage('');
            setUserId('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send notification');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text variant="titleLarge" style={styles.headerTitle}>Admin Push Center</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View>
                            <Card style={styles.card}>
                                <Card.Content>
                                    <Text variant="titleMedium" style={styles.sectionTitle}>Target Audience</Text>

                                    <SegmentedButtons
                                        value={target}
                                        onValueChange={value => setTarget(value as any)}
                                        buttons={[
                                            { value: 'all', label: 'All Users' },
                                            { value: 'user', label: 'Single User' },
                                            { value: 'provider', label: 'Single Provider' },
                                        ]}
                                        style={styles.segments}
                                        density="medium"
                                    />

                                    {target !== 'all' && (
                                        <TextInput
                                            mode="outlined"
                                            label={target === 'user' ? "User ID" : "Provider ID"}
                                            placeholder="e.g. 65bea..."
                                            value={userId}
                                            onChangeText={setUserId}
                                            style={styles.input}
                                            dense
                                        />
                                    )}
                                </Card.Content>
                            </Card>

                            <Card style={styles.card}>
                                <Card.Content>
                                    <Text variant="titleMedium" style={styles.sectionTitle}>Content</Text>

                                    <TextInput
                                        mode="outlined"
                                        label="Notification Title"
                                        placeholder="e.g. New Update Available!"
                                        value={title}
                                        onChangeText={setTitle}
                                        style={styles.input}
                                    />

                                    <TextInput
                                        mode="outlined"
                                        label="Message Body"
                                        placeholder="Enter the main content..."
                                        value={message}
                                        onChangeText={setMessage}
                                        multiline
                                        numberOfLines={4}
                                        style={[styles.input, { minHeight: 100 }]}
                                    />

                                    <View style={styles.row}>
                                        <Text variant="bodyMedium">High Priority</Text>
                                        <Switch value={isHighPriority} onValueChange={setIsHighPriority} color={COLORS.primary} />
                                    </View>
                                    <HelperText type="info">High priority sends with sound and vibration.</HelperText>
                                </Card.Content>
                            </Card>

                            <Button
                                mode="contained"
                                onPress={handleSend}
                                loading={isLoading}
                                disabled={isLoading}
                                style={styles.sendButton}
                                contentStyle={{ height: 50 }}
                            >
                                Send Notification
                            </Button>

                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        marginRight: SPACING.md,
    },
    headerTitle: {
        fontWeight: '700',
        color: COLORS.text,
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: 40,
    },
    card: {
        marginBottom: SPACING.lg,
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.medium,
        ...SHADOWS.sm,
    },
    sectionTitle: {
        marginBottom: SPACING.md,
        fontWeight: '600',
        color: COLORS.text,
    },
    segments: {
        marginBottom: SPACING.md,
    },
    input: {
        marginBottom: SPACING.md,
        backgroundColor: COLORS.white,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
        marginTop: SPACING.sm,
    },
    sendButton: {
        marginTop: SPACING.sm,
        borderRadius: RADIUS.medium,
        backgroundColor: COLORS.primary,
    },
});
