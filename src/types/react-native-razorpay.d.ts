declare module 'react-native-razorpay' {
    export interface RazorpayOptions {
        description: string;
        image: string;
        currency: string;
        key: string;
        amount: number | string;
        name: string;
        order_id: string;
        prefill?: {
            email?: string;
            contact?: string;
            name?: string;
        };
        theme?: {
            color?: string;
        };
    }

    export interface RazorpaySuccessResponse {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    }

    export interface RazorpayErrorResponse {
        code: number;
        description: string;
        source: string;
        step: string;
        reason: string;
        metadata: any;
    }

    class RazorpayCheckout {
        static open(options: RazorpayOptions): Promise<RazorpaySuccessResponse>;
        static on(event: string, callback: (data: any) => void): void;
        static removeListener(event: string, callback: (data: any) => void): void;
    }

    export default RazorpayCheckout;
}
